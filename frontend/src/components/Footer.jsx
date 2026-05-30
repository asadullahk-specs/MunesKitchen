import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin, FiLinkedin, FiGlobe, FiGithub } from 'react-icons/fi';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer style={{ background: 'var(--bg-deep)', borderTop: '1px solid var(--border)' }}>
            {/* Top CTA */}
            {/* <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }} className="py-12 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
                        Ready to Order?
                    </h2>
                    <p className="text-red-100 mb-6 font-accent italic text-lg">
                        Fresh frozen. Delivered to your door.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to="/menu"
                            className="px-8 py-3 rounded-xl font-semibold text-red-600 transition-all hover:scale-105"
                            style={{ background: 'white' }}>
                            Browse Menu
                        </Link>
                        <a href="https://wa.me/923032683689" target="_blank" rel="noreferrer"
                            className="px-8 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105 flex items-center justify-center gap-2"
                            style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.5)' }}>
                            <FiMessageCircle /> WhatsApp Us
                        </a>
                    </div>
                </div>
            </div> */}

            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl overflow-hidden">
                                <img
                                    src="/logo.png"
                                    alt="Logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <div className="font-display font-bold text-lg" style={{ color: 'var(--text-main)' }}>Mune's Kitchen</div>
                                <div className="text-xs font-accent italic" style={{ color: 'var(--primary)' }}>Frozen Freshness</div>
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
                            Premium frozen foods made with fresh ingredients and secret spices.
                            Taste the mystery, savor the excellence.
                        </p>
                        <div className="flex gap-3">
                            {[
                                { icon: <FiGlobe />, href: 'https://sameerkhan-drab.vercel.app/', label: 'Website' },
                                { icon: <FiGithub />, href: 'https://github.com/samzayoff', label: 'GitHub' },
                                { icon: <FiLinkedin />, href: 'https://www.linkedin.com/in/sameerkhan-webdeveloper/', label: 'LinkedIn' },
                            ].map(({ icon, href, label }) => (
                                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110 hover:-translate-y-1"
                                    style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--primary)' }}>
                                    {icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    {/* Quick Links */}
                    <div>
                        <h3 className="font-display font-semibold mb-4" style={{ color: 'var(--text-main)' }}>Quick Links</h3>
                        <ul className="space-y-2">
                            {[
                                { label: 'Home', href: '/' },
                                { label: 'Our Menu', href: '/menu' },
                                { label: 'Track Order', href: '/track' },
                                { label: 'Contact Us', href: '/contact' },
                            ].map(({ label, href }) => (
                                <li key={href}>
                                    <Link
                                        to={href}
                                        onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })} // FORCE RESET HERE
                                        className="text-sm transition-colors"
                                        onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Menu Categories */}
                    {/* Menu Categories */}
                    <div>
                        <h3 className="font-display font-semibold mb-4" style={{ color: 'var(--text-main)' }}>Our Menu</h3>
                        <ul className="space-y-2">
                            {['Snacks', 'Kababs', 'Chats'].map((item) => (
                                <li key={item}>
                                    <Link
                                        to="/menu"
                                        onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })} // FORCE RESET HERE
                                        className="text-sm transition-colors"
                                        onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-display font-semibold mb-4" style={{ color: 'var(--text-main)' }}>Contact</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                                <FiPhone className="mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                                <a href="tel:+923032683689"
                                    className="transition-colors"
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                >+92 303 2683689</a>
                            </li>
                            <li className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                                <FiMail className="mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                                <span>muneskitchen@gmail.com</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                                <FiMapPin className="mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                                <span>Peshawar, KPK, Pakistan</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
                    style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-soft)' }}>
                        © {currentYear} Mune's Kitchen. All rights reserved.
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-soft)' }}>
                        {/* Order 3 hours in advance 🔥 */}
                        Created by Sameer Khan
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;