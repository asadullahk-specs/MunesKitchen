import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiShoppingBag, FiMapPin, FiAlertCircle } from 'react-icons/fi'
import API from '../api/axios'
import { useCart } from '../context/CartContext'

const MAX_NAME = 30;
const MAX_PHONE = 11;

const FieldError = ({ message }) =>
    message ? (
        <p className="flex items-center gap-1 text-[11px] mt-1 font-medium" style={{ color: '#ef4444' }}>
            <FiAlertCircle size={11} />
            {message}
        </p>
    ) : null;

const CheckoutPage = () => {
    const { cart, cartSubtotal, clearCart } = useCart()
    const safeCart = Array.isArray(cart) ? cart : []
    const navigate = useNavigate()

    const [deliveryAreas, setDeliveryAreas] = useState([])
    const [selectedArea, setSelectedArea] = useState(null)
    const [loading, setLoading] = useState(false)
    const [areasLoading, setAreasLoading] = useState(true)

    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [deliveryAreaId, setDeliveryAreaId] = useState('')
    const [address, setAddress] = useState('')
    const [instructions, setInstructions] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery')

    const [touched, setTouched] = useState({})
    const [fieldErrors, setFieldErrors] = useState({})

    const validateField = (name, value) => {
        if (name === 'fullName') {
            if (!value.trim()) return 'Full name is required.';
            if (/\d/.test(value)) return 'Name cannot contain numbers.';
            if (value.length > MAX_NAME) return `Max ${MAX_NAME} characters allowed.`;
        }
        if (name === 'phone') {
            if (!value.trim()) return 'Phone number is required.';
            if (!/^\d+$/.test(value)) return 'Phone must contain digits only.';
            if (value.length !== MAX_PHONE) return `Phone must be exactly ${MAX_PHONE} digits.`;
        }
        if (name === 'address') {
            if (!value.trim()) return 'Address is required.';
        }
        return '';
    };

    const handleBlur = (name) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        const value = name === 'fullName' ? fullName : name === 'phone' ? phone : address;
        setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const handleNameChange = (val) => {
        setFullName(val);
        if (touched.fullName) {
            setFieldErrors(prev => ({ ...prev, fullName: validateField('fullName', val) }));
        }
    };

    const handlePhoneChange = (val) => {
        const digits = val.replace(/\D/g, '').slice(0, MAX_PHONE);
        setPhone(digits);
        if (touched.phone) {
            setFieldErrors(prev => ({ ...prev, phone: validateField('phone', digits) }));
        }
    };

    const handleAddressChange = (val) => {
        setAddress(val);
        if (touched.address) {
            setFieldErrors(prev => ({ ...prev, address: validateField('address', val) }));
        }
    };

    // Fetch delivery areas on mount
    useEffect(() => {
        setAreasLoading(true)
        API.get('/delivery')
            .then((r) => {
                // Check the exact structure returned by the controller
                const areas = r.data.areas || [];
                setDeliveryAreas(areas)
            })
            .catch((err) => {
                console.error("Fetch Error:", err);
                toast.error('Could not load delivery areas')
            })
            .finally(() => setAreasLoading(false))
    }, [])

    // Track chosen delivery area details
    useEffect(() => {
        if (deliveryAreaId && deliveryAreas.length > 0) {
            const area = deliveryAreas.find((a) => String(a.id || a._id) === String(deliveryAreaId))
            setSelectedArea(area || null)
        } else {
            setSelectedArea(null)
        }
    }, [deliveryAreaId, deliveryAreas])

    const deliveryCharge = selectedArea ? Number(selectedArea.charge || 0) : 0
    const total = cartSubtotal + deliveryCharge

    const handleSubmit = async () => {
        const nameErr = validateField('fullName', fullName);
        const phoneErr = validateField('phone', phone);
        const addrErr = validateField('address', address);

        setFieldErrors({ fullName: nameErr, phone: phoneErr, address: addrErr });
        setTouched({ fullName: true, phone: true, address: true });

        if (nameErr || phoneErr || addrErr) {
            toast.error('Please resolve the errors in the form.');
            return;
        }
        if (loading) return

        const cartItems = [...safeCart]
        const subtotal = cartSubtotal

        setLoading(true)
        try {
            const payload = {
                full_name: fullName,
                phone,
                email,
                delivery_area_id: deliveryAreaId || null,
                address,
                additional_instructions: instructions,
                payment_method: paymentMethod,
                items: cartItems.map((item) => ({
                    product_id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                })),
                subtotal,
                delivery_charge: deliveryCharge,
                total: subtotal + deliveryCharge,
            }

            const { data } = await API.post('/orders', payload)

            if (data.success) {
                toast.success('Order placed successfully!')

                // 1. Clear out the global basket context items
                clearCart()

                // 2. Route them directly to the tracking view using the code from the backend response!
                navigate(`/track/${data.orderNumber}`)
            } else {
                toast.error(data.message || 'Order failed')
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to place order')
        } finally {
            setLoading(false)
        }
    }

    // EMPTY CART FALLBACK VIEW
    if (safeCart.length === 0) {
        return (
            <div className="page-enter min-h-screen flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="flex justify-center mb-4" style={{ color: 'var(--primary)' }}><FiShoppingBag size={64} /></div>
                    <p className="font-bold text-xl mb-2" style={{ color: 'var(--text-main)' }}>
                        Your cart is empty
                    </p>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                        Add some items from our menu to get started
                    </p>
                    <Link to="/menu" className="btn-primary">Browse Menu</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="page-enter min-h-screen py-10 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">

                <div className="text-center mb-10">
                    <p className="text-xs font-bold uppercase tracking-widest mb-3"
                        style={{ color: 'var(--primary)' }}>
                        Almost there
                    </p>
                    <h1 className="section-title">
                        Finalize Your <span style={{ color: 'var(--primary)' }}>Order</span>
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left Form Content Wrapper */}
                    <div className="lg:col-span-3 space-y-5">
                        <div className="card p-5 sm:p-6">
                            <h2 className="font-bold text-lg mb-5" style={{ color: 'var(--text-main)' }}>
                                Delivery Information
                            </h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="form-label">Full Name *</label>
                                        <div className="relative">
                                            <input
                                                className="form-input"
                                                placeholder="Your full name"
                                                value={fullName}
                                                onChange={(e) => handleNameChange(e.target.value)}
                                                onBlur={() => handleBlur('fullName')}
                                                style={touched.fullName && fieldErrors.fullName ? { borderColor: '#ef4444' } : {}}
                                            />
                                            <span
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400"
                                            >
                                                {fullName.length}/{MAX_NAME}
                                            </span>
                                        </div>
                                        <FieldError message={touched.fullName ? fieldErrors.fullName : ''} />
                                    </div>
                                    <div>
                                        <label className="form-label">Phone *</label>
                                        <div className="relative">
                                            <input
                                                className="form-input"
                                                placeholder="03XX XXXXXXX"
                                                value={phone}
                                                onChange={(e) => handlePhoneChange(e.target.value)}
                                                onBlur={() => handleBlur('phone')}
                                                maxLength={MAX_PHONE}
                                                style={touched.phone && fieldErrors.phone ? { borderColor: '#ef4444' } : {}}
                                            />
                                            {phone && (
                                                <span
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400"
                                                >
                                                    {phone.length}/{MAX_PHONE}
                                                </span>
                                            )}
                                        </div>
                                        <FieldError message={touched.phone ? fieldErrors.phone : ''} />
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">Email</label>
                                    <input className="form-input" type="email" placeholder="Optional"
                                        value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>

                                <div>
                                    <label className="form-label">
                                        <FiMapPin size={11} className="inline mr-1" />
                                        Delivery Area
                                    </label>
                                    <select className="form-input" value={deliveryAreaId}
                                        onChange={(e) => setDeliveryAreaId(e.target.value)}
                                        disabled={areasLoading}>
                                        <option value="">
                                            {areasLoading ? 'Loading areas...'
                                                : deliveryAreas.length === 0 ? 'No areas available'
                                                    : 'Select your area'}
                                        </option>
                                        {deliveryAreas.map((area) => (
                                            <option key={area.id || area._id} value={area.id || area._id}>
                                                {area.name} (Rs. {Number(area.charge || 0).toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="form-label">Full Address *</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        style={Object.assign({ resize: 'none' }, touched.address && fieldErrors.address ? { borderColor: '#ef4444' } : {})}
                                        placeholder="Street, area, landmarks..."
                                        value={address}
                                        onChange={(e) => handleAddressChange(e.target.value)}
                                        onBlur={() => handleBlur('address')}
                                    />
                                    <FieldError message={touched.address ? fieldErrors.address : ''} />
                                </div>

                                <div>
                                    <label className="form-label">Additional Instructions</label>
                                    <textarea className="form-input" rows={2} style={{ resize: 'none' }}
                                        placeholder="Any special requests?"
                                        value={instructions} onChange={(e) => setInstructions(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="card p-5 sm:p-6">
                            <h2 className="font-bold text-lg mb-5" style={{ color: 'var(--text-main)' }}>
                                Payment Method
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { value: 'cash_on_delivery', label: 'Cash on Delivery' },
                                    { value: 'easypaisa', label: 'Easypaisa' },
                                    { value: 'bank_transfer', label: 'Bank Transfer' },
                                ].map((method) => (
                                    <button key={method.value} onClick={() => setPaymentMethod(method.value)}
                                        className="p-4 sm:p-3 rounded-[7px] text-center transition-all"
                                        style={{
                                            border: paymentMethod === method.value
                                                ? '2px solid #16a34a' : '2px solid var(--border)',
                                            background: paymentMethod === method.value
                                                ? 'rgba(22,163,74,0.08)' : 'var(--bg-card)',
                                        }}>
                                        <p className="text-sm sm:text-xs font-semibold leading-tight"
                                            style={{
                                                color: paymentMethod === method.value
                                                    ? '#16a34a' : 'var(--text-main)',
                                            }}>
                                            {method.label}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Summary Pane Layout */}
                    <div className="lg:col-span-2">
                        <div className="card p-5 sm:p-6 lg:sticky lg:top-24">
                            <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-main)' }}>
                                Order Summary
                            </h2>
                            <div className="space-y-2 mb-4">
                                {safeCart.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm gap-2">
                                        <span className="flex-1 min-w-0 truncate" style={{ color: 'var(--text-muted)' }}>
                                            {item.name} × {item.quantity}
                                        </span>
                                        <span className="shrink-0 font-medium" style={{ color: 'var(--text-main)' }}>
                                            Rs. {(Number(item.price) * item.quantity).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                                <div className="flex justify-between text-sm">
                                    <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                                    <span style={{ color: 'var(--text-main)' }}>
                                        Rs. {cartSubtotal.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span style={{ color: 'var(--text-muted)' }}>Delivery</span>
                                    <span style={{ color: 'var(--text-main)' }}>
                                        {deliveryCharge > 0 ? `Rs. ${deliveryCharge.toLocaleString()}` : '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between font-bold text-base pt-2"
                                    style={{ borderTop: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-main)' }}>Total</span>
                                    <span style={{ color: 'var(--primary)' }}>
                                        Rs. {total.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <button onClick={handleSubmit} disabled={loading}
                                className="btn-primary w-full justify-center mt-5">
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-[7px] animate-spin" />
                                        Placing Order...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <FiShoppingBag size={16} /> Place Order
                                    </span>
                                )}
                            </button>
                            <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
                                We will call you to confirm your order
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default CheckoutPage