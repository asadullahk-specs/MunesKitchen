import api from './axios';

export const getContacts = () => api.get('/contacts');

// Use the 'api' instance instead of 'axios'
export const createContact = (contactData) => {
    return api.post('/contacts', contactData);
};

export const markContactRead = (id, isRead = true) => api.put(`/contacts/${id}/read`, { is_read: isRead });
export const deleteContact = (id) => api.delete(`/contacts/${id}`);