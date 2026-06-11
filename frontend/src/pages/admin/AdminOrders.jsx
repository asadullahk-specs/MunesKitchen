import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiX, FiMapPin, FiPhone, FiMail, FiCheckSquare, FiTrash2, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getOrders, updateOrderStatus, deleteOrder } from '../../api/orders';

const STATUS_OPTIONS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'paid', 'cancelled'];
const STATUS_COLORS = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    preparing: '#8b5cf6',
    out_for_delivery: '#06b6d4',
    delivered: '#10b981',
    paid: '#059669',
    cancelled: '#ef4444',
};

const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day}/${month}/${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    // Track which order is clicked for showing delivery details and food prep items
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getOrders({ status: filter || undefined, page, limit: 10 });
            setOrders(res.data.data || []);
            setTotalPages(res.data.pages || 1);

            // Sync open modal reference data if states get auto-refreshed in background
            if (selectedOrder) {
                const updated = (res.data.data || []).find(o => o.id === selectedOrder.id);
                if (updated) setSelectedOrder(updated);
            }
        } catch {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    }, [filter, page, selectedOrder]);

    useEffect(() => { fetchOrders(); }, [filter, page]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            toast.success('Order status updated');
            fetchOrders();
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!confirm('Permanently delete this order? This cannot be undone.')) return;
        setDeletingId(orderId);
        try {
            await deleteOrder(orderId);
            toast.success('Order deleted');
            setSelectedOrder(null);
            fetchOrders();
        } catch {
            toast.error('Failed to delete order');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredOrders = orders.filter(o => {
        const q = searchQuery.toLowerCase();
        if (!q) return true;
        return (
            o.order_number?.toLowerCase().includes(q) ||
            o.customer?.full_name?.toLowerCase().includes(q) ||
            o.customer?.phone?.toLowerCase().includes(q) ||
            o.status?.toLowerCase().includes(q)
        );
    });

    return (
        <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="font-bold text-2xl" style={{ color: 'var(--text-main)' }}>Orders</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
                    </p>
                </div>
                <div className="relative w-full sm:w-72">
                    <input
                        type="text"
                        className="form-input pr-9 text-sm w-full"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <FiSearch size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center mb-5">
                <button
                    onClick={() => { setFilter(''); setPage(1); }}
                    className="px-3 py-1.5 rounded-[7px] text-sm font-medium transition-all"
                    style={{
                        background: !filter ? 'var(--primary)' : 'var(--bg-card)',
                        color: !filter ? 'white' : 'var(--text-muted)',
                        border: !filter ? 'none' : '1px solid var(--border)',
                    }}
                >
                    All
                </button>
                {STATUS_OPTIONS.map((s) => (
                    <button
                        key={s}
                        onClick={() => { setFilter(s); setPage(1); }}
                        className="px-3 py-1.5 rounded-[7px] text-sm font-medium capitalize transition-all"
                        style={{
                            background: filter === s ? STATUS_COLORS[s] : 'var(--bg-card)',
                            color: filter === s ? 'white' : 'var(--text-muted)',
                            border: filter === s ? 'none' : '1px solid var(--border)',
                        }}
                    >
                        {s.replace(/_/g, ' ')}
                    </button>
                ))}
                <button
                    onClick={fetchOrders}
                    className="ml-auto w-9 h-9 rounded-[7px] flex items-center justify-center"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                >
                    <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden space-y-3 mb-4">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="card p-4 animate-pulse">
                            <div className="skeleton h-4 w-1/3 rounded-[7px] mb-2" />
                            <div className="skeleton h-4 w-2/3 rounded-[7px]" />
                        </div>
                    ))
                ) : filteredOrders.length === 0 ? (
                    <div className="card p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                        No orders found
                    </div>
                ) : filteredOrders.map((order) => (
                    <div
                        key={order.id}
                        className="card p-4 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
                        onClick={() => setSelectedOrder(order)} // Tap card opens info view
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <span className="font-bold text-sm font-mono" style={{ color: 'var(--primary)' }}>
                                    {order.order_number}
                                </span>
                                <p className="font-semibold text-sm mt-0.5" style={{ color: 'var(--text-main)' }}>
                                    {order.customer?.full_name}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {order.customer?.phone}
                                </p>
                            </div>
                            <span
                                className="px-2.5 py-1 rounded-[7px] text-xs font-semibold capitalize shrink-0"
                                style={{
                                    background: `${STATUS_COLORS[order.status]}20`,
                                    color: STATUS_COLORS[order.status],
                                }}
                            >
                                {order.status?.replace(/_/g, ' ')}
                            </span>
                        </div>
                        <div className="flex items-center justify-between flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                            <div>
                                <p className="font-bold text-sm" style={{ color: 'var(--primary)' }}>
                                    Rs. {parseFloat(order.total).toLocaleString()}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {order.items?.length || 0} items ·{' '}
                                    {order.payment_method?.replace(/_/g, ' ')}
                                </p>
                            </div>
                            <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                className="text-xs px-2 py-1.5 rounded-[7px] outline-none"
                                style={{
                                    background: 'var(--bg-deep)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-main)',
                                }}
                            >
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                            {formatDateTime(order.created_at)}
                        </p>
                    </div>
                ))}
            </div>

            {/* Desktop Table (lg+) */}
            <div
                className="hidden lg:block rounded-[7px] overflow-hidden"
                style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
            >
                <div
                    style={{
                        width: '100%',
                        overflowX: 'auto',
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            tableLayout: 'fixed',
                            minWidth: '800px',
                            background: 'var(--bg-card)',
                        }}
                    >
                        <colgroup>
                            <col style={{ width: '110px' }} />
                            <col style={{ width: '160px' }} />
                            <col style={{ width: '70px' }} />
                            <col style={{ width: '100px' }} />
                            <col style={{ width: '120px' }} />
                            <col style={{ width: '110px' }} />
                            <col style={{ width: '100px' }} />
                            <col style={{ width: '120px' }} />
                        </colgroup>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-deep)' }}>
                                {['Order #', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Update'].map((h) => (
                                    <th
                                        key={h}
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em',
                                            color: 'var(--text-muted)',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                        {Array(8).fill(0).map((_, j) => (
                                            <td key={j} style={{ padding: '12px 16px' }}>
                                                <div className="skeleton h-4 rounded-[7px]" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        style={{
                                            textAlign: 'center',
                                            padding: '48px 16px',
                                            color: 'var(--text-muted)',
                                            fontSize: '14px',
                                        }}
                                    >
                                        No orders found
                                    </td>
                                </tr>
                            ) : filteredOrders.map((order) => (
                                <motion.tr
                                    key={order.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={() => setSelectedOrder(order)} // Entire desktop row item is clickable
                                    className="cursor-pointer transition-colors"
                                    style={{
                                        borderBottom: '1px solid var(--border)',
                                        background: selectedOrder?.id === order.id ? 'var(--bg-deep)' : 'transparent'
                                    }}
                                    whileHover={{ background: 'rgba(0,0,0,0.02)' }}
                                >
                                    <td style={{ padding: '12px 16px' }}>
                                        <span
                                            style={{
                                                fontFamily: 'monospace',
                                                fontWeight: '700',
                                                fontSize: '13px',
                                                color: 'var(--primary)',
                                            }}
                                        >
                                            {order.order_number}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div
                                            style={{
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: 'var(--text-main)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {order.customer?.full_name}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '11px',
                                                color: 'var(--text-muted)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {order.customer?.phone}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                        {order.items?.length || 0}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                                        Rs. {parseFloat(order.total).toLocaleString()}
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px 16px',
                                            fontSize: '12px',
                                            color: 'var(--text-muted)',
                                            textTransform: 'capitalize',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {order.payment_method?.replace(/_/g, ' ')}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span
                                            style={{
                                                padding: '3px 10px',
                                                borderRadius: '7px',
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                textTransform: 'capitalize',
                                                background: `${STATUS_COLORS[order.status]}20`,
                                                color: STATUS_COLORS[order.status],
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {order.status?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                        {formatDateTime(order.created_at)}
                                    </td>
                                    <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                                        {/* stopPropagation guarantees dropdown action won't re-trigger dialog state */}
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            style={{
                                                fontSize: '11px',
                                                padding: '5px 8px',
                                                borderRadius: '7px',
                                                outline: 'none',
                                                background: 'var(--bg-deep)',
                                                border: '1px solid var(--border)',
                                                color: 'var(--text-main)',
                                                cursor: 'pointer',
                                                width: '100%',
                                                maxWidth: '110px',
                                            }}
                                        >
                                            {STATUS_OPTIONS.map((s) => (
                                                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                            ))}
                                        </select>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div
                        className="flex justify-center gap-2 p-4"
                        style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}
                    >
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '7px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    background: page === p ? 'var(--primary)' : 'var(--bg-deep)',
                                    color: page === p ? 'white' : 'var(--text-muted)',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ORDER DETAILS OVERLAY PANEL */}
            <AnimatePresence>
                {selectedOrder && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSelectedOrder(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden rounded-[7px] shadow-2xl"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                            onClick={(e) => e.stopPropagation()} // Prevents closing when clicking modal content
                        >
                            {/* Modal Header */}
                            <div className="p-5 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-deep)' }}>
                                <div>
                                    <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                                        Order Breakdown
                                        <span className="font-mono text-sm px-2 py-0.5 rounded-[7px] text-white bg-[var(--primary)]">
                                            #{selectedOrder.order_number}
                                        </span>
                                    </h3>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                        Placed: {new Date(selectedOrder.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-1.5 rounded-[7px] transition-colors"
                                    style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                >
                                    <FiX size={18} />
                                </button>
                            </div>

                            {/* Scrollable Profiles Section */}
                            <div className="p-6 overflow-y-auto space-y-5 text-left custom-scrollbar">

                                {/* Single Grid Layout with Robust Data Mapping */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-[7px] border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>

                                    {/* Column 1: Customer Profile */}
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Customer Name</p>
                                            <p className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>
                                                {selectedOrder.full_name || selectedOrder.customer_name || 'Guest User'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Phone Number</p>
                                            <p className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>
                                                {selectedOrder.phone || selectedOrder.customer_phone || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Email Address</p>
                                            <p className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>
                                                {selectedOrder.email || selectedOrder.customer_email || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Payment Method</p>
                                            <p className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>
                                                {selectedOrder.payment_method || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Column 2: Delivery Destination */}
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Delivery Area / Region</p>
                                            <p className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>
                                                {selectedOrder.delivery_area_name || selectedOrder.delivery_area || 'Standard Zone'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Shipping Address</p>
                                            <p className="font-semibold text-sm flex items-start gap-1" style={{ color: 'var(--text-main)' }}>
                                                <FiMapPin size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--primary)' }} />
                                                {selectedOrder.address || selectedOrder.shipping_address || 'Counter Pickup'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Special Instructions</p>
                                            <p className="font-semibold text-sm italic" style={{ color: 'var(--text-main)' }}>
                                                {selectedOrder.additional_instructions || 'No instructions provided.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Kitchen Custom Remarks Box */}
                                {selectedOrder.notes && (
                                    <div className="p-3.5 rounded-[7px] border border-amber-200/40 bg-amber-500/5 text-amber-600 dark:text-amber-400">
                                        <h5 className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 mb-1">
                                            Special Kitchen Request:
                                        </h5>
                                        <p className="text-xs font-medium italic">
                                            "{selectedOrder.notes}"
                                        </p>
                                    </div>
                                )}

                                {/* Ordered Dishes Checklist Loop */}
                                <div>
                                    <h4 className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
                                        Items to Cook ({selectedOrder.items?.length || 0})
                                    </h4>
                                    <div className="rounded-[7px] overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                                        <table className="w-full text-xs text-left">
                                            <thead style={{ background: 'var(--bg-deep)', color: 'var(--text-muted)' }}>
                                                <tr>
                                                    <th className="p-3 font-semibold">Dish Description</th>
                                                    <th className="p-3 text-center font-semibold w-16">Qty</th>
                                                    <th className="p-3 text-right font-semibold w-24">Unit Price</th>
                                                    <th className="p-3 text-right font-semibold w-24">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                                {selectedOrder.items?.map((item, index) => {
                                                    // Mapping logic identical to OrderTrackingPage
                                                    const itemName = item.product_name || item.name || item.item_name || "Delicious Item";
                                                    const itemQuantity = Number(item.quantity || item.qty || 1);
                                                    const itemPrice = Number(item.unit_price ?? item.item_price ?? item.price ?? 0);
                                                    const rowTotal = item.total_price ? Number(item.total_price) : (itemPrice * itemQuantity);

                                                    return (
                                                        <tr key={index} style={{ color: 'var(--text-main)' }}>
                                                            <td className="p-3 font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-1.5 h-1.5 rounded-[7px] bg-[var(--primary)]" />
                                                                    {itemName}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-center font-bold text-sm bg-black/5 dark:bg-white/5">
                                                                {itemQuantity}x
                                                            </td>
                                                            <td className="p-3 text-right" style={{ color: 'var(--text-muted)' }}>
                                                                Rs. {itemPrice.toLocaleString()}
                                                            </td>
                                                            <td className="p-3 text-right font-semibold">
                                                                Rs. {rowTotal.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Financial Layout Grid Summary */}
                                <div className="pt-3 flex flex-col items-end space-y-1.5 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                    <div className="flex gap-10 text-sm pt-2 font-bold" style={{ color: 'var(--text-main)' }}>
                                        <span>Grand Total:</span>
                                        <span style={{ color: 'var(--primary)' }}>
                                            Rs. {parseFloat(selectedOrder.total).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                            </div>

                            {/* Modal Footer Controls */}
                            <div className="p-4 flex justify-between items-center gap-3 flex-wrap" style={{ background: 'var(--bg-deep)', borderTop: '1px solid var(--border)' }}>
                                {/* Direct Live Badge Status Indicator */}
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-[7px] animate-ping" style={{ backgroundColor: STATUS_COLORS[selectedOrder.status] }} />
                                        <span className="text-xs font-semibold capitalize" style={{ color: STATUS_COLORS[selectedOrder.status] }}>
                                            Status: {selectedOrder.status?.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <span className="text-xs pl-4" style={{ color: 'var(--text-muted)' }}>
                                        {formatDateTime(selectedOrder.created_at)}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDeleteOrder(selectedOrder.id)}
                                        disabled={deletingId === selectedOrder.id}
                                        className="px-4 py-2 rounded-[7px] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', opacity: deletingId === selectedOrder.id ? 0.6 : 1 }}
                                    >
                                        <FiTrash2 size={12} />
                                        {deletingId === selectedOrder.id ? 'Deleting…' : 'Delete Order'}
                                    </button>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="px-4 py-2 rounded-[7px] text-xs font-semibold transition-colors"
                                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                                    >
                                        Dismiss View
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default AdminOrders;