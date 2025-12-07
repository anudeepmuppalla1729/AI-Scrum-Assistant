import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PRDUpload } from '../components/prd/PRDUpload';
import { PromptInput } from '../components/prd/PromptInput';
import { GenerateButton } from '../components/prd/GenerateButton';
import { OutputPanel } from '../components/prd/OutputPanel';
import { JiraPushBar } from '../components/prd/JiraPushBar';
import { PushToJiraModal } from '../components/prd/PushToJiraModal';
import PRDLayout from '../components/prd/PRDLayout';
import PRDHistorySidebar from '../components/prd/PRDHistorySidebar';

import { usePRDGenerator, type GeneratorOptions } from '../hooks/usePRDGenerator';
import { usePRDSelection } from '../hooks/usePRDSelection';
import type { EpicSuggestion } from '../types/prd.types';

import { getPRDSessions } from '../api/scrumApi';

const PRDGeneratorPage: React.FC = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    // Generator State (Upload, AI Processing)
    const {
        state: generatorState,
        epics,
        error: generatorError,
        generateSuggestions,
        pushToJira,
        setEpics,
        sessionId: currentSessionId,
        loadSession
    } = usePRDGenerator(sessionId);

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
    const [file, setFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [options, setOptions] = useState<GeneratorOptions>({
        includeAcceptanceCriteria: true,
        estimateStoryPoints: true,
        includeSubTasks: true
    });

    // Selection State for Right Panel
    const selectionInfo = usePRDSelection(epics);
    const { initializeSelection, selection, getSelectedCounts } = selectionInfo;

    // Modal State
    const [isPushModalOpen, setIsPushModalOpen] = useState(false);

    // Sync epics to selection hook when they change
    useEffect(() => {
        if (epics.length > 0) {
            initializeSelection(epics);
        }
    }, [epics, initializeSelection]);

    const handleGenerate = async () => {
        await generateSuggestions(file, prompt, options);
    };

    const handleConfirmPush = async () => {
        const counts = getSelectedCounts();
        if (counts.epicCount === 0 && counts.storyCount === 0 && counts.taskCount === 0) return;

        try {
            // Simplified deep filter logic for pushing
            const filteredEpics = epics.map((epic, epicIndex) => {
                const epicSelected = selection[epicIndex]?.selected;

                const selectedStories = epic.issues.map((story, storyIndex) => {
                    const storyState = selection[epicIndex]?.stories?.[storyIndex];
                    // If purely unselected (checked=false and no tasks checked), skip
                    if (!storyState?.selected && Object.values(storyState?.tasks || {}).every(v => !v)) return null;

                    const selectedTasks = story.sub_issues.filter((_, taskIndex) => storyState?.tasks?.[taskIndex]);

                    if (storyState.selected) {
                        return {
                            ...story,
                            sub_issues: selectedTasks
                        };
                    } else if (selectedTasks.length > 0) {
                        return {
                            ...story,
                            sub_issues: selectedTasks
                        };
                    }
                    return null;
                }).filter(Boolean) as any[];

                if (epicSelected || selectedStories.length > 0) {
                    return {
                        ...epic,
                        issues: selectedStories
                    };
                }
                return null;
            }).filter(Boolean) as EpicSuggestion[];

            // TODO: Get project key from dropdown or workspace
            const projectKey = 'SCRUM';

            await pushToJira(projectKey, filteredEpics);
            setIsPushModalOpen(false);
            alert("Successfully pushed to Jira!");
        } catch (e) {
            setIsPushModalOpen(false);
        }
    };

    // Handlers for updating content (inline editing)
    const handleUpdateEpic = (index: number, updates: Partial<EpicSuggestion>) => {
        setEpics(prev => {
            const next = [...prev];
            next[index] = { ...next[index], ...updates };
            return next;
        });
    };

    const handleUpdateStory = (epicIndex: number, storyIndex: number, updates: Partial<any>) => {
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
    const hasSelection = counts.epicCount > 0 || counts.storyCount > 0 || counts.taskCount > 0;

    return (
        <>
            <PRDLayout
                sidebar={<PRDHistorySidebar activeSessionId={sessionId} />}
                mainArea={
                    <div className="flex flex-1 overflow-hidden">
                        {/* LEFT PANEL: Input */}
                        <div className="w-[400px] flex-shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-y-auto">
                            <div className="p-6 space-y-8">
                                {/* Header */}
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">PRD Generator</h1>
                                    <p className="text-sm text-gray-500">From PDF to Jira Tickets.</p>
                                </div>

                                {/* Upload Section */}
                                <section>
                                    <PRDUpload
                                        file={file}
                                        onFileSelect={setFile}
                                        isUploading={generatorState === 'uploading'}
                                    />
                                </section>

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
                                        <p className="text-sm text-red-500 mt-2 text-center">{generatorError}</p>
                                    )}
                                </section>
                            </div>
                        </div>

                        {/* RIGHT PANEL: Output */}
                        <div className="flex-1 flex flex-col relative bg-[#f8f9fb]">
                            <div className="flex-1 overflow-hidden relative">
                                <OutputPanel
                                    epics={epics}
                                    isLoading={generatorState === 'processing'}
                                    selectionInfo={selectionInfo}
                                    onUpdateEpic={handleUpdateEpic}
                                    onUpdateStory={handleUpdateStory}
                                />
                            </div>

                            {/* Sticky Footer for Push Action */}
                            {epics.length > 0 && (
                                <JiraPushBar
                                    counts={counts}
                                    onPush={() => setIsPushModalOpen(true)}
                                    isLoading={generatorState === 'pushing'}
                                    disabled={!hasSelection}
                                />
                            )}
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
        </>
    );
};

export default PRDGeneratorPage;
