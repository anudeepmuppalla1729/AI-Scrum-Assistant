import React from "react";
import type { StorySuggestion, EpicSuggestion } from "../../types/prd.types";
import { OutputTree } from "./OutputTree";
import type { usePRDSelection } from "../../hooks/usePRDSelection";
import { ProcessingOverlay } from "./ProcessingOverlay";

interface OutputPanelProps {
  epics: EpicSuggestion[];
  isLoading: boolean;
  selectionInfo: ReturnType<typeof usePRDSelection>;
  onUpdateEpic?: (index: number, updates: Partial<EpicSuggestion>) => void;
  onUpdateStory?: (
    epicIndex: number,
    storyIndex: number,
    updates: Partial<StorySuggestion>,
  ) => void;
  onOpenModal?: (type: 'Epic' | 'Story' | 'Task', epicIndex: number, storyIndex?: number, taskIndex?: number) => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  epics,
  isLoading,
  selectionInfo,
  onUpdateEpic,
  onUpdateStory,
  onOpenModal,
}) => {
  if (isLoading) {
    return <ProcessingOverlay />;
  }

  if (epics.length === 0) {
    return (
      <div className="empty-state h-full bg-[var(--color-bg-primary)]">
        <div className="empty-state-icon shadow-sm border border-[var(--color-border-light)]">
          <svg className="w-8 h-8 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="empty-state-title">
          AI Suggestions Will Appear Here
        </h3>
        <p className="empty-state-desc">
          Upload a PRD or describe your requirements to begin generating
          structured tickets.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--color-surface)]">
      <div className="p-4 md:p-6 lg:p-8">
        <OutputTree
          epics={epics}
          selectionInfo={selectionInfo}
          onUpdateEpic={onUpdateEpic}
          onUpdateStory={onUpdateStory}
          onOpenModal={onOpenModal}
        />
      </div>
    </div>
  );
};
