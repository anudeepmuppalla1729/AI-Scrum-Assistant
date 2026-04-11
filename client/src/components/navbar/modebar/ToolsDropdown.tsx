import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ToolsDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isToolsActive = location.pathname.startsWith('/tools');

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleNavigation = (path: string) => {
        navigate(path);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-colors border-b-2
                    ${isToolsActive
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                `}
            >
                <span>Tools</span>
                <svg className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-1 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                        <button
                            onClick={() => handleNavigation('/tools/standup')}
                            className={`
                                block w-full text-left px-4 py-2 text-sm
                                ${location.pathname === '/tools/standup' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}
                            `}
                        >
                            Standup Generator
                        </button>
                        <button
                            onClick={() => handleNavigation('/tools/retro')}
                            className={`
                                block w-full text-left px-4 py-2 text-sm
                                ${location.pathname === '/tools/retro' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}
                            `}
                        >
                            Retrospective Generator
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ToolsDropdown;
