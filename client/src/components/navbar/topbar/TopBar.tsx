import React from 'react';
import Brand from './Brand';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import SearchBar from './SearchBar';
import UserMenu from './UserMenu';

const TopBar: React.FC = () => {
    return (
        <div className="topbar glass-panel animate-fade-in-down">
            <div className="topbar-left">
                <Brand />
                <div className="topbar-divider hidden md:block"></div>
                <WorkspaceSwitcher />
            </div>

            <SearchBar />

            <div className="topbar-right">
                <UserMenu />
            </div>
        </div>
    );
};

export default TopBar;
