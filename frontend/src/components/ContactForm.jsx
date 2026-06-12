import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiPhone, FiUser, FiMessageCircle, FiMail, FiBookOpen, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { createContact } from '../api/contacts';

const MAX_NAME = 30;
const MAX_PHONE = 11;

const FieldError = ({ message }) =>
    message ? (
        <p className="flex items-center gap-1 text-[11px] mt-1 font-medium" style={{ color: '#ef4444' }}>
            <FiAlertCircle size={11} />
            {message}
        </p>
    ) : null;

const ContactForm = () => {
    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});

    const validateField = (name, value) => {
        if (name === 'name') {
            if (!value.trim()) return 'Name is required.';
            if (/\d/.test(value)) return 'Name cannot contain numbers.';
            if (value.length > MAX_NAME) return `Max ${MAX_NAME} characters allowed.`;
        }
        if (name === 'phone') {
            if (value && !/^\d+$/.test(value)) return 'Phone must contain digits only.';
            if (value && value.length > MAX_PHONE) return `Phone cannot exceed ${MAX_PHONE} digits.`;
        }
        if (name === 'message') {
            if (!value.trim()) return 'Message is required.';
        }
        return '';
    };

    const handleBlur = (name) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        setFieldErrors(prev => ({ ...prev, [name]: validateField(name, form[name] || '') }));
    };

    const handleChange = (name, value) => {
        // For phone: only allow digits, max 11
        if (name === 'phone') {
            const digits = value.replace(/\D/g, '').slice(0, MAX_PHONE + 2);
            setForm(prev => ({ ...prev, [name]: digits }));
            if (touched[name]) {
                setFieldErrors(prev => ({ ...prev, [name]: validateField(name, digits) }));
            }
            return;
        }
        // For name: enforce soft limit feedback
        setForm(prev => ({ ...prev, [name]: value }));
        if (touched[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validate required fields
        const nameErr = validateField('name', form.name);
        const msgErr = validateField('message', form.message);
        const phoneErr = validateField('phone', form.phone);
        setFieldErrors({ name: nameErr, message: msgErr, phone: phoneErr });
        setTouched({ name: true, message: true, phone: true });

        if (nameErr || msgErr || phoneErr) return;

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

    return (
        <motion.div
            className="card p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            <FiUser className="inline mr-1" /> Full Name *
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Your full name"
                                value={form.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                onBlur={() => handleBlur('name')}
                                style={touched.name && fieldErrors.name ? { borderColor: '#ef4444' } : {}}
                            />
                            {form.name.length > 0 && (
                                <span
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium"
                                    style={{ color: form.name.length > MAX_NAME ? '#ef4444' : 'var(--text-muted)' }}
                                >
                                    {form.name.length}/{MAX_NAME}
                                </span>
                            )}
                        </div>
                        <FieldError message={touched.name ? fieldErrors.name : ''} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            <FiMail className="inline mr-1" /> Email Address
                        </label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="yourname@example.com"
                            value={form.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            <FiPhone className="inline mr-1" /> Phone Number
                        </label>
                        <div className="relative">
                            <input
                                type="tel"
                                className="input-field"
                                placeholder="03XX XXXXXXX"
                                value={form.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                onBlur={() => handleBlur('phone')}
                                maxLength={MAX_PHONE}
                                style={touched.phone && fieldErrors.phone ? { borderColor: '#ef4444' } : {}}
                            />
                            {form.phone && (
                                <span
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium"
                                    style={{ color: form.phone.length > MAX_PHONE ? '#ef4444' : 'var(--text-muted)' }}
                                >
                                    {form.phone.length}/{MAX_PHONE}
                                </span>
                            )}
                        </div>
                        <FieldError message={touched.phone ? fieldErrors.phone : ''} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            <FiBookOpen className="inline mr-1" /> Subject
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="How can we help?"
                            value={form.subject}
                            onChange={(e) => handleChange('subject', e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        <FiMessageCircle className="inline mr-1" /> Message *
                    </label>
                    <textarea
                        className="input-field resize-none"
                        rows={4}
                        placeholder="Write your message..."
                        value={form.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        onBlur={() => handleBlur('message')}
                        style={touched.message && fieldErrors.message ? { borderColor: '#ef4444' } : {}}
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