import { useState, useEffect, useCallback } from 'react';
import { uploadPRD, pushSuggestionsToJira, createPRDSession, updatePRDSession, getPRDSession } from '../api/scrumApi';
import type { EpicSuggestion, PRDSuggestionsResponse, PushToJiraResponse, GeneratorOptions } from '../types/prd.types';

export type GeneratorState = 'idle' | 'uploading' | 'processing' | 'ready' | 'pushing' | 'done';

interface UsePRDGeneratorReturn {
    state: GeneratorState;
    epics: EpicSuggestion[];
    uploadProgress: number;
    error: string | null;
    sessionId: string | null;
    generatedBacklogId: string | null;
    generateSuggestions: (file: File | null, prompt: string, options: GeneratorOptions, projectKey?: string, businessDocIds?: string[]) => Promise<void>;
    pushToJira: (projectKey: string, selectedEpics: EpicSuggestion[]) => Promise<PushToJiraResponse>;
    resetgenerator: () => void;
    setEpics: React.Dispatch<React.SetStateAction<EpicSuggestion[]>>;
    loadSession: (id: string) => Promise<void>;
}

export { type GeneratorOptions };

export const usePRDGenerator = (
    initialSessionId?: string,
    boardId?: number | null,
): UsePRDGeneratorReturn => {
    const [state, setState] = useState<GeneratorState>('idle');
    const [epics, setEpics] = useState<EpicSuggestion[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
    const [generatedBacklogId, setGeneratedBacklogId] = useState<string | null>(null);

    // For debounced saving
    const [isDirty, setIsDirty] = useState(false);

    const [isPolling, setIsPolling] = useState(false);

    // Load session if ID provided
    const loadSession = useCallback(async (id: string) => {
        try {
            setState('processing');
            const session = await getPRDSession(id);
            setEpics(session.epics || []);
            setSessionId(session._id);
            setGeneratedBacklogId(session.generatedBacklogId || null);
            
            if (session.status === 'processing') {
                setState('processing');
                setIsPolling(true);
            } else if (session.status === 'failed') {
                setState('idle');
                setError(session.error || 'Generation failed.');
            } else {
                setState(session.epics?.length > 0 ? 'ready' : 'idle');
            }
        } catch (err: any) {
            console.error(err);
            setError("Failed to load session");
            setState('idle');
        }
    }, []);

    // Polling effect
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPolling && sessionId) {
            interval = setInterval(async () => {
                try {
                    const session = await getPRDSession(sessionId);
                    if (session.status === 'ready') {
                        setEpics(session.epics || []);
                        setGeneratedBacklogId(session.generatedBacklogId || null);
                        setState('ready');
                        setIsPolling(false);
                    } else if (session.status === 'failed') {
                        setError(session.error || 'Generation failed.');
                        setState('idle');
                        setIsPolling(false);
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isPolling, sessionId]);

    // Auto-save effect (Debounced)
    useEffect(() => {
        if (!sessionId || !isDirty || state === 'processing' || isPolling) return;

        const timeoutId = setTimeout(async () => {
            try {
                await updatePRDSession(sessionId, { epics });
                setIsDirty(false);
            } catch (err) {
                console.error("Failed to auto-save session", err);
            }
        }, 2000); // 2 second debounce

        return () => clearTimeout(timeoutId);
    }, [epics, sessionId, isDirty, state, isPolling]);

    // Mark dirty on epics change
    useEffect(() => {
        if (sessionId && epics.length > 0 && !isPolling) {
            setIsDirty(true);
        }
    }, [epics, sessionId, isPolling]);

    const generateSuggestions = async (file: File | null, prompt: string, options: GeneratorOptions, projectKey?: string, businessDocIds?: string[]) => {
        try {
            setError(null);
            
            if (!file && !prompt.trim()) {
                setError("Please upload a PDF or enter instructions.");
                return;
            }

            setState('uploading');
            let currentSessionId = sessionId;

            // Create or Update Session first
            if (currentSessionId) {
                await updatePRDSession(currentSessionId, { prompt, options });
            } else {
                const newSession = await createPRDSession({
                    epics: [],
                    prompt,
                    options,
                    title: file ? `PRD: ${file.name}` : `Prompt: ${prompt.substring(0, 20)}...`
                });
                currentSessionId = newSession._id;
                setSessionId(newSession._id);
            }

            // Simulate upload progress
            const interval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(interval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            // Trigger generation
            const response = await uploadPRD(file, boardId, projectKey, businessDocIds, currentSessionId, prompt);
            
            clearInterval(interval);
            setUploadProgress(100);

            if (response.status === 'processing') {
                setState('processing');
                setIsPolling(true);
            } else {
                // Synchronous fallback just in case
                if (response.success && (response.data?.epics || response.data)) {
                    setEpics(response.data.epics || response.data);
                    setState('ready');
                } else {
                    throw new Error(response.message || 'Failed to start generation');
                }
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || "An unexpected error occurred.");
            setState('idle');
            setIsPolling(false);
        }
    };

    const pushToJira = async (projectKey: string, selectedEpics: EpicSuggestion[]): Promise<PushToJiraResponse> => {
        setState('pushing');
        try {
            const response = await pushSuggestionsToJira({
                projectKey,
                suggestions: {
                    data: {
                        epics: selectedEpics
                    }
                }
            });

            setState('done');
            return response;
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to push to Jira.");
            setState('ready');
            throw err;
        }
    };

    const resetgenerator = () => {
        setState('idle');
        setEpics([]);
        setError(null);
        setUploadProgress(0);
        setSessionId(null);
        setGeneratedBacklogId(null);
    };

    return {
        state,
        epics,
        uploadProgress,
        error,
        sessionId,
        generatedBacklogId,
        generateSuggestions,
        pushToJira,
        resetgenerator,
        setEpics,
        loadSession
    };
};
