import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, Search, Filter, Download, ArrowUpRight, ArrowDownLeft, 
  Wallet, CreditCard, Clock, CheckCircle, AlertCircle,
  MoreVertical, Printer, ChevronRight, TrendingUp, Users, UserCheck
} from 'lucide-react';
import FeeApiService from '../services/FeeApiService';
import { StudentService, TeacherService } from '../services/db';
import StatCard from '../components/StatCard';
import Pagination from '../components/Pagination';
import '../components/Card.css';

const Fees = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewType, setViewType] = useState('STUDENT'); // STUDENT, TEACHER
  const [accounts, setAccounts] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [summary, setSummary] = useState({ 
    collectedToday: 0, 
    totalArrears: 0, 
    studentCount: 0, 
    teacherCount: 0,
    collectionBreakdown: {} 
  });
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [defaulterPage, setDefaulterPage] = useState(1);
  const [defaulterPageSize, setDefaulterPageSize] = useState(10);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(10);

  const [totalAccounts, setTotalAccounts] = useState(0);
  const [totalDefaulters, setTotalDefaulters] = useState(0);
  const [totalLedgerItems, setTotalLedgerItems] = useState(0);

  const [payData, setPayData] = useState({ amount: '', description: '', mode: 'CASH' });
  const [postData, setPostData] = useState({ amount: '', description: '' });

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    } else if (activeTab === 'accounts') {
      fetchAccounts();
    } else if (activeTab === 'defaulters') {
      fetchDefaulters();
    }
  }, [activeTab, currentPage, pageSize, defaulterPage, defaulterPageSize, viewType, searchQuery]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryData, recentTxData] = await Promise.all([
        FeeApiService.getSummary().catch(() => ({ collectedToday: 0, totalArrears: 0, studentCount: 0, teacherCount: 0, collectionBreakdown: {} })),
        FeeApiService.getRecentTransactions().catch(() => [])
      ]);
      setSummary(summaryData);
      setRecentTransactions(recentTxData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const accountsPage = await FeeApiService.getAllAccounts(viewType, searchQuery, currentPage - 1, pageSize);
      setAccounts(accountsPage.content || []);
      setTotalAccounts(accountsPage.totalElements || 0);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDefaulters = async () => {
    try {
      setLoading(true);
      const defaultersPage = await FeeApiService.getDefaulters(defaulterPage - 1, defaulterPageSize);
      setDefaulters(defaultersPage.content || []);
      setTotalDefaulters(defaultersPage.totalElements || 0);
    } catch (error) {
      console.error("Error fetching defaulters:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEntity && activeTab === 'ledger') {
      fetchLedger();
    }
  }, [ledgerPage, ledgerPageSize, selectedEntity, activeTab]);

  const fetchLedger = async () => {
    if (!selectedEntity) return;
    try {
      const ledgerPageData = await FeeApiService.getLedger(selectedEntity.entityId || selectedEntity.id, ledgerPage - 1, ledgerPageSize);
      setLedger(ledgerPageData.content || []);
      setTotalLedgerItems(ledgerPageData.totalElements || 0);
    } catch (error) {
      console.error("Error fetching ledger:", error);
      setLedger([]);
      setTotalLedgerItems(0);
    }
  };

  const handleEntitySelect = (entity) => {
    setSelectedEntity(entity);
    setActiveTab('ledger');
    setLedgerPage(1);
  };

  const handleRecordPayment = async () => {
    try {
      await FeeApiService.recordPayment(selectedEntity.entityId || selectedEntity.id, 'CREDIT', payData.amount, payData.description, payData.mode);
      setShowPayModal(false);
      fetchLedger();
      if (activeTab === 'dashboard') fetchDashboardData();
      else if (activeTab === 'accounts') fetchAccounts();
      else if (activeTab === 'defaulters') fetchDefaulters();
    } catch (error) {
      alert("Error recording payment.");
    }
  };

  const handlePostFee = async () => {
    try {
      await FeeApiService.postFee(selectedEntity.entityId || selectedEntity.id, 'DEBIT', postData.amount, postData.description);
      setShowPostModal(false);
      fetchLedger();
      if (activeTab === 'dashboard') fetchDashboardData();
      else if (activeTab === 'accounts') fetchAccounts();
      else if (activeTab === 'defaulters') fetchDefaulters();
    } catch (error) {
      alert("Error posting fee.");
    }
  };

  const getBalance = (entity) => {
    return entity.currentBalance || 0;
  };

  return (
    <div className="page-container" style={{maxWidth: '1400px'}}>
      {/* Header */}
      <div className="flex-between" style={{marginBottom: '32px'}}>
        <div>
          <h1 className="page-title">{t('fees_management')}</h1>
          <p style={{color: 'var(--color-text-muted)'}}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex-center" style={{gap: '12px'}}>
          <div className="glass flex-center" style={{padding: '8px 16px', borderRadius: '100px'}}>
            <Search size={18} style={{marginRight: '8px', color: 'var(--color-text-muted)'}} />
            <input 
              placeholder={t('search_accounts')} 
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{border: 'none', background: 'none', width: '200px'}} 
            />
          </div>
          {activeTab === 'accounts' && (
            <select 
              value={viewType} 
              onChange={e => { setViewType(e.target.value); setCurrentPage(1); }}
              className="glass"
              style={{padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--color-border)', fontWeight: 600}}
            >
              <option value="STUDENT">{t('students')}</option>
              <option value="TEACHER">{t('teachers')}</option>
            </select>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{display: 'flex', gap: '32px', borderBottom: '1px solid var(--color-border)', marginBottom: '32px'}}>
        {['dashboard', 'accounts', 'ledger', 'defaulters'].map(tab => (
          <button 
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab === 'accounts') setCurrentPage(1);
              if (tab === 'defaulters') setDefaulterPage(1);
            }}
            style={{
              padding: '12px 4px', fontSize: '16px', fontWeight: activeTab === tab ? '700' : '500',
              color: activeTab === tab ? 'var(--color-mustard-dark)' : 'var(--color-text-muted)',
              borderBottom: activeTab === tab ? '3px solid var(--color-mustard)' : '3px solid transparent'
            }}
          >
            {t(tab)}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div style={{animation: 'fadeIn 0.4s ease-out'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px'}}>
            <StatCard 
              icon={TrendingUp} label={t('total_collection')} 
              value={`₹${summary.collectedToday.toLocaleString()}`} 
              sub={t('collected_today')} color="white" bg="var(--color-mustard)" trend={12.5}
            />
            <StatCard 
              icon={AlertCircle} label={t('pending_arrears')} 
              value={`₹${summary.totalArrears.toLocaleString()}`} 
              sub={t('outstanding_dues')} color="var(--color-danger)"
              badge={{ label: t('high_priority'), color: 'rgba(255,59,48,0.1)' }}
            />
            <StatCard 
              icon={Users} label={t('student_accounts')} 
              value={summary.studentCount} sub={t('active_students')} 
              color="var(--color-info)"
            />
            <StatCard 
              icon={UserCheck} label={t('teacher_accounts')} 
              value={summary.teacherCount} sub={t('active_staff')} 
              color="var(--color-success)"
            />
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px'}}>
            <div className="glass" style={{padding: '24px', borderRadius: '20px'}}>
              <h3 style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Clock size={20} className="text-mustard" />
                {t('recent_transactions')}
              </h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {recentTransactions.length > 0 ? recentTransactions.slice(0, 6).map(tx => (
                  <div key={tx.id} className="flex-between" style={{padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', 
                        background: tx.type === 'CREDIT' ? 'rgba(46,213,115,0.1)' : 'rgba(255,59,48,0.1)',
                        color: tx.type === 'CREDIT' ? 'var(--color-success)' : 'var(--color-danger)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {tx.type === 'CREDIT' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div>
                        <div style={{fontSize: '14px', fontWeight: '600'}}>{tx.description}</div>
                        <div style={{fontSize: '12px', color: 'var(--color-text-muted)'}}>{new Date(tx.timestamp).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <div style={{fontSize: '14px', fontWeight: '700', color: tx.type === 'CREDIT' ? 'var(--color-success)' : 'var(--color-danger)'}}>
                        {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                      </div>
                      <div style={{fontSize: '11px', color: 'var(--color-text-muted)'}}>{tx.paymentMode || tx.type}</div>
                    </div>
                  </div>
                )) : <p style={{color: 'var(--color-text-muted)'}}>{t('no_recent_transactions')}</p>}
                <button 
                  onClick={() => setActiveTab('ledger')}
                  className="flex-center" 
                  style={{marginTop: '12px', background: 'none', border: 'none', color: 'var(--color-mustard-dark)', fontWeight: '600', cursor: 'pointer', gap: '4px'}}
                >
                  {t('view_all')} <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="glass" style={{padding: '24px', borderRadius: '20px'}}>
              <h3 style={{marginBottom: '20px'}}>{t('collection_by_mode')}</h3>
              {Object.entries(summary.collectionBreakdown).map(([mode, amount]) => (
                <div key={mode} className="flex-between" style={{marginBottom: '16px', padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <div style={{width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-mustard)'}}></div>
                    <span style={{fontWeight: '600', fontSize: '14px'}}>{mode}</span>
                  </div>
                  <span style={{fontWeight: '700', color: 'var(--color-text)'}}>₹{amount.toLocaleString()}</span>
                </div>
              ))}
              {Object.keys(summary.collectionBreakdown).length === 0 && <p style={{color: 'var(--color-text-muted)'}}>{t('no_data_available')}</p>}
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'accounts' || activeTab === 'defaulters') && (
        <div>
          <h3 style={{marginBottom: '20px'}}>{
            activeTab === 'defaulters' ? t('outstanding_arrears') : 
            (viewType === 'STUDENT' ? t('student_accounts') : t('teacher_accounts'))
          }</h3>
          <div className="glass" style={{borderRadius: '20px', overflow: 'hidden'}}>
            {(activeTab === 'defaulters' ? defaulters : accounts).map((acc, index) => {
              return (
                <div 
                  key={acc.entityId} 
                  onClick={() => handleEntitySelect(acc)}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '16px 24px', 
                    borderBottom: index === (activeTab === 'defaulters' ? defaulters : accounts).length - 1 ? 'none' : '1px solid var(--color-border)',
                    cursor: 'pointer'
                  }}
                  className="hover-bg"
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px', 
                    background: acc.currentBalance > 0 ? 'rgba(255,59,48,0.1)' : 'rgba(46,213,115,0.1)', 
                    color: acc.currentBalance > 0 ? 'var(--color-danger)' : 'var(--color-success)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', marginRight: '16px'
                  }}>
                    {acc.name ? acc.name.charAt(0) : '?'}
                  </div>
                  <div style={{flex: 1}}>
                    <h4 style={{fontSize: '16px', fontWeight: '600'}}>{acc.name || t('unknown')}</h4>
                    <p style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>
                      {acc.info || acc.entityId}
                    </p>
                  </div>
                  <div style={{textAlign: 'right', marginRight: '24px'}}>
                    <p style={{fontSize: '12px', color: 'var(--color-text-muted)'}}>{t('balance')}</p>
                    <p style={{fontSize: '18px', fontWeight: '700', color: acc.currentBalance > 0 ? 'var(--color-danger)' : 'var(--color-success)'}}>
                      ₹{acc.currentBalance.toLocaleString()}
                    </p>
                  </div>
                  <ChevronRight size={20} color="var(--color-text-muted)" />
                </div>
              );
            })}
            {(activeTab === 'defaulters' ? defaulters : accounts).length === 0 && (
              <div style={{padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)'}}>
                {t('no_records_found')}
              </div>
            )}
          </div>
          
          {activeTab === 'accounts' && (
            <Pagination 
              currentPage={currentPage} totalItems={totalAccounts} 
              pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} 
            />
          )}
          {activeTab === 'defaulters' && (
            <Pagination 
              currentPage={defaulterPage} totalItems={totalDefaulters} 
              pageSize={defaulterPageSize} onPageChange={setDefaulterPage} onPageSizeChange={setDefaulterPageSize} 
            />
          )}
        </div>
      )}

      {activeTab === 'ledger' && selectedEntity && (
        <div style={{animation: 'slideIn 0.4s ease-out'}}>
          <div className="flex-between" style={{marginBottom: '24px'}}>
            <button onClick={() => setActiveTab('accounts')} className="flex-center text-mustard" style={{fontWeight: '600'}}>
              <ChevronRight size={20} style={{transform: 'rotate(180deg)', marginRight: '4px'}} />
              {t('back_to_list')}
            </button>
            <div className="flex-center" style={{gap: '12px'}}>
              <button className="btn btn-secondary" onClick={() => setShowPostModal(true)}><Plus size={18} /> {t('post_fees')}</button>
              <button className="btn btn-primary" onClick={() => setShowPayModal(true)}><CreditCard size={18} /> {t('record_payment')}</button>
            </div>
          </div>

          <div className="card glass" style={{padding: '32px', borderRadius: '24px', marginBottom: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center'}}>
            <div>
              <h2 style={{fontSize: '28px', fontWeight: '800'}}>{selectedEntity.name}</h2>
              <p style={{color: 'var(--color-text-muted)'}}>{selectedEntity.entityType === 'STUDENT' ? t('student_id') : t('teacher_id')}: {selectedEntity.entityId}</p>
              <p style={{color: 'var(--color-text-muted)', fontSize: '14px'}}>{selectedEntity.info}</p>
            </div>
            <div style={{textAlign: 'right'}}>
              <p style={{fontSize: '14px', color: 'var(--color-text-muted)'}}>{t('current_balance')}</p>
              <h2 style={{fontSize: '36px', fontWeight: '800', color: selectedEntity.currentBalance > 0 ? 'var(--color-danger)' : 'var(--color-success)'}}>
                ₹{selectedEntity.currentBalance.toLocaleString()}
              </h2>
            </div>
          </div>

          <div className="glass" style={{borderRadius: '20px', overflow: 'hidden'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{textAlign: 'left', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--color-border)'}}>
                  <th style={{padding: '16px 24px'}}>{t('date')}</th>
                  <th style={{padding: '16px 24px'}}>{t('description')}</th>
                  <th style={{padding: '16px 24px', textAlign: 'right'}}>{t('debit')}</th>
                  <th style={{padding: '16px 24px', textAlign: 'right'}}>{t('credit')}</th>
                  <th style={{padding: '16px 24px', textAlign: 'center'}}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((tx) => (
                  <tr key={tx.id} style={{borderBottom: '1px solid var(--color-border)', opacity: tx.voided ? 0.5 : 1}}>
                    <td style={{padding: '16px 24px'}}>{new Date(tx.timestamp).toLocaleDateString()}</td>
                    <td style={{padding: '16px 24px'}}>
                      <div style={{fontWeight: '500'}}>{tx.description}</div>
                      {tx.voided && <span className="badge badge-error" style={{fontSize: '10px', padding: '2px 8px', borderRadius: '4px'}}>{t('voided')}</span>}
                    </td>
                    <td style={{padding: '16px 24px', textAlign: 'right', fontWeight: '600', color: 'var(--color-danger)'}}>{tx.type === 'DEBIT' ? `₹${tx.amount.toLocaleString()}` : ''}</td>
                    <td style={{padding: '16px 24px', textAlign: 'right', fontWeight: '600', color: 'var(--color-success)'}}>{tx.type === 'CREDIT' ? `₹${tx.amount.toLocaleString()}` : ''}</td>
                    <td style={{padding: '16px 24px', textAlign: 'center'}}>
                      <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                        <button className="icon-btn" onClick={() => window.print()} title={t('print_receipt')}><Printer size={18} /></button>
                        {!tx.voided && (
                          <button 
                            className="icon-btn" 
                            style={{color: 'var(--color-danger)'}} 
                            onClick={async () => {
                              if (window.confirm(t('confirm_void'))) {
                                try {
                                  await FeeApiService.voidTransaction(tx.id);
                                  fetchLedger();
                                  fetchDashboardData();
                                } catch (e) { alert("Error voiding transaction"); }
                              }
                            }}
                            title={t('void_transaction')}
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={ledgerPage} totalItems={totalLedgerItems} 
            pageSize={ledgerPageSize} onPageChange={setLedgerPage} onPageSizeChange={setLedgerPageSize} 
          />
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header">
              <h3>{t('record_payment')}</h3>
              <button className="icon-btn" onClick={() => setShowPayModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{marginBottom: '20px', padding: '16px', background: 'rgba(46,213,115,0.05)', borderRadius: '12px', border: '1px solid rgba(46,213,115,0.1)'}}>
                <p style={{fontSize: '14px', color: 'var(--color-text-muted)'}}>{t('receiving_from')}</p>
                <h4 style={{fontSize: '18px', fontWeight: '700'}}>{selectedEntity.name}</h4>
              </div>
              <div className="form-group">
                <label>{t('amount')}</label>
                <input 
                  type="number" value={payData.amount} 
                  onChange={e => setPayData({...payData, amount: e.target.value})} 
                  placeholder="0.00"
                  className="premium-input"
                />
              </div>
              <div className="form-group">
                <label>{t('payment_mode')}</label>
                <select 
                  value={payData.mode} 
                  onChange={e => setPayData({...payData, mode: e.target.value})}
                  className="premium-input"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI / ONLINE</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t('description')}</label>
                <input 
                  type="text" value={payData.description} 
                  onChange={e => setPayData({...payData, description: e.target.value})} 
                  placeholder={t('payment_description_placeholder')}
                  className="premium-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPayModal(false)}>{t('cancel')}</button>
              <button className="btn btn-primary" onClick={handleRecordPayment}>{t('confirm_payment')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Post Fee Modal */}
      {showPostModal && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header">
              <h3>{t('post_fees')}</h3>
              <button className="icon-btn" onClick={() => setShowPostModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>{t('amount')}</label>
                <input 
                  type="number" value={postData.amount} 
                  onChange={e => setPostData({...postData, amount: e.target.value})} 
                  placeholder="0.00"
                  className="premium-input"
                />
              </div>
              <div className="form-group">
                <label>{t('description')}</label>
                <input 
                  type="text" value={postData.description} 
                  onChange={e => setPostData({...postData, description: e.target.value})} 
                  placeholder="e.g. Tuition Fee - Q1"
                  className="premium-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPostModal(false)}>{t('cancel')}</button>
              <button className="btn btn-primary" onClick={handlePostFee}>{t('post_fee')}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.4); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-content {
          width: 90%; maxWidth: 500px; padding: 32px; borderRadius: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; marginBottom: 24px; }
        .modal-header h3 { margin: 0; fontSize: 20px; fontWeight: 800; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; marginTop: 32px; }
        .premium-input {
          width: 100%; padding: 12px 16px; borderRadius: 12px; border: 1px solid var(--color-border);
          background: rgba(255,255,255,0.5); fontSize: 16px; outline: none; transition: all 0.2s;
        }
        .premium-input:focus { border-color: var(--color-mustard); box-shadow: 0 0 0 4px rgba(212,175,55,0.1); }
        .form-group label { display: block; marginBottom: 8px; fontSize: 14px; fontWeight: 600; color: var(--color-text-muted); }
        .icon-btn { background: none; border: none; cursor: pointer; padding: 8px; borderRadius: 50%; transition: all 0.2s; }
        .icon-btn:hover { background: rgba(0,0,0,0.05); }
        .hover-bg:hover { background: rgba(212, 175, 55, 0.05); }
        .tabs-container button { transition: all 0.2s; cursor: pointer; background: none; border: none; }
        .tabs-container button:hover { color: var(--color-mustard) !important; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Fees;
