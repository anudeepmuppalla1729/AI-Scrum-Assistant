import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGeneratedBacklog, updateStory, approveAndPushEpic, type GeneratedBacklog } from '../api/generatedBacklogApi';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { Check, X, Edit2, Play, AlertCircle, Loader2 } from 'lucide-react';

export const BacklogReviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const workspace = useWorkspaceStore((state) => state.workspace);
    const [backlog, setBacklog] = useState<GeneratedBacklog | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Polling setup for background pushes
    const [isPolling, setIsPolling] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetchBacklog();
    }, [id]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPolling && id) {
            interval = setInterval(() => {
                fetchBacklog(true);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isPolling, id]);

    const fetchBacklog = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await getGeneratedBacklog(id!);
            setBacklog(data);
            setError(null);
            
            // Check if we need to poll
            const hasPushing = data.epic_statuses.some((e: any) => e.status === 'pushing');
            setIsPolling(hasPushing);
            
        } catch (err: any) {
            if (!silent) setError(err.message || 'Failed to load backlog');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handlePushEpic = async (epicId: string) => {
        if (!id) return;
        try {
            await approveAndPushEpic(id, epicId);
            fetchBacklog(); // Fetch immediately to see 'pushing' status
        } catch (err: any) {
            alert(`Failed to push epic: ${err.message}`);
        }
    };

    const handlePushAll = async () => {
        if (!id || !backlog) return;
        
        // Find epics that are pending or failed (if tracking exists)
        if (backlog.epic_statuses && backlog.epic_statuses.length > 0) {
            const epicsToPush = backlog.epic_statuses.filter((e: any) => e.status === 'pending_review' || e.status === 'failed');
            if (epicsToPush.length === 0) return;
        }
        
        try {
            await approveAndPushEpic(id, null); // null epicId pushes all
            fetchBacklog(); // Fetch immediately to see 'pushing' status
        } catch (err: any) {
            alert(`Failed to push all epics: ${err.message}`);
        }
    };

    if (loading) {
        return <div className="p-8 flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" /></div>;
    }

    if (error || !backlog) {
        return <div className="p-8 text-red-500">{error || 'Backlog not found'}</div>;
    }

    const { orchestrator_contract, stories, epic_statuses, validation_report } = backlog;
    const hasPendingOrFailedEpics = !epic_statuses || epic_statuses.length === 0 || epic_statuses.some((e: any) => e.status === 'pending_review' || e.status === 'failed');
    const isPushing = epic_statuses?.some((e: any) => e.status === 'pushing');

    return (
        <div className="flex flex-col h-full bg-[var(--color-surface)] overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[var(--color-bg-primary)] border-b border-[var(--color-border)] p-6 shadow-sm">
                <div className="flex justify-between items-center max-w-5xl mx-auto">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Review Generated Backlog</h1>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                            {validation_report?.passed} stories passed, {validation_report?.failed_and_flagged} flagged.
                        </p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${backlog.status === 'fully_pushed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {backlog.status.replace('_', ' ').toUpperCase()}
                        </span>
                        
                        {(hasPendingOrFailedEpics || backlog.status === 'pending_review') && (
                            <button
                                onClick={handlePushAll}
                                disabled={isPushing}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                {isPushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                {isPushing ? 'Pushing...' : 'Push All to Jira'}
                            </button>
                        )}

                        <button
                            onClick={() => navigate('/prd')}
                            className="btn btn-secondary"
                        >
                            Back to Generator
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 max-w-5xl mx-auto w-full space-y-8">
                {orchestrator_contract?.epics?.map((epic: any) => {
                    const epicStories = stories.filter(s => s.epic_id === epic.id);
                    const epicStatus = epic_statuses?.find((e: any) => e.epic_id === epic.id);
                    const isPending = !epicStatus || epicStatus.status === 'pending_review';
                    
                    return (
                        <div key={epic.id} className="bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
                            {/* Epic Header */}
                            <div className="p-5 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-2 py-1 text-xs font-bold bg-purple-100 text-purple-700 rounded uppercase tracking-wider">Epic</span>
                                        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{epic.title}</h2>
                                    </div>
                                    <p className="text-sm text-[var(--color-text-secondary)] max-w-3xl">{epic.description}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    {isPending && (
                                        <button 
                                            onClick={() => handlePushEpic(epic.id)}
                                            className="btn btn-primary flex items-center gap-2"
                                        >
                                            <Play className="w-4 h-4" /> Push Epic
                                        </button>
                                    )}
                                    {epicStatus?.status === 'pushing' && (
                                        <div className="flex items-center gap-2 text-blue-600 font-medium">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Pushing...
                                        </div>
                                    )}
                                    {epicStatus?.status === 'pushed' && (
                                        <div className="flex items-center gap-2 text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
                                            <Check className="w-4 h-4" /> Pushed
                                        </div>
                                    )}
                                    {epicStatus?.status === 'failed' && (
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-2 text-red-600 font-medium bg-red-50 px-3 py-1 rounded-full">
                                                <AlertCircle className="w-4 h-4" /> Push Failed
                                            </div>
                                            <button 
                                                onClick={() => handlePushEpic(epic.id)}
                                                className="text-xs text-blue-600 hover:underline"
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Epic Stories */}
                            <div className="divide-y divide-[var(--color-border-light)]">
                                {epicStories.map((story) => (
                                    <StoryReviewItem 
                                        key={story.story_id} 
                                        story={story} 
                                        backlogId={id!} 
                                        isEditable={epicStatus?.status === 'pending_review' || epicStatus?.status === 'failed'} 
                                    />
                                ))}
                                {epicStories.length === 0 && (
                                    <div className="p-6 text-center text-[var(--color-text-tertiary)] text-sm">
                                        No stories drafted for this epic.
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Sub-component for individual story review
const StoryReviewItem = ({ story, backlogId, isEditable }: { story: any, backlogId: string, isEditable: boolean }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedStory, setEditedStory] = useState(story);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateStory(backlogId, story.story_id, editedStory);
            setIsEditing(false);
        } catch (err) {
            alert('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    if (isEditing && isEditable) {
        return (
            <div className="p-5 bg-white space-y-4 relative">
                <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">User Story</label>
                    <input 
                        className="w-full border border-[var(--color-border)] rounded-md p-2 text-sm focus:ring-2 focus:ring-[var(--color-accent)]"
                        value={editedStory.user_story}
                        onChange={e => setEditedStory({...editedStory, user_story: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Description</label>
                    <textarea 
                        className="w-full border border-[var(--color-border)] rounded-md p-2 text-sm h-24 focus:ring-2 focus:ring-[var(--color-accent)] custom-scrollbar"
                        value={editedStory.description}
                        onChange={e => setEditedStory({...editedStory, description: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Acceptance Criteria</label>
                    <textarea 
                        className="w-full border border-[var(--color-border)] rounded-md p-2 text-sm h-32 focus:ring-2 focus:ring-[var(--color-accent)] custom-scrollbar"
                        value={(editedStory.acceptance_criteria || []).join('\n')}
                        onChange={e => setEditedStory({...editedStory, acceptance_criteria: e.target.value.split('\n')})}
                        placeholder="One criterion per line"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button className="btn text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]" onClick={() => { setIsEditing(false); setEditedStory(story); }}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 hover:bg-[var(--color-bg-secondary)] transition-colors group relative">
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                    <span className="px-2 py-0.5 mt-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded uppercase tracking-wider">Story</span>
                    <div>
                        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">{story.user_story}</h4>
                        <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-text-tertiary)] font-medium">
                            <span className="bg-[var(--color-bg-tertiary)] px-2 py-0.5 rounded text-[var(--color-text-secondary)]">{story.story_points} pts</span>
                            <span>{story.priority}</span>
                            <span>Sprint {story.sprint}</span>
                            {story.validation_status === 'failed' && (
                                <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                    <AlertCircle className="w-3 h-3" /> Flagged
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {isEditable && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-lighter)] rounded-md opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                )}
            </div>
            
            {(story.description || (story.acceptance_criteria && story.acceptance_criteria.length > 0)) && (
                <div className="mt-4 ml-12 text-sm text-[var(--color-text-secondary)] bg-white border border-[var(--color-border-light)] p-3 rounded-lg shadow-sm">
                    {story.description && (
                        <div className="mb-3">
                            <strong className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1 block">Description</strong>
                            <p className="whitespace-pre-wrap">{story.description}</p>
                        </div>
                    )}
                    {story.acceptance_criteria && story.acceptance_criteria.length > 0 && (
                        <div>
                            <strong className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1 block">Acceptance Criteria</strong>
                            <ul className="list-disc pl-5 space-y-1">
                                {story.acceptance_criteria.map((ac: string, i: number) => (
                                    <li key={i}>{ac}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BacklogReviewPage;
