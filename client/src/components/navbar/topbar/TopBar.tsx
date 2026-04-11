import React from 'react';
import Brand from './Brand';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import SearchBar from './SearchBar';
import UserMenu from './UserMenu';

const TopBar: React.FC = () => {
    return (
        <div className="h-16 px-5 border-b border-gray-200 bg-white flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center">
                <Brand />
                <WorkspaceSwitcher />
            </div>

            <SearchBar />

            <div className="flex items-center">
                <UserMenu />
            </div>
        </div>
    );
};

export default TopBar;
