import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
    FiStar, FiCheck, FiX, FiTrash2, FiRefreshCw,
    FiClock, FiCheckCircle, FiXCircle, FiImage, FiMessageSquare, FiSearch,
} from 'react-icons/fi';
import { getReviews, updateReviewStatus, deleteReview } from '../../api/reviews';

const STATUS_CFG = {
    pending: { label: 'Pending', color: '#d97706', bg: 'rgba(217,119,6,0.1)', border: 'rgba(217,119,6,0.3)', Icon: FiClock },
    approved: { label: 'Approved', color: '#059669', bg: 'rgba(5,150,105,0.1)', border: 'rgba(5,150,105,0.3)', Icon: FiCheckCircle },
    rejected: { label: 'Rejected', color: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.2)', Icon: FiXCircle },
};

const StarRow = ({ rating }) => (
    <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(s => (
            <FiStar key={s} size={13}
                fill={s <= (rating || 0) ? '#f59e0b' : 'none'}
                stroke={s <= (rating || 0) ? '#f59e0b' : 'var(--border)'}
            />
        ))}
    </div>
);

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
    return (
        <span style={{
            padding: '3px 10px', borderRadius: '7px', fontSize: 11, fontWeight: 600,
            background: cfg.bg, color: cfg.color,
            border: `1px solid ${cfg.border}`, textTransform: 'capitalize',
            whiteSpace: 'nowrap',
        }}>
            {cfg.label}
        </span>
    );
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
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');

    return `${day}/${month}/${year} ${strHours}:${minutes} ${ampm}`;
};

const ReviewCard = ({ review, onAction, busy }) => {
    // Derive display values from review data
    const initial = (review.customer_name || 'A').charAt(0).toUpperCase();
    const date = formatDateTime(review.created_at);

    // Robustly parse the images field (stored as JSON string of base64 data URLs)
    const displayImages = useMemo(() => {
        try {
            if (!review.images) return [];
            if (Array.isArray(review.images)) return review.images.filter(Boolean);
            if (review.images === 'NULL' || review.images === '[]') return [];
            const parsed = JSON.parse(review.images);
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch (e) {
            console.error('Error parsing review images:', e);
            return [];
        }
    }, [review.images]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="card"
            style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}
        >
            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                    {/* Avatar */}
                    <div style={{
                        width: 38, height: 38, borderRadius: '7px', flexShrink: 0,
                        background: 'linear-gradient(135deg, var(--primary), #cc4444)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 15,
                    }}>
                        {initial}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {review.customer_name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{date}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <StarRow rating={review.rating} />
                    <StatusBadge status={review.status} />
                </div>
            </div>

            {/* ── Product Tag ── */}
            {review.product_name && (
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, width: 'fit-content',
                    background: 'rgba(153,0,0,0.06)', color: 'var(--primary)',
                    border: '1px solid rgba(153,0,0,0.15)',
                    padding: '3px 10px', borderRadius: '7px', fontSize: 11, fontWeight: 600,
                }}>
                    {review.product_name}
                </div>
            )}

            {/* ── Message ── */}
            <p style={{
                fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic',
                lineHeight: 1.65, margin: 0, borderLeft: '3px solid var(--border)', paddingLeft: 10,
            }}>
                "{review.message}"
            </p>

            {/* ── Images ── */}
            {displayImages.length > 0 ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {displayImages.slice(0, 5).map((src, i) => (
                        <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                            <img
                                src={src}
                                alt={`review-img-${i + 1}`}
                                style={{
                                    width: 60, height: 60, objectFit: 'cover',
                                    borderRadius: '7px', border: '1.5px solid var(--border)',
                                    cursor: 'pointer', transition: 'opacity 0.2s',
                                }}
                                onError={e => { e.target.style.display = 'none'; }}
                            />
                        </a>
                    ))}
                    {displayImages.length > 5 && (
                        <div style={{
                            width: 60, height: 60, borderRadius: '7px', border: '1.5px solid var(--border)',
                            background: 'var(--bg-input)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600,
                        }}>+{displayImages.length - 5}</div>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                    <FiImage size={13} />
                    No images attached
                </div>
            )}

            {/* ── Actions ── */}
            <div
                className="flex flex-col sm:flex-row gap-2 pt-2.5 mt-1"
                style={{ borderTop: '1px solid var(--border)' }}
            >
                {review.status !== 'approved' && (
                    <button
                        disabled={busy}
                        onClick={() => onAction(review.id, 'approved')}
                        className="flex items-center justify-center gap-1.5 w-full sm:w-auto"
                        style={{
                            padding: '7px 14px', borderRadius: '7px', fontSize: 12, fontWeight: 600,
                            background: 'rgba(5,150,105,0.1)', color: '#059669',
                            border: '1px solid rgba(5,150,105,0.3)', cursor: busy ? 'not-allowed' : 'pointer',
                            opacity: busy ? 0.6 : 1, transition: 'all 0.2s',
                        }}
                    >
                        <FiCheck size={13} /> Approve
                    </button>
                )}
                {review.status !== 'rejected' && (
                    <button
                        disabled={busy}
                        onClick={() => onAction(review.id, 'rejected')}
                        className="flex items-center justify-center gap-1.5 w-full sm:w-auto"
                        style={{
                            padding: '7px 14px', borderRadius: '7px', fontSize: 12, fontWeight: 600,
                            background: 'rgba(217,119,6,0.1)', color: '#d97706',
                            border: '1px solid rgba(217,119,6,0.3)', cursor: busy ? 'not-allowed' : 'pointer',
                            opacity: busy ? 0.6 : 1, transition: 'all 0.2s',
                        }}
                    >
                        <FiX size={13} /> Reject
                    </button>
                )}
                <button
                    disabled={busy}
                    onClick={() => onAction(review.id, 'delete')}
                    className="flex items-center justify-center gap-1.5 w-full sm:w-auto"
                    style={{
                        padding: '7px 14px', borderRadius: '7px', fontSize: 12, fontWeight: 600,
                        background: 'rgba(220,38,38,0.08)', color: '#dc2626',
                        border: '1px solid rgba(220,38,38,0.2)', cursor: busy ? 'not-allowed' : 'pointer',
                        opacity: busy ? 0.6 : 1, transition: 'all 0.2s',
                    }}
                >
                    <FiTrash2 size={13} /> Delete
                </button>
            </div>
        </motion.div>
    );
};

// ── Main AdminReviews ─────────────────────────────────────────────────────────
const AdminReviews = () => {
    const [allReviews, setAllReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('all');
    const [busyId, setBusyId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await getReviews({ status: 'all' });
            setAllReviews(res.data.data || []);
        } catch {
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviews(); }, []);

    const counts = useMemo(() => ({
        all: allReviews.length,
        pending: allReviews.filter(r => r.status === 'pending').length,
        approved: allReviews.filter(r => r.status === 'approved').length,
        rejected: allReviews.filter(r => r.status === 'rejected').length,
    }), [allReviews]);

    const filtered = useMemo(() => {
        const byTab = tab === 'all' ? allReviews : allReviews.filter(r => r.status === tab);
        if (!searchQuery.trim()) return byTab;
        const q = searchQuery.toLowerCase();
        return byTab.filter(r =>
            (r.customer_name || '').toLowerCase().includes(q) ||
            (r.product_name || '').toLowerCase().includes(q) ||
            (r.message || '').toLowerCase().includes(q)
        );
    }, [allReviews, tab, searchQuery]);

    const handleAction = async (id, action) => {
        setBusyId(id);
        try {
            if (action === 'delete') {
                await deleteReview(id);
                setAllReviews(prev => prev.filter(r => r.id !== id));
                toast.success('Review deleted');
            } else {
                await updateReviewStatus(id, action);
                setAllReviews(prev =>
                    prev.map(r => (r.id === id ? { ...r, status: action } : r))
                );
                toast.success(`Review ${action} successfully.`);
            }
        } catch (err) {
            console.error('Action error:', err);
            toast.error(err.response?.data?.message || 'Action failed. Please try again.');
        } finally {
            setBusyId(null);
        }
    };

    const TABS = ['all', 'pending', 'approved', 'rejected'];

    return (
        <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>

            {/* ── Page Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        Review Moderation
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
                        Approve, reject, or remove customer reviews
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }} className="w-full sm:w-72">
                        <input
                            type="text"
                            className="form-input w-full"
                            style={{ paddingRight: 32, fontSize: 13 }}
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <FiSearch size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    </div>
                    <button
                        onClick={fetchReviews}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: '7px', fontSize: 13, fontWeight: 600,
                            background: 'var(--bg-card)', color: 'var(--text-muted)',
                            border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                    >
                        <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* ── Stats Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {TABS.slice(1).map(s => {
                    const cfg = STATUS_CFG[s];
                    return (
                        <div key={s} className="card" style={{ padding: '10px 4px', textAlign: 'center', overflow: 'hidden' }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: cfg.color }}>{counts[s]}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cfg.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* ── Tab Navigation ── */}
            <div
                className="flex flex-col sm:flex-row gap-1.5 mb-5 w-full sm:w-fit"
                style={{
                    padding: '6px', borderRadius: '7px',
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                }}
            >
                {TABS.map(t => {
                    const active = tab === t;
                    const cfg = STATUS_CFG[t] || { color: 'var(--text-muted)', bg: 'transparent' };
                    return (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className="flex items-center justify-center gap-1 w-full sm:w-auto"
                            style={{
                                padding: '7px 12px', borderRadius: '7px', fontSize: 12, fontWeight: 600,
                                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                textTransform: 'capitalize',
                                background: active ? (t === 'all' ? 'var(--primary)' : cfg.bg) : 'transparent',
                                color: active ? (t === 'all' ? '#fff' : cfg.color) : 'var(--text-muted)',
                                outline: active && t !== 'all' ? `1px solid ${cfg.border}` : 'none',
                            }}
                        >
                            {t} {counts[t] > 0 && (
                                <span style={{
                                    marginLeft: 4, background: active ? 'rgba(255,255,255,0.25)' : 'var(--bg-deep)',
                                    borderRadius: '7px', padding: '1px 6px', fontSize: 10,
                                }}>
                                    {counts[t]}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Review Grid ── */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {Array(4).fill(0).map((_, i) => (
                        <div key={i} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div className="skeleton" style={{ height: 40, borderRadius: '7px' }} />
                            <div className="skeleton" style={{ height: 16, borderRadius: '7px', width: '60%' }} />
                            <div className="skeleton" style={{ height: 60, borderRadius: '7px' }} />
                            <div className="skeleton" style={{ height: 32, borderRadius: '7px' }} />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <FiMessageSquare size={40} style={{ color: 'var(--border)', marginBottom: 12 }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
                        No {tab === 'all' ? '' : tab} reviews yet.
                    </p>
                </div>
            ) : (
                <AnimatePresence mode="popLayout">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 16,
                    }}>
                        {filtered.map(review => (
                            <ReviewCard
                                key={review.id}
                                review={review}
                                onAction={handleAction}
                                busy={busyId === review.id}
                            />
                        ))}
                    </div>
                </AnimatePresence>
            )}
        </div>
    );
};

export default AdminReviews;