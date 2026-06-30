import React from 'react';
import { ChevronRight, ChevronDown, CheckSquare, Square } from 'lucide-react';
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
    onOpenModal?: (type: 'Epic' | 'Story' | 'Task', epicIndex: number, storyIndex?: number, taskIndex?: number) => void;
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
    onUpdateStory,
    onUpdateTask,
    onOpenModal
}) => {
    const hasStories = epic.issues && epic.issues.length > 0;

    // Calculate intermediate state
    const selectedStoryCount = Object.values(selectionInfo.selection[epicIndex]?.stories || {}).filter(s => s.selected).length;
    const isIndeterminate = !isSelected && selectedStoryCount > 0 && selectedStoryCount < epic.issues.length;

    return (
        <div className="card mb-4 overflow-hidden">
            {/* Header / Epic Card */}
            <div className={`
                p-4 flex items-start gap-3 
                ${isExpanded ? 'bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-light)]' : 'bg-[var(--color-surface)]'}
                transition-colors
            `}>
                <button
                    onClick={onExpand}
                    className="mt-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="badge badge-accent uppercase tracking-wider">
                            Epic
                        </span>
                        <div className="flex-1 min-w-0">
                            <h3
                                onClick={() => onOpenModal && onOpenModal('Epic', epicIndex)}
                                className="text-base font-semibold text-[var(--color-text-primary)] truncate cursor-pointer hover:text-[var(--color-accent)] transition-colors min-h-[24px] flex items-center gap-2 group/title"
                                title="Click to view/edit details"
                            >
                                {epic.title || <span className="text-[var(--color-text-tertiary)] italic font-normal">Empty epic title</span>}
                            </h3>
                        </div>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 pl-1">
                        {epic.description}
                    </p>
                </div>

                <button
                    onClick={onToggle}
                    className="mt-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors relative"
                >
                    {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-[var(--color-accent)]" />
                    ) : isIndeterminate ? (
                        <div className="relative w-5 h-5">
                            <Square className="w-5 h-5" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2.5 h-2.5 bg-[var(--color-accent)] rounded-sm"></div>
                            </div>
                        </div>
                    ) : (
                        <Square className="w-5 h-5" />
                    )}
                </button>
            </div>

            {/* Stories List */}
            {isExpanded && hasStories && (
                <div className="p-2 space-y-1 bg-[var(--color-surface)]">
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
                            onOpenModal={(type, _, storyIdx, taskIdx) => onOpenModal && onOpenModal(type, epicIndex, storyIdx !== undefined ? storyIdx : storyIndex, taskIdx)}
                            isLast={storyIndex === epic.issues.length - 1}
                        />
                    ))}
                </div>
            )}

            {isExpanded && !hasStories && (
                <div className="p-8 text-center text-[var(--color-text-tertiary)] text-sm">
                    No user stories generated for this epic.
                </div>
            )}
        </div>
    );
};
