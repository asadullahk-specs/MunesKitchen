import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiPhone, FiStar, FiChevronLeft, FiChevronRight, FiClock, FiAward, FiShield, FiPhoneCall, FiImage, FiGift } from 'react-icons/fi';
import { getProducts } from '../api/products';
import { getCategories } from '../api/categories';
import { getReviews } from '../api/reviews';
import { getOffers } from '../api/offers';
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
    const [allMenuProducts, setAllMenuProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [offers, setOffers] = useState([]);
    const [reviewStats, setReviewStats] = useState({ avgRating: 0, total: 0, breakdown: [] });
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [activeIdx, setActiveIdx] = useState(0);
    const [direction, setDirection] = useState(0);
    
    // Category Carousel States (Mobile Only)
    const [activeCatIdx, setActiveCatIdx] = useState(0);
    const [catDirection, setCatDirection] = useState(0);

    // Offers Carousel States
    const [activeOfferIdx, setActiveOfferIdx] = useState(0);
    const [offerDirection, setOfferDirection] = useState(0);

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
                const allMenuRes = await getProducts({ show_on_menu: true });
                setAllMenuProducts(allMenuRes?.data?.data || []);
            } catch (err) { console.error("All menu products failed to load:", err); }

            try {
                const revRes = await getReviews({ status: 'approved' });
                setReviews(revRes?.data?.data || []);   // ALL approved reviews, no slice
                setReviewStats({
                    avgRating: revRes?.data?.avgRating || 0,
                    total: revRes?.data?.total || 0,
                    breakdown: revRes?.data?.breakdown || [],
                });
            } catch (err) { console.error("Reviews failed to load:", err); }

            try {
                const offerRes = await getOffers({ active: 'true' });
                setOffers(offerRes?.data?.data || []);
            } catch (err) { console.error("Offers failed to load:", err); }

            setLoading(false);
        };
        load();
    }, []);

    const handleNewReview = (newReview) => {
        // New reviews are pending by default and must NOT appear publicly immediately after submission.
        // They will only be visible once approved by an admin.
    };

    const validCategories = categories.filter(cat =>
        // Use .id (virtual set by toJSON) — NOT ._id which is deleted by the transform
        allMenuProducts.some(p => {
            const pCatId = p.category_id?.id || p.category?.id;
            const catId = cat.id || cat._id;
            return String(pCatId) === String(catId);
        })
    );
    const activeCat = validCategories[activeCatIdx];
    const activeCatProduct = activeCat
        ? allMenuProducts.find(p => {
            const pCatId = p.category_id?.id || p.category?.id;
            return String(pCatId) === String(activeCat.id || activeCat._id);
        })
        : null;

    return (
        <div>
            {/* ===== HERO SECTION ===== */}
            <section className="relative overflow-hidden" style={{ minHeight: '88vh', display: 'flex', alignItems: 'center' }}>
                {/* Background layers */}
                <div className="absolute inset-0 pattern-bg" style={{ opacity: 0.4 }} />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 60%, var(--primary-glow) 0%, transparent 55%)' }} />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(153,0,0,0.06) 0%, transparent 50%)' }} />

                <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                        {/* ── LEFT: Text Content ── */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7 }}
                            className="flex flex-col gap-6 order-2 lg:order-1"
                        >
                            {/* Availability badge */}
                            <div className="flex">
                                <span
                                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest"
                                    style={{ background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid rgba(153, 0, 0, 0.2)' }}
                                >
                                    <FiClock size={12} className="animate-pulse" /> Order at least 3 hours in advance
                                </span>
                            </div>

                            {/* Headline */}
                            <div>
                                <h1
                                    className="font-display font-extrabold leading-tight"
                                    style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', color: 'var(--text-main)', lineHeight: 1.15 }}
                                >
                                    Where{' '}
                                    <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>Freshness</span>
                                    <br />Meets{' '}
                                    <span style={{
                                        background: 'linear-gradient(135deg, #990000, #cc3300)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}>
                                        Freezing
                                    </span>
                                </h1>
                                <p
                                    className="mt-3 text-base md:text-lg font-medium italic"
                                    style={{ color: 'var(--text-muted)', fontFamily: 'Georgia, serif' }}
                                >
                                    Taste the mystery, Savor the excellence.
                                </p>
                            </div>

                            {/* Description */}
                            <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--text-muted)', maxWidth: 480 }}>
                                Every dish is masterfully prepared with fresh ingredients and secret spices.
                                Any issues placing orders? Call us at{' '}
                                <span className="font-semibold" style={{ color: 'var(--primary)' }}>+92 303 2683689</span>
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-wrap gap-3">
                                <Link to="/menu" className="btn-primary text-sm px-7 py-3 flex items-center gap-2">
                                    Explore Menu <FiArrowRight size={16} />
                                </Link>
                                <a
                                    href="https://wa.me/923032683689"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-outline text-sm px-7 py-3 flex items-center gap-2"
                                >
                                    <FiPhone size={15} /> Order on WhatsApp
                                </a>
                            </div>

                            {/* Call pill */}
                            <div
                                className="inline-flex items-center gap-3 self-start px-5 py-3 rounded-2xl"
                                style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    boxShadow: 'var(--shadow)',
                                }}
                            >
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}
                                >
                                    <FiPhoneCall size={16} />
                                </div>
                                <div className="text-left">
                                    <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Call for Delivery</div>
                                    <div className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>+92 303 2683689</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* ── RIGHT: Food Image Collage ── */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7, delay: 0.15 }}
                            className="relative order-1 lg:order-2"
                        >
                            {/* Glow blob behind images */}
                            <div
                                className="absolute inset-0 rounded-3xl"
                                style={{
                                    background: 'radial-gradient(circle at 50% 50%, rgba(153,0,0,0.12) 0%, transparent 70%)',
                                    filter: 'blur(24px)',
                                    transform: 'scale(1.1)',
                                }}
                            />

                            {products.length >= 4 ? (
                                /* 2×2 Collage when we have 4 products */
                                <div
                                    className="relative grid grid-cols-2 gap-3 p-2"
                                    style={{ aspectRatio: '1 / 1', maxWidth: 480, margin: '0 auto' }}
                                >
                                    {products.slice(0, 4).map((p, idx) => {
                                        const src = p.image
                                            ? p.image.startsWith('http')
                                                ? p.image
                                                : `${BACKEND}/${p.image.replace(/^\//, '')}`
                                            : null;

                                        const radii = [
                                            '24px 8px 24px 8px',
                                            '8px 24px 8px 24px',
                                            '8px 24px 8px 24px',
                                            '24px 8px 24px 8px',
                                        ];

                                        return (
                                            <div
                                                key={p.id || idx}
                                                className="relative overflow-hidden"
                                                style={{
                                                    borderRadius: radii[idx],
                                                    aspectRatio: '1 / 1',
                                                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                                    border: '2px solid var(--border)',
                                                    background: 'var(--bg-card)',
                                                }}
                                            >
                                                {src ? (
                                                    <img
                                                        src={src}
                                                        alt={p.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease' }}
                                                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
                                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-full h-full flex items-center justify-center"
                                                        style={{ background: 'var(--primary-glow)' }}
                                                    >
                                                        <FiImage size={32} style={{ color: 'var(--primary)', opacity: 0.4 }} />
                                                    </div>
                                                )}
                                                {/* Product name label */}
                                                <div
                                                    className="absolute bottom-0 left-0 right-0 px-3 py-2"
                                                    style={{
                                                        background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
                                                    }}
                                                >
                                                    <p className="text-white text-xs font-semibold truncate" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                                                        {p.name}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Central brand badge */}
                                    <div
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full flex items-center justify-center"
                                        style={{
                                            background: 'linear-gradient(135deg, #990000, #7a0000)',
                                            boxShadow: '0 4px 20px rgba(153,0,0,0.5), 0 0 0 4px var(--bg-card)',
                                        }}
                                    >
                                        <span className="text-white text-xs font-bold text-center leading-tight px-1">MK</span>
                                    </div>
                                </div>
                            ) : products.length > 0 ? (
                                /* Single featured image fallback */
                                <div
                                    className="relative overflow-hidden"
                                    style={{
                                        borderRadius: '32px 12px 32px 12px',
                                        aspectRatio: '4 / 3',
                                        maxWidth: 480,
                                        margin: '0 auto',
                                        boxShadow: '0 16px 60px rgba(0,0,0,0.15)',
                                        border: '2px solid var(--border)',
                                        background: 'var(--bg-card)',
                                    }}
                                >
                                    {(() => {
                                        const p = products[0];
                                        const src = p?.image
                                            ? p.image.startsWith('http') ? p.image : `${BACKEND}/${p.image.replace(/^\//, '')}`
                                            : null;
                                        return src ? (
                                            <img src={src} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--primary-glow)' }}>
                                                <FiImage size={48} style={{ color: 'var(--primary)', opacity: 0.3 }} />
                                            </div>
                                        );
                                    })()}
                                </div>
                            ) : (
                                /* Loading skeleton */
                                <div
                                    className="skeleton"
                                    style={{
                                        aspectRatio: '1 / 1',
                                        maxWidth: 480,
                                        margin: '0 auto',
                                        borderRadius: 24,
                                    }}
                                />
                            )}
                        </motion.div>
                    </div>
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
            <section className="py-6 md:py-10 px-4" style={{ background: 'var(--bg-deep)' }}>
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="section-title mb-2">Explore Categories</h2>
                        <p className="section-subtitle">Pick your favorite</p>
                    </div>

                    {/* Desktop/Tablet View */}
                    <div className="hidden sm:grid grid-cols-3 gap-4 sm:gap-6">
                        {categories.map((cat, i) => (
                            <motion.div
                                key={cat.id || i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                whileHover={{ y: -6 }}
                            >
                                <Link
                                    to={`/menu?category=${cat.id}`}
                                    className="flex flex-col items-center justify-center text-center p-6 h-28 rounded-2xl transition-all block"
                                    style={{
                                        background: 'var(--bg-card)',
                                        border: '1.5px solid var(--border)',
                                        color: 'var(--text-main)',
                                        boxShadow: 'var(--shadow)',
                                        textDecoration: 'none'
                                    }}
                                >
                                    <div className="font-bold text-base">{cat.name}</div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {/* ── Mobile Only Carousel ── */}
                    <div className="block sm:hidden">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="w-8 h-8 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderWidth: 3, borderStyle: 'solid', borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading categories...</p>
                            </div>
                        ) : validCategories.length > 0 && activeCatProduct ? (
                            <div style={{ position: 'relative' }}>
                                {/* Counter pill */}
                                <div className="flex justify-center mb-4">
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid rgba(153, 0, 0, 0.18)' }}>
                                        {activeCatIdx + 1} / {validCategories.length}
                                    </span>
                                </div>

                                {/* Slide area */}
                                <div className="relative overflow-hidden w-full" style={{ paddingBottom: 8 }}>
                                    <AnimatePresence initial={false} custom={catDirection} mode="wait">
                                        <motion.div
                                            key={activeCatIdx}
                                            custom={catDirection}
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
                                                    setCatDirection(1);
                                                    setActiveCatIdx((prev) => (prev + 1) % validCategories.length);
                                                } else if (info.offset.x > swipeThreshold) {
                                                    setCatDirection(-1);
                                                    setActiveCatIdx((prev) => (prev - 1 + validCategories.length) % validCategories.length);
                                                }
                                            }}
                                            className="w-full cursor-grab active:cursor-grabbing flex flex-col items-center px-2"
                                        >
                                            {/* Category name */}
                                            <div className="flex items-center gap-2 mb-4">
                                                <h3 className="font-display font-bold text-xl" style={{ color: 'var(--primary)' }}>
                                                    {activeCat?.name}
                                                </h3>
                                            </div>
                                            <div className="w-full" style={{ maxWidth: 360 }}>
                                                <ProductCard product={activeCatProduct} onViewDetails={setSelectedProduct} />
                                            </div>
                                            <Link
                                                to={`/menu?category=${activeCat?.id || activeCat?._id}`}
                                                className="btn-primary w-full text-center py-3 mt-4 flex items-center justify-center gap-2"
                                                style={{ textDecoration: 'none', maxWidth: 360 }}
                                            >
                                                Explore All {activeCat?.name} <FiArrowRight size={14} />
                                            </Link>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Dot indicators */}
                                <div className="flex justify-center gap-2 mt-5">
                                    {validCategories.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setCatDirection(i > activeCatIdx ? 1 : -1); setActiveCatIdx(i); }}
                                            aria-label={`Go to category ${i + 1}`}
                                            style={{
                                                width: i === activeCatIdx ? 22 : 8,
                                                height: 8,
                                                borderRadius: 4,
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: 0,
                                                transition: 'all 0.3s ease',
                                                background: i === activeCatIdx ? 'var(--primary)' : 'var(--border)',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                    No categories available yet.
                                </p>
                                <Link to="/menu" className="btn-primary inline-flex items-center gap-2 mt-4 px-6 py-2.5" style={{ textDecoration: 'none' }}>
                                    Browse Menu <FiArrowRight size={14} />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ===== EXCLUSIVE OFFERS SECTION ===== */}
            {offers.length > 0 && (
                <section className="py-12 px-4" style={{ background: 'linear-gradient(180deg, rgba(239,68,68,0.01) 0%, rgba(239,68,68,0.05) 100%)' }}>
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-8">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--primary)', background: 'var(--primary-glow)' }}>
                                <FiGift size={13} /> Exclusive Deals
                            </span>
                            <h2 className="section-title mb-2">PROMO OFFERS & BANNERS</h2>
                            <p className="section-subtitle">Mouth-watering deals crafted just for you!</p>
                        </div>

                        <div className="relative overflow-hidden w-full min-h-[280px]" style={{ position: 'relative' }}>
                            <AnimatePresence initial={false} custom={offerDirection} mode="wait">
                                <motion.div
                                    key={activeOfferIdx}
                                    custom={offerDirection}
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
                                    className="w-full flex flex-col md:flex-row items-center gap-6 p-6 sm:p-8 rounded-2xl glass border border-[var(--border)] shadow-md"
                                    style={{ background: 'var(--bg-card)' }}
                                >
                                    {/* Offer Image */}
                                    <div className="w-full md:w-1/3 aspect-video md:aspect-square rounded-xl overflow-hidden bg-[var(--bg-deep)] border border-[var(--border)] flex items-center justify-center shrink-0">
                                        {offers[activeOfferIdx].image ? (
                                            <img
                                                src={offers[activeOfferIdx].image.startsWith('http') ? offers[activeOfferIdx].image : `${BACKEND}/${offers[activeOfferIdx].image.replace(/^\//, '')}`}
                                                alt={offers[activeOfferIdx].name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <FiGift size={48} style={{ color: 'var(--primary)', opacity: 0.4 }} />
                                        )}
                                    </div>

                                    {/* Offer Details */}
                                    <div className="flex-1 text-center md:text-left flex flex-col justify-between h-full py-2">
                                        <div>
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                                                <h3 className="font-display font-bold text-2xl" style={{ color: 'var(--text-main)' }}>
                                                    {offers[activeOfferIdx].name}
                                                </h3>
                                                {offers[activeOfferIdx].discount_percentage > 0 && (
                                                    <span className="badge-hot font-extrabold">
                                                        {offers[activeOfferIdx].discount_percentage}% OFF
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                                {offers[activeOfferIdx].description || 'No description available for this deal.'}
                                            </p>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                                            <div className="text-center sm:text-left">
                                                <span className="text-xs text-[var(--text-muted)] line-through block">
                                                    Rs. {offers[activeOfferIdx].original_price}
                                                </span>
                                                <span className="text-2xl font-black" style={{ color: 'var(--primary)' }}>
                                                    Rs. {offers[activeOfferIdx].discounted_price}
                                                </span>
                                            </div>

                                            <div className="flex gap-2">
                                                <Link to="/menu" className="btn-primary text-xs py-2 px-5">
                                                    Explore Menu
                                                </Link>
                                                <a
                                                    href={`https://wa.me/923032683689?text=Hi,%20I'd%20like%20to%20order%20the%20promo%20offer:%20${encodeURIComponent(offers[activeOfferIdx].name)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn-outline text-xs py-2 px-5 flex items-center gap-1.5"
                                                >
                                                    <FiPhone size={12} /> WhatsApp Order
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Left/Right Arrows */}
                            {offers.length > 1 && (
                                <>
                                    <button
                                        onClick={() => {
                                            setOfferDirection(-1);
                                            setActiveOfferIdx((prev) => (prev - 1 + offers.length) % offers.length);
                                        }}
                                        aria-label="Previous Offer"
                                        style={{
                                            position: 'absolute', top: '50%', left: -18,
                                            transform: 'translateY(-50%)',
                                            width: 36, height: 36, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                                            boxShadow: 'var(--shadow-md)', cursor: 'pointer',
                                            color: 'var(--text-main)', zIndex: 10,
                                        }}
                                        className="hover:scale-105 transition-transform animate-none"
                                    >
                                        <FiChevronLeft size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setOfferDirection(1);
                                            setActiveOfferIdx((prev) => (prev + 1) % offers.length);
                                        }}
                                        aria-label="Next Offer"
                                        style={{
                                            position: 'absolute', top: '50%', right: -18,
                                            transform: 'translateY(-50%)',
                                            width: 36, height: 36, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                                            boxShadow: 'var(--shadow-md)', cursor: 'pointer',
                                            color: 'var(--text-main)', zIndex: 10,
                                        }}
                                        className="hover:scale-105 transition-transform animate-none"
                                    >
                                        <FiChevronRight size={18} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Dot indicators */}
                        {offers.length > 1 && (
                            <div className="flex justify-center gap-2 mt-5">
                                {offers.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setOfferDirection(i > activeOfferIdx ? 1 : -1); setActiveOfferIdx(i); }}
                                        aria-label={`Go to offer ${i + 1}`}
                                        style={{
                                            width: i === activeOfferIdx ? 22 : 8,
                                            height: 8,
                                            borderRadius: 4,
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: 0,
                                            transition: 'all 0.3s ease',
                                            background: i === activeOfferIdx ? 'var(--primary)' : 'var(--border)',
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

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