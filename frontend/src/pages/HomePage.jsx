import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, color } from 'framer-motion';
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
import ReviewCard from '../components/ReviewCard';
import { toast } from 'react-toastify';

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

    // Product Carousel States (Mobile Only)
    const [activeProdIdx, setActiveProdIdx] = useState(0);

    // Offers Carousel States
    const [activeOfferIdx, setActiveOfferIdx] = useState(0);
    const [offerDirection, setOfferDirection] = useState(0);

    // Scroll refs for mobile scrolling with arrows
    const catScrollRef = useRef(null);
    const offersScrollRef = useRef(null);
    const topProdsScrollRef = useRef(null);
    const reviewsScrollRef = useRef(null);
    const reviewTrackRef = useRef(null);
    const mobileReviewTrackRef = useRef(null);
    const [reviewStepPx, setReviewStepPx] = useState(350);
    const [mobileReviewStepPx, setMobileReviewStepPx] = useState(300);
    const [mobileCenterOffset, setMobileCenterOffset] = useState(30);
    const [reviewNoAnim, setReviewNoAnim] = useState(false);

    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const handleTouchStart = (e) => {
        touchStartX.current = e.targetTouches[0].clientX;
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (reviews.length <= 1) return;
        const diff = touchStartX.current - touchEndX.current;
        if (diff > 50) {
            setActiveIdx((prev) => prev + 1);
        } else if (diff < -50) {
            setActiveIdx((prev) => prev === 0 ? reviews.length - 1 : prev - 1);
        }
    };

    const handleScrollRef = (ref, dir) => {
        if (ref.current) {
            const scrollAmount = dir === 'left' ? -296 : 296;
            ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // Measure review track width after reviews load and on resize
    useEffect(() => {
        const updateStep = () => {
            if (reviewTrackRef.current) {
                const trackWidth = reviewTrackRef.current.clientWidth;
                const cardWidth = (trackWidth - 2 * 24) / 3;
                setReviewStepPx(cardWidth + 24);
            }
            if (mobileReviewTrackRef.current) {
                const trackWidth = mobileReviewTrackRef.current.clientWidth;
                const cardWidth = trackWidth * 0.8;
                setMobileReviewStepPx(cardWidth + 16);
                setMobileCenterOffset((trackWidth - cardWidth) / 2);
            }
        };
        // Delay so DOM has rendered the carousel after data loads
        const t = setTimeout(updateStep, 50);
        window.addEventListener('resize', updateStep);
        return () => { clearTimeout(t); window.removeEventListener('resize', updateStep); };
    }, [reviews.length]); // re-run whenever reviews load

    // Seamless loop: after slide to position reviews.length completes, silently jump to 0
    useEffect(() => {
        if (reviews.length > 0 && activeIdx >= reviews.length) {
            const t = setTimeout(() => {
                setReviewNoAnim(true);
                setActiveIdx(activeIdx - reviews.length);
            }, 720);
            return () => clearTimeout(t);
        }
    }, [activeIdx, reviews.length]);

    // Re-enable animation on next frame after silent jump
    useEffect(() => {
        if (reviewNoAnim) {
            const frame = requestAnimationFrame(() => setReviewNoAnim(false));
            return () => cancelAnimationFrame(frame);
        }
    }, [reviewNoAnim]);

    useEffect(() => {
        const load = async () => {
            const results = await Promise.allSettled([
                getProducts({ hot_selling: true, show_on_menu: true }),
                getCategories(),
                getProducts({ show_on_menu: true }),
                getReviews({ status: 'approved' }),
                getOffers({ active: 'true' })
            ]);

            if (results[0].status === 'fulfilled') {
                setProducts(results[0].value?.data?.data?.slice(0, 4) || []);
            } else {
                console.error("Products failed to load:", results[0].reason);
            }

            if (results[1].status === 'fulfilled') {
                setCategories(results[1].value?.data?.data || []);
            } else {
                console.error("Categories failed to load:", results[1].reason);
            }

            if (results[2].status === 'fulfilled') {
                setAllMenuProducts(results[2].value?.data?.data || []);
            } else {
                console.error("All menu products failed to load:", results[2].reason);
            }

            if (results[3].status === 'fulfilled') {
                const revRes = results[3].value;
                setReviews(revRes?.data?.data || []);
                setReviewStats({
                    avgRating: revRes?.data?.avgRating || 0,
                    total: revRes?.data?.total || 0,
                    breakdown: revRes?.data?.breakdown || [],
                });
            } else {
                console.error("Reviews failed to load:", results[3].reason);
            }

            if (results[4].status === 'fulfilled') {
                setOffers(results[4].value?.data?.data || []);
            } else {
                console.error("Offers failed to load:", results[4].reason);
            }

            setLoading(false);
        };
        load();
    }, []);

    // Auto-scroll reviews every 3 seconds; pause when user hovers
    const [reviewHovered, setReviewHovered] = useState(false);
    useEffect(() => {
        if (reviews.length <= 1) return;
        if (reviewHovered) return;
        const interval = setInterval(() => {
            setActiveIdx((prev) => prev + 1);
        }, 3000);
        return () => clearInterval(interval);
    }, [reviews.length, reviewHovered]);

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
                            {/* <div className="h-0.5 w-10 rounded-[7px]" style={{ background: '#BC9C22' }} /> */}
                            <span
                                className="text-xs font-bold uppercase tracking-[0.28em]"
                                style={{ color: '#BC9C22' }}
                            >
                                <FiClock size={10} className="inline mr-1.5 animate-pulse" style={{ verticalAlign: 'middle' }} />
                                Order at least 3 hours in advance for frozen treats
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
                            {/* For orders, call{' '}
                            <span className="font-semibold" style={{ color: '#ff8c5a' }}>+92 303 2683689</span> */}
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
                                    borderRadius: '7px',
                                    transition: 'all 0.25s ease',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.65)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; }}
                            >
                                <FiPhone size={14} /> Order on WhatsApp
                            </a>
                        </motion.div>

                        {/* Phone pill */}
                        {/* <motion.div
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.54 }}
                            className="inline-flex items-center gap-3 px-5 py-3 rounded-[7px]"
                            style={{
                                background: 'rgba(255,255,255,0.07)',
                                backdropFilter: 'blur(14px)',
                                border: '1px solid rgba(255,255,255,0.16)',
                            }}
                        >
                            <div
                                className="w-9 h-9 rounded-[7px] flex items-center justify-center flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg, #990000, #7a0000)', color: 'white', boxShadow: '0 3px 10px rgba(153,0,0,0.4)' }}
                            >
                                <FiPhoneCall size={16} />
                            </div>
                            <div className="text-left">
                                <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Call for Delivery</div>
                                <div className="font-bold text-sm text-white">+92 303 2683689</div>
                            </div>
                        </motion.div> */}
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
                    <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
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
                                    <ProductCard product={catProduct} onViewDetails={setSelectedProduct} className="flex-1" />
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* ── Mobile Only Horizontally Scrollable Row with Arrows ── */}
                    <div className="block sm:hidden">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="w-8 h-8 border-t-transparent rounded-[7px] animate-spin mx-auto mb-3" style={{ borderWidth: 3, borderStyle: 'solid', borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
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
                                            borderRadius: '7px',
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

                                <div ref={catScrollRef} className="mobile-scroll-container px-4 -mx-4" style={{
                                    justifyContent: validCategories.filter(cat => allMenuProducts.find(p => String(p.category_id?.id || p.category?.id) === String(cat.id || cat._id))).length <= 1 ? 'center' : undefined
                                }}>
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
                                                <ProductCard product={catProduct} onViewDetails={setSelectedProduct} className="flex-1" />
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
                                            borderRadius: '7px',
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
                                        className="w-full flex flex-row items-center gap-6 p-6 sm:p-8 rounded-[7px] glass border border-[var(--border)] shadow-md animate-none"
                                        style={{ background: 'var(--bg-card)' }}
                                    >
                                        
                                        <div className="w-1/3 aspect-square rounded-[7px] overflow-hidden bg-[var(--bg-deep)] border border-[var(--border)] flex items-center justify-center shrink-0">
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
                                            width: 36, height: 36, borderRadius: '7px',
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
                                            width: 36, height: 36, borderRadius: '7px',
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
                                                borderRadius: '7px',
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
                                        borderRadius: '7px',
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
                                            className="mobile-scroll-item glass border border-[var(--border)] rounded-[7px] p-4 flex flex-col justify-between"
                                            style={{ background: 'var(--bg-card)', width: '280px' }}
                                        >
                                            
                                            <div className="aspect-video w-full rounded-[7px] overflow-hidden bg-[var(--bg-deep)] border border-[var(--border)] flex items-center justify-center shrink-0 mb-3">
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
                                        borderRadius: '7px',
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
                        {/* Desktop & Tablet View */}
                        <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
                            {loading
                                ? Array(4).fill(0).map((_, i) => (
                                    <SkeletonCard key={i} />
                                ))
                                : products.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onViewDetails={setSelectedProduct}
                                    />
                                ))}
                        </div>

                        {/* Mobile Only Horizontally Scrollable Row with Arrows */}
                        <div className="block sm:hidden">
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="w-8 h-8 border-t-transparent rounded-[7px] animate-spin mx-auto mb-3" style={{ borderWidth: 3, borderStyle: 'solid', borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading products...</p>
                                </div>
                            ) : products.length > 0 ? (
                                <div className="relative w-full">
                                    {/* Left Arrow */}
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
                                                borderRadius: '7px',
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

                                    <div ref={topProdsScrollRef} className="mobile-scroll-container px-4 -mx-4" style={{
                                        justifyContent: products.length <= 1 ? 'center' : undefined
                                    }}>
                                        {products.map((product) => (
                                            <div key={product.id} className="mobile-scroll-item">
                                                <ProductCard
                                                    product={product}
                                                    onViewDetails={setSelectedProduct}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Right Arrow */}
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
                                                borderRadius: '7px',
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
                                <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No products available.</p>
                            )}
                        </div>
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
                className="relative py-12 md:py-20 px-4 overflow-hidden w-full"
                style={{
                    backgroundImage: 'url(/reviewsBg.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'bottom center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                {/* Dark background overlay */}
                <div className="absolute inset-0 bg-black/65" />

                <div className="relative z-10 max-w-6xl mx-auto px-0 sm:px-4 md:px-6">

                    {/* Heading Group matching Top Products Styles */}
                    <div className="text-center mb-10">
                        <h2 className="section-title mb-3 text-white uppercase" style={{ color: 'rgb(188, 156, 34)' }}>TESTIMONIALS</h2>
                        <p className="section-subtitle text-gray-300" style={{ color: 'rgba(255, 255, 255, 0.58)' }}>See what people say about the products of Mune's Kitchen</p>
                    </div>

                    {/* 1. Dynamic Carousel Slider Area */}
                    <div
                        className="relative mb-12 w-full"
                        onMouseEnter={() => setReviewHovered(true)}
                        onMouseLeave={() => setReviewHovered(false)}
                    >
                        {reviews.length === 0 ? (
                            <p className="text-center py-8 text-gray-400 bg-[var(--bg-card)] rounded-[7px] border border-[var(--border)] w-full text-sm px-4">
                                No reviews yet. Be the first to share your experience!
                            </p>
                        ) : (
                            <div className="relative w-full">
                                {/* Desktop & Tablet View — Sliding Carousel */}
                                <div className="hidden md:flex items-center w-full py-4 gap-3">
                                    {/* Left Arrow — outside overflow-hidden so it's never clipped */}
                                    {reviews.length > 1 ? (
                                        <button
                                            onClick={() => setActiveIdx((prev) => prev === 0 ? reviews.length - 1 : prev - 1)}
                                            style={{
                                                flexShrink: 0, width: 40, height: 40, borderRadius: '7px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                                                cursor: 'pointer', color: 'var(--text-main)', boxShadow: 'var(--shadow)'
                                            }}
                                            className="hover:scale-105 transition-transform"
                                            aria-label="Previous review"
                                        >
                                            <FiChevronLeft size={20} />
                                        </button>
                                    ) : <div style={{ width: 40, flexShrink: 0 }} />}

                                    {/* Track — overflow-hidden only here so clipping is clean */}
                                    <div ref={reviewTrackRef} className="flex-1 overflow-hidden">
                                        <div
                                            className={reviewNoAnim ? "flex gap-6" : "flex gap-6 transition-transform duration-700 ease-in-out"}
                                            style={{ transform: `translateX(-${activeIdx * reviewStepPx}px)` }}
                                        >
                                            {[...reviews, ...reviews].map((rev, idx) => (
                                                <div key={idx} style={{ width: 'calc(33.333% - 16px)', flexShrink: 0 }}>
                                                    <ReviewCard review={rev} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right Arrow — outside overflow-hidden so it's never clipped */}
                                    {reviews.length > 1 ? (
                                        <button
                                            onClick={() => setActiveIdx((prev) => prev + 1)}
                                            style={{
                                                flexShrink: 0, width: 40, height: 40, borderRadius: '7px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                                                cursor: 'pointer', color: 'var(--text-main)', boxShadow: 'var(--shadow)'
                                            }}
                                            className="hover:scale-105 transition-transform"
                                            aria-label="Next review"
                                        >
                                            <FiChevronRight size={20} />
                                        </button>
                                    ) : <div style={{ width: 40, flexShrink: 0 }} />}
                                </div>

                                {/* Mobile View — Smooth Sliding Side-Peeking Carousel with Centered Side Arrows */}
                                <div className="block md:hidden relative w-full h-[340px]">
                                    {/* Left Arrow — vertically centered on the side */}
                                    {reviews.length > 1 && (
                                        <button
                                            onClick={() => setActiveIdx((prev) => prev === 0 ? reviews.length - 1 : prev - 1)}
                                            style={{
                                                position: 'absolute',
                                                left: '8px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                zIndex: 20,
                                                width: 36,
                                                height: 36,
                                                borderRadius: '7px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'var(--bg-card)',
                                                border: '1.5px solid var(--border)',
                                                color: 'var(--text-main)',
                                                boxShadow: 'var(--shadow-md)',
                                            }}
                                            aria-label="Previous review"
                                        >
                                            <FiChevronLeft size={18} />
                                        </button>
                                    )}

                                    {/* Track — overflow-hidden only here so clipping is clean */}
                                    <div
                                        ref={mobileReviewTrackRef}
                                        className="w-full h-full overflow-hidden"
                                        onTouchStart={handleTouchStart}
                                        onTouchMove={handleTouchMove}
                                        onTouchEnd={handleTouchEnd}
                                    >
                                        <div
                                            className={reviewNoAnim ? "flex gap-4 items-center h-full" : "flex gap-4 items-center h-full transition-transform duration-700 ease-in-out"}
                                            style={{
                                                transform: `translateX(${- (activeIdx * mobileReviewStepPx - mobileCenterOffset)}px)`,
                                            }}
                                        >
                                            {[...reviews, ...reviews].map((rev, idx) => {
                                                const isActive = idx === activeIdx;
                                                return (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            width: '80%',
                                                            flexShrink: 0,
                                                            opacity: isActive ? 1 : 0.4,
                                                            transform: isActive ? 'scale(1)' : 'scale(0.9)',
                                                            transition: 'all 0.4s ease-in-out',
                                                        }}
                                                    >
                                                        <ReviewCard review={rev} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Right Arrow — vertically centered on the side */}
                                    {reviews.length > 1 && (
                                        <button
                                            onClick={() => setActiveIdx((prev) => prev + 1)}
                                            style={{
                                                position: 'absolute',
                                                right: '8px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                zIndex: 20,
                                                width: 36,
                                                height: 36,
                                                borderRadius: '7px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'var(--bg-card)',
                                                border: '1.5px solid var(--border)',
                                                color: 'var(--text-main)',
                                                boxShadow: 'var(--shadow-md)',
                                            }}
                                            aria-label="Next review"
                                        >
                                            <FiChevronRight size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. Stats Breakdown (Grid Layout) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
                        {/* 4.7 Numeric Rating Summary Card */}
                        <div className="card p-6 flex flex-col items-center justify-center text-center rounded-[7px] backdrop-blur-sm" style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)' }}>
                            <div className="font-display text-5xl font-bold mb-2" style={{ color: 'var(--text-main)' }}>
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

                        {/* Progress Bar Breakdown Card */}
                        <div className="card p-6 flex flex-col gap-3 justify-center rounded-[7px] backdrop-blur-sm" style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)' }}>
                            {reviewStats.breakdown.map(({ star, count }) => (
                                <div key={star} className="flex items-center gap-3 text-xs">
                                    <span className="w-8 flex items-center justify-end gap-1 text-right shrink-0 text-gray-300" style={{ color: 'var(--text-muted)' }}>
                                        {star} <FiStar size={11} fill="#f59e0b" stroke="#f59e0b" className="shrink-0" />
                                    </span>
                                    <div className="flex-1 h-2 rounded-[7px] overflow-hidden" style={{ background: 'var(--border)' }}>
                                        <div
                                            className="h-full rounded-[7px] transition-all duration-700"
                                            style={{
                                                width: reviewStats.total > 0 ? `${(count / reviewStats.total) * 100}%` : '0%',
                                                background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                                            }}
                                        />
                                    </div>
                                    <span className="w-6 font-semibold text-right shrink-0 text-gray-300" style={{ color: 'var(--text-muted)' }}>{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Review Submission Form centered */}
                    <div className="max-w-2xl mx-auto">
                        <ReviewForm onSuccess={handleNewReview} />
                    </div>

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