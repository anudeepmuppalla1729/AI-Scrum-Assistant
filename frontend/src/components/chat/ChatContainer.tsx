import React from "react";
import { useChat } from "../../hooks/useChat";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

const ChatContainer: React.FC = () => {
    const { messages, loading, sendMessage } = useChat();

    return (
        <div className="flex flex-col h-full bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
            <div className="bg-blue-600 text-white p-4 font-bold text-lg">
                AI Scrum Assistant
            </div>

            <ChatMessages messages={messages} loading={loading} />

            <ChatInput onSend={sendMessage} disabled={loading} />
        </div>
    );
};

export default ChatContainer;
