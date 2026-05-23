import { useState } from 'react'
import { toast } from 'react-toastify'
import { FiPhone, FiMail, FiMapPin, FiSend } from 'react-icons/fi'
import API from '../api/axios'

const ContactPage = () => {

    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!name.trim() || !phone.trim()) {
            toast.error('Name and phone number are required')
            return
        }
        setLoading(true)
        try {
            await API.post('/contacts', { name, phone, message })
            toast.success('Message sent! We will contact you soon.')
            setName('')
            setPhone('')
            setMessage('')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send message')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page-enter min-h-screen py-12 px-4 sm:px-6">

            <div className="max-w-5xl mx-auto">

                <div className="text-center mb-12">
                    <p className="text-xs font-bold uppercase tracking-widest mb-3 text-red-500">
                        Get in Touch
                    </p>
                    <h1 className="section-title mb-4">
                        Contact <span className="text-red-500">Us</span>
                    </h1>
                    <p className="section-subtitle">
                        Have a question or need help with your order? We are here for you.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    <div className="flex flex-col gap-4">

                        <div className="card p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shrink-0 shadow-lg">
                                <FiPhone size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>
                                    Phone
                                </p>
                                <a href="tel:+923032683689" className="font-semibold text-sm hover:text-red-500 transition-colors" style={{ color: 'var(--text-main)' }}>
                                    +92 303 2683689
                                </a>
                            </div>
                        </div>

                        <div className="card p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shrink-0 shadow-lg">
                                <FiMail size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>
                                    Email
                                </p>
                                <a href="mailto:muneskitchen@gmail.com" className="font-semibold text-sm hover:text-red-500 transition-colors" style={{ color: 'var(--text-main)' }}>
                                    muneskitchen@gmail.com
                                </a>
                            </div>
                        </div>

                        <div className="card p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shrink-0 shadow-lg">
                                <FiMapPin size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>
                                    Location
                                </p>
                                <p className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>
                                    Abbottabad, KPK, Pakistan
                                </p>
                            </div>
                        </div>

                        <a href="https://wa.me/923032683689" target="_blank" rel="noreferrer" className="card p-5 flex items-center gap-4 transition-all hover:shadow-lg" style={{ textDecoration: 'none' }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg text-xl" style={{ background: '#25D366' }}>
                                💬
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>
                                    WhatsApp
                                </p>
                                <p className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>
                                    Chat with us directly
                                </p>
                            </div>
                        </a>

                        <div className="rounded-2xl p-4 text-sm" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--text-muted)' }}>
                            ⏰ Please place orders at least 3 hours before your desired delivery time.
                        </div>

                    </div>

                    <div className="card p-6">

                        <h2 className="font-display font-bold text-xl mb-6" style={{ color: 'var(--text-main)' }}>
                            Send a Message
                        </h2>

                        <div className="space-y-4">

                            <div>
                                <label className="form-label">Your Name</label>
                                <input
                                    className="form-input"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="form-label">Phone Number</label>
                                <input
                                    className="form-input"
                                    placeholder="+92 300 0000000"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="form-label">Message</label>
                                <textarea
                                    className="form-input"
                                    rows={5}
                                    placeholder="Type your message here..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>

                            <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full justify-center py-3">
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Sending...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <FiSend size={15} />
                                        Send Message
                                    </span>
                                )}
                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    )

}

export default ContactPage