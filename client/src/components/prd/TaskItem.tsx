import React from 'react';
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
        <div className="subtask-item" style={{ border: 'none', background: 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', justifyContent: 'space-between' }}>
                <div className="flex-1 min-w-0" style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <span className="badge badge-task" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontSize: '0.6rem', marginTop: '2px' }}>
                        Task
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <span
                            onClick={() => onOpenModal && onOpenModal()}
                            style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                            title="Click to view/edit details"
                        >
                            {task.summary || <span style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', fontWeight: 'normal' }}>Empty task summary</span>}
                        </span>
                    </div>
                </div>

                <label className="toggle-switch" style={{ marginLeft: 'var(--space-4)' }}>
                    <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={onToggle}
                    />
                    <span className="toggle-slider"></span>
                </label>
            </div>
        </div>
    );
};
