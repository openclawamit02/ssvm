import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AttendanceApiService, DirectoryApiService } from '../services/SchoolApiService';
import { Check, X, Users, Search, AlertTriangle, TrendingUp, TrendingDown, Award, BarChart2, Calendar, Loader2 } from 'lucide-react';
import StatCard from '../components/StatCard';
import Pagination from '../components/Pagination';
import '../components/Card.css';

const CLASSES = ['LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
const LOW_ATTENDANCE_THRESHOLD = 75;

const AttendanceBadge = ({ pct }) => {
  if (pct === undefined || pct === null) return <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>No data</span>;
  const low = pct < LOW_ATTENDANCE_THRESHOLD;
  return (
    <span style={{
      fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px',
      background: low ? 'rgba(255,71,87,0.12)' : 'rgba(46,213,115,0.12)',
      color: low ? 'var(--color-danger)' : 'var(--color-success)',
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      border: `1px solid ${low ? 'rgba(255,71,87,0.2)' : 'rgba(46,213,115,0.2)'}`
    }}>
      {low && <AlertTriangle size={10} />}{pct.toFixed(1)}%
    </span>
  );
};

const Attendance = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('STUDENT'); // STUDENT or TEACHER
  const [entities, setEntities] = useState([]);
  const [totalEntities, setTotalEntities] = useState(0);
  const [stats, setStats] = useState({ highest: 0, lowest: 0, belowThresholdCount: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);

  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState({}); // { personId: status }
  const [saving, setSaving] = useState(false);

  // Search & pagination
  const [searchQ, setSearchQ] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchStats = async () => {
    try {
      const data = await AttendanceApiService.getStats(activeTab);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchEntities = async () => {
    setListLoading(true);
    try {
      let data;
      if (activeTab === 'STUDENT') {
        data = await DirectoryApiService.getStudents(searchQ, page, pageSize);
      } else {
        data = await DirectoryApiService.getTeachers(searchQ, page, pageSize);
      }
      setEntities(data.content);
      setTotalEntities(data.totalElements);
    } catch (err) {
      console.error('Failed to fetch entities:', err);
    } finally {
      setListLoading(false);
    }
  };

  const loadDailyAttendance = async () => {
    try {
      const data = await AttendanceApiService.getDailyAttendance(selectedDate, activeTab);
      const m = {};
      data.forEach(r => { m[r.personId] = r.status; });
      setRecords(m);
    } catch (err) {
      console.error('Failed to fetch daily attendance:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchEntities(), loadDailyAttendance()])
      .finally(() => setLoading(false));
  }, [activeTab]);

  useEffect(() => {
    fetchEntities();
  }, [page, pageSize, searchQ]);

  useEffect(() => {
    loadDailyAttendance();
  }, [selectedDate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const recordArray = Object.keys(records).map(id => ({
        date: selectedDate,
        personId: id,
        personType: activeTab,
        status: records[id]
      }));
      await AttendanceApiService.recordAttendance(recordArray);
      await fetchStats();
      alert('Attendance saved successfully!');
    } catch (err) {
      alert('Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = useCallback((id, status) =>
    setRecords(prev => ({ ...prev, [id]: status })), []);

  const markAll = (status) => {
    const m = { ...records };
    entities.forEach(p => { m[p.id] = status; });
    setRecords(m);
  };

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 className="spinner" size={48} color="var(--color-mustard)" />
        <p style={{ color: 'var(--color-text-muted)', marginTop: '16px', fontWeight: 500 }}>Initializing smart attendance system…</p>
      </div>
    </div>
  );

  return (
    <div className="page-container animate-fade-in">
      <style>{`
        .att-row { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .att-row:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); background: rgba(255,255,255,0.05); }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .tab-btn { position: relative; overflow: hidden; }
        .tab-btn.active::after { content: ''; position: absolute; bottom: 0; left: 25%; right: 25%; height: 3px; background: var(--color-mustard); border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '4px', fontSize: '32px' }}>{t('attendance')}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
            <Calendar size={16} />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setShowDashboard(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} /> {showDashboard ? 'Hide' : 'Show'} Analytics
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: '160px' }}>
            {saving ? <Loader2 className="spinner" size={18} /> : 'Commit Changes'}
          </button>
        </div>
      </div>

      {/* Tab Switch */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '14px', width: 'fit-content' }}>
        {[
          { id: 'STUDENT', label: 'Students', icon: Users },
          { id: 'TEACHER', label: 'Teachers/Staff', icon: Award }
        ].map(tab => (
          <button key={tab.id}
            onClick={() => { setActiveTab(tab.id); setPage(0); setSearchQ(''); }}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            style={{
              padding: '10px 24px', borderRadius: '10px', fontWeight: 600, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              background: activeTab === tab.id ? 'rgba(225,173,1,0.15)' : 'transparent',
              color: activeTab === tab.id ? 'var(--color-mustard-dark)' : 'var(--color-text-muted)',
              transition: 'all 0.3s'
            }}>
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Analytics Dashboard */}
      {showDashboard && (
        <div className="animate-slide-up" style={{ marginBottom: '40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <StatCard icon={TrendingUp} label="Highest Attendance" 
              value={`${stats.highest.toFixed(1)}%`}
              color="var(--color-success)" />
            <StatCard icon={TrendingDown} label="Lowest Attendance" 
              value={`${stats.lowest.toFixed(1)}%`}
              color="var(--color-danger)" />
            <StatCard icon={AlertTriangle} label="Critical Attention" 
              value={stats.belowThresholdCount}
              sub="Entities below 75%"
              color="var(--color-danger)"
              badge={stats.belowThresholdCount > 0 ? { label: 'Action Required', color: 'rgba(255,71,87,0.1)', textColor: 'var(--color-danger)' } : null} />
            <StatCard icon={Users} label="Total Tracked" 
              value={stats.totalCount}
              sub={`Across ${activeTab.toLowerCase()} directory`}
              color="var(--color-mustard-dark)" />
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="glass" style={{ padding: '28px', marginBottom: '28px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '24px' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-muted)' }}>Target Date</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-mustard)' }} />
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} 
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text)', fontWeight: 500 }} />
            </div>
          </div>
          
          <div style={{ flex: '2 1 300px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-muted)' }}>Quick Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input placeholder={`Find ${activeTab.toLowerCase()} by name or ID…`} value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(0); }}
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => markAll('PRESENT')} style={{ padding: '12px 20px' }}>All Present</button>
            <button className="btn btn-secondary" onClick={() => markAll('ABSENT')} style={{ padding: '12px 20px', color: 'var(--color-danger)' }}>All Absent</button>
          </div>
        </div>
      </div>

      {/* List Container */}
      <div style={{ position: 'relative' }}>
        {listLoading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.1)', backdropFilter: 'blur(2px)', zIndex: 10, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="spinner" size={32} color="var(--color-mustard)" />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {entities.length === 0 ? (
            <div className="glass" style={{ padding: '60px', textAlign: 'center', borderRadius: '20px' }}>
              <Users size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: '16px' }}>No records found matching your search criteria.</p>
            </div>
          ) : (
            <>
              {entities.map(person => (
                <div key={person.id} className="glass att-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderRadius: '16px', gap: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--color-mustard), var(--color-mustard-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px', color: 'white', flexShrink: 0, boxShadow: '0 4px 12px rgba(225,173,1,0.2)' }}>
                      {person.name?.charAt(0)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '2px' }}>{person.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span>ID: {person.rollNumber || person.employeeId}</span>
                        <span style={{ opacity: 0.3 }}>|</span>
                        <span>{person.studentClass ? `Class ${person.studentClass}` : person.department}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <AttendanceBadge pct={person.attendancePercentage} /> {/* Backend can provide this in search results if calculated */}
                    
                    <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px' }}>
                      {[
                        { id: 'PRESENT', label: 'Present', color: 'var(--color-success)' },
                        { id: 'ABSENT', label: 'Absent', color: 'var(--color-danger)' },
                        { id: 'LATE', label: 'Late', color: 'var(--color-mustard)' }
                      ].map(status => (
                        <button key={status.id} onClick={() => toggleStatus(person.id, status.id)}
                          style={{
                            padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '12px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: records[person.id] === status.id ? status.color : 'transparent',
                            color: records[person.id] === status.id ? 'white' : 'var(--color-text-muted)',
                            boxShadow: records[person.id] === status.id ? `0 4px 12px ${status.color}44` : 'none'
                          }}>
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              <div style={{ marginTop: '20px' }}>
                <Pagination
                  currentPage={page + 1}
                  totalItems={totalEntities}
                  pageSize={pageSize}
                  onPageChange={(p) => setPage(p - 1)}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
