import React from 'react';
import type { JiraSprint } from '../../types/jira';

interface SprintSelectorProps {
    sprints: JiraSprint[];
    selectedSprintId: number | null;
    onSelect: (sprint: JiraSprint) => void;
}

export const SprintSelector: React.FC<SprintSelectorProps> = ({ sprints, selectedSprintId, onSelect }) => {
    // Auto-highlight active sprint if no sprint is selected locally yet
    // However, the requirement says "Highlight the active sprint automatically, but allow selecting any".
    // This might mean visual highlight or auto-selection. 
    // "Display sprint list... Highlight the active sprint automatically... User chooses a sprint -> becomes selectedSprint."
    // I will interpret this as: Active sprint has a distinctive visual style (e.g. "Active" badge), 
    // and maybe we can auto-select it if user hasn't chosen one? 
    // The requirement says "Highlight... but allow selecting".
    // I'll stick to visual distinction and let the parent handle auto-selection logic if needed, 
    // or just make the active one very obvious.

    // Actually, "Highlight the active sprint automatically" usually implies selection in some contexts, but here
    // "User chooses a sprint -> becomes selectedSprint" suggests manual action.
    // I will add a visual badge for 'active' and maybe a slight background tint.

    if (sprints.length === 0) {
        return <div className="text-gray-500 italic">No sprints found for this board.</div>;
    }

    return (
        <div className="space-y-3">
            {sprints.map((sprint) => {
                const isActive = sprint.state === 'active';
                const isSelected = selectedSprintId === sprint.id;

                return (
                    <div
                        key={sprint.id}
                        onClick={() => onSelect(sprint)}
                        className={`
              cursor-pointer p-3 rounded-md border text-left transition-colors flex justify-between items-center
              ${isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : isActive
                                    ? 'border-green-300 bg-green-50/30 hover:bg-green-50' // Subtle hint for active
                                    : 'border-gray-200 hover:bg-gray-50'
                            }
            `}
                    >
                        <div>
                            <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                                {sprint.name}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                                From {new Date(sprint.startDate || '').toLocaleDateString()} to {new Date(sprint.endDate || '').toLocaleDateString()}
                            </div>
                        </div>

                        <span className={`
              text-xs px-2 py-1 rounded-full uppercase tracking-wide font-bold
              ${sprint.state === 'active' ? 'bg-green-100 text-green-700' : ''}
              ${sprint.state === 'future' ? 'bg-blue-100 text-blue-700' : ''}
              ${sprint.state === 'closed' ? 'bg-gray-100 text-gray-500' : ''}
            `}>
                            {sprint.state}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};
