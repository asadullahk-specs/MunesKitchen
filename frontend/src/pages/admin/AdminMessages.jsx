import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiTrash2, FiMail, FiPhone, FiCheck, FiBookOpen, FiClock, FiSearch } from 'react-icons/fi';
import { getContacts, markContactRead, deleteContact } from '../../api/contacts';

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

const AdminMessages = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, read
    const [search, setSearch] = useState('');
    const [selectedMessage, setSelectedMessage] = useState(null);

    const fetchMessages = async () => {
        try {
            const { data } = await getContacts();
            if (data.success) {
                setMessages(data.data || []);
            }
        } catch (err) {
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleToggleRead = async (id, currentRead) => {
        try {
            const { data } = await markContactRead(id, !currentRead);
            if (data.success) {
                toast.success(`Message marked as ${!currentRead ? 'read' : 'unread'}`);
                
                // If the currently open modal message is modified, update it too
                if (selectedMessage && selectedMessage.id === id) {
                    setSelectedMessage({ ...selectedMessage, is_read: !currentRead });
                }
                
                fetchMessages();
            }
        } catch {
            toast.error('Failed to update message status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;
        try {
            const { data } = await deleteContact(id);
            if (data.success) {
                toast.success('Message deleted successfully');
                if (selectedMessage && selectedMessage.id === id) {
                    setSelectedMessage(null);
                }
                fetchMessages();
            }
        } catch {
            toast.error('Failed to delete message');
        }
    };

    // Filter & Search Messages
    const filteredMessages = messages.filter((msg) => {
        const matchesFilter = 
            filter === 'all' || 
            (filter === 'unread' && !msg.is_read) || 
            (filter === 'read' && msg.is_read);

        const searchLower = search.toLowerCase();
        const matchesSearch = 
            (msg.name || '').toLowerCase().includes(searchLower) ||
            (msg.email || '').toLowerCase().includes(searchLower) ||
            (msg.phone || '').toLowerCase().includes(searchLower) ||
            (msg.subject || '').toLowerCase().includes(searchLower) ||
            (msg.message || '').toLowerCase().includes(searchLower);

        return matchesFilter && matchesSearch;
    });

    const unreadCount = messages.filter(m => !m.is_read).length;

    return (
        <div style={{ width: '100%', fontFamily: 'Poppins, sans-serif' }}>
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-bold text-2xl" style={{ color: 'var(--text-main)' }}>Customer Messages</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                        {unreadCount > 0 ? `You have ${unreadCount} unread messages` : 'No unread messages'}
                    </p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="card p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Tabs */}
                <div className="flex gap-2 bg-black/10 dark:bg-white/5 p-1 rounded-xl w-fit">
                    {[
                        { id: 'all', label: 'All Messages' },
                        { id: 'unread', label: `Unread (${unreadCount})` },
                        { id: 'read', label: 'Read' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className="px-4 py-2 text-xs font-semibold rounded-lg transition-all"
                            style={{
                                background: filter === tab.id ? 'var(--primary)' : 'transparent',
                                color: filter === tab.id ? '#ffffff' : 'var(--text-muted)',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name, email, subject..."
                        className="form-input pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Messages List */}
                <div className="lg:col-span-2 space-y-3">
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="skeleton h-24 rounded-2xl" />
                            ))}
                        </div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                            No messages found.
                        </div>
                    ) : (
                        filteredMessages.map((msg) => (
                            <div
                                key={msg.id}
                                onClick={() => setSelectedMessage(msg)}
                                className="card p-4 transition-all duration-200 hover:shadow-md cursor-pointer relative"
                                style={{
                                    borderLeft: !msg.is_read ? '4px solid var(--primary)' : '4px solid transparent',
                                    background: selectedMessage?.id === msg.id ? 'var(--primary-glow)' : 'var(--bg-card)',
                                    borderColor: selectedMessage?.id === msg.id ? 'var(--primary)' : 'var(--border)'
                                }}
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-sm truncate" style={{ color: 'var(--text-main)' }}>
                                                {msg.name}
                                            </h3>
                                            {!msg.is_read && (
                                                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
                                                    New
                                                </span>
                                            )}
                                        </div>
                                        {msg.subject && (
                                            <p className="text-xs font-semibold mb-1 truncate" style={{ color: 'var(--primary)' }}>
                                                {msg.subject}
                                            </p>
                                        )}
                                        <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                                            {msg.message}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleToggleRead(msg.id, msg.is_read)}
                                            className="p-2 rounded-xl transition-all"
                                            style={{
                                                background: msg.is_read ? 'rgba(34,197,94,0.1)' : 'rgba(0,0,0,0.05)',
                                                color: msg.is_read ? '#22c55e' : 'var(--text-muted)'
                                            }}
                                            title={msg.is_read ? "Mark Unread" : "Mark Read"}
                                        >
                                            <FiCheck size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(msg.id)}
                                            className="p-2 rounded-xl transition-all hover:bg-red-500/10 text-red-500"
                                            title="Delete"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-3 pt-2 text-[10px]" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                    <span className="flex items-center gap-1">
                                        <FiClock size={10} />
                                        {formatDateTime(msg.created_at)}
                                    </span>
                                    {msg.email && (
                                        <span className="flex items-center gap-1 truncate max-w-[150px]">
                                            <FiMail size={10} />
                                            {msg.email}
                                        </span>
                                    )}
                                    {msg.phone && (
                                        <span className="flex items-center gap-1">
                                            <FiPhone size={10} />
                                            {msg.phone}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Message detail view pane */}
                <div className="lg:col-span-1">
                    {selectedMessage ? (
                        <div className="card p-5 lg:sticky lg:top-24 space-y-4">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h2 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-main)' }}>
                                        {selectedMessage.name}
                                    </h2>
                                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                        Sent {formatDateTime(selectedMessage.created_at)}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleToggleRead(selectedMessage.id, selectedMessage.is_read)}
                                    className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all"
                                    style={{
                                        background: selectedMessage.is_read ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: selectedMessage.is_read ? '#22c55e' : '#ef4444'
                                    }}
                                >
                                    {selectedMessage.is_read ? 'Read' : 'Unread'}
                                </button>
                            </div>

                            <div className="space-y-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                                {selectedMessage.email && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <FiMail className="shrink-0 text-gray-400" size={14} />
                                        <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                                        <a href={`mailto:${selectedMessage.email}`} className="font-semibold truncate hover:text-red-500 transition-colors" style={{ color: 'var(--text-main)' }}>
                                            {selectedMessage.email}
                                        </a>
                                    </div>
                                )}
                                {selectedMessage.phone && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <FiPhone className="shrink-0 text-gray-400" size={14} />
                                        <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                                        <a href={`tel:${selectedMessage.phone}`} className="font-semibold hover:text-red-500 transition-colors" style={{ color: 'var(--text-main)' }}>
                                            {selectedMessage.phone}
                                        </a>
                                    </div>
                                )}
                                {selectedMessage.subject && (
                                    <div className="flex items-start gap-2 text-xs">
                                        <FiBookOpen className="shrink-0 mt-0.5 text-gray-400" size={14} />
                                        <span style={{ color: 'var(--text-muted)' }}>Subject:</span>
                                        <span className="font-bold flex-1" style={{ color: 'var(--text-main)' }}>
                                            {selectedMessage.subject}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 rounded-xl text-sm leading-relaxed" style={{ background: 'var(--bg-deep)', border: '1px solid var(--border)', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                                {selectedMessage.message}
                            </div>

                            <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                                <button
                                    onClick={() => handleToggleRead(selectedMessage.id, selectedMessage.is_read)}
                                    className="btn-primary flex-1 justify-center py-2 text-xs"
                                    style={{ background: selectedMessage.is_read ? '#6b7280' : 'var(--primary)' }}
                                >
                                    {selectedMessage.is_read ? 'Mark as Unread' : 'Mark as Read'}
                                </button>
                                <button
                                    onClick={() => handleDelete(selectedMessage.id)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold justify-center transition-all bg-red-500 hover:bg-red-600 text-white"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="card p-8 text-center text-xs lg:sticky lg:top-24" style={{ color: 'var(--text-muted)' }}>
                            Select a message to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminMessages;
