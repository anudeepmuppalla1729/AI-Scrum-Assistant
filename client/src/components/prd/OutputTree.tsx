import React from 'react';
import type { EpicSuggestion, StorySuggestion } from '../../types/prd.types';
import { EpicSection } from './EpicSection';
import type { usePRDSelection } from '../../hooks/usePRDSelection';

interface OutputTreeProps {
    epics: EpicSuggestion[];
    selectionInfo: ReturnType<typeof usePRDSelection>;
    onUpdateEpic?: (index: number, updates: Partial<EpicSuggestion>) => void;
    onUpdateStory?: (epicIndex: number, storyIndex: number, updates: Partial<StorySuggestion>) => void;
}

export const OutputTree: React.FC<OutputTreeProps> = ({
    epics,
    selectionInfo,
    onUpdateEpic,
    onUpdateStory
}) => {
    const {
        selection,
        expanded,
        toggleEpic,
        toggleStory,
        toggleTask,
        toggleExpand
    } = selectionInfo;

    // Helper to deeply update state via props if provided, or just local state if not (controlled vs uncontrolled)
    // Actually the parent page holds state, so we just pass callbacks up.

    // Note: The previous usePRDSelection logic was good for selection state, 
    // but data Content updates (rename title) need to traverse up to the Page state.

    // We'll create handlers that wrap the prop callbacks.

    return (
        <div className="space-y-4">
            {epics.map((epic, index) => (
                <EpicSection
                    key={index}
                    epic={epic}
                    epicIndex={index}
                    isSelected={!!selection[index]?.selected}
                    isExpanded={!!expanded[`epic-${index}`]}
                    selectionInfo={selectionInfo}
                    onToggle={() => toggleEpic(index)}
                    onToggleStory={(storyIndex) => toggleStory(index, storyIndex)}
                    onToggleTask={(storyIndex, taskIndex) => toggleTask(index, storyIndex, taskIndex)}
                    onExpand={() => toggleExpand(`epic-${index}`)}
                    onExpandStory={(id) => toggleExpand(id)}

                    onUpdate={(updates) => onUpdateEpic && onUpdateEpic(index, updates)}
                    onUpdateStory={(storyIndex, updates) => onUpdateStory && onUpdateStory(index, storyIndex, updates)}
                    onUpdateTask={(storyIndex, taskIndex, updates) => {
                        // Need a way to update tasks deeply. 
                        // For now we can leverage onUpdateStory if we treat tasks as part of story data structure,
                        // OR we might need a dedicated onUpdateTask prop from parent.
                        // Let's assume onUpdateStory can handle merging sub_issues logic if we construct it right,
                        // OR we add a specific handler.
                        // Simplest: pass a generic deep update or specialized.
                        // Let's modify onUpdateStory to just update the story object which contains sub_issues.

                        const story = epic.issues[storyIndex];
                        const newSubIssues = [...story.sub_issues];
                        newSubIssues[taskIndex] = { ...newSubIssues[taskIndex], ...updates };
                        if (onUpdateStory) onUpdateStory(index, storyIndex, { sub_issues: newSubIssues });
                    }}
                />
            ))}
        </div>
    );
};
