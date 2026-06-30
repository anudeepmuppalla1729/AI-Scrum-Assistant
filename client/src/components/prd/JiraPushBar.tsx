import React from "react";
import { UploadCloud, ArrowRight } from "lucide-react";

interface JiraPushBarProps {
  counts: { epicCount: number; storyCount: number; taskCount: number };
  onPush: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const JiraPushBar: React.FC<JiraPushBarProps> = ({
  counts,
  onPush,
  isLoading,
  disabled,
}) => {
  const totalSelected = counts.epicCount + counts.storyCount + counts.taskCount;

  if (totalSelected === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 glass-panel border-t-0 rounded-none z-[var(--z-sticky)]">
      <div className="flex items-center justify-between max-w-full mx-auto flex-wrap gap-4">
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-[var(--color-text-tertiary)] font-semibold uppercase tracking-wider truncate">
            Selected Items
          </span>
          <div className="flex items-center text-sm font-medium text-[var(--color-text-primary)] gap-1">
            <span>{counts.epicCount} Epics</span>
            <span className="text-[var(--color-text-tertiary)]">•</span>
            <span>{counts.storyCount} Stories</span>
            <span className="text-[var(--color-text-tertiary)]">•</span>
            <span>{counts.taskCount} Tasks</span>
          </div>
        </div>

        <button
          onClick={onPush}
          disabled={disabled || isLoading}
          className="btn btn-primary"
        >
          {isLoading ? (
            <span>Pushing...</span>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              <span>Push to Jira</span>
              <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
