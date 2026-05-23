import api from './axios';

export const getContacts = () => api.get('/contacts');

// Use the 'api' instance instead of 'axios'
export const createContact = (contactData) => {
    return api.post('/contacts', contactData);
};

export const markContactRead = (id) => api.put(`/contacts/${id}/read`);
export const deleteContact = (id) => api.delete(`/contacts/${id}`);