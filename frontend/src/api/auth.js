import API from './axios'

export const loginAdmin = (credentials) => API.post('/auth/login', credentials)
export const getMe = () => API.get('/auth/me')
export const logoutAdmin = () => API.post('/auth/logout')
export const changePassword = (data) => API.put('/auth/change-password', data)