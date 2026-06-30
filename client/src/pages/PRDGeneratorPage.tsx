import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PRDUpload } from '../components/prd/PRDUpload';
import { PromptInput } from '../components/prd/PromptInput';
import { GenerateButton } from '../components/prd/GenerateButton';
import { OutputPanel } from '../components/prd/OutputPanel';
import { PushToJiraModal } from '../components/prd/PushToJiraModal';
import PRDLayout from '../components/prd/PRDLayout';
import PRDHistorySidebar from '../components/prd/PRDHistorySidebar';
import { TicketDetailModal, type TicketType } from '../components/prd/TicketDetailModal';

import { usePRDGenerator, type GeneratorOptions } from '../hooks/usePRDGenerator';
import { usePRDSelection } from '../hooks/usePRDSelection';
import type { EpicSuggestion, StorySuggestion } from '../types/prd.types';
import { useWorkspaceStore } from '../store/useWorkspaceStore';

import { getPRDSessions } from '../api/scrumApi';

const PRDGeneratorPage: React.FC = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const workspace = useWorkspaceStore((state) => state.workspace);

    // Generator State (Upload, AI Processing)
    const {
        state: generatorState,
        epics,
        error: generatorError,
        generateSuggestions,
        setEpics,
        sessionId: currentSessionId,
        generatedBacklogId,
        loadSession,
        pushToJira
    } = usePRDGenerator(sessionId, workspace?.boardId);

    // Sync URL with sessionId if it changes (and we aren't already there)
    useEffect(() => {
        if (currentSessionId && currentSessionId !== sessionId) {
            navigate(`/prd/${currentSessionId}`, { replace: true });
        }
    }, [currentSessionId, sessionId, navigate]);

    // Load session if URL has sessionId
    useEffect(() => {
        if (sessionId) {
            loadSession(sessionId);
        } else {
            // Auto-redirect to most recent session if visiting /prd root
            const checkRecent = async () => {
                try {
                    const sessions = await getPRDSessions();
                    if (sessions && sessions.length > 0) {
                        navigate(`/prd/${sessions[0]._id}`, { replace: true });
                    }
                } catch (error) {
                    console.error("Failed to check recent sessions", error);
                }
            };
            checkRecent();
        }
    }, [sessionId, loadSession, navigate]);


    // Local inputs for Left Panel


    // Local inputs for Left Panel
    // Local inputs for Left Panel
    const [file, setFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [options, setOptions] = useState<GeneratorOptions>({
        includeAcceptanceCriteria: true,
        estimateStoryPoints: true,
        includeSubTasks: true
    });
    
    // Business Documents Selection
    const [availableDocs, setAvailableDocs] = useState<{ _id: string, filename: string, [key: string]: any }[]>([]);
    const [selectedBusinessDocIds, setSelectedBusinessDocIds] = useState<string[]>([]);

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                // simple fetch using fetch API or axios
                const token = localStorage.getItem("token");
                const url = workspace?.boardId 
                    ? `/api/v1/documents?boardId=${workspace.boardId}`
                    : `/api/v1/documents`;
                    
                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAvailableDocs(data);
                }
            } catch (e) {
                console.error("Failed to fetch documents", e);
            }
        };
        fetchDocs();
    }, [workspace?.boardId]);

    // Selection State for Right Panel
    const selectionInfo = usePRDSelection(epics);
    const { initializeSelection, getSelectedCounts } = selectionInfo;

    // Modal State
    const [isPushModalOpen, setIsPushModalOpen] = useState(false);

    // Sync epics to selection hook when they change
    useEffect(() => {
        if (epics.length > 0) {
            initializeSelection(epics);
        }
    }, [epics, initializeSelection]);

    // Modal Details State
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        type: TicketType | null;
        indices: { epic: number; story?: number; task?: number } | null;
    }>({ isOpen: false, type: null, indices: null });
    const [isPushingEpic, setIsPushingEpic] = useState(false);

    const handleOpenModal = (type: TicketType, epicIndex: number, storyIndex?: number, taskIndex?: number) => {
        setModalState({
            isOpen: true,
            type,
            indices: { epic: epicIndex, story: storyIndex, task: taskIndex }
        });
    };

    const handleCloseModal = () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
    };

    const handleSaveModal = (updates: Record<string, unknown>) => {
        if (!modalState.indices) return;
        const { epic, story, task } = modalState.indices;
        if (modalState.type === 'Epic') {
            handleUpdateEpic(epic, updates);
        } else if (modalState.type === 'Story' && story !== undefined) {
            handleUpdateStory(epic, story, updates);
        } else if (modalState.type === 'Task' && story !== undefined && task !== undefined) {
            setEpics(prev => {
                const next = [...prev];
                const newIssues = [...next[epic].issues];
                const newTasks = [...newIssues[story].sub_issues];
                newTasks[task] = { ...newTasks[task], ...updates };
                newIssues[story] = { ...newIssues[story], sub_issues: newTasks };
                next[epic] = { ...next[epic], issues: newIssues };
                return next;
            });
        }
    };

    const handlePushSingleEpic = async () => {
        if (!modalState.indices || modalState.type !== 'Epic') return;
        const epicToPush = epics[modalState.indices.epic];
        const projectKey = workspace?.projectKey;
        if (!projectKey) {
            alert("No project key found.");
            return;
        }
        
        setIsPushingEpic(true);
        try {
            await pushToJira(projectKey, [epicToPush]);
            alert("Epic successfully pushed to Jira!");
            handleCloseModal();
            setEpics(prev => prev.filter((_, i) => i !== modalState.indices?.epic));
        } catch (err: unknown) {
            if (err instanceof Error) {
                alert(`Failed to push epic: ${err.message}`);
            } else {
                alert("Failed to push epic due to an unknown error.");
            }
        } finally {
            setIsPushingEpic(false);
        }
    };

    let activeTicketData = null;
    if (modalState.isOpen && modalState.indices) {
        const { epic, story, task } = modalState.indices;
        if (modalState.type === 'Epic') activeTicketData = epics[epic];
        else if (modalState.type === 'Story') activeTicketData = epics[epic]?.issues[story!];
        else if (modalState.type === 'Task') activeTicketData = epics[epic]?.issues[story!]?.sub_issues[task!];
    }

    const handleGenerate = async () => {
        const projectKey = workspace?.projectKey;
        if (!projectKey) {
            alert("No project key found. Please re-select workspace.");
            return;
        }
        await generateSuggestions(file, prompt, options, projectKey, selectedBusinessDocIds);
    };

    const handleConfirmPush = async () => {
        // Obsolete: Pushing is now done via the Backlog Review page
        setIsPushModalOpen(false);
    };

    // Handlers for updating content (inline editing)
    const handleUpdateEpic = (index: number, updates: Partial<EpicSuggestion>) => {
        setEpics(prev => {
            const next = [...prev];
            next[index] = { ...next[index], ...updates };
            return next;
        });
    };

    const handleUpdateStory = (epicIndex: number, storyIndex: number, updates: Partial<StorySuggestion>) => {
        setEpics(prev => {
            const next = [...prev];
            const epic = next[epicIndex];
            const newIssues = [...epic.issues];
            newIssues[storyIndex] = { ...newIssues[storyIndex], ...updates };
            next[epicIndex] = { ...epic, issues: newIssues };
            return next;
        });
    };

    const counts = getSelectedCounts();

    return (
        <>
            <PRDLayout
                sidebar={<PRDHistorySidebar activeSessionId={sessionId} />}
                mainArea={
                    <div className="flex flex-1 overflow-hidden">
                        {/* LEFT PANEL: Input */}
                        <div className="w-[400px] shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-primary)] overflow-y-auto custom-scrollbar">
                            <div className="p-6 space-y-8 stagger-children">
                                {/* Header */}
                                <div>
                                    <h1 className="heading-xl m-0 text-[var(--color-text-primary)]">Backlog Generator</h1>
                                    <p className="text-sm text-[var(--color-text-tertiary)] mt-1 font-medium">From PDF to Jira Tickets.</p>
                                </div>

                                {/* Upload Section */}
                                <section>
                                    <PRDUpload
                                        file={file}
                                        onFileSelect={setFile}
                                        isUploading={generatorState === 'uploading'}
                                    />
                                </section>
                                
                                {/* Business Documents Selection */}
                                {availableDocs.length > 0 && (
                                    <section>
                                        <h2 className="heading-sm mb-3">Include Business Context</h2>
                                        <div className="space-y-2 max-h-40 overflow-y-auto border border-[var(--color-border)] rounded-xl p-3 bg-[var(--color-bg-secondary)] custom-scrollbar">
                                            {availableDocs.map(doc => (
                                                <label key={doc._id} className="flex items-center space-x-3 text-sm text-[var(--color-text-secondary)] font-medium p-1 hover:bg-[var(--color-bg-tertiary)] rounded-md transition-colors cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-[var(--color-border-light)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-0 bg-white"
                                                        checked={selectedBusinessDocIds.includes(doc._id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedBusinessDocIds([...selectedBusinessDocIds, doc._id]);
                                                            } else {
                                                                setSelectedBusinessDocIds(selectedBusinessDocIds.filter(id => id !== doc._id));
                                                            }
                                                        }}
                                                    />
                                                    <span>{doc.filename}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Prompt & Options */}
                                <section>
                                    <PromptInput
                                        prompt={prompt}
                                        setPrompt={setPrompt}
                                        options={options}
                                        setOptions={setOptions}
                                        disabled={generatorState === 'processing' || generatorState === 'uploading'}
                                    />
                                </section>

                                {/* Generate Action */}
                                <section className="pt-4">
                                    <GenerateButton
                                        onClick={handleGenerate}
                                        isLoading={generatorState === 'processing' || generatorState === 'uploading'}
                                        disabled={!file && !prompt}
                                    />
                                    {generatorError && (
                                        <p className="text-sm text-[var(--color-error)] mt-3 text-center font-medium bg-[var(--color-error-light)] p-2 rounded-md">{generatorError}</p>
                                    )}
                                </section>
                            </div>
                        </div>

                        {/* RIGHT PANEL: Output */}
                        <div className="flex-1 min-w-0 flex flex-col relative bg-[var(--color-surface)]">
                            <div className="flex-1 overflow-hidden relative min-w-0">
                                {generatorState !== 'idle' && (
                                    <div className="flex-1 flex flex-col min-h-0 relative">
                                        <div className="flex-1 min-h-0">
                                            <OutputPanel 
                                                epics={epics} 
                                                isLoading={generatorState === 'uploading' || generatorState === 'processing'} 
                                                selectionInfo={selectionInfo}
                                                onUpdateEpic={handleUpdateEpic}
                                                onUpdateStory={handleUpdateStory}
                                                onOpenModal={handleOpenModal}
                                            />
                                        </div>

                                        {/* Footer for Review Action */}
                                        {epics.length > 0 && (generatedBacklogId || sessionId) && (
                                            <div className="flex-none bg-white border-t border-[var(--color-border)] p-4 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">Ready for Review</span>
                                                    <span className="text-xs text-[var(--color-text-secondary)]">Review the generated backlog before pushing to Jira</span>
                                                </div>
                                                <div className="flex gap-3">
                                                    <button 
                                                        onClick={() => navigate(`/backlog/review/${generatedBacklogId || sessionId}`)}
                                                        className="btn btn-primary font-medium"
                                                    >
                                                        Review & Push Backlog
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                }
            />
            <PushToJiraModal
                isOpen={isPushModalOpen}
                onClose={() => setIsPushModalOpen(false)}
                onConfirm={handleConfirmPush}
                isLoading={generatorState === 'pushing'}
                counts={counts}
            />
            <TicketDetailModal
                isOpen={modalState.isOpen}
                onClose={handleCloseModal}
                ticketType={modalState.type}
                ticketData={activeTicketData}
                onSave={handleSaveModal}
                onPush={modalState.type === 'Epic' ? handlePushSingleEpic : undefined}
                isPushing={isPushingEpic}
            />
        </>
    );
};

export default PRDGeneratorPage;
