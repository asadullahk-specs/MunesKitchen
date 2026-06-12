import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiSend, FiImage, FiX, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { createReview } from '../api/reviews';
import { getProducts } from '../api/products';

const MAX_NAME_CHARS = 30;
const MAX_MSG_WORDS = 25;

const countWords = (text) => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
};

const FieldError = ({ message }) => (
    message ? (
        <p className="flex items-center gap-1 text-[11px] mt-1 font-medium" style={{ color: '#ef4444' }}>
            <FiAlertCircle size={11} />
            {message}
        </p>
    ) : null
);

const ReviewForm = ({ onSuccess, productId }) => {
    const [form, setForm] = useState({ customer_name: '', product_id: productId || '', rating: 0, message: '', instructions: '' });
    const [hover, setHover] = useState(0);
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [dbProducts, setDbProducts] = useState([]);
    const [touched, setTouched] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (productId) {
            setForm(f => ({ ...f, product_id: productId }));
        }
    }, [productId]);

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

    // Validate a single field and return error string or ''
    const validateField = (name, value) => {
        if (name === 'customer_name') {
            if (!value.trim()) return 'Name is required.';
            if (/\d/.test(value)) return 'Name cannot contain numbers.';
            if (value.length > MAX_NAME_CHARS) return `Max ${MAX_NAME_CHARS} characters allowed.`;
        }
        if (name === 'message') {
            if (!value.trim()) return 'Message is required.';
            if (countWords(value) > MAX_MSG_WORDS) return `Max ${MAX_MSG_WORDS} words allowed.`;
        }
        return '';
    };

    const handleBlur = (name) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, form[name] || '');
        setFieldErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleNameChange = (val) => {
        // Allow typing but enforce limit
        const limited = val.slice(0, MAX_NAME_CHARS + 5); // allow a bit over for UX
        setForm(prev => ({ ...prev, customer_name: limited }));
        if (touched.customer_name) {
            setFieldErrors(prev => ({ ...prev, customer_name: validateField('customer_name', limited) }));
        }
    };

    const handleMessageChange = (val) => {
        setForm(prev => ({ ...prev, message: val }));
        if (touched.message) {
            setFieldErrors(prev => ({ ...prev, message: validateField('message', val) }));
        }
    };

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

        // Validate all required fields on submit
        const nameErr = validateField('customer_name', form.customer_name);
        const msgErr = validateField('message', form.message);
        setFieldErrors({ customer_name: nameErr, message: msgErr });
        setTouched({ customer_name: true, message: true });

        if (nameErr || msgErr) return;
        if (form.rating === 0) { toast.error('Please select a rating.'); return; }

        setLoading(true);
        try {
            // Compress images to max 400px and 0.45 JPEG quality to stay under Vercel's 4.5MB body limit
            const compressImage = (file) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        const maxDim = 400;
                        if (width > maxDim || height > maxDim) {
                            if (width > height) {
                                height = Math.round((height * maxDim) / width);
                                width = maxDim;
                            } else {
                                width = Math.round((width * maxDim) / height);
                                height = maxDim;
                            }
                        }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', 0.45));
                    };
                    img.onerror = reject;
                    img.src = e.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const images_base64 = await Promise.all(images.map(compressImage));

            const payload = {
                customer_name: form.customer_name,
                product_id: form.product_id || null,
                rating: form.rating,
                message: form.message,
                instructions: form.instructions || '',
                images_base64,
            };

            const res = await createReview(payload);
            toast.success('Thank you! Your review will appear after approval.');
            onSuccess && onSuccess(res.data.data);
            setForm({ customer_name: '', product_id: '', rating: 0, message: '' });
            previews.forEach(url => URL.revokeObjectURL(url));
            setImages([]);
            setPreviews([]);
            setTouched({});
            setFieldErrors({});
        } catch (err) {
            console.error(err);
            toast.error('Failed to submit review. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const wordCount = countWords(form.message);
    const wordLimitReached = wordCount >= MAX_MSG_WORDS;

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
                <div className={productId ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            Your Name *
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Enter your name"
                                value={form.customer_name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                onBlur={() => handleBlur('customer_name')}
                                style={touched.customer_name && fieldErrors.customer_name ? { borderColor: '#ef4444' } : {}}
                            />
                            {form.customer_name.length > 0 && (
                                <span
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium"
                                    style={{ color: form.customer_name.length > MAX_NAME_CHARS ? '#ef4444' : 'var(--text-muted)' }}
                                >
                                    {form.customer_name.length}/{MAX_NAME_CHARS}
                                </span>
                            )}
                        </div>
                        <FieldError message={touched.customer_name ? fieldErrors.customer_name : ''} />
                    </div>
                    {!productId && (
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
                    )}
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
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                            Message *
                        </label>
                        <span
                            className="text-[10px] font-medium"
                            style={{ color: wordLimitReached ? '#ef4444' : 'var(--text-muted)' }}
                        >
                            {wordCount}/{MAX_MSG_WORDS} words
                        </span>
                    </div>
                    <textarea
                        className="input-field resize-none"
                        rows={3}
                        placeholder="Tell us about your experience..."
                        value={form.message}
                        onChange={(e) => handleMessageChange(e.target.value)}
                        onBlur={() => handleBlur('message')}
                        style={touched.message && fieldErrors.message ? { borderColor: '#ef4444' } : {}}
                    />
                    <FieldError message={touched.message ? fieldErrors.message : ''} />
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
                                            borderRadius: '7px',
                                            border: '1.5px solid var(--border)',
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        style={{
                                            position: 'absolute', top: -6, right: -6,
                                            width: 20, height: 20,
                                            borderRadius: '7px',
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
                                    borderRadius: '7px',
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
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-[7px] animate-spin" />
                    ) : (
                        <><FiSend /> Submit Review</>
                    )}
                </button>
            </form>
        </motion.div>
    );
};

export default ReviewForm;