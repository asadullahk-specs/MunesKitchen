import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiPhone, FiUser, FiMessageCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { createContact } from '../api/contacts';

const ContactForm = () => {
    const [form, setForm] = useState({ name: '', phone: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.phone || !form.message) {
            toast.error('All fields are required');
            return;
        }
        setLoading(true);
        try {
            await createContact(form);
            toast.success('Message sent! We will get back to you soon.');
            setForm({ name: '', phone: '', message: '' });
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
                <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        <FiUser className="inline mr-1" /> Full Name
                    </label>
                    <input type="text" className="input-field" placeholder="Your full name"
                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        <FiPhone className="inline mr-1" /> Phone Number
                    </label>
                    <input type="tel" className="input-field" placeholder="+92 3XX XXXXXXX"
                        value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        <FiMessageCircle className="inline mr-1" /> Message
                    </label>
                    <textarea className="input-field resize-none" rows={4} placeholder="Write your message..."
                        value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </div>
                <button type="submit" disabled={loading} className="btn-primary justify-center py-3">
                    {loading
                        ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><FiSend /> Send Message</>
                    }
                </button>
            </form>
        </motion.div>
    );
};

export default ContactForm;