import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import { FeeService, StudentService } from '../services/db';
import '../components/Card.css';

const Fees = () => {
  const { t } = useTranslation();
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ studentId: '', amount: '', month: '', status: 'Paid' });

  const fetchData = async () => {
    try {
      const [feesData, studentsData] = await Promise.all([
        FeeService.getAll(),
        StudentService.getAll()
      ]);
      setFees(feesData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setStudents(studentsData);
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
      await FeeService.add({
        ...formData,
        amount: Number(formData.amount),
        date: new Date().toISOString()
      });
      setFormData({ studentId: '', amount: '', month: '', status: 'Paid' });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error("Error adding fee record:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this fee record?")) {
      try {
        await FeeService.delete(id);
        fetchData();
      } catch (error) {
        console.error("Error deleting fee record:", error);
      }
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown Student';
  };

  if (loading) {
    return <div className="page-container"><p>Loading...</p></div>;
  }

  const currentMonths = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ].map(m => `${m} ${new Date().getFullYear()}`);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t('fees')} Ledger</h1>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={20} />
          {showAddForm ? 'Cancel' : 'Record Payment'}
        </button>
      </div>

      {showAddForm && (
        <div className="glass" style={{ padding: '20px', marginBottom: '24px', borderRadius: 'var(--border-radius-lg)' }}>
          <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
            <div className="form-group">
              <label>Student</label>
              <select required value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)'}}>
                <option value="">Select Student</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (Roll: {s.rollNumber})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input required type="number" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)'}}/>
            </div>
            <div className="form-group">
              <label>Fee Month</label>
              <select required value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)'}}>
                <option value="">Select Month</option>
                {currentMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{padding: '10px 20px', height: '42px'}}>Save</button>
          </form>
        </div>
      )}

      <div className="data-grid">
        {fees.map(fee => (
          <div key={fee.id} className="card glass">
            <div className="card-header">
              <div className="card-title">
                <h3>{getStudentName(fee.studentId)}</h3>
                <span className={`status-badge bg-success`} style={{color: 'white'}}>
                  <CheckCircle size={14} style={{marginRight: '4px', display: 'inline'}}/>
                  {fee.status}
                </span>
              </div>
              <button className="icon-btn text-danger" onClick={() => handleDelete(fee.id)}>
                <Trash2 size={20} />
              </button>
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="info-label">Month</span>
                <span className="info-value">{fee.month}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Amount</span>
                <span className="info-value" style={{fontWeight: 'bold', color: 'var(--color-primary)'}}>₹{fee.amount}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Date Paid</span>
                <span className="info-value">{new Date(fee.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
        {fees.length === 0 && (
          <p style={{color: 'var(--color-text-muted)'}}>No fee records found. Record a payment to get started.</p>
        )}
      </div>
    </div>
  );
};

export default Fees;
