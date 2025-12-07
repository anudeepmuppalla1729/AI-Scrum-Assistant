
import type {
    PRDSuggestionsResponse,
    PushToJiraRequest,
    PushToJiraResponse,
    PRDSession,
    CreatePRDSessionRequest,
    UpdatePRDSessionRequest
} from '../types/prd.types';

const API_BASE_URL = '/api/v1/scrum';

export const uploadPRD = async (file: File): Promise<PRDSuggestionsResponse> => {
    const formData = new FormData();
    formData.append('prdFile', file);

    const response = await fetch(`${API_BASE_URL}/suggestions`, {
        method: 'POST',
        headers: {
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

// --- PRD Sessions ---

export const getPRDSessions = async (): Promise<PRDSession[]> => {
    const response = await fetch(`${API_BASE_URL}/prd/sessions`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch PRD sessions');
    }

    return response.json();
};

export const createPRDSession = async (data: CreatePRDSessionRequest): Promise<PRDSession> => {
    const response = await fetch(`${API_BASE_URL}/prd/session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to create PRD session');
    }

    return response.json();
};

export const getPRDSession = async (sessionId: string): Promise<PRDSession> => {
    const response = await fetch(`${API_BASE_URL}/prd/session/${sessionId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch PRD session details');
    }

    return response.json();
};

export const updatePRDSession = async (sessionId: string, data: UpdatePRDSessionRequest): Promise<PRDSession> => {
    const response = await fetch(`${API_BASE_URL}/prd/session/${sessionId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to update PRD session');
    }

    return response.json();
};

export const deletePRDSession = async (sessionId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/prd/session/${sessionId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to delete PRD session');
    }
};
