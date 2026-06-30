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

    const hasInput = input.trim() && !disabled;

    return (
        <div className="chat-input-wrapper">
            <div className="chat-input-container group">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message AI Scrum Master..."
                    disabled={disabled}
                    className="chat-input-textarea"
                    rows={1}
                />
                <button
                    onClick={handleSubmit}
                    disabled={!hasInput}
                    className={`chat-input-send ${hasInput ? "active hover-lift hover-glow" : "disabled"}`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
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
            <div className="chat-input-footer">
                AI can make mistakes. Check important info.
            </div>
        </div>
    );
};

export default ChatInputBar;
