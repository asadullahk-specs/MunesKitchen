import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { FiPhoneCall, FiMail, FiMapPin, FiSend, FiClock, FiInfo, FiAlertCircle } from 'react-icons/fi'
import API from '../api/axios'

const MAX_NAME = 25
const MAX_PHONE_03 = 11
const MAX_PHONE_92 = 13
const MAX_SUBJECT_WORDS = 3
const MAX_MSG = 50
const MAX_EMAIL = 15

const FieldError = ({ message }) =>
    message ? (
        <p className="flex items-center gap-1 text-[11px] mt-1 font-medium" style={{ color: '#ef4444' }}>
            <FiAlertCircle size={11} />
            {message}
        </p>
    ) : null

const normalizePhone = (val) => val.replace(/[\s+]/g, '')

const getPhoneMax = (val) => val.startsWith('92') ? MAX_PHONE_92 : MAX_PHONE_03

const validatePhone = (value) => {
    if (!value.trim()) return 'Phone number is required.'
    if (value.startsWith('03')) {
        if (value.length !== MAX_PHONE_03) return `Phone starting with 03 must be exactly ${MAX_PHONE_03} digits.`
    } else if (value.startsWith('92')) {
        if (value.length !== MAX_PHONE_92) return `Phone starting with 92 must be exactly ${MAX_PHONE_92} digits.`
    } else {
        return 'Phone must start with 03 or 92.'
    }
    return ''
}

const countWords = (text) => text.trim() === '' ? 0 : text.trim().split(/\s+/).length

const ContactPage = () => {

    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
    const [loading, setLoading] = useState(false)
    const [touched, setTouched] = useState({})
    const [fieldErrors, setFieldErrors] = useState({})
    const [focusedField, setFocusedField] = useState(null)
    const [hasTyped, setHasTyped] = useState({})

    const validateField = (name, value) => {
        if (name === 'name') {
            if (!value.trim()) return 'Name is required.'
            if (/\d/.test(value)) return 'Name cannot contain numbers.'
            if (value.length > MAX_NAME) return `Max ${MAX_NAME} characters allowed.`
        }
        if (name === 'email') {
            if (!value.trim()) return 'Email is required.'
            if (value.length > MAX_EMAIL) return `Max ${MAX_EMAIL} characters allowed.`
            if (!value.includes('@')) return 'Email must contain @.'
        }
        if (name === 'phone') {
            return validatePhone(value)
        }
        if (name === 'subject') {
            if (!value.trim()) return 'Subject is required.'
            if (countWords(value) > MAX_SUBJECT_WORDS) return `Subject max ${MAX_SUBJECT_WORDS} words.`
        }
        if (name === 'message') {
            if (!value.trim()) return 'Message is required.'
            if (value.length > MAX_MSG) return `Max ${MAX_MSG} characters allowed.`
        }
        return ''
    }

    const handleBlur = (name) => {
        setFocusedField(null)
        if (hasTyped[name]) {
            setTouched(prev => ({ ...prev, [name]: true }))
            setFieldErrors(prev => ({ ...prev, [name]: validateField(name, form[name] || '') }))
        }
    }

    const handleChange = (name, value) => {
        if (name === 'phone') {
            const clean = normalizePhone(value)
            const digits = clean.replace(/\D/g, '')
            const maxLen = digits.startsWith('92') ? MAX_PHONE_92 : MAX_PHONE_03
            const limited = digits.slice(0, maxLen)
            setForm(prev => ({ ...prev, phone: limited }))
            setHasTyped(prev => ({ ...prev, phone: true }))
            if (touched.phone) setFieldErrors(prev => ({ ...prev, phone: validatePhone(limited) }))
            return
        }
        if (name === 'name') {
            const noDigits = value.replace(/\d/g, '')
            const limited = noDigits.slice(0, MAX_NAME)
            setForm(prev => ({ ...prev, name: limited }))
            setHasTyped(prev => ({ ...prev, name: true }))
            if (touched.name) setFieldErrors(prev => ({ ...prev, name: validateField('name', limited) }))
            return
        }
        if (name === 'subject') {
            const words = value.trim() === '' ? [] : value.trim().split(/\s+/)
            if (words.length > MAX_SUBJECT_WORDS) return
            setForm(prev => ({ ...prev, subject: value }))
            setHasTyped(prev => ({ ...prev, subject: true }))
            if (touched.subject) setFieldErrors(prev => ({ ...prev, subject: validateField('subject', value) }))
            return
        }
        if (name === 'message') {
            const limited = value.slice(0, MAX_MSG)
            setForm(prev => ({ ...prev, message: limited }))
            setHasTyped(prev => ({ ...prev, message: true }))
            if (touched.message) setFieldErrors(prev => ({ ...prev, message: validateField('message', limited) }))
            return
        }
        if (name === 'email') {
            const limited = value.slice(0, MAX_EMAIL)
            setForm(prev => ({ ...prev, email: limited }))
            setHasTyped(prev => ({ ...prev, email: true }))
            if (touched.email) setFieldErrors(prev => ({ ...prev, email: validateField('email', limited) }))
            return
        }
        setForm(prev => ({ ...prev, [name]: value }))
        setHasTyped(prev => ({ ...prev, [name]: true }))
        if (touched[name]) setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
    }

    const handleSubmit = async () => {
        const nameErr = validateField('name', form.name)
        const emailErr = validateField('email', form.email)
        const msgErr = validateField('message', form.message)
        const phoneErr = validatePhone(form.phone)
        const subjectErr = validateField('subject', form.subject)
        setFieldErrors({ name: nameErr, email: emailErr, message: msgErr, phone: phoneErr, subject: subjectErr })
        setTouched({ name: true, email: true, message: true, phone: true, subject: true })

        const isCompletelyEmpty = !form.name.trim() && !form.email.trim() && !form.phone.trim() && !form.subject.trim() && !form.message.trim()
        if (isCompletelyEmpty) { toast.error('Please fill the form.'); return }

        const firstErr = nameErr || emailErr || phoneErr || subjectErr || msgErr
        if (firstErr) { toast.error(firstErr); return }

        setLoading(true)
        try {
            await API.post('/contacts', {
                name: form.name,
                email: form.email.trim() || null,
                phone: form.phone.trim() || null,
                subject: form.subject.trim() || null,
                message: form.message
            })
            toast.success('Message sent! We will contact you soon.')
            setForm({ name: '', email: '', phone: '', subject: '', message: '' })
            setTouched({})
            setFieldErrors({})
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send message')
        } finally {
            setLoading(false)
        }
    }

    const phoneMax = form.phone.startsWith('92') ? MAX_PHONE_92 : MAX_PHONE_03
    const showNameCounter = focusedField === 'name' || form.name.length > 0
    const showPhoneCounter = focusedField === 'phone' || form.phone.length > 0
    const showSubjectCounter = focusedField === 'subject' || form.subject.length > 0
    const showMsgCounter = focusedField === 'message' || form.message.length > 0
    const showEmailCounter = focusedField === 'email' || form.email.length > 0

    return (
        <motion.div
            className="min-h-screen py-12 px-4 sm:px-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >

            <div className="max-w-6xl mx-auto">

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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

                    {/* Contact Form */}
                    <div className="card p-6 sm:p-7 flex flex-col">

                        <h2 className="font-display font-bold text-xl mb-6" style={{ color: 'var(--text-main)' }}>
                            Send a Message
                        </h2>

                        <div className="space-y-4">

                            {/* Name */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="form-label" style={{ marginBottom: 0 }}>Full Name *</label>
                                    {showNameCounter && (
                                        <span
                                            className="text-[10px] font-medium"
                                            style={{ color: form.name.length >= MAX_NAME ? '#ef4444' : 'var(--text-muted)' }}
                                        >
                                            {form.name.length}/{MAX_NAME}
                                        </span>
                                    )}
                                </div>
                                <input
                                    className="form-input"
                                    placeholder="Your full name"
                                    value={form.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    onFocus={() => setFocusedField('name')}
                                    onBlur={() => handleBlur('name')}
                                    style={touched.name && fieldErrors.name ? { borderColor: '#ef4444' } : {}}
                                />
                                <FieldError message={touched.name ? fieldErrors.name : ''} />
                            </div>

                            {/* Email */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="form-label" style={{ marginBottom: 0 }}>Email Address *</label>
                                    {showEmailCounter && (
                                        <span
                                            className="text-[10px] font-medium"
                                            style={{ color: form.email.length >= MAX_EMAIL ? '#ef4444' : 'var(--text-muted)' }}
                                        >
                                            {form.email.length}/{MAX_EMAIL}
                                        </span>
                                    )}
                                </div>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="yourname@example.com"
                                    value={form.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => handleBlur('email')}
                                    style={touched.email && fieldErrors.email ? { borderColor: '#ef4444' } : {}}
                                />
                                <FieldError message={touched.email ? fieldErrors.email : ''} />
                            </div>

                            {/* Phone */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="form-label" style={{ marginBottom: 0 }}>Phone Number *</label>
                                    {showPhoneCounter && (
                                        <span
                                            className="text-[10px] font-medium"
                                            style={{ color: form.phone.length >= phoneMax ? '#ef4444' : 'var(--text-muted)' }}
                                        >
                                            {form.phone.length}/{phoneMax}
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    inputMode="tel"
                                    className="form-input"
                                    placeholder="03XX... or 9203XX..."
                                    value={form.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    onFocus={() => setFocusedField('phone')}
                                    onBlur={() => handleBlur('phone')}
                                    style={touched.phone && fieldErrors.phone ? { borderColor: '#ef4444' } : {}}
                                />
                                <FieldError message={touched.phone ? fieldErrors.phone : ''} />
                            </div>

                            {/* Subject */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="form-label" style={{ marginBottom: 0 }}>Subject *</label>
                                    {showSubjectCounter && (
                                        <span
                                            className="text-[10px] font-medium"
                                            style={{ color: countWords(form.subject) >= MAX_SUBJECT_WORDS ? '#ef4444' : 'var(--text-muted)' }}
                                        >
                                            {countWords(form.subject)}/{MAX_SUBJECT_WORDS} words
                                        </span>
                                    )}
                                </div>
                                <input
                                    className="form-input"
                                    placeholder="How can we help?"
                                    value={form.subject}
                                    onChange={(e) => handleChange('subject', e.target.value)}
                                    onFocus={() => setFocusedField('subject')}
                                    onBlur={() => handleBlur('subject')}
                                    style={touched.subject && fieldErrors.subject ? { borderColor: '#ef4444' } : {}}
                                />
                                <FieldError message={touched.subject ? fieldErrors.subject : ''} />
                            </div>

                            {/* Message */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="form-label" style={{ marginBottom: 0 }}>Message *</label>
                                    {showMsgCounter && (
                                        <span
                                            className="text-[10px] font-medium"
                                            style={{ color: form.message.length >= MAX_MSG ? '#ef4444' : 'var(--text-muted)' }}
                                        >
                                            {form.message.length}/{MAX_MSG}
                                        </span>
                                    )}
                                </div>
                                <textarea
                                    className="form-input"
                                    rows={4}
                                    placeholder="Write your message..."
                                    value={form.message}
                                    onChange={(e) => handleChange('message', e.target.value)}
                                    onFocus={() => setFocusedField('message')}
                                    onBlur={() => handleBlur('message')}
                                    style={touched.message && fieldErrors.message ? { borderColor: '#ef4444', resize: 'none' } : { resize: 'none' }}
                                />
                                <FieldError message={touched.message ? fieldErrors.message : ''} />
                            </div>

                            <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full justify-center py-3">
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-[7px] animate-spin" />
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

                    {/* Contact Details */}
                    <div className="flex flex-col gap-4">

                        {/* Section Header */}
                        <div className="card p-5 flex flex-col justify-center" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', border: 'none' }}>
                            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Contact Information</p>
                            <h3 className="font-bold text-lg text-white">Any question? We're just a click away</h3>
                            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Reach us through any of the channels below</p>
                        </div>

                        {/* Phone Card */}
                        <div className="card p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[7px] flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}>
                                <FiPhoneCall size={18} className="text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>
                                    Phone
                                </p>
                                <a href="tel:+923032683689" className="font-semibold text-sm hover:text-[var(--primary)] transition-colors" style={{ color: 'var(--text-main)' }}>
                                    +92 303 2683689
                                </a>
                            </div>
                        </div>

                        {/* Email Card */}
                        <div className="card p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[7px] flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}>
                                <FiMail size={18} className="text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>
                                    Email
                                </p>
                                <a href="mailto:muneskitchen@gmail.com" className="font-semibold text-sm hover:text-[var(--primary)] transition-colors" style={{ color: 'var(--text-main)' }}>
                                    muneskitchen@gmail.com
                                </a>
                            </div>
                        </div>

                        {/* Location Card */}
                        <div className="card p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[7px] flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}>
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
                            <div className="w-12 h-12 rounded-[7px] flex items-center justify-center shrink-0 shadow-lg" style={{ background: '#25D366' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
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
                        <div className="rounded-[7px] p-4 text-sm flex items-center gap-2" style={{ background: 'var(--primary-glow)', border: '1px solid rgba(153,0,0,0.18)', color: 'var(--text-muted)' }}>
                            <FiClock size={16} className="animate-pulse shrink-0" style={{ color: 'var(--primary)' }} />
                            <span>Please place orders at least 3 hours before your desired delivery time.</span>
                        </div>

                        {/* Notice Card 2 */}
                        <div className="rounded-[7px] p-4 text-sm flex items-center gap-2" style={{ background: 'var(--primary-glow)', border: '1px solid rgba(153,0,0,0.18)', color: 'var(--text-muted)' }}>
                            <FiInfo size={16} className="shrink-0" style={{ color: 'var(--primary)' }} />
                            <span>Custom cooked options are also available for institutions, schools, offices, and events. Standard preparation and cooking charges apply.</span>
                        </div>

                    </div>

                </div>

            </div>

        </motion.div>
    )

}

export default ContactPage