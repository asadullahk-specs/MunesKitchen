import api from './axios';

export const getCustomers = () => api.get('/customers');