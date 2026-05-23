import api from './axios';

export const getDeliveryAreas = () => api.get('/delivery');
export const createDeliveryArea = (data) => api.post('/delivery', data);
export const deleteDeliveryArea = (id) => api.delete(`/delivery/${id}`);