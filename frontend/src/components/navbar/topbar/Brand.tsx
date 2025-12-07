import React from 'react';
import { useNavigate } from 'react-router-dom';

const Brand: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate('/workspace')}
            className="text-xl font-bold text-gray-900 cursor-pointer select-none hover:opacity-80 transition-opacity"
        >
            AI Scrum Assistant
        </div>
    );
};

export default Brand;
