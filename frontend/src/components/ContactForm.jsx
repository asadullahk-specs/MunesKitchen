import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiPhone, FiUser, FiMessageCircle, FiMail, FiBookOpen, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { createContact } from '../api/contacts';

const MAX_NAME = 25;
const MAX_PHONE_03 = 11;
const MAX_PHONE_92 = 13;
const MAX_SUBJECT_WORDS = 3;
const MAX_MSG = 50;
const MAX_EMAIL = 15;

const FieldError = ({ message }) =>
    message ? (
        <p className="flex items-center gap-1 text-[11px] mt-1 font-medium" style={{ color: '#ef4444' }}>
            <FiAlertCircle size={11} />
            {message}
        </p>
    ) : null;

// Normalize phone: strip spaces, strip +
const normalizePhone = (val) => val.replace(/[\s+]/g, '');

const getPhoneMax = (val) => val.startsWith('92') ? MAX_PHONE_92 : MAX_PHONE_03;

const validatePhone = (value) => {
    if (!value.trim()) return 'Phone number is required.';
    if (value.startsWith('03')) {
        if (value.length !== MAX_PHONE_03) return `Phone starting with 03 must be exactly ${MAX_PHONE_03} digits.`;
    } else if (value.startsWith('92')) {
        if (value.length !== MAX_PHONE_92) return `Phone starting with 92 must be exactly ${MAX_PHONE_92} digits.`;
    } else {
        return 'Phone must start with 03 or 92.';
    }
    return '';
};

const countWords = (text) => text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

const ContactForm = () => {
    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [focusedField, setFocusedField] = useState(null);
    const [hasTyped, setHasTyped] = useState({});

    const validateField = (name, value) => {
        if (name === 'name') {
            if (!value.trim()) return 'Name is required.';
            if (/\d/.test(value)) return 'Name cannot contain numbers.';
            if (value.length > MAX_NAME) return `Max ${MAX_NAME} characters allowed.`;
        }
        if (name === 'email') {
            if (!value.trim()) return 'Email is required.';
            if (value.length > MAX_EMAIL) return `Max ${MAX_EMAIL} characters allowed.`;
            if (!value.includes('@')) return 'Email must contain @.';
        }
        if (name === 'phone') {
            return validatePhone(value);
        }
        if (name === 'subject') {
            if (!value.trim()) return 'Subject is required.';
            if (countWords(value) > MAX_SUBJECT_WORDS) return `Subject max ${MAX_SUBJECT_WORDS} words.`;
        }
        if (name === 'message') {
            if (!value.trim()) return 'Message is required.';
            if (value.length > MAX_MSG) return `Max ${MAX_MSG} characters allowed.`;
        }
        return '';
    };

    const handleBlur = (name) => {
        setFocusedField(null);
        if (hasTyped[name]) {
            setTouched(prev => ({ ...prev, [name]: true }));
            setFieldErrors(prev => ({ ...prev, [name]: validateField(name, form[name] || '') }));
        }
    };

    const handleChange = (name, value) => {
        if (name === 'phone') {
            const clean = normalizePhone(value);
            const digits = clean.replace(/\D/g, '');
            const maxLen = digits.startsWith('92') ? MAX_PHONE_92 : MAX_PHONE_03;
            const limited = digits.slice(0, maxLen);
            setForm(prev => ({ ...prev, phone: limited }));
            setHasTyped(prev => ({ ...prev, phone: true }));
            if (touched.phone) setFieldErrors(prev => ({ ...prev, phone: validatePhone(limited) }));
            return;
        }
        if (name === 'name') {
            const noDigits = value.replace(/\d/g, '');
            const limited = noDigits.slice(0, MAX_NAME);
            setForm(prev => ({ ...prev, name: limited }));
            setHasTyped(prev => ({ ...prev, name: true }));
            if (touched.name) setFieldErrors(prev => ({ ...prev, name: validateField('name', limited) }));
            return;
        }
        if (name === 'subject') {
            const words = value.trim() === '' ? [] : value.trim().split(/\s+/);
            if (words.length > MAX_SUBJECT_WORDS) return;
            setForm(prev => ({ ...prev, subject: value }));
            setHasTyped(prev => ({ ...prev, subject: true }));
            if (touched.subject) setFieldErrors(prev => ({ ...prev, subject: validateField('subject', value) }));
            return;
        }
        if (name === 'message') {
            const limited = value.slice(0, MAX_MSG);
            setForm(prev => ({ ...prev, message: limited }));
            setHasTyped(prev => ({ ...prev, message: true }));
            if (touched.message) setFieldErrors(prev => ({ ...prev, message: validateField('message', limited) }));
            return;
        }
        if (name === 'email') {
            const limited = value.slice(0, MAX_EMAIL);
            setForm(prev => ({ ...prev, email: limited }));
            setHasTyped(prev => ({ ...prev, email: true }));
            if (touched.email) setFieldErrors(prev => ({ ...prev, email: validateField('email', limited) }));
            return;
        }
        setForm(prev => ({ ...prev, [name]: value }));
        setHasTyped(prev => ({ ...prev, [name]: true }));
        if (touched[name]) setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nameErr = validateField('name', form.name);
        const emailErr = validateField('email', form.email);
        const msgErr = validateField('message', form.message);
        const phoneErr = validatePhone(form.phone);
        const subjectErr = validateField('subject', form.subject);
        setFieldErrors({ name: nameErr, email: emailErr, message: msgErr, phone: phoneErr, subject: subjectErr });
        setTouched({ name: true, email: true, message: true, phone: true, subject: true });

        // If form is completely empty, show generic message
        const isCompletelyEmpty = !form.name.trim() && !form.email.trim() && !form.phone.trim() && !form.subject.trim() && !form.message.trim();
        if (isCompletelyEmpty) { toast.error('Please fill the form.'); return; }

        const firstErr = nameErr || emailErr || phoneErr || subjectErr || msgErr;
        if (firstErr) { toast.error(firstErr); return; }

        setLoading(true);
        try {
            await createContact(form);
            toast.success('Message sent! We will get back to you soon.');
            setForm({ name: '', email: '', phone: '', subject: '', message: '' });
            setTouched({});
            setFieldErrors({});
        } catch {
            toast.error('Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const phoneMax = form.phone.startsWith('92') ? MAX_PHONE_92 : MAX_PHONE_03;
    const showNameCounter = focusedField === 'name' || form.name.length > 0;
    const showPhoneCounter = focusedField === 'phone' || form.phone.length > 0;
    const showSubjectCounter = focusedField === 'subject' || form.subject.length > 0;
    const showMsgCounter = focusedField === 'message' || form.message.length > 0;
    const showEmailCounter = focusedField === 'email' || form.email.length > 0;

    return (
        <motion.div
            className="card p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                                <FiUser className="inline mr-1" /> Full Name *
                            </label>
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
                            type="text"
                            className="input-field"
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
                            <label className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                                <FiMail className="inline mr-1" /> Email Address *
                            </label>
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
                            type="text"
                            className="input-field"
                            placeholder="yourname@example.com"
                            value={form.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => handleBlur('email')}
                            style={touched.email && fieldErrors.email ? { borderColor: '#ef4444' } : {}}
                        />
                        <FieldError message={touched.email ? fieldErrors.email : ''} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                                <FiPhone className="inline mr-1" /> Phone Number *
                            </label>
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
                            className="input-field"
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
                            <label className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                                <FiBookOpen className="inline mr-1" /> Subject *
                            </label>
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
                            type="text"
                            className="input-field"
                            placeholder="How can we help?"
                            value={form.subject}
                            onChange={(e) => handleChange('subject', e.target.value)}
                            onFocus={() => setFocusedField('subject')}
                            onBlur={() => handleBlur('subject')}
                            style={touched.subject && fieldErrors.subject ? { borderColor: '#ef4444' } : {}}
                        />
                        <FieldError message={touched.subject ? fieldErrors.subject : ''} />
                    </div>
                </div>

                {/* Message */}
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                            <FiMessageCircle className="inline mr-1" /> Message *
                        </label>
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
                        className="input-field resize-none"
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

                <button type="submit" disabled={loading} className="btn-primary justify-center py-3">
                    {loading
                        ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-[7px] animate-spin" />
                        : <><FiSend /> Send Message</>
                    }
                </button>
            </form>
        </motion.div>
    );
};

export default ContactForm;