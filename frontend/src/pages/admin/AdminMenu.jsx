import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUpload, FiImage } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../api/products'
import { getCategories } from '../../api/categories'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const emptyForm = { name: '', category_id: '', price: '', description: '', image: '', hot_selling: false, show_on_menu: true }

const AdminMenu = () => {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editProduct, setEditProduct] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [imageFile, setImageFile] = useState(null)
    const [saving, setSaving] = useState(false)

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
        setImageFile(null)
        setShowModal(true)
    }

    const openEdit = (p) => {
        setEditProduct(p)
        setForm({
            name: p.name,
            category_id: p.category_id,
            price: p.price,
            description: p.description || '',
            image: p.image || '',
            hot_selling: p.hot_selling,
            show_on_menu: p.show_on_menu
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
                        {products.length} products
                    </p>
                </div>
                <button onClick={openAdd} className="btn-primary self-start sm:self-auto">
                    <FiPlus size={16} /> Add Product
                </button>
            </div>

            {/* Mobile Product Cards */}
            <div className="sm:hidden space-y-3">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="card p-4 animate-pulse">
                            <div className="flex gap-3">
                                <div className="skeleton w-14 h-14 rounded-xl shrink-0" />
                                <div className="flex-1">
                                    <div className="skeleton h-4 w-2/3 rounded mb-2" />
                                    <div className="skeleton h-3 w-1/2 rounded mb-2" />
                                    <div className="skeleton h-3 w-1/3 rounded" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : products.length === 0 ? (
                    <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                        No products yet
                    </div>
                ) : products.map((p) => {
                    const imgUrl = p.image
                        ? (p.image.startsWith('/uploads') ? `${BACKEND_URL}${p.image}` : p.image)
                        : null
                    return (
                        <div key={p.id} className="card p-4">
                            <div className="flex gap-3 items-start">
                                <div
                                    className="w-14 h-14 rounded-xl overflow-hidden shrink-0"
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
                                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                                style={{ background: 'rgba(217,119,6,0.1)', color: '#d97706' }}>
                                                Hot Selling
                                            </span>
                                        )}
                                        {!p.show_on_menu && (
                                            <span className="text-xs px-2 py-0.5 rounded-full"
                                                style={{ background: 'rgba(0,0,0,0.1)', color: 'var(--text-muted)' }}>
                                                Hidden
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                    <button onClick={() => openEdit(p)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                        <FiEdit2 size={13} />
                                    </button>
                                    <button onClick={() => handleDelete(p.id)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
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
                                                <div className="skeleton h-4 rounded" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                                        No products yet
                                    </td>
                                </tr>
                            ) : products.map((p) => {
                                const imgUrl = p.image
                                    ? (p.image.startsWith('/uploads') ? `${BACKEND_URL}${p.image}` : p.image)
                                    : null
                                return (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}
                                        className="transition-colors hover:bg-red-50 dark:hover:bg-red-900/10">
                                        <td className="px-4 py-3">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden"
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
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                                                    style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                                    <FiEdit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(p.id)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
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
                            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden"
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
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
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
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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