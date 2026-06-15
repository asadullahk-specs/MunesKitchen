import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiPhone, FiUser, FiMessageCircle, FiMail, FiBookOpen, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { createContact } from '../api/contacts';
import { getSubjects } from '../api/subjects';

const MAX_PHONE_03 = 11;
const MAX_PHONE_92 = 12;

const FieldError = ({ message }) =>
    message ? (
        <p className="flex items-center gap-1 text-[11px] mt-1 font-medium" style={{ color: '#ef4444' }}>
            <FiAlertCircle size={11} />
            {message}
        </p>
    ) : null;

// Normalize phone: strip spaces, strip +
const normalizePhone = (val) => val.replace(/[\s+]/g, '');

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

const ContactForm = () => {
    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [hasTyped, setHasTyped] = useState({});

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await getSubjects();
                setSubjects(res?.data?.subjects || []);
            } catch (err) {
                console.error("Failed to load subjects:", err);
            }
        };
        fetchSubjects();
    }, []);

    const validateField = (name, value) => {
        if (name === 'name') {
            if (!value.trim()) return 'Name is required.';
            if (/\d/.test(value)) return 'Name cannot contain numbers.';
        }
        if (name === 'email') {
            if (!value.trim()) return 'Email is required.';
            if (!value.includes('@')) return 'Email must contain @.';
        }
        if (name === 'phone') {
            return validatePhone(value);
        }
        if (name === 'subject') {
            if (!value.trim()) return 'Subject is required.';
        }
        if (name === 'message') {
            if (!value.trim()) return 'Message is required.';
        }
        return '';
    };

    const handleBlur = (name) => {
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
            setForm(prev => ({ ...prev, name: noDigits }));
            setHasTyped(prev => ({ ...prev, name: true }));
            if (touched.name) setFieldErrors(prev => ({ ...prev, name: validateField('name', noDigits) }));
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
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            <FiUser className="inline mr-1" /> Full Name *
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Your full name"
                            value={form.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            onBlur={() => handleBlur('name')}
                            style={touched.name && fieldErrors.name ? { borderColor: '#ef4444' } : {}}
                        />
                        <FieldError message={touched.name ? fieldErrors.name : ''} />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            <FiMail className="inline mr-1" /> Email Address *
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="yourname@example.com"
                            value={form.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            onBlur={() => handleBlur('email')}
                            style={touched.email && fieldErrors.email ? { borderColor: '#ef4444' } : {}}
                        />
                        <FieldError message={touched.email ? fieldErrors.email : ''} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            <FiPhone className="inline mr-1" /> Phone Number *
                        </label>
                        <input
                            type="text"
                            inputMode="tel"
                            className="input-field"
                            placeholder="03XX... or 923XX"
                            value={form.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            onBlur={() => handleBlur('phone')}
                            style={touched.phone && fieldErrors.phone ? { borderColor: '#ef4444' } : {}}
                        />
                        <FieldError message={touched.phone ? fieldErrors.phone : ''} />
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            <FiBookOpen className="inline mr-1" /> Subject *
                        </label>
                        <select
                            className="input-field"
                            value={form.subject}
                            onChange={(e) => handleChange('subject', e.target.value)}
                            onBlur={() => handleBlur('subject')}
                            style={touched.subject && fieldErrors.subject ? { borderColor: '#ef4444' } : {}}
                        >
                            <option value="">Select subject</option>
                            {subjects.map((sub) => (
                                <option key={sub.id} value={sub.name}>
                                    {sub.name}
                                </option>
                            ))}
                        </select>
                        <FieldError message={touched.subject ? fieldErrors.subject : ''} />
                    </div>
                </div>

                {/* Message */}
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