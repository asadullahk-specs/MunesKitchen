import axios from 'axios'

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
})

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('mk_admin_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

API.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            const isAdminRoute = window.location.pathname.startsWith('/admin')
            const isLoginPage = window.location.pathname === '/admin/login'
            if (isAdminRoute && !isLoginPage) {
                localStorage.removeItem('mk_admin_token')
                localStorage.removeItem('mk_admin_data')
                window.location.href = '/admin/login'
            }
        }
        return Promise.reject(err)
    }
)

export default API