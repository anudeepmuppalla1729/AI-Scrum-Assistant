import React from 'react';
import type { EpicSuggestion } from '../../types/prd.types';
import { EpicSection } from './EpicSection';
import type { SelectionState, ExpandedState } from '../../hooks/usePRDSelection';

interface HierarchyTreeProps {
    epics: EpicSuggestion[];
    selection: SelectionState;
    expanded: ExpandedState;
    onToggleEpic: (epicIndex: number) => void;
    onToggleStory: (epicIndex: number, storyIndex: number) => void;
    onToggleTask: (epicIndex: number, storyIndex: number, taskIndex: number) => void;
    onExpand: (id: string) => void;
    onUpdateEpic: (index: number, updates: Partial<EpicSuggestion>) => void;
    onUpdateStory: (epicIndex: number, storyIndex: number, updates: any) => void;
}

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({
    epics,
    selection,
    expanded,
    onToggleEpic,
    onToggleStory,
    onToggleTask,
    onExpand,
    onUpdateEpic,
    onUpdateStory
}) => {
    if (!epics.length) {
        return (
            <div className="text-center py-12 text-gray-500">
                No suggestions available. Upload a PRD to generate tasks.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {epics.map((epic, epicIndex) => (
                <EpicSection
                    key={epicIndex}
                    epic={epic}
                    epicIndex={epicIndex}
                    isSelected={selection[epicIndex]?.selected || false}
                    isExpanded={expanded[`epic-${epicIndex}`] || false}
                    selectionState={selection[epicIndex] || { stories: {} }}
                    expandedState={expanded}
                    onToggle={() => onToggleEpic(epicIndex)}
                    onToggleStory={(storyIndex) => onToggleStory(epicIndex, storyIndex)}
                    onToggleTask={(storyIndex, taskIndex) => onToggleTask(epicIndex, storyIndex, taskIndex)}
                    onExpand={onExpand}
                    onUpdate={(updates) => onUpdateEpic(epicIndex, updates)}
                    onUpdateStory={(storyIndex, updates) => onUpdateStory(epicIndex, storyIndex, updates)}
                />
            ))}
        </div>
    );
};
