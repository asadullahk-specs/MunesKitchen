import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiDollarSign, FiClock, FiCheckCircle, FiUsers } from 'react-icons/fi';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboardStats } from '../../api/orders';

const StatCard = ({ icon, label, value, color, delay }) => (
    <motion.div
        className="card p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="font-display font-bold text-2xl" style={{ color: 'var(--text-main)' }}>{value}</p>
            </div>
            <div className="w-11 h-11 rounded-[7px] flex items-center justify-center"
                style={{ background: `${color}15`, color }}>
                {icon}
            </div>
        </div>
    </motion.div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardStats()
            .then((res) => {
                if (res.data.success) {
                    setStats(res.data.data)
                }
            })
            .catch((err) => {
                console.error('Dashboard error:', err.response?.data?.message)
            })
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="flex flex-col gap-5">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="card p-5 h-24 skeleton" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="card p-5 h-64 skeleton" />
                    <div className="card p-5 h-64 skeleton" />
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const monthlyData = stats.monthlyRevenue.map((m) => ({
        month: m.month,
        revenue: parseFloat(m.revenue) || 0,
        orders: parseInt(m.orders) || 0,
    }));

    return (
        <div className="flex flex-col gap-5">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard icon={<FiShoppingBag />} label="Total Orders" value={stats.totalOrders} color="#ef4444" delay={0} />
                <StatCard icon={<FiDollarSign />} label="Revenue" value={`Rs. ${parseFloat(stats.totalRevenue).toLocaleString()}`} color="#10b981" delay={0.05} />
                <StatCard icon={<FiClock />} label="Pending" value={stats.pendingOrders} color="#f59e0b" delay={0.1} />
                <StatCard icon={<FiCheckCircle />} label="Delivered" value={stats.deliveredOrders} color="#3b82f6" delay={0.15} />
                <StatCard icon={<FiUsers />} label="Customers" value={stats.totalCustomers} color="#8b5cf6" delay={0.2} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Revenue Chart */}
                <motion.div className="card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <h2 className="font-display font-semibold text-base mb-4" style={{ color: 'var(--text-main)' }}>
                        Monthly Revenue
                    </h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={monthlyData}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="month" stroke="var(--text-soft)" fontSize={11} />
                            <YAxis stroke="var(--text-soft)" fontSize={11} />
                            <Tooltip
                                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text-main)' }}
                                formatter={(val) => [`Rs. ${val.toLocaleString()}`, 'Revenue']}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#ef4444" fill="url(#revenueGrad)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Top Products */}
                <motion.div className="card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <h2 className="font-display font-semibold text-base mb-4" style={{ color: 'var(--text-main)' }}>
                        Top Products
                    </h2>
                    {stats.topProducts.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={stats.topProducts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis type="number" stroke="var(--text-soft)" fontSize={11} />
                                <YAxis type="category" dataKey="name" stroke="var(--text-soft)" fontSize={10} width={100} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text-main)' }}
                                />
                                <Bar dataKey="total_sold" fill="#ef4444" radius={[0, 6, 6, 0]} name="Units Sold" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-52 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                            No sales data yet
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;