import React from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './navbar/topbar/TopBar';
import ModeBar from './navbar/modebar/ModeBar';

const Layout: React.FC = () => {
    return (
        <div className="app-layout">
            <TopBar />
            <ModeBar />
            <main className="app-main">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
