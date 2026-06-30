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
            className="dropdown shadow-lg left-0 top-[120%] border border-[var(--color-border)] bg-[var(--color-surface)]"
        >
            <div className="py-1">
                <button
                    className="dropdown-item"
                    onClick={() => {
                        navigate('/workspace');
                        onClose();
                    }}
                >
                    <svg className="w-4 h-4 mr-2 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Switch Workspace
                </button>
            </div>
        </div>
    );
};

export default WorkspaceDropdown;
