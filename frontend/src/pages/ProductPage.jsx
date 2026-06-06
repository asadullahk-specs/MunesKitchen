import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiMinus, FiShoppingCart, FiStar, FiChevronLeft, FiChevronRight, FiHeart, FiClock, FiActivity, FiLayers, FiInfo, FiMessageSquare, FiChevronDown, FiAward, FiTruck } from 'react-icons/fi';
import { getProduct, getProducts } from '../api/products';
import { getReviews } from '../api/reviews';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import ReviewForm from '../components/ReviewForm';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const ProductPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);
    
    // Accordion open/close states — single-active (opening one closes others)
    const [openAccordion, setOpenAccordion] = useState('description');

    const toggleAccordion = (tabId) => {
        setOpenAccordion(prev => (prev === tabId ? null : tabId));
    };

    // Reviews states
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState({ avgRating: 0, total: 0, breakdown: [] });
    const [reviewsLoading, setReviewsLoading] = useState(true);

    // Related & Explore states
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [exploreProducts, setExploreProducts] = useState([]);
    const relatedScrollRef = useRef(null);
    const exploreScrollRef = useRef(null);

    useEffect(() => {
        if (!id) return;
        
        const fetchProductData = async () => {
            setLoading(true);
            setReviewsLoading(true);
            setQty(1);
            try {
                // 1. Fetch Product details
                const prodRes = await getProduct(id);
                if (prodRes?.data?.success) {
                    const prod = prodRes.data.data;
                    setProduct(prod);

                    // 2. Fetch Related Products (same category, excluding current product)
                    const categoryId = prod.category_id?.id || prod.category_id?._id || prod.category?.id || prod.category?._id;
                    if (categoryId) {
                        const relatedRes = await getProducts({ category_id: categoryId, show_on_menu: true });
                        if (relatedRes?.data?.success) {
                            const filtered = relatedRes.data.data.filter(p => (p.id || p._id) !== id);
                            setRelatedProducts(filtered.slice(0, 4));
                        }
                    }

                    // 3. Fetch Explore More (different categories/all items)
                    const exploreRes = await getProducts({ show_on_menu: true });
                    if (exploreRes?.data?.success) {
                        const filtered = exploreRes.data.data.filter(p => {
                            const pCatId = p.category_id?.id || p.category_id?._id || p.category?.id || p.category?._id;
                            const currentCatId = categoryId;
                            return (p.id || p._id) !== id && String(pCatId) !== String(currentCatId);
                        });
                        setExploreProducts(filtered.slice(0, 4));
                    }
                } else {
                    navigate('/menu');
                }
            } catch (err) {
                console.error("Error loading product:", err);
                navigate('/menu');
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [id, navigate]);

    useEffect(() => {
        if (!id) return;
        const fetchReviewsData = async () => {
            try {
                // Fetch approved reviews for this product
                const revRes = await getReviews({ status: 'approved', product_id: id });
                if (revRes?.data?.success) {
                    setReviews(revRes.data.data || []);
                    setReviewStats({
                        avgRating: revRes.data.avgRating || 0,
                        total: revRes.data.total || 0,
                        breakdown: revRes.data.breakdown || []
                    });
                }
            } catch (err) {
                console.error("Error loading reviews:", err);
            } finally {
                setReviewsLoading(false);
            }
        };
        fetchReviewsData();
    }, [id]);

    const handleAddToCart = () => {
        if (!product) return;
        addToCart(product, qty);
    };




    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-deep)]">
                <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!product) return null;

    const imageUrl = product.image
        ? (product.image.startsWith('http') ? product.image : `${BACKEND_URL.replace('/api', '')}/${product.image.replace(/^\//, '')}`)
        : null;

    return (
        <div className="min-h-screen bg-[var(--bg-deep)] pt-16 pb-12 px-4 sm:px-6 lg:px-8">

            <div className="max-w-6xl mx-auto">
                {/* Back button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-medium mb-6 transition-colors hover:text-[var(--primary)]"
                    style={{ color: 'var(--text-muted)' }}
                >
                    <FiChevronLeft size={16} /> Back to menu
                </button>

                {/* 2-Column Top Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-12">
                    {/* Left: Product Image */}
                    <motion.div
                        className="rounded-lg overflow-hidden glass border border-[var(--border)] shadow-lg aspect-square flex items-center justify-center relative bg-[var(--bg-card)]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                            />
                        ) : (
                            <span className="text-[var(--text-muted)]">No Image Available</span>
                        )}
                        {product.hot_selling && (
                            <div className="absolute top-4 left-4">
                                <span className="badge-hot">🔥 Hot Selling</span>
                            </div>
                        )}
                    </motion.div>

                    {/* Right: Product Details */}
                    <motion.div
                        className="flex flex-col justify-between"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div>
                            {/* Category badge */}
                            <span className="text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block" style={{ color: 'var(--primary)', background: 'var(--primary-glow)' }}>
                                {product.category_id?.name || 'Menu Item'}
                            </span>

                            {/* Product Name */}
                            <h1 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: 'var(--text-main)' }}>
                                {product.name}
                            </h1>

                            {/* Review average rating summary */}
                            <div className="flex items-center gap-2 mb-6">
                                <div className="flex text-amber-400">
                                    {[...Array(5)].map((_, i) => (
                                        <FiStar key={i} size={16} fill={i < Math.round(reviewStats.avgRating) ? "currentColor" : "none"} />
                                    ))}
                                </div>
                                <span className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                                    {reviewStats.avgRating}
                                </span>
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    ({reviewStats.total} reviews)
                                </span>
                            </div>

                            {/* Description */}
                            <p className="text-base mb-6" style={{ color: 'var(--text-muted)' }}>
                                {product.description || 'No description available for this item.'}
                            </p>
                        </div>

                        <div>
                            {/* Price details */}
                            <div className="mb-6">
                                <span className="text-sm font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Price</span>
                                <span className="text-3xl font-black" style={{ color: 'var(--primary)' }}>
                                    Rs. {product.price}
                                </span>
                            </div>

                            {/* Quantity & Add to Cart Action Row */}
                            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-4">
                                <div className="flex items-center gap-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-full px-4 py-2">
                                    <button
                                        type="button"
                                        onClick={() => setQty(q => Math.max(1, q - 1))}
                                        className="qty-btn"
                                        aria-label="Decrease quantity"
                                    >
                                        <FiMinus size={14} />
                                    </button>
                                    <span className="font-semibold text-lg w-8 text-center" style={{ color: 'var(--text-main)' }}>
                                        {qty}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setQty(q => q + 1)}
                                        className="qty-btn"
                                        aria-label="Increase quantity"
                                    >
                                        <FiPlus size={14} />
                                    </button>
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    className="btn-primary flex-1 min-w-[200px] justify-center py-3.5 shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5"
                                >
                                    <FiShoppingCart /> Add to Cart
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
                {/* Collapsible Accordion Sections (Woodmart/Dinenos Style) */}
                <div className="mb-16 space-y-4">
                    {/* PANEL 1: DESCRIPTION */}
                    <div id="accordion-description" className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--bg-card)] scroll-mt-24">
                        <button
                            onClick={() => toggleAccordion('description')}
                            className="w-full flex items-center justify-between p-5 text-left font-bold text-base transition-colors hover:bg-[var(--primary-glow)] outline-none"
                            style={{ color: openAccordion === 'description' ? 'var(--primary)' : 'var(--text-main)', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        >
                            <div className="flex items-center gap-2.5">
                                <FiLayers size={17} style={{ color: openAccordion === 'description' ? 'var(--primary)' : 'var(--text-muted)' }} />
                                <span>Description</span>
                            </div>
                            <FiChevronDown
                                size={18}
                                className={`transition-transform duration-300 ${openAccordion === 'description' ? 'rotate-180 text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}
                            />
                        </button>
                        <AnimatePresence initial={false}>
                            {openAccordion === 'description' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-6 pt-0 border-t border-[var(--border)]">
                                        <div className="prose max-w-none text-sm text-[var(--text-muted)] leading-relaxed pt-4">
                                            <p className="whitespace-pre-line">
                                                {product.long_description || product.description || 'No detailed description available.'}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* PANEL 2: ADDITIONAL INFORMATION */}
                    <div id="accordion-info" className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--bg-card)] scroll-mt-24">
                        <button
                            onClick={() => toggleAccordion('info')}
                            className="w-full flex items-center justify-between p-5 text-left font-bold text-base transition-colors hover:bg-[var(--primary-glow)] outline-none"
                            style={{ color: openAccordion === 'info' ? 'var(--primary)' : 'var(--text-main)', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        >
                            <div className="flex items-center gap-2.5">
                                <FiInfo size={17} style={{ color: openAccordion === 'info' ? 'var(--primary)' : 'var(--text-muted)' }} />
                                <span>Additional Information</span>
                            </div>
                            <FiChevronDown
                                size={18}
                                className={`transition-transform duration-300 ${openAccordion === 'info' ? 'rotate-180 text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}
                            />
                        </button>
                        <AnimatePresence initial={false}>
                            {openAccordion === 'info' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-6 pt-0 border-t border-[var(--border)]">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 pt-4">
                                            {[
                                                { label: 'Ingredients', value: product.ingredients },
                                                { label: 'Allergens', value: product.allergens },
                                                { label: 'Serving Size', value: product.serving_size },
                                                { label: 'Calories', value: product.calories ? `${product.calories} kcal` : null },
                                                { label: 'Prep Time', value: product.prep_time },
                                                { label: 'Spice Level', value: product.spice_level },
                                                { label: 'Storage Info', value: product.storage_info },
                                                { label: 'Additional Notes', value: product.additional_notes }
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex justify-between py-3 border-b border-[var(--border)] items-center">
                                                    <span className="text-sm font-semibold text-[var(--text-muted)]">{item.label}</span>
                                                    <span className="text-sm font-medium text-[var(--text-main)] text-right max-w-[60%] truncate-2-lines">
                                                        {item.value || 'N/A'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* PANEL 3: REVIEWS */}
                    <div id="accordion-reviews" className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--bg-card)] scroll-mt-24">
                        <button
                            onClick={() => toggleAccordion('reviews')}
                            className="w-full flex items-center justify-between p-5 text-left font-bold text-base transition-colors hover:bg-[var(--primary-glow)] outline-none"
                            style={{ color: openAccordion === 'reviews' ? 'var(--primary)' : 'var(--text-main)', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        >
                            <div className="flex items-center gap-2.5">
                                <FiMessageSquare size={17} style={{ color: openAccordion === 'reviews' ? 'var(--primary)' : 'var(--text-muted)' }} />
                                <span>Reviews ({reviewStats.total})</span>
                            </div>
                            <FiChevronDown
                                size={18}
                                className={`transition-transform duration-300 ${openAccordion === 'reviews' ? 'rotate-180 text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}
                            />
                        </button>
                        <AnimatePresence initial={false}>
                            {openAccordion === 'reviews' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-6 pt-0 border-t border-[var(--border)]">
                                        <div className="space-y-8 pt-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                {/* Left: Ratings Breakdown */}
                                                <div className="md:border-r border-[var(--border)] md:pr-8 flex flex-col justify-center">
                                                    <div className="text-center mb-6">
                                                        <span className="text-5xl font-black block" style={{ color: 'var(--text-main)' }}>
                                                            {reviewStats.avgRating}
                                                        </span>
                                                        <div className="flex justify-center text-amber-400 my-2">
                                                            {[...Array(5)].map((_, i) => (
                                                                <FiStar key={i} size={18} fill={i < Math.round(reviewStats.avgRating) ? "currentColor" : "none"} />
                                                            ))}
                                                        </div>
                                                        <span className="text-sm text-[var(--text-muted)] block">Based on {reviewStats.total} approved reviews</span>
                                                    </div>

                                                    {/* Stars Breakdown progress bars */}
                                                    <div className="space-y-2.5">
                                                        {reviewStats.breakdown.map((item) => {
                                                            const percent = reviewStats.total > 0 ? (item.count / reviewStats.total) * 100 : 0;
                                                            return (
                                                                <div key={item.star} className="flex items-center gap-3">
                                                                    <span className="text-xs font-semibold w-3 text-right">{item.star}</span>
                                                                    <FiStar size={11} className="text-amber-400 fill-current" />
                                                                    <div className="flex-1 h-2 bg-[var(--bg-deep)] rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-amber-400 rounded-full"
                                                                            style={{ width: `${percent}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs text-[var(--text-muted)] w-8 text-right">{item.count}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Right: Reviews List */}
                                                <div className="md:col-span-2 space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                                    {reviewsLoading ? (
                                                        <p className="text-center text-sm text-[var(--text-muted)]">Loading reviews...</p>
                                                    ) : reviews.length === 0 ? (
                                                        <p className="text-center text-sm py-12 text-[var(--text-muted)] italic">No approved reviews yet for this item. Be the first to share your experience!</p>
                                                    ) : (
                                                        reviews.map((rev) => (
                                                            <div key={rev.id || rev._id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-deep)]">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <h4 className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>{rev.customer_name}</h4>
                                                                    <div className="flex text-amber-400">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <FiStar key={i} size={12} fill={i < rev.rating ? "currentColor" : "none"} />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs text-[var(--text-muted)] mb-2">
                                                                    {new Date(rev.created_at || rev.createdAt).toLocaleDateString('en-GB')}
                                                                </p>
                                                                <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>"{rev.message}"</p>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bottom: Review Submission Form */}
                                            <div className="border-t border-[var(--border)] pt-8">
                                                <ReviewForm productId={id} onSuccess={() => {}} />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* RELATED ITEMS SECTION (Always Visible) */}
                <div id="related-items-section" className="mb-12 bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-6 sm:p-8 shadow-sm scroll-mt-24">
                    <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-main)' }}>People Also Ordered (Related Items)</h3>
                    {relatedProducts.length === 0 ? (
                        <p className="text-sm text-[var(--text-muted)] italic">No other products found in this category.</p>
                    ) : (
                        <>
                            {/* Desktop/Tablet View */}
                            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {relatedProducts.map(p => (
                                    <ProductCard key={p.id || p._id} product={p} />
                                ))}
                            </div>

                            {/* Mobile View — horizontal scroll row */}
                            <div className="block sm:hidden">
                                <div
                                    ref={relatedScrollRef}
                                    className="mobile-scroll-container px-4 -mx-4 pb-2"
                                >
                                    {relatedProducts.map(p => (
                                        <div key={p.id || p._id} className="mobile-scroll-item">
                                            <ProductCard product={p} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* EXPLORE PRODUCTS SECTION (Always Visible) */}
                <div id="explore-products-section" className="mb-16 bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-6 sm:p-8 shadow-sm scroll-mt-24">
                    <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-main)' }}>Explore Other Categories</h3>
                    {exploreProducts.length === 0 ? (
                        <p className="text-sm text-[var(--text-muted)] italic">No other products found.</p>
                    ) : (
                        <>
                            {/* Desktop/Tablet View */}
                            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {exploreProducts.map(p => (
                                    <ProductCard key={p.id || p._id} product={p} />
                                ))}
                            </div>

                            {/* Mobile View — horizontal scroll row */}
                            <div className="block sm:hidden">
                                <div
                                    ref={exploreScrollRef}
                                    className="mobile-scroll-container px-4 -mx-4 pb-2"
                                >
                                    {exploreProducts.map(p => (
                                        <div key={p.id || p._id} className="mobile-scroll-item">
                                            <ProductCard product={p} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
