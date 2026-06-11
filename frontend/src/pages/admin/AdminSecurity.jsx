import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { FiPlus, FiEdit2, FiTrash2, FiShield, FiLock, FiUser, FiMail, FiX, FiCheck, FiEye, FiEyeOff, FiCamera } from 'react-icons/fi'
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'

const AdminSecurity = () => {
    const { admin: currentAdmin } = useAuth()
    const [admins, setAdmins] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const [form, setForm] = useState({ id: null, name: '', email: '', password: '' })
    const [isEditing, setIsEditing] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [profileImagePreview, setProfileImagePreview] = useState(null)
    const fileInputRef = useRef(null)

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
                password: form.password ? form.password : undefined,
                ...(profileImagePreview ? { profile_image: profileImagePreview } : {})
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
            setProfileImagePreview(null)
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
            password: ''
        })
        setProfileImagePreview(admin.profile_image || null)
        setIsEditing(true)
    }

    const cancelEdit = () => {
        setForm({ id: null, name: '', email: '', password: '' })
        setIsEditing(false)
        setProfileImagePreview(null)
    }

    const handleImageFile = (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image must be under 2MB')
            return
        }
        const reader = new FileReader()
        reader.onload = (ev) => setProfileImagePreview(ev.target.result)
        reader.readAsDataURL(file)
    }

    return (
        <div style={{ width: '100%', fontFamily: 'Poppins, sans-serif' }}>
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <FiShield size={22} style={{ color: 'var(--primary)' }} />
                    <h1 className="font-bold text-2xl" style={{ color: 'var(--text-main)' }}>Credential & Admin Management</h1>
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    Add, edit, or remove administrator accounts.
                </p>
            </div>

            {loading ? (
                <div className="card p-8 flex justify-center items-center">
                    <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                </div>
            ) : error ? (
                <div className="card p-8 text-center">
                    <p className="text-sm font-medium mb-3" style={{ color: 'var(--primary)' }}>{error}</p>
                    <button onClick={fetchAdmins} className="btn-primary px-5 py-2 text-sm">
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
                                {/* Profile Image Upload - edit mode only */}
                                {isEditing && (
                                    <div>
                                        <label className="form-label">Profile Photo (optional)</label>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-14 h-14 overflow-hidden border-2 shrink-0 flex items-center justify-center"
                                                style={{ borderRadius: '7px', borderColor: 'var(--primary)', background: 'var(--bg-input)' }}
                                            >
                                                {profileImagePreview ? (
                                                    <img src={profileImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <FiCamera size={18} style={{ color: 'var(--text-muted)' }} />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="text-xs px-3 py-1.5 border font-medium transition-all"
                                                    style={{ borderRadius: '7px', borderColor: 'var(--primary)', color: 'var(--primary)', background: 'var(--primary-glow)' }}
                                                >
                                                    Upload from Device
                                                </button>
                                                {profileImagePreview && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setProfileImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                                        className="text-xs px-3 py-1 border transition-all"
                                                        style={{ borderRadius: '7px', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageFile}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Name Field */}
                                <div>
                                    <label className="form-label">Name *</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pointer-events-none" style={{ paddingLeft: '12px', color: 'var(--text-muted)' }}>
                                            <FiUser size={14} />
                                        </span>
                                        <input
                                            className="form-input"
                                            style={{ paddingLeft: '36px' }}
                                            placeholder="Full Name"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email Field */}
                                <div>
                                    <label className="form-label">Email Address *</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pointer-events-none" style={{ paddingLeft: '12px', color: 'var(--text-muted)' }}>
                                            <FiMail size={14} />
                                        </span>
                                        <input
                                            className="form-input"
                                            style={{ paddingLeft: '36px' }}
                                            type="email"
                                            placeholder="admin@muneskitchen.com"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div>
                                    <label className="form-label">
                                        {isEditing ? 'New Password (leave empty to keep current)' : 'Password *'}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pointer-events-none" style={{ paddingLeft: '12px', color: 'var(--text-muted)' }}>
                                            <FiLock size={14} />
                                        </span>
                                        <input
                                            className="form-input"
                                            style={{ paddingLeft: '36px', paddingRight: '40px' }}
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder={isEditing ? '••••••••' : 'Password (min 6 chars)'}
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            required={!isEditing}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(p => !p)}
                                            className="absolute inset-y-0 right-0 flex items-center"
                                            style={{ paddingRight: '12px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                                        </button>
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
                                            className="px-4 py-2 border border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 transition-all text-xs"
                                            style={{ borderRadius: '7px', color: 'var(--text-main)' }}
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
                                <span className="text-xs px-2.5 py-1 font-semibold" style={{ borderRadius: '7px', background: 'var(--primary-glow)', color: 'var(--primary)' }}>
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
                                                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" style={{ borderRadius: '7px' }}>
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Email: {adminItem.email}</p>
                                            <p className="text-xs font-mono truncate" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                                                Password (Bcrypt Hash): <span className="px-1 py-0.5" style={{ borderRadius: '7px', color: 'var(--primary)', background: 'var(--primary-glow)' }}>{adminItem.passwordHash}</span>
                                            </p>
                                        </div>
                                        <div className="flex gap-2 shrink-0 self-end md:self-center">
                                            <button
                                                onClick={() => startEdit(adminItem)}
                                                className="p-2 transition-all hover:bg-amber-500/10 text-amber-500"
                                                style={{ borderRadius: '7px' }}
                                                title="Edit Credentials"
                                            >
                                                <FiEdit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(adminItem.id, adminItem.name)}
                                                disabled={adminItem.id === currentAdmin?.id || admins.length <= 1}
                                                className={`p-2 transition-all ${adminItem.id === currentAdmin?.id || admins.length <= 1
                                                    ? 'opacity-30 cursor-not-allowed text-gray-400'
                                                    : 'hover:bg-red-500/10 text-red-500'
                                                    }`}
                                                style={{ borderRadius: '7px' }}
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