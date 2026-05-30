import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
    FiHome, FiShoppingBag, FiGrid, FiUsers,
    FiDollarSign, FiLogOut, FiMenu, FiX,
    FiExternalLink, FiSun, FiMoon, FiStar
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const LINKS = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: FiHome },
    { to: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
    { to: '/admin/menu', label: 'Menu', icon: FiGrid },
    { to: '/admin/costing', label: 'Food Costing', icon: FiDollarSign },
    { to: '/admin/reviews', label: 'Reviews', icon: FiStar },
    { to: '/admin/customers', label: 'Customers', icon: FiUsers },
    { to: '/admin/expenses', label: 'Expenses', icon: FiDollarSign },
    // { to: '/admin/security', label: 'security', icon: FiGrid },
]

const SidebarContent = ({ onClose }) => {
    const { admin, logoutAdmin } = useAuth()
    const { isDark, toggleTheme } = useTheme()
    const navigate = useNavigate()

    const handleLogout = () => {
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
                    <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="w-full h-full object-contain"
                        />
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