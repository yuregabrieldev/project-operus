import React, { useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const mainRef = useRef<HTMLElement>(null);
    const location = useLocation();

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar
                isCollapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <div className="flex-1 flex flex-col">
                <Header />

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
