import api from "./axios";
import type { ChatSession, ChatMessage } from "../types";

export async function getChatSessions(boardId?: string): Promise<ChatSession[]> {
  const params = boardId ? `?boardId=${boardId}` : "";
  const { data } = await api.get(`/api/v1/scrum/chat/sessions${params}`);
  return data;
}

export async function createChatSession(boardId?: string): Promise<ChatSession> {
  const { data } = await api.post("/api/v1/scrum/chat/session", { boardId });
  return data;
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  await api.delete(`/api/v1/scrum/chat/session/${sessionId}`);
}

export async function renameChatSession(sessionId: string, title: string): Promise<void> {
  await api.patch(`/api/v1/scrum/chat/session/${sessionId}`, { title });
}

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const { data } = await api.get(`/api/v1/scrum/chat/${sessionId}/messages`);
  return data;
}

export async function sendChatMessage(
  sessionId: string,
  message: string,
  workspace?: { boardId?: string; sprintId?: string }
): Promise<{
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  sessionTitle?: string;
}> {
  const { data } = await api.post(`/api/v1/scrum/chat/${sessionId}`, {
    message,
    workspace,
  });
  return data;
}
