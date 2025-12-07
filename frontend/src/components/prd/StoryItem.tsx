import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Edit2, Check, X } from 'lucide-react';
import type { StorySuggestion } from '../../types/prd.types';
import { TaskItem } from './TaskItem';

interface StoryItemProps {
    story: StorySuggestion;
    isSelected: boolean;
    isExpanded: boolean;
    selectionState: { [taskIndex: number]: boolean };
    onToggle: () => void;
    onToggleTask: (taskIndex: number) => void;
    onExpand: () => void;
    onUpdate: (updates: Partial<StorySuggestion>) => void;
}

export const StoryItem: React.FC<StoryItemProps> = ({
    story,
    isSelected,
    isExpanded,
    selectionState,
    onToggle,
    onToggleTask,
    onExpand,
    onUpdate
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [summary, setSummary] = useState(story.summary);
    const [points, setPoints] = useState(story.story_points);

    const handleSave = () => {
        onUpdate({ summary, story_points: points });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setSummary(story.summary);
        setPoints(story.story_points);
        setIsEditing(false);
    };

    return (
        <div className="ml-4 mt-2">
            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-white/5 transition-colors group">
                <button onClick={onExpand} className="p-0.5 hover:bg-white/10 rounded">
                    {isExpanded ?
                        <ChevronDown className="w-4 h-4 text-gray-400" /> :
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    }
                </button>

                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggle}
                    className="w-4 h-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500 bg-gray-700"
                />

                <div className="flex-1">
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-purple-400 bg-purple-400/10 px-1 rounded">STORY</span>
                        {isEditing ? (
                            <div className="flex items-center space-x-2 w-full">
                                <input
                                    type="text"
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-purple-500 text-sm flex-1"
                                />
                                <input
                                    type="number"
                                    value={points}
                                    onChange={(e) => setPoints(Number(e.target.value))}
                                    className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-purple-500 text-sm w-16"
                                />
                            </div>
                        ) : (
                            <>
                                <span className="text-sm font-medium text-gray-200">{story.summary}</span>
                                <span className="text-xs text-gray-500">({story.story_points} pts)</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {isEditing ? (
                        <>
                            <button onClick={handleSave} className="p-1 hover:bg-green-500/20 text-green-400 rounded">
                                <Check className="w-4 h-4" />
                            </button>
                            <button onClick={handleCancel} className="p-1 hover:bg-red-500/20 text-red-400 rounded">
                                <X className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="p-1 hover:bg-white/10 text-gray-400 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="ml-6 border-l-2 border-white/5 space-y-1 mt-1">
                    {story.sub_issues.map((task, idx) => (
                        <TaskItem
                            key={idx}
                            task={task}
                            isSelected={selectionState[idx] || false}
                            onToggle={() => onToggleTask(idx)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
