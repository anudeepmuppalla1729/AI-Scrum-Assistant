import React from 'react';
import { Layers } from 'lucide-react';
import type { StorySuggestion, EpicSuggestion } from '../../types/prd.types';
import { OutputTree } from './OutputTree';
import type { usePRDSelection } from '../../hooks/usePRDSelection';

interface OutputPanelProps {
    epics: EpicSuggestion[];
    isLoading: boolean;
    selectionInfo: ReturnType<typeof usePRDSelection>;
    onUpdateEpic?: (index: number, updates: Partial<EpicSuggestion>) => void;
    onUpdateStory?: (epicIndex: number, storyIndex: number, updates: Partial<StorySuggestion>) => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
    epics,
    isLoading,
    selectionInfo,
    onUpdateEpic,
    onUpdateStory
}) => {
    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-gray-400 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                <div className="w-48 h-4 bg-gray-200 rounded"></div>
                <div className="w-32 h-4 bg-gray-200 rounded"></div>
            </div>
        );
    }

    if (epics.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                    <Layers className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    AI Suggestions Will Appear Here
                </h3>
                <p className="text-sm max-w-xs mx-auto">
                    Upload a PRD or describe your requirements to begin generating structured tickets.
                </p>
            </div>
        );
    }


    return (
        <div className="h-full overflow-y-auto pb-24"> {/* pb-24 for sticky footer space */}
            <div className="p-1">
                <OutputTree
                    epics={epics}
                    selectionInfo={selectionInfo}
                    onUpdateEpic={onUpdateEpic}
                    onUpdateStory={onUpdateStory}
                />
            </div>
        </div>
    );
};
