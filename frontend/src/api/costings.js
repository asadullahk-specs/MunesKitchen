import api from './axios';

export const getCosting = (productId) => api.get(`/costings/${productId}`);
export const upsertCosting = (productId, data) => api.post(`/costings/${productId}`, data);
