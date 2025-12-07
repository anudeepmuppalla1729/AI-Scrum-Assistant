import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { BoardSelector } from '../components/workspace/BoardSelector';
import { SprintSelector } from '../components/workspace/SprintSelector';
import { WorkspaceHeader } from '../components/workspace/WorkspaceHeader';
import type { JiraBoard, JiraSprint } from '../types/jira';
import { getBoards, getSprints } from '../api/jiraApi';

export const WorkspaceSelect: React.FC = () => {
    const navigate = useNavigate();
    const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);

    // Local state for fetch data
    const [boards, setBoards] = useState<JiraBoard[]>([]);
    const [sprints, setSprints] = useState<JiraSprint[]>([]);

    // Selection state
    const [selectedBoard, setSelectedBoard] = useState<JiraBoard | null>(null);
    const [selectedSprint, setSelectedSprint] = useState<JiraSprint | null>(null);

    // Loading/Error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial load of boards
    useEffect(() => {
        const fetchBoards = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication token not found. Please log in.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const boardsData = await getBoards(token);
                // Ensure we handle the data structure correctly. 
                // api/jiraApi returns data.values which is the array.
                setBoards(boardsData || []);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch boards:', err);
                setError('Failed to load Jira boards. Please make sure the backend is running.');
                setLoading(false);
            }
        };

        fetchBoards();
    }, []);

    // Fetch sprints when board is selected
    useEffect(() => {
        if (!selectedBoard) {
            setSprints([]);
            return;
        }

        const fetchSprints = async () => {
            const token = localStorage.getItem('token');
            if (!token) return; // Should handle this case more gracefully? 

            try {
                // Determine step 2 loading state if needed, but we can just use the main loading or a specific one.
                // For simplicity, let's use a local loading indicator or just rely on 'sprints' being empty initially?
                // Let's toggle main loading for clarity or add a sub-loader. 
                // Requirement: "show loader while sprints load"
                setLoading(true);
                const sprintsData = await getSprints(selectedBoard.id, token);
                setSprints(sprintsData || []);

                // Auto-select active sprint logic?
                // Requirement: "Highlight the active sprint automatically, but allow selecting any"
                // This implies we don't necessarily force 'selectedSprint' state change, 
                // but the SprintSelector can visually highlight.
                // However, to make it frictionless, maybe we CAN pre-select it?
                // "User chooses a sprint -> becomes selectedSprint." 
                // This suggests explicit choice. I will NOT auto-set selectedSprint, just let UI highlight.
                // Unless the user wants it to be one click less. But strictly: "Highlight... User chooses..."
                // I'll stick to manual selection.

                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch sprints:', err);
                setError('Failed to load sprints.');
                setLoading(false);
            }
        };

        fetchSprints();
    }, [selectedBoard]);

    const handleBoardSelect = (board: JiraBoard) => {
        setSelectedBoard(board);
        setSelectedSprint(null); // Reset sprint when board changes
        setError(null);
    };

    const handleSprintSelect = (sprint: JiraSprint) => {
        setSelectedSprint(sprint);
    };

    const handleContinue = () => {
        if (selectedBoard && selectedSprint) {
            setWorkspace({
                boardId: selectedBoard.id,
                boardName: selectedBoard.name,
                sprintId: selectedSprint.id,
                sprintName: selectedSprint.name,
            });
            // Persistence is handled by Zustand middleware
            navigate('/chat');
        }
    };

    const step = selectedBoard ? 2 : 1;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-4xl space-y-8">

                <WorkspaceHeader
                    step={step}
                    boardName={selectedBoard?.name}
                    sprintName={selectedSprint?.name}
                />

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                                {error.includes('backend') && (
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="mt-2 text-sm text-red-600 font-medium hover:text-red-500 underline"
                                    >
                                        Retry
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg p-6">
                        {step === 1 && (
                            <BoardSelector
                                boards={boards}
                                selectedBoardId={selectedBoard?.id || null}
                                onSelect={handleBoardSelect}
                            />
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <SprintSelector
                                    sprints={sprints}
                                    selectedSprintId={selectedSprint?.id || null}
                                    onSelect={handleSprintSelect}
                                />

                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => setSelectedBoard(null)}
                                        className="text-gray-500 hover:text-gray-700 font-medium px-4 py-2"
                                    >
                                        Back to Boards
                                    </button>

                                    {selectedSprint && (
                                        <button
                                            onClick={handleContinue}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm hover:shadow-md"
                                        >
                                            Continue to Workspace
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkspaceSelect;
