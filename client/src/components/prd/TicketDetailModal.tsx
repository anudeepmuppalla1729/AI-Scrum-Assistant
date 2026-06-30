import React, { useState, useEffect } from 'react';
import { X, Save, Play, Loader2, ListTodo, AlignLeft } from 'lucide-react';
import type { EpicSuggestion, StorySuggestion, TaskSuggestion } from '../../types/prd.types';

export type TicketType = 'Epic' | 'Story' | 'Task';

export interface TicketDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticketType: TicketType | null;
    ticketData: EpicSuggestion | StorySuggestion | TaskSuggestion | null;
    onSave: (updates: Record<string, unknown>) => void;
    onPush?: () => void;
    isPushing?: boolean;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
    isOpen,
    onClose,
    ticketType,
    ticketData,
    onSave,
    onPush,
    isPushing = false
}) => {
    // Local state for editing
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
    const [storyPoints, setStoryPoints] = useState<number | ''>('');
    const [priority, setPriority] = useState('Medium');

    useEffect(() => {
        if (ticketData) {
            setTitle((ticketData as EpicSuggestion).title || (ticketData as StorySuggestion).summary || '');
            setDescription(ticketData.description || '');
            if (ticketType === 'Story') {
                const story = ticketData as StorySuggestion;
                setAcceptanceCriteria(story.acceptance_criteria?.join('\n') || '');
                setStoryPoints(story.story_points ?? '');   
                setPriority(story.priority || 'Medium');
            } else if (ticketType === 'Task') {
                const task = ticketData as TaskSuggestion;
                setAcceptanceCriteria(task.acceptance_criteria?.join('\n') || '');
                setPriority(task.priority || 'Medium');
            }
        }
    }, [ticketData, ticketType, isOpen]);

    if (!isOpen || !ticketData || !ticketType) return null;

    const handleSave = () => {
        const updates: Record<string, unknown> = {};
        if (ticketType === 'Epic') {
            updates.title = title;
            updates.description = description;
        } else if (ticketType === 'Story') {
            updates.summary = title;
            updates.description = description;
            updates.acceptance_criteria = acceptanceCriteria.split('\n').map(s => s.trim()).filter(s => s.length > 0);
            updates.story_points = storyPoints === '' ? undefined : Number(storyPoints);
            updates.priority = priority;
        } else if (ticketType === 'Task') {
            updates.summary = title;
            updates.description = description;
            updates.acceptance_criteria = acceptanceCriteria.split('\n').map(s => s.trim()).filter(s => s.length > 0);
            updates.priority = priority;
        }
        onSave(updates);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[var(--color-bg-primary)] rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden border border-[var(--color-border)]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded ${
                            ticketType === 'Epic' ? 'bg-purple-100 text-purple-700' :
                            ticketType === 'Story' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                        }`}>
                            {ticketType}
                        </span>
                        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Edit Details</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors rounded-md hover:bg-[var(--color-bg-tertiary)]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Title / Summary */}
                    <div>
                        <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                            {ticketType === 'Epic' ? 'Title' : 'Summary'}
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="input w-full text-base font-medium"
                            placeholder={`Enter ${ticketType.toLowerCase()} ${ticketType === 'Epic' ? 'title' : 'summary'}`}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                            <AlignLeft className="w-4 h-4" /> Description
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="input w-full h-32 py-3 custom-scrollbar"
                            placeholder={`Enter detailed description for this ${ticketType.toLowerCase()}...`}
                        />
                    </div>

                    {/* Shared Fields for Story & Task */}
                    {(ticketType === 'Story' || ticketType === 'Task') && (
                        <>
                            <div>
                                <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                                    <ListTodo className="w-4 h-4" /> Acceptance Criteria
                                </label>
                                <textarea
                                    value={acceptanceCriteria}
                                    onChange={e => setAcceptanceCriteria(e.target.value)}
                                    className="input w-full h-32 py-3 custom-scrollbar font-mono text-sm"
                                    placeholder="One criterion per line..."
                                />
                            </div>
                        </>
                    )}

                    {/* Story Specific Fields */}
                    {ticketType === 'Story' && (
                        <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                                        Story Points
                                    </label>
                                    <input
                                        type="number"
                                        value={storyPoints}
                                        onChange={e => setStoryPoints(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="input w-full"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                                        Priority
                                    </label>
                                    <select
                                        value={priority}
                                        onChange={e => setPriority(e.target.value)}
                                        className="input w-full bg-white"
                                    >
                                        <option value="Highest">Highest</option>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                        <option value="Lowest">Lowest</option>
                                    </select>
                                </div>
                            </div>
                    )}

                    {/* Task Specific Fields */}
                    {ticketType === 'Task' && (
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                                Priority
                            </label>
                            <select
                                value={priority}
                                onChange={e => setPriority(e.target.value)}
                                className="input w-full bg-white"
                            >
                                <option value="Highest">Highest</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                                <option value="Lowest">Lowest</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex justify-between items-center">
                    <div>
                        {ticketType === 'Epic' && onPush && (
                            <button
                                onClick={onPush}
                                disabled={isPushing}
                                className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 border-transparent"
                            >
                                {isPushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                {isPushing ? 'Pushing to Jira...' : 'Push Epic to Jira'}
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="btn text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] border-transparent">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="btn btn-primary flex items-center gap-2">
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
