import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PublicLayout = () => {
    const { pathname } = useLocation();
    const layoutRef = useRef(null);

    useEffect(() => {
        // Force all possible structural layers to jump back up
        window.scrollTo(0, 0);
        document.documentElement.scrollTo(0, 0);
        document.body.scrollTo(0, 0);
    }, [pathname]);

    return (
        <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ background: 'var(--bg-deep)' }}>
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default PublicLayout;