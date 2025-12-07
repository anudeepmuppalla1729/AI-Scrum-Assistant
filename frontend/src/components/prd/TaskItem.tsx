import React from 'react';
import type { TaskSuggestion } from '../../types/prd.types';

interface TaskItemProps {
    task: TaskSuggestion;
    isSelected: boolean;
    onToggle: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, isSelected, onToggle }) => {
    return (
        <div className="flex items-center space-x-3 p-2 ml-4 hover:bg-white/5 rounded-md transition-colors border-l border-white/10">
            <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggle}
                className="w-4 h-4 rounded border-gray-600 text-indigo-500 focus:ring-indigo-500 bg-gray-700"
            />
            <div className="flex-1">
                <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-1 rounded">TASK</span>
                    <span className="text-sm text-gray-200">{task.summary}</span>
                </div>
                {task.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
                )}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${task.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                task.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                }`}>
                {task.priority}
            </span>
        </div>
    );
};
