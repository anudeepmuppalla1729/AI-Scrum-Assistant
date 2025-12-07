import React from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Confirm Push to Jira</h2>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 p-1 rounded-md hover:bg-gray-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <p className="text-xs text-blue-600 uppercase font-bold tracking-wider mb-2">Target Workspace</p>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Board:</span>
                            <span className="font-semibold text-gray-900">{workspace?.boardName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-gray-600">Sprint:</span>
                            <span className="font-semibold text-gray-900">{workspace?.sprintName || 'Active Sprint'}</span>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-900 mb-3">Items to be created:</p>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-gray-600 text-sm">Epics</span>
                                <span className="font-mono font-medium text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm">{counts.epicCount}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-gray-600 text-sm">Stories</span>
                                <span className="font-mono font-medium text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm">{counts.storyCount}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-gray-600 text-sm">Tasks</span>
                                <span className="font-mono font-medium text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm">{counts.taskCount}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-gray-400 mt-0.5" />
                        <p>These items will be created in your Jira project. Hierarchy links (Epic → Story → Task) will be preserved.</p>
                    </div>
                </div>

                <div className="p-5 bg-gray-50 border-t border-gray-100 flex space-x-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm hover:shadow flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>{isLoading ? 'Pushing...' : 'Confirm Push'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
