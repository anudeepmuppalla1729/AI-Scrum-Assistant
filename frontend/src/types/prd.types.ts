
export interface TaskSuggestion {
    type: 'Task';
    summary: string;
    description: string;
    priority: string;
}

export interface StorySuggestion {
    type: 'Story';
    summary: string;
    description: string;
    priority: string;
    story_points: number;
    sub_issues: TaskSuggestion[];
}

export interface EpicSuggestion {
    title: string;
    description: string;
    issues: StorySuggestion[];
}

export interface PRDSuggestionsResponse {
    success: boolean;
    message: string;
    data: {
        epics: EpicSuggestion[];
    };
}

export interface PushToJiraRequest {
    projectKey: string;
    suggestions: {
        data: {
            epics: EpicSuggestion[];
        };
    };
}

export interface PushToJiraResponse {
    success: boolean;
    createdIssues: string[]; // List of keys e.g., ["SCRUM-1", "SCRUM-2"]
    errors?: any[];
}
