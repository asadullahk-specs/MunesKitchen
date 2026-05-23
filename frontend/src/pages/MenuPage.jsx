import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    };

    return (
        <div className="min-h-screen pt-24 pb-16 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <motion.h1
                        className="section-title mb-3"
                        initial={{ opacity: 0, y: 20 }}
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

                {/* Category Filter Tabs */}
                <motion.div
                    className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-2 sm:gap-3 mb-8"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <button
                        onClick={() => handleCategoryChange('all')}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-sm transition-all"
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
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-sm transition-all"
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

                {/* Products Grid */}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onViewDetails={setSelectedProduct}
                            />
                        ))}
                    </div>
                )}
            </div>

            {selectedProduct && (
                <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
            )}
        </div>
    );
};

export default MenuPage;