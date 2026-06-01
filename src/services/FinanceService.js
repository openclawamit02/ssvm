import { collection, doc, getDocs, getDoc, setDoc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { StudentService, TeacherService } from './db';

// Standard general accounts
export const STANDARD_ACCOUNTS = {
  admin_cash: { id: 'admin_cash', name: 'Cash in Hand', type: 'ASSET', info: 'Primary Cash Ledger' },
  admin_bank: { id: 'admin_bank', name: 'School Bank Account', type: 'ASSET', info: 'State Bank of India A/C' },
  expense_utilities: { id: 'expense_utilities', name: 'Electricity & Water', type: 'EXPENSE', info: 'Utility Expenses' },
  expense_salaries: { id: 'expense_salaries', name: 'Salaries & Staff Wages', type: 'EXPENSE', info: 'Teacher & Staff Compensation' },
  expense_rent: { id: 'expense_rent', name: 'School Rent', type: 'EXPENSE', info: 'Building Rental' },
  expense_stationery: { id: 'expense_stationery', name: 'Books & Office Stationery', type: 'EXPENSE', info: 'Educational Material & Supplies' },
  expense_maintenance: { id: 'expense_maintenance', name: 'Repairs & Maintenance', type: 'EXPENSE', info: 'Infrastructure Maintenance' },
  expense_misc: { id: 'expense_misc', name: 'Miscellaneous Expenses', type: 'EXPENSE', info: 'Sundry and General Expenses' },
};

export const FinanceService = {
  // Initialize standard asset and expense accounts
  initializeStandardAccounts: async () => {
    try {
      const batch = writeBatch(db);
      for (const [key, acc] of Object.entries(STANDARD_ACCOUNTS)) {
        const docRef = doc(db, 'financial_accounts', acc.id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          batch.set(docRef, {
            entityId: acc.id,
            name: acc.name,
            entityType: acc.type,
            info: acc.info,
            currentBalance: 0,
            createdAt: new Date().toISOString()
          });
        }
      }
      await batch.commit();
      console.log('Standard accounts initialized successfully.');
    } catch (e) {
      console.error('Error initializing standard accounts:', e);
    }
  },

  // Get or Create financial account for students/teachers
  getOrCreateAccount: async (entityId, name, type, info = '') => {
    try {
      const docRef = doc(db, 'financial_accounts', entityId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Keep name and info in sync
        if (data.name !== name || data.info !== info) {
          await updateDoc(docRef, { name, info });
          return { ...data, name, info };
        }
        return { id: docSnap.id, ...data };
      } else {
        const newAcc = {
          entityId,
          name,
          entityType: type, // 'STUDENT' or 'TEACHER'
          info,
          currentBalance: 0,
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, newAcc);
        return { id: entityId, ...newAcc };
      }
    } catch (e) {
      console.error(`Error in getOrCreateAccount for ${entityId}:`, e);
      throw e;
    }
  },

  // Get single account
  getAccount: async (accountId) => {
    const docRef = doc(db, 'financial_accounts', accountId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
  },

  // Get all ledger accounts (with syncing for directory students/teachers)
  getAllAccounts: async (typeFilter = null, searchQuery = '') => {
    try {
      await FinanceService.initializeStandardAccounts();

      // Get financial accounts from Firestore
      const accRef = collection(db, 'financial_accounts');
      const qSnapshot = await getDocs(accRef);
      const accountsList = qSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      // Fetch active students and teachers to ensure they have accounts in ledger
      const [students, teachers] = await Promise.all([
        StudentService.getAll().catch(() => []),
        TeacherService.getAll().catch(() => [])
      ]);

      const syncedAccounts = [];

      // Add/sync student accounts
      for (const student of students) {
        if (typeFilter && typeFilter !== 'STUDENT') continue;
        const exists = accountsList.find(a => a.entityId === student.id);
        const name = student.name;
        const info = `Class: ${student.class || student.studentClass || 'N/A'} | Father: ${student.fatherName || 'N/A'}`;
        
        if (exists) {
          // Sync changes
          if (exists.name !== name || exists.info !== info) {
            await updateDoc(doc(db, 'financial_accounts', student.id), { name, info });
            exists.name = name;
            exists.info = info;
          }
          syncedAccounts.push(exists);
        } else {
          const newAcc = await FinanceService.getOrCreateAccount(student.id, name, 'STUDENT', info);
          syncedAccounts.push(newAcc);
        }
      }

      // Add/sync teacher accounts
      for (const teacher of teachers) {
        if (typeFilter && typeFilter !== 'TEACHER') continue;
        const exists = accountsList.find(a => a.entityId === teacher.id);
        const name = teacher.name;
        const info = `Subjects: ${teacher.subjects || 'N/A'} | Qualification: ${teacher.qualification || 'N/A'}`;
        
        if (exists) {
          if (exists.name !== name || exists.info !== info) {
            await updateDoc(doc(db, 'financial_accounts', teacher.id), { name, info });
            exists.name = name;
            exists.info = info;
          }
          syncedAccounts.push(exists);
        } else {
          const newAcc = await FinanceService.getOrCreateAccount(teacher.id, name, 'TEACHER', info);
          syncedAccounts.push(newAcc);
        }
      }

      // Add standard general accounts (ASSET, EXPENSE)
      for (const acc of accountsList) {
        if (acc.entityType === 'ASSET' || acc.entityType === 'EXPENSE') {
          if (typeFilter && typeFilter !== acc.entityType) continue;
          syncedAccounts.push(acc);
        }
      }

      // Apply local search query filtering
      let result = syncedAccounts;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(a => 
          a.name.toLowerCase().includes(query) || 
          a.entityId.toLowerCase().includes(query) ||
          (a.info && a.info.toLowerCase().includes(query))
        );
      }

      return result;
    } catch (e) {
      console.error('Error fetching accounts:', e);
      throw e;
    }
  },

  // Record a transaction
  postTransaction: async ({ accountId, type, amount, description, paymentMode = 'NONE', date = null }) => {
    try {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) throw new Error('Invalid transaction amount');

      const batch = writeBatch(db);
      const timestamp = new Date().toISOString();
      const txDate = date || timestamp.split('T')[0];

      // 1. Fetch source account
      const sourceAccRef = doc(db, 'financial_accounts', accountId);
      const sourceAccSnap = await getDoc(sourceAccRef);
      if (!sourceAccSnap.exists()) throw new Error('Account does not exist');

      const sourceAcc = sourceAccSnap.data();
      let sourcePrevBalance = sourceAcc.currentBalance || 0;
      let sourceNewBalance = sourcePrevBalance;

      // Adjust primary account balance
      // STUDENT: Debit increases outstanding fee (dues), Credit decreases it (paid)
      // TEACHER: Credit increases outstanding salary owed by school, Debit decreases it (advance or payout)
      // EXPENSE: Debit increases spent amount
      // ASSET (Cash/Bank): Debit increases asset amount, Credit decreases it
      if (sourceAcc.entityType === 'STUDENT') {
        if (type === 'DEBIT') sourceNewBalance += numAmount; // charges due
        else if (type === 'CREDIT') sourceNewBalance -= numAmount; // payments received
      } else if (sourceAcc.entityType === 'TEACHER') {
        if (type === 'CREDIT') sourceNewBalance += numAmount; // salary accrued (payable)
        else if (type === 'DEBIT') sourceNewBalance -= numAmount; // paid out
      } else if (sourceAcc.entityType === 'EXPENSE') {
        if (type === 'DEBIT') sourceNewBalance += numAmount; // rent paid, electricity paid
        else if (type === 'CREDIT') sourceNewBalance -= numAmount;
      } else if (sourceAcc.entityType === 'ASSET') {
        if (type === 'DEBIT') sourceNewBalance += numAmount; // cash added
        else if (type === 'CREDIT') sourceNewBalance -= numAmount; // cash withdrawn/spent
      }

      // Update primary account
      batch.update(sourceAccRef, { 
        currentBalance: sourceNewBalance,
        updatedAt: timestamp
      });

      // Write primary transaction
      const primaryTxRef = doc(collection(db, 'financial_transactions'));
      const primaryTxId = primaryTxRef.id;
      const primaryTx = {
        accountId,
        accountName: sourceAcc.name,
        accountType: sourceAcc.entityType,
        type,
        amount: numAmount,
        description,
        paymentMode,
        timestamp,
        date: txDate,
        voided: false
      };
      batch.set(primaryTxRef, primaryTx);

      // 2. Automate double-entry offsetting transaction
      let offsetAccountId = null;
      let offsetType = null;
      let offsetDescription = '';

      if (sourceAcc.entityType === 'STUDENT' && type === 'CREDIT') {
        // Student paid fee -> cash or bank goes up!
        offsetAccountId = paymentMode === 'CASH' ? 'admin_cash' : 'admin_bank';
        offsetType = 'DEBIT'; // increases asset
        offsetDescription = `Fee Payment received from ${sourceAcc.name} (Receipt: ${primaryTxId.substring(0, 6).toUpperCase()})`;
      } else if (sourceAcc.entityType === 'TEACHER' && type === 'DEBIT') {
        // School paid teacher -> cash or bank goes down!
        offsetAccountId = paymentMode === 'CASH' ? 'admin_cash' : 'admin_bank';
        offsetType = 'CREDIT'; // reduces asset
        offsetDescription = `Salary Payout to ${sourceAcc.name} via ${paymentMode}`;
      } else if (sourceAcc.entityType === 'EXPENSE' && type === 'DEBIT') {
        // School spent money -> cash or bank goes down!
        offsetAccountId = paymentMode === 'CASH' ? 'admin_cash' : 'admin_bank';
        offsetType = 'CREDIT'; // reduces asset
        offsetDescription = `Expense Payment: ${description}`;
      }

      if (offsetAccountId) {
        const offsetAccRef = doc(db, 'financial_accounts', offsetAccountId);
        const offsetAccSnap = await getDoc(offsetAccRef);
        if (offsetAccSnap.exists()) {
          const offsetAcc = offsetAccSnap.data();
          let offsetPrevBalance = offsetAcc.currentBalance || 0;
          let offsetNewBalance = offsetPrevBalance;

          if (offsetType === 'DEBIT') offsetNewBalance += numAmount;
          else if (offsetType === 'CREDIT') offsetNewBalance -= numAmount;

          // Update offset account
          batch.update(offsetAccRef, { 
            currentBalance: offsetNewBalance,
            updatedAt: timestamp
          });

          // Write offsetting transaction
          const offsetTxRef = doc(collection(db, 'financial_transactions'));
          batch.set(offsetTxRef, {
            accountId: offsetAccountId,
            accountName: offsetAcc.name,
            accountType: offsetAcc.entityType,
            type: offsetType,
            amount: numAmount,
            description: offsetDescription,
            paymentMode,
            timestamp,
            date: txDate,
            offsetTxId: primaryTxId, // link them
            voided: false
          });

          // Link the offset into the primary transaction
          batch.update(primaryTxRef, { offsetTxId: offsetTxRef.id });
        }
      }

      await batch.commit();
      return { id: primaryTxId, ...primaryTx };
    } catch (e) {
      console.error('Error posting transaction:', e);
      throw e;
    }
  },

  // Edit an existing transaction's description
  editTransaction: async (txId, newDescription) => {
    try {
      const txRef = doc(db, 'financial_transactions', txId);
      const txSnap = await getDoc(txRef);
      if (!txSnap.exists()) throw new Error('Transaction not found');

      const txData = txSnap.data();
      if (txData.voided) throw new Error('Cannot edit voided transactions');

      const batch = writeBatch(db);
      batch.update(txRef, { description: newDescription, updatedAt: new Date().toISOString() });

      // If it has a linked double-entry, update it too
      if (txData.offsetTxId) {
        const offsetTxRef = doc(db, 'financial_transactions', txData.offsetTxId);
        const offsetTxSnap = await getDoc(offsetTxRef);
        if (offsetTxSnap.exists()) {
          const offsetTxData = offsetTxSnap.data();
          if (!offsetTxData.voided) {
            batch.update(offsetTxRef, { 
              description: `Offset [${txId.substring(0, 5)}]: ${newDescription}`,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }

      await batch.commit();
      return true;
    } catch (e) {
      console.error('Error editing transaction:', e);
      throw e;
    }
  },

  // Void/Reverse a transaction
  voidTransaction: async (txId) => {
    try {
      const batch = writeBatch(db);
      const timestamp = new Date().toISOString();

      // 1. Fetch primary transaction
      const txRef = doc(db, 'financial_transactions', txId);
      const txSnap = await getDoc(txRef);
      if (!txSnap.exists()) throw new Error('Transaction not found');
      
      const tx = txSnap.data();
      if (tx.voided) throw new Error('Transaction is already voided');

      // 2. Fetch primary account
      const accRef = doc(db, 'financial_accounts', tx.accountId);
      const accSnap = await getDoc(accRef);
      if (accSnap.exists()) {
        const acc = accSnap.data();
        let balance = acc.currentBalance || 0;

        // REVERSE THE OPERATION:
        // STUDENT: Debit added balance, Credit subtracted it. Reversing does the opposite!
        if (acc.entityType === 'STUDENT') {
          if (tx.type === 'DEBIT') balance -= tx.amount; // reverse fee post
          else if (tx.type === 'CREDIT') balance += tx.amount; // reverse fee payment
        } else if (acc.entityType === 'TEACHER') {
          if (tx.type === 'CREDIT') balance -= tx.amount; // reverse salary accrual
          else if (tx.type === 'DEBIT') balance += tx.amount; // reverse payout
        } else if (acc.entityType === 'EXPENSE') {
          if (tx.type === 'DEBIT') balance -= tx.amount; // reverse paid expense
          else if (tx.type === 'CREDIT') balance += tx.amount;
        } else if (acc.entityType === 'ASSET') {
          if (tx.type === 'DEBIT') balance -= tx.amount;
          else if (tx.type === 'CREDIT') balance += tx.amount;
        }

        batch.update(accRef, { currentBalance: balance, updatedAt: timestamp });
      }

      // Mark primary transaction as voided
      batch.update(txRef, { voided: true, voidedAt: timestamp });

      // 3. Revert Offset if it exists
      if (tx.offsetTxId) {
        const offsetTxRef = doc(db, 'financial_transactions', tx.offsetTxId);
        const offsetTxSnap = await getDoc(offsetTxRef);
        if (offsetTxSnap.exists()) {
          const offsetTx = offsetTxSnap.data();
          if (!offsetTx.voided) {
            const offsetAccRef = doc(db, 'financial_accounts', offsetTx.accountId);
            const offsetAccSnap = await getDoc(offsetAccRef);
            if (offsetAccSnap.exists()) {
              const offsetAcc = offsetAccSnap.data();
              let offsetBalance = offsetAcc.currentBalance || 0;

              if (offsetTx.type === 'DEBIT') offsetBalance -= offsetTx.amount;
              else if (offsetTx.type === 'CREDIT') offsetBalance += offsetTx.amount;

              batch.update(offsetAccRef, { currentBalance: offsetBalance, updatedAt: timestamp });
            }
            batch.update(offsetTxRef, { voided: true, voidedAt: timestamp });
          }
        }
      }

      await batch.commit();
      return true;
    } catch (e) {
      console.error('Error voiding transaction:', e);
      throw e;
    }
  },

  // Get ledger transactions for a single account
  getLedger: async (accountId) => {
    try {
      // Simple single-field query - no composite index needed
      const q = query(
        collection(db, 'financial_transactions'),
        where('accountId', '==', accountId)
      );
      const qSnapshot = await getDocs(q);
      
      // Sort client-side ascending by timestamp for running balance calculation
      const sorted = qSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

      let runningBalance = 0;
      const ledgerItems = sorted.map(tx => {
        if (!tx.voided) {
          const type = tx.type;
          const amt = tx.amount;

          if (tx.accountType === 'STUDENT') {
            if (type === 'DEBIT') runningBalance += amt;
            else if (type === 'CREDIT') runningBalance -= amt;
          } else if (tx.accountType === 'TEACHER') {
            if (type === 'CREDIT') runningBalance += amt;
            else if (type === 'DEBIT') runningBalance -= amt;
          } else if (tx.accountType === 'EXPENSE') {
            if (type === 'DEBIT') runningBalance += amt;
            else if (type === 'CREDIT') runningBalance -= amt;
          } else if (tx.accountType === 'ASSET') {
            if (type === 'DEBIT') runningBalance += amt;
            else if (type === 'CREDIT') runningBalance -= amt;
          }
        }
        return { ...tx, runningBalance };
      });

      // Return newest first for display
      return ledgerItems.reverse();
    } catch (e) {
      console.error(`Error loading ledger for ${accountId}:`, e);
      throw e;
    }
  },

  // Get Day Book (all transactions across the whole school)
  // No composite index needed - fetch all and filter/sort client-side
  getDayBook: async (dateFilter = null) => {
    try {
      const qSnapshot = await getDocs(collection(db, 'financial_transactions'));
      let txs = qSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter by date if provided
      if (dateFilter) {
        txs = txs.filter(tx => tx.date === dateFilter);
      }

      // Sort newest first
      txs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      return txs;
    } catch (e) {
      console.error('Error fetching Day Book:', e);
      throw e;
    }
  },

  // Get financial performance summary
  getFinancialSummary: async () => {
    try {
      await FinanceService.initializeStandardAccounts();

      const accRef = collection(db, 'financial_accounts');
      const qSnapshot = await getDocs(accRef);
      const accounts = qSnapshot.docs.map(d => d.data());

      // 1. Calculate Asset Balances
      const cashAcc = accounts.find(a => a.entityId === 'admin_cash');
      const bankAcc = accounts.find(a => a.entityId === 'admin_bank');

      const cashBalance = cashAcc ? (cashAcc.currentBalance || 0) : 0;
      const bankBalance = bankAcc ? (bankAcc.currentBalance || 0) : 0;
      const totalCashReserves = cashBalance + bankBalance;

      // 2. Outstanding Arrears (Students with positive balances owe money)
      const studentArrears = accounts
        .filter(a => a.entityType === 'STUDENT' && a.currentBalance > 0)
        .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

      // 3. Accumulated expenses
      const totalExpenses = accounts
        .filter(a => a.entityType === 'EXPENSE')
        .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

      // 4. Breakdown of expenses
      const expenseBreakdown = {};
      accounts
        .filter(a => a.entityType === 'EXPENSE')
        .forEach(a => {
          expenseBreakdown[a.name] = a.currentBalance || 0;
        });

      // 5. Fetch all transactions once, filter client-side (no composite index needed)
      const todayStr = new Date().toISOString().split('T')[0];
      const txRef = collection(db, 'financial_transactions');
      const allTxsSnapshot = await getDocs(txRef);
      const allTxs = allTxsSnapshot.docs.map(d => d.data());

      const todayTxs = allTxs.filter(tx => tx.date === todayStr && !tx.voided);

      const collectedToday = todayTxs
        .filter(tx => tx.accountType === 'STUDENT' && tx.type === 'CREDIT')
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);

      // 6. Mode Breakdown of collections today
      const collectionModeBreakdown = { CASH: 0, UPI: 0, BANK_TRANSFER: 0, CHEQUE: 0 };
      todayTxs
        .filter(tx => tx.accountType === 'STUDENT' && tx.type === 'CREDIT')
        .forEach(tx => {
          const mode = tx.paymentMode || 'CASH';
          if (collectionModeBreakdown[mode] !== undefined) {
            collectionModeBreakdown[mode] += tx.amount;
          } else {
            collectionModeBreakdown[mode] = tx.amount;
          }
        });

      // 7. Overall collections (All-time student credits, no voided)
      const nonVoidedTxs = allTxs.filter(tx => !tx.voided);
      const totalCollectionsAllTime = nonVoidedTxs
        .filter(tx => tx.accountType === 'STUDENT' && tx.type === 'CREDIT')
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);

      return {
        cashBalance,
        bankBalance,
        totalCashReserves,
        studentArrears,
        totalExpenses,
        collectedToday,
        totalCollectionsAllTime,
        expenseBreakdown,
        collectionModeBreakdown
      };
    } catch (e) {
      console.error('Error fetching financial summary:', e);
      throw e;
    }
  }
};
