import React, { useState, useRef, useEffect } from "react";

interface ChatInputBarProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

const ChatInputBar: React.FC<ChatInputBarProps> = ({ onSend, disabled }) => {
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = () => {
        if (!input.trim() || disabled) return;
        onSend(input);
        setInput("");
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    return (
        <div className="p-4 bg-white border-t border-gray-200 w-full max-w-4xl mx-auto">
            <div className="relative flex items-end gap-2 bg-white border border-gray-300 rounded-2xl px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message AI Scrum Master..."
                    disabled={disabled}
                    className="w-full max-h-[120px] resize-none border-none focus:ring-0 text-sm py-2 px-1 bg-transparent overflow-y-auto"
                    rows={1}
                />
                <button
                    onClick={handleSubmit}
                    disabled={!input.trim() || disabled}
                    className={`p-2 rounded-lg mb-1 transition-all ${input.trim() && !disabled
                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
                        />
                    </svg>
                </button>
            </div>
            <div className="text-center mt-2 text-xs text-gray-400">
                AI can make mistakes. Check important info.
            </div>
        </div>
    );
};

export default ChatInputBar;
