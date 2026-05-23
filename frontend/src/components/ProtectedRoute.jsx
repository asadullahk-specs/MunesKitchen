import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth()

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: 'var(--bg-deep)' }}
            >
                <div className="flex flex-col items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
                        style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
                    />
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                        Verifying session...
                    </p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />
    }

    return children
}

export default ProtectedRoute