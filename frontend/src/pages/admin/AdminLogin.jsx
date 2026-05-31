import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { loginAdmin } from '../../api/auth'

const AdminLogin = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const { loginAdmin: setLoginState } = useAuth()
    const navigate = useNavigate()

    const handleLogin = async () => {
        if (!email || !password) {
            toast.error('Please enter email and password')
            return
        }
        setLoading(true)
        try {
            const { data } = await loginAdmin({ email, password })
            if (data.success) {
                setLoginState(data.token, data.admin)
                toast.success('Welcome back!')
                navigate('/admin/dashboard')
            } else {
                toast.error(data.message || 'Invalid credentials')
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'var(--bg-deep)' }}
        >
            <div
                className="w-full max-w-sm rounded-2xl p-8"
                style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow)',
                }}
            >
                <div className="text-center mb-8">
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-lg"
                    >
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <h1 className="font-bold text-2xl mb-1" style={{ color: 'var(--text-main)' }}>
                        Admin Panel
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Mune's Kitchen Dashboard
                    </p>
                </div>

                <div className="space-y-4">

                    <div>
                        <label className="form-label">Email</label>
                        <input
                            className="form-input"
                            type="email"
                            placeholder="e.g. asadullahk@admin1.muneskitchen"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                    </div>

                    <div>
                        <label className="form-label">Password</label>
                        <div className="relative">
                            <input
                                className="form-input"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                style={{ paddingRight: '44px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="btn-primary w-full justify-center py-3 mt-2"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Logging in...
                            </span>
                        ) : (
                            'Login to Dashboard'
                        )}
                    </button>

                </div>
            </div>
        </div>
    )
}

export default AdminLogin