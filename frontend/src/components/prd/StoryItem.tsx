import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, ChevronRight, ChevronDown, Check } from 'lucide-react';
import type { StorySuggestion, TaskSuggestion } from '../../types/prd.types';
import { TaskItem } from './TaskItem';

interface StoryItemProps {
    story: StorySuggestion;
    isSelected: boolean;
    isExpanded: boolean;
    selectionState: { selected: boolean; tasks: Record<number, boolean> };
    onToggle: () => void;
    onToggleTask: (taskIndex: number) => void;
    onExpand: () => void;
    onUpdate: (updates: Partial<StorySuggestion>) => void;
    onUpdateTask: (taskIndex: number, updates: Partial<TaskSuggestion>) => void;
    isLast: boolean;
}

export const StoryItem: React.FC<StoryItemProps> = ({
    story,
    isSelected,
    isExpanded,
    selectionState,
    onToggle,
    onToggleTask,
    onExpand,
    onUpdate,
    onUpdateTask,
    isLast
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [summary, setSummary] = useState(story.summary);

    useEffect(() => {
        setSummary(story.summary);
    }, [story.summary]);

    const handleBlur = () => {
        setIsEditing(false);
        if (summary !== story.summary) {
            onUpdate({ summary });
        }
    };

    const hasTasks = story.sub_issues && story.sub_issues.length > 0;

    // Determine partial selection state
    const selectedTaskCount = Object.values(selectionState.tasks || {}).filter(Boolean).length;
    const isIndeterminate = !isSelected && selectedTaskCount > 0 && selectedTaskCount < (story.sub_issues?.length || 0);

    return (
        <div className="relative">
            {/* Tree connector line */}
            <div className={`absolute left-[11px] top-0 w-px bg-gray-200 ${isLast && !isExpanded ? 'h-6' : 'h-full'}`}></div>

            <div className={`
                flex items-start group relative py-2 pl-2 pr-2 rounded-lg transition-all duration-200
                ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'}
            `}>
                {/* Horizontal connector to parent */}
                <div className="absolute left-[-13px] top-5 w-4 h-px bg-gray-200"></div>

                <div className="flex items-center mt-0.5 mr-2">
                    <button
                        onClick={onExpand}
                        disabled={!hasTasks}
                        className={`p-0.5 rounded-md transition-colors ${hasTasks ? 'hover:bg-gray-200 text-gray-500' : 'text-transparent'}`}
                    >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <button
                        onClick={onToggle}
                        className="ml-1 text-gray-400 hover:text-blue-500 transition-colors focus:outline-none relative"
                    >
                        {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-500" />
                        ) : isIndeterminate ? (
                            <div className="relative w-4 h-4">
                                <Square className="w-4 h-4" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-blue-500 rounded-sm"></div>
                                </div>
                            </div>
                        ) : (
                            <Square className="w-4 h-4" />
                        )}
                    </button>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wide">
                            Story
                        </span>
                        <div className="flex-1 min-w-0">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    onBlur={handleBlur}
                                    autoFocus
                                    className="w-full text-sm font-medium text-gray-900 border-none p-0 focus:ring-0 bg-transparent"
                                />
                            ) : (
                                <h4
                                    onClick={() => setIsEditing(true)}
                                    className="text-sm font-medium text-gray-900 truncate cursor-text"
                                >
                                    {story.summary}
                                </h4>
                            )}
                        </div>
                        <div className="flex items-center text-xs text-gray-400 space-x-3">
                            {story.story_points && (
                                <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 font-medium">
                                    {story.story_points} pts
                                </span>
                            )}
                            <span>{story.priority || 'Medium'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Children Tasks */}
            {isExpanded && hasTasks && (
                <div className="ml-6 pl-2 border-l border-transparent"> {/* Offset for children */}
                    {story.sub_issues.map((task, index) => (
                        <TaskItem
                            key={index}
                            task={task}
                            isSelected={!!selectionState.tasks?.[index] || isSelected}
                            onToggle={() => onToggleTask(index)}
                            onUpdate={(updates) => onUpdateTask(index, updates)}
                            isLast={index === (story.sub_issues?.length || 0) - 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
