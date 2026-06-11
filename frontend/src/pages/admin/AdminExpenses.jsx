import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { FiTrash2, FiDollarSign, FiPlus } from 'react-icons/fi'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import API from '../../api/axios'

const AdminExpenses = () => {
    const [expenses, setExpenses] = useState([])
    const [categories, setCategories] = useState([])
    const [categoryStats, setCategoryStats] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [title, setTitle] = useState('')
    const [amount, setAmount] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [note, setNote] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    const fetchData = async () => {
        try {
            const r = await API.get('/expenses')
            setExpenses(r.data.expenses || [])
            setCategories(r.data.categories || [])
            setCategoryStats(r.data.categoryStats || [])
            setTotal(r.data.total || 0)
        } catch {
            toast.error('Failed to load expenses')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const handleAdd = async () => {
        if (!title.trim()) { toast.error('Title is required'); return }
        if (!amount || Number(amount) <= 0) { toast.error('Valid amount is required'); return }
        if (!categoryId) { toast.error('Please select a category'); return }
        if (!date) { toast.error('Date is required'); return }

        setSaving(true)
        try {
            const { data } = await API.post('/expenses', {
                title: title.trim(),
                amount: Number(amount),
                category_id: categoryId,
                note: note.trim() || null,
                date,
            })
            if (data.success) {
                toast.success('Expense added!')
                setTitle('')
                setAmount('')
                setCategoryId('')
                setNote('')
                setDate(new Date().toISOString().split('T')[0])
                fetchData()
            } else {
                toast.error(data.message || 'Failed to add expense')
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add expense')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this expense?')) return
        try {
            await API.delete(`/expenses/${id}`)
            toast.success('Expense deleted')
            fetchData()
        } catch {
            toast.error('Delete failed')
        }
    }

    return (
        <div style={{ width: '100%' }}>
            <div className="mb-6">
                <h1 className="font-bold text-2xl" style={{ color: 'var(--text-main)' }}>Expenses</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    Total: Rs. {Number(total).toLocaleString()}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Form */}
                <div className="card p-5">
                    <h3 className="font-bold text-base mb-4" style={{ color: 'var(--text-main)' }}>
                        Add Expense
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="form-label">Title *</label>
                            <input className="form-input" placeholder="e.g. Monthly salary"
                                value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label">Amount (Rs.) *</label>
                            <input
                                className="form-input"
                                type="text"
                                inputMode="numeric"
                                placeholder="e.g. 5000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                            />
                        </div>
                        <div>
                            <label className="form-label">Category *</label>
                            <select
                                className="form-input"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                            >
                                {/* If categories are loading or empty, show standard prompting option labels */}
                                <option value="">
                                    {categories && categories.length === 0 ? 'No categories found' : 'Select category'}
                                </option>

                                {/* Add a safe optional chain (?.) to map over the values safely */}
                                {categories?.map((c) => (
                                    <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Date *</label>
                            <input
                                className="form-input dark-date-input"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="form-label">Note</label>
                            <textarea className="form-input" rows={2} style={{ resize: 'none' }} placeholder="Optional note..."
                                value={note} onChange={(e) => setNote(e.target.value)} />
                        </div>
                        <button onClick={handleAdd} disabled={saving} className="btn-primary w-full justify-center">
                            {saving ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-[7px] animate-spin" />
                                    Adding...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <FiPlus size={15} /> Add Expense
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Chart */}
                <div className="card p-5">
                    <h3 className="font-bold text-base mb-4" style={{ color: 'var(--text-main)' }}>
                        By Category
                    </h3>
                    {categoryStats.length > 0 ? (
                        <div>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie data={categoryStats} dataKey="total" nameKey="name"
                                        cx="50%" cy="50%" outerRadius={70} paddingAngle={3}>
                                        {categoryStats.map((entry, i) => (
                                            <Cell key={i} fill={entry.color || '#990000'} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '7px',
                                            color: 'var(--text-main)',
                                        }}
                                        formatter={(v) => `Rs. ${Number(v).toLocaleString()}`}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-3">
                                {categoryStats.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                        <div className="w-3 h-3 rounded-[7px] shrink-0"
                                            style={{ background: s.color || '#990000' }} />
                                        <span className="flex-1 truncate" style={{ color: 'var(--text-muted)' }}>
                                            {s.name}
                                        </span>
                                        <span className="font-semibold shrink-0" style={{ color: 'var(--text-main)' }}>
                                            Rs. {Number(s.total).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-48 flex flex-col items-center justify-center gap-2 text-sm"
                            style={{ color: 'var(--text-muted)' }}>
                            <FiDollarSign size={32} style={{ opacity: 0.3 }} />
                            No expense data yet
                        </div>
                    )}
                </div>

                {/* Recent */}
                <div className="card overflow-hidden">
                    <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                        <h3 className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>
                            Recent Expenses
                        </h3>
                    </div>
                    <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
                        {loading ? (
                            <div className="p-4 space-y-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="skeleton h-12 rounded-[7px]" />
                                ))}
                            </div>
                        ) : expenses.length === 0 ? (
                            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                                No expenses yet
                            </div>
                        ) : expenses.map((exp) => (
                            <div key={exp.id || exp._id}
                                className="flex items-center gap-3 p-3"
                                style={{ borderBottom: '1px solid var(--border)' }}>
                                <div className="w-8 h-8 rounded-[7px] flex items-center justify-center shrink-0"
                                    style={{ background: `${exp.category_color || '#990000'}20` }}>
                                    <FiDollarSign size={14} style={{ color: exp.category_color || '#990000' }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-main)' }}>
                                        {exp.title}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        {exp.category_name || 'Uncategorized'} · {new Date(exp.date).toLocaleDateString('en-PK')}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
                                        Rs. {Number(exp.amount).toLocaleString()}
                                    </p>
                                    <button onClick={() => handleDelete(exp.id || exp._id)}
                                        className="mt-0.5 opacity-50 hover:opacity-100"
                                        style={{ color: '#ef4444' }}>
                                        <FiTrash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}

export default AdminExpenses