import { createContext, useContext, useState, useEffect } from 'react'
import API from '../api/axios'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('mk_admin_token')
        const savedAdmin = localStorage.getItem('mk_admin_data')

        if (token && savedAdmin) {
            try {
                setAdmin(JSON.parse(savedAdmin))
                API.get('/auth/me')
                    .then((res) => {
                        if (res.data.success && res.data.admin) {
                            setAdmin(res.data.admin)
                            localStorage.setItem('mk_admin_data', JSON.stringify(res.data.admin))
                        } else {
                            setAdmin(res.data.admin)
                        }
                    })
                    .catch(() => {
                        localStorage.removeItem('mk_admin_token')
                        localStorage.removeItem('mk_admin_data')
                        setAdmin(null)
                    })
                    .finally(() => setLoading(false))
            } catch {
                localStorage.removeItem('mk_admin_token')
                localStorage.removeItem('mk_admin_data')
                setAdmin(null)
                setLoading(false)
            }
        } else {
            setLoading(false)
        }
    }, [])

    const loginAdmin = (token, adminData) => {
        localStorage.setItem('mk_admin_token', token)
        localStorage.setItem('mk_admin_data', JSON.stringify(adminData))
        sessionStorage.setItem('mk_admin_session', 'active')
        setAdmin(adminData)
    }

    const logoutAdmin = () => {
        localStorage.removeItem('mk_admin_token')
        localStorage.removeItem('mk_admin_data')
        setAdmin(null)
        API.post('/auth/logout').catch(() => { })
    }

    const updateAdminData = (adminData) => {
        setAdmin(adminData)
        localStorage.setItem('mk_admin_data', JSON.stringify(adminData))
    }

    return (
        <AuthContext.Provider value={{
            admin,
            loading,
            loginAdmin,
            logoutAdmin,
            updateAdminData,
            isAuthenticated: !!admin
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)