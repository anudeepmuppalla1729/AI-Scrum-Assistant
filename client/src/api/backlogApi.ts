import type { BacklogItem, PushedBacklogRecord } from "../types/chat.types";

const API_BASE_URL = "/api/v1/scrum";

const getToken = () => localStorage.getItem("token");

import { useAuthStore } from "../store/useAuthStore";

const handleAuthError = (res: Response) => {
  if (res.status === 401) {
    console.warn("Received 401 - Logging out");
    useAuthStore.getState().logout();
    throw new Error("Session expired. Please login again.");
  }
};

/**
 * Push a single backlog item to Jira.
 */
export const pushBacklogItem = async (
  projectKey: string,
  item: BacklogItem,
  sessionId?: string
): Promise<{
  success: boolean;
  jiraKey: string;
  jiraId: string;
  jiraUrl: string;
}> => {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/backlog/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ projectKey, sessionId, item }),
  });

  handleAuthError(res);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to push backlog item to Jira");
  }

  return res.json();
};

/**
 * Search existing Jira backlog items for parent linking.
 */
export const searchBacklog = async (
  projectKey: string,
  query?: string,
  issueType?: string
): Promise<
  Array<{
    key: string;
    summary: string;
    type: string;
    status: string;
    parentKey: string | null;
  }>
> => {
  const token = getToken();
  const params = new URLSearchParams({ projectKey });
  if (query) params.append("query", query);
  if (issueType) params.append("issueType", issueType);

  const res = await fetch(`${API_BASE_URL}/backlog/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  handleAuthError(res);

  if (!res.ok) {
    throw new Error("Failed to search backlogs");
  }

  return res.json();
};

/**
 * Get push history for the current user.
 */
export const getPushHistory = async (
  sessionId?: string
): Promise<PushedBacklogRecord[]> => {
  const token = getToken();
  const params = new URLSearchParams();
  if (sessionId) params.append("sessionId", sessionId);

  const res = await fetch(
    `${API_BASE_URL}/backlog/history${params.toString() ? `?${params}` : ""}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  handleAuthError(res);

  if (!res.ok) {
    throw new Error("Failed to fetch push history");
  }

  return res.json();
};
