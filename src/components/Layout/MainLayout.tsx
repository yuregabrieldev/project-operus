import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        return window.innerWidth < 1024;
    });
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const mainRef = useRef<HTMLElement>(null);
    const location = useLocation();

    useEffect(() => {
        setMobileDrawerOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (mobileDrawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileDrawerOpen]);

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop / Tablet sidebar */}
            <div className="hidden md:block">
                <Sidebar
                    isCollapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    mode="desktop"
                />
            </div>

            {/* Mobile drawer overlay */}
            {mobileDrawerOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 md:hidden animate-in fade-in duration-200"
                    onClick={() => setMobileDrawerOpen(false)}
                />
            )}

            {/* Mobile drawer sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 md:hidden
                transform transition-transform duration-300 ease-in-out
                ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <Sidebar
                    isCollapsed={false}
                    onToggle={() => setMobileDrawerOpen(false)}
                    mode="mobile"
                    onClose={() => setMobileDrawerOpen(false)}
                />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <Header
                    onMenuToggle={() => setMobileDrawerOpen(true)}
                />

                <main ref={mainRef} className="flex-1 overflow-auto scroll-smooth">
                    <div key={location.pathname} className="animate-in fade-in duration-200">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
