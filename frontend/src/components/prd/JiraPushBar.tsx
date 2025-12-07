import React from 'react';
import { UploadCloud, ArrowRight } from 'lucide-react';

interface JiraPushBarProps {
    counts: { epicCount: number; storyCount: number; taskCount: number };
    onPush: () => void;
    isLoading: boolean;
    disabled?: boolean;
}

export const JiraPushBar: React.FC<JiraPushBarProps> = ({ counts, onPush, isLoading, disabled }) => {
    const totalSelected = counts.epicCount + counts.storyCount + counts.taskCount;

    if (totalSelected === 0) return null;

    return (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 shadow-lg animate-in slide-in-from-bottom-4 duration-300 z-10">
            <div className="flex items-center justify-between max-w-full mx-auto">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                        Selected Items
                    </span>
                    <div className="flex items-center text-sm font-medium text-gray-900 space-x-1">
                        <span>{counts.epicCount} Epics</span>
                        <span className="text-gray-300">•</span>
                        <span>{counts.storyCount} Stories</span>
                        <span className="text-gray-300">•</span>
                        <span>{counts.taskCount} Tasks</span>
                    </div>
                </div>

                <button
                    onClick={onPush}
                    disabled={disabled || isLoading}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
