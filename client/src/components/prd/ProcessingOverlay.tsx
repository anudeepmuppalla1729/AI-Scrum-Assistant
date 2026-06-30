import React, { useState, useEffect } from "react";

const QUOTES = [
  "Crafting your tickets...",
  "Translating PRD to tasks...",
  "Our agents are working in the background.",
  "You can visit this session later.",
  "Slicing user stories...",
  "Estimating story points...",
  "Generating acceptance criteria...",
];

export const ProcessingOverlay: React.FC = () => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setOpacity(0);
      
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        // Fade in
        setOpacity(1);
      }, 500); // Wait for fade out to complete
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[var(--color-bg-primary)]">
      <div className="relative w-24 h-24 mb-8">
        {/* Animated rings */}
        <div className="absolute inset-0 border-4 border-[var(--color-accent-subtle)] rounded-full"></div>
        <div className="absolute inset-0 border-4 border-[var(--color-accent)] rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-2 border-4 border-[var(--color-purple-subtle)] rounded-full"></div>
        <div className="absolute inset-2 border-4 border-[var(--color-purple)] rounded-full border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      
      <h3 className="heading-lg text-[var(--color-text-primary)] mb-3">
        Agents at Work
      </h3>
      
      <div 
        className="h-8 transition-opacity duration-500 ease-in-out"
        style={{ opacity }}
      >
        <p className="text-base text-[var(--color-text-secondary)] font-medium">
          {QUOTES[quoteIndex]}
        </p>
      </div>

      <div className="mt-12 max-w-sm">
        <p className="text-sm text-[var(--color-text-tertiary)] bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-[var(--color-border-light)]">
          <span className="font-bold text-[var(--color-text-primary)] block mb-1">Background Processing</span>
          This task might take a few minutes. You can safely close this window or visit other pages. Your session will automatically update when ready.
        </p>
      </div>
    </div>
  );
};
