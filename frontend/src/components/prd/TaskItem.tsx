import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, ChevronRight } from 'lucide-react';
import type { TaskSuggestion } from '../../types/prd.types';

interface TaskItemProps {
    task: TaskSuggestion;
    isSelected: boolean;
    onToggle: () => void;
    onUpdate: (updates: Partial<TaskSuggestion>) => void;
    isLast: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, isSelected, onToggle, onUpdate, isLast }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [summary, setSummary] = useState(task.summary);

    // Sync local state if prop changes (e.g. from AI regeneration)
    useEffect(() => {
        setSummary(task.summary);
    }, [task.summary]);

    const handleBlur = () => {
        setIsEditing(false);
        if (summary !== task.summary) {
            onUpdate({ summary });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        }
    };

    return (
        <div className="flex items-start group relative pl-6 py-2 hover:bg-gray-50 rounded-md transition-colors">
            {/* Tree connector line */}
            <div className={`absolute left-[11px] top-0 w-px bg-gray-200 ${isLast ? 'h-5' : 'h-full'}`}></div>
            <div className="absolute left-[11px] top-5 w-3 h-px bg-gray-200"></div>

            <button
                onClick={onToggle}
                className="mt-0.5 mr-3 flex-shrink-0 text-gray-400 hover:text-blue-500 transition-colors focus:outline-none"
            >
                {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-500" />
                ) : (
                    <Square className="w-4 h-4" />
                )}
            </button>

            <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-wider flex-shrink-0">Task</span>
                    {isEditing ? (
                        <input
                            type="text"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="flex-1 text-sm text-gray-900 border-none p-0 focus:ring-0 bg-transparent placeholder-gray-400"
                        />
                    ) : (
                        <span
                            onClick={() => setIsEditing(true)}
                            className="text-sm text-gray-700 truncate cursor-text hover:text-gray-900"
                        >
                            {task.summary}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
