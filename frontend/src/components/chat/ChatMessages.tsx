import React, { useEffect, useRef } from "react";
import type { ChatMessage } from "../../types/chat.types";
import MessageBubble from "./MessageBubble";

interface ChatMessagesProps {
    messages: ChatMessage[];
    loading?: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, loading }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    return (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {messages.map((msg, index) => (
                <MessageBubble key={index} message={msg} />
            ))}

            {loading && (
                <div className="flex w-full mb-4 justify-start">
                    <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-2xl rounded-bl-none text-sm italic">
                        AI is thinking...
                    </div>
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    );
};

export default ChatMessages;
