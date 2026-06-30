import React from 'react';
import type { GeneratorOptions } from '../../hooks/usePRDGenerator';

interface PromptInputProps {
    prompt: string;
    setPrompt: (value: string) => void;
    options: GeneratorOptions;
    setOptions: (options: GeneratorOptions) => void;
    disabled?: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ prompt, setPrompt, options, setOptions, disabled }) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <label className="label">
                    Custom Instructions
                </label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={disabled}
                    placeholder="Add optional instructions for the AI, such as:&#10;“Break features into epics and user stories.”&#10;“Prefer vertical slicing.”"
                    className="textarea"
                />
            </div>

            <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    Generation Settings
                </label>
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={options.includeAcceptanceCriteria}
                            onChange={(e) => setOptions({ ...options, includeAcceptanceCriteria: e.target.checked })}
                            disabled={disabled}
                            className="checkbox"
                        />
                        <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">Include acceptance criteria</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={options.estimateStoryPoints}
                            onChange={(e) => setOptions({ ...options, estimateStoryPoints: e.target.checked })}
                            disabled={disabled}
                            className="checkbox"
                        />
                        <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">Automatically estimate story points</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={options.includeSubTasks}
                            onChange={(e) => setOptions({ ...options, includeSubTasks: e.target.checked })}
                            disabled={disabled}
                            className="checkbox"
                        />
                        <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">Include sub-tasks in hierarchy</span>
                    </label>
                </div>
            </div>
        </div>
    );
};
