import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { FiPhoneCall, FiMail, FiMapPin, FiSend, FiClock } from 'react-icons/fi'
import API from '../api/axios'

const ContactPage = () => {

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error('Name is required')
            return
        }
        if (!message.trim()) {
            toast.error('Message is required')
            return
        }
        setLoading(true)
        try {
            await API.post('/contacts', {
                name,
                email: email.trim() || null,
                phone: phone.trim() || null,
                subject: subject.trim() || null,
                message
            })
            toast.success('Message sent! We will contact you soon.')
            setName('')
            setEmail('')
            setPhone('')
            setSubject('')
            setMessage('')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send message')
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            className="min-h-screen py-12 px-4 sm:px-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >

            <div className="max-w-5xl mx-auto">

                <div className="text-center mb-12">
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>
                        Get in Touch
                    </p>
                    <h1 className="section-title mb-4">
                        Contact <span style={{ color: 'var(--primary)' }}>Us</span>
                    </h1>
                    <p className="section-subtitle">
                        Have a question or need help with your order? We are here for you.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Contact Form — first on all screen sizes */}
                    <div className="card p-6">

                        <h2 className="font-display font-bold text-xl mb-6" style={{ color: 'var(--text-main)' }}>
                            Send a Message
                        </h2>

                        <div className="space-y-4">

                            <div>
                                <label className="form-label">Your Name *</label>
                                <input
                                    className="form-input"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="form-label">Email Address</label>
                                <input
                                    className="form-input"
                                    type="email"
                                    placeholder="yourname@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                                <label className="form-label">Subject</label>
                                <input
                                    className="form-input"
                                    placeholder="How can we help you?"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="form-label">Message *</label>
                                <textarea
                                    className="form-input"
                                    rows={4}
                                    placeholder="Type your message here..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
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

                    {/* Contact Details — second on all screen sizes */}
                    <div className="flex flex-col gap-4">

                        {/* Phone Card */}
                        <div className="card p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shrink-0 shadow-lg">
                                <FiPhoneCall size={18} className="text-white" />
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

                        {/* Email Card */}
                        <div className="card p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shrink-0 shadow-lg">
                                <FiMail size={18} className="text-white" />
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

                        {/* Location Card */}
                        <div className="card p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shrink-0 shadow-lg">
                                <FiMapPin size={18} className="text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>
                                    Location
                                </p>
                                <p className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>
                                    Peshawar, KPK, Pakistan
                                </p>
                            </div>
                        </div>

                        {/* WhatsApp Link Card */}
                        <a href="https://wa.me/923032683689" target="_blank" rel="noreferrer" className="card p-5 flex items-center gap-4 transition-all hover:shadow-lg" style={{ textDecoration: 'none' }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg" style={{ background: '#25D366' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
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

                        {/* Notice Card */}
                        <div className="rounded-2xl p-4 text-sm flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--text-muted)' }}>
                            <FiClock size={16} className="animate-pulse shrink-0 text-red-500" />
                            <span>Please place orders at least 3 hours before your desired delivery time.</span>
                        </div>

                    </div>

                </div>

            </div>

        </motion.div>
    )

}

export default ContactPage