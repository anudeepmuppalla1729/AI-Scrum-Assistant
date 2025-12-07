import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface WorkspaceDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
        >
            <div className="py-1">
                <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                        navigate('/workspace');
                        onClose();
                    }}
                >
                    Switch Workspace
                </button>
            </div>
        </div>
    );
};

export default WorkspaceDropdown;
