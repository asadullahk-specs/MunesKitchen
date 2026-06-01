import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiX, FiChevronRight, FiGrid, FiArrowRight } from 'react-icons/fi';
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

    useEffect(() => {
        getCategories().then((res) => setCategories(res.data.data)).catch(() => { });
    }, []);

    useEffect(() => {
        setLoading(true);
        // Load all menu items if 'all', or filter by category
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

    // Next Category handler for mobile specific view
    const handleNextCategory = () => {
        if (categories.length === 0) return;
        const currentIdx = categories.findIndex(c => String(c.id) === activeCategory);
        const nextIdx = (currentIdx + 1) % categories.length;
        handleCategoryChange(String(categories[nextIdx].id));
    };

    // Group items category-wise in frontend
    const groupedProducts = categories.map(cat => {
        const catProds = products.filter(p => {
            const pCatId = p.category_id?._id || p.category_id;
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
            className="min-h-screen pt-12 pb-10 px-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <motion.h1
                        className="section-title mb-2"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        Our Menu
                    </motion.h1>
                    <motion.p
                        className="section-subtitle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        Fresh, frozen, and ready to cook
                    </motion.p>
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
                                background: activeCategory === 'all' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'var(--bg-card)',
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
                                    background: activeCategory === String(cat.id) ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'var(--bg-card)',
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
                                background: activeCategory === 'all' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'var(--bg-card)',
                                color: activeCategory === 'all' ? 'white' : 'var(--text-muted)',
                                border: activeCategory === 'all' ? 'none' : '1.5px solid var(--border)',
                                boxShadow: activeCategory === 'all' ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                            }}
                        >
                            <FiGrid size={16} /> All Items
                        </button>
                        <button
                            onClick={() => setFilterDrawerOpen(true)}
                            className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
                            style={{
                                background: activeCategory !== 'all' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'var(--bg-card)',
                                color: activeCategory !== 'all' ? 'white' : 'var(--text-muted)',
                                border: activeCategory !== 'all' ? 'none' : '1.5px solid var(--border)',
                                boxShadow: activeCategory !== 'all' ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                            }}
                        >
                            <FiFilter size={16} /> Filter
                        </button>
                    </div>
                </div>

                {/* ─── PRODUCTS VIEW (RESPONSIVE) ─── */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🍱</div>
                        <h3 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--text-main)' }}>
                            No items found
                        </h3>
                        <p style={{ color: 'var(--text-muted)' }}>Try a different category</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Grid Layout */}
                        <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onViewDetails={setSelectedProduct}
                                />
                            ))}
                        </div>

                        {/* Mobile Category-Wise Stack Layout */}
                        <div className="block sm:hidden space-y-8 animate-fadeIn">
                            {groupedProducts.map((group) => (
                                <div key={group.id} className="space-y-4">
                                    <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                                        <h2 className="font-display font-bold text-lg" style={{ color: 'var(--primary)' }}>
                                            {group.name}
                                        </h2>
                                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', fontWeight: 600 }}>
                                            {group.products.length} {group.products.length === 1 ? 'item' : 'items'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {group.products.map((product) => (
                                            <ProductCard
                                                key={product.id}
                                                product={product}
                                                onViewDetails={setSelectedProduct}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Mobile "Next Category" button (only displayed when a single category filter is active) */}
                            {activeCategory !== 'all' && categories.length > 1 && (
                                <div className="pt-4">
                                    <button
                                        onClick={handleNextCategory}
                                        className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 rounded-2xl shadow-lg"
                                    >
                                        Next Category <FiChevronRight size={18} />
                                    </button>
                                </div>
                            )}
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
                            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 rounded-t-[2.5rem] p-6 max-h-[80vh] overflow-y-auto sm:hidden border-t"
                            style={{ borderColor: 'var(--border)', fontFamily: 'Poppins, sans-serif' }}
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