import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Workspace {
    boardId: number;
    boardName: string;
    sprintId: number;
    sprintName: string;
}

interface WorkspaceState {
    workspace: Workspace | null;
    setWorkspace: (workspace: Workspace) => void;
    clearWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set) => ({
            workspace: null,
            setWorkspace: (workspace) => set({ workspace }),
            clearWorkspace: () => set({ workspace: null }),
        }),
        {
            name: 'workspace', // key in localStorage
        }
    )
);
