import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { FiPlus, FiEdit2, FiTrash2, FiShield, FiLock, FiUser, FiMail, FiX, FiCheck } from 'react-icons/fi'
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'

const AdminSecurity = () => {
    const { admin: currentAdmin } = useAuth()
    const [admins, setAdmins] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // Form States
    const [form, setForm] = useState({ id: null, name: '', email: '', password: '' })
    const [isEditing, setIsEditing] = useState(false)

    const [error, setError] = useState(null)

    const fetchAdmins = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await getAdmins()
            if (res.data.success) {
                setAdmins(res.data.data || [])
            } else {
                setError('Failed to load administrator accounts.')
            }
        } catch (err) {
            console.error('fetchAdmins error:', err)
            setError(err.response?.data?.message || 'Failed to load administrator accounts.')
            toast.error('Failed to load administrator accounts')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAdmins()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.name.trim()) return toast.error('Name is required')
        if (!form.email.trim()) return toast.error('Email is required')
        
        if (!isEditing && (!form.password || form.password.length < 6)) {
            return toast.error('Password must be at least 6 characters')
        }
        if (isEditing && form.password && form.password.length < 6) {
            return toast.error('New password must be at least 6 characters')
        }

        setSubmitting(true)
        try {
            const payload = {
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password ? form.password : undefined
            }

            if (isEditing) {
                const res = await updateAdmin(form.id, payload)
                if (res.data.success) {
                    toast.success('Admin account updated successfully')
                }
            } else {
                const res = await createAdmin(payload)
                if (res.data.success) {
                    toast.success('New Admin account added successfully')
                }
            }
            setForm({ id: null, name: '', email: '', password: '' })
            setIsEditing(false)
            fetchAdmins()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save admin account')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id, name) => {
        if (id === currentAdmin?.id) {
            return toast.error('You cannot delete your own active administrator session!')
        }
        if (admins.length <= 1) {
            return toast.error('Cannot delete the last remaining administrator account!')
        }
        if (!window.confirm(`Are you absolutely sure you want to remove administrator "${name}"? This action cannot be undone.`)) {
            return
        }

        try {
            const res = await deleteAdmin(id)
            if (res.data.success) {
                toast.success('Admin account removed successfully')
                fetchAdmins()
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete administrator')
        }
    }

    const startEdit = (admin) => {
        setForm({
            id: admin.id,
            name: admin.name,
            email: admin.email,
            password: '' // leave blank unless changing password
        })
        setIsEditing(true)
    }

    const cancelEdit = () => {
        setForm({ id: null, name: '', email: '', password: '' })
        setIsEditing(false)
    }

    return (
        <div style={{ width: '100%', fontFamily: 'Poppins, sans-serif' }}>
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <FiShield size={22} className="text-red-500" />
                    <h1 className="font-bold text-2xl" style={{ color: 'var(--text-main)' }}>Credential & Admin Management</h1>
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    Add, edit, or remove administrator accounts.
                </p>
            </div>

            {loading ? (
                <div className="card p-8 flex justify-center items-center">
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="card p-8 text-center">
                    <p className="text-sm font-medium mb-3" style={{ color: '#dc2626' }}>{error}</p>
                    <button
                        onClick={fetchAdmins}
                        className="btn-primary px-5 py-2 text-sm"
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Form Area */}
                    <div className="lg:col-span-1">
                        <div className="card p-5">
                            <h3 className="font-bold text-base mb-4" style={{ color: 'var(--text-main)' }}>
                                {isEditing ? 'Edit Administrator Credentials' : 'Add New Administrator'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="form-label">Name *</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                                            <FiUser size={14} />
                                        </span>
                                        <input
                                            className="form-input pl-10"
                                            placeholder="Full Name"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label">Email Address *</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                                            <FiMail size={14} />
                                        </span>
                                        <input
                                            className="form-input pl-10"
                                            type="email"
                                            placeholder="admin@muneskitchen.com"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label">
                                        {isEditing ? 'New Password (leave empty to keep current)' : 'Password *'}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                                            <FiLock size={14} />
                                        </span>
                                        <input
                                            className="form-input pl-10"
                                            type="password"
                                            placeholder={isEditing ? '••••••••' : 'Password (min 6 chars)'}
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            required={!isEditing}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                                        {submitting ? 'Saving...' : isEditing ? 'Update Credentials' : 'Add Admin Account'}
                                    </button>
                                    {isEditing && (
                                        <button
                                            type="button"
                                            onClick={cancelEdit}
                                            className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 transition-all text-xs"
                                            style={{ color: 'var(--text-main)' }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Listing Area */}
                    <div className="lg:col-span-2">
                        <div className="card overflow-hidden">
                            <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
                                <h3 className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>Active Administrators</h3>
                                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                                    {admins.length} Accounts
                                </span>
                            </div>
                            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                {admins.length === 0 ? (
                                    <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                                        No administrator accounts found.
                                    </div>
                                ) : admins.map((adminItem) => (
                                    <div key={adminItem.id} className="p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>{adminItem.name}</p>
                                                {adminItem.id === currentAdmin?.id && (
                                                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Email: {adminItem.email}</p>
                                            <p className="text-xs font-mono truncate" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                                                Password (Bcrypt Hash): <span className="text-red-500 bg-red-500/5 px-1 py-0.5 rounded">{adminItem.passwordHash}</span>
                                            </p>
                                        </div>
                                        <div className="flex gap-2 shrink-0 self-end md:self-center">
                                            <button
                                                onClick={() => startEdit(adminItem)}
                                                className="p-2 rounded-xl transition-all hover:bg-amber-500/10 text-amber-500"
                                                title="Edit Credentials"
                                            >
                                                <FiEdit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(adminItem.id, adminItem.name)}
                                                disabled={adminItem.id === currentAdmin?.id || admins.length <= 1}
                                                className={`p-2 rounded-xl transition-all ${
                                                    adminItem.id === currentAdmin?.id || admins.length <= 1
                                                        ? 'opacity-30 cursor-not-allowed text-gray-400'
                                                        : 'hover:bg-red-500/10 text-red-500'
                                                }`}
                                                title="Delete Account"
                                            >
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminSecurity
