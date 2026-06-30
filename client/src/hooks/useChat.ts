import { useState, useCallback, useEffect, useRef } from "react";
import type { ChatMessage } from "../types/chat.types";
import { v4 as uuidv4 } from "uuid";

const CHAT_API_URL = "/api/v1/scrum/chat";

export const useChat = (
  sessionId?: string | null,
  onTitleChange?: (newTitle: string) => void,
) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track active fetch requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch messages when sessionId changes
  useEffect(() => {
    // Cancel any in-flight request for a previous session
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!sessionId) {
      setMessages([]);
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${CHAT_API_URL}/${sessionId}/messages`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortController.signal,
        });

        if (response.ok) {
          const data = await response.json();

          const mapped: ChatMessage[] = data.map((msg: any) => ({
            id: msg._id || uuidv4(),
            role: msg.role,
            content: msg.content,
            createdAt: msg.createdAt || new Date().toISOString(),
          }));
          
          if (!abortController.signal.aborted) {
            setMessages(mapped);
          }
        } else {
          if (!abortController.signal.aborted) {
            setError("Failed to load messages");
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && !abortController.signal.aborted) {
          console.error("Error loading messages:", err);
          setError("Connection error while loading messages");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchMessages();
    
    return () => {
      abortController.abort();
    };
  }, [sessionId]);

  const sendMessage = useCallback(
    async (
      text: string,
      workspace?: { boardId: number | null; sprintId: number | null },
    ) => {
      if (!text.trim() || !sessionId) return;

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

        const response = await fetch(`${CHAT_API_URL}/${sessionId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            errData.error || `Error ${response.status}: Failed to send message`,
          );
        }

        const data = await response.json();

        // Backend returns { userMessage, assistantMessage, sessionTitle? }
        if (data.assistantMessage) {
          const aiMessage: ChatMessage = {
            id: data.assistantMessage._id || uuidv4(),
            role: "assistant",
            content: data.assistantMessage.content,
            createdAt:
              data.assistantMessage.createdAt || new Date().toISOString(),
          };
          
          // Only update if we're still on the same session
          setMessages((prev) => [...prev, aiMessage]);
        }

        if (data.sessionTitle && onTitleChange) {
          onTitleChange(data.sessionTitle);
        }
      } catch (err: any) {
        console.error("Chat error:", err);
        setError(err.message || "Something went wrong talking to the AI.");

        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } finally {
        setLoading(false);
      }
    },
    [sessionId, onTitleChange],
  );

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
