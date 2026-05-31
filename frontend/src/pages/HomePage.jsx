import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiPhone, FiStar, FiChevronLeft, FiChevronRight, FiClock, FiAward, FiShield, FiPhoneCall, FiImage } from 'react-icons/fi';
import { getProducts } from '../api/products';
import { getCategories } from '../api/categories';
import { getReviews } from '../api/reviews';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';
import ProductModal from '../components/ProductModal';
import ReviewForm from '../components/ReviewForm';
import ContactForm from '../components/ContactForm';

const BACKEND = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : 'http://localhost:5000';

// ─── ReviewCard: single review with image display logic ──────────────────────
const ReviewCard = ({ review }) => {
    // 1. Safe parse of stored images (JSON string of base64 data: URLs)
    const userImages = (() => {
        try {
            if (!review.images) return [];
            if (Array.isArray(review.images)) return review.images.filter(Boolean);
            if (review.images === 'NULL' || review.images === '[]') return [];
            const parsed = JSON.parse(review.images);
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch { return []; }
    })();

    // 2. Build the final display list:
    //    → user images if any
    //    → else product image if linked
    //    → else empty (we'll show a placeholder box)
    const displayImages = (() => {
        if (userImages.length > 0) return userImages; // base64 data URLs
        const prodImg = review.product_image;
        if (prodImg) {
            // absolute URLs are used as-is; relative paths get the backend prefix
            const src = prodImg.startsWith('http')
                ? prodImg
                : `${BACKEND}/${prodImg.replace(/^\//, '')}`;
            return [src];
        }
        return [];
    })();

    // 3. Slider state
    const [imgIdx, setImgIdx] = useState(0);

    const prev = (e) => {
        e.stopPropagation();
        setImgIdx((i) => (i - 1 + displayImages.length) % displayImages.length);
    };
    const next = (e) => {
        e.stopPropagation();
        setImgIdx((i) => (i + 1) % displayImages.length);
    };

    if (!review) return null;

    return (
        <div className="card p-5 flex flex-col h-full" style={{ border: '1px solid var(--border)', borderRadius: '1rem' }}>
            {/* Image area */}
            {displayImages.length > 0 ? (
                <div className="review-img-slider mb-4">
                    {/* Show current image */}
                    <img
                        src={displayImages[imgIdx]}
                        alt={`Review photo ${imgIdx + 1}`}
                        className="review-img-slide"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />

                    {/* Arrow navigation — only when multiple images */}
                    {displayImages.length > 1 && (
                        <>
                            <button className="review-img-arrow review-img-prev" onClick={prev} aria-label="Previous image">
                                <FiChevronLeft size={14} />
                            </button>
                            <button className="review-img-arrow review-img-next" onClick={next} aria-label="Next image">
                                <FiChevronRight size={14} />
                            </button>

                            {/* Dot indicators */}
                            <div className="review-img-dots">
                                {displayImages.map((_, i) => (
                                    <button
                                        key={i}
                                        className={`review-img-dot${i === imgIdx ? ' active' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
                                        aria-label={`Go to image ${i + 1}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            ) : (
                /* No images at all — show a neutral placeholder */
                <div className="mb-4 flex items-center justify-center rounded-xl" style={{ height: 100, background: 'var(--primary-glow)', borderRadius: 12 }}>
                    <FiImage size={32} style={{ color: 'var(--primary)', opacity: 0.5 }} />
                </div>
            )}

            {/* Review content */}
            <div className="flex flex-col gap-2 flex-1">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>
                        {review.customer_name || 'Anonymous'}
                    </h3>
                    <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                            <FiStar key={i} size={14} fill={i < (review.rating || 0) ? "currentColor" : "none"} />
                        ))}
                    </div>
                </div>

                {(review.product_name || review.product_id?.name) && (
                    <p className="text-xs font-medium px-2 py-1 rounded w-fit" style={{ color: 'var(--primary)', background: 'var(--primary-glow)' }}>
                        {review.product_name || review.product_id?.name}
                    </p>
                )}

                <p className="text-sm italic mt-1" style={{ color: 'var(--text-muted)' }}>"{review.message || ''}"</p>
            </div>
        </div>
    );
};

const HomePage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState({ avgRating: 0, total: 0, breakdown: [] });
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [activeIdx, setActiveIdx] = useState(0);
    const [direction, setDirection] = useState(0);

    useEffect(() => {
        const load = async () => {
            try {
                const prodRes = await getProducts({ hot_selling: true, show_on_menu: true });
                setProducts(prodRes?.data?.data?.slice(0, 4) || []);
            } catch (err) { console.error("Products failed to load:", err); }

            try {
                const catRes = await getCategories();
                setCategories(catRes?.data?.data || []);
            } catch (err) { console.error("Categories failed to load:", err); }

            try {
                const revRes = await getReviews({ status: 'approved' });
                setReviews(revRes?.data?.data || []);   // ALL approved reviews, no slice
                setReviewStats({
                    avgRating: revRes?.data?.avgRating || 0,
                    total: revRes?.data?.total || 0,
                    breakdown: revRes?.data?.breakdown || [],
                });
            } catch (err) { console.error("Reviews failed to load:", err); }

            setLoading(false);
        };
        load();
    }, []);

    const handleNewReview = (newReview) => {
        // New reviews are 'pending' and won't appear until approved by admin.
        // No optimistic update needed — just silently return if data is missing.
        if (!newReview || !newReview.rating) return;
        setReviews((prev) => [newReview, ...prev]);
        setReviewStats((prev) => {
            const total = Number(prev.total) || 0;
            const avg = Number(prev.avgRating) || 0;
            const newTotal = total + 1;
            const newAvg = ((avg * total) + Number(newReview.rating)) / newTotal;
            return { ...prev, total: newTotal, avgRating: newAvg.toFixed(1) };
        });
    };

    return (
        <div>
            {/* ===== HERO SECTION ===== */}
            <section className="relative flex items-center justify-center overflow-hidden py-6 md:py-12">
                <div className="absolute inset-0 pattern-bg" />
                <div className="absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(239,68,68,0.08) 0%, transparent 60%)' }} />

                <div className="relative max-w-5xl mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
                        style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--primary)', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                        <FiClock className="animate-pulse" /> Order at least 3 hours in advance
                    </motion.div>

                    <motion.h1
                        className="section-title mb-6"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        style={{ fontSize: 'clamp(1.6rem, 5vw, 4.5rem)', lineHeight: 1.15 }}
                    >
                        WHERE{' '}
                        <span style={{ color: 'var(--primary)', fontStyle: 'italic', fontWeight: '900' }}>FRESHNESS</span>
                        {' '}MEETS{' '}
                        <span className="gradient-text">FREEZING</span>
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mb-8 max-w-2xl mx-auto"
                    >
                        <p className="font-accent italic text-xl md:text-2xl mb-3" style={{ color: 'var(--text-muted)' }}>
                            Taste the mystery, Savor the excellence.
                        </p>
                        <p className="text-sm md:text-base" style={{ color: 'var(--text-muted)' }}>
                            Every dish is masterfully prepared with fresh ingredients and secret spices.
                            Any issues placing orders? Call us at{' '}
                            <span className="font-semibold" style={{ color: 'var(--primary)' }}>
                                +92 303 2683689
                            </span>
                        </p>
                    </motion.div>

                    <motion.div
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <Link to="/menu" className="btn-primary text-base px-8 py-3.5 flex items-center gap-2">
                            Explore Menu <FiArrowRight />
                        </Link>
                        <a
                            href="https://wa.me/923032683689"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-outline text-base px-8 py-3.5 flex items-center gap-2"
                        >
                            <FiPhone /> Order on WhatsApp
                        </a>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="inline-flex items-center gap-3 mt-10 px-6 py-3 rounded-2xl"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
                    >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--primary)' }}><FiPhoneCall size={15} /></div>
                        <div className="text-left">
                            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Call Delivery</div>
                            <div className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>+92 303 2683689</div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ===== ABOUT SECTION ===== */}
            <section className="py-6 md:py-10 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="section-title mb-4">About Mune's Kitchen</h2>
                        <p className="section-subtitle max-w-2xl mx-auto">
                            Where tradition meets modern freezing technology
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: <FiClock size={36} className="mx-auto" style={{ color: 'var(--primary)' }} />, title: 'Fast Service', desc: 'We ensure quick preparation and prompt delivery so your food reaches you hot, fresh, and right on time without unnecessary delays.' },
                            { icon: <FiAward size={36} className="mx-auto" style={{ color: 'var(--primary)' }} />, title: 'Secret Spices', desc: 'Our recipes are crafted with a proprietary blend of spices passed down through generations. Taste something truly unique.' },
                            { icon: <FiShield size={36} className="mx-auto" style={{ color: 'var(--primary)' }} />, title: 'Advanced Freezing & Preservation', desc: 'Our meals are carefully prepared and preserved using advanced freezing techniques that lock in freshness, nutrients, and original taste for long-term storage without compromising quality.' },
                        ].map((item, i) => (
                            <motion.div
                                key={item.title}
                                className="card p-6 text-center"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                whileHover={{ y: -8 }}
                            >
                                <div className="mb-4">{item.icon}</div>
                                <h3 className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--text-main)' }}>
                                    {item.title}
                                </h3>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CATEGORIES SECTION ===== */}
            <section className="py-6 md:py-10 px-4" style={{ background: 'rgba(239,68,68,0.02)' }}>
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="section-title mb-2">Explore Categories</h2>
                        <p className="section-subtitle">Pick your favorite</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 sm:gap-6">
                        {categories.map((cat, i) => (
                            <motion.div
                                key={cat.id || i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                            >
                                <Link
                                    to={`/menu?category=${cat.id}`}
                                    className="flex flex-col items-center text-center p-5 rounded-2xl transition-all block"
                                    style={{
                                        background: 'var(--bg-card)',
                                        border: '1.5px solid var(--border)',
                                        color: 'var(--text-main)',
                                        boxShadow: 'var(--shadow)',
                                        textDecoration: 'none'
                                    }}
                                >
                                    <div className="font-semibold text-sm">{cat.name}</div>
                                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                        {cat.products?.length || 0} items
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TOP PRODUCTS ===== */}
            <section className="py-6 md:py-10 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="section-title mb-3">Top Products</h2>
                        <p className="section-subtitle">Our best-selling frozen favorites</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {loading
                            ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
                            : products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onViewDetails={setSelectedProduct}
                                />
                            ))}
                    </div>
                    <div className="text-center mt-10">
                        <Link to="/menu" className="btn-outline flex items-center justify-center gap-2 max-w-xs mx-auto">
                            View Full Menu <FiArrowRight />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ===== TESTIMONIALS ===== */}
            <section className="py-6 md:py-10 px-4" style={{ background: 'rgba(239,68,68,0.02)' }}>
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="section-title mb-3">CUSTOMERS FEEDBACK</h2>
                        <p className="section-subtitle">Real feedback from people who ordered from Mune's Kitchen</p>
                    </div>

                    {/* Rating summary + breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        <div className="card p-6 flex flex-col items-center justify-center text-center">
                            <div className="font-display text-6xl font-bold gradient-text mb-2">
                                {Number(reviewStats.avgRating).toFixed(1)}
                            </div>
                            <div className="flex gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <FiStar key={s} size={20}
                                        fill={s <= Math.round(reviewStats.avgRating) ? '#f59e0b' : 'none'}
                                        stroke={s <= Math.round(reviewStats.avgRating) ? '#f59e0b' : 'var(--text-muted)'}
                                    />
                                ))}
                            </div>
                            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                Based on {reviewStats.total} reviews
                            </div>
                        </div>

                        <div className="card p-6 flex flex-col gap-2">
                            {reviewStats.breakdown.map(({ star, count }) => (
                                <div key={star} className="flex items-center gap-3">
                                    <span className="text-sm w-12 flex items-center justify-end gap-1 text-right" style={{ color: 'var(--text-muted)' }}>
                                        {star} <FiStar size={11} fill="#f59e0b" stroke="#f59e0b" style={{ transform: 'translateY(-1px)' }} />
                                    </span>
                                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: reviewStats.total > 0 ? `${(count / reviewStats.total) * 100}%` : '0%',
                                                background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                                            }}
                                        />
                                    </div>
                                    <span className="text-sm w-6" style={{ color: 'var(--text-muted)' }}>{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ===== REVIEWS: grid (≤3) or carousel (>3) ===== */}
                    <div className="mb-8">
                        {reviews.length === 0 ? (
                            <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                                No reviews yet. Be the first to share your experience!
                            </p>
                        ) : reviews.length <= 3 ? (
                            <div className={`grid gap-6 ${reviews.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                                reviews.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' :
                                    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                                }`}>
                                {reviews.map((review, i) => (
                                    <ReviewCard key={review.id || i} review={review} isStatic={true} />
                                ))}
                            </div>
                        ) : (
                            <div className="reviews-swiper-wrapper">
                                <div className="relative overflow-hidden w-full">
                                    <AnimatePresence initial={false} custom={direction} mode="wait">
                                        <motion.div
                                            key={activeIdx}
                                            custom={direction}
                                            variants={{
                                                enter: (dir) => ({
                                                    x: dir > 0 ? '100%' : '-100%',
                                                    opacity: 0
                                                }),
                                                center: {
                                                    x: 0,
                                                    opacity: 1
                                                },
                                                exit: (dir) => ({
                                                    x: dir < 0 ? '100%' : '-100%',
                                                    opacity: 0
                                                })
                                            }}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            transition={{
                                                x: { type: "spring", stiffness: 300, damping: 30 },
                                                opacity: { duration: 0.2 }
                                            }}
                                            drag="x"
                                            dragConstraints={{ left: 0, right: 0 }}
                                            dragElastic={0.6}
                                            onDragEnd={(event, info) => {
                                                const swipeThreshold = 50;
                                                if (info.offset.x < -swipeThreshold) {
                                                    setDirection(1);
                                                    setActiveIdx((prev) => (prev + 1) % reviews.length);
                                                } else if (info.offset.x > swipeThreshold) {
                                                    setDirection(-1);
                                                    setActiveIdx((prev) => (prev - 1 + reviews.length) % reviews.length);
                                                }
                                            }}
                                            className="w-full cursor-grab active:cursor-grabbing"
                                        >
                                            <ReviewCard review={reviews[activeIdx]} />
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Custom navigation arrows */}
                                <button
                                    className="reviews-prev swiper-nav-btn"
                                    onClick={() => {
                                        setDirection(-1);
                                        setActiveIdx((prev) => (prev - 1 + reviews.length) % reviews.length);
                                    }}
                                    aria-label="Previous reviews"
                                >
                                    <FiChevronLeft size={20} />
                                </button>
                                <button
                                    className="reviews-next swiper-nav-btn"
                                    onClick={() => {
                                        setDirection(1);
                                        setActiveIdx((prev) => (prev + 1) % reviews.length);
                                    }}
                                    aria-label="Next reviews"
                                >
                                    <FiChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>

                    <ReviewForm onSuccess={handleNewReview} />
                </div>
            </section>

            {/* ===== CONTACT SECTION ===== */}
            <section className="py-6 md:py-10 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="section-title mb-3">Get in Touch</h2>
                        <p className="section-subtitle">We'd love to hear from you</p>
                    </div>
                    <ContactForm />
                </div>
            </section>

            {selectedProduct && (
                <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
            )}
        </div>
    );
};

export default HomePage;