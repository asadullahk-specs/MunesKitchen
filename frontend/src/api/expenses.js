import api from './axios';

export const getExpenseCategories = () => api.get('/expenses/categories');
export const createExpenseCategory = (data) => api.post('/expenses/categories', data);
export const updateExpenseCategory = (id, data) => api.put(`/expenses/categories/${id}`, data);
export const deleteExpenseCategory = (id) => api.delete(`/expenses/categories/${id}`);

export const getExpenses = () => api.get('/expenses');
export const createExpense = (data) => api.post('/expenses', data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);