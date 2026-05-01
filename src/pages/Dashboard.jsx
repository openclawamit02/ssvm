import React from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import { Users, GraduationCap, IndianRupee, UserCheck } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { t } = useTranslation();

  const stats = [
    { title: t('total_students'), value: '1,248', icon: <GraduationCap size={24} className="text-mustard" />, trend: '+12 this month' },
    { title: t('total_teachers'), value: '64', icon: <Users size={24} className="text-mustard" />, trend: '+2 this month' },
    { title: t('fee_collection'), value: '₹4.2L', icon: <IndianRupee size={24} className="text-mustard" />, trend: '85% collected' },
    { title: t('today_attendance'), value: '94%', icon: <UserCheck size={24} className="text-mustard" />, trend: 'Overall' }
  ];

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
                <p><strong>Rahul Sharma</strong> paid Term 2 Fees.</p>
                <span className="text-muted text-sm">2 mins ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot bg-mustard"></div>
              <div className="activity-content">
                <p><strong>Class 10A</strong> attendance marked.</p>
                <span className="text-muted text-sm">1 hour ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot bg-mustard"></div>
              <div className="activity-content">
                <p>New teacher <strong>Priya Dash</strong> joined.</p>
                <span className="text-muted text-sm">Yesterday</span>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="quick-actions-card bg-mustard" padding="32px">
          <h3 style={{color: 'white', marginBottom: '16px'}}>Quick Actions</h3>
          <div className="quick-actions-grid">
            <button className="qa-btn">Add Student</button>
            <button className="qa-btn">Collect Fee</button>
            <button className="qa-btn">Mark Attendance</button>
            <button className="qa-btn">Send Notice</button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
