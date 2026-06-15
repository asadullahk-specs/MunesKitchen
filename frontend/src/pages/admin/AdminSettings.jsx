import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiTruck, FiGrid, FiDollarSign, FiBookOpen, FiXCircle } from 'react-icons/fi';
import { getDeliveryAreas, createDeliveryArea, updateDeliveryArea, deleteDeliveryArea } from '../../api/delivery';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/categories';
import { getExpenseCategories, createExpenseCategory, updateExpenseCategory, deleteExpenseCategory } from '../../api/expenses';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../../api/subjects';
import { getCancelReasons, createCancelReason, updateCancelReason, deleteCancelReason } from '../../api/cancelReasons';

const AdminSettings = () => {
    const [activeTab, setActiveTab] = useState('delivery'); // delivery, food_cats, expense_cats, subjects, cancel_reasons
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Data States
    const [deliveryAreas, setDeliveryAreas] = useState([]);
    const [foodCategories, setFoodCategories] = useState([]);
    const [expenseCategories, setExpenseCategories] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [cancelReasons, setCancelReasons] = useState([]);

    // Form States
    const [deliveryForm, setDeliveryForm] = useState({ id: null, name: '', charge: '' });
    const [foodForm, setFoodForm] = useState({ id: null, name: '' });
    const [expenseForm, setExpenseForm] = useState({ id: null, name: '', color: '#ef4444' });
    const [subjectForm, setSubjectForm] = useState({ id: null, name: '' });
    const [cancelReasonForm, setCancelReasonForm] = useState({ id: null, name: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [delRes, foodRes, expRes, subRes, reasonRes] = await Promise.all([
                getDeliveryAreas(),
                getCategories(),
                getExpenseCategories(),
                getSubjects(),
                getCancelReasons()
            ]);

            setDeliveryAreas(delRes.data.areas || []);
            setFoodCategories(foodRes.data.data || []);
            setExpenseCategories(expRes.data.categories || []);
            setSubjects(subRes.data.subjects || []);
            setCancelReasons(reasonRes.data.reasons || []);
        } catch (err) {
            toast.error('Failed to load settings data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ── Delivery Areas Handlers ──────────────────────────────────────────────
    const handleDeliverySubmit = async (e) => {
        e.preventDefault();
        if (!deliveryForm.name.trim()) { toast.error('Name is required'); return; }

        const rawCharge = String(deliveryForm.charge).trim();
        const chargeValue = rawCharge === '' ? 0 : Number(rawCharge);
        if (isNaN(chargeValue)) { toast.error('Delivery charge must be a valid number'); return; }
        if (chargeValue < 0 || chargeValue > 5000) {
            toast.error('Delivery charge must be between 0 and 5000');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name: deliveryForm.name.trim(),
                charge: chargeValue
            };

            console.log('Saving delivery area:', payload);

            if (deliveryForm.id) {
                await updateDeliveryArea(deliveryForm.id, payload);
                toast.success('Delivery area updated successfully');
            } else {
                await createDeliveryArea(payload);
                toast.success('Delivery area created successfully');
            }
            setDeliveryForm({ id: null, name: '', charge: '' });
            fetchData();
        } catch (err) {
            console.error("Save Area Error:", err);
            toast.error(err.response?.data?.message || 'Failed to save delivery area');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeliveryDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this delivery area?')) return;
        try {
            await deleteDeliveryArea(id);
            toast.success('Delivery area deleted');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete delivery area');
        }
    };

    // ── Food Categories Handlers ─────────────────────────────────────────────
    const handleFoodSubmit = async (e) => {
        e.preventDefault();
        if (!foodForm.name.trim()) { toast.error('Name is required'); return; }

        setSubmitting(true);
        try {
            const payload = {
                name: foodForm.name.trim()
            };

            if (foodForm.id) {
                await updateCategory(foodForm.id, payload);
                toast.success('Food category updated successfully');
            } else {
                await createCategory(payload);
                toast.success('Food category created successfully');
            }
            setFoodForm({ id: null, name: '' });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save food category');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFoodDelete = async (id) => {
        if (!window.confirm('Delete this food category? This will not delete products under it.')) return;
        try {
            await deleteCategory(id);
            toast.success('Food category deleted');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete food category');
        }
    };

    // ── Expense Categories Handlers ──────────────────────────────────────────
    const handleExpenseSubmit = async (e) => {
        e.preventDefault();
        if (!expenseForm.name.trim()) { toast.error('Name is required'); return; }

        setSubmitting(true);
        try {
            const payload = {
                name: expenseForm.name.trim(),
                color: expenseForm.color
            };

            if (expenseForm.id) {
                await updateExpenseCategory(expenseForm.id, payload);
                toast.success('Expense category updated successfully');
            } else {
                await createExpenseCategory(payload);
                toast.success('Expense category created successfully');
            }
            setExpenseForm({ id: null, name: '', color: '#ef4444' });
            fetchData();
        } catch (err) {
            console.error("Save Expense Cat Error:", err);
            toast.error(err.response?.data?.message || 'Failed to save expense category');
        } finally {
            setSubmitting(false);
        }
    };

    const handleExpenseDelete = async (id) => {
        if (!window.confirm('Delete this expense category?')) return;
        try {
            await deleteExpenseCategory(id);
            toast.success('Expense category deleted');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete expense category');
        }
    };

    // ── Contact Subjects Handlers ─────────────────────────────────────────────
    const handleSubjectSubmit = async (e) => {
        e.preventDefault();
        if (!subjectForm.name.trim()) { toast.error('Name is required'); return; }

        setSubmitting(true);
        try {
            const payload = {
                name: subjectForm.name.trim()
            };

            if (subjectForm.id) {
                await updateSubject(subjectForm.id, payload);
                toast.success('Contact subject updated successfully');
            } else {
                await createSubject(payload);
                toast.success('Contact subject created successfully');
            }
            setSubjectForm({ id: null, name: '' });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save contact subject');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubjectDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this contact subject?')) return;
        try {
            await deleteSubject(id);
            toast.success('Contact subject deleted');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete contact subject');
        }
    };

    // ── Cancel Reasons Handlers ──────────────────────────────────────────────
    const handleCancelReasonSubmit = async (e) => {
        e.preventDefault();
        if (!cancelReasonForm.name.trim()) { toast.error('Name is required'); return; }

        setSubmitting(true);
        try {
            const payload = {
                name: cancelReasonForm.name.trim()
            };

            if (cancelReasonForm.id) {
                await updateCancelReason(cancelReasonForm.id, payload);
                toast.success('Cancel reason updated successfully');
            } else {
                await createCancelReason(payload);
                toast.success('Cancel reason created successfully');
            }
            setCancelReasonForm({ id: null, name: '' });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save cancel reason');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelReasonDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this cancel reason?')) return;
        try {
            await deleteCancelReason(id);
            toast.success('Cancel reason deleted');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete cancel reason');
        }
    };

    return (
        <div style={{ width: '100%', fontFamily: 'Poppins, sans-serif' }}>
            {/* Header */}
            <div className="mb-6">
                <h1 className="font-bold text-2xl" style={{ color: 'var(--text-main)' }}>System Settings</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    Manage Delivery Areas, Food Categories, Expense Categories, Contact Subjects, and Cancel Reasons
                </p>
            </div>

            {/* Tab Controls */}
            <div className="card p-4 mb-6">
                <div className="flex flex-wrap gap-2">
                    {[
                        { id: 'delivery', label: 'Delivery Areas', icon: FiTruck },
                        { id: 'food_cats', label: 'Food Categories', icon: FiGrid },
                        { id: 'expense_cats', label: 'Expense Categories', icon: FiDollarSign },
                        { id: 'subjects', label: 'Contact Subjects', icon: FiBookOpen },
                        { id: 'cancel_reasons', label: 'Cancel Reasons', icon: FiXCircle }
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="flex items-center gap-2 px-5 py-3 text-xs font-semibold rounded-[7px] transition-all"
                                style={{
                                    background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                                    color: activeTab === tab.id ? '#ffffff' : 'var(--text-muted)',
                                    border: activeTab === tab.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                                }}
                            >
                                <Icon size={14} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {loading ? (
                <div className="card p-8 flex justify-center items-center">
                    <div className="w-8 h-8 border-4 border-t-transparent rounded-[7px] animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Form Area */}
                    <div className="lg:col-span-1">
                        {activeTab === 'delivery' && (
                            <div className="card p-5">
                                <h3 className="font-bold text-base mb-4" style={{ color: 'var(--text-main)' }}>
                                    {deliveryForm.id ? 'Edit Delivery Area' : 'Add Delivery Area'}
                                </h3>
                                <form onSubmit={handleDeliverySubmit} className="space-y-4">
                                    <div>
                                        <label className="form-label">Area Name *</label>
                                        <input
                                            className="form-input"
                                            placeholder="e.g. Gulberg III"
                                            value={deliveryForm.name}
                                            onChange={(e) => setDeliveryForm({ ...deliveryForm, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Delivery Charge (Rs.)</label>
                                        <input
                                            className="form-input"
                                            type="number"
                                            placeholder="e.g. 50"
                                            value={deliveryForm.charge}
                                            onChange={(e) => setDeliveryForm({ ...deliveryForm, charge: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                                            {submitting ? 'Saving...' : deliveryForm.id ? 'Update Area' : 'Add Area'}
                                        </button>
                                        {deliveryForm.id && (
                                            <button
                                                type="button"
                                                onClick={() => setDeliveryForm({ id: null, name: '', charge: '' })}
                                                className="px-4 py-2 rounded-[7px] border border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 transition-all text-xs"
                                                style={{ color: 'var(--text-main)' }}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'food_cats' && (
                            <div className="card p-5">
                                <h3 className="font-bold text-base mb-4" style={{ color: 'var(--text-main)' }}>
                                    {foodForm.id ? 'Edit Food Category' : 'Add Food Category'}
                                </h3>
                                <form onSubmit={handleFoodSubmit} className="space-y-4">
                                    <div>
                                        <label className="form-label">Category Name *</label>
                                        <input
                                            className="form-input"
                                            placeholder="e.g. Rolls"
                                            value={foodForm.name}
                                            onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                                            {submitting ? 'Saving...' : foodForm.id ? 'Update Category' : 'Add Category'}
                                        </button>
                                        {foodForm.id && (
                                            <button
                                                type="button"
                                                onClick={() => setFoodForm({ id: null, name: '' })}
                                                className="px-4 py-2 rounded-[7px] border border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 transition-all text-xs"
                                                style={{ color: 'var(--text-main)' }}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'expense_cats' && (
                            <div className="card p-5">
                                <h3 className="font-bold text-base mb-4" style={{ color: 'var(--text-main)' }}>
                                    {expenseForm.id ? 'Edit Expense Category' : 'Add Expense Category'}
                                </h3>
                                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                                    <div>
                                        <label className="form-label">Category Name *</label>
                                        <input
                                            className="form-input"
                                            placeholder="e.g. Marketing"
                                            value={expenseForm.name}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Theme Color</label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="color"
                                                className="w-10 h-10 border-0 rounded-[7px] cursor-pointer"
                                                value={expenseForm.color}
                                                onChange={(e) => setExpenseForm({ ...expenseForm, color: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                className="form-input flex-1"
                                                value={expenseForm.color}
                                                onChange={(e) => setExpenseForm({ ...expenseForm, color: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                                            {submitting ? 'Saving...' : expenseForm.id ? 'Update Category' : 'Add Category'}
                                        </button>
                                        {expenseForm.id && (
                                            <button
                                                type="button"
                                                onClick={() => setExpenseForm({ id: null, name: '', color: '#ef4444' })}
                                                className="px-4 py-2 rounded-[7px] border border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 transition-all text-xs"
                                                style={{ color: 'var(--text-main)' }}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'subjects' && (
                            <div className="card p-5">
                                <h3 className="font-bold text-base mb-4" style={{ color: 'var(--text-main)' }}>
                                    {subjectForm.id ? 'Edit Subject' : 'Add Subject'}
                                </h3>
                                <form onSubmit={handleSubjectSubmit} className="space-y-4">
                                    <div>
                                        <label className="form-label">Subject Name *</label>
                                        <input
                                            className="form-input"
                                            placeholder="e.g. Catering Request"
                                            value={subjectForm.name}
                                            onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                                            {submitting ? 'Saving...' : subjectForm.id ? 'Update Subject' : 'Add Subject'}
                                        </button>
                                        {subjectForm.id && (
                                            <button
                                                type="button"
                                                onClick={() => setSubjectForm({ id: null, name: '' })}
                                                className="px-4 py-2 rounded-[7px] border border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 transition-all text-xs"
                                                style={{ color: 'var(--text-main)' }}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'cancel_reasons' && (
                            <div className="card p-5">
                                <h3 className="font-bold text-base mb-4" style={{ color: 'var(--text-main)' }}>
                                    {cancelReasonForm.id ? 'Edit Reason' : 'Add Cancel Reason'}
                                </h3>
                                <form onSubmit={handleCancelReasonSubmit} className="space-y-4">
                                    <div>
                                        <label className="form-label">Reason Name *</label>
                                        <input
                                            className="form-input"
                                            placeholder="e.g. Changed my mind"
                                            value={cancelReasonForm.name}
                                            onChange={(e) => setCancelReasonForm({ ...cancelReasonForm, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                                            {submitting ? 'Saving...' : cancelReasonForm.id ? 'Update Reason' : 'Add Reason'}
                                        </button>
                                        {cancelReasonForm.id && (
                                            <button
                                                type="button"
                                                onClick={() => setCancelReasonForm({ id: null, name: '' })}
                                                className="px-4 py-2 rounded-[7px] border border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 transition-all text-xs"
                                                style={{ color: 'var(--text-main)' }}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Right Listing Area */}
                    <div className="lg:col-span-2 space-y-4">
                        {activeTab === 'delivery' && (
                            <div className="card overflow-hidden">
                                <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
                                    <h3 className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>Delivery Areas</h3>
                                    <span className="text-xs px-2.5 py-1 rounded-[7px] font-semibold" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                                        {deliveryAreas.length} Total
                                    </span>
                                </div>
                                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                    {deliveryAreas.length === 0 ? (
                                        <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                                            No delivery areas configured
                                        </div>
                                    ) : (
                                        deliveryAreas.map((area) => (
                                            <div key={area.id || area._id} className="flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                <div>
                                                    <p className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>{area.name}</p>
                                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                        Delivery Fee: Rs. {Number(area.charge || 0).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setDeliveryForm({ id: area.id || area._id, name: area.name, charge: (area.charge !== undefined && area.charge !== null) ? String(area.charge) : '0' })}
                                                        className="p-2 rounded-[7px] transition-all hover:bg-emerald-500/10 text-emerald-500"
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeliveryDelete(area.id || area._id)}
                                                        className="p-2 rounded-[7px] transition-all hover:bg-red-500/10 text-red-500"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'food_cats' && (
                            <div className="card overflow-hidden">
                                <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
                                    <h3 className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>Food Categories</h3>
                                    <span className="text-xs px-2.5 py-1 rounded-[7px] font-semibold" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                                        {foodCategories.length} Total
                                    </span>
                                </div>
                                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                    {foodCategories.length === 0 ? (
                                        <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                                            No food categories configured
                                        </div>
                                    ) : (
                                        foodCategories.map((cat) => (
                                            <div key={cat.id || cat._id} className="flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <p className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>{cat.name}</p>
                                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                            Slug: {cat.slug} · Products: {cat.products?.length || 0}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setFoodForm({ id: cat.id || cat._id, name: cat.name })}
                                                        className="p-2 rounded-[7px] transition-all hover:bg-emerald-500/10 text-emerald-500"
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleFoodDelete(cat.id || cat._id)}
                                                        className="p-2 rounded-[7px] transition-all hover:bg-red-500/10 text-red-500"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'expense_cats' && (
                            <div className="card overflow-hidden">
                                <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
                                    <h3 className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>Expense Categories</h3>
                                    <span className="text-xs px-2.5 py-1 rounded-[7px] font-semibold" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                                        {expenseCategories.length} Total
                                    </span>
                                </div>
                                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                    {expenseCategories.length === 0 ? (
                                        <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                                            No expense categories configured
                                        </div>
                                    ) : (
                                        expenseCategories.map((cat) => (
                                            <div key={cat.id || cat._id} className="flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-4 h-4 rounded-[7px] border border-black/10 shrink-0" style={{ background: cat.color || '#ef4444' }} />
                                                    <div>
                                                        <p className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>{cat.name}</p>
                                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                            Color Code: <span className="font-mono">{cat.color || '#ef4444'}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setExpenseForm({ id: cat.id || cat._id, name: cat.name, color: cat.color || '#ef4444' })}
                                                        className="p-2 rounded-[7px] transition-all hover:bg-emerald-500/10 text-emerald-500"
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleExpenseDelete(cat.id || cat._id)}
                                                        className="p-2 rounded-[7px] transition-all hover:bg-red-500/10 text-red-500"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'subjects' && (
                            <div className="card overflow-hidden">
                                <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
                                    <h3 className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>Contact Subjects</h3>
                                    <span className="text-xs px-2.5 py-1 rounded-[7px] font-semibold" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                                        {subjects.length} Total
                                    </span>
                                </div>
                                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                    {subjects.length === 0 ? (
                                        <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                                            No contact subjects configured
                                        </div>
                                    ) : (
                                        subjects.map((sub) => (
                                            <div key={sub.id || sub._id} className="flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                <div>
                                                    <p className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>{sub.name}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setSubjectForm({ id: sub.id || sub._id, name: sub.name })}
                                                        className="p-2 rounded-[7px] transition-all hover:bg-emerald-500/10 text-emerald-500"
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleSubjectDelete(sub.id || sub._id)}
                                                        className="p-2 rounded-[7px] transition-all hover:bg-red-500/10 text-red-500"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'cancel_reasons' && (
                            <div className="card overflow-hidden">
                                <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
                                    <h3 className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>Cancel Reasons</h3>
                                    <span className="text-xs px-2.5 py-1 rounded-[7px] font-semibold" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                                        {cancelReasons.length} Total
                                    </span>
                                </div>
                                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                    {cancelReasons.length === 0 ? (
                                        <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                                            No cancel reasons configured
                                        </div>
                                    ) : (
                                        cancelReasons.map((reason) => (
                                            <div key={reason.id || reason._id} className="flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                <div>
                                                    <p className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>{reason.name}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setCancelReasonForm({ id: reason.id || reason._id, name: reason.name })}
                                                        className="p-2 rounded-[7px] transition-all hover:bg-emerald-500/10 text-emerald-500"
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelReasonDelete(reason.id || reason._id)}
                                                        className="p-2 rounded-[7px] transition-all hover:bg-red-500/10 text-red-500"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSettings;