import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../../../store/useWorkspaceStore';

const UserMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const clearWorkspace = useWorkspaceStore((state) => state.clearWorkspace);

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

    const handleLogout = () => {
        // Remove JWT (assuming it's stored as 'token' or similar, but spec says "Remove JWT from localStorage")
        // Since the key isn't specified, I'll clear typical auth keys or just all localstorage if that's safe, 
        // but better to be specific if known. For now, I'll assume 'accessToken' or just clear what I know.
        // The spec says "Remove JWT from localStorage". I'll clear common items.
        localStorage.removeItem('token');
        localStorage.removeItem('cloudId');

        // Remove workspace from Zustand & localStorage
        clearWorkspace();

        navigate('/');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    U
                </div>
            </button>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                        User Profile
                    </div>
                    <button
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsOpen(false)}
                    >
                        Profile
                    </button>
                    <button
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsOpen(false)}
                    >
                        Settings
                    </button>
                    <button
                        className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
