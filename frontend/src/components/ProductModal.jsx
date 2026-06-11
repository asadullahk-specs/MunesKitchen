import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus, FiMinus, FiShoppingCart, FiImage, FiStar } from 'react-icons/fi';
import { useCart } from '../context/CartContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const ProductModal = ({ product, onClose }) => {
    const [qty, setQty] = useState(1);
    const { addToCart } = useCart();

    const imageUrl = product.image
        ? product.image.startsWith('/uploads')
            ? `${BACKEND_URL}${product.image}`
            : product.image
        : null;

    const handleAdd = () => {
        addToCart(product, qty);
        onClose();
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    className="w-full sm:max-w-lg rounded-[7px]-t-[7px] sm:rounded-[7px] overflow-hidden"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25 }}
                >
                    {/* Image */}
                    <div className="relative h-56 sm:h-64">
                        {imageUrl ? (
                            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400"
                                style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.05), rgba(249,115,22,0.05))' }}>
                                <FiImage size={64} />
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-9 h-9 rounded-[7px] flex items-center justify-center"
                            style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}
                        >
                            <FiX size={18} />
                        </button>
                        {product.hot_selling && (
                            <div className="absolute top-4 left-4">
                                <span className="badge-hot flex items-center gap-1">
                                    Top Selling
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-main)' }}>
                                    {product.name}
                                </h2>
                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                    {product.category?.name}
                                </span>
                            </div>
                            <div className="font-display font-bold text-2xl gradient-text">
                                Rs. {parseFloat(product.price).toLocaleString()}
                            </div>
                        </div>

                        {product.description && (
                            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                                {product.description}
                            </p>
                        )}

                        {/* Quantity + Add */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center rounded-[7px] overflow-hidden"
                                style={{ border: '2px solid var(--border)' }}>
                                <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                                    className="w-11 h-11 flex items-center justify-center transition-colors"
                                    style={{ color: 'var(--text-muted)' }}>
                                    <FiMinus />
                                </button>
                                <span className="w-10 text-center font-bold" style={{ color: 'var(--text-main)' }}>{qty}</span>
                                <button onClick={() => setQty((q) => q + 1)}
                                    className="w-11 h-11 flex items-center justify-center"
                                    style={{ color: 'var(--primary)' }}>
                                    <FiPlus />
                                </button>
                            </div>
                            <button onClick={handleAdd} className="btn-primary flex-1 justify-center py-3">
                                <FiShoppingCart />
                                Add to Cart — Rs. {(parseFloat(product.price) * qty).toLocaleString()}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProductModal;