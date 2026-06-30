import React, { useEffect, useRef } from "react";
import type { ChatMessage, PushedBacklogRecord } from "../../types/chat.types";
import MessageBubble from "./MessageBubble";

interface ChatMessagesProps {
    messages: ChatMessage[];
    loading?: boolean;
    sessionId?: string | null;
    pushedSessionItems?: PushedBacklogRecord[];
    onBacklogPushed?: (jiraKey: string, jiraUrl: string) => void;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
    messages,
    loading,
    sessionId,
    pushedSessionItems,
    onBacklogPushed,
}) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    return (
        <div className="chat-messages-container custom-scrollbar">
            {messages.length === 0 && !loading && (
                <div className="chat-empty-state animate-fade-in">
                    <div className="chat-empty-icon">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                    <h3 className="chat-empty-title">How can I help you today?</h3>
                    <p className="chat-empty-desc">Craft PRDs, generate user stories, or ask me about your sprint backlog.</p>
                </div>
            )}
            {messages.map((msg, index) => (
                <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                    <MessageBubble
                        message={msg}
                        sessionId={sessionId}
                        pushedSessionItems={pushedSessionItems}
                        onBacklogPushed={onBacklogPushed}
                    />
                </div>
            ))}

            {loading && (
                <div className="thinking-indicator animate-fade-in">
                    <div className="thinking-bubble">
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                            <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                            <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                        </div>
                        <span>AI is thinking...</span>
                    </div>
                </div>
            )}

            <div ref={bottomRef} className="h-4" />
        </div>
    );
};

export default ChatMessages;
