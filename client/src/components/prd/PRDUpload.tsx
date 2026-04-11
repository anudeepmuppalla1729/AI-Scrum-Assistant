import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';

interface PRDUploadProps {
    file: File | null;
    onFileSelect: (file: File | null) => void;
    isUploading?: boolean;
}

export const PRDUpload: React.FC<PRDUploadProps> = ({ file, onFileSelect, isUploading }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            onFileSelect(files[0]);
        } else {
            // Optional: visual error feedback for non-PDF
        }
    }, [onFileSelect]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
        }
    }, [onFileSelect]);

    if (file) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    </div>
                    {!isUploading && (
                        <button
                            onClick={() => onFileSelect(null)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                {isUploading && (
                    <div className="mt-3 relative h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-blue-500 animate-loading-bar w-1/2 rounded-full"></div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <label
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                group relative flex flex-col items-center justify-center w-full p-8 
                border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
                ${isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }
            `}
        >
            <input
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleFileInput}
                disabled={isUploading}
            />

            <div className={`p-3 rounded-full mb-3 transition-colors ${isDragging ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                <UploadCloud className={`w-6 h-6 ${isDragging ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
            </div>

            <p className="text-sm font-medium text-gray-900 mb-1">
                Upload PRD Document
            </p>
            <p className="text-xs text-gray-500 text-center max-w-[240px]">
                Drag and drop your PDF here, or click to browse. (Max 8MB)
            </p>
        </label>
    );
};
