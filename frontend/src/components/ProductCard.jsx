import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiEye, FiImage } from 'react-icons/fi';
import { useCart } from '../context/CartContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const ProductCard = ({ product, onViewDetails }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [imgError, setImgError] = useState(false);

    const imageUrl = product.image && !imgError
        ? product.image.startsWith('/uploads')
            ? `${BACKEND_URL}${product.image}`
            : product.image
        : null;

    const categoryName = product.category?.name || product.category_id?.name || '';

    return (
        <motion.div
            className="group relative overflow-hidden cursor-pointer"
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
        >
            {/* ── Image Block (fills full width, no internal padding) ── */}
            <div className="relative overflow-hidden" style={{ aspectRatio: '4/3', background: 'var(--primary-glow)' }}>
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
                            transition: 'transform 0.45s ease',
                        }}
                        className="group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <FiImage size={32} style={{ color: 'var(--primary)', opacity: 0.3 }} />
                    </div>
                )}

                {/* Top badges */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                    {product.hot_selling && (
                        <span className="badge-hot">🔥 Top Selling</span>
                    )}
                </div>
                {categoryName && (
                    <div className="absolute top-2.5 right-2.5">
                        <span
                            className="text-xs px-2.5 py-0.5 font-semibold"
                            style={{
                                background: 'rgba(255,255,255,0.92)',
                                color: 'var(--text-main)',
                                backdropFilter: 'blur(6px)',
                                border: '1px solid rgba(0,0,0,0.06)',
                                borderRadius: 4,
                                fontSize: '0.7rem',
                                boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
                            }}
                        >
                            {categoryName}
                        </span>
                    </div>
                )}

                {/* Hover overlay with actions */}
                <div
                    className="absolute inset-0 flex items-end justify-center pb-4 gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-250"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }}
                        className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded transition-all"
                        style={{
                            background: 'linear-gradient(135deg, #990000, #7a0000)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 3px 12px rgba(153,0,0,0.45)',
                            transform: 'translateY(0)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <FiShoppingCart size={13} /> Add to Cart
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id || product._id}`); }}
                        className="flex items-center justify-center w-8 h-8 rounded transition-all"
                        style={{
                            background: 'rgba(255,255,255,0.92)',
                            color: 'var(--primary)',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                        title="View Details"
                    >
                        <FiEye size={14} />
                    </button>
                </div>
            </div>

            {/* ── Info Row ── */}
            <div className="px-3 py-3">
                <p
                    className="font-semibold text-sm leading-snug truncate mb-0.5"
                    style={{ color: 'var(--text-main)' }}
                >
                    {product.name}
                </p>
                <p
                    className="font-bold text-base"
                    style={{ color: 'var(--primary)' }}
                >
                    Rs. {parseFloat(product.price).toLocaleString()}
                </p>
            </div>
        </motion.div>
    );
};

export default ProductCard;