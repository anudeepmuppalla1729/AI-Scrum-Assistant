export interface JiraBoard {
    id: number;
    name: string;
    type: string;
    location?: {
        projectId: number;
        displayName: string;
        projectKey: string;
    };
}

export interface JiraSprint {
    id: number;
    self: string;
    state: 'active' | 'future' | 'closed';
    name: string;
    startDate?: string;
    endDate?: string;
    originBoardId?: number;
}
