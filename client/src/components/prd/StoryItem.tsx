import React from 'react';
import { CheckSquare, Square, ChevronRight, ChevronDown } from 'lucide-react';
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
    onOpenModal?: (type: 'Story' | 'Task', dummy1: number, dummy2?: number, taskIndex?: number) => void;
}

export const StoryItem: React.FC<StoryItemProps> = ({
    story,
    isSelected,
    isExpanded,
    selectionState,
    onToggle,
    onToggleTask,
    onExpand,
    onUpdateTask,
    isLast,
    onOpenModal
}) => {
    const hasTasks = story.sub_issues && story.sub_issues.length > 0;

    // Determine partial selection state
    const selectedTaskCount = Object.values(selectionState.tasks || {}).filter(Boolean).length;
    const isIndeterminate = !isSelected && selectedTaskCount > 0 && selectedTaskCount < (story.sub_issues?.length || 0);

    return (
        <div className="relative">
            {/* Tree connector line */}
            <div className={`absolute left-[11px] top-0 w-[1px] bg-[var(--color-border)] ${isLast && !isExpanded ? 'h-6' : 'h-full'}`}></div>

            <div className={`
                flex items-start group relative py-2 pl-2 pr-2 rounded-lg transition-all duration-200
                ${isSelected ? 'bg-[var(--color-accent-lighter)]' : 'hover:bg-[var(--color-bg-secondary)]'}
            `}>
                {/* Horizontal connector to parent */}
                <div className="absolute left-[-13px] top-5 w-4 h-[1px] bg-[var(--color-border)]"></div>

                <div className="flex items-center mt-0.5 mr-2">
                    <button
                        onClick={onExpand}
                        disabled={!hasTasks}
                        className={`p-0.5 rounded-md transition-colors ${hasTasks ? 'hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]' : 'text-transparent'}`}
                    >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <button
                        onClick={onToggle}
                        className="ml-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors focus:outline-none relative"
                    >
                        {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[var(--color-accent)]" />
                        ) : isIndeterminate ? (
                            <div className="relative w-4 h-4">
                                <Square className="w-4 h-4" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-[var(--color-accent)] rounded-sm"></div>
                                </div>
                            </div>
                        ) : (
                            <Square className="w-4 h-4" />
                        )}
                    </button>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="badge badge-accent uppercase tracking-wide">
                            Story
                        </span>
                        <div className="flex-1 min-w-0">
                            <h4
                                onClick={() => onOpenModal && onOpenModal('Story', 0)}
                                className="text-sm font-medium text-[var(--color-text-primary)] truncate cursor-pointer hover:text-[var(--color-accent)] transition-colors min-h-[20px]"
                                title="Click to view/edit details"
                            >
                                {story.summary || <span className="text-[var(--color-text-tertiary)] italic font-normal">Empty story summary</span>}
                            </h4>
                        </div>
                        <div className="flex items-center text-xs text-[var(--color-text-tertiary)] gap-3 shrink-0">
                            {story.story_points && (
                                <span className="badge badge-neutral whitespace-nowrap">
                                    {story.story_points} pts
                                </span>
                            )}
                            <span className="whitespace-nowrap">{story.priority || 'Medium'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Children Tasks */}
            {isExpanded && hasTasks && (
                <div className="ml-6 pl-2 border-l border-transparent"> {/* Offset for children */}
                    {story.sub_issues.map((task, index) => {
                        const isTaskSelected = selectionState?.tasks?.[index];
                        return (
                            <TaskItem
                                key={index}
                                task={task}
                                isSelected={isTaskSelected !== undefined ? isTaskSelected : isSelected}
                                onToggle={() => onToggleTask(index)}
                                onUpdate={(updates) => onUpdateTask(index, updates)}
                                onOpenModal={() => onOpenModal && onOpenModal('Task', 0, 0, index)}
                                isLast={index === (story.sub_issues?.length || 0) - 1}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};
