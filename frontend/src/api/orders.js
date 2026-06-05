import api from './axios';

export const createOrder = (data) => api.post('/orders', data);
export const trackOrder = (orderNumber) => api.get(`/orders/track/${orderNumber}`);
export const getOrders = (params) => api.get('/orders', { params });
export const updateOrderStatus = (id, status) => api.put(`/orders/${id}/status`, { status });
export const getDashboardStats = () => api.get('/orders/dashboard/stats');
export const deleteOrder = (id) => api.delete(`/orders/${id}`);