import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminTopbar from '../components/admin/AdminTopbar';

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
            {/* Sidebar */}
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminTopbar onMenuToggle={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <Outlet />
                </main>
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 lg:hidden"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default AdminLayout;