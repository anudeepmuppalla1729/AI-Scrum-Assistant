import React, { useState, useEffect } from 'react';
import { Layers, ChevronRight, ChevronDown, CheckSquare, Square } from 'lucide-react';
import type { EpicSuggestion, StorySuggestion, TaskSuggestion } from '../../types/prd.types';
import { StoryItem } from './StoryItem';
import { usePRDSelection } from '../../hooks/usePRDSelection';

interface EpicSectionProps {
    epic: EpicSuggestion;
    epicIndex: number;
    isSelected: boolean;
    isExpanded: boolean;
    selectionInfo: ReturnType<typeof usePRDSelection>;
    onToggle: () => void;
    onToggleStory: (storyIndex: number) => void;
    onToggleTask: (storyIndex: number, taskIndex: number) => void;
    onExpand: () => void;
    onExpandStory: (id: string) => void;
    onUpdate: (updates: Partial<EpicSuggestion>) => void;
    onUpdateStory: (storyIndex: number, updates: Partial<StorySuggestion>) => void;
    onUpdateTask: (storyIndex: number, taskIndex: number, updates: Partial<TaskSuggestion>) => void;
}

export const EpicSection: React.FC<EpicSectionProps> = ({
    epic,
    epicIndex,
    isSelected,
    isExpanded,
    selectionInfo,
    onToggle,
    onToggleStory,
    onToggleTask,
    onExpand,
    onExpandStory,
    onUpdate,
    onUpdateStory,
    onUpdateTask
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(epic.title);

    useEffect(() => {
        setTitle(epic.title);
    }, [epic.title]);

    const handleBlur = () => {
        setIsEditing(false);
        if (title !== epic.title) {
            onUpdate({ title });
        }
    };

    const hasStories = epic.issues && epic.issues.length > 0;

    // Calculate intermediate state
    const selectedStoryCount = Object.values(selectionInfo.selection[epicIndex]?.stories || {}).filter(s => s.selected).length;
    const isIndeterminate = !isSelected && selectedStoryCount > 0 && selectedStoryCount < epic.issues.length;

    return (
        <div className="mb-4 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
            {/* Header / Epic Card */}
            <div className={`
                p-4 flex items-start space-x-3 
                ${isExpanded ? 'bg-gray-50/50 border-b border-gray-100' : 'bg-white'}
                transition-colors
            `}>
                <button
                    onClick={onExpand}
                    className="mt-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Epic
                        </span>
                        <div className="flex-1">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onBlur={handleBlur}
                                    autoFocus
                                    className="w-full text-base font-semibold text-gray-900 border-none p-0 focus:ring-0 bg-transparent"
                                />
                            ) : (
                                <h3
                                    onClick={() => setIsEditing(true)}
                                    className="text-base font-semibold text-gray-900 truncate cursor-text hover:text-blue-600 transition-colors"
                                >
                                    {epic.title}
                                </h3>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 pl-1">
                        {epic.description}
                    </p>
                </div>

                <button
                    onClick={onToggle}
                    className="mt-1 text-gray-400 hover:text-blue-500 transition-colors relative"
                >
                    {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-500" />
                    ) : isIndeterminate ? (
                        <div className="relative w-5 h-5">
                            <Square className="w-5 h-5" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div>
                            </div>
                        </div>
                    ) : (
                        <Square className="w-5 h-5" />
                    )}
                </button>
            </div>

            {/* Stories List */}
            {isExpanded && hasStories && (
                <div className="p-2 space-y-1 bg-white">
                    {epic.issues.map((story, storyIndex) => (
                        <StoryItem
                            key={storyIndex}
                            story={story}
                            isSelected={!!selectionInfo.selection[epicIndex]?.stories?.[storyIndex]?.selected}
                            selectionState={selectionInfo.selection[epicIndex]?.stories?.[storyIndex] || { selected: false, tasks: {} }}
                            isExpanded={!!selectionInfo.expanded[`story-${epicIndex}-${storyIndex}`]}
                            onToggle={() => onToggleStory(storyIndex)}
                            onToggleTask={(taskIndex) => onToggleTask(storyIndex, taskIndex)}
                            onExpand={() => onExpandStory(`story-${epicIndex}-${storyIndex}`)}
                            onUpdate={(updates) => onUpdateStory(storyIndex, updates)}
                            onUpdateTask={(taskIndex, updates) => onUpdateTask(storyIndex, taskIndex, updates)}
                            isLast={storyIndex === epic.issues.length - 1}
                        />
                    ))}
                </div>
            )}

            {isExpanded && !hasStories && (
                <div className="p-8 text-center text-gray-400 text-sm">
                    No user stories generated for this epic.
                </div>
            )}
        </div>
    );
};
