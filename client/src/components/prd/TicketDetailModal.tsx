import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// Snap points as fractions of viewport height (from bottom)
const SNAP_PEEK = 0.30;
const SNAP_HALF = 0.50;
const SNAP_FULL = 0.90;
const SNAP_POINTS = [SNAP_PEEK, SNAP_HALF, SNAP_FULL];
const CLOSE_THRESHOLD = 0.15;

function getClosestSnap(fraction: number): number {
    let closest = SNAP_POINTS[0];
    let minDist = Math.abs(fraction - closest);
    for (const snap of SNAP_POINTS) {
        const dist = Math.abs(fraction - snap);
        if (dist < minDist) {
            minDist = dist;
            closest = snap;
        }
    }
    return closest;
}

function getBadgeClass(type: TicketType): string {
    if (type === 'Epic') return 'badge badge-epic';
    if (type === 'Story') return 'badge badge-story';
    return 'badge badge-task';
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

    // Sheet state
    const [sheetHeight, setSheetHeight] = useState(SNAP_HALF);
    const [isDragging, setIsDragging] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const dragStartY = useRef(0);
    const dragStartHeight = useRef(SNAP_HALF);
    const lastMoveTime = useRef(0);
    const lastMoveY = useRef(0);
    const velocity = useRef(0);

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

    // Handle open/close transitions
    useEffect(() => {
        if (isOpen) {
            setIsClosing(false);
            setSheetHeight(SNAP_HALF);
            requestAnimationFrame(() => setIsVisible(true));
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setIsVisible(false);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 250);
    }, [onClose]);

    // Pointer handlers for drag
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        setIsDragging(true);
        dragStartY.current = e.clientY;
        dragStartHeight.current = sheetHeight;
        lastMoveTime.current = Date.now();
        lastMoveY.current = e.clientY;
        velocity.current = 0;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [sheetHeight]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;
        const deltaY = dragStartY.current - e.clientY;
        const deltaFraction = deltaY / window.innerHeight;
        const newHeight = Math.max(0.05, Math.min(SNAP_FULL, dragStartHeight.current + deltaFraction));
        setSheetHeight(newHeight);

        const now = Date.now();
        const dt = now - lastMoveTime.current;
        if (dt > 0) {
            velocity.current = (lastMoveY.current - e.clientY) / dt;
        }
        lastMoveTime.current = now;
        lastMoveY.current = e.clientY;
    }, [isDragging]);

    const handlePointerUp = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);

        if (sheetHeight < CLOSE_THRESHOLD || (velocity.current < -0.5 && sheetHeight < SNAP_PEEK)) {
            handleClose();
            return;
        }

        let target = sheetHeight;
        if (velocity.current > 0.3) {
            target = SNAP_POINTS.find(s => s > sheetHeight) || SNAP_FULL;
        } else if (velocity.current < -0.3) {
            target = [...SNAP_POINTS].reverse().find(s => s < sheetHeight) || SNAP_PEEK;
        } else {
            target = getClosestSnap(sheetHeight);
        }
        setSheetHeight(target);
    }, [isDragging, sheetHeight, handleClose]);

    if (!isOpen && !isClosing) return null;
    if (!ticketData || !ticketType) return null;

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
        handleClose();
    };

    const heightPx = sheetHeight * window.innerHeight;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`bottom-sheet-overlay ${isVisible ? 'overlay-enter' : 'overlay-exit'}`}
                onClick={handleClose}
                style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
            />

            {/* Sheet */}
            <div
                className="bottom-sheet"
                style={{
                    height: `${heightPx}px`,
                    transition: isDragging ? 'none' : 'height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
                }}
            >
                {/* Drag Handle */}
                <div
                    className="bottom-sheet-handle"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                >
                    <div className="bottom-sheet-handle-pill" />
                </div>

                {/* Header */}
                <div className="bottom-sheet-header glass">
                    <div className="flex items-center gap-3">
                        <span className={getBadgeClass(ticketType)} style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontSize: '0.65rem' }}>
                            {ticketType}
                        </span>
                        <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                            Edit Details
                        </span>
                    </div>
                    <button onClick={handleClose} className="btn-icon btn-ghost">
                        <X style={{ width: 16, height: 16 }} />
                    </button>
                </div>

                {/* Body */}
                <div className="bottom-sheet-body custom-scrollbar">
                    {/* Title / Summary */}
                    <div className="form-group">
                        <label className="form-label">
                            {ticketType === 'Epic' ? 'Title' : 'Summary'}
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="input"
                            placeholder={`Enter ${ticketType.toLowerCase()} ${ticketType === 'Epic' ? 'title' : 'summary'}`}
                        />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label className="form-label">
                            <AlignLeft style={{ width: 14, height: 14 }} /> Description
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="textarea custom-scrollbar"
                            style={{ minHeight: '100px' }}
                            placeholder={`Enter detailed description for this ${ticketType.toLowerCase()}...`}
                        />
                    </div>

                    {/* Acceptance Criteria — Story & Task */}
                    {(ticketType === 'Story' || ticketType === 'Task') && (
                        <div className="form-group">
                            <label className="form-label">
                                <ListTodo style={{ width: 14, height: 14 }} /> Acceptance Criteria
                            </label>
                            <textarea
                                value={acceptanceCriteria}
                                onChange={e => setAcceptanceCriteria(e.target.value)}
                                className="textarea custom-scrollbar"
                                style={{ minHeight: '100px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}
                                placeholder="One criterion per line..."
                            />
                        </div>
                    )}

                    {/* Story-specific fields */}
                    {ticketType === 'Story' && (
                        <div className="form-group" style={{ display: 'flex', gap: 'var(--space-4)' }}>
                            <div style={{ flex: 1 }}>
                                <label className="form-label">Story Points</label>
                                <input
                                    type="number"
                                    value={storyPoints}
                                    onChange={e => setStoryPoints(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="input"
                                    min="0"
                                    max="100"
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className="form-label">Priority</label>
                                <select
                                    value={priority}
                                    onChange={e => setPriority(e.target.value)}
                                    className="input"
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

                    {/* Task-specific fields */}
                    {ticketType === 'Task' && (
                        <div className="form-group" style={{ maxWidth: '240px' }}>
                            <label className="form-label">Priority</label>
                            <select
                                value={priority}
                                onChange={e => setPriority(e.target.value)}
                                className="input"
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
                <div className="bottom-sheet-footer">
                    <div>
                        {ticketType === 'Epic' && onPush && (
                            <button
                                onClick={onPush}
                                disabled={isPushing}
                                className="btn btn-primary"
                                style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                            >
                                {isPushing ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> : <Play style={{ width: 16, height: 16 }} />}
                                {isPushing ? 'Pushing to Jira...' : 'Push Epic to Jira'}
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleClose} className="btn btn-ghost">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="btn btn-primary">
                            <Save style={{ width: 16, height: 16 }} /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
