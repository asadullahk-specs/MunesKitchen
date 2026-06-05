import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiGift, FiSearch, FiRefreshCw, FiImage } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getOffers, createOffer, updateOffer, deleteOffer } from '../../api/offers';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const emptyForm = {
    name: '',
    description: '',
    original_price: '',
    discounted_price: '',
    discount_percentage: '',
    image: '',
    is_active: true
};

const AdminOffers = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editOffer, setEditOffer] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAllOffers = async () => {
        setLoading(true);
        try {
            const res = await getOffers();
            setOffers(res.data.data || []);
        } catch (err) {
            toast.error('Failed to load promotional offers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllOffers();
    }, []);

    // Auto calculate discount percentage when prices change
    useEffect(() => {
        const orig = parseFloat(form.original_price);
        const disc = parseFloat(form.discounted_price);
        if (orig > 0 && disc >= 0 && disc < orig) {
            const pct = Math.round(((orig - disc) / orig) * 100);
            setForm(prev => ({ ...prev, discount_percentage: pct }));
        } else if (orig > 0 && disc === orig) {
            setForm(prev => ({ ...prev, discount_percentage: 0 }));
        }
    }, [form.original_price, form.discounted_price]);

    const openAdd = () => {
        setEditOffer(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (offer) => {
        setEditOffer(offer);
        setForm({
            name: offer.name,
            description: offer.description || '',
            original_price: offer.original_price,
            discounted_price: offer.discounted_price,
            discount_percentage: offer.discount_percentage || 0,
            image: offer.image || '',
            is_active: offer.is_active
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return toast.error('Offer name is required');
        if (!form.original_price) return toast.error('Original price is required');
        if (!form.discounted_price) return toast.error('Discounted price is required');

        const orig = parseFloat(form.original_price);
        const disc = parseFloat(form.discounted_price);
        if (disc > orig) {
            return toast.error('Discounted price cannot be higher than original price');
        }

        setSaving(true);
        try {
            const payload = {
                ...form,
                original_price: orig,
                discounted_price: disc,
                discount_percentage: parseInt(form.discount_percentage) || 0
            };

            if (editOffer) {
                await updateOffer(editOffer.id, payload);
                toast.success('Promotional offer updated successfully');
            } else {
                await createOffer(payload);
                toast.success('Promotional offer created successfully');
            }
            setShowModal(false);
            fetchAllOffers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save offer');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this offer banner?')) return;
        try {
            await deleteOffer(id);
            toast.success('Offer deleted successfully');
            fetchAllOffers();
        } catch (err) {
            toast.error('Failed to delete offer');
        }
    };

    const toggleStatus = async (offer) => {
        try {
            const updated = { ...offer, is_active: !offer.is_active };
            await updateOffer(offer.id, updated);
            toast.success(`Offer marked as ${updated.is_active ? 'active' : 'inactive'}`);
            // Optimistic update
            setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, is_active: !o.is_active } : o));
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const getImageUrl = (img) => {
        if (!img) return '';
        if (img.startsWith('http')) return img;
        return `${BACKEND_URL}/${img.replace(/^\//, '')}`;
    };

    const filteredOffers = offers.filter(o => 
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.description && o.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div style={{ width: '100%', fontFamily: 'Poppins, sans-serif' }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <FiGift size={22} className="text-red-500" />
                        <h1 className="font-bold text-2xl" style={{ color: 'var(--text-main)' }}>Promotional Offers</h1>
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Manage website discount banners and dynamic meal deals
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchAllOffers}
                        className="p-2.5 rounded-xl border flex items-center justify-center transition-all"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                        title="Refresh"
                    >
                        <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 py-2.5">
                        <FiPlus size={16} /> Add Offer
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-6">
                <div className="relative">
                    <FiSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        className="form-input pl-10"
                        placeholder="Search offers by title, description or code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* List View */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="card p-4 animate-pulse space-y-4">
                            <div className="w-full h-40 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
                            <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                            <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                        </div>
                    ))}
                </div>
            ) : filteredOffers.length === 0 ? (
                <div className="card p-12 text-center" style={{ color: 'var(--text-muted)' }}>
                    <FiGift className="mx-auto mb-3 opacity-30" size={48} />
                    <p className="text-sm font-semibold">No promotional offers found.</p>
                    <p className="text-xs mt-1">Click "Add Offer" to start creating website deals.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOffers.map((offer) => (
                        <div
                            key={offer.id}
                            className="card overflow-hidden hover:shadow-lg transition-all flex flex-col"
                            style={{ opacity: offer.is_active ? 1 : 0.7 }}
                        >
                            {/* Card Image Header */}
                            <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                                {offer.image ? (
                                    <img
                                        src={getImageUrl(offer.image)}
                                        alt={offer.name}
                                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '';
                                        }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                        <FiImage size={32} />
                                        <span className="text-xs">No image provided</span>
                                    </div>
                                )}

                                {/* Percent badge */}
                                {offer.discount_percentage > 0 && (
                                    <span className="absolute top-3 left-3 bg-red-500 text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
                                        {offer.discount_percentage}% OFF
                                    </span>
                                )}

                                {/* Status Toggle Badge */}
                                <button
                                    onClick={() => toggleStatus(offer)}
                                    className="absolute top-3 right-3 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-md transition-all active:scale-95"
                                    style={{
                                        background: offer.is_active ? '#059669' : '#4b5563',
                                        color: '#ffffff'
                                    }}
                                >
                                    {offer.is_active ? 'Active' : 'Inactive'}
                                </button>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-base line-clamp-1 mb-1" style={{ color: 'var(--text-main)' }}>
                                        {offer.name}
                                    </h3>
                                    <p className="text-xs line-clamp-2 mb-4" style={{ color: 'var(--text-muted)' }}>
                                        {offer.description || 'No description provided.'}
                                    </p>
                                </div>

                                <div className="flex items-end justify-between mt-auto">
                                    {/* Pricing details */}
                                    <div>
                                        <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: 'var(--text-muted)' }}>Offer Price</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-lg" style={{ color: 'var(--primary)' }}>
                                                Rs. {offer.discounted_price.toLocaleString()}
                                            </span>
                                            <span className="text-xs line-through text-gray-400">
                                                Rs. {offer.original_price.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Control buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEdit(offer)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                                            style={{ background: 'rgba(217,119,6,0.1)', color: '#d97706' }}
                                            title="Edit"
                                        >
                                            <FiEdit2 size={13} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(offer.id)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                                            title="Delete"
                                        >
                                            <FiTrash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl overflow-hidden"
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                maxHeight: '92vh',
                            }}
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                                <h2 className="font-bold text-lg" style={{ color: 'var(--text-main)' }}>
                                    {editOffer ? 'Edit Promotional Offer' : 'Add New Offer'}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ color: 'var(--text-muted)', background: 'var(--bg-deep)' }}
                                >
                                    <FiX size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleSave}>
                                {/* Modal Body */}
                                <div className="p-5 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: '65vh' }}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                            {/* Offer Title */}
                                            <div>
                                                <label className="form-label">Offer Title *</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="e.g. Ramadan Special Combo"
                                                    value={form.name}
                                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                    required
                                                />
                                            </div>

                                            {/* Description */}
                                            <div>
                                                <label className="form-label">Description / Subtitle</label>
                                                <textarea
                                                    className="form-input"
                                                    rows={3}
                                                    placeholder="e.g. Get 2 pizzas and 1 drink at a special discounted price."
                                                    value={form.description}
                                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Image URL */}
                                            <div>
                                                <label className="form-label">Banner Image URL</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Paste Cloudinary or any direct image URL..."
                                                    value={form.image}
                                                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                                                />
                                            </div>

                                            {/* Pricing Row */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="form-label">Original (Rs.) *</label>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        placeholder="2499"
                                                        value={form.original_price}
                                                        onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="form-label">Discounted (Rs.) *</label>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        placeholder="1899"
                                                        value={form.discounted_price}
                                                        onChange={(e) => setForm({ ...form, discounted_price: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {/* Calculated Discount Info */}
                                            <div className="p-3.5 rounded-xl flex items-center justify-between text-xs" style={{ background: 'var(--bg-deep)', border: '1px dashed var(--border)' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Auto Calculated Discount:</span>
                                                <span className="font-extrabold text-sm text-red-500">
                                                    {form.discount_percentage || 0}% OFF
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Active toggle */}
                                    <div className="pt-2">
                                        <label className="flex items-center gap-2.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.is_active}
                                                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                                className="accent-red-500 w-4 h-4"
                                            />
                                            <span className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                                                Publish and display this offer immediately on homepage slider
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="p-5 flex justify-end gap-2 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-deep)' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-5 py-2.5 rounded-xl border text-sm font-semibold transition-colors"
                                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="btn-primary px-5 py-2.5 text-sm font-semibold"
                                    >
                                        {saving ? 'Saving...' : editOffer ? 'Update Offer' : 'Create Offer'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminOffers;
