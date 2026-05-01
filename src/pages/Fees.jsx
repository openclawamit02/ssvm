import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MoreVertical,
  Printer,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import FeeApiService from '../services/FeeApiService';
import { StudentService } from '../services/db'; // Keep for student directory
import '../components/Card.css';

const Fees = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, ledger, defaulters
  const [students, setStudents] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [payData, setPayData] = useState({ amount: '', description: '', mode: 'CASH' });
  const [postData, setPostData] = useState({ amount: '', description: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [studentsData, accountsData] = await Promise.all([
        StudentService.getAll(),
        FeeApiService.getAllAccounts().catch(() => []) // Fallback if backend not running
      ]);
      setStudents(studentsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error fetching fees data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = async (student) => {
    setSelectedStudent(student);
    setActiveTab('ledger');
    try {
      const ledgerData = await FeeApiService.getLedger(student.id);
      setLedger(ledgerData);
    } catch (error) {
      console.error("Error fetching ledger:", error);
      setLedger([]);
    }
  };

  const handleRecordPayment = async () => {
    try {
      await FeeApiService.recordPayment(
        selectedStudent.id, 
        payData.amount, 
        payData.description, 
        payData.mode
      );
      setShowPayModal(false);
      handleStudentSelect(selectedStudent); // Refresh ledger
      fetchInitialData(); // Refresh accounts
    } catch (error) {
      alert("Error recording payment. Is the backend running?");
    }
  };

  const handlePostFee = async () => {
    try {
      await FeeApiService.postFee(
        selectedStudent.id, 
        postData.amount, 
        postData.description
      );
      setShowPostModal(false);
      handleStudentSelect(selectedStudent); // Refresh ledger
      fetchInitialData(); // Refresh accounts
    } catch (error) {
      alert("Error posting fee. Is the backend running?");
    }
  };

  const getBalance = (studentId) => {
    const acc = accounts.find(a => a.studentId === studentId);
    return acc ? acc.currentBalance : 0;
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.rollNumber.includes(searchQuery)
  );

  const totalArrears = accounts.reduce((sum, acc) => sum + (acc.currentBalance > 0 ? acc.currentBalance : 0), 0);
  const totalCollectionToday = 12500; // Mock for now

  return (
    <div className="page-container" style={{maxWidth: '1400px'}}>
      {/* Header Section */}
      <div className="flex-between" style={{marginBottom: '32px'}}>
        <div>
          <h1 className="page-title" style={{marginBottom: '4px'}}>{t('fees')}</h1>
          <p style={{color: 'var(--color-text-muted)', fontSize: '15px'}}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex-center" style={{gap: '12px'}}>
          <div className="glass flex-center" style={{padding: '8px 16px', borderRadius: '100px', border: '1px solid var(--color-border)'}}>
            <Search size={18} style={{marginRight: '8px', color: 'var(--color-text-muted)'}} />
            <input 
              placeholder={t('search')} 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{border: 'none', background: 'none', padding: '4px', width: '200px', fontSize: '14px'}} 
            />
          </div>
          <button className="icon-btn glass" style={{borderRadius: '50%', width: '42px', height: '42px'}}>
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-center" style={{gap: '24px', marginBottom: '32px', justifyContent: 'flex-start', borderBottom: '1px solid var(--color-border)'}}>
        {['dashboard', 'ledger', 'defaulters'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 4px',
              fontSize: '16px',
              fontWeight: activeTab === tab ? '600' : '400',
              color: activeTab === tab ? 'var(--color-mustard-dark)' : 'var(--color-text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--color-mustard)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {t(tab)}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div style={{animation: 'fadeIn 0.4s ease-out'}}>
          {/* Stats Cards - Apple Wallet Style */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px'}}>
            <div className="card bg-mustard" style={{borderRadius: 'var(--border-radius-lg)', padding: '24px', border: 'none', boxShadow: 'var(--shadow-premium)'}}>
              <div className="flex-between" style={{marginBottom: '20px'}}>
                <div className="glass flex-center" style={{width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)'}}>
                  <TrendingUp size={20} />
                </div>
                <span style={{fontSize: '14px', fontWeight: '500', opacity: 0.8}}>+12.5% {t('monthly_growth')}</span>
              </div>
              <p style={{fontSize: '14px', opacity: 0.9, marginBottom: '4px'}}>{t('total_collection')}</p>
              <h2 style={{fontSize: '32px', fontWeight: '700'}}>₹{totalCollectionToday.toLocaleString()}</h2>
            </div>

            <div className="card glass" style={{borderRadius: 'var(--border-radius-lg)', padding: '24px'}}>
              <div className="flex-between" style={{marginBottom: '20px'}}>
                <div className="flex-center" style={{width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255, 59, 48, 0.1)', color: 'var(--color-danger)'}}>
                  <AlertCircle size={20} />
                </div>
                <button className="text-mustard" style={{fontSize: '14px', fontWeight: '600'}}>{t('view')}</button>
              </div>
              <p style={{fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px'}}>{t('pending_arrears')}</p>
              <h2 style={{fontSize: '32px', fontWeight: '700', color: 'var(--color-danger)'}}>₹{totalArrears.toLocaleString()}</h2>
            </div>

            <div className="card glass" style={{borderRadius: 'var(--border-radius-lg)', padding: '24px'}}>
              <div className="flex-between" style={{marginBottom: '20px'}}>
                <div className="flex-center" style={{width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(52, 199, 89, 0.1)', color: 'var(--color-success)'}}>
                  <CheckCircle size={20} />
                </div>
                <button className="text-mustard" style={{fontSize: '14px', fontWeight: '600'}}>{t('day_book')}</button>
              </div>
              <p style={{fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px'}}>{t('verified_payments')}</p>
              <h2 style={{fontSize: '32px', fontWeight: '700'}}>98%</h2>
            </div>
          </div>

          {/* Student Quick List */}
          <h3 style={{marginBottom: '20px', fontSize: '20px'}}>{t('student_accounts')}</h3>
          <div className="glass" style={{borderRadius: 'var(--border-radius-lg)', overflow: 'hidden'}}>
            {filteredStudents.map((student, index) => (
              <div 
                key={student.id} 
                onClick={() => handleStudentSelect(student)}
                style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '16px 24px', 
                  borderBottom: index === filteredStudents.length - 1 ? 'none' : '1px solid var(--color-border)',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                className="hover-bg"
              >
                <div style={{width: '48px', height: '48px', borderRadius: '16px', background: 'var(--color-mustard)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '18px', marginRight: '16px'}}>
                  {student.name.charAt(0)}
                </div>
                <div style={{flex: 1}}>
                  <h4 style={{fontSize: '16px', marginBottom: '2px'}}>{student.name}</h4>
                  <p style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>Roll: {student.rollNumber} • Class: {student.class}</p>
                </div>
                <div style={{textAlign: 'right', marginRight: '24px'}}>
                  <p style={{fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px'}}>{t('balance')}</p>
                  <p style={{fontSize: '18px', fontWeight: '700', color: getBalance(student.id) > 0 ? 'var(--color-danger)' : 'var(--color-success)'}}>
                    ₹{getBalance(student.id).toLocaleString()}
                  </p>
                </div>
                <ChevronRight size={20} color="var(--color-text-muted)" />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'ledger' && selectedStudent && (
        <div style={{animation: 'slideIn 0.4s ease-out'}}>
          <div className="flex-between" style={{marginBottom: '24px'}}>
            <button onClick={() => setActiveTab('dashboard')} className="flex-center" style={{color: 'var(--color-mustard-dark)', fontWeight: '600'}}>
              <ChevronRight size={20} style={{transform: 'rotate(180deg)', marginRight: '4px'}} />
              {t('back')}
            </button>
            <div className="flex-center" style={{gap: '12px'}}>
              <button className="btn btn-secondary" onClick={() => setShowPostModal(true)}>
                <ArrowUpRight size={18} />
                {t('post_fees')}
              </button>
              <button className="btn btn-primary" onClick={() => setShowPayModal(true)}>
                <ArrowDownLeft size={18} />
                {t('record_payment')}
              </button>
            </div>
          </div>

          <div className="card glass" style={{borderRadius: 'var(--border-radius-lg)', padding: '32px', marginBottom: '32px'}}>
            <div className="flex-between">
              <div>
                <h2 style={{fontSize: '28px', marginBottom: '8px'}}>{selectedStudent.name}</h2>
                <p style={{color: 'var(--color-text-muted)'}}>{t('student_account')} #{selectedStudent.id}</p>
              </div>
              <div style={{textAlign: 'right'}}>
                <p style={{fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px'}}>{t('current_balance')}</p>
                <h2 style={{fontSize: '36px', fontWeight: '800', color: getBalance(selectedStudent.id) > 0 ? 'var(--color-danger)' : 'var(--color-success)'}}>
                  ₹{getBalance(selectedStudent.id).toLocaleString()}
                </h2>
              </div>
            </div>
          </div>

          <h3 style={{marginBottom: '20px'}}>{t('transaction_history')}</h3>
          <div className="glass" style={{borderRadius: 'var(--border-radius-lg)', overflow: 'hidden'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{textAlign: 'left', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--color-border)'}}>
                  <th style={{padding: '16px 24px'}}>{t('date')}</th>
                  <th style={{padding: '16px 24px'}}>{t('description')}</th>
                  <th style={{padding: '16px 24px'}}>{t('payment_mode')}</th>
                  <th style={{padding: '16px 24px', textAlign: 'right'}}>{t('debit')}</th>
                  <th style={{padding: '16px 24px', textAlign: 'right'}}>{t('credit')}</th>
                  <th style={{padding: '16px 24px', textAlign: 'center'}}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((tx, idx) => (
                  <tr key={tx.id} style={{borderBottom: idx === ledger.length - 1 ? 'none' : '1px solid var(--color-border)', opacity: tx.voided ? 0.5 : 1}}>
                    <td style={{padding: '16px 24px'}}>{new Date(tx.timestamp).toLocaleDateString()}</td>
                    <td style={{padding: '16px 24px'}}>
                      <div style={{fontWeight: '500'}}>{tx.description}</div>
                      {tx.voided && <span style={{fontSize: '10px', background: 'var(--color-text-muted)', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px'}}>{t('void')}</span>}
                    </td>
                    <td style={{padding: '16px 24px'}}>
                      <span style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>{tx.paymentMode || '-'}</span>
                    </td>
                    <td style={{padding: '16px 24px', textAlign: 'right', fontWeight: '600', color: 'var(--color-danger)'}}>
                      {tx.type === 'DEBIT' ? `₹${tx.amount.toLocaleString()}` : ''}
                    </td>
                    <td style={{padding: '16px 24px', textAlign: 'right', fontWeight: '600', color: 'var(--color-success)'}}>
                      {tx.type === 'CREDIT' ? `₹${tx.amount.toLocaleString()}` : ''}
                    </td>
                    <td style={{padding: '16px 24px', textAlign: 'center'}}>
                      <div className="flex-center" style={{gap: '8px'}}>
                        <button className="icon-btn" style={{color: 'var(--color-text-muted)'}}><Printer size={18} /></button>
                        {!tx.voided && (
                          <button 
                            className="icon-btn" 
                            style={{color: 'var(--color-danger)'}} 
                            onClick={async () => {
                              if(window.confirm(t('confirm_void'))) {
                                await FeeApiService.voidTransaction(tx.id);
                                handleStudentSelect(selectedStudent);
                              }
                            }}
                          >
                            <AlertCircle size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="modal-overlay" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className="glass" style={{width: '90%', maxWidth: '450px', padding: '32px', borderRadius: 'var(--border-radius-xl)', boxShadow: 'var(--shadow-premium)'}}>
            <h2 style={{marginBottom: '24px'}}>{t('record_payment')}</h2>
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--color-text-muted)'}}>{t('amount')}</label>
              <input 
                type="number" 
                value={payData.amount} 
                onChange={e => setPayData({...payData, amount: e.target.value})}
                placeholder="0.00" 
                style={{fontSize: '24px', fontWeight: '700', padding: '16px'}}
              />
            </div>
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--color-text-muted)'}}>{t('payment_mode')}</label>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px'}}>
                {['CASH', 'ONLINE', 'BANK_TRANSFER'].map(mode => (
                  <button 
                    key={mode}
                    onClick={() => setPayData({...payData, mode})}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: payData.mode === mode ? 'var(--color-mustard)' : 'rgba(0,0,0,0.05)',
                      color: payData.mode === mode ? 'white' : 'var(--color-text-main)',
                      border: 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {t(mode.toLowerCase())}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom: '32px'}}>
              <label style={{display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--color-text-muted)'}}>{t('description')}</label>
              <input 
                value={payData.description}
                onChange={e => setPayData({...payData, description: e.target.value})}
                placeholder="e.g. April 2026 Tuition" 
              />
            </div>
            <div className="flex-center" style={{gap: '16px'}}>
              <button className="btn btn-secondary" style={{flex: 1}} onClick={() => setShowPayModal(false)}>{t('cancel')}</button>
              <button className="btn btn-primary" style={{flex: 1}} onClick={handleRecordPayment}>{t('save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Post Fee Modal */}
      {showPostModal && (
        <div className="modal-overlay" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className="glass" style={{width: '90%', maxWidth: '450px', padding: '32px', borderRadius: 'var(--border-radius-xl)', boxShadow: 'var(--shadow-premium)'}}>
            <h2 style={{marginBottom: '24px'}}>{t('post_fees')}</h2>
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--color-text-muted)'}}>{t('amount')}</label>
              <input 
                type="number" 
                value={postData.amount}
                onChange={e => setPostData({...postData, amount: e.target.value})}
                placeholder="0.00" 
                style={{fontSize: '24px', fontWeight: '700', padding: '16px'}}
              />
            </div>
            <div style={{marginBottom: '32px'}}>
              <label style={{display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--color-text-muted)'}}>{t('description')}</label>
              <input 
                value={postData.description}
                onChange={e => setPostData({...postData, description: e.target.value})}
                placeholder="e.g. Monthly Tuition Fee" 
              />
            </div>
            <div className="flex-center" style={{gap: '16px'}}>
              <button className="btn btn-secondary" style={{flex: 1}} onClick={() => setShowPostModal(false)}>{t('cancel')}</button>
              <button className="btn btn-primary" style={{flex: 1}} onClick={handlePostFee}>{t('post')}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .hover-bg:hover {
          background: rgba(212, 175, 55, 0.05);
        }
        .icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 12px;
          transition: all 0.2s;
        }
        .icon-btn:hover {
          background: rgba(0,0,0,0.05);
          transform: scale(1.05);
        }
        input::placeholder {
          color: #C7C7CC;
        }
      `}</style>
    </div>
  );
};

export default Fees;
