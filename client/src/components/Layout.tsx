import React from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './navbar/topbar/TopBar';
import ModeBar from './navbar/modebar/ModeBar';

const Layout: React.FC = () => {
    return (
        <div className="h-screen bg-gray-50 flex flex-col">
            <TopBar />
            <ModeBar />
            <main className="flex-1 overflow-hidden min-h-0">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
