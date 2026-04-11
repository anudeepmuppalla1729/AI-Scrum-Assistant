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
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                    Custom Instructions
                </label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={disabled}
                    placeholder="Add optional instructions for the AI, such as:&#10;“Break features into epics and user stories.”&#10;“Prefer vertical slicing.”"
                    className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-sm placeholder:text-gray-400 transition-colors disabled:opacity-50 disabled:bg-gray-50"
                />
            </div>

            <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Generation Settings
                </label>
                <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={options.includeAcceptanceCriteria}
                            onChange={(e) => setOptions({ ...options, includeAcceptanceCriteria: e.target.checked })}
                            disabled={disabled}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        />
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Include acceptance criteria</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={options.estimateStoryPoints}
                            onChange={(e) => setOptions({ ...options, estimateStoryPoints: e.target.checked })}
                            disabled={disabled}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        />
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Automatically estimate story points</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={options.includeSubTasks}
                            onChange={(e) => setOptions({ ...options, includeSubTasks: e.target.checked })}
                            disabled={disabled}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        />
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Include sub-tasks in hierarchy</span>
                    </label>
                </div>
            </div>
        </div>
    );
};
