export interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: string | number;
    meta?: any;
}

export interface ChatSession {
    _id: string;
    title: string;
    createdAt?: string;
    userId?: string;
}
