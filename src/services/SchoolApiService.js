const API_BASE_URL = 'http://localhost:8080/api';

export const DirectoryApiService = {
    getStudents: async (search = '', page = 0, size = 10, studentClass = '') => {
        const query = new URLSearchParams({ search, page, size, studentClass });
        const response = await fetch(`${API_BASE_URL}/directory/students?${query}`);
        if (!response.ok) throw new Error('Failed to fetch students');
        return response.json();
    },

    getTeachers: async (search = '', page = 0, size = 10) => {
        const query = new URLSearchParams({ search, page, size });
        const response = await fetch(`${API_BASE_URL}/directory/teachers?${query}`);
        if (!response.ok) throw new Error('Failed to fetch teachers');
        return response.json();
    },

    getSummary: async () => {
        const response = await fetch(`${API_BASE_URL}/directory/summary`);
        if (!response.ok) throw new Error('Failed to fetch directory summary');
        return response.json();
    },

    addStudent: async (student) => {
        const response = await fetch(`${API_BASE_URL}/directory/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(student)
        });
        if (!response.ok) throw new Error('Failed to add student');
        return response.json();
    },

    updateStudent: async (id, student) => {
        const response = await fetch(`${API_BASE_URL}/directory/students/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(student)
        });
        if (!response.ok) throw new Error('Failed to update student');
        return response.json();
    },

    deleteStudent: async (id) => {
        const response = await fetch(`${API_BASE_URL}/directory/students/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete student');
    },

    addTeacher: async (teacher) => {
        const response = await fetch(`${API_BASE_URL}/directory/teachers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teacher)
        });
        if (!response.ok) throw new Error('Failed to add teacher');
        return response.json();
    },

    updateTeacher: async (id, teacher) => {
        const response = await fetch(`${API_BASE_URL}/directory/teachers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teacher)
        });
        if (!response.ok) throw new Error('Failed to update teacher');
        return response.json();
    },

    deleteTeacher: async (id) => {
        const response = await fetch(`${API_BASE_URL}/directory/teachers/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete teacher');
    }
};

export const AttendanceApiService = {
    recordAttendance: async (records) => {
        const response = await fetch(`${API_BASE_URL}/attendance/record`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(records)
        });
        if (!response.ok) throw new Error('Failed to record attendance');
        return response.json();
    },

    getDailyAttendance: async (date, type) => {
        const response = await fetch(`${API_BASE_URL}/attendance/daily?date=${date}&type=${type}`);
        if (!response.ok) throw new Error('Failed to fetch daily attendance');
        return response.json();
    },

    getStats: async (type) => {
        const response = await fetch(`${API_BASE_URL}/attendance/stats?type=${type}`);
        if (!response.ok) throw new Error('Failed to fetch attendance stats');
        return response.json();
    }
};
