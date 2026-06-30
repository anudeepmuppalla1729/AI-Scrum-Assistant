import React from 'react';
import type { JiraBoard } from '../../types/jira';

interface BoardSelectorProps {
    boards: JiraBoard[];
    selectedBoardId: number | null;
    onSelect: (board: JiraBoard) => void;
}

export const BoardSelector: React.FC<BoardSelectorProps> = ({ boards, selectedBoardId, onSelect }) => {
    if (boards.length === 0) {
        return <div className="text-gray-500 italic">No boards found.</div>;
    }

    return (
        <div className="board-grid">
            {boards.map((board) => (
                <div
                    key={board.id}
                    onClick={() => onSelect(board)}
                    className={`board-card ${selectedBoardId === board.id ? 'selected' : ''}`}
                >
                    <h3 className="board-card-title">{board.name}</h3>
                    <div className="board-card-meta">
                        <span className="board-card-type">
                            {board.type}
                        </span>
                        {/* Optional: Add more details if available, like project key */}
                        {board.location && (
                            <span className="board-card-key">
                                {board.location.projectKey}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
