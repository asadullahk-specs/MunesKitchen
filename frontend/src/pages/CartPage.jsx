import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiTrash2, FiMinus, FiPlus, FiArrowRight, FiShoppingBag } from 'react-icons/fi'
import { useCart } from '../context/CartContext'
const BACKEND = 'http://localhost:5000'

const CartPage = () => {
    const { cart, removeFromCart, updateQuantity, clearCart, cartSubtotal } = useCart()

    const safeCart = Array.isArray(cart) ? cart : []

    // Force scroll to top on mount — overrides Framer Motion layout animation scroll restoration
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.body.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [])

    if (safeCart.length === 0) {
        return (
            <div className="page-enter py-24 flex items-center justify-center px-4">
                <div className="text-center">
                    <div
                        className="flex justify-center mb-5"
                        style={{ color: 'var(--primary)' }}
                    >
                        <FiShoppingBag size={72} />
                    </div>
                    <h2 className="font-bold text-2xl mb-2" style={{ color: 'var(--text-main)' }}>
                        Your cart is empty
                    </h2>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                        Add some delicious items from our menu
                    </p>
                    <Link to="/menu" className="btn-primary">
                        Browse Menu
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="animate-fadeIn min-h-screen py-6 px-3 sm:px-4">
            <div className="max-w-6xl mx-auto">

                <div className="flex items-center justify-between mb-8">
                    <h1 className="font-bold text-3xl" style={{ color: 'var(--text-main)' }}>
                        Your <span style={{ color: 'var(--primary)' }}>Cart</span>
                    </h1>
                    <button
                        onClick={clearCart}
                        className="text-sm font-semibold transition-colors hover:underline"
                        style={{ color: 'var(--primary)' }}
                    >
                        Clear All
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    <div className="lg:col-span-3 space-y-4">
                        <AnimatePresence>
                            {safeCart.map((item) => {
                                const imgUrl = item.image
                                    ? item.image.startsWith('http')
                                        ? item.image
                                        : `${BACKEND}${item.image}`
                                    : `https://placehold.co/100x100/6b7280/fff?text=Food`

                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20, height: 0 }}
                                        className="card p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4"
                                    >
                                        <img
                                            src={imgUrl}
                                            alt={item.name}
                                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-[7px] object-cover shrink-0"
                                            onError={(e) => {
                                                e.target.src = `https://placehold.co/100x100/6b7280/fff?text=Food`
                                            }}
                                        />

                                        {/* Product Details Wrapper */}
                                        <div className="flex-1 min-w-0">
                                            <h3
                                                className="font-semibold text-sm whitespace-normal break-words"
                                                style={{ color: 'var(--text-main)' }}
                                            >
                                                {item.name}
                                            </h3>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                                Rs. {Number(item.price).toLocaleString()} each
                                            </p>
                                        </div>

                                        {/* Controls & Price Block (stacked vertically, aligned to the right) */}
                                        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-auto">
                                            <p className="font-bold text-sm" style={{ color: 'var(--primary)' }}>
                                                Rs. {(Number(item.price) * item.quantity).toLocaleString()}
                                            </p>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="transition-colors text-[var(--text-muted)] hover:text-[var(--primary)]"
                                            >
                                                <FiTrash2 size={15} />
                                            </button>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="qty-btn"
                                                    style={{ width: '28px', height: '28px' }}
                                                >
                                                    <FiMinus size={10} />
                                                </button>
                                                <span className="w-6 text-center text-xs font-bold" style={{ color: 'var(--text-main)' }}>
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="qty-btn"
                                                    style={{ width: '28px', height: '28px' }}
                                                >
                                                    <FiPlus size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="card p-5 lg:sticky lg:top-24">
                            <h2
                                className="font-bold text-lg mb-5"
                                style={{ color: 'var(--text-main)' }}
                            >
                                Order Summary
                            </h2>
                            <div className="space-y-3 mb-5">
                                {safeCart.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm gap-2">
                                        <span className="flex-1 min-w-0 truncate" style={{ color: 'var(--text-muted)' }}>
                                            {item.name} × {item.quantity}
                                        </span>
                                        <span className="shrink-0 font-semibold" style={{ color: 'var(--text-main)' }}>
                                            Rs. {(Number(item.price) * item.quantity).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div
                                className="pt-4"
                                style={{ borderTop: '1px solid var(--border)' }}
                            >
                                <div className="flex justify-between font-bold text-base mb-1">
                                    <span style={{ color: 'var(--text-main)' }}>Subtotal</span>
                                    <span style={{ color: 'var(--primary)' }}>
                                        Rs. {cartSubtotal.toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
                                    + Delivery charges at checkout
                                </p>
                                <Link
                                    to="/checkout"
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })} // FIX: Snaps screen to top instantly
                                    className="btn-primary w-full justify-center"
                                >
                                    Checkout <FiArrowRight size={16} />
                                </Link>
                                <Link
                                    to="/menu"
                                    className="btn-outline w-full justify-center mt-3 text-sm"
                                >
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default CartPage