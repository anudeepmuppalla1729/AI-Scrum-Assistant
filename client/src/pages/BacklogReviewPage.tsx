import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGeneratedBacklog, updateStory, approveAndPushEpic, type GeneratedBacklog } from '../api/generatedBacklogApi';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { Check, Edit2, Play, AlertCircle, Loader2, ChevronRight } from 'lucide-react';

export const BacklogReviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const workspace = useWorkspaceStore((state) => state.workspace);
    const [backlog, setBacklog] = useState<GeneratedBacklog | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Collapsible epic state — default all collapsed
    const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
    
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
            fetchBacklog();
        } catch (err: any) {
            alert(`Failed to push epic: ${err.message}`);
        }
    };

    const handlePushAll = async () => {
        if (!id || !backlog) return;
        
        if (backlog.epic_statuses && backlog.epic_statuses.length > 0) {
            const epicsToPush = backlog.epic_statuses.filter((e: any) => e.status === 'pending_review' || e.status === 'failed');
            if (epicsToPush.length === 0) return;
        }
        
        try {
            await approveAndPushEpic(id, null);
            fetchBacklog();
        } catch (err: any) {
            alert(`Failed to push all epics: ${err.message}`);
        }
    };

    const toggleEpic = (epicId: string) => {
        setExpandedEpics(prev => {
            const next = new Set(prev);
            if (next.has(epicId)) {
                next.delete(epicId);
            } else {
                next.add(epicId);
            }
            return next;
        });
    };

    if (loading) {
        return (
            <div style={{ padding: 'var(--space-8)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Loader2 style={{ width: 32, height: 32, color: 'var(--color-accent)' }} className="animate-spin" />
            </div>
        );
    }

    if (error || !backlog) {
        return (
            <div style={{ padding: 'var(--space-8)', color: 'var(--color-error)' }}>
                {error || 'Backlog not found'}
            </div>
        );
    }

    const { orchestrator_contract, stories, epic_statuses, validation_report } = backlog;
    const hasPendingOrFailedEpics = !epic_statuses || epic_statuses.length === 0 || epic_statuses.some((e: any) => e.status === 'pending_review' || e.status === 'failed');
    const isPushing = epic_statuses?.some((e: any) => e.status === 'pushing');

    const getStatusBadgeClass = () => {
        if (backlog.status === 'fully_pushed') return 'badge badge-status-pushed';
        return 'badge badge-status-pending';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg-secondary)', overflowY: 'auto' }} className="custom-scrollbar">
            {/* Header */}
            <div className="glass-panel" style={{
                position: 'sticky',
                top: 0,
                zIndex: 'var(--z-sticky)' as any,
                borderRadius: 0,
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                padding: 'var(--space-5) var(--space-6)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
                    <div>
                        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-tight)', fontFamily: 'var(--font-display)' }}>
                            Review Generated Backlog
                        </h1>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>
                            {validation_report?.passed} stories passed, {validation_report?.failed_and_flagged} flagged.
                        </p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <span className={getStatusBadgeClass()}>
                            {backlog.status.replace('_', ' ').toUpperCase()}
                        </span>
                        
                        {(hasPendingOrFailedEpics || backlog.status === 'pending_review') && (
                            <button onClick={handlePushAll} disabled={isPushing} className="btn btn-primary">
                                {isPushing ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> : <Play style={{ width: 16, height: 16 }} />}
                                {isPushing ? 'Pushing...' : 'Push All to Jira'}
                            </button>
                        )}

                        <button onClick={() => navigate('/prd')} className="btn btn-secondary">
                            Back to Generator
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: 'var(--space-6)', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {orchestrator_contract?.epics?.map((epic: any) => {
                        const epicStories = stories.filter(s => s.epic_id === epic.id);
                        const epicStatus = epic_statuses?.find((e: any) => e.epic_id === epic.id);
                        const isPending = !epicStatus || epicStatus.status === 'pending_review';
                        const isExpanded = expandedEpics.has(epic.id);
                        
                        return (
                            <div key={epic.id} className="epic-card">
                                {/* Epic Header — clickable to collapse/expand */}
                                <div className="epic-card-header" onClick={() => toggleEpic(epic.id)}>
                                    {/* Chevron */}
                                    <div className={`chevron-rotate ${isExpanded ? 'rotated' : ''}`} style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-tertiary)' }}>
                                        <ChevronRight style={{ width: 20, height: 20 }} />
                                    </div>

                                    {/* Epic info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-1)' }}>
                                            <span className="badge badge-epic" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontSize: '0.65rem' }}>
                                                Epic
                                            </span>
                                            <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {epic.title}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {epic.description}
                                        </p>
                                        {!isExpanded && epicStories.length > 0 && (
                                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)', fontWeight: 'var(--weight-medium)' }}>
                                                {epicStories.length} {epicStories.length === 1 ? 'story' : 'stories'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Status & Actions */}
                                    <div className="flex items-center gap-2" style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                        {isPending && (
                                            <button onClick={() => handlePushEpic(epic.id)} className="btn btn-primary btn-sm">
                                                <Play style={{ width: 14, height: 14 }} /> Push Epic
                                            </button>
                                        )}
                                        {epicStatus?.status === 'pushing' && (
                                            <span className="badge badge-status-pushing">
                                                <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> Pushing…
                                            </span>
                                        )}
                                        {epicStatus?.status === 'pushed' && (
                                            <span className="badge badge-status-pushed">
                                                <Check style={{ width: 14, height: 14 }} /> Pushed
                                            </span>
                                        )}
                                        {epicStatus?.status === 'failed' && (
                                            <div className="flex items-center gap-2">
                                                <span className="badge badge-status-failed">
                                                    <AlertCircle style={{ width: 14, height: 14 }} /> Failed
                                                </span>
                                                <button onClick={() => handlePushEpic(epic.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-info)' }}>
                                                    Retry
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Collapsible Stories */}
                                <CollapsibleStories isExpanded={isExpanded}>
                                    <div style={{ borderTop: '1px solid var(--color-border-light)' }}>
                                        {epicStories.map((story, idx) => (
                                            <div key={story.story_id} style={{ borderBottom: idx < epicStories.length - 1 ? '1px solid var(--color-border-light)' : 'none' }}>
                                                <StoryReviewItem 
                                                    story={story} 
                                                    backlogId={id!} 
                                                    isEditable={epicStatus?.status === 'pending_review' || epicStatus?.status === 'failed'} 
                                                />
                                            </div>
                                        ))}
                                        {epicStories.length === 0 && (
                                            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
                                                No stories drafted for this epic.
                                            </div>
                                        )}
                                    </div>
                                </CollapsibleStories>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Collapsible wrapper with smooth height animation
const CollapsibleStories = ({ isExpanded, children }: { isExpanded: boolean; children: React.ReactNode }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [maxHeight, setMaxHeight] = useState(0);

    useEffect(() => {
        if (contentRef.current) {
            setMaxHeight(contentRef.current.scrollHeight);
        }
    }, [children, isExpanded]);

    return (
        <div
            className={`collapsible-content ${isExpanded ? 'expanded' : 'collapsed'}`}
            style={{ maxHeight: isExpanded ? `${maxHeight}px` : '0px' }}
        >
            <div ref={contentRef}>
                {children}
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
            <div className="animate-fade-in" style={{ padding: 'var(--space-5)', background: 'var(--color-bg-secondary)' }}>
                <div className="form-group">
                    <label className="form-label">User Story</label>
                    <input 
                        className="input"
                        value={editedStory.user_story}
                        onChange={e => setEditedStory({...editedStory, user_story: e.target.value})}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea 
                        className="textarea custom-scrollbar"
                        style={{ minHeight: '80px' }}
                        value={editedStory.description}
                        onChange={e => setEditedStory({...editedStory, description: e.target.value})}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Acceptance Criteria</label>
                    <textarea 
                        className="textarea custom-scrollbar"
                        style={{ minHeight: '100px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}
                        value={(editedStory.acceptance_criteria || []).join('\n')}
                        onChange={e => setEditedStory({...editedStory, acceptance_criteria: e.target.value.split('\n')})}
                        placeholder="One criterion per line"
                    />
                </div>
                <div className="flex justify-between" style={{ paddingTop: 'var(--space-2)', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                    <button className="btn btn-ghost" onClick={() => { setIsEditing(false); setEditedStory(story); }}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="story-review-item" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="flex items-start gap-3">
                    <span className="badge badge-story" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontSize: '0.6rem', marginTop: '2px' }}>
                        Story
                    </span>
                    <div>
                        <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)', lineHeight: 'var(--leading-snug)' }}>
                            {story.user_story}
                        </h4>
                        <div className="story-meta">
                            <span className="story-meta-tag">{story.story_points} pts</span>
                            <span>{story.priority}</span>
                            <span>Sprint {story.sprint}</span>
                            {story.validation_status === 'failed' && (
                                <span className="badge badge-error" style={{ fontSize: '0.65rem' }}>
                                    <AlertCircle style={{ width: 12, height: 12 }} /> Flagged
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {isEditable && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="btn-icon btn-ghost story-edit-btn"
                    >
                        <Edit2 style={{ width: 16, height: 16 }} />
                    </button>
                )}
            </div>
            
            {(story.description || (story.acceptance_criteria && story.acceptance_criteria.length > 0)) && (
                <div className="story-detail-panel">
                    {story.description && (
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                            <strong className="form-label" style={{ marginBottom: 'var(--space-1)', fontSize: '0.6rem' }}>Description</strong>
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 'var(--leading-relaxed)', fontSize: 'var(--text-sm)' }}>{story.description}</p>
                        </div>
                    )}
                    {story.acceptance_criteria && story.acceptance_criteria.length > 0 && (
                        <div>
                            <strong className="form-label" style={{ marginBottom: 'var(--space-1)', fontSize: '0.6rem' }}>Acceptance Criteria</strong>
                            <ul style={{ listStyleType: 'disc', paddingLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', lineHeight: 'var(--leading-relaxed)', fontSize: 'var(--text-sm)' }}>
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
