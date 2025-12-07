const BASE_URL = "http://localhost:2000/auth/jira";

export const getBoards = async (token: string) => {
    const res = await fetch(`${BASE_URL}/boards`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.values;
};

export const getSprints = async (boardId: number, token: string) => {
    const res = await fetch(`${BASE_URL}/boards/${boardId}/sprints`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.values;
};

export const getSprintIssues = async (sprintId: number, token: string) => {
    const res = await fetch(`${BASE_URL}/sprints/${sprintId}/issues`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.issues;
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
    return await res.json();
};
