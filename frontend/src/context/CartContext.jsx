import { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'react-toastify'

const CartContext = createContext()

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try {
            const saved = localStorage.getItem('mk_cart')
            return saved ? JSON.parse(saved) : []
        } catch {
            return []
        }
    })

    useEffect(() => {
        localStorage.setItem('mk_cart', JSON.stringify(cart))
    }, [cart])

    const addToCart = (product, quantity = 1) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                )
            }
            return [...prev, { ...product, quantity }]
        })
        toast.success(
            <div className="flex items-center justify-between w-full" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <span className="font-semibold text-sm" style={{ color: '#fff' }}>Added to cart!</span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = '/cart';
                    }}
                    className="btn-primary"
                    style={{
                        padding: '6px 14px',
                        fontSize: '0.75rem',
                        borderRadius: '7px',
                        cursor: 'pointer',
                        marginLeft: '12px',
                        border: 'none',
                        color: 'white',
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                >
                    View Cart
                </button>
            </div>,
            {
                autoClose: 4000
            }
        )
    }

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId))
        toast.error('Item removed')
    }

    const updateQuantity = (productId, newQty) => {
        if (newQty <= 0) {
            removeFromCart(productId)
            return
        }
        setCart(prev =>
            prev.map(item =>
                item.id === productId ? { ...item, quantity: newQty } : item
            )
        )
    }

    const clearCart = () => {
        setCart([])
    }

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
    const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

    return (
        <CartContext.Provider value={{
            cart, addToCart, removeFromCart, updateQuantity,
            clearCart, cartCount, cartSubtotal
        }}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => {
    const ctx = useContext(CartContext)
    if (!ctx) throw new Error('useCart must be inside CartProvider')
    return ctx
}