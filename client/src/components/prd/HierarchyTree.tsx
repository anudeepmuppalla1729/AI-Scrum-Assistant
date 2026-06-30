import React from "react";
import type { EpicSuggestion, StorySuggestion } from "../../types/prd.types";
import { OutputTree } from "./OutputTree";
import type { usePRDSelection } from "../../hooks/usePRDSelection";

interface HierarchyTreeProps {
  epics: EpicSuggestion[];
  selectionInfo: ReturnType<typeof usePRDSelection>;
  onUpdateEpic?: (index: number, updates: Partial<EpicSuggestion>) => void;
  onUpdateStory?: (
    epicIndex: number,
    storyIndex: number,
    updates: Partial<StorySuggestion>,
  ) => void;
}

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({
  epics,
  selectionInfo,
  onUpdateEpic,
  onUpdateStory,
}) => {
  if (!epics.length) {
    return (
      <div className="text-center py-12 text-[var(--color-text-tertiary)]">
        No suggestions available. Upload a PRD to generate tasks.
      </div>
    );
  }

  return (
    <OutputTree
      epics={epics}
      selectionInfo={selectionInfo}
      onUpdateEpic={onUpdateEpic}
      onUpdateStory={onUpdateStory}
    />
  );
};
