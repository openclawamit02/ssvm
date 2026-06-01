import { StudentService, TeacherService, AttendanceService, ClassService } from './db';
import { collection, doc, getDocs, setDoc, query, where, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const DirectoryApiService = {
    getStudents: async (search = '', page = 0, size = 10, studentClass = '') => {
        try {
            const allStudents = await StudentService.getAll();
            
            // Filter
            let filtered = allStudents;
            if (studentClass) {
                filtered = filtered.filter(s => 
                    (s.studentClass === studentClass || s.class === studentClass)
                );
            }
            if (search) {
                const q = search.toLowerCase();
                filtered = filtered.filter(s => 
                    (s.name && s.name.toLowerCase().includes(q)) ||
                    (s.fatherName && s.fatherName.toLowerCase().includes(q)) ||
                    (s.rollNumber && s.rollNumber.toLowerCase().includes(q))
                );
            }

            // Sort
            filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            // Page
            const startIndex = page * size;
            const content = filtered.slice(startIndex, startIndex + size);

            return {
                content,
                totalElements: filtered.length,
                totalPages: Math.ceil(filtered.length / size),
                size,
                number: page
            };
        } catch (e) {
            console.error('Error fetching students from Firestore:', e);
            throw e;
        }
    },

    getTeachers: async (search = '', page = 0, size = 10) => {
        try {
            const allTeachers = await TeacherService.getAll();
            
            // Filter
            let filtered = allTeachers;
            if (search) {
                const q = search.toLowerCase();
                filtered = filtered.filter(t => 
                    (t.name && t.name.toLowerCase().includes(q)) ||
                    (t.subjects && t.subjects.toLowerCase().includes(q)) ||
                    (t.qualification && t.qualification.toLowerCase().includes(q))
                );
            }

            // Sort
            filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            // Page
            const startIndex = page * size;
            const content = filtered.slice(startIndex, startIndex + size);

            return {
                content,
                totalElements: filtered.length,
                totalPages: Math.ceil(filtered.length / size),
                size,
                number: page
            };
        } catch (e) {
            console.error('Error fetching teachers from Firestore:', e);
            throw e;
        }
    },

    getSummary: async () => {
        try {
            const [students, teachers] = await Promise.all([
                StudentService.getAll(),
                TeacherService.getAll()
            ]);

            // Calculate gender distribution
            const genderDistribution = { M: 0, F: 0 };
            const statusCounts = { Active: 0, Inactive: 0 };

            students.forEach(s => {
                const g = s.gender === 'Female' ? 'F' : 'M';
                genderDistribution[g] = (genderDistribution[g] || 0) + 1;
                
                const status = s.status || 'Active';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            });

            return {
                totalStudents: students.length,
                totalTeachers: teachers.length,
                genderDistribution,
                statusCounts
            };
        } catch (e) {
            console.error('Error fetching summary:', e);
            return {
                totalStudents: 0,
                totalTeachers: 0,
                genderDistribution: { M: 0, F: 0 },
                statusCounts: { Active: 0 }
            };
        }
    },

    addStudent: async (student) => {
        return StudentService.add(student);
    },

    updateStudent: async (id, student) => {
        return StudentService.update(id, student);
    },

    deleteStudent: async (id) => {
        return StudentService.delete(id);
    },

    addTeacher: async (teacher) => {
        return TeacherService.add(teacher);
    },

    updateTeacher: async (id, teacher) => {
        return TeacherService.update(id, teacher);
    },

    deleteTeacher: async (id) => {
        return TeacherService.delete(id);
    }
};

export const AttendanceApiService = {
    recordAttendance: async (records) => {
        try {
            // Records is an array of: { date, personId, personType, status }
            // Let's group by date and class/type to match our db.js structure or write individually
            const timestamp = new Date().toISOString();
            
            for (const rec of records) {
                // Save daily record
                const id = `${rec.personId}_${rec.date}`;
                await setDoc(doc(db, 'attendance_records', id), {
                    ...rec,
                    updatedAt: timestamp
                });
            }
            return { status: 'success' };
        } catch (e) {
            console.error('Error recording attendance in Firestore:', e);
            throw e;
        }
    },

    getDailyAttendance: async (date, type) => {
        try {
            const q = query(
                collection(db, 'attendance_records'),
                where('date', '==', date),
                where('personType', '==', type)
            );
            const qSnap = await getDocs(q);
            return qSnap.docs.map(doc => doc.data());
        } catch (e) {
            console.error('Error fetching daily attendance:', e);
            return [];
        }
    },

    getStats: async (type) => {
        try {
            // Fetch all records for the type to calculate stats
            const q = query(
                collection(db, 'attendance_records'),
                where('personType', '==', type)
            );
            const qSnap = await getDocs(q);
            const allRecords = qSnap.docs.map(d => d.data());

            // Group by personId
            const personAttendance = {};
            allRecords.forEach(r => {
                if (!personAttendance[r.personId]) {
                    personAttendance[r.personId] = { present: 0, total: 0 };
                }
                personAttendance[r.personId].total++;
                if (r.status === 'PRESENT' || r.status === 'Present') {
                    personAttendance[r.personId].present++;
                }
            });

            let highest = 100;
            let lowest = 100;
            let belowThresholdCount = 0;
            const percentages = [];

            Object.entries(personAttendance).forEach(([id, data]) => {
                const pct = data.total > 0 ? (data.present / data.total) * 100 : 0;
                percentages.push(pct);
                if (pct < 75) belowThresholdCount++;
            });

            if (percentages.length > 0) {
                highest = Math.max(...percentages);
                lowest = Math.min(...percentages);
            } else {
                highest = 100;
                lowest = 100;
            }

            return {
                highest,
                lowest,
                belowThresholdCount,
                totalCount: Object.keys(personAttendance).length
            };
        } catch (e) {
            console.error('Error computing attendance stats:', e);
            return { highest: 100, lowest: 100, belowThresholdCount: 0, totalCount: 0 };
        }
    }
};
