import api from "./axios";
import type { JiraBoard, JiraSprint, JiraIssue } from "../types";

export async function getBoards(): Promise<JiraBoard[]> {
  const { data } = await api.get("/auth/jira/boards");
  return data.values ?? data;
}

export async function getSprints(boardId: number): Promise<JiraSprint[]> {
  const { data } = await api.get(`/auth/jira/boards/${boardId}/sprints`);
  return data.values ?? data;
}

export async function getSprintIssues(sprintId: number): Promise<JiraIssue[]> {
  const { data } = await api.get(`/auth/jira/sprints/${sprintId}/issues`);
  return data.issues ?? data;
}

export async function createIssue(fields: Record<string, unknown>): Promise<{ id: string; key: string }> {
  const { data } = await api.post("/auth/jira/issues", { fields });
  return data;
}
