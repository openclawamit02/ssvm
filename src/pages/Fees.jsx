import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, Search, Filter, Printer, CreditCard, Clock, CheckCircle, 
  AlertCircle, ChevronRight, TrendingUp, Users, UserCheck, 
  ArrowUpRight, ArrowDownLeft, Wallet, BookOpen, Trash2, Edit2, X, RefreshCw
} from 'lucide-react';
import { FinanceService, STANDARD_ACCOUNTS } from '../services/FinanceService';
import StatCard from '../components/StatCard';
import Pagination from '../components/Pagination';
import Card from '../components/Card';
import '../components/Card.css';

const Fees = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, accounts, daybook, ledger
  const [loading, setLoading] = useState(true);
  
  // Ledger and search states
  const [accounts, setAccounts] = useState([]);
  const [allAccountsList, setAllAccountsList] = useState([]);
  const [accountTypeFilter, setAccountTypeFilter] = useState('ALL'); // ALL, STUDENT, TEACHER, EXPENSE, ASSET
  const [searchQuery, setSearchQuery] = useState('');
  const [dayBookTransactions, setDayBookTransactions] = useState([]);
  const [dayBookDate, setDayBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayBookSearch, setDayBookSearch] = useState('');
  
  // Ledger view states
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [ledgerTransactions, setLedgerTransactions] = useState([]);
  
  // Stats summary state
  const [finSummary, setFinSummary] = useState({
    cashBalance: 0,
    bankBalance: 0,
    totalCashReserves: 0,
    studentArrears: 0,
    totalExpenses: 0,
    collectedToday: 0,
    totalCollectionsAllTime: 0,
    expenseBreakdown: {},
    collectionModeBreakdown: { CASH: 0, UPI: 0, BANK_TRANSFER: 0, CHEQUE: 0 }
  });

  // Modal states
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    accountId: '',
    type: 'CREDIT', // DEBIT (dues/charges/expense), CREDIT (payment/receipts/income)
    amount: '',
    description: '',
    paymentMode: 'CASH',
    date: new Date().toISOString().split('T')[0]
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [editDesc, setEditDesc] = useState('');

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptTx, setReceiptTx] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load finance metrics & accounts
  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const [summary, filteredAccounts, unfilteredAccounts, daybook] = await Promise.all([
        FinanceService.getFinancialSummary(),
        FinanceService.getAllAccounts(
          accountTypeFilter === 'ALL' ? null : accountTypeFilter, 
          searchQuery
        ),
        FinanceService.getAllAccounts(null, ''),
        FinanceService.getDayBook(dayBookDate)
      ]);
      
      setFinSummary(summary);
      setAccounts(filteredAccounts);
      setAllAccountsList(unfilteredAccounts);
      setDayBookTransactions(daybook);
    } catch (e) {
      console.error('Error loading financial data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, [activeTab, accountTypeFilter, searchQuery, dayBookDate]);

  // Load single ledger if active
  const loadActiveLedger = async (accId) => {
    try {
      const acc = await FinanceService.getAccount(accId);
      if (acc) {
        setSelectedAccount(acc);
        const ledger = await FinanceService.getLedger(accId);
        setLedgerTransactions(ledger);
      }
    } catch (e) {
      console.error('Error loading ledger:', e);
    }
  };

  useEffect(() => {
    if (selectedAccount && activeTab === 'ledger') {
      loadActiveLedger(selectedAccount.entityId);
    }
  }, [selectedAccount, activeTab]);

  // Handle post transaction
  const handlePostTransaction = async (e) => {
    e.preventDefault();
    if (!transactionForm.accountId || !transactionForm.amount || !transactionForm.description) {
      alert('Please fill out all fields.');
      return;
    }
    try {
      setLoading(true);
      await FinanceService.postTransaction({
        accountId: transactionForm.accountId,
        type: transactionForm.type,
        amount: transactionForm.amount,
        description: transactionForm.description,
        paymentMode: transactionForm.paymentMode,
        date: transactionForm.date
      });
      setShowTransactionModal(false);
      
      // Reset form
      setTransactionForm({
        accountId: '',
        type: 'CREDIT',
        amount: '',
        description: '',
        paymentMode: 'CASH',
        date: new Date().toISOString().split('T')[0]
      });

      // Reload
      await loadFinanceData();
      if (selectedAccount) {
        await loadActiveLedger(selectedAccount.entityId);
      }
      alert('Transaction booked successfully!');
    } catch (err) {
      alert('Failed to book transaction: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Transaction
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editDesc.trim() || !editingTx) return;
    try {
      setLoading(true);
      await FinanceService.editTransaction(editingTx.id, editDesc);
      setShowEditModal(false);
      setEditingTx(null);
      
      // Reload
      await loadFinanceData();
      if (selectedAccount) {
        await loadActiveLedger(selectedAccount.entityId);
      }
    } catch (e) {
      alert('Failed to edit transaction: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Void
  const handleVoid = async (txId) => {
    if (!window.confirm('Are you sure you want to VOID/REVERSE this transaction? This will automatically offset and adjust all ledger balances.')) return;
    try {
      setLoading(true);
      await FinanceService.voidTransaction(txId);
      
      // Reload
      await loadFinanceData();
      if (selectedAccount) {
        await loadActiveLedger(selectedAccount.entityId);
      }
      alert('Transaction voided successfully. Ledgers updated.');
    } catch (e) {
      alert('Failed to void transaction: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Switch to Ledger view for an account
  const handleSelectAccount = (acc) => {
    setSelectedAccount(acc);
    setActiveTab('ledger');
  };

  // Open transaction modal with predefined values
  const openPostModal = (type = 'CREDIT', accId = '', paymentMode = 'CASH', desc = '') => {
    setTransactionForm({
      accountId: accId,
      type,
      amount: '',
      description: desc,
      paymentMode,
      date: new Date().toISOString().split('T')[0]
    });
    setShowTransactionModal(true);
  };

  // Filter daybook locally on search
  const filteredDayBook = dayBookTransactions.filter(tx => 
    tx.id.toLowerCase().includes(dayBookSearch.toLowerCase()) ||
    tx.accountName.toLowerCase().includes(dayBookSearch.toLowerCase()) ||
    tx.description.toLowerCase().includes(dayBookSearch.toLowerCase()) ||
    (tx.paymentMode && tx.paymentMode.toLowerCase().includes(dayBookSearch.toLowerCase()))
  );

  // Pagination for accounts
  const indexOfLastAccount = currentPage * pageSize;
  const indexOfFirstAccount = indexOfLastAccount - pageSize;
  const currentAccounts = accounts.slice(indexOfFirstAccount, indexOfLastAccount);

  const getBalanceColor = (balance, type) => {
    if (type === 'STUDENT') {
      return balance > 0 ? 'var(--color-danger)' : 'var(--color-success)'; // Positive balance = student owes (debt)
    }
    if (type === 'EXPENSE') {
      return 'var(--color-mustard-dark)'; // Expenses are accumulated debits
    }
    if (type === 'ASSET') {
      return balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
    }
    if (type === 'TEACHER') {
      return balance > 0 ? 'var(--color-danger)' : 'var(--color-success)'; // School owes teacher (credit balance)
    }
    return 'var(--color-text-main)';
  };

  const getBalanceLabel = (balance, type) => {
    if (type === 'STUDENT') {
      return balance > 0 ? `₹${balance.toLocaleString()} (Due)` : balance < 0 ? `₹${Math.abs(balance).toLocaleString()} (Prepaid)` : '₹0.00';
    }
    if (type === 'TEACHER') {
      return balance > 0 ? `₹${balance.toLocaleString()} (Owed)` : balance < 0 ? `₹${Math.abs(balance).toLocaleString()} (Advance Paid)` : '₹0.00';
    }
    return `₹${balance.toLocaleString()}`;
  };

  return (
    <div className="page-container" style={{ maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '4px', fontSize: '32px' }}>{t('fees')} & Finance Ledger</h1>
          <p style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {new Date().toLocaleDateString(i18n.language === 'or' ? 'or-IN' : i18n.language === 'hi' ? 'hi-IN' : 'en-IN', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => loadFinanceData()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={16} /> Sync Live
          </button>
          <button className="btn btn-primary" onClick={() => openPostModal('CREDIT')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={18} /> Record Entry
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--color-border)', marginBottom: '32px', overflowX: 'auto' }}>
        {[
          { id: 'dashboard', label: 'Finance Dashboard', icon: Wallet },
          { id: 'accounts', label: 'Chart of Accounts', icon: Users },
          { id: 'daybook', label: 'Day Book Ledger', icon: BookOpen },
          { id: 'ledger', label: 'General Ledger Account', icon: Clock, hidden: !selectedAccount }
        ].map(tab => {
          if (tab.hidden) return null;
          const Icon = tab.icon;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 4px', fontSize: '15px', fontWeight: activeTab === tab.id ? '700' : '500',
                color: activeTab === tab.id ? 'var(--color-mustard-dark)' : 'var(--color-text-muted)',
                borderBottom: activeTab === tab.id ? '3px solid var(--color-mustard)' : '3px solid transparent',
                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Dashboard View */}
      {activeTab === 'dashboard' && (
        <div style={{ animation: 'fadeIn 0.35s ease-out' }}>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <StatCard 
              icon={TrendingUp} label="Total Cash Reserves" 
              value={`₹${finSummary.totalCashReserves.toLocaleString()}`} 
              sub={`Cash: ₹${finSummary.cashBalance.toLocaleString()} | Bank: ₹${finSummary.bankBalance.toLocaleString()}`} 
              color="white" bg="var(--color-mustard)"
            />
            <StatCard 
              icon={AlertCircle} label="Outstanding Fee Arrears" 
              value={`₹${finSummary.studentArrears.toLocaleString()}`} 
              sub="Uncollected student fees" 
              color="var(--color-danger)"
              badge={{ label: 'Outstanding Dues', color: 'rgba(255,59,48,0.1)', textColor: 'var(--color-danger)' }}
            />
            <StatCard 
              icon={Users} label="Fee Collected Today" 
              value={`₹${finSummary.collectedToday.toLocaleString()}`} 
              sub="Real-time collection today" 
              color="var(--color-success)"
            />
            <StatCard 
              icon={UserCheck} label="Administrative Expenses" 
              value={`₹${finSummary.totalExpenses.toLocaleString()}`} 
              sub="Total school spending" 
              color="var(--color-mustard-dark)"
            />
          </div>

          {/* Quick Actions Panel */}
          <div className="glass" style={{ padding: '24px 28px', borderRadius: '20px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Administrative Quick Accounting Tools</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0 }}>Rapidly book school general transactions into the ledger</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => openPostModal('CREDIT', '', 'CASH', 'Tuition Fee Collection')} style={{ fontSize: '14px', padding: '10px 18px' }}>
                <ArrowDownLeft size={16} /> Collect Fees
              </button>
              <button className="btn btn-secondary" onClick={() => openPostModal('DEBIT', 'expense_utilities', 'BANK_TRANSFER', 'Paid Electricity Bill')} style={{ fontSize: '14px', padding: '10px 18px', color: 'var(--color-danger)' }}>
                <ArrowUpRight size={16} /> Record Expense
              </button>
              <button className="btn btn-secondary" onClick={() => openPostModal('DEBIT', 'expense_salaries', 'BANK_TRANSFER', 'Staff Salaries Payout')} style={{ fontSize: '14px', padding: '10px 18px' }}>
                <UserCheck size={16} /> Salary Payout
              </button>
              <button className="btn btn-primary" onClick={() => {
                if (window.confirm('Are you sure you want to Post Monthly Class Fees of ₹1,200 to all Student Accounts?')) {
                  // Standard fee posting routine
                  setLoading(true);
                  const postClassFees = async () => {
                    try {
                      const allStudents = await FinanceService.getAllAccounts('STUDENT');
                      let count = 0;
                      for (const s of allStudents) {
                        await FinanceService.postTransaction({
                          accountId: s.entityId,
                          type: 'DEBIT',
                          amount: 1200,
                          description: 'Monthly Tuition Fee - May 2026'
                        });
                        count++;
                      }
                      alert(`Successfully posted ₹1,200 fees to ${count} student accounts!`);
                      await loadFinanceData();
                    } catch (e) {
                      alert('Error posting fees: ' + e.message);
                    } finally {
                      setLoading(false);
                    }
                  };
                  postClassFees();
                }
              }} style={{ fontSize: '14px', padding: '10px 18px' }}>
                <Plus size={16} /> Post Class Fees
              </button>
            </div>
          </div>

          {/* Central Analytics Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '28px' }}>
            {/* Recent Day Book Entries */}
            <div className="glass" style={{ padding: '24px', borderRadius: '24px' }}>
              <div className="flex-between" style={{ marginBottom: '20px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 700 }}>
                  <Clock size={18} className="text-mustard" />
                  Day Book Summary (Today)
                </h3>
                <button onClick={() => setActiveTab('daybook')} className="text-mustard" style={{ fontSize: '13px', fontWeight: 600 }}>
                  View Full Day Book
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '220px' }}>
                {dayBookTransactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex-between" style={{ padding: '12px', background: 'rgba(255,255,255,0.4)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.02)', opacity: tx.voided ? 0.5 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', 
                        background: tx.type === 'DEBIT' ? 'rgba(255,59,48,0.1)' : 'rgba(52,199,89,0.1)',
                        color: tx.type === 'DEBIT' ? 'var(--color-danger)' : 'var(--color-success)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {tx.type === 'DEBIT' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.description}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{tx.accountName} • {tx.paymentMode || tx.type}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: tx.type === 'DEBIT' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        {tx.type === 'DEBIT' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                      </span>
                      {tx.voided && <div style={{ fontSize: '9px', color: 'var(--color-danger)', fontWeight: 700 }}>VOIDED</div>}
                    </div>
                  </div>
                ))}
                {dayBookTransactions.length === 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                    No ledger transactions recorded today.
                  </div>
                )}
              </div>
            </div>

            {/* School Expenses Chart/List */}
            <div className="glass" style={{ padding: '24px', borderRadius: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>School General Expenses Breakdown</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '220px' }}>
                {Object.entries(finSummary.expenseBreakdown).map(([name, amount]) => {
                  const percentage = finSummary.totalExpenses > 0 ? (amount / finSummary.totalExpenses) * 100 : 0;
                  return (
                    <div key={name}>
                      <div className="flex-between" style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                        <span>{name}</span>
                        <span style={{ color: 'var(--color-text-main)' }}>₹{amount.toLocaleString()} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.04)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', background: 'var(--color-mustard)', borderRadius: '10px' }}></div>
                      </div>
                    </div>
                  );
                })}
                {finSummary.totalExpenses === 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                    No administrative expense records accrued yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart of Accounts View */}
      {activeTab === 'accounts' && (
        <div style={{ animation: 'fadeIn 0.35s ease-out' }}>
          {/* Filters and search */}
          <div className="glass" style={{ padding: '16px 20px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'All Accounts' },
                { id: 'STUDENT', label: 'Student Fees' },
                { id: 'TEACHER', label: 'Teacher Salaries' },
                { id: 'EXPENSE', label: 'General Expenses' },
                { id: 'ASSET', label: 'Cash & Bank' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setAccountTypeFilter(opt.id); setCurrentPage(1); }}
                  style={{
                    padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    background: accountTypeFilter === opt.id ? 'var(--color-mustard)' : 'rgba(0,0,0,0.04)',
                    color: accountTypeFilter === opt.id ? 'white' : 'var(--color-text-muted)'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search accounts by name/ID..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ padding: '8px 12px 8px 36px', borderRadius: '10px', fontSize: '14px', border: '1px solid var(--color-border)', width: '100%' }}
              />
            </div>
          </div>

          {/* Accounts Grid / Table */}
          <Card padding="0">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Account ID</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Account Name</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Account Type</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Linked Details</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'right' }}>Current Balance</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAccounts.map(acc => (
                    <tr key={acc.entityId} style={{ borderBottom: '1px solid var(--color-border)' }} className="dir-row">
                      <td style={{ padding: '16px 20px', fontWeight: 600, fontSize: '14px' }}>
                        {acc.entityId.length > 15 ? `${acc.entityId.substring(0, 10)}...` : acc.entityId}
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(225,173,1,0.12)', color: 'var(--color-mustard-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                            {acc.name.charAt(0)}
                          </div>
                          {acc.name}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                          background: acc.entityType === 'STUDENT' ? 'rgba(0,122,255,0.1)' : acc.entityType === 'TEACHER' ? 'rgba(52,199,89,0.1)' : acc.entityType === 'EXPENSE' ? 'rgba(255,59,48,0.1)' : 'rgba(212,175,55,0.12)',
                          color: acc.entityType === 'STUDENT' ? '#007AFF' : acc.entityType === 'TEACHER' ? 'var(--color-success)' : acc.entityType === 'EXPENSE' ? 'var(--color-danger)' : 'var(--color-mustard-dark)'
                        }}>
                          {acc.entityType}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        {acc.info || 'School General Ledger'}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 800, color: getBalanceColor(acc.currentBalance, acc.entityType) }}>
                        {getBalanceLabel(acc.currentBalance, acc.entityType)}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button onClick={() => handleSelectAccount(acc)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}>
                            View Ledger <ChevronRight size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentAccounts.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        No ledger accounts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {accounts.length > pageSize && (
              <div style={{ padding: '10px 20px' }}>
                <Pagination 
                  currentPage={currentPage} 
                  totalItems={accounts.length} 
                  pageSize={pageSize} 
                  onPageChange={setCurrentPage} 
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Day Book View */}
      {activeTab === 'daybook' && (
        <div style={{ animation: 'fadeIn 0.35s ease-out' }}>
          {/* Controls */}
          <div className="glass" style={{ padding: '20px 28px', borderRadius: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '6px' }}>Filter by Date</label>
              <input 
                type="date" 
                value={dayBookDate} 
                onChange={e => setDayBookDate(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
              />
            </div>
            
            <div style={{ flex: '2 1 300px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '6px' }}>Search Transactions</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Filter by receipt #, account, mode, description..." 
                  value={dayBookSearch}
                  onChange={e => setDayBookSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '14px' }}
                />
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <Card padding="0">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Receipt/Tx ID</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Timestamp</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Account Name</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Description</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Payment Mode</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'right' }}>Debit (Out)</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'right' }}>Credit (In)</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDayBook.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--color-border)', opacity: tx.voided ? 0.5 : 1 }}>
                      <td style={{ padding: '16px 20px', fontWeight: 600, fontSize: '13px' }}>
                        {tx.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 600 }}>
                        {tx.accountName}
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '14px' }}>
                        {tx.description}
                        {tx.voided && (
                          <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 800, color: 'var(--color-danger)', background: 'rgba(255,59,48,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                            VOIDED
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        {tx.paymentMode || 'NONE'}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 700, color: 'var(--color-danger)' }}>
                        {tx.type === 'DEBIT' ? `₹${tx.amount.toLocaleString()}` : ''}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 700, color: 'var(--color-success)' }}>
                        {tx.type === 'CREDIT' ? `₹${tx.amount.toLocaleString()}` : ''}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            className="icon-btn" 
                            title="View Receipt"
                            onClick={() => { setReceiptTx(tx); setShowReceiptModal(true); }}
                          >
                            <Printer size={16} />
                          </button>
                          {!tx.voided && (
                            <>
                              <button 
                                className="icon-btn" 
                                title="Edit Description"
                                onClick={() => { setEditingTx(tx); setEditDesc(tx.description); setShowEditModal(true); }}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                className="icon-btn text-danger" 
                                title="Void Entry"
                                onClick={() => handleVoid(tx.id)}
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDayBook.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        No transactions recorded for {dayBookDate}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* General Ledger Account View */}
      {activeTab === 'ledger' && selectedAccount && (
        <div style={{ animation: 'slideIn 0.35s ease-out' }}>
          {/* Back button and local posting */}
          <div className="flex-between" style={{ marginBottom: '24px' }}>
            <button onClick={() => setActiveTab('accounts')} className="flex-center text-mustard" style={{ fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
              <ChevronRight size={20} style={{ transform: 'rotate(180deg)', marginRight: '4px' }} />
              Back to Accounts
            </button>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              {selectedAccount.entityType === 'STUDENT' && (
                <>
                  <button className="btn btn-secondary" onClick={() => openPostModal('DEBIT', selectedAccount.entityId, 'NONE', 'Monthly Fees Assessment')}>
                    <Plus size={16} /> Bill Fee
                  </button>
                  <button className="btn btn-primary" onClick={() => openPostModal('CREDIT', selectedAccount.entityId, 'CASH', 'Fees Payment')}>
                    <CreditCard size={16} /> Record Payment
                  </button>
                </>
              )}
              {selectedAccount.entityType === 'TEACHER' && (
                <>
                  <button className="btn btn-secondary" onClick={() => openPostModal('CREDIT', selectedAccount.entityId, 'NONE', 'Salary Accrual - Current Month')}>
                    <Plus size={16} /> Accrue Salary
                  </button>
                  <button className="btn btn-primary" onClick={() => openPostModal('DEBIT', selectedAccount.entityId, 'BANK_TRANSFER', 'Salary Payout')}>
                    <CreditCard size={16} /> Payout Salary
                  </button>
                </>
              )}
              {selectedAccount.entityType === 'EXPENSE' && (
                <button className="btn btn-primary" onClick={() => openPostModal('DEBIT', selectedAccount.entityId, 'BANK_TRANSFER', `Paid ${selectedAccount.name}`)}>
                  <Plus size={16} /> Book Expense Payout
                </button>
              )}
            </div>
          </div>

          {/* Account Detail Card */}
          <div className="card glass" style={{ padding: '32px', borderRadius: '24px', marginBottom: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', alignItems: 'center', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-mustard-dark)', textTransform: 'uppercase', tracking: '0.1em' }}>
                Account General Ledger
              </span>
              <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0' }}>{selectedAccount.name}</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', margin: 0 }}>
                Account ID: {selectedAccount.entityId} • Type: {selectedAccount.entityType}
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                {selectedAccount.info || 'School General Ledger'}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Ledger Balance</span>
              <h2 style={{ fontSize: '36px', fontWeight: 900, margin: 0, color: getBalanceColor(selectedAccount.currentBalance, selectedAccount.entityType) }}>
                {getBalanceLabel(selectedAccount.currentBalance, selectedAccount.entityType)}
              </h2>
            </div>
          </div>

          {/* Ledger Table */}
          <Card padding="0">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Date</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Transaction ID</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Description</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Mode</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'right' }}>Debit (Out)</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'right' }}>Credit (In)</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'right' }}>Running Balance</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerTransactions.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--color-border)', opacity: tx.voided ? 0.5 : 1 }}>
                      <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                        {new Date(tx.timestamp).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: 600, fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        {tx.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                        {tx.description}
                        {tx.voided && (
                          <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 800, color: 'var(--color-danger)', background: 'rgba(255,59,48,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                            VOIDED
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        {tx.paymentMode || 'NONE'}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600, color: 'var(--color-danger)' }}>
                        {tx.type === 'DEBIT' ? `₹${tx.amount.toLocaleString()}` : ''}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600, color: 'var(--color-success)' }}>
                        {tx.type === 'CREDIT' ? `₹${tx.amount.toLocaleString()}` : ''}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 700 }}>
                        ₹{tx.runningBalance.toLocaleString()}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            className="icon-btn" 
                            title="Print Invoice"
                            onClick={() => { setReceiptTx(tx); setShowReceiptModal(true); }}
                          >
                            <Printer size={16} />
                          </button>
                          {!tx.voided && (
                            <>
                              <button 
                                className="icon-btn" 
                                title="Edit Entry"
                                onClick={() => { setEditingTx(tx); setEditDesc(tx.description); setShowEditModal(true); }}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                className="icon-btn text-danger" 
                                title="Void Entry"
                                onClick={() => handleVoid(tx.id)}
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {ledgerTransactions.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        No transactions recorded on this account ledger yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Post/Record Entry Modal */}
      {showTransactionModal && (
        <div className="modal-overlay">
          <div className="modal-content glass" style={{ width: '90%', maxWidth: '520px', padding: '32px', borderRadius: '24px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Record Financial Journal Entry</h3>
              <button className="icon-btn" onClick={() => setShowTransactionModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handlePostTransaction}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>Select Account Ledger</label>
                <select 
                  required
                  value={transactionForm.accountId}
                  onChange={e => {
                    const acc = allAccountsList.find(a => a.entityId === e.target.value);
                    let defType = 'CREDIT';
                    if (acc && acc.entityType === 'EXPENSE') defType = 'DEBIT';
                    setTransactionForm({ ...transactionForm, accountId: e.target.value, type: defType });
                  }}
                  className="premium-input"
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', outline: 'none' }}
                >
                  <option value="">Select Ledger Account...</option>
                  <optgroup label="School Cash & Bank Reserves">
                    <option value="admin_cash">Cash in Hand Ledger</option>
                    <option value="admin_bank">School Bank Account Ledger</option>
                  </optgroup>
                  <optgroup label="School Expense Ledgers">
                    {allAccountsList.filter(a => a.entityType === 'EXPENSE').map(acc => (
                      <option key={acc.entityId} value={acc.entityId}>{acc.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Student Fee Accounts">
                    {allAccountsList.filter(a => a.entityType === 'STUDENT').map(a => (
                      <option key={a.entityId} value={a.entityId}>Student: {a.name} ({a.info?.split('|')[0]?.trim()})</option>
                    ))}
                  </optgroup>
                  <optgroup label="Teacher Salaries & Dues">
                    {allAccountsList.filter(a => a.entityType === 'TEACHER').map(a => (
                      <option key={a.entityId} value={a.entityId}>Teacher: {a.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>Transaction Type</label>
                  <select 
                    value={transactionForm.type}
                    onChange={e => setTransactionForm({ ...transactionForm, type: e.target.value })}
                    className="premium-input"
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)' }}
                  >
                    <option value="CREDIT">Credit (Receipt / Payment In)</option>
                    <option value="DEBIT">Debit (Charge / Expense Out)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>Amount (₹)</label>
                  <input 
                    required
                    type="number"
                    min="1"
                    placeholder="0.00"
                    value={transactionForm.amount}
                    onChange={e => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                    className="premium-input"
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>Payment Mode</label>
                  <select 
                    value={transactionForm.paymentMode}
                    onChange={e => setTransactionForm({ ...transactionForm, paymentMode: e.target.value })}
                    className="premium-input"
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)' }}
                  >
                    <option value="CASH">Cash in Hand</option>
                    <option value="UPI">UPI / Online App</option>
                    <option value="BANK_TRANSFER">Bank Transfer (SBI)</option>
                    <option value="CHEQUE">Cheque Payout</option>
                    <option value="NONE">Journal Adjustment (No cash impact)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>Transaction Date</label>
                  <input 
                    type="date"
                    value={transactionForm.date}
                    onChange={e => setTransactionForm({ ...transactionForm, date: e.target.value })}
                    className="premium-input"
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>Description / Particulars</label>
                <input 
                  required
                  type="text"
                  placeholder="e.g. Paid Electricity Bill - May, Fees received Q1"
                  value={transactionForm.description}
                  onChange={e => setTransactionForm({ ...transactionForm, description: e.target.value })}
                  className="premium-input"
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransactionModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Book Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Description Modal */}
      {showEditModal && editingTx && (
        <div className="modal-overlay">
          <div className="modal-content glass" style={{ width: '90%', maxWidth: '420px', padding: '32px', borderRadius: '24px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Edit Transaction Particulars</h3>
              <button className="icon-btn" onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>Particulars Description</label>
                <input 
                  required
                  type="text" 
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="premium-input"
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)' }}
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice/Receipt Printing Modal */}
      {showReceiptModal && receiptTx && (
        <div className="modal-overlay">
          <div className="modal-content glass" style={{ width: '90%', maxWidth: '600px', padding: '0', borderRadius: '24px', overflow: 'hidden' }}>
            {/* Top header not printed */}
            <div style={{ padding: '20px 24px', background: 'var(--color-mustard)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
              <h3 style={{ margin: 0, fontWeight: 800 }}>Print Transaction Receipt</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn" onClick={() => window.print()} style={{ background: 'white', color: 'var(--color-mustard-dark)', padding: '6px 12px', fontSize: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Printer size={14} /> Print PDF
                </button>
                <button onClick={() => setShowReceiptModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}><X size={20} /></button>
              </div>
            </div>

            {/* Receipt Content Area to Print */}
            <div id="print-area" style={{ padding: '40px', background: 'white', color: 'black', fontFamily: 'serif' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px double #000', paddingBottom: '16px', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Saraswati Shishu Vidya Mandir</h1>
                <p style={{ margin: '0', fontSize: '13px', fontStyle: 'italic' }}>Khariar, Nuapada, Odisha - 766107</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', fontWeight: 'bold' }}>OFFICIAL TRANSACTION RECEIPT / INVOICE</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '14px' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0' }}><strong>Receipt No:</strong> {receiptTx.id.toUpperCase()}</p>
                  <p style={{ margin: '0 0 4px 0' }}><strong>Date:</strong> {new Date(receiptTx.timestamp).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}</p>
                  <p style={{ margin: '0' }}><strong>Account Ledger:</strong> {receiptTx.accountName}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 4px 0' }}><strong>Account ID:</strong> {receiptTx.accountId}</p>
                  <p style={{ margin: '0 0 4px 0' }}><strong>Account Type:</strong> {receiptTx.accountType}</p>
                  <p style={{ margin: '0' }}><strong>Payment Mode:</strong> {receiptTx.paymentMode || 'NONE'}</p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid black', borderTop: '1px solid black', textAlign: 'left' }}>
                    <th style={{ padding: '8px 0' }}>Particulars / Description</th>
                    <th style={{ padding: '8px 0', textAlign: 'center' }}>Type</th>
                    <th style={{ padding: '8px 0', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px dashed #ccc' }}>
                    <td style={{ padding: '12px 0', fontSize: '15px' }}>{receiptTx.description}</td>
                    <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: 'bold' }}>{receiptTx.type}</td>
                    <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>₹{receiptTx.amount.toLocaleString()}.00</td>
                  </tr>
                  <tr style={{ borderBottom: '2px solid black' }}>
                    <td style={{ padding: '12px 0' }} colSpan="2"><strong>NET TRANSACTION TOTAL</strong></td>
                    <td style={{ padding: '12px 0', textAlign: 'right', fontSize: '18px', fontWeight: 'bold' }}>₹{receiptTx.amount.toLocaleString()}.00</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '64px', fontSize: '13px' }}>
                <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid black', paddingTop: '6px' }}>
                  Receiver Signature
                </div>
                <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid black', paddingTop: '6px' }}>
                  Authorized Officer
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '48px', fontSize: '11px', color: '#666', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                Thank you for your support. This is a computer-generated receipt and requires no manual seal if signed.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styled Modals CSS */}
      <style>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.4); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-content {
          box-shadow: 0 20px 40px rgba(0,0,0,0.25);
          animation: modalFade 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-input {
          width: 100%; padding: 12px 16px; borderRadius: 12px; border: 1px solid var(--color-border);
          background: rgba(255,255,255,0.6); fontSize: 15px; outline: none; transition: all 0.2s;
        }
        .premium-input:focus { border-color: var(--color-mustard); box-shadow: 0 0 0 3px rgba(212,175,55,0.15); background: white; }
        .icon-btn { background: none; border: none; cursor: pointer; padding: 6px; borderRadius: 50%; transition: all 0.2s; color: var(--color-text-muted); display: inline-flex; }
        .icon-btn:hover { background: rgba(0,0,0,0.06); color: var(--color-text-main); }
        .hover-bg:hover { background: rgba(212, 175, 55, 0.05); }
        .dir-row:hover { background: rgba(212, 175, 55, 0.03); }
        
        @keyframes modalFade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }

        /* Print styling rules */
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Fees;
