import React, { useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
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

    const checkboxRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (checkboxRef.current) {
            checkboxRef.current.indeterminate = isIndeterminate;
        }
    }, [isIndeterminate]);

    return (
        <div className="story-review-item" style={{ border: 'none', background: 'transparent', padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', justifyContent: 'space-between' }}>
                <div className="flex-1 min-w-0" style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {hasTasks ? (
                        <div 
                            className="story-toggle-btn"
                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', cursor: 'pointer', marginTop: '2px' }}
                            onClick={onExpand}
                        >
                            <div className={`chevron-rotate ${isExpanded ? 'rotated' : ''}`}>
                                <ChevronRight style={{ width: 14, height: 14 }} />
                            </div>
                            <span className="badge badge-story" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontSize: '0.6rem' }}>
                                Story
                            </span>
                        </div>
                    ) : (
                        <span className="badge badge-story" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontSize: '0.6rem', marginTop: '2px' }}>
                            Story
                        </span>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <h4
                                onClick={() => onOpenModal && onOpenModal('Story', 0)}
                                style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)', cursor: 'pointer', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                title="Click to view/edit details"
                            >
                                {story.summary || <span style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', fontWeight: 'normal' }}>Empty story summary</span>}
                            </h4>
                            <div className="story-meta" style={{ flexShrink: 0 }}>
                                {story.story_points && (
                                    <span className="story-meta-tag">{story.story_points} pts</span>
                                )}
                                <span>{story.priority || 'Medium'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <label className="toggle-switch" style={{ marginLeft: 'var(--space-4)' }}>
                    <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={onToggle}
                        ref={checkboxRef}
                    />
                    <span className="toggle-slider"></span>
                </label>
            </div>

            {/* Children Tasks */}
            {isExpanded && hasTasks && (
                <div className="collapsible-content expanded" style={{ marginTop: 'var(--space-3)' }}>
                    <div className="subtask-list" style={{ marginLeft: 'var(--space-7)' }}>
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
                </div>
            )}
        </div>
    );
};
