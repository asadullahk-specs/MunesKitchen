import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FiPhone, FiMail, FiMapPin, FiLinkedin, FiGlobe, FiGithub } from 'react-icons/fi';
import API from '../api/axios';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        API.get('/categories')
            .then((r) => setCategories(r.data.categories || r.data.data || []))
            .catch(() => { }); // Silent fail — footer still renders without categories
    }, []);

    return (
        <footer style={{ background: 'var(--bg-deep)', borderTop: '1px solid var(--border)' }}>
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

                    {/* Brand */}
                    <div className="col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-[7px] overflow-hidden">
                                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <div className="font-display font-bold text-lg" style={{ color: 'var(--text-main)' }}>Mune's Kitchen</div>
                                <div className="text-xs font-accent italic" style={{ color: 'var(--primary)' }}>Frozen Freshness</div>
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
                            For orders, inquiries, and more information, connect with us using the links below.
                        </p>
                        <div className="flex gap-3">
                            {[
                                { icon: <FiGlobe />, href: 'https://sameerkhan-drab.vercel.app/', label: 'Website' },
                                { icon: <FiGithub />, href: 'https://github.com/samzayoff', label: 'GitHub' },
                                { icon: <FiLinkedin />, href: 'https://www.linkedin.com/in/sameerkhan-webdeveloper/', label: 'LinkedIn' },
                            ].map(({ icon, href, label }) => (
                                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                                    className="w-9 h-9 rounded-[7px] flex items-center justify-center transition-all hover:scale-110 hover:-translate-y-1"
                                    style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--primary)' }}>
                                    {icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links + Our Menu — always 2 columns side-by-side */}
                    <div className="col-span-2 lg:col-span-2">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Quick Links */}
                            <div>
                                <h3 className="font-display font-semibold mb-3" style={{ color: 'var(--text-main)' }}>Quick Links</h3>
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
                                                onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
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

                            {/* Menu Categories — Dynamic from API */}
                            <div>
                                <h3 className="font-display font-semibold mb-3" style={{ color: 'var(--text-main)' }}>Our Menu</h3>
                                <ul className="space-y-2">
                                    {categories.length > 0 ? categories.map((cat) => (
                                        <li key={cat.id || cat._id}>
                                            <Link
                                                to={`/menu?category=${cat.id || cat._id}`}
                                                onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
                                                className="text-sm transition-colors"
                                                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                {cat.name}
                                            </Link>
                                        </li>
                                    )) : (
                                        <li>
                                            <Link to="/menu" className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                                View Full Menu
                                            </Link>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="col-span-2 lg:col-span-1">
                        <h3 className="font-display font-semibold mb-4" style={{ color: 'var(--text-main)' }}>Contact</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                                <FiPhone className="mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                                <a href="tel:+923032683689" className="transition-colors"
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
                <div className="mt-5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3"
                    style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-soft)' }}>
                        © {currentYear} Mune's Kitchen. All rights reserved.
                    </p>
                    {/* <p className="text-sm" style={{ color: 'var(--text-soft)' }}>
                        Creation & Design Credits: Sameer Khan & Asadullah Khan
                    </p> */}
                </div>
            </div>
        </footer>
    );
};

export default Footer;