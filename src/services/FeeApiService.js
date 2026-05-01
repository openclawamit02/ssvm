import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/fees';

const FeeApiService = {
    postFee: async (studentId, amount, description) => {
        return axios.post(`${API_BASE_URL}/post`, { studentId, amount, description });
    },

    recordPayment: async (studentId, amount, description, paymentMode) => {
        return axios.post(`${API_BASE_URL}/pay`, { studentId, amount, description, paymentMode });
    },

    voidTransaction: async (id) => {
        return axios.post(`${API_BASE_URL}/void/${id}`);
    },

    getLedger: async (studentId) => {
        const response = await axios.get(`${API_BASE_URL}/ledger/${studentId}`);
        return response.data;
    },

    getAllAccounts: async () => {
        const response = await axios.get(`${API_BASE_URL}/accounts`);
        return response.data;
    }
};

export default FeeApiService;
