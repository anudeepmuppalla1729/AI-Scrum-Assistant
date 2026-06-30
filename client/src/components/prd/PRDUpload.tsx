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
        }
    }, [onFileSelect]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
        }
    }, [onFileSelect]);

    if (file) {
        return (
            <div className="card p-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                        <div className="w-10 h-10 bg-[var(--color-bg-secondary)] rounded-md flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-[var(--color-accent)]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-[200px]">{file.name}</p>
                            <p className="text-xs text-[var(--color-text-tertiary)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    </div>
                    {!isUploading && (
                        <button
                            onClick={() => onFileSelect(null)}
                            className="btn-ghost btn-icon-sm"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                {isUploading && (
                    <div className="absolute bottom-0 left-0 right-0 progress-bar progress-bar-indeterminate">
                        <div className="progress-bar-fill"></div>
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
            className={`upload-zone ${isDragging ? 'upload-zone-active' : ''}`}
        >
            <input
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleFileInput}
                disabled={isUploading}
            />

            <div className="upload-zone-icon">
                <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Upload PRD Document
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] text-center max-w-[240px]">
                Drag and drop your PDF here, or click to browse. (Max 8MB)
            </p>
        </label>
    );
};
