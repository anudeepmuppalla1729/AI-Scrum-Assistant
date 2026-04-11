export interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: string | number;
    meta?: any;
    backlogItems?: BacklogItem[];
}

export interface ChatSession {
    _id: string;
    title: string;
    createdAt?: string;
    userId?: string;
}

export interface BacklogItem {
    type: "Epic" | "Story" | "Task" | "Subtask";
    summary: string;
    description: string;
    acceptanceCriteria?: string[];
    storyPoints?: number;
    priority?: "Highest" | "High" | "Medium" | "Low" | "Lowest";
    parentKey?: string;
    parentSummary?: string;
    // Push state (frontend only)
    pushed?: boolean;
    pushing?: boolean;
    jiraKey?: string;
    jiraUrl?: string;
    error?: string;
}

export interface PushedBacklogRecord {
    _id: string;
    userId: string;
    sessionId: string;
    projectKey: string;
    jiraKey: string;
    jiraId: string;
    type: string;
    summary: string;
    description?: string;
    storyPoints?: number;
    priority?: string;
    parentKey?: string;
    parentSummary?: string;
    jiraUrl?: string;
    createdAt: string;
}
