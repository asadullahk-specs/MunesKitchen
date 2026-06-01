import API from './axios'

export const loginAdmin = (credentials) => API.post('/auth/login', credentials)
export const getMe = () => API.get('/auth/me')
export const logoutAdmin = () => API.post('/auth/logout')
export const changePassword = (data) => API.put('/auth/change-password', data)

// Security CRUD
export const getAdmins = () => API.get('/auth/admins')
export const createAdmin = (data) => API.post('/auth/admins', data)
export const updateAdmin = (id, data) => API.put(`/auth/admins/${id}`, data)
export const deleteAdmin = (id) => API.delete(`/auth/admins/${id}`)