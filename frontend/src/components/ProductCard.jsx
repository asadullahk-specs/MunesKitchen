import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiMinus, FiShoppingCart, FiEye, FiImage } from 'react-icons/fi';
import { useCart } from '../context/CartContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const ProductCard = ({ product, onViewDetails }) => {
    const navigate = useNavigate();
    const [qty, setQty] = useState(1);
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
            className="group relative flex flex-col overflow-hidden rounded-2xl"
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)',
                transition: 'box-shadow 0.3s ease, transform 0.3s ease',
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -5, boxShadow: '0 16px 48px rgba(0,0,0,0.13)' }}
        >
            {/* ── Image ── */}
            <div className="relative overflow-hidden" style={{ height: 200, background: 'var(--primary-glow)' }}>
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
                            transition: 'transform 0.5s ease',
                        }}
                        className="group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <FiImage size={36} style={{ color: 'var(--primary)', opacity: 0.35 }} />
                    </div>
                )}

                {/* Gradient overlay */}
                <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 50%)' }}
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {product.hot_selling && (
                        <span className="badge-hot">🔥 Top Selling</span>
                    )}
                </div>

                {categoryName && (
                    <div className="absolute top-3 right-3">
                        <span
                            className="text-xs px-2.5 py-1 rounded-full font-semibold"
                            style={{
                                background: 'rgba(255,255,255,0.92)',
                                color: 'var(--text-main)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(0,0,0,0.08)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            }}
                        >
                            {categoryName}
                        </span>
                    </div>
                )}

                {/* Quick View overlay button */}
                <button
                    onClick={() => navigate(`/product/${product.id || product._id}`)}
                    className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                        background: 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(8px)',
                        color: 'var(--primary)',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                        border: '1px solid rgba(255,255,255,0.5)',
                    }}
                    title="View Details"
                >
                    <FiEye size={15} />
                </button>
            </div>

            {/* ── Content ── */}
            <div className="flex flex-col flex-1 p-4 gap-3">
                {/* Name & Description */}
                <div className="flex-1">
                    <h3
                        className="font-bold text-[15px] leading-snug mb-1"
                        style={{ color: 'var(--text-main)' }}
                    >
                        {product.name}
                    </h3>
                    {product.description && (
                        <p
                            className="text-xs leading-relaxed line-clamp-2"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            {product.description}
                        </p>
                    )}
                </div>

                {/* Price */}
                <div
                    className="font-extrabold text-lg"
                    style={{ color: 'var(--primary)' }}
                >
                    Rs. {parseFloat(product.price).toLocaleString()}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--border)' }} />

                {/* Quantity + Add to Cart */}
                <div className="flex items-center gap-2">
                    {/* Qty pill */}
                    <div
                        className="flex items-center rounded-full overflow-hidden"
                        style={{ border: '1.5px solid var(--border)', background: 'var(--bg-deep)' }}
                    >
                        <button
                            onClick={() => setQty(q => Math.max(1, q - 1))}
                            className="w-8 h-8 flex items-center justify-center transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                            <FiMinus size={13} />
                        </button>
                        <span
                            className="w-7 text-center text-sm font-semibold select-none"
                            style={{ color: 'var(--text-main)' }}
                        >
                            {qty}
                        </span>
                        <button
                            onClick={() => setQty(q => q + 1)}
                            className="w-8 h-8 flex items-center justify-center transition-colors"
                            style={{ color: 'var(--primary)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-glow)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <FiPlus size={13} />
                        </button>
                    </div>

                    {/* Add to Cart */}
                    <button
                        onClick={() => addToCart(product, qty)}
                        className="flex-1 flex items-center justify-center gap-1.5 font-semibold text-sm rounded-full py-2 transition-all"
                        style={{
                            background: 'linear-gradient(135deg, #990000, #7a0000)',
                            color: 'white',
                            boxShadow: '0 4px 15px rgba(153,0,0,0.25)',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(153,0,0,0.4)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(153,0,0,0.25)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <FiShoppingCart size={14} />
                        Add
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;