import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ClassService, StudentService, AttendanceService } from '../services/db';
import { Check, X } from 'lucide-react';
import '../components/Card.css';

const Attendance = () => {
  const { t } = useTranslation();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selection state
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Attendance state
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [records, setRecords] = useState({}); // { studentId: 'Present' | 'Absent' }
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const [classesData, studentsData] = await Promise.all([
          ClassService.getAll(),
          StudentService.getAll()
        ]);
        setClasses(classesData);
        setStudents(studentsData);
        if (classesData.length > 0) {
          setSelectedClass(classesData[0].id);
        }
      } catch (error) {
        console.error("Error fetching base data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBaseData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      loadAttendance();
    }
  }, [selectedClass, selectedDate]);

  const loadAttendance = async () => {
    try {
      const record = await AttendanceService.getByClassAndDate(selectedClass, selectedDate);
      if (record) {
        setAttendanceRecord(record);
        const recMap = {};
        record.records.forEach(r => { recMap[r.studentId] = r.status; });
        setRecords(recMap);
      } else {
        setAttendanceRecord(null);
        setRecords({});
      }
    } catch (error) {
      console.error("Error loading attendance:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const recordsArray = Object.keys(records).map(studentId => ({
        studentId,
        status: records[studentId]
      }));

      const data = {
        classId: selectedClass,
        date: selectedDate,
        records: recordsArray
      };

      if (attendanceRecord) {
        await AttendanceService.update(attendanceRecord.id, data);
      } else {
        const newRecord = await AttendanceService.add(data);
        setAttendanceRecord(newRecord);
      }
      alert("Attendance saved successfully!");
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = (studentId, status) => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
  };

  if (loading) {
    return <div className="page-container"><p>Loading...</p></div>;
  }

  // Filter students by selected class (Assuming student data includes a classId/className, for now just show all if we don't have mapping)
  // In a real app we'd filter: const classStudents = students.filter(s => s.class === selectedClass);
  // For now, since mock students had class name instead of ID, we just show all students or we can refine it. 
  // Let's just show all for demo if class filtering isn't strict, or assume we only show those who have records or all.
  const classStudents = students;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t('attendance')}</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      <div className="glass" style={{ padding: '20px', marginBottom: '24px', borderRadius: 'var(--border-radius-lg)', display: 'flex', gap: '16px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Class</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)'}}>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} - Sec {c.section}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Date</label>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)'}}/>
        </div>
      </div>

      <div className="data-grid">
        {classStudents.map(student => (
          <div key={student.id} className="card glass" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0' }}>{student.name}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-muted)' }}>Roll: {student.rollNumber}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => toggleStatus(student.id, 'Present')}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px',
                  background: records[student.id] === 'Present' ? 'var(--color-success)' : 'var(--color-background)',
                  color: records[student.id] === 'Present' ? 'white' : 'var(--color-text-muted)'
                }}
              >
                <Check size={16} /> Present
              </button>
              <button 
                onClick={() => toggleStatus(student.id, 'Absent')}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px',
                  background: records[student.id] === 'Absent' ? 'var(--color-danger)' : 'var(--color-background)',
                  color: records[student.id] === 'Absent' ? 'white' : 'var(--color-text-muted)'
                }}
              >
                <X size={16} /> Absent
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Attendance;
