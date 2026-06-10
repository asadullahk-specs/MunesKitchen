import { useState, useEffect, useRef } from 'react';
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
    const userImages = (() => {
        try {
            if (!review.images) return [];
            if (Array.isArray(review.images)) return review.images.filter(Boolean);
            if (review.images === 'NULL' || review.images === '[]') return [];
            const parsed = JSON.parse(review.images);
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch { return []; }
    })();

    const displayImages = (() => {
        if (userImages.length > 0) return userImages;
        const prodImg = review.product_image;
        if (prodImg) {
            const src = prodImg.startsWith('http')
                ? prodImg
                : `${BACKEND}/${prodImg.replace(/^\//, '')}`;
            return [src];
        }
        return [];
    })();

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
        <div
            className="flex flex-col h-full w-full overflow-hidden"
            style={{
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            }}
        >
            {/* Image area — fixed height so all cards are consistent */}
            {displayImages.length > 0 ? (
                <div className="relative overflow-hidden shrink-0" style={{ height: '160px', background: 'var(--primary-glow)' }}>
                    <img
                        src={displayImages[imgIdx]}
                        alt={`Review photo ${imgIdx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
                /* No images — fixed height placeholder */
                <div className="relative shrink-0 overflow-hidden flex items-center justify-center" style={{ height: '160px', background: 'var(--primary-glow)' }}>
                    <FiImage size={32} style={{ color: 'var(--primary)', opacity: 0.3 }} />
                </div>
            )}

            {/* Review content */}
            <div className="px-3.5 py-3 flex flex-col flex-1 justify-between gap-2">
                <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="font-bold text-sm text-[var(--text-main)] truncate" title={review.customer_name || 'Anonymous'}>
                            {review.customer_name || 'Anonymous'}
                        </h3>
                        <div className="flex text-amber-400 shrink-0">
                            {[...Array(5)].map((_, i) => (
                                <FiStar key={i} size={13} fill={i < (review.rating || 0) ? "currentColor" : "none"} stroke="currentColor" />
                            ))}
                        </div>
                    </div>

                    {(review.product_name || review.product_id?.name) && (
                        <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--primary-glow)] border border-[var(--border)] mb-2" style={{ color: 'var(--primary)', width: 'fit-content' }}>
                            {review.product_name || review.product_id?.name}
                        </span>
                    )}

                    <p className="text-xs italic leading-relaxed text-[var(--text-muted)] line-clamp-3">
                        "{review.message || ''}"
                    </p>
                </div>

                {/* Date footer */}
                <div className="text-[10px] text-right font-medium" style={{ color: 'var(--text-muted)', opacity: 0.8 }}>
                    {new Date(review.created_at || review.createdAt || Date.now()).toLocaleDateString('en-GB')}
                </div>
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

    // Scroll refs for mobile scrolling with arrows
    const catScrollRef = useRef(null);
    const offersScrollRef = useRef(null);
    const topProdsScrollRef = useRef(null);
    const reviewsScrollRef = useRef(null);

    const handleScrollRef = (ref, dir) => {
        if (ref.current) {
            const scrollAmount = dir === 'left' ? -296 : 296;
            ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

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
            <section
                className="relative overflow-hidden flex items-center justify-start"
                style={{
                    // backgroundImage: 'url(/hero-bg.jpg)',
                    backgroundImage: 'url(/hero1.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center bottom',
                    backgroundRepeat: 'no-repeat',
                    // Reduced height constraints to eliminate excess empty space
                    minHeight: 'clamp(400px, 70vh, 650px)',
                }}
            >
                {/* Left-heavy overlay for text legibility */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(110deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.32) 100%)' }} />
                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)' }} />

                {/* Content — Reduced padding top and bottom (py-12 md:py-20) */}
                <div className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-10 py-12 md:py-20">
                    <div className="max-w-2xl">
                        {/* Eyebrow label with gold accent line */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex items-center gap-3 mb-5"
                        >
                            <div className="h-0.5 w-10 rounded-full" style={{ background: '#BC9C22' }} />
                            <span
                                className="text-xs font-bold uppercase tracking-[0.28em]"
                                style={{ color: '#BC9C22' }}
                            >
                                <FiClock size={10} className="inline mr-1.5 animate-pulse" style={{ verticalAlign: 'middle' }} />
                                Order at least 3 hours in advance
                            </span>
                        </motion.div>

                        {/* Main H1 — Shortened size to contain it to 2 lines */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.12 }}
                            className="font-extrabold text-white mb-4"
                            style={{
                                fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
                                lineHeight: 1.15,
                                textShadow: '0 3px 24px rgba(0,0,0,0.5)',
                                letterSpacing: '-0.015em',
                            }}
                        >
                            Where{' '}
                            <span style={{ color: '#BC9C22', fontStyle: 'italic' }}>Freshness</span>
                            <br />
                            Meets Freezing
                        </motion.h1>

                        {/* Tagline */}
                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.22 }}
                            className="text-base sm:text-lg italic mb-3"
                            style={{ color: 'rgba(255,255,255,0.78)', fontFamily: 'Georgia, serif' }}
                        >
                            Taste the mystery, Savor the excellence.
                        </motion.p>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="text-sm sm:text-base mb-8 max-w-lg"
                            style={{ color: 'rgba(255,255,255,0.58)', lineHeight: 1.75 }}
                        >
                            Frozen treats, masterfully prepared with fresh ingredients and secret spices.
                            For orders, call{' '}
                            <span className="font-semibold" style={{ color: '#ff8c5a' }}>+92 303 2683689</span>
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="flex flex-wrap items-center gap-4 mb-8"
                        >
                            <Link
                                to="/menu"
                                className="btn-primary flex items-center gap-2"
                                style={{
                                    fontSize: '0.9rem',
                                    padding: '14px 30px',
                                    boxShadow: '0 8px 28px rgba(153,0,0,0.55)',
                                    letterSpacing: '0.03em',
                                }}
                            >
                                Explore Menu <FiArrowRight size={15} />
                            </Link>
                            <a
                                href="https://wa.me/923032683689"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 font-semibold transition-all"
                                style={{
                                    fontSize: '0.9rem',
                                    padding: '13px 28px',
                                    background: 'rgba(255,255,255,0.08)',
                                    color: 'white',
                                    border: '2px solid rgba(255,255,255,0.35)',
                                    backdropFilter: 'blur(10px)',
                                    textDecoration: 'none',
                                    letterSpacing: '0.02em',
                                    borderRadius: '10px',
                                    transition: 'all 0.25s ease',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.65)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; }}
                            >
                                <FiPhone size={14} /> Order on WhatsApp
                            </a>
                        </motion.div>

                        {/* Phone pill */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.54 }}
                            className="inline-flex items-center gap-3 px-5 py-3 rounded-xl"
                            style={{
                                background: 'rgba(255,255,255,0.07)',
                                backdropFilter: 'blur(14px)',
                                border: '1px solid rgba(255,255,255,0.16)',
                            }}
                        >
                            <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg, #990000, #7a0000)', color: 'white', boxShadow: '0 3px 10px rgba(153,0,0,0.4)' }}
                            >
                                <FiPhoneCall size={16} />
                            </div>
                            <div className="text-left">
                                <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Call for Delivery</div>
                                <div className="font-bold text-sm text-white">+92 303 2683689</div>
                            </div>
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
                            See how our chefs bring taste to your mouth
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

                    {/* Desktop/Tablet View — ProductCard per category */}
                    <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                        {validCategories.map((cat, i) => {
                            const catProduct = allMenuProducts.find(p => {
                                const pCatId = p.category_id?.id || p.category?.id;
                                return String(pCatId) === String(cat.id || cat._id);
                            });
                            if (!catProduct) return null;
                            return (
                                <motion.div
                                    key={cat.id || i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08 }}
                                    className="flex flex-col w-full"
                                >
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <h3 className="font-bold text-base" style={{ color: 'var(--text-main)' }}>{cat.name}</h3>
                                        <Link
                                            to={`/menu?category=${cat.id}`}
                                            className="text-xs font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity"
                                            style={{ color: 'var(--primary)', textDecoration: 'none' }}
                                        >
                                            See all <FiArrowRight size={12} />
                                        </Link>
                                    </div>
                                    <ProductCard product={catProduct} onViewDetails={setSelectedProduct} />
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* ── Mobile Only Horizontally Scrollable Row with Arrows ── */}
                    <div className="block sm:hidden">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="w-8 h-8 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderWidth: 3, borderStyle: 'solid', borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading categories...</p>
                            </div>
                        ) : validCategories.length > 0 ? (
                            <div className="relative w-full">
                                {/* Left Arrow */}
                                {validCategories.length > 1 && (
                                    <button
                                        onClick={() => handleScrollRef(catScrollRef, 'left')}
                                        style={{
                                            position: 'absolute',
                                            left: '-8px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            zIndex: 10,
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'var(--bg-card)',
                                            border: '1.5px solid var(--border)',
                                            boxShadow: 'var(--shadow-sm)',
                                            cursor: 'pointer',
                                            color: 'var(--text-main)'
                                        }}
                                        aria-label="Scroll Left"
                                    >
                                        <FiChevronLeft size={16} />
                                    </button>
                                )}

                                <div ref={catScrollRef} className="mobile-scroll-container px-4 -mx-4">
                                    {validCategories.map((cat, i) => {
                                        const catProduct = allMenuProducts.find(p => {
                                            const pCatId = p.category_id?.id || p.category?.id;
                                            return String(pCatId) === String(cat.id || cat._id);
                                        });
                                        if (!catProduct) return null;
                                        return (
                                            <div key={cat.id || i} className="mobile-scroll-item flex flex-col">
                                                <div className="flex items-center justify-between mb-3 px-1">
                                                    <h3 className="font-bold text-sm text-[var(--text-main)] truncate max-w-[150px]">{cat.name}</h3>
                                                    <Link
                                                        to={`/menu?category=${cat.id}`}
                                                        className="text-xs font-semibold flex items-center gap-0.5"
                                                        style={{ color: 'var(--primary)', textDecoration: 'none' }}
                                                    >
                                                        See all <FiArrowRight size={10} />
                                                    </Link>
                                                </div>
                                                <ProductCard product={catProduct} onViewDetails={setSelectedProduct} />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Right Arrow */}
                                {validCategories.length > 1 && (
                                    <button
                                        onClick={() => handleScrollRef(catScrollRef, 'right')}
                                        style={{
                                            position: 'absolute',
                                            right: '-8px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            zIndex: 10,
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'var(--bg-card)',
                                            border: '1.5px solid var(--border)',
                                            boxShadow: 'var(--shadow-sm)',
                                            cursor: 'pointer',
                                            color: 'var(--text-main)'
                                        }}
                                        aria-label="Scroll Right"
                                    >
                                        <FiChevronRight size={16} />
                                    </button>
                                )}
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
            {/* {offers.length > 0 && (
                <section 
                    className="relative py-12 px-4 overflow-hidden" 
                    style={{ 
                        backgroundImage: 'url(/hero-bg.jpg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                >
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-[1px]" />
                    
                    <div className="relative z-10 max-w-4xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="section-title mb-3" style={{ color: 'white' }}>PROMO OFFERS & BANNERS</h2>
                            <p className="section-subtitle" style={{ color: '#d1d5db' }}>Mouth-watering deals crafted just for you!</p>
                        </div>

                        
                        <div className="hidden md:block relative w-full">
                            <div className="overflow-hidden w-full min-h-[300px] pb-4">
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
                                        className="w-full flex flex-row items-center gap-6 p-6 sm:p-8 rounded-lg glass border border-[var(--border)] shadow-md animate-none"
                                        style={{ background: 'var(--bg-card)' }}
                                    >
                                        
                                        <div className="w-1/3 aspect-square rounded-xl overflow-hidden bg-[var(--bg-deep)] border border-[var(--border)] flex items-center justify-center shrink-0">
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

                                        
                                        <div className="flex-1 text-left flex flex-col justify-between h-full py-2">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2 mb-3">
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

                                            <div className="flex flex-col md:flex-col lg:flex-row items-start lg:items-center justify-between gap-4 w-full">
                                                <div>
                                                    <span className="text-xs text-[var(--text-muted)] line-through block">
                                                        Rs. {offers[activeOfferIdx].original_price}
                                                    </span>
                                                    <span className="text-2xl font-black" style={{ color: 'var(--primary)' }}>
                                                        Rs. {offers[activeOfferIdx].discounted_price}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col md:flex-col lg:flex-row gap-2 w-full lg:w-auto">
                                                    <Link to="/menu" className="btn-primary text-xs py-2.5 px-5 text-center justify-center w-full lg:w-auto">
                                                        Explore Menu
                                                    </Link>
                                                    <a
                                                        href={`https://wa.me/923032683689?text=Hi,%20I'd%20like%20to%20order%20the%20promo%20offer:%20${encodeURIComponent(offers[activeOfferIdx].name)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn-outline text-xs py-2.5 px-5 flex items-center justify-center gap-1.5 w-full lg:w-auto"
                                                    >
                                                        <FiPhone size={12} /> WhatsApp Order
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            
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
                                            display: 'flex', alignItems: 'center', justify: 'center',
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
                                            display: 'flex', alignItems: 'center', justify: 'center',
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

                        
                        <div className="block md:hidden relative w-full">
                            {offers.length > 1 && (
                                <button
                                    onClick={() => handleScrollRef(offersScrollRef, 'left')}
                                    style={{
                                        position: 'absolute',
                                        left: '-8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        zIndex: 10,
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'var(--bg-card)',
                                        border: '1.5px solid var(--border)',
                                        boxShadow: 'var(--shadow-sm)',
                                        cursor: 'pointer',
                                        color: 'var(--text-main)'
                                    }}
                                    aria-label="Scroll Left"
                                >
                                    <FiChevronLeft size={16} />
                                </button>
                            )}

                            <div ref={offersScrollRef} className="mobile-scroll-container px-4 -mx-4">
                                {offers.map((offer, idx) => {
                                    const imgUrl = offer.image 
                                        ? (offer.image.startsWith('http') ? offer.image : `${BACKEND}/${offer.image.replace(/^\//, '')}`)
                                        : null;
                                    return (
                                        <div 
                                            key={offer.id || idx} 
                                            className="mobile-scroll-item glass border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between"
                                            style={{ background: 'var(--bg-card)', width: '280px' }}
                                        >
                                            
                                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-[var(--bg-deep)] border border-[var(--border)] flex items-center justify-center shrink-0 mb-3">
                                                {imgUrl ? (
                                                    <img src={imgUrl} alt={offer.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <FiGift size={32} style={{ color: 'var(--primary)', opacity: 0.4 }} />
                                                )}
                                            </div>

                                            
                                            <div className="flex-grow flex flex-col justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <h3 className="font-bold text-sm text-[var(--text-main)] truncate max-w-[150px]" title={offer.name}>
                                                            {offer.name}
                                                        </h3>
                                                        {offer.discount_percentage > 0 && (
                                                            <span className="badge-hot font-extrabold text-[8px] px-1 py-0.5 shrink-0">
                                                                {offer.discount_percentage}% OFF
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs leading-relaxed text-[var(--text-muted)] line-clamp-2">
                                                        {offer.description || 'Special promo deal.'}
                                                    </p>
                                                </div>

                                                <div>
                                                    <div className="mb-3">
                                                        <span className="text-[10px] text-[var(--text-muted)] line-through block">
                                                            Rs. {offer.original_price}
                                                        </span>
                                                        <span className="text-base font-black" style={{ color: 'var(--primary)' }}>
                                                            Rs. {offer.discounted_price}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-col gap-1.5 w-full">
                                                        <Link to="/menu" className="btn-primary text-xs py-2 px-3 text-center justify-center w-full">
                                                            Explore Menu
                                                        </Link>
                                                        <a
                                                            href={`https://wa.me/923032683689?text=Hi,%20I'd%20like%20to%20order%20the%20promo%20offer:%20${encodeURIComponent(offer.name)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn-outline text-xs py-2 px-3 flex items-center justify-center gap-1.5 w-full"
                                                        >
                                                            <FiPhone size={12} /> WhatsApp Order
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                           
                            {offers.length > 1 && (
                                <button
                                    onClick={() => handleScrollRef(offersScrollRef, 'right')}
                                    style={{
                                        position: 'absolute',
                                        right: '-8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        zIndex: 10,
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'var(--bg-card)',
                                        border: '1.5px solid var(--border)',
                                        boxShadow: 'var(--shadow-sm)',
                                        cursor: 'pointer',
                                        color: 'var(--text-main)'
                                    }}
                                    aria-label="Scroll Right"
                                >
                                    <FiChevronRight size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </section>
            )} */}

            {/* ===== TOP PRODUCTS ===== */}
            <section className="py-6 md:py-10 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="section-title mb-3">Top Products</h2>
                        <p className="section-subtitle">Our top picks from customer feedbacks</p>
                    </div>
                    <div className="relative w-full">
                        {/* Left Arrow (Mobile only) */}
                        {products.length > 1 && (
                            <button
                                onClick={() => handleScrollRef(topProdsScrollRef, 'left')}
                                style={{
                                    position: 'absolute',
                                    left: '-8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 10,
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'var(--bg-card)',
                                    border: '1.5px solid var(--border)',
                                    boxShadow: 'var(--shadow-sm)',
                                    cursor: 'pointer',
                                    color: 'var(--text-main)'
                                }}
                                className="flex sm:hidden"
                                aria-label="Scroll Left"
                            >
                                <FiChevronLeft size={16} />
                            </button>
                        )}

                        <div ref={topProdsScrollRef} className="flex sm:grid overflow-x-auto sm:overflow-visible snap-x snap-mandatory flex-nowrap sm:flex-wrap sm:grid-cols-2 lg:grid-cols-4 gap-6 no-scrollbar pb-4 px-4 -mx-4 sm:px-0 sm:mx-0">
                            {loading
                                ? Array(4).fill(0).map((_, i) => (
                                    <div key={i} className="snap-center shrink-0 w-[280px] sm:w-auto">
                                        <SkeletonCard />
                                    </div>
                                ))
                                : products.map((product) => (
                                    <div key={product.id} className="snap-center shrink-0 w-[280px] sm:w-auto">
                                        <ProductCard
                                            product={product}
                                            onViewDetails={setSelectedProduct}
                                        />
                                    </div>
                                ))}
                        </div>

                        {/* Right Arrow (Mobile only) */}
                        {products.length > 1 && (
                            <button
                                onClick={() => handleScrollRef(topProdsScrollRef, 'right')}
                                style={{
                                    position: 'absolute',
                                    right: '-8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 10,
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'var(--bg-card)',
                                    border: '1.5px solid var(--border)',
                                    boxShadow: 'var(--shadow-sm)',
                                    cursor: 'pointer',
                                    color: 'var(--text-main)'
                                }}
                                className="flex sm:hidden"
                                aria-label="Scroll Right"
                            >
                                <FiChevronRight size={16} />
                            </button>
                        )}
                    </div>
                    <div className="text-center mt-10">
                        <Link to="/menu" className="btn-outline flex items-center justify-center gap-2 max-w-xs mx-auto">
                            View Full Menu <FiArrowRight />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ===== TESTIMONIALS ===== */}
            <section
                className="relative py-12 md:py-16 px-4 overflow-hidden"
                style={{
                    backgroundImage: 'url(/reviewsBg.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.78)' }} />
                <div className="relative z-10 max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="section-title mb-3" style={{ color: 'white' }}>CUSTOMERS FEEDBACK</h2>
                        <p className="section-subtitle" style={{ color: '#d1d5db' }}>See what people say about the products of Mune's Kitchen</p>
                    </div>

                    {/* Rating summary + breakdown on left, reviews on right */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 items-start">
                        {/* Left Column: Stats Cards (4.7 card + Stars breakdown card stacked vertically) */}
                        <div className="lg:col-span-1 flex flex-col gap-6">
                            {/* 4.7 card */}
                            <div className="card p-6 flex flex-col items-center justify-center text-center" style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)' }}>
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
                                <div className="text-sm font-semibold text-[var(--text-muted)]">
                                    Based on {reviewStats.total} reviews
                                </div>
                            </div>

                            {/* Stars breakdown card */}
                            <div className="card p-6 flex flex-col gap-2 justify-center" style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)' }}>
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
                                        <span className="text-sm w-6 font-semibold" style={{ color: 'var(--text-muted)' }}>{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Reviews Grid/Swiper */}
                        <div className="lg:col-span-2">
                            {reviews.length === 0 ? (
                                <p className="text-center py-8 text-gray-400">
                                    No reviews yet. Be the first to share your experience!
                                </p>
                            ) : (
                                <>
                                    {/* Mobile View — Horizontally Scrollable Row with Arrows */}
                                    <div className="block sm:hidden relative w-full">
                                        {reviews.length > 1 && (
                                            <button
                                                onClick={() => handleScrollRef(reviewsScrollRef, 'left')}
                                                style={{
                                                    position: 'absolute', left: '-8px', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                                                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center',
                                                    background: 'var(--bg-card)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)',
                                                    cursor: 'pointer', color: 'var(--text-main)'
                                                }}
                                                aria-label="Scroll Left"
                                            >
                                                <FiChevronLeft size={16} />
                                            </button>
                                        )}
                                        <div ref={reviewsScrollRef} className="mobile-scroll-container px-4 -mx-4">
                                            {reviews.map((review, i) => (
                                                <div key={review.id || i} className="mobile-scroll-item">
                                                    <ReviewCard review={review} />
                                                </div>
                                            ))}
                                        </div>
                                        {reviews.length > 1 && (
                                            <button
                                                onClick={() => handleScrollRef(reviewsScrollRef, 'right')}
                                                style={{
                                                    position: 'absolute', right: '-8px', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                                                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center',
                                                    background: 'var(--bg-card)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)',
                                                    cursor: 'pointer', color: 'var(--text-main)'
                                                }}
                                                aria-label="Scroll Right"
                                            >
                                                <FiChevronRight size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Desktop View — grid or swiper */}
                                    <div className="hidden sm:block">
                                        {reviews.length <= 2 ? (
                                            <div className={`grid gap-6 ${reviews.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 sm:grid-cols-2'}`}>
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
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== SUBMIT REVIEW FORM ===== */}
            <section className="py-12 px-4 bg-[var(--bg-deep)] border-t border-[var(--border)]">
                <div className="max-w-2xl mx-auto">
                    <ReviewForm onSuccess={handleNewReview} />
                </div>
            </section>

            {/* ===== CONTACT SECTION ===== */}
            <section className="py-6 md:py-10 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="section-title mb-3">Get in Touch</h2>
                        <p className="section-subtitle">Any question? Or want to join our team, we're just a click away</p>
                    </div>
                    <ContactForm />
                </div>
            </section>


            {selectedProduct && (
                <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
            )}
        </div >
    );
};

export default HomePage;