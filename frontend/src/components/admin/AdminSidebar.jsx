import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiGrid, FiShoppingBag, FiList, FiUsers, FiDollarSign,
    FiStar, FiMail, FiShield, FiLogOut, FiX, FiExternalLink, FiCamera,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../api/auth';
import { toast } from 'react-toastify';

// Move this inside the component function OR ensure it's exported/imported correctly
// To be safe, paste this right above the AdminSidebar function:
const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <FiGrid />, exact: true },
    { label: 'Orders', href: '/admin/orders', icon: <FiShoppingBag /> },
    { label: 'Menu', href: '/admin/menu', icon: <FiList /> },
    { label: 'Food Costing', href: '/admin/costing', icon: <FiDollarSign /> },
    { label: 'Customers', href: '/admin/customers', icon: <FiUsers /> },
    { label: 'Expenses', href: '/admin/expenses', icon: <FiDollarSign /> },
    { label: 'Reviews', href: '/admin/reviews', icon: <FiStar /> }, // New Tab
    { label: 'Contacts', href: '/admin/contacts', icon: <FiMail /> },
    { label: 'Security', href: '/admin/security', icon: <FiShield /> },
];
// Then, ensure your .map() function uses THIS navItems array.

const AdminSidebar = ({ isOpen, onClose }) => {
    const { admin, logoutAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
        } catch { }
        logoutAdmin();
        toast.success('Logged out successfully');
        navigate('/admin/login');
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[7px]-[7px] flex items-center justify-center font-display font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                        M
                    </div>
                    <div>
                        <div className="font-display font-bold text-sm" style={{ color: 'var(--text-main)' }}>Mune's Kitchen</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Admin Panel</div>
                    </div>
                </div>
                <button onClick={onClose} className="lg:hidden w-8 h-8 rounded-[7px]-[7px] flex items-center justify-center"
                    style={{ color: 'var(--text-muted)' }}>
                    <FiX />
                </button>
            </div>

            {/* Admin Profile Section */}
            {admin && (
                <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--primary-glow)' }}>
                    <div
                        className="w-10 h-10 shrink-0 overflow-hidden flex items-center justify-center font-bold text-sm"
                        style={{
                            border: '2px solid var(--primary)',
                            background: admin.profile_image ? 'transparent' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                            color: 'white',
                            borderRadius: '50%'
                        }}
                    >
                        {admin.profile_image ? (
                            <img src={admin.profile_image} alt={admin.name} className="w-full h-full object-cover" style={{ borderRadius: '50%' }} />
                        ) : (
                            <span>{admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}</span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-main)' }}>{admin.name}</div>
                        <div className="text-xs" style={{ color: 'var(--primary)' }}>Administrator</div>
                    </div>
                </div>
            )}

            <nav className="flex-1 p-4 overflow-y-auto">
                <div className="flex flex-col gap-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            end={item.exact}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-[7px]-[7px] text-sm font-medium transition-all ${isActive ? 'text-white' : ''}`
                            }
                            style={({ isActive }) => ({
                                background: isActive ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'transparent',
                                color: isActive ? 'white' : 'var(--text-muted)',
                                boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
                            })}
                        >
                            <span className="text-base">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* Footer */}
            <div className="p-4 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)' }}>
                <Link to="/" onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[7px]-[7px] text-sm font-medium transition-all"
                    style={{ color: 'var(--text-muted)' }}>
                    <FiExternalLink /> Main Website
                </Link>
                <button onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[7px]-[7px] text-sm font-medium transition-all w-full text-left"
                    style={{ color: '#ef4444' }}>
                    <FiLogOut /> Logout
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex flex-col w-60 flex-shrink-0 h-screen sticky top-0"
                style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>
                <SidebarContent />
            </div>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed top-0 left-0 h-full w-64 z-40 flex flex-col lg:hidden"
                        style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25 }}
                    >
                        <SidebarContent />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AdminSidebar;