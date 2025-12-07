import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Layers, Edit2, Check, X } from 'lucide-react';
import type { EpicSuggestion } from '../../types/prd.types';
import { StoryItem } from './StoryItem';

interface EpicSectionProps {
    epic: EpicSuggestion;
    epicIndex: number;
    isSelected: boolean;
    isExpanded: boolean;
    selectionState: {
        stories: {
            [storyIndex: number]: {
                selected: boolean;
                tasks: { [taskIndex: number]: boolean };
            }
        }
    };
    expandedState: { [id: string]: boolean };
    onToggle: () => void;
    onToggleStory: (storyIndex: number) => void;
    onToggleTask: (storyIndex: number, taskIndex: number) => void;
    onExpand: (id: string) => void;
    onUpdate: (updates: Partial<EpicSuggestion>) => void;
    onUpdateStory: (storyIndex: number, updates: any) => void;
}

export const EpicSection: React.FC<EpicSectionProps> = ({
    epic,
    epicIndex,
    isSelected,
    isExpanded,
    selectionState,
    expandedState,
    onToggle,
    onToggleStory,
    onToggleTask,
    onExpand,
    onUpdate,
    onUpdateStory
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(epic.title);

    const handleSave = () => {
        onUpdate({ title });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTitle(epic.title);
        setIsEditing(false);
    };

    return (
        <div className="border border-white/10 rounded-lg bg-gray-900/50 mb-4 overflow-hidden">
            <div className="flex items-center space-x-3 p-4 bg-white/5 border-b border-white/5">
                <button
                    onClick={() => onExpand(`epic-${epicIndex}`)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                    {isExpanded ?
                        <ChevronDown className="w-5 h-5 text-gray-400" /> :
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    }
                </button>

                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggle}
                    className="w-5 h-5 rounded border-gray-600 text-green-500 focus:ring-green-500 bg-gray-700"
                />

                <div className="flex-1">
                    <div className="flex items-center space-x-2">
                        <Layers className="w-4 h-4 text-green-400" />
                        {isEditing ? (
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-sm w-full"
                                autoFocus
                            />
                        ) : (
                            <h3 className="text-sm font-semibold text-gray-100">{epic.title}</h3>
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

                <span className="text-xs text-gray-500 px-2 bg-black/20 rounded">
                    {epic.issues.length} stories
                </span>
            </div>

            {isExpanded && (
                <div className="p-2 bg-black/20">
                    {epic.issues.map((story, storyIdx) => (
                        <StoryItem
                            key={storyIdx}
                            story={story}
                            isSelected={selectionState.stories[storyIdx]?.selected || false}
                            isExpanded={expandedState[`story-${epicIndex}-${storyIdx}`] || false}
                            selectionState={selectionState.stories[storyIdx]?.tasks || {}}
                            onToggle={() => onToggleStory(storyIdx)}
                            onToggleTask={(taskIdx) => onToggleTask(storyIdx, taskIdx)}
                            onExpand={() => onExpand(`story-${epicIndex}-${storyIdx}`)}
                            onUpdate={(updates) => onUpdateStory(storyIdx, updates)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
