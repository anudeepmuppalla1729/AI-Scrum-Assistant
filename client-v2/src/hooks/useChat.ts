import { useState, useCallback, useEffect, useRef } from "react";
import type { ChatMessage } from "../types";
import * as chatApi from "../api/chat";
import { useChatStore } from "../store/useChatStore";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

export function useChat(sessionId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const workspace = useWorkspaceStore((s) => s.workspace);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const loadMessages = useCallback(async (sid: string) => {
    setIsLoading(true);
    try {
      const msgs = await chatApi.getChatMessages(sid);
      setMessages(msgs);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      loadMessages(sessionId);
    } else {
      setMessages([]);
    }
  }, [sessionId, loadMessages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!sessionId || !content.trim() || isSending) return;

      const userMsg: ChatMessage = {
        _id: `temp-${Date.now()}`,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsSending(true);

      try {
        const res = await chatApi.sendChatMessage(sessionId, content, {
          boardId: workspace?.boardId?.toString(),
          sprintId: workspace?.sprintId?.toString(),
        });

        // Replace temp user msg with real one, add assistant msg
        setMessages((prev) => [
          ...prev.filter((m) => m._id !== userMsg._id),
          res.userMessage,
          res.assistantMessage,
        ]);

        // Update session title if returned
        if (res.sessionTitle) {
          useChatStore.getState().renameSession(sessionId, res.sessionTitle);
        }
      } catch {
        // Remove temp msg on error
        setMessages((prev) => prev.filter((m) => m._id !== userMsg._id));
      } finally {
        setIsSending(false);
      }
    },
    [sessionId, isSending, workspace]
  );

  return { messages, isLoading, isSending, sendMessage, loadMessages };
}
