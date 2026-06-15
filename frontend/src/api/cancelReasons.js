import api from './axios';

export const getCancelReasons = () => api.get('/cancel-reasons');
export const createCancelReason = (data) => api.post('/cancel-reasons', data);
export const updateCancelReason = (id, data) => api.put(`/cancel-reasons/${id}`, data);
export const deleteCancelReason = (id) => api.delete(`/cancel-reasons/${id}`);
