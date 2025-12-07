import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

interface PushToJiraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
    counts: { epicCount: number; storyCount: number; taskCount: number };
}

export const PushToJiraModal: React.FC<PushToJiraModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    counts
}) => {
    const { workspace } = useWorkspaceStore();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-900 border border-white/10 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <h2 className="text-lg font-semibold text-white">Confirm Push to Jira</h2>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-xs text-blue-400 uppercase font-semibold mb-1">Destination</p>
                        <p className="text-sm text-white">Board: <span className="font-medium">{workspace?.boardName}</span></p>
                        <p className="text-sm text-white">Sprint: <span className="font-medium">{workspace?.sprintName || 'Active Sprint'}</span></p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-400 mb-2">You are about to create:</p>
                        <ul className="space-y-2">
                            <li className="flex justify-between text-sm">
                                <span className="text-gray-300">Epics</span>
                                <span className="font-mono text-white bg-white/10 px-2 rounded">{counts.epicCount}</span>
                            </li>
                            <li className="flex justify-between text-sm">
                                <span className="text-gray-300">Stories</span>
                                <span className="font-mono text-white bg-white/10 px-2 rounded">{counts.storyCount}</span>
                            </li>
                            <li className="flex justify-between text-sm">
                                <span className="text-gray-300">Tasks</span>
                                <span className="font-mono text-white bg-white/10 px-2 rounded">{counts.taskCount}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="p-4 bg-white/5 flex space-x-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>{isLoading ? 'Pushing...' : 'Confirm Push'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
