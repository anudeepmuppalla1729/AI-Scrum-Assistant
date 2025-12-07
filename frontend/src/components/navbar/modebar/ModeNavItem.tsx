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
            className={`
                px-4 py-2 text-sm font-medium transition-colors border-b-2
                ${isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
            `}
        >
            {label}
        </button>
    );
};

export default ModeNavItem;
