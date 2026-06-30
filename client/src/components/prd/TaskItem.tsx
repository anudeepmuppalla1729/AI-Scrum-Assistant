import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import type { TaskSuggestion } from '../../types/prd.types';

interface TaskItemProps {
    task: TaskSuggestion;
    isSelected: boolean;
    onToggle: () => void;
    onUpdate: (updates: Partial<TaskSuggestion>) => void;
    isLast: boolean;
    onOpenModal?: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, isSelected, onToggle, isLast, onOpenModal }) => {


    return (
        <div className="flex items-start group relative pl-6 py-2 hover:bg-[var(--color-bg-secondary)] rounded-md transition-colors">
            {/* Tree connector line */}
            <div className={`absolute left-[11px] top-0 w-[1px] bg-[var(--color-border)] ${isLast ? 'h-5' : 'h-full'}`}></div>
            <div className="absolute left-[11px] top-5 w-3 h-[1px] bg-[var(--color-border)]"></div>

            <button
                onClick={onToggle}
                className="mt-0.5 mr-3 shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors focus:outline-none"
            >
                {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-[var(--color-accent)]" />
                ) : (
                    <Square className="w-4 h-4" />
                )}
            </button>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[var(--color-text-tertiary)] uppercase tracking-wider shrink-0">Task</span>
                    <span
                        onClick={() => onOpenModal && onOpenModal()}
                        className="text-sm text-[var(--color-text-secondary)] truncate cursor-pointer hover:text-[var(--color-accent)] flex-1 min-h-[20px] min-w-0"
                        title="Click to view/edit details"
                    >
                        {task.summary || <span className="text-[var(--color-text-tertiary)] italic">Empty task summary</span>}
                    </span>
                </div>
            </div>
        </div>
    );
};
