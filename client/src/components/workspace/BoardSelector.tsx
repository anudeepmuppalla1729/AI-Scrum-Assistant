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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
                <div
                    key={board.id}
                    onClick={() => onSelect(board)}
                    className={`
            cursor-pointer p-4 rounded-lg border-2 transition-all duration-200
            ${selectedBoardId === board.id
                            ? 'border-blue-500 bg-blue-50/10 shadow-md ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                        }
          `}
                >
                    <h3 className="font-semibold text-lg text-gray-800">{board.name}</h3>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-xs uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {board.type}
                        </span>
                        {/* Optional: Add more details if available, like project key */}
                        {board.location && (
                            <span className="text-xs text-gray-400">
                                {board.location.projectKey}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
