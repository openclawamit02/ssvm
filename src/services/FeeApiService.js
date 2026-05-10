const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/fees';

const FeeApiService = {
    postFee: async (entityId, type, amount, description) => {
        return fetch(`${API_BASE_URL}/post`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entityId, type, amount, description })
        });
    },

    recordPayment: async (entityId, type, amount, description, paymentMode) => {
        return fetch(`${API_BASE_URL}/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entityId, type, amount, description, paymentMode })
        });
    },

    voidTransaction: async (id) => {
        return fetch(`${API_BASE_URL}/void/${id}`, {
            method: 'POST'
        });
    },

    getLedger: async (entityId, page = 0, size = 10) => {
        const response = await fetch(`${API_BASE_URL}/ledger/${entityId}?page=${page}&size=${size}`);
        if (!response.ok) throw new Error('Failed to fetch ledger');
        return response.json();
    },

    getAllAccounts: async (type = null, search = '', page = 0, size = 10) => {
        const query = new URLSearchParams({ page, size });
        if (type) query.append('type', type);
        if (search) query.append('search', search);
        const response = await fetch(`${API_BASE_URL}/accounts?${query}`);
        if (!response.ok) throw new Error('Failed to fetch accounts');
        return response.json();
    },

    getSummary: async () => {
        const response = await fetch(`${API_BASE_URL}/summary`);
        if (!response.ok) throw new Error('Failed to fetch summary');
        return response.json();
    },

    getRecentTransactions: async () => {
        const response = await fetch(`${API_BASE_URL}/transactions/recent`);
        if (!response.ok) throw new Error('Failed to fetch recent transactions');
        return response.json();
    },

    getDefaulters: async (page = 0, size = 10) => {
        const response = await fetch(`${API_BASE_URL}/defaulters?page=${page}&size=${size}`);
        if (!response.ok) throw new Error('Failed to fetch defaulters');
        return response.json();
    }
};



export default FeeApiService;

