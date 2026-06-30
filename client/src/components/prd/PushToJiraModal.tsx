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
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header border-b border-[var(--color-border-light)] flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Confirm Push to Jira</h2>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="btn-ghost btn-icon-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="modal-body pt-6 space-y-6">
                    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-4">
                        <p className="text-xs text-[var(--color-accent)] uppercase font-bold tracking-wider mb-2">Target Workspace</p>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-[var(--color-text-secondary)]">Board:</span>
                            <span className="font-semibold text-[var(--color-text-primary)]">{workspace?.boardName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-[var(--color-text-secondary)]">Sprint:</span>
                            <span className="font-semibold text-[var(--color-text-primary)]">{workspace?.sprintName || 'Active Sprint'}</span>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Items to be created:</p>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-3 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-light)]">
                                <span className="text-[var(--color-text-secondary)] text-sm">Epics</span>
                                <span className="font-mono font-medium text-[var(--color-text-primary)] bg-[var(--color-surface)] px-2 py-0.5 rounded border border-[var(--color-border)] shadow-sm">{counts.epicCount}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-light)]">
                                <span className="text-[var(--color-text-secondary)] text-sm">Stories</span>
                                <span className="font-mono font-medium text-[var(--color-text-primary)] bg-[var(--color-surface)] px-2 py-0.5 rounded border border-[var(--color-border)] shadow-sm">{counts.storyCount}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-light)]">
                                <span className="text-[var(--color-text-secondary)] text-sm">Tasks</span>
                                <span className="font-mono font-medium text-[var(--color-text-primary)] bg-[var(--color-surface)] px-2 py-0.5 rounded border border-[var(--color-border)] shadow-sm">{counts.taskCount}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 text-xs text-[var(--color-text-tertiary)] bg-[var(--color-bg-secondary)] p-3 rounded-lg">
                        <AlertCircle className="w-4 h-4 shrink-0 text-[var(--color-text-tertiary)] mt-0.5" />
                        <p>These items will be created in your Jira project. Hierarchy links (Epic → Story → Task) will be preserved.</p>
                    </div>
                </div>

                <div className="modal-footer bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-light)]">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="btn btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="btn btn-primary"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>{isLoading ? 'Pushing...' : 'Confirm Push'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
