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
            className={`btn btn-lg btn-full ${disabled ? 'btn-secondary' : 'btn-primary'}`}
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
