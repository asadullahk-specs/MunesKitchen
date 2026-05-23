import { useState, useEffect } from 'react'
import API from '../../api/axios'

const AdminCustomers = () => {
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        API.get('/customers')
            .then(r => setCustomers(r.data.customers || r.data.data || []))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div className="admin-page-wrapper">
            <div className="mb-6">
                <div className="skeleton h-7 w-32 rounded mb-2" />
                <div className="skeleton h-4 w-48 rounded" />
            </div>
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="card p-4 animate-pulse">
                        <div className="skeleton h-4 w-1/2 rounded mb-2" />
                        <div className="skeleton h-4 w-1/3 rounded" />
                    </div>
                ))}
            </div>
        </div>
    )

    return (
        <div className="admin-page-wrapper">
            <div className="mb-6">
                <h1 className="font-bold text-2xl" style={{ color: 'var(--text-main)' }}>Customers</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    {customers.length} registered customers
                </p>
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block card overflow-hidden">
                <div className="admin-table-wrapper">
                    <table className="w-full text-sm" style={{ minWidth: '620px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                                {['Customer', 'Phone', 'Email', 'Orders', 'Total Spent', 'Last Order'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                                        style={{ color: 'var(--text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                                        No customers yet
                                    </td>
                                </tr>
                            ) : customers.map(c => (
                                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}
                                    className="transition-colors hover:bg-red-50 dark:hover:bg-red-900/10">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                                style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>
                                                {(c.full_name || c.name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-semibold" style={{ color: 'var(--text-main)' }}>
                                                {c.full_name || c.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{c.phone}</td>
                                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{c.email || '—'}</td>
                                    <td className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--text-main)' }}>
                                        {c.total_orders || 0}
                                    </td>
                                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--primary)' }}>
                                        Rs. {Number(c.total_spent || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                                        {c.last_order_date
                                            ? new Date(c.last_order_date).toLocaleDateString('en-PK')
                                            : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
                {customers.length === 0 ? (
                    <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                        No customers yet
                    </div>
                ) : customers.map(c => (
                    <div key={c.id} className="card p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                                style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>
                                {(c.full_name || c.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>
                                    {c.full_name || c.name}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.phone}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-xl p-2" style={{ background: 'var(--bg-deep)' }}>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Orders</p>
                                <p className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>
                                    {c.total_orders || 0}
                                </p>
                            </div>
                            <div className="rounded-xl p-2" style={{ background: 'var(--bg-deep)' }}>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Spent</p>
                                <p className="font-bold text-sm" style={{ color: 'var(--primary)' }}>
                                    Rs.{Number(c.total_spent || 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="rounded-xl p-2" style={{ background: 'var(--bg-deep)' }}>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Last Order</p>
                                <p className="font-bold text-xs" style={{ color: 'var(--text-main)' }}>
                                    {c.last_order_date
                                        ? new Date(c.last_order_date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })
                                        : '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    )
}

export default AdminCustomers