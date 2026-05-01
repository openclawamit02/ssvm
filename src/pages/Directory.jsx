import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import { Search, Plus, Loader2 } from 'lucide-react';
import { StudentService, TeacherService } from '../services/db';

const Directory = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('students');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let fetchedData = [];
        if (activeTab === 'students') {
          fetchedData = await StudentService.getAll();
        } else {
          fetchedData = await TeacherService.getAll();
        }
        setData(fetchedData);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleAddNew = async () => {
    // Basic mock add for demonstration
    const newDoc = {
      name: activeTab === 'students' ? 'New Student' : 'New Teacher',
      class: '10 A',
      status: 'Active'
    };
    try {
      if (activeTab === 'students') {
        const added = await StudentService.add(newDoc);
        setData([...data, added]);
      } else {
        const added = await TeacherService.add(newDoc);
        setData([...data, added]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="page-container">
      <div className="flex-between" style={{marginBottom: '24px'}}>
        <h1 className="page-title" style={{marginBottom: 0}}>{t('directory')}</h1>
        <button className="btn btn-primary" onClick={handleAddNew}>
          <Plus size={18} />
          {t('add_new')}
        </button>
      </div>

      <Card padding="0">
        <div className="flex-between" style={{padding: '20px', borderBottom: '1px solid var(--color-border)'}}>
          <div className="tabs" style={{display: 'flex', gap: '16px'}}>
            <button 
              className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
              style={{
                padding: '8px 16px', 
                borderRadius: '20px', 
                fontWeight: 600,
                background: activeTab === 'students' ? 'rgba(225, 173, 1, 0.1)' : 'transparent',
                color: activeTab === 'students' ? 'var(--color-mustard-dark)' : 'var(--color-text-muted)',
                transition: 'all 0.2s'
              }}
            >
              {t('students')}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
              onClick={() => setActiveTab('teachers')}
              style={{
                padding: '8px 16px', 
                borderRadius: '20px', 
                fontWeight: 600,
                background: activeTab === 'teachers' ? 'rgba(225, 173, 1, 0.1)' : 'transparent',
                color: activeTab === 'teachers' ? 'var(--color-mustard-dark)' : 'var(--color-text-muted)',
                transition: 'all 0.2s'
              }}
            >
              {t('teachers')}
            </button>
          </div>
          <div style={{position: 'relative', width: '300px'}}>
            <Search size={18} className="text-muted" style={{position: 'absolute', left: '12px', top: '14px'}} />
            <input type="text" placeholder={t('search')} style={{paddingLeft: '40px'}} />
          </div>
        </div>

        <div style={{overflowX: 'auto', minHeight: '300px'}}>
          {loading ? (
            <div className="flex-center" style={{height: '300px'}}>
              <Loader2 className="text-mustard" size={32} style={{animation: 'spin 1s linear infinite'}} />
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : data.length === 0 ? (
            <div className="flex-center" style={{height: '300px', flexDirection: 'column', gap: '12px'}}>
              <p className="text-muted">No {activeTab} found in database.</p>
              <button className="btn btn-secondary" onClick={handleAddNew}>Add First {activeTab === 'students' ? 'Student' : 'Teacher'}</button>
            </div>
          ) : (
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{textAlign: 'left', borderBottom: '1px solid var(--color-border)'}}>
                  <th style={{padding: '16px 20px', color: 'var(--color-text-muted)', fontWeight: 500}}>{t('name')}</th>
                  <th style={{padding: '16px 20px', color: 'var(--color-text-muted)', fontWeight: 500}}>{t('class')}</th>
                  <th style={{padding: '16px 20px', color: 'var(--color-text-muted)', fontWeight: 500}}>{t('status')}</th>
                  <th style={{padding: '16px 20px', color: 'var(--color-text-muted)', fontWeight: 500}}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.map(person => (
                  <tr key={person.id} style={{borderBottom: '1px solid var(--color-border)'}}>
                    <td style={{padding: '16px 20px', fontWeight: 600}}>{person.name}</td>
                    <td style={{padding: '16px 20px'}}>{person.class || '-'}</td>
                    <td style={{padding: '16px 20px'}}>
                      <span style={{
                        background: person.status === 'Active' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)', 
                        color: person.status === 'Active' ? 'var(--color-success)' : 'var(--color-danger)', 
                        padding: '4px 12px', 
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 600
                      }}>
                        {person.status || 'Unknown'}
                      </span>
                    </td>
                    <td style={{padding: '16px 20px'}}>
                      <button 
                        className="text-danger" 
                        style={{fontWeight: 600, fontSize: '14px', marginRight: '12px'}}
                        onClick={async () => {
                          if(activeTab === 'students') await StudentService.delete(person.id);
                          else await TeacherService.delete(person.id);
                          setData(data.filter(d => d.id !== person.id));
                        }}
                      >
                        Delete
                      </button>
                      <button className="text-mustard" style={{fontWeight: 600, fontSize: '14px'}}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Directory;
