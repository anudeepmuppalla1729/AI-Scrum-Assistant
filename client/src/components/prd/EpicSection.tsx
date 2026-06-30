import React, { useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
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

    const checkboxRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (checkboxRef.current) {
            checkboxRef.current.indeterminate = isIndeterminate;
        }
    }, [isIndeterminate]);

    return (
        <div className="epic-card">
            {/* Header / Epic Card */}
            <div className="epic-card-header" style={{ borderBottom: isExpanded ? '1px solid var(--color-border-light)' : 'none', alignItems: 'center' }}>
                <div 
                    className="flex-1 min-w-0" 
                    style={{ display: 'flex', gap: 'var(--space-3)' }}
                    onClick={(e) => {
                        // Prevent expanding if they clicked the title specifically
                        if ((e.target as HTMLElement).closest('h3')) return;
                        onExpand();
                    }}
                >
                    <div className={`chevron-rotate ${isExpanded ? 'rotated' : ''}`} style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-tertiary)' }}>
                        <ChevronRight style={{ width: 20, height: 20 }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                            <span className="badge badge-epic" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontSize: '0.65rem' }}>
                                Epic
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3
                                    onClick={(e) => {
                                        e.stopPropagation(); // prevent expand
                                        if (onOpenModal) onOpenModal('Epic', epicIndex);
                                    }}
                                    style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    title="Click to view/edit details"
                                >
                                    {epic.title || <span style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', fontWeight: 'normal' }}>Empty epic title</span>}
                                </h3>
                            </div>
                        </div>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 'var(--space-1)' }}>
                            {epic.description}
                        </p>
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

            {/* Stories List */}
            {isExpanded && hasStories && (
                <div style={{ borderTop: '1px solid var(--color-border-light)' }}>
                    {epic.issues.map((story, storyIndex) => (
                        <div key={storyIndex} style={{ borderBottom: storyIndex < epic.issues.length - 1 ? '1px solid var(--color-border-light)' : 'none' }}>
                            <StoryItem
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
                        </div>
                    ))}
                </div>
            )}

            {isExpanded && !hasStories && (
                <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
                    No user stories generated for this epic.
                </div>
            )}
        </div>
    );
};
