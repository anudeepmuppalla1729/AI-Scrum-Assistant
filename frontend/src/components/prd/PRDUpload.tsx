import React, { useState, useCallback } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';

interface PRDUploadProps {
    onUpload: (file: File) => Promise<void>;
    isLoading: boolean;
}

export const PRDUpload: React.FC<PRDUploadProps> = ({ onUpload, isLoading }) => {
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        setError(null);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type !== 'application/pdf') {
                setError("Please upload a PDF file.");
                return;
            }
            onUpload(file);
        }
    }, [onUpload]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        setError(null);
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                setError("Please upload a PDF file.");
                return;
            }
            onUpload(file);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto mb-8">
            <div
                className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                    ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'}
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    onChange={handleChange}
                    accept=".pdf"
                    disabled={isLoading}
                />

                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isLoading ? (
                        <>
                            <Loader2 className="w-10 h-10 mb-3 text-blue-500 animate-spin" />
                            <p className="text-sm text-gray-400">Analyzing PRD and generating tasks...</p>
                        </>
                    ) : (
                        <>
                            <Upload className="w-10 h-10 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-400">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PDF files only (MAX. 10MB)</p>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-4 flex items-center space-x-2 text-red-400 bg-red-400/10 p-3 rounded">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">{error}</span>
                </div>
            )}
        </div>
    );
};
