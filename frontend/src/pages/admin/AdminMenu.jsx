import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUpload, FiImage, FiSearch } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../api/products'
import { getCategories } from '../../api/categories'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const emptyForm = {
    name: '',
    category_id: '',
    price: '',
    description: '',
    image: '',
    hot_selling: false,
    show_on_menu: true,
    long_description: '',
    allergens: '',
    serving_size: '',
    spice_level: '',
    weight: '',
    shelf_life: '',
    available_as: '',
    cooking_charges: ''
}

const AdminMenu = () => {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editProduct, setEditProduct] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [pRes, cRes] = await Promise.all([getProducts(), getCategories()])
            setProducts(pRes.data.data || [])
            setCategories(cRes.data.data || [])
        } catch {
            toast.error('Failed to load')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchAll() }, [])

    const openAdd = () => {
        setEditProduct(null)
        setForm(emptyForm)
        setShowModal(true)
    }

    const openEdit = (p) => {
        setEditProduct(p)
        setForm({
            name: p.name,
            category_id: p.category_id?.id || p.category_id?._id || p.category_id,
            price: p.price,
            description: p.description ?? '',
            image: p.image ?? '',
            hot_selling: p.hot_selling,
            show_on_menu: p.show_on_menu,
            long_description: p.long_description ?? '',
            allergens: p.allergens ?? '',
            serving_size: p.serving_size ?? '',
            spice_level: p.spice_level ?? '',
            weight: p.weight ?? '',
            shelf_life: p.shelf_life ?? '',
            available_as: p.available_as ?? '',
            cooking_charges: p.cooking_charges ?? ''
        })
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!form.name || !form.category_id || !form.price) {
            toast.error('Name, category, and price are required')
            return
        }
        setSaving(true)
        try {
            if (editProduct) {
                await updateProduct(editProduct.id, form)
                toast.success('Product updated')
            } else {
                await createProduct(form)
                toast.success('Product created')
            }
            setShowModal(false)
            fetchAll()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Save failed')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this product?')) return
        try {
            await deleteProduct(id)
            toast.success('Product deleted')
            fetchAll()
        } catch {
            toast.error('Delete failed')
        }
    }

    return (
        <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="font-bold text-2xl" style={{ color: 'var(--text-main)' }}>Menu</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {filteredProducts.length} products found
                    </p>
                </div>
                <button onClick={openAdd} className="btn-primary self-start sm:self-auto">
                    <FiPlus size={16} /> Add Product
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        className="form-input pr-9"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <FiSearch size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
            </div>

            {/* Mobile Product Cards */}
            <div className="sm:hidden space-y-3">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="card p-4 animate-pulse">
                            <div className="flex gap-3">
                                <div className="skeleton w-14 h-14 rounded-[7px] shrink-0" />
                                <div className="flex-1">
                                    <div className="skeleton h-4 w-2/3 rounded-[7px] mb-2" />
                                    <div className="skeleton h-3 w-1/2 rounded-[7px] mb-2" />
                                    <div className="skeleton h-3 w-1/3 rounded-[7px]" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : filteredProducts.length === 0 ? (
                    <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                        No products match your search
                    </div>
                ) : filteredProducts.map((p) => {
                    const imgUrl = p.image
                        ? (p.image.startsWith('/uploads') ? `${BACKEND_URL}${p.image}` : p.image)
                        : null
                    return (
                        <div key={p.id} className="card p-4">
                            <div className="flex gap-3 items-start">
                                <div
                                    className="w-14 h-14 rounded-[7px] overflow-hidden shrink-0"
                                    style={{ background: 'var(--primary-glow)' }}
                                >
                                    {imgUrl
                                        ? <img src={imgUrl} alt={p.name} className="w-full h-full object-cover" />
                                        : <div className="w-full h-full flex items-center justify-center text-gray-400"><FiImage size={24} /></div>
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-main)' }}>
                                        {p.name}
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                        {p.category?.name || 'No category'}
                                    </p>
                                    <p className="font-bold text-sm mt-1" style={{ color: 'var(--primary)' }}>
                                        Rs. {parseFloat(p.price).toLocaleString()}
                                    </p>
                                    <div className="flex gap-2 mt-1">
                                        {p.hot_selling && (
                                            <span className="text-xs px-2 py-0.5 rounded-[7px] font-medium"
                                                style={{ background: 'rgba(217,119,6,0.1)', color: '#d97706' }}>
                                                Hot Selling
                                            </span>
                                        )}
                                        {!p.show_on_menu && (
                                            <span className="text-xs px-2 py-0.5 rounded-[7px]"
                                                style={{ background: 'rgba(0,0,0,0.1)', color: 'var(--text-muted)' }}>
                                                Hidden
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                    <button onClick={() => openEdit(p)}
                                        className="w-8 h-8 rounded-[7px] flex items-center justify-center"
                                        style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                        <FiEdit2 size={13} />
                                    </button>
                                    <button onClick={() => handleDelete(p.id)}
                                        className="w-8 h-8 rounded-[7px] flex items-center justify-center"
                                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                        <FiTrash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block card overflow-hidden">
                <div className="admin-table-wrapper">
                    <table className="w-full" style={{ minWidth: '680px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                {['Image', 'Name', 'Category', 'Price', 'Hot', 'Menu', 'Actions'].map((h) => (
                                    <th key={h}
                                        className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                                        style={{ color: 'var(--text-muted)' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        {Array(7).fill(0).map((_, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="skeleton h-4 rounded-[7px]" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                                        No products match your search
                                    </td>
                                </tr>
                            ) : filteredProducts.map((p) => {
                                const imgUrl = p.image
                                    ? (p.image.startsWith('/uploads') ? `${BACKEND_URL}${p.image}` : p.image)
                                    : null
                                return (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}
                                        className="transition-colors"
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-glow)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td className="px-4 py-3">
                                            <div className="w-10 h-10 rounded-[7px] overflow-hidden"
                                                style={{ background: 'var(--primary-glow)' }}>
                                                {imgUrl
                                                    ? <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                                    : <div className="w-full h-full flex items-center justify-center text-gray-400"><FiImage size={20} /></div>
                                                }
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-sm" style={{ color: 'var(--text-main)' }}>
                                            {p.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                                            {p.category?.name || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                                            Rs. {parseFloat(p.price).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: p.hot_selling ? '#d97706' : 'var(--text-muted)' }}>
                                            {p.hot_selling ? 'Yes' : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: p.show_on_menu ? '#059669' : '#dc2626' }}>
                                            {p.show_on_menu ? 'Visible' : 'Hidden'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => openEdit(p)}
                                                    className="w-8 h-8 rounded-[7px] flex items-center justify-center transition-all hover:scale-110"
                                                    style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                                    <FiEdit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(p.id)}
                                                    className="w-8 h-8 rounded-[7px] flex items-center justify-center transition-all hover:scale-110"
                                                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

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
                            className="w-full sm:max-w-lg rounded-[7px]-t-[7px] sm:rounded-[7px] overflow-hidden"
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
                            <div className="flex items-center justify-between p-5 border-b"
                                style={{ borderColor: 'var(--border)' }}>
                                <h2 className="font-bold text-lg" style={{ color: 'var(--text-main)' }}>
                                    {editProduct ? 'Edit Product' : 'Add Product'}
                                </h2>
                                <button onClick={() => setShowModal(false)}
                                    className="w-8 h-8 rounded-[7px] flex items-center justify-center"
                                    style={{ color: 'var(--text-muted)', background: 'var(--bg-deep)' }}>
                                    <FiX size={16} />
                                </button>
                            </div>

                            <div className="p-5 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: '65vh' }}>

                                <div>
                                    <label className="form-label">Product Name *</label>
                                    <input
                                        className="form-input"
                                        placeholder="Product name"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="form-label">Category *</label>
                                        <select
                                            className="form-input"
                                            value={form.category_id}
                                            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                                        >
                                            <option value="">Select</option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Price (Rs.) *</label>
                                        <input
                                            className="form-input"
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="0"
                                            value={form.price}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9.]/g, '')
                                                setForm({ ...form, price: val })
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        placeholder="Product description..."
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Image URL (Cloudinary Link)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Paste Cloudinary or any direct image URL..."
                                        value={form.image}
                                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Long Description (Product Details Tab)</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        placeholder="Detailed product description..."
                                        value={form.long_description}
                                        onChange={(e) => setForm({ ...form, long_description: e.target.value })}
                                    />
                                </div>

                                {/* ── Additional Information ── */}
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Additional Information</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="form-label">Serving Size <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(persons)</span></label>
                                        <input
                                            className="form-input"
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="e.g. 2"
                                            value={form.serving_size}
                                            onChange={(e) => setForm({ ...form, serving_size: e.target.value.replace(/[^0-9]/g, '') })}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Spice Level</label>
                                        <select
                                            className="form-input"
                                            value={form.spice_level}
                                            onChange={(e) => setForm({ ...form, spice_level: e.target.value })}
                                        >
                                            <option value="">Select</option>
                                            <option value="Low">Low</option>
                                            <option value="Normal">Normal</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="form-label">Weight <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(gm)</span></label>
                                        <input
                                            className="form-input"
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="e.g. 500"
                                            value={form.weight}
                                            onChange={(e) => setForm({ ...form, weight: e.target.value.replace(/[^0-9]/g, '') })}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Shelf Life <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(days)</span></label>
                                        <input
                                            className="form-input"
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="e.g. 30"
                                            value={form.shelf_life}
                                            onChange={(e) => setForm({ ...form, shelf_life: e.target.value.replace(/[^0-9]/g, '') })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="form-label">Available As</label>
                                        <select
                                            className="form-input"
                                            value={form.available_as}
                                            onChange={(e) => setForm({ ...form, available_as: e.target.value })}
                                        >
                                            <option value="">Select</option>
                                            <option value="Cooked">Cooked</option>
                                            <option value="Frozen">Frozen</option>
                                            <option value="Frozen & Cooked">Frozen &amp; Cooked</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Cooking Charges <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Rs.)</span></label>
                                        <input
                                            className="form-input"
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="e.g. 100"
                                            value={form.cooking_charges}
                                            onChange={(e) => setForm({ ...form, cooking_charges: e.target.value.replace(/[^0-9]/g, '') })}
                                        />
                                    </div>
                                </div>



                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.hot_selling}
                                            onChange={(e) => setForm({ ...form, hot_selling: e.target.checked })}
                                            className="accent-red-500 w-4 h-4"
                                        />
                                        <span className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                                            Hot Selling
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.show_on_menu}
                                            onChange={(e) => setForm({ ...form, show_on_menu: e.target.checked })}
                                            className="accent-red-500 w-4 h-4"
                                        />
                                        <span className="text-sm" style={{ color: 'var(--text-main)' }}>
                                            Show on Menu
                                        </span>
                                    </label>
                                </div>

                            </div>

                            <div className="p-5 flex gap-3 border-t" style={{ borderColor: 'var(--border)' }}>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="btn-outline flex-1 justify-center py-2.5"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="btn-primary flex-1 justify-center py-2.5"
                                >
                                    {saving ? (
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-[7px] animate-spin" />
                                    ) : (
                                        editProduct ? 'Update Product' : 'Save Product'
                                    )}
                                </button>
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}

export default AdminMenu