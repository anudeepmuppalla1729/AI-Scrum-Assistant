import React, { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

interface BusinessDocument {
  _id: string;
  filename: string;
  syncStatus: "PENDING" | "SYNCED" | "FAILED";
  createdAt: string;
}

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workspace = useWorkspaceStore((state) => state.workspace);

  useEffect(() => {
    fetchDocuments();
  }, [workspace?.boardId]);

  const fetchDocuments = async () => {
    try {
      const url = workspace?.boardId 
        ? `/api/v1/documents?boardId=${workspace.boardId}`
        : "/api/v1/documents";
      const response = await api.get(url);
      setDocuments(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch documents");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    if (workspace?.boardId) {
      formData.append("boardId", workspace.boardId.toString());
    }

    setIsUploading(true);
    setError(null);
    try {
      await api.post("/api/v1/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      fetchDocuments();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to upload document");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      await api.delete(`/api/v1/documents/${id}`);
      setDocuments(documents.filter((doc) => doc._id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete document");
    }
  };

  return (
    <div className="page-layout">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Business Documents</h1>
          <p className="page-subtitle">
            Upload requirements, specs, and business context documents for the AI to reference.
          </p>
        </div>
        <button
          onClick={handleUploadClick}
          disabled={isUploading}
          className="btn btn-primary"
        >
          {isUploading ? "Uploading..." : "Upload Document"}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.txt,.md"
          className="hidden"
        />
      </div>

      {error && (
        <div className="bg-[var(--color-error-light)] text-[var(--color-error)] p-3 rounded mb-4 text-sm border border-[var(--color-error)]">
          {error}
        </div>
      )}

      <div className="doc-list-container">
        {documents.length === 0 ? (
          <div className="doc-empty-state">
            <svg className="doc-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p className="doc-empty-title">No documents yet</p>
            <p className="doc-empty-desc">Upload PDF or Text files to provide business context.</p>
          </div>
        ) : (
          <ul className="doc-list">
            {documents.map((doc) => (
              <li key={doc._id} className="doc-list-item">
                <div className="doc-info-wrapper">
                  <div className="doc-icon-box">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="doc-filename">{doc.filename}</p>
                    <p className="doc-date">
                      Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="doc-actions-wrapper">
                  <span
                    className={`badge ${
                      doc.syncStatus === "SYNCED"
                        ? "badge-success"
                        : doc.syncStatus === "FAILED"
                        ? "badge-error"
                        : "badge-warning"
                    }`}
                  >
                    {doc.syncStatus}
                  </span>
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="btn-icon-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-error)]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
