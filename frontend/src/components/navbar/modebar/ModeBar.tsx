import React from 'react';
import { useLocation } from 'react-router-dom';
import ModeNavItem from './ModeNavItem';
import ToolsDropdown from './ToolsDropdown';

const ModeBar: React.FC = () => {
    const location = useLocation();

    return (
        <div className="h-12 border-b border-gray-200 bg-white flex items-center px-4 space-x-2 sticky top-16 z-30">
            <ModeNavItem
                label="Chat"
                path="/chat"
                isActive={location.pathname === '/chat'}
            />
            <ModeNavItem
                label="PRD Generator"
                path="/prd"
                isActive={location.pathname === '/prd'}
            />
            <ToolsDropdown />
        </div>
    );
};

export default ModeBar;
