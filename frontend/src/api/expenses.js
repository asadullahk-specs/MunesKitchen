import api from './axios';

export const getExpenseCategories = () => api.get('/expenses/categories');
export const getExpenses = () => api.get('/expenses');
export const createExpense = (data) => api.post('/expenses', data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);