import React, { useState } from 'react';
import { useWorkspaceStore } from '../../../store/useWorkspaceStore';
import WorkspaceDropdown from './WorkspaceDropdown';
import { useNavigate } from 'react-router-dom';

const WorkspaceSwitcher: React.FC = () => {
    const { workspace } = useWorkspaceStore();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    const handleSwitcherClick = () => {
        if (!workspace) {
            navigate('/workspace');
        } else {
            setIsDropdownOpen(!isDropdownOpen);
        }
    };

    return (
        <div className="relative ml-6">
            <button
                onClick={handleSwitcherClick}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors focus:outline-none"
            >
                <div className="flex flex-col items-start">
                    {workspace ? (
                        <>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Board: {workspace.boardName}
                            </span>
                            <div className="flex items-center text-sm font-medium text-gray-900">
                                <span>Sprint: {workspace.sprintName}</span>
                                <svg className={`ml-2 h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </>
                    ) : (
                        <span className="text-sm font-medium text-gray-500">No workspace selected</span>
                    )}
                </div>
            </button>
            <WorkspaceDropdown
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
            />
        </div>
    );
};

export default WorkspaceSwitcher;
