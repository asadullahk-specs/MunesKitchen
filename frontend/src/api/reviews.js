import api from './axios';

export const getReviews = (params) => api.get('/reviews', { params });

// Correctly passes status as request body (matches controller's req.body.status)
export const updateReviewStatus = (id, newStatus) =>
    api.put(`/reviews/${id}/status`, { status: newStatus });

export const deleteReview = (id) => api.delete(`/reviews/${id}`);

export const createReview = (data) =>
    api.post('/reviews', data, {
        headers: { 'Content-Type': undefined },
    });

export const getPendingReviews = () => api.get('/reviews/pending');