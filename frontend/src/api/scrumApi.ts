import type { PRDSuggestionsResponse, PushToJiraRequest, PushToJiraResponse } from '../types/prd.types';

const API_BASE_URL = '/api/v1/scrum';

export const uploadPRD = async (file: File): Promise<PRDSuggestionsResponse> => {
    const formData = new FormData();
    formData.append('prdFile', file);

    const response = await fetch(`${API_BASE_URL}/suggestions`, {
        method: 'POST',
        headers: {
            // 'Content-Type': 'multipart/form-data', // Browser sets this automatically with boundary
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('PRD Upload failed:', response.status, response.statusText, errorText);
        throw new Error(`Failed to upload PRD: ${response.statusText} - ${errorText}`);
    }

    return response.json();
};

export const pushSuggestionsToJira = async (payload: PushToJiraRequest): Promise<PushToJiraResponse> => {
    const response = await fetch(`${API_BASE_URL}/pushSuggestionsToJira`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to push suggestions to Jira');
    }

    return response.json();
};
