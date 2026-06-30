import React from 'react';
import { useNavigate } from 'react-router-dom';

const Brand: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate('/workspace')}
            className="brand-container hover-lift"
        >
            <div className="brand-logo shadow-md">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <span className="brand-text">AI Scrum<span className="text-accent">.</span></span>
        </div>
    );
};

export default Brand;
