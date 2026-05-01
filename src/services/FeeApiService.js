const API_BASE_URL = 'http://localhost:8080/api/fees';

const FeeApiService = {
    postFee: async (studentId, amount, description) => {
        return fetch(`${API_BASE_URL}/post`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, amount, description })
        });
    },

    recordPayment: async (studentId, amount, description, paymentMode) => {
        return fetch(`${API_BASE_URL}/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, amount, description, paymentMode })
        });
    },

    voidTransaction: async (id) => {
        return fetch(`${API_BASE_URL}/void/${id}`, {
            method: 'POST'
        });
    },

    getLedger: async (studentId) => {
        const response = await fetch(`${API_BASE_URL}/ledger/${studentId}`);
        if (!response.ok) throw new Error('Failed to fetch ledger');
        return response.json();
    },

    getAllAccounts: async () => {
        const response = await fetch(`${API_BASE_URL}/accounts`);
        if (!response.ok) throw new Error('Failed to fetch accounts');
        return response.json();
    }
};

export default FeeApiService;

