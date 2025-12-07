import React from 'react';

interface WorkspaceHeaderProps {
    step: 1 | 2; // 1 for Board selection, 2 for Sprint selection (or completed)
    boardName?: string;
    sprintName?: string;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ step, boardName, sprintName }) => {
    return (
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {step === 1 ? 'Select Workspace' : 'Configure Sprint'}
            </h1>
            <p className="text-gray-600 mb-6">
                {step === 1
                    ? 'Choose a Jira board to connect with.'
                    : `Select the active sprint for ${boardName || 'the board'}.`
                }
            </p>

            {/* Progress Indicators / Breadcrumbs */}
            <div className="flex items-center space-x-4 text-sm">
                <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                        1
                    </div>
                    <span>Board {boardName && `(${boardName})`}</span>
                </div>
                <div className="w-8 h-px bg-gray-300" />
                <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                        2
                    </div>
                    <span>Sprint {sprintName && `(${sprintName})`}</span>
                </div>
            </div>
        </div>
    );
};
