import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
    FiHome, FiShoppingBag, FiGrid, FiUsers,
    FiDollarSign, FiLogOut, FiMenu, FiX,
    FiExternalLink, FiSun, FiMoon, FiStar,
    FiSettings, FiMessageSquare, FiShield, FiGift
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const INACTIVITY_TIMEOUT = 5 * 60 * 1000 // 5 minutes

const LINKS = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: FiHome },
    { to: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
    { to: '/admin/menu', label: 'Menu', icon: FiGrid },
    { to: '/admin/offers', label: 'Offers', icon: FiGift },
    { to: '/admin/costing', label: 'Food Costing', icon: FiDollarSign },
    { to: '/admin/reviews', label: 'Reviews', icon: FiStar },
    { to: '/admin/customers', label: 'Customers', icon: FiUsers },
    { to: '/admin/expenses', label: 'Expenses', icon: FiDollarSign },
    { to: '/admin/messages', label: 'Messages', icon: FiMessageSquare },
    { to: '/admin/settings', label: 'Settings', icon: FiSettings },
    { to: '/admin/security', label: 'Security', icon: FiShield },
]

const SidebarContent = ({ onClose }) => {
    const { admin, logoutAdmin } = useAuth()
    const { isDark, toggleTheme } = useTheme()
    const navigate = useNavigate()

    const handleLogout = () => {
        sessionStorage.removeItem('mk_admin_session')
        logoutAdmin()
        navigate('/admin/login')
    }

    return (
        <div className="h-full flex flex-col" style={{ fontFamily: 'Poppins, sans-serif' }}>

            <div className="p-5 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 flex items-center justify-center overflow-hidden bg-transparent shadow-none">
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div>
                        <p className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>Mune's Kitchen</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Admin Panel</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
                        <FiX size={18} />
                    </button>
                )}
            </div>

            <div className="p-4 mx-3 mt-4 rounded-2xl" style={{ background: 'var(--primary-glow)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2" style={{ borderColor: 'var(--primary)' }}>
                        {admin?.profile_image ? (
                            <img
                                src={admin.profile_image.startsWith('http') || admin.profile_image.startsWith('data:') ? admin.profile_image : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${admin.profile_image.replace(/^\//, '')}`}
                                alt={admin.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-sm" style={{ background: 'var(--primary)', color: '#fff' }}>
                                {(admin?.name || 'A').charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-main)' }}>
                            {admin?.name || 'Admin'}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                            {admin?.email || ''}
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-3 mt-4">
                <p className="text-xs font-semibold uppercase tracking-widest px-2 mb-2" style={{ color: 'var(--text-muted)' }}>
                    Navigation
                </p>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 space-y-1">
                {LINKS.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={onClose}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <Icon size={16} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-3 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest px-2 mb-2" style={{ color: 'var(--text-muted)' }}>
                    Settings
                </p>
                <button onClick={toggleTheme} className="sidebar-link">
                    {isDark ? <FiSun size={15} className="text-yellow-400" /> : <FiMoon size={15} />}
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>
                <a href="/" target="_blank" rel="noreferrer" className="sidebar-link">
                    <FiExternalLink size={15} />
                    Visit Website
                </a>
                <button
                    onClick={handleLogout}
                    className="sidebar-link w-full"
                    style={{ color: '#ef4444' }}
                >
                    <FiLogOut size={15} />
                    Logout
                </button>
            </div>

        </div>
    )
}

const AdminLayout = () => {
    const [open, setOpen] = useState(false)
    const { logoutAdmin, isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const inactivityTimer = useRef(null)

    const doLogout = () => {
        sessionStorage.removeItem('mk_admin_session')
        logoutAdmin()
        navigate('/admin/login')
    }

    // ── 1. REFRESH PROTECTION ────────────────────────────────────────────────
    useEffect(() => {
        const sessionActive = sessionStorage.getItem('mk_admin_session')
        if (!sessionActive) {
            // Page was refreshed or session is new without login → logout
            doLogout()
            return
        }

        // Mark unload so refresh clears the flag
        const handleBeforeUnload = () => {
            sessionStorage.removeItem('mk_admin_session')
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [])

    // ── 2. INACTIVITY AUTO-LOGOUT (5 minutes) ───────────────────────────────
    // NOTE: visibilitychange logout was intentionally removed — it was triggering
    // logout any time the admin switched browser tabs or windows during normal use.
    // Logout is now only triggered by: 5-min inactivity, refresh, close, or explicit logout.
    useEffect(() => {
        const resetTimer = () => {
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
            inactivityTimer.current = setTimeout(() => {
                doLogout()
            }, INACTIVITY_TIMEOUT)
        }

        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
        events.forEach(e => window.addEventListener(e, resetTimer))
        resetTimer() // start timer on mount

        return () => {
            events.forEach(e => window.removeEventListener(e, resetTimer))
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
        }
    }, [])

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-deep)' }}>

            <aside
                className="hidden lg:flex flex-col w-64 shrink-0 border-r"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
                <SidebarContent />
            </aside>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                            onClick={() => setOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                            className="fixed left-0 top-0 bottom-0 z-50 w-64 border-r lg:hidden"
                            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                        >
                            <SidebarContent onClose={() => setOpen(false)} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                <header
                    className="lg:hidden flex items-center gap-3 px-4 py-3 border-b shrink-0"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                    <button onClick={() => setOpen(true)} style={{ color: 'var(--text-main)' }}>
                        <FiMenu size={22} />
                    </button>
                    <span className="font-bold text-sm" style={{ color: 'var(--text-main)', fontFamily: 'Poppins' }}>
                        Mune's Kitchen
                    </span>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <Outlet />
                </main>

            </div>

        </div>
    )
}

export default AdminLayout