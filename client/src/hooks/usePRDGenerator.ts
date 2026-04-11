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
    generateSuggestions: (file: File | null, prompt: string, options: GeneratorOptions) => Promise<void>;
    pushToJira: (projectKey: string, selectedEpics: EpicSuggestion[]) => Promise<PushToJiraResponse>;
    resetgenerator: () => void;
    setEpics: React.Dispatch<React.SetStateAction<EpicSuggestion[]>>;
    loadSession: (id: string) => Promise<void>;
}

export { type GeneratorOptions };

export const usePRDGenerator = (initialSessionId?: string): UsePRDGeneratorReturn => {
    const [state, setState] = useState<GeneratorState>('idle');
    const [epics, setEpics] = useState<EpicSuggestion[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);

    // For debounced saving
    const [isDirty, setIsDirty] = useState(false);

    // Load session if ID provided
    const loadSession = useCallback(async (id: string) => {
        try {
            setState('processing');
            const session = await getPRDSession(id);
            setEpics(session.epics || []);
            setSessionId(session._id);
            setState(session.epics.length > 0 ? 'ready' : 'idle');
        } catch (err: any) {
            console.error(err);
            setError("Failed to load session");
            setState('idle');
        }
    }, []);

    // Auto-save effect (Debounced)
    useEffect(() => {
        if (!sessionId || !isDirty) return;

        const timeoutId = setTimeout(async () => {
            try {
                await updatePRDSession(sessionId, { epics });
                setIsDirty(false);
            } catch (err) {
                console.error("Failed to auto-save session", err);
            }
        }, 2000); // 2 second debounce

        return () => clearTimeout(timeoutId);
    }, [epics, sessionId, isDirty]);

    // Mark dirty on epics change
    useEffect(() => {
        if (sessionId && epics.length > 0) {
            setIsDirty(true);
        }
    }, [epics, sessionId]);

    const generateSuggestions = async (file: File | null, prompt: string, options: GeneratorOptions) => {
        try {
            setError(null);

            if (file) {
                setState('uploading');
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

                setState('processing');
                const response: PRDSuggestionsResponse = await uploadPRD(file);

                clearInterval(interval);
                setUploadProgress(100);

                if (response.success && response.data?.epics) {
                    const newEpics = response.data.epics;
                    setEpics(newEpics);

                    // Create or Update Session
                    if (sessionId) {
                        await updatePRDSession(sessionId, { epics: newEpics, prompt, options });
                    } else {
                        const newSession = await createPRDSession({
                            epics: newEpics,
                            prompt,
                            options,
                            title: file.name ? `PRD: ${file.name}` : `Generated PRD`
                        });
                        setSessionId(newSession._id);
                        // Update URL without reload if possible, but let the Page component handle navigation if needed
                    }

                    setState('ready');
                } else {
                    throw new Error(response.message || 'Failed to generate suggestions');
                }
            } else if (prompt.trim()) {
                // Manual prompt logic (placeholder for now)
                setState('processing');
                setTimeout(async () => {
                    const newEpics: EpicSuggestion[] = []; // Empty for now
                    setEpics(newEpics);

                    if (sessionId) {
                        await updatePRDSession(sessionId, { epics: newEpics, prompt, options });
                    } else {
                        const newSession = await createPRDSession({
                            epics: newEpics,
                            prompt,
                            options,
                            title: `Prompt: ${prompt.substring(0, 20)}...`
                        });
                        setSessionId(newSession._id);
                    }
                    setState('ready');
                    // setError("Text-only generation not yet fully supported by backend.");
                }, 1000);
            } else {
                setError("Please upload a PDF or enter instructions.");
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || "An unexpected error occurred.");
            setState('idle');
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
    };

    return {
        state,
        epics,
        uploadProgress,
        error,
        sessionId,
        generateSuggestions,
        pushToJira,
        resetgenerator,
        setEpics,
        loadSession
    };
};
