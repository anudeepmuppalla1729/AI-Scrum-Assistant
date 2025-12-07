import { useState, useCallback } from "react";
import type { ChatMessage } from "../types/chat.types";
import { v4 as uuidv4 } from "uuid";

const CHAT_API_URL = "/api/v1/scrum/chat";

export const useChat = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track processed session IDs if needed, or just appending logic
    // For now, we mainly just need to append messages.

    const sendMessage = useCallback(async (text: string, workspace?: { boardId: string; sprintId: string }) => {
        if (!text.trim()) return;

        // Optimistic append
        const tempId = uuidv4();
        const userMessage: ChatMessage = {
            id: tempId,
            role: "user",
            content: text,
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No authorization token found.");
            }

            const body: any = { message: text };
            if (workspace) {
                body.workspace = workspace;
            }

            const response = await fetch(CHAT_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Error ${response.status}: Failed to send message`);
            }

            const data = await response.json();

            // Expected backend response: { reply: string, sessionId?: string, ... }
            if (data.reply) {
                const aiMessage: ChatMessage = {
                    id: uuidv4(),
                    role: "assistant",
                    content: data.reply,
                    createdAt: new Date().toISOString(),
                    meta: data,
                };
                setMessages((prev) => [...prev, aiMessage]);
            }
        } catch (err: any) {
            console.error("Chat error:", err);
            setError(err.message || "Something went wrong talking to the AI.");
        } finally {
            setLoading(false);
        }
    }, []);

    const resetError = useCallback(() => {
        setError(null);
    }, []);

    const clearChat = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    return {
        messages,
        loading,
        error,
        sendMessage,
        resetError,
        clearChat,
    };
};
