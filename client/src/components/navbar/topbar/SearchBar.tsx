import React from 'react';

const SearchBar: React.FC = () => {
    return (
        <div className="search-container group">
            <div className="search-icon-wrapper">
                <svg className="transition-colors group-focus-within:text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <input
                type="text"
                className="input search-input"
                placeholder="Search tasks, sprints... (coming soon)"
                disabled
            />
        </div>
    );
};

export default SearchBar;
