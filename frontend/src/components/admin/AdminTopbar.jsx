import { FiMenu, FiSun, FiMoon } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
    '/admin': 'Dashboard',
    '/admin/orders': 'Orders',
    '/admin/menu': 'Menu Management',
    '/admin/customers': 'Customers',
    '/admin/expenses': 'Expenses',
    '/admin/reviews': 'Reviews',
    '/admin/contacts': 'Contacts',
    '/admin/security': 'Security',
};

const AdminTopbar = ({ onMenuToggle }) => {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { admin } = useAuth();

    const pageTitle = pageTitles[location.pathname] || 'Admin';

    return (
        <div className="h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0"
            style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>

            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuToggle}
                    className="lg:hidden w-9 h-9 rounded-[7px] flex items-center justify-center"
                    style={{ background: 'var(--bg-deep)', color: 'var(--text-muted)' }}
                >
                    <FiMenu size={18} />
                </button>
                <h1 className="font-display font-bold text-lg" style={{ color: 'var(--text-main)' }}>
                    {pageTitle}
                </h1>
            </div>

            <div className="flex items-center gap-3">
                <button onClick={toggleTheme}
                    className="w-9 h-9 rounded-[7px] flex items-center justify-center"
                    style={{ background: 'var(--bg-deep)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    <motion.div key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                        {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
                    </motion.div>
                </button>

                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-[7px] flex items-center justify-center text-sm font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                        {admin?.name?.charAt(0) || 'A'}
                    </div>
                    <span className="text-sm font-medium hidden md:block" style={{ color: 'var(--text-main)' }}>
                        {admin?.name || 'Admin'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AdminTopbar;