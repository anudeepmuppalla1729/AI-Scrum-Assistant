import React from "react";
import ChatContainer from "../components/chat/ChatContainer";

const ChatPage: React.FC = () => {
    return (
        <div className="h-screen w-full bg-gray-50 p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-2xl h-[80vh]">
                <ChatContainer />
            </div>
        </div>
    );
};

export default ChatPage;
