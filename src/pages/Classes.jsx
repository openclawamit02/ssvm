import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { ClassService, TeacherService } from '../services/db';
import '../components/Card.css';

const Classes = () => {
  const { t } = useTranslation();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', section: '', classTeacherId: '' });

  const fetchData = async () => {
    try {
      const [classesData, teachersData] = await Promise.all([
        ClassService.getAll(),
        TeacherService.getAll()
      ]);
      setClasses(classesData);
      setTeachers(teachersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await ClassService.add(formData);
      setFormData({ name: '', section: '', classTeacherId: '' });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error("Error adding class:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        await ClassService.delete(id);
        fetchData();
      } catch (error) {
        console.error("Error deleting class:", error);
      }
    }
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Unassigned';
  };

  if (loading) {
    return <div className="page-container"><p>Loading...</p></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t('classes')}</h1>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={20} />
          {showAddForm ? 'Cancel' : 'Add Class'}
        </button>
      </div>

      {showAddForm && (
        <div className="glass" style={{ padding: '20px', marginBottom: '24px', borderRadius: 'var(--border-radius-lg)' }}>
          <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
            <div className="form-group">
              <label>Class Name (e.g., Class 1)</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)'}}/>
            </div>
            <div className="form-group">
              <label>Section</label>
              <input required type="text" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)'}}/>
            </div>
            <div className="form-group">
              <label>Class Teacher</label>
              <select required value={formData.classTeacherId} onChange={e => setFormData({...formData, classTeacherId: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)'}}>
                <option value="">Select Teacher</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{padding: '10px 20px', height: '42px'}}>Save</button>
          </form>
        </div>
      )}

      <div className="data-grid">
        {classes.map(cls => (
          <div key={cls.id} className="card glass">
            <div className="card-header">
              <div className="card-title">
                <h3>{cls.name}</h3>
                <span className={`status-badge bg-mustard`} style={{color: 'white'}}>Section {cls.section}</span>
              </div>
              <button className="icon-btn text-danger" onClick={() => handleDelete(cls.id)}>
                <Trash2 size={20} />
              </button>
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="info-label">Class Teacher</span>
                <span className="info-value">{getTeacherName(cls.classTeacherId)}</span>
              </div>
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <p style={{color: 'var(--color-text-muted)'}}>No classes found. Add one to get started.</p>
        )}
      </div>
    </div>
  );
};

export default Classes;
