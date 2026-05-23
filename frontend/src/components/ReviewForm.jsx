import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiSend, FiImage, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { createReview } from '../api/reviews';
import { getProducts } from '../api/products';

const ReviewForm = ({ onSuccess }) => {
    const [form, setForm] = useState({ customer_name: '', product_id: '', rating: 0, message: '', instructions: '' });
    const [hover, setHover] = useState(0);
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [dbProducts, setDbProducts] = useState([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchAllProds = async () => {
            try {
                const res = await getProducts({ show_on_menu: true });
                setDbProducts(res?.data?.data || []);
            } catch (err) {
                console.error("Failed to load products for dropdown:", err);
            }
        };
        fetchAllProds();
    }, []);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length > 5) {
            toast.error('You can upload a maximum of 5 images.');
            e.target.value = '';
            return;
        }
        const newImages = [...images, ...files];
        setImages(newImages);
        const newPreviews = files.map(f => URL.createObjectURL(f));
        setPreviews(prev => [...prev, ...newPreviews]);
        e.target.value = '';
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.customer_name.trim()) { toast.error('Please enter your name.'); return; }
        if (form.rating === 0) { toast.error('Please select a rating.'); return; }
        if (!form.message.trim()) { toast.error('Please write a message.'); return; }

        const formData = new FormData();
        formData.append('customer_name', form.customer_name);
        formData.append('product_id', form.product_id);
        formData.append('rating', form.rating);
        formData.append('message', form.message);
        formData.append('instructions', form.instructions);
        images.forEach(file => formData.append('images', file));

        setLoading(true);
        try {
            const res = await createReview(formData);
            toast.success('Thank you! Your review will appear after approval.');
            onSuccess && onSuccess(res.data.data);
            setForm({ customer_name: '', product_id: '', rating: 0, message: '' });
            previews.forEach(url => URL.revokeObjectURL(url));
            setImages([]);
            setPreviews([]);
        } catch (err) {
            console.error(err);
            toast.error('Failed to submit review. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="card p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
        >
            <h3 className="font-display font-semibold text-xl mb-5" style={{ color: 'var(--text-main)' }}>
                Share Your Experience
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            Your Name *
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter your name"
                            value={form.customer_name}
                            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            Item Ordered
                        </label>
                        <select
                            className="input-field"
                            value={form.product_id}
                            onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                        >
                            <option value="">Select an item (optional)</option>
                            {dbProducts.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Star Rating */}
                <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                        Rating *
                    </label>
                    <div className="flex gap-2 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setForm({ ...form, rating: star })}
                                onMouseEnter={() => setHover(star)}
                                onMouseLeave={() => setHover(0)}
                                className="transition-transform hover:scale-125"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                            >
                                <FiStar
                                    size={28}
                                    fill={(hover || form.rating) >= star ? '#f59e0b' : 'none'}
                                    stroke={(hover || form.rating) >= star ? '#f59e0b' : 'var(--text-muted)'}
                                    strokeWidth={2}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Message */}
                <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        Message *
                    </label>
                    <textarea
                        className="input-field resize-none"
                        rows={3}
                        placeholder="Tell us about your experience..."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                        Upload Photos <span style={{ fontWeight: 400 }}>(Optional · max 5)</span>
                    </label>

                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />

                    <div className="flex flex-wrap gap-3">
                        <AnimatePresence>
                            {previews.map((src, idx) => (
                                <motion.div
                                    key={src}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    style={{ position: 'relative', width: 80, height: 80 }}
                                >
                                    <img
                                        src={src}
                                        alt={`preview-${idx}`}
                                        style={{
                                            width: 80, height: 80,
                                            objectFit: 'cover',
                                            borderRadius: 10,
                                            border: '1.5px solid var(--border)',
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        style={{
                                            position: 'absolute', top: -6, right: -6,
                                            width: 20, height: 20,
                                            borderRadius: '50%',
                                            background: '#ef4444',
                                            color: '#fff',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <FiX size={11} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {images.length < 5 && (
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    width: 80, height: 80,
                                    borderRadius: 10,
                                    border: '1.5px dashed var(--border)',
                                    background: 'var(--bg-input)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 4,
                                    color: 'var(--text-muted)',
                                    fontSize: 11,
                                }}
                            >
                                <FiImage size={20} />
                                <span>Add Photo</span>
                            </motion.button>
                        )}
                    </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary justify-center py-3">
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <><FiSend /> Submit Review</>
                    )}
                </button>
            </form>
        </motion.div>
    );
};

export default ReviewForm;