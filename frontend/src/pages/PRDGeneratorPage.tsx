import React, { useState } from 'react';
import { PRDUpload } from '../components/prd/PRDUpload';
import { HierarchyTree } from '../components/prd/HierarchyTree';
import { PushToJiraModal } from '../components/prd/PushToJiraModal';
import { usePRDSelection } from '../hooks/usePRDSelection';
import type { EpicSuggestion, PRDSuggestionsResponse } from '../types/prd.types';
import { uploadPRD, pushSuggestionsToJira } from '../api/scrumApi';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { AlertTriangle, CheckCircle, UploadCloud } from 'lucide-react';

const PRDGeneratorPage: React.FC = () => {
    const { workspace } = useWorkspaceStore();
    const [epics, setEpics] = useState<EpicSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPushing, setIsPushing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pushResult, setPushResult] = useState<{ success: boolean; message?: string } | null>(null);

    const {
        selection,
        expanded,
        initializeSelection,
        toggleEpic,
        toggleStory,
        toggleTask,
        toggleExpand,
        getSelectedCounts
    } = usePRDSelection(epics);

    const handleUpload = async (file: File) => {
        setIsLoading(true);
        setPushResult(null);
        try {
            const response: PRDSuggestionsResponse = await uploadPRD(file);
            setEpics(response.data.epics);
            initializeSelection(response.data.epics);
        } catch (error: any) {
            console.error(error);
            const msg = error.message || "Failed to upload PRD. Please try again.";
            alert(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const updateEpic = (index: number, updates: Partial<EpicSuggestion>) => {
        setEpics(prev => {
            const newEpics = [...prev];
            newEpics[index] = { ...newEpics[index], ...updates };
            return newEpics;
        });
    };

    const updateStory = (epicIndex: number, storyIndex: number, updates: Partial<any>) => {
        setEpics(prev => {
            const newEpics = [...prev];
            const newIssues = [...newEpics[epicIndex].issues];
            newIssues[storyIndex] = { ...newIssues[storyIndex], ...updates };
            newEpics[epicIndex] = { ...newEpics[epicIndex], issues: newIssues };
            return newEpics;
        });
    };

    const handlePushToJira = async () => {
        if (!workspace) {
            alert("No workspace selected");
            return;
        }

        setIsPushing(true);
        // Filter Data based on Selection
        const filteredEpics: EpicSuggestion[] = [];

        epics.forEach((epic, epicIndex) => {
            if (!selection[epicIndex]?.selected && Object.keys(selection[epicIndex]?.stories || {}).length === 0) return;

            const selectedStories = epic.issues.filter((_story, storyIndex) => {
                const storyState = selection[epicIndex]?.stories[storyIndex];
                // Include if story is selected OR if any tasks inside are selected
                if (storyState?.selected) return true;
                return Object.values(storyState?.tasks || {}).some(t => t);
            });

            if (selectedStories.length > 0) {
                const newEpic: EpicSuggestion = { ...epic, issues: [] };

                selectedStories.forEach(story => {
                    // Find original index to lookup selection state
                    const originalStoryIndex = epic.issues.findIndex(original => original === story);
                    const storyState = selection[epicIndex].stories[originalStoryIndex];

                    const selectedTasks = story.sub_issues.filter((_, taskIndex) => storyState?.tasks?.[taskIndex]);

                    if (selectedTasks.length > 0) {
                        newEpic.issues.push({
                            ...story,
                            sub_issues: selectedTasks
                        });
                    }
                });

                if (newEpic.issues.length > 0) {
                    filteredEpics.push(newEpic);
                }
            }
        });

        try {
            const response = await pushSuggestionsToJira({
                projectKey: workspace.boardName.split(' ')[0] || 'SCRUM',
                suggestions: {
                    data: {
                        epics: filteredEpics
                    }
                }
            });

            if (response.success && (!response.errors || response.errors.length === 0)) {
                setPushResult({ success: true, message: "Successfully pushed to Jira!" });
                setEpics([]);
                setIsModalOpen(false);
            } else {
                console.error("Partial failure pushing to Jira:", response.errors);
                const errorMsg = response.errors?.[0]?.error
                    ? JSON.stringify(response.errors[0].error)
                    : "Some items failed to push. Check console.";
                setPushResult({ success: false, message: `Completed with errors: ${errorMsg}` });
                setIsModalOpen(false);
            }
        } catch (error: any) {
            console.error("Push Error:", error);
            setPushResult({ success: false, message: error.message || "Failed to push to Jira" });
            setIsModalOpen(false);
        } finally {
            setIsPushing(false);
        }
    };

    const counts = getSelectedCounts();
    const hasSelection = counts.epicCount > 0 || counts.storyCount > 0 || counts.taskCount > 0;

    return (
        <div className="max-w-5xl mx-auto px-6 py-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">PRD to Jira Tickets</h1>
                <p className="text-gray-400">Upload your Product Requirement Document (PDF) and let AI generate your backlog.</p>
            </header>

            {/* Upload Section */}
            {!epics.length && (
                <PRDUpload onUpload={handleUpload} isLoading={isLoading} />
            )}

            {/* Results Section */}
            {epics.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-6 sticky top-0 py-4 bg-[#0B0E14] z-10 border-b border-white/5">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-lg font-semibold text-white">Generated Suggestions</h2>
                            <div className="flex space-x-2 text-xs">
                                <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20">{counts.epicCount} Epics</span>
                                <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20">{counts.storyCount} Stories</span>
                                <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">{counts.taskCount} Tasks</span>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setEpics([])}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                disabled={!hasSelection || isPushing}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <UploadCloud className="w-4 h-4" />
                                <span>Push to Jira</span>
                            </button>
                        </div>
                    </div>

                    <HierarchyTree
                        epics={epics}
                        selection={selection}
                        expanded={expanded}
                        onToggleEpic={toggleEpic}
                        onToggleStory={toggleStory}
                        onToggleTask={toggleTask}
                        onExpand={toggleExpand}
                        onUpdateEpic={updateEpic}
                        onUpdateStory={updateStory}
                    />
                </div>
            )}

            {pushResult && (
                <div className={`fixed bottom-8 right-8 p-4 rounded-lg shadow-lg border animate-in slide-in-from-right duration-300 flex items-center space-x-3
                    ${pushResult.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}
                `}>
                    {pushResult.success ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <div>
                        <p className="font-semibold">{pushResult.success ? 'Success' : 'Error'}</p>
                        <p className="text-sm opacity-90">{pushResult.message}</p>
                    </div>
                    <button onClick={() => setPushResult(null)} className="ml-4 hover:opacity-75">
                        <span className="sr-only">Close</span>×
                    </button>
                </div>
            )}

            <PushToJiraModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handlePushToJira}
                isLoading={isPushing}
                counts={counts}
            />
        </div>
    );
};

export default PRDGeneratorPage;
