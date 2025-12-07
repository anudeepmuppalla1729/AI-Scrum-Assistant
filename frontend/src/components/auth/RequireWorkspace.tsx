import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

const RequireWorkspace: React.FC = () => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // If workspace is missing in store, try to re-hydrate from localStorage explicitly
        // (Though persist middleware usually does this, manual check ensures safety)
        if (!workspace) {
            const stored = localStorage.getItem('workspace');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (parsed && parsed.state && parsed.state.workspace) {
                        // Zustand persist storage structure
                        setWorkspace(parsed.state.workspace);
                    } else if (parsed && parsed.boardId) {
                        // Fallback for direct storage if we changed format
                        setWorkspace(parsed);
                    }
                } catch (e) {
                    console.error("Failed to parse workspace from storage", e);
                }
            }
        }
        setIsChecking(false);
    }, [workspace, setWorkspace]);

    if (isChecking) {
        return <div>Loading workspace...</div>; // Or a spinner
    }

    if (!workspace) {
        // Authenticated but no workspace -> go to selection
        return <Navigate to="/workspace" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default RequireWorkspace;
