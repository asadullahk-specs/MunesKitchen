import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiEye, FiImage, FiPlus, FiMinus } from 'react-icons/fi';
import { useCart } from '../context/CartContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const ProductCard = ({ product, className = 'h-full' }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [imgError, setImgError] = useState(false);
    const [qty, setQty] = useState(1);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const imageUrl = product.image && !imgError
        ? product.image.startsWith('/uploads')
            ? `${BACKEND_URL}${product.image}`
            : product.image
        : null;

    const categoryName = product.category?.name || product.category_id?.name || '';

    const handleAddToCart = (e) => {
        e.stopPropagation();
        addToCart(product, qty);
    };

    return (
        <motion.div
            className={`group relative overflow-hidden cursor-pointer flex flex-col w-full ${className}`}
            style={{
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border)',
                borderRadius: '7px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            }}
            initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            onClick={() => navigate(`/product/${product.id || product._id}`)}
        >
            {/* ── Image Block ── */}
            <div className="relative overflow-hidden shrink-0" style={{ aspectRatio: '4/3', background: 'var(--primary-glow)' }}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product.name}
                        onError={() => setImgError(true)}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            transform: 'scale(1.02)',
                            transition: 'transform 0.45s ease',
                        }}
                        className="group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <FiImage size={32} style={{ color: 'var(--primary)', opacity: 0.3 }} />
                    </div>
                )}

                {/* Top-left: Hot Selling badge */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                    {product.hot_selling && (
                        <span className="badge-hot">🔥 Top Selling</span>
                    )}
                </div>

                {/* Top-right: Category badge */}
                {categoryName && (
                    <div className="absolute top-2.5 right-2.5">
                        <span
                            className="text-xs px-2.5 py-0.5 font-bold"
                            style={{
                                background: '#990000',
                                color: '#ffffff',
                                borderRadius: '7px',
                                fontSize: '0.68rem',
                                boxShadow: '0 1px 6px rgba(0,0,0,0.25)',
                                letterSpacing: '0.02em',
                            }}
                        >
                            {categoryName}
                        </span>
                    </div>
                )}
            </div>

            {/* ── Info Section ── */}
            <div className="px-3.5 py-3 flex flex-col flex-1 justify-between">

                {/* Name */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3
                        className="font-bold text-sm leading-snug text-[var(--text-main)] line-clamp-2"
                        title={product.name}
                    >
                        {product.name}
                    </h3>
                </div>

                {/* Price + Qty always visible */}
                <div className="flex items-center justify-between gap-2">
                    <p className="font-extrabold text-base" style={{ color: 'var(--primary)' }}>
                        Rs. {parseFloat(product.price).toLocaleString()}
                    </p>

                    {/* Qty +/- control — always visible */}
                    <div
                        className="flex items-center rounded-[7px] overflow-hidden"
                        style={{ border: '1.5px solid var(--border)', background: 'var(--bg-input)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={e => { e.stopPropagation(); setQty(q => Math.max(1, q - 1)); }}
                            className="flex items-center justify-center w-6 h-6 transition-colors hover:bg-[var(--primary-glow)]"
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)' }}
                            aria-label="Decrease quantity"
                        >
                            <FiMinus size={10} />
                        </button>
                        <span
                            className="text-xs font-bold"
                            style={{ color: 'var(--text-main)', minWidth: '18px', textAlign: 'center' }}
                        >
                            {qty}
                        </span>
                        <button
                            onClick={e => { e.stopPropagation(); setQty(q => q + 1); }}
                            className="flex items-center justify-center w-6 h-6 transition-colors hover:bg-[var(--primary-glow)]"
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)' }}
                            aria-label="Increase quantity"
                        >
                            <FiPlus size={10} />
                        </button>
                    </div>
                </div>

                {/*
                  Action buttons:
                  - Mobile/Tablet (< lg): always visible
                  - Desktop (lg+): reveal on hover only
                */}
                <div className="flex gap-2 mt-2.5 lg:max-h-0 lg:opacity-0 lg:overflow-hidden lg:transition-all lg:duration-300 lg:mt-0 lg:group-hover:max-h-16 lg:group-hover:opacity-100 lg:group-hover:mt-2.5">
                    <button
                        onClick={handleAddToCart}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-[7px] transition-all"
                        style={{
                            background: 'linear-gradient(135deg, #990000, #7a0000)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 3px 12px rgba(153,0,0,0.35)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <FiShoppingCart size={12} /> Add to Cart
                    </button>

                    <button
                        onClick={e => { e.stopPropagation(); navigate(`/product/${product.id || product._id}`); }}
                        className="flex items-center justify-center w-8 h-8 rounded-[7px] transition-all shrink-0"
                        style={{
                            background: 'var(--primary-glow)',
                            color: 'var(--primary)',
                            border: '1.5px solid rgba(153, 0, 0, 0.25)',
                            cursor: 'pointer',
                        }}
                        title="View Details"
                    >
                        <FiEye size={14} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;