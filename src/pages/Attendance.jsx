import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ClassService, StudentService, TeacherService, AttendanceService } from '../services/db';
import { Check, X, Users } from 'lucide-react';
import '../components/Card.css';

const CLASSES = ['LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

const Attendance = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('students');
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selection state
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Attendance state
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [records, setRecords] = useState({}); // { studentId/teacherId: 'Present' | 'Absent' }
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const [studentsData, teachersData] = await Promise.all([
          StudentService.getAll(),
          TeacherService.getAll()
        ]);
        setStudents(studentsData);
        setTeachers(teachersData);
      } catch (error) {
        console.error("Error fetching base data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBaseData();
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [activeTab, selectedClass, selectedDate]);

  const loadAttendance = async () => {
    try {
      const classId = activeTab === 'students' ? selectedClass : 'staff';
      const record = await AttendanceService.getByClassAndDate(classId, selectedDate);
      if (record) {
        setAttendanceRecord(record);
        const recMap = {};
        record.records.forEach(r => { recMap[r.id || r.studentId || r.teacherId] = r.status; });
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
      const classId = activeTab === 'students' ? selectedClass : 'staff';
      const recordsArray = Object.keys(records).map(id => ({
        id,
        status: records[id]
      }));
      const data = {
        classId,
        type: activeTab,
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

  const markAllPresent = () => {
    const newRecords = { ...records };
    currentList.forEach(person => {
      newRecords[person.id] = 'Present';
    });
    setRecords(newRecords);
  };

  const toggleStatus = (studentId, status) => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
  };

  if (loading) {
    return <div className="page-container"><p>Loading...</p></div>;
  }

  const currentList = activeTab === 'students' 
    ? students.filter(s => s.class?.trim() === selectedClass?.trim())
    : teachers;

  const stats = {
    total: currentList.length,
    present: Object.values(records).filter(s => s === 'Present').length,
    absent: Object.values(records).filter(s => s === 'Absent').length
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t('attendance')}</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={markAllPresent} disabled={saving || currentList.length === 0}>
            {t('mark_all_present')}
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {/* Category Toggle */}
      <div className="tabs" style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button 
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
          style={{
            padding: '8px 24px', borderRadius: '20px', fontWeight: 600,
            background: activeTab === 'students' ? 'rgba(225, 173, 1, 0.1)' : 'transparent',
            color: activeTab === 'students' ? 'var(--color-mustard-dark)' : 'var(--color-text-muted)',
            transition: 'all 0.2s', border: 'none', cursor: 'pointer'
          }}
        >
          {t('students')}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
          onClick={() => setActiveTab('teachers')}
          style={{
            padding: '8px 24px', borderRadius: '20px', fontWeight: 600,
            background: activeTab === 'teachers' ? 'rgba(225, 173, 1, 0.1)' : 'transparent',
            color: activeTab === 'teachers' ? 'var(--color-mustard-dark)' : 'var(--color-text-muted)',
            transition: 'all 0.2s', border: 'none', cursor: 'pointer'
          }}
        >
          {t('teachers')}
        </button>
      </div>

      <div className="glass" style={{ padding: '24px', marginBottom: '24px', borderRadius: 'var(--border-radius-lg)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--color-text-muted)', fontSize: '16px' }}>
          {t('mark_attendance_for', { type: activeTab === 'students' ? t('students') : t('teachers') })}: 
          <span style={{ color: 'var(--color-text)', fontWeight: 700, marginLeft: '8px' }}>
            {activeTab === 'students' ? `${t('class')} ${selectedClass}` : t('staff')} — {selectedDate}
          </span>
        </h3>
        
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {activeTab === 'students' && (
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label>{t('class')}</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)'}}>
                {CLASSES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>Date</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)'}}/>
          </div>
          
          {/* Summary Stats */}
          <div style={{ flex: '2 1 300px', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div className="glass" style={{ flex: 1, padding: '12px', borderRadius: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{t('total_count')}</div>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>{stats.total}</div>
            </div>
            <div className="glass" style={{ flex: 1, padding: '12px', borderRadius: '12px', textAlign: 'center', background: 'rgba(46, 213, 115, 0.1)', color: 'var(--color-success)' }}>
              <div style={{ fontSize: '12px' }}>{t('present_count')}</div>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>{stats.present}</div>
            </div>
            <div className="glass" style={{ flex: 1, padding: '12px', borderRadius: '12px', textAlign: 'center', background: 'rgba(255, 71, 87, 0.1)', color: 'var(--color-danger)' }}>
              <div style={{ fontSize: '12px' }}>{t('absent_count')}</div>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>{stats.absent}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="data-grid">
        {currentList.length > 0 ? currentList.map(person => (
          <div key={person.id} className="card glass" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'rgba(225, 173, 1, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-mustard-dark)' }}>
                <Users size={20} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '16px' }}>{person.name}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  {activeTab === 'students' ? `Roll: ${person.rollNumber || 'N/A'}` : person.subjects || person.qualification}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => toggleStatus(person.id, 'Present')}
                style={{
                  padding: '8px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px',
                  background: records[person.id] === 'Present' ? 'var(--color-success)' : 'rgba(255,255,255,0.05)',
                  color: records[person.id] === 'Present' ? 'white' : 'var(--color-text-muted)',
                  transition: 'all 0.2s'
                }}
              >
                <Check size={16} /> {t('present_count')}
              </button>
              <button 
                onClick={() => toggleStatus(person.id, 'Absent')}
                style={{
                  padding: '8px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px',
                  background: records[person.id] === 'Absent' ? 'var(--color-danger)' : 'rgba(255,255,255,0.05)',
                  color: records[person.id] === 'Absent' ? 'white' : 'var(--color-text-muted)',
                  transition: 'all 0.2s'
                }}
              >
                <X size={16} /> {t('absent_count')}
              </button>
            </div>
          </div>
        )) : (
          <div className="glass" style={{ gridColumn: 'span 3', padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
            <Users size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>No {activeTab} found for the selected criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
