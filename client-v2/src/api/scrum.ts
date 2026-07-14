import api from "./axios";
import type {
  PRDSession,
  GeneratedBacklog,
  PushedBacklog,
} from "../types";

// PRD Sessions
export async function getPRDSessions(): Promise<PRDSession[]> {
  const { data } = await api.get("/api/v1/scrum/prd/sessions");
  return data;
}

export async function getPRDSession(sessionId: string): Promise<PRDSession> {
  const { data } = await api.get(`/api/v1/scrum/prd/session/${sessionId}`);
  return data;
}

export async function createPRDSession(
  body: { title?: string; prompt?: string; options?: Record<string, boolean> } = {}
): Promise<PRDSession> {
  const { data } = await api.post("/api/v1/scrum/prd/session", body);
  return data;
}

export async function updatePRDSession(
  sessionId: string,
  body: Partial<Pick<PRDSession, "title" | "prompt" | "epics" | "options">>
): Promise<PRDSession> {
  const { data } = await api.patch(`/api/v1/scrum/prd/session/${sessionId}`, body);
  return data;
}

export async function deletePRDSession(sessionId: string): Promise<void> {
  await api.delete(`/api/v1/scrum/prd/session/${sessionId}`);
}

// Generate suggestions (PRD upload)
export async function generateSuggestions(formData: FormData): Promise<void> {
  await api.post("/api/v1/scrum/suggestions", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

// Generated Backlog
export async function getGeneratedBacklog(id: string): Promise<GeneratedBacklog> {
  const { data } = await api.get(`/api/v1/scrum/backlog/generated/${id}`);
  return data;
}

export async function updateGeneratedBacklog(
  id: string,
  body: { rejectedEpicIds: string[] }
): Promise<void> {
  await api.patch(`/api/v1/scrum/backlog/generated/${id}`, body);
}

export async function updateStory(
  backlogId: string,
  storyId: string,
  body: Record<string, unknown>
): Promise<void> {
  await api.patch(`/api/v1/scrum/backlog/generated/${backlogId}/stories/${storyId}`, body);
}

export async function approveAndPush(
  id: string,
  epicId?: string
): Promise<void> {
  await api.post(`/api/v1/scrum/backlog/generated/${id}/approve`, {
    epicId: epicId ?? null,
  });
}

// Push single item (legacy)
export async function pushBacklogItem(body: {
  projectKey: string;
  sessionId?: string;
  item: {
    summary: string;
    type: string;
    description?: string;
    priority?: string;
    storyPoints?: number;
    parentKey?: string;
    acceptanceCriteria?: string[];
  };
}): Promise<{ success: boolean; jiraKey: string; jiraUrl: string }> {
  const { data } = await api.post("/api/v1/scrum/backlog/push", body);
  return data;
}

// Push history
export async function getPushHistory(sessionId?: string): Promise<PushedBacklog[]> {
  const params = sessionId ? `?sessionId=${sessionId}` : "";
  const { data } = await api.get(`/api/v1/scrum/backlog/history${params}`);
  return data;
}

// Search backlog (for parent linking)
export async function searchBacklog(
  projectKey: string,
  query?: string,
  issueType?: string
): Promise<Array<{ key: string; summary: string; type: string; status: string; parentKey?: string }>> {
  const params = new URLSearchParams({ projectKey });
  if (query) params.set("query", query);
  if (issueType) params.set("issueType", issueType);
  const { data } = await api.get(`/api/v1/scrum/backlog/search?${params}`);
  return data;
}

// Standup & Retro
export async function getStandup(projectKey: string): Promise<{ report: string }> {
  const { data } = await api.get(`/api/v1/scrum/standup?projectKey=${projectKey}`);
  return data;
}

export async function getRetrospective(
  sprintId: string,
  boardId?: string
): Promise<{ report: string }> {
  const params = new URLSearchParams({ sprintId });
  if (boardId) params.set("boardId", boardId);
  const { data } = await api.get(`/api/v1/scrum/retrospective?${params}`);
  return data;
}
