import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiMinus, FiShoppingCart, FiEye, FiImage, FiStar } from 'react-icons/fi';
import { useCart } from '../context/CartContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const ProductCard = ({ product, onViewDetails }) => {
    const [qty, setQty] = useState(1);
    const { addToCart } = useCart();

    const imageUrl = product.image
        ? product.image.startsWith('/uploads')
            ? `${BACKEND_URL}${product.image}`
            : product.image
        : null;

    return (
        <motion.div
            className="card flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -4 }}
        >
            {/* Image */}
            <div className="relative h-48 overflow-hidden" style={{ background: 'var(--primary-glow)' }}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FiImage size={40} />
                    </div>
                )}

                {/* Hot Selling Badge */}
                {product.hot_selling && (
                    <div className="absolute top-3 left-3">
                        <span className="badge-hot flex items-center gap-1">
                            Top Selling
                        </span>
                    </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-3 right-3">
                    <span className="text-xs px-2 py-1 rounded-lg font-medium"
                        style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(8px)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                        {product.category?.name}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-2 gap-1.5">
                <div>
                    <h3 className="font-display font-semibold text-base leading-tight" style={{ color: 'var(--text-main)' }}>
                        {product.name}
                    </h3>
                    {product.description && (
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                            {product.description}
                        </p>
                    )}
                </div>

                {/* Price */}
                <div className="font-display font-bold text-xl gradient-text">
                    Rs. {parseFloat(product.price).toLocaleString()}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 mt-auto">
                    <div className="flex items-center rounded-lg overflow-hidden"
                        style={{ border: '1.5px solid var(--border)' }}>
                        <button
                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                            className="w-9 h-9 flex items-center justify-center transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-glow)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <FiMinus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                            {qty}
                        </span>
                        <button
                            onClick={() => setQty((q) => q + 1)}
                            className="w-9 h-9 flex items-center justify-center transition-colors"
                            style={{ color: 'var(--primary)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-glow)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <FiPlus size={14} />
                        </button>
                    </div>

                    <button
                        // onClick={handleAdd}
                        onClick={() => addToCart(product, qty)}
                        className="btn-primary flex-1 text-sm py-2 px-3 justify-center"
                        style={{ padding: '9px 12px' }}
                    >
                        <FiShoppingCart size={15} />
                        Add
                    </button>

                    {onViewDetails && (
                        <button
                            onClick={() => onViewDetails(product)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--primary)', border: '1.5px solid rgba(239,68,68,0.2)' }}
                        >
                            <FiEye size={15} />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;