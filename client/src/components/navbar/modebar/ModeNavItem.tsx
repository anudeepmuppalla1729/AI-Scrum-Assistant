import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ModeNavItemProps {
    label: string;
    path: string;
    isActive: boolean;
}

const ModeNavItem: React.FC<ModeNavItemProps> = ({ label, path, isActive }) => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate(path)}
            className={`mode-nav-item ${isActive ? 'active' : ''}`}
        >
            {label}
        </button>
    );
};

export default ModeNavItem;
