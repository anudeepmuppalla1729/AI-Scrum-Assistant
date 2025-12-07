import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface GenerateButtonProps {
    onClick: () => void;
    isLoading: boolean;
    disabled?: boolean;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({ onClick, isLoading, disabled }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`
                w-full h-12 flex items-center justify-center space-x-2 rounded-xl font-semibold text-white transition-all duration-200
                ${disabled
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-sm hover:shadow-md active:transform active:scale-[0.98]'
                }
            `}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Thinking...</span>
                </>
            ) : (
                <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate AI Suggestions</span>
                </>
            )}
        </button>
    );
};
