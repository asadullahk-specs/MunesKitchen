import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiX, FiChevronLeft, FiChevronRight, FiGrid, FiArrowRight, FiSearch, FiPhone } from 'react-icons/fi';
import { getProducts } from '../api/products';
import { getCategories } from '../api/categories';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import SkeletonCard from '../components/SkeletonCard';

const MenuPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // scroll refs for mobile category rows
    const scrollRefs = useRef({});

    const filteredProductsList = products.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category?.name && p.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    useEffect(() => {
        getCategories().then((res) => setCategories(res.data.data)).catch(() => { });
    }, []);

    useEffect(() => {
        setLoading(true);
        const params = { show_on_menu: true };
        if (activeCategory !== 'all') params.category_id = activeCategory;

        getProducts(params)
            .then((res) => setProducts(res.data.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [activeCategory]);

    const handleCategoryChange = (catId) => {
        setActiveCategory(catId);
        if (catId === 'all') {
            setSearchParams({});
        } else {
            setSearchParams({ category: catId });
        }
        setFilterDrawerOpen(false);
    };

    const handleScroll = (catId, direction) => {
        const container = scrollRefs.current[catId];
        if (container) {
            const scrollAmount = direction === 'left' ? -296 : 296;
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const groupedProducts = categories.map(cat => {
        const catProds = filteredProductsList.filter(p => {
            const pCatId = p.category_id?.id || p.category?.id;
            const targetCatId = cat.id || cat._id;
            return String(pCatId) === String(targetCatId);
        });
        return {
            id: cat.id || cat._id,
            name: cat.name,
            products: catProds
        };
    }).filter(cat => cat.products.length > 0);

    return (
        <motion.div
            className="min-h-screen pb-24 sm:pb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            {/* Hero Banner Section — clean, no background image */}
            <div
                className="relative w-full py-14 md:py-20 text-center px-4 overflow-hidden mb-10"
                style={{
                    background: 'var(--bg-deep)',
                    borderBottom: '1px solid var(--border)',
                    backgroundImage: 'url(/menu-bg.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                {/* Blackish overlay on background image */}
                <div className="absolute inset-0 bg-black/55" />

                {/* Subtle decorative gradient accent */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(153,0,0,0.08) 0%, transparent 70%)' }} />

                <div className="relative z-10 max-w-4xl mx-auto">
                    <motion.p
                        className="text-xs font-bold uppercase tracking-[0.3em] mb-3"
                        style={{ color: 'var(--primary)' }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        Explore Our Menu
                    </motion.p>

                    <motion.h1
                        className="font-extrabold leading-tight mb-3"
                        style={{ fontSize: 'clamp(2.2rem, 6vw, 3.8rem)', color: 'var(--text-main)' }}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <span style={{ color: 'rgb(188, 156, 34)' }}>Our</span> <span style={{ color: 'var(--primary)' }}>Menu</span>
                    </motion.h1>

                    <motion.p
                        className="font-medium tracking-wide"
                        style={{ fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', color: 'var(--text-muted)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        Our best treats are waiting for you
                    </motion.p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4">

                {/* Search Bar */}
                <div className="max-w-md mx-auto mb-8 relative">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full px-5 py-3 rounded-2xl border transition-all text-sm pr-12 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                        style={{
                            background: 'var(--bg-card)',
                            borderColor: 'var(--border)',
                            color: 'var(--text-main)',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-400">
                        {searchQuery ? (
                            <button type="button" onClick={() => setSearchQuery('')} className="hover:text-[var(--primary)] transition-colors">
                                <FiX size={16} />
                            </button>
                        ) : (
                            <FiSearch size={16} />
                        )}
                    </span>
                </div>

                {/* ─── DESKTOP/TABLET CATEGORY FILTER TABS ─── */}
                <div className="hidden sm:block">
                    <motion.div
                        className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <button
                            onClick={() => handleCategoryChange('all')}
                            className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all"
                            style={{
                                background: activeCategory === 'all' ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'var(--bg-card)',
                                color: activeCategory === 'all' ? 'white' : 'var(--text-muted)',
                                border: activeCategory === 'all' ? 'none' : '1.5px solid var(--border)',
                                boxShadow: activeCategory === 'all' ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                            }}
                        >
                            All Items
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryChange(String(cat.id))}
                                className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all"
                                style={{
                                    background: activeCategory === String(cat.id) ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'var(--bg-card)',
                                    color: activeCategory === String(cat.id) ? 'white' : 'var(--text-muted)',
                                    border: activeCategory === String(cat.id) ? 'none' : '1.5px solid var(--border)',
                                    boxShadow: activeCategory === String(cat.id) ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                                }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </motion.div>
                </div>

                {/* ─── MOBILE ONLY CATEGORY CONTROLS ─── */}
                <div className="block sm:hidden mb-6">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleCategoryChange('all')}
                            className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
                            style={{
                                background: activeCategory === 'all' ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'var(--bg-card)',
                                color: activeCategory === 'all' ? 'white' : 'var(--text-muted)',
                                border: activeCategory === 'all' ? 'none' : '1.5px solid var(--border)',
                                boxShadow: activeCategory === 'all' ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                            }}
                        >
                            All Items
                        </button>
                        <button
                            onClick={() => setFilterDrawerOpen(true)}
                            className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
                            style={{
                                background: activeCategory !== 'all' ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'var(--bg-card)',
                                color: activeCategory !== 'all' ? 'white' : 'var(--text-muted)',
                                border: activeCategory !== 'all' ? 'none' : '1.5px solid var(--border)',
                                boxShadow: activeCategory !== 'all' ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                            }}
                        >
                            Filter Category
                        </button>
                    </div>
                </div>

                {/* ─── PRODUCTS VIEW (RESPONSIVE CAROUSELS / GRID) ─── */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : filteredProductsList.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4"><img className='h-[100px] mx-auto' src="../../public/new1.png" alt="" /></div>
                        <h3 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--text-main)' }}>
                            No items found
                        </h3>
                        <p style={{ color: 'var(--text-muted)' }}>Try a different category or search term</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Grid Layout (sm and larger) */}
                        <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredProductsList.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onViewDetails={setSelectedProduct}
                                />
                            ))}
                        </div>

                        {/* Mobile Category-Wise Scrollable Layout (less than sm) */}
                        <div className="block sm:hidden space-y-10 animate-fadeIn">
                            {groupedProducts.map((group) => (
                                <div key={group.id} className="space-y-3">
                                    {/* Category Header */}
                                    <div className="flex items-center justify-between border-b pb-2 px-1" style={{ borderColor: 'var(--border)' }}>
                                        <h2 className="font-display font-bold text-lg" style={{ color: 'var(--primary)' }}>
                                            {group.name}
                                        </h2>
                                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', fontWeight: 600 }}>
                                            {group.products.length} {group.products.length === 1 ? 'item' : 'items'}
                                        </span>
                                    </div>

                                    {/* Scrollable Container with Arrows */}
                                    <div className="relative w-full">
                                        {/* Left Arrow */}
                                        {group.products.length > 1 && (
                                            <button
                                                onClick={() => handleScroll(group.id, 'left')}
                                                style={{
                                                    position: 'absolute',
                                                    left: '-6px',
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

                                        {/* Horizontal Touch Scroll Row */}
                                        <div
                                            ref={(el) => { scrollRefs.current[group.id] = el; }}
                                            className="mobile-scroll-container px-4 -mx-4 pb-2"
                                        >
                                            {group.products.map((product) => (
                                                <div key={product.id} className="mobile-scroll-item">
                                                    <ProductCard
                                                        product={product}
                                                        onViewDetails={setSelectedProduct}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Right Arrow */}
                                        {group.products.length > 1 && (
                                            <button
                                                onClick={() => handleScroll(group.id, 'right')}
                                                style={{
                                                    position: 'absolute',
                                                    right: '-6px',
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
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Mobile Filter Drawer Overlay */}
            <AnimatePresence>
                {filterDrawerOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 z-50 bg-black/60 sm:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setFilterDrawerOpen(false)}
                        />
                        {/* Slide-up Panel */}
                        <motion.div
                            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2.5rem] p-6 max-h-[80vh] overflow-y-auto sm:hidden border-t"
                            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', fontFamily: 'Poppins, sans-serif' }}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                        >
                            <div className="flex items-center justify-between mb-6 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                                <h3 className="font-bold text-base" style={{ color: 'var(--text-main)' }}>Select Category</h3>
                                <button
                                    onClick={() => setFilterDrawerOpen(false)}
                                    className="p-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 transition-colors"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    <FiX size={18} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <button
                                    onClick={() => handleCategoryChange('all')}
                                    className="w-full text-left px-4 py-3 rounded-xl transition-all font-medium text-sm flex items-center justify-between"
                                    style={{
                                        background: activeCategory === 'all' ? 'var(--primary-glow)' : 'transparent',
                                        color: activeCategory === 'all' ? 'var(--primary)' : 'var(--text-main)',
                                    }}
                                >
                                    <span>All Items</span>
                                    {activeCategory === 'all' && <FiChevronRight size={16} />}
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleCategoryChange(String(cat.id))}
                                        className="w-full text-left px-4 py-3 rounded-xl transition-all font-medium text-sm flex items-center justify-between"
                                        style={{
                                            background: activeCategory === String(cat.id) ? 'var(--primary-glow)' : 'transparent',
                                            color: activeCategory === String(cat.id) ? 'var(--primary)' : 'var(--text-main)',
                                        }}
                                    >
                                        <span>{cat.name}</span>
                                        {activeCategory === String(cat.id) && <FiChevronRight size={16} />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {selectedProduct && (
                <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
            )}
        </motion.div>
    );
};

export default MenuPage;