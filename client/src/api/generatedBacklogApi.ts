import { useAuthStore } from "../store/useAuthStore";
import type { PushToJiraResponse } from "../types/prd.types";

const API_BASE_URL = "/api/v1/scrum/backlog/generated";

const handleAuthError = (res: Response) => {
  if (res.status === 401) {
    console.warn("Received 401 - Logging out");
    useAuthStore.getState().logout();
    throw new Error("Session expired. Please login again.");
  }
};

export interface GeneratedBacklog {
  _id: string;
  userId: string;
  sessionId: string;
  projectKey: string;
  status: 'pending_review' | 'partially_pushed' | 'fully_pushed' | 'rejected';
  orchestrator_contract: any;
  stories: any[];
  epic_statuses: any[];
  validation_report: any;
  createdAt: string;
  updatedAt: string;
}

export const getGeneratedBacklog = async (id: string): Promise<GeneratedBacklog> => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  handleAuthError(response);

  if (!response.ok) {
    throw new Error("Failed to fetch generated backlog");
  }

  return response.json();
};

export const updateStory = async (backlogId: string, storyId: string, updates: any): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/${backlogId}/stories/${storyId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(updates),
  });

  handleAuthError(response);

  if (!response.ok) {
    throw new Error("Failed to update story");
  }
};

export const approveAndPushEpic = async (backlogId: string, epicId: string | null): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/${backlogId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ epicId }),
  });

  handleAuthError(response);

  if (!response.ok) {
    throw new Error("Failed to approve and push");
  }
};
