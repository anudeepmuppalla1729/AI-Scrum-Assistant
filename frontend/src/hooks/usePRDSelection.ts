import { useState, useCallback } from 'react';
import type { EpicSuggestion } from '../types/prd.types';

export interface SelectionState {
    [epicIndex: number]: {
        selected: boolean;
        stories: {
            [storyIndex: number]: {
                selected: boolean;
                tasks: {
                    [taskIndex: number]: boolean;
                };
            };
        };
    };
}

export type ExpandedState = {
    [id: string]: boolean; // format: "epic-0", "story-0-1"
};

export const usePRDSelection = (epics: EpicSuggestion[]) => {
    const [selection, setSelection] = useState<SelectionState>({});
    const [expanded, setExpanded] = useState<ExpandedState>({});

    // Initialize selection state when epics are loaded
    const initializeSelection = useCallback((newEpics: EpicSuggestion[]) => {
        const initialState: SelectionState = {};
        newEpics.forEach((epic, epicIndex) => {
            initialState[epicIndex] = {
                selected: true,
                stories: {}
            };
            epic.issues.forEach((story, storyIndex) => {
                initialState[epicIndex].stories[storyIndex] = {
                    selected: true,
                    tasks: {}
                };
                story.sub_issues.forEach((_, taskIndex) => {
                    initialState[epicIndex].stories[storyIndex].tasks[taskIndex] = true;
                });
            });
        });
        setSelection(initialState);

        // Auto-expand first epic
        if (newEpics.length > 0) {
            setExpanded({ 'epic-0': true });
        }
    }, []);

    const toggleEpic = (epicIndex: number) => {
        setSelection(prev => {
            const newState = { ...prev };
            const isSelected = !newState[epicIndex]?.selected;

            newState[epicIndex] = {
                selected: isSelected,
                stories: {}
            };

            // Cascade to children
            epics[epicIndex].issues.forEach((story, storyIndex) => {
                newState[epicIndex].stories[storyIndex] = {
                    selected: isSelected,
                    tasks: {}
                };
                story.sub_issues.forEach((_, taskIndex) => {
                    newState[epicIndex].stories[storyIndex].tasks[taskIndex] = isSelected;
                });
            });

            return newState;
        });
    };

    const toggleStory = (epicIndex: number, storyIndex: number) => {
        setSelection(prev => {
            const newState = { ...prev };
            const isSelected = !newState[epicIndex].stories[storyIndex]?.selected;

            // Toggle story
            newState[epicIndex].stories[storyIndex] = {
                selected: isSelected,
                tasks: {}
            };

            // Cascade to tasks
            epics[epicIndex].issues[storyIndex].sub_issues.forEach((_, taskIndex) => {
                newState[epicIndex].stories[storyIndex].tasks[taskIndex] = isSelected;
            });

            // Check parent Epic state (optional: could auto-uncheck parent if child unchecked)
            // For now, allow mixed states where parent remains "selected" even if some children are not.
            // But strict hierarchy usually implies parent is container. 
            // We'll keep it simple: Parent selection is manual or strictly "downward" propogating.

            return newState;
        });
    };

    const toggleTask = (epicIndex: number, storyIndex: number, taskIndex: number) => {
        setSelection(prev => {
            const newState = { ...prev };
            const currentVal = newState[epicIndex].stories[storyIndex].tasks[taskIndex];
            newState[epicIndex].stories[storyIndex].tasks[taskIndex] = !currentVal;
            return newState;
        });
    };

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const getSelectedCounts = () => {
        let epicCount = 0;
        let storyCount = 0;
        let taskCount = 0;

        Object.entries(selection).forEach(([_, epicState]) => {
            if (epicState.selected) epicCount++;
            // Iterate over values to avoid string key issues
            Object.values(epicState.stories).forEach((storyState: any) => {
                if (storyState.selected) storyCount++;
                Object.values(storyState.tasks).forEach((isSelected) => {
                    if (isSelected) taskCount++;
                });
            });
        });

        return { epicCount, storyCount, taskCount };
    };

    return {
        selection,
        expanded,
        initializeSelection,
        toggleEpic,
        toggleStory,
        toggleTask,
        toggleExpand,
        getSelectedCounts
    };
};
