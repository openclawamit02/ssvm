import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import { Users, GraduationCap, IndianRupee, UserCheck, Loader2 } from 'lucide-react';
import { StudentService, TeacherService } from '../services/db';
import { FinanceService } from '../services/FinanceService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import './Dashboard.css';

const Dashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    students: 0,
    teachers: 0,
    attendance: 0,
    fees: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [students, teachers, finSummary] = await Promise.all([
          StudentService.getAll().catch(() => []),
          TeacherService.getAll().catch(() => []),
          FinanceService.getFinancialSummary().catch(() => ({ studentArrears: 0 }))
        ]);

        // Calculate today's attendance percentage from Firestore
        const todayStr = new Date().toISOString().split('T')[0];
        const attRecordsSnapshot = await getDocs(query(collection(db, 'attendance_records'), where('date', '==', todayStr)));
        const todayRecords = attRecordsSnapshot.docs.map(doc => doc.data());
        
        const totalMarked = todayRecords.length;
        const totalPresent = todayRecords.filter(r => r.status === 'PRESENT' || r.status === 'Present').length;
        const attPercentage = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 100; // Default to 100% if no records yet today

        setCounts({
          students: students.length,
          teachers: teachers.length,
          attendance: attPercentage,
          fees: finSummary.studentArrears
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const stats = [
    { title: t('total_students'), value: counts.students.toLocaleString(), icon: <GraduationCap size={24} className="text-mustard" />, trend: 'Live' },
    { title: t('total_teachers'), value: counts.teachers.toLocaleString(), icon: <Users size={24} className="text-mustard" />, trend: 'Live' },
    { title: t('fee_collection'), value: `₹${counts.fees.toLocaleString()}`, icon: <IndianRupee size={24} className="text-mustard" />, trend: 'Overall' },
    { title: t('today_attendance'), value: `${counts.attendance}%`, icon: <UserCheck size={24} className="text-mustard" />, trend: 'Today' }
  ];

  if (loading) {
    return (
      <div className="page-container flex-center" style={{height: '80vh'}}>
        <Loader2 className="text-mustard animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">{t('welcome')}</h1>
      
      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <Card key={idx} className="stat-card">
            <div className="stat-header">
              <span className="stat-title">{stat.title}</span>
              <div className="stat-icon-wrapper">
                {stat.icon}
              </div>
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-trend text-muted">{stat.trend}</div>
          </Card>
        ))}
      </div>

      <div className="dashboard-content">
        <Card className="recent-activity-card">
          <h3>{t('recent_activities')}</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-dot bg-mustard"></div>
              <div className="activity-content">
                <p>Welcome to <strong>SSVM Management System</strong>.</p>
                <span className="text-muted text-sm">Just now</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot bg-mustard"></div>
              <div className="activity-content">
                <p>Real-time data synchronization active.</p>
                <span className="text-muted text-sm">Online</span>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="quick-actions-card bg-mustard" padding="32px">
          <h3 style={{color: 'white', marginBottom: '16px'}}>Quick Actions</h3>
          <div className="quick-actions-grid">
            <button className="qa-btn" onClick={() => window.location.hash = '#/directory'}>Add Student</button>
            <button className="qa-btn" onClick={() => window.location.hash = '#/fees'}>Collect Fee</button>
            <button className="qa-btn" onClick={() => window.location.hash = '#/attendance'}>Mark Attendance</button>
            <button className="qa-btn">Send Notice</button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
