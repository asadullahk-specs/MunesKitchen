import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiShoppingCart, FiMenu, FiX, FiSun, FiMoon } from 'react-icons/fi'
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'

const Navbar = () => {
    const { cartCount } = useCart()
    const { isDark, toggleTheme } = useTheme()
    const [isOpen, setIsOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const location = useLocation()

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 30)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => { setIsOpen(false) }, [location])

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    const navLinks = [
        { to: '/', label: 'Home' },
        { to: '/menu', label: 'Our Menu' },
        { to: '/contact', label: 'Contact' },
    ]

    const isActive = (path) => location.pathname === path

    return (
        <>
            <div style={{ height: '92px' }} />

            <nav
                className="fixed z-50 transition-all duration-500"
                style={{
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'calc(100% - 32px)',
                    maxWidth: '1200px',
                    height: '68px',
                    borderRadius: '7px',
                    background: 'var(--bg-card)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--border)',
                    boxShadow: scrolled
                        ? '0 8px 32px rgba(0,0,0,0.15)'
                        : '0 4px 16px rgba(0,0,0,0.08)',
                }}
            >
                <div className="h-full flex items-center justify-between px-5 sm:px-7">

                    <Link to="/" className="flex items-center gap-3 group flex-nowrap flex-shrink-0">
                        {/* <div className="w-9 h-9 rounded-[7px] bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                            <span className="text-white font-bold text-base">M</span>
                        </div> */}
                        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <img
                                src="/logo.png"
                                alt="Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="leading-tight">
                            <span className="font-bold text-base whitespace-nowrap" style={{ color: 'var(--text-main)', fontFamily: 'Poppins' }}>
                                Mune's <span style={{ color: 'var(--primary)' }}>Kitchen</span>
                            </span>
                        </div>
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        {navLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })} // FORCE RESET HERE
                                className="text-sm font-medium transition-all relative group"
                                style={{
                                    color: isActive(link.to) ? 'var(--primary)' : 'var(--text-muted)',
                                    fontFamily: 'Poppins'
                                }}
                            >
                                {link.label}
                                <span className={`absolute -bottom-1 left-0 h-0.5 rounded-[7px] transition-all duration-300 ${isActive(link.to) ? 'w-full' : 'w-0 group-hover:w-full'}`} style={{ background: 'var(--primary)' }} />
                            </Link>
                        ))}
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="w-9 h-9 rounded-[7px] flex items-center justify-center transition-all"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            {isDark ? <FiSun size={17} className="text-yellow-400" /> : <FiMoon size={17} />}
                        </button>
                        <Link to="/cart" className="relative w-9 h-9 rounded-[7px] flex items-center justify-center transition-all" style={{ background: 'transparent' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-glow)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <FiShoppingCart size={18} style={{ color: 'var(--text-main)' }} />
                            {cartCount > 0 && (
                                <motion.span
                                    key={cartCount}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-5 h-5 text-white text-xs font-bold rounded-[7px] flex items-center justify-center"
                                    style={{ background: 'var(--primary)' }}
                                >
                                    {cartCount > 99 ? '99+' : cartCount}
                                </motion.span>
                            )}
                        </Link>
                    </div>

                    <div className="flex md:hidden items-center gap-2">
                        <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-[7px]" style={{ color: 'var(--text-muted)' }}>
                            {isDark ? <FiSun size={17} className="text-yellow-400" /> : <FiMoon size={17} />}
                        </button>
                        <button
                            onClick={() => setIsOpen(prev => !prev)}
                            className="w-9 h-9 flex items-center justify-center rounded-[7px]"
                            style={{ color: 'var(--text-main)' }}
                        >
                            {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
                        </button>
                    </div>

                </div>
            </nav>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="fixed top-0 right-0 bottom-0 z-50 w-72 md:hidden flex flex-col"
                            style={{
                                background: 'var(--bg-card)',
                                borderLeft: '1px solid var(--border)',
                                backdropFilter: 'blur(20px)'
                            }}
                        >
                            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                                <span className="font-bold text-sm sm:text-base whitespace-nowrap" style={{ color: 'var(--text-main)', fontFamily: 'Poppins', display: 'block', lineHeight: '1.2' }}>
                                    Mune's <span style={{ color: 'var(--primary)' }}>Kitchen</span>
                                </span>
                                <button onClick={() => setIsOpen(false)} style={{ color: 'var(--text-muted)' }}>
                                    <FiX size={20} />
                                </button>
                            </div>

                            {/* UPDATED STATE IN NAVBAR.JSX */}
                            <div className="flex flex-col gap-1 p-4">
                                {navLinks.map((link, i) => (
                                    <motion.div
                                        key={link.to}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: i * 0.06 }}
                                    >
                                        <Link
                                            to={link.to}
                                            onClick={() => {
                                                setIsOpen(false); // Closes the mobile layout menu
                                                window.scrollTo({ top: 0, behavior: 'instant' }); // Snaps to top instantly
                                            }}
                                            className="block py-3 px-4 rounded-[7px] text-sm font-medium transition-all"
                                            style={{
                                                background: isActive(link.to) ? 'var(--primary-glow)' : 'transparent',
                                                color: isActive(link.to) ? 'var(--primary)' : 'var(--text-main)',
                                                fontFamily: 'Poppins'
                                            }}
                                        >
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                ))}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: navLinks.length * 0.06 }}
                                >
                                    <Link
                                        to="/cart"
                                        onClick={() => {
                                            setIsOpen(false);
                                            window.scrollTo({ top: 0, behavior: 'instant' });
                                        }}
                                        className="flex items-center justify-between py-3 px-4 rounded-[7px] text-sm font-medium transition-all"
                                        style={{
                                            background: isActive('/cart') ? 'var(--primary-glow)' : 'transparent',
                                            color: isActive('/cart') ? 'var(--primary)' : 'var(--text-main)',
                                            fontFamily: 'Poppins'
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <FiShoppingCart size={17} />
                                            <span>Cart</span>
                                        </div>
                                        {cartCount > 0 && (
                                            <span className="w-5 h-5 text-white text-xs font-bold rounded-[7px] flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                                                {cartCount > 99 ? '99+' : cartCount}
                                            </span>
                                        )}
                                    </Link>
                                </motion.div>
                            </div>

                            <div className="mt-auto p-5 border-t" style={{ borderColor: 'var(--border)' }}>
                                <p className="text-xs text-center font-medium" style={{ color: 'var(--text-muted)' }}>
                                    +92 303 2683689
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

export default Navbar