import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
    FiDollarSign, FiPlus, FiTrash2, FiSave, FiEdit3,
    FiActivity, FiPieChart, FiTrendingUp, FiShoppingBag, FiInfo
} from 'react-icons/fi';
import { getProducts } from '../../api/products';
import { getCosting, upsertCosting } from '../../api/costings';

const AdminCosting = () => {
    const [products, setProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingCosting, setLoadingCosting] = useState(false);
    const [saving, setSaving] = useState(false);

    // Costing Form State
    const [ingredients, setIngredients] = useState([]);

    // Fetch all products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await getProducts();
                setProducts(res.data.data || []);
            } catch (err) {
                toast.error('Failed to load menu items.');
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchProducts();
    }, []);

    // Get active product details
    const selectedProduct = useMemo(() => {
        return products.find(p => String(p.id) === String(selectedProductId)) || null;
    }, [products, selectedProductId]);

    // Fetch costing for selected product
    useEffect(() => {
        if (!selectedProductId) {
            setIngredients([]);
            return;
        }

        const fetchCostingData = async () => {
            setLoadingCosting(true);
            try {
                const res = await getCosting(selectedProductId);
                if (res.data.success && res.data.data) {
                    const costing = res.data.data;
                    let parsedIngredients = [];
                    if (typeof costing.ingredients === 'string') {
                        try {
                            parsedIngredients = JSON.parse(costing.ingredients);
                        } catch {
                            parsedIngredients = [];
                        }
                    } else if (Array.isArray(costing.ingredients)) {
                        parsedIngredients = costing.ingredients;
                    }
                    // Ensure every ingredient has a unique key for list rendering
                    setIngredients(parsedIngredients.map((ing, index) => ({
                        ...ing,
                        tempId: Date.now() + index + Math.random()
                    })));
                } else {
                    setIngredients([]);
                }
            } catch (err) {
                toast.error('Failed to load costing record.');
                setIngredients([]);
            } finally {
                setLoadingCosting(false);
            }
        };
        fetchCostingData();
    }, [selectedProductId]);

    // Add new ingredient row
    const handleAddIngredient = () => {
        setIngredients(prev => [
            ...prev,
            { tempId: Date.now() + Math.random(), name: '', quantity: 1, cost: 0 }
        ]);
    };

    // Update ingredient row field
    const handleUpdateIngredient = (tempId, field, value) => {
        setIngredients(prev => prev.map(ing => {
            if (ing.tempId === tempId) {
                let updatedValue = value;
                if (field === 'quantity') {
                    updatedValue = value === '' ? '' : parseFloat(value) || 0;
                } else if (field === 'cost') {
                    updatedValue = value === '' ? '' : parseFloat(value) || 0;
                }
                return { ...ing, [field]: updatedValue };
            }
            return ing;
        }));
    };

    // Delete ingredient row
    const handleDeleteIngredient = (tempId) => {
        setIngredients(prev => prev.filter(ing => ing.tempId !== tempId));
    };

    // Real-time calculations
    const totals = useMemo(() => {
        let totalCost = 0;
        let totalQty = 0;

        ingredients.forEach(ing => {
            const qty = Number(ing.quantity || 0);
            const cost = Number(ing.cost || 0);
            totalCost += qty * cost;
            totalQty += qty;
        });

        const sellingPrice = selectedProduct ? parseFloat(selectedProduct.price) : 0;
        const profitAmount = sellingPrice - totalCost;
        const profitMargin = sellingPrice > 0 ? (profitAmount / sellingPrice) * 100 : 0;

        return {
            totalCost,
            totalQty,
            sellingPrice,
            profitAmount,
            profitMargin
        };
    }, [ingredients, selectedProduct]);

    // Save Costing configuration to permanent storage
    const handleSaveCosting = async () => {
        if (!selectedProductId) return;

        // Validation
        const validIngredients = ingredients.filter(ing => ing.name.trim() !== '');
        if (validIngredients.length === 0 && ingredients.length > 0) {
            toast.error('Please enter a name for at least one ingredient.');
            return;
        }

        setSaving(true);
        try {
            // Clean ingredients array for API storage
            const cleanIngredients = validIngredients.map(({ name, quantity, cost }) => ({
                name: name.trim(),
                quantity: parseFloat(quantity) || 0,
                cost: parseFloat(cost) || 0
            }));

            const payload = {
                ingredients: cleanIngredients,
                total_cost: totals.totalCost
            };

            const res = await upsertCosting(selectedProductId, payload);
            if (res.data.success) {
                toast.success('Food Costing configuration saved permanently!');
            } else {
                toast.error(res.data.message || 'Failed to save configuration.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not save changes.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }} className="admin-page-wrapper page-enter">

            {/* Page Title */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Food Cost & Profit Management
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
                    Analyze costs, manage ingredient profiles, and optimize profit margins per menu item.
                </p>
            </div>

            {/* Step 1: Select Product */}
            <div className="card p-5 mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <FiShoppingBag size={18} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>Select Menu Item</span>
                </div>

                {loadingProducts ? (
                    <div className="skeleton h-10 w-full rounded-[7px]" />
                ) : (
                    <select
                        className="form-input input-field"
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        style={{ cursor: 'pointer', maxWidth: '400px' }}
                    >
                        <option value="">-- Choose a Food Item --</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} (Rs. {parseFloat(p.price).toLocaleString()})
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {selectedProduct ? (
                <div>
                    {/* Step 2: Cost & Profit Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>

                        {/* Selling Price */}
                        <div className="card p-4" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div className="w-12 h-12 rounded-[7px] flex items-center justify-center text-xl shrink-0"
                                style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                                Rs.
                            </div>
                            <div>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Selling Price</p>
                                <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                                    Rs. {totals.sellingPrice.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Production Cost */}
                        <div className="card p-4" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div className="w-12 h-12 rounded-[7px] flex items-center justify-center text-xl shrink-0"
                                style={{ background: 'rgba(217, 119, 6, 0.12)', color: '#d97706' }}>
                                <FiActivity />
                            </div>
                            <div>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Production Cost</p>
                                <p style={{ fontSize: 20, fontWeight: 800, color: '#d97706', margin: 0 }}>
                                    Rs. {totals.totalCost.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Profit Amount */}
                        <div className="card p-4" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div className="w-12 h-12 rounded-[7px] flex items-center justify-center text-xl shrink-0"
                                style={{
                                    background: totals.profitAmount >= 0 ? 'rgba(5, 150, 105, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                                    color: totals.profitAmount >= 0 ? '#059669' : '#dc2626'
                                }}>
                                <FiDollarSign />
                            </div>
                            <div>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Net Profit</p>
                                <p style={{
                                    fontSize: 20,
                                    fontWeight: 800,
                                    color: totals.profitAmount >= 0 ? '#059669' : '#dc2626',
                                    margin: 0
                                }}>
                                    Rs. {totals.profitAmount.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Profit Margin */}
                        <div className="card p-4" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div className="w-12 h-12 rounded-[7px] flex items-center justify-center text-xl shrink-0"
                                style={{
                                    background: totals.profitMargin >= 30 ? 'rgba(5, 150, 105, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                                    color: totals.profitMargin >= 30 ? '#059669' : '#d97706'
                                }}>
                                <FiTrendingUp />
                            </div>
                            <div>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Profit Margin</p>
                                <p style={{
                                    fontSize: 20,
                                    fontWeight: 800,
                                    color: totals.profitMargin >= 30 ? '#059669' : '#d97706',
                                    margin: 0
                                }}>
                                    {totals.profitMargin.toFixed(1)}%
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Step 3: Ingredients Input Table */}
                    <div className="card p-5 sm:p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FiPieChart size={18} style={{ color: 'var(--primary)' }} />
                                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
                                    Recipe Ingredients & Components ({ingredients.length})
                                </span>
                            </div>
                            <button onClick={handleAddIngredient} className="btn-primary flex items-center gap-1 text-xs py-2 px-4 rounded-[7px]">
                                <FiPlus size={14} /> Add Ingredient
                            </button>
                        </div>

                        {loadingCosting ? (
                            <div style={{ padding: '30px 0' }} className="space-y-3">
                                <div className="skeleton h-10 w-full rounded-[7px]" />
                                <div className="skeleton h-10 w-full rounded-[7px]" />
                                <div className="skeleton h-10 w-full rounded-[7px]" />
                            </div>
                        ) : ingredients.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--bg-deep)', borderRadius: '7px', border: '1px dashed var(--border)' }}>
                                <FiInfo size={32} style={{ color: 'var(--text-muted)', marginBottom: 8, opacity: 0.6 }} />
                                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                                    No ingredients added yet for this item. Click "Add Ingredient" to start calculations!
                                </p>
                            </div>
                        ) : (
                            <div className="admin-table-wrapper" style={{ marginBottom: 20 }}>
                                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                            <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Title</th>
                                            <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', width: '120px' }}>Quantity</th>
                                            <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', width: '150px' }}>Unit Cost (Rs.)</th>
                                            <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', width: '150px', textAlign: 'right' }}>Total (Rs.)</th>
                                            <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', width: '80px', textAlign: 'center' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ingredients.map((ing) => {
                                            const lineTotal = Number(ing.quantity || 0) * Number(ing.cost || 0);
                                            return (
                                                <tr key={ing.tempId} style={{ borderBottom: '1px solid var(--border)' }} className="transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                                                    <td style={{ padding: '10px 8px' }}>
                                                        <input
                                                            type="text"
                                                            className="form-input input-field"
                                                            placeholder="e.g. Chicken, Sauce, Packaging..."
                                                            value={ing.name}
                                                            onChange={(e) => handleUpdateIngredient(ing.tempId, 'name', e.target.value)}
                                                            style={{ padding: '8px 12px', borderRadius: '7px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '10px 8px' }}>
                                                        <input
                                                            type="number"
                                                            className="form-input input-field"
                                                            min="0"
                                                            step="any"
                                                            placeholder="0"
                                                            value={ing.quantity}
                                                            onChange={(e) => handleUpdateIngredient(ing.tempId, 'quantity', e.target.value)}
                                                            style={{ padding: '8px 12px', borderRadius: '7px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '10px 8px' }}>
                                                        <input
                                                            type="number"
                                                            className="form-input input-field"
                                                            min="0"
                                                            step="any"
                                                            placeholder="0"
                                                            value={ing.cost}
                                                            onChange={(e) => handleUpdateIngredient(ing.tempId, 'cost', e.target.value)}
                                                            style={{ padding: '8px 12px', borderRadius: '7px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                                                        Rs. {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                                        <button
                                                            onClick={() => handleDeleteIngredient(ing.tempId)}
                                                            style={{
                                                                background: 'rgba(239, 68, 68, 0.1)',
                                                                color: '#ef4444',
                                                                border: 'none',
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '7px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                transition: 'transform 0.2s'
                                                            }}
                                                            className="hover:scale-110"
                                                            title="Delete Ingredient"
                                                        >
                                                            <FiTrash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Save Button & Dynamic Totals Bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                <strong>Calculated production metrics:</strong> Total Quantity Used: <strong>{totals.totalQty.toFixed(2)} units</strong>.
                            </div>
                            <button
                                onClick={handleSaveCosting}
                                disabled={saving || loadingCosting}
                                className="btn-primary flex items-center gap-2 py-3 px-6 rounded-[7px]"
                            >
                                {saving ? (
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-[7px] animate-spin" />
                                ) : (
                                    <><FiSave size={16} /> Save Costing Profile</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                    Please select a menu item above to calculate and analyze costing configurations.
                </div>
            )}
        </div>
    );
};

export default AdminCosting;