const BASE_URL = "http://localhost:2000/auth/jira";

// Helper to handle responses and check for 401 (Token Expired)
const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    // Token expired or invalid
    console.warn("Received 401 - Logging out");
    localStorage.removeItem("token");
    window.location.href = "/"; // Hard redirect to login
    throw new Error("Session expired. Please login again.");
  }

  // Parse JSON safely
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || data?.message || "API Request Failed");
  }

  return data;
};

export const getBoards = async (token: string) => {
  const res = await fetch(`${BASE_URL}/boards`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleResponse(res);
  return data.values; // Return just the values array
};

export const getSprints = async (boardId: number, token: string) => {
  const res = await fetch(`${BASE_URL}/boards/${boardId}/sprints`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleResponse(res);
  return data.values; // Return just the values array
};

export const getSprintIssues = async (sprintId: number, token: string) => {
  const res = await fetch(`${BASE_URL}/sprints/${sprintId}/issues`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleResponse(res);
  return data.issues; // Return just the issues array
};

export const createIssue = async (issueData: any, token: string) => {
  const res = await fetch(`${BASE_URL}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(issueData),
  });
  return await handleResponse(res);
};
