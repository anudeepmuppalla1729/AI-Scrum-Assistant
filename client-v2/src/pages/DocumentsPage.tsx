import { useEffect, useState, useCallback } from "react";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import * as docsApi from "../api/documents";
import type { BusinessDocument } from "../types";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Upload, FileText, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import "./DocumentsPage.css";

export function DocumentsPage() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await docsApi.getDocuments(workspace?.boardId?.toString());
      setDocuments(docs);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await docsApi.uploadDocument(file, workspace?.boardId?.toString());
      await loadDocuments();
    } catch {
      // silent
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await docsApi.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch {
      // silent
    }
  };

  const getStatusBadge = (status: BusinessDocument["syncStatus"]) => {
    switch (status) {
      case "SYNCED":
        return <Badge variant="success"><CheckCircle2 size={12} /> Synced</Badge>;
      case "PENDING":
        return <Badge variant="warning"><Loader2 size={12} className="badge-spinner" /> Pending</Badge>;
      case "FAILED":
        return <Badge variant="error"><AlertCircle size={12} /> Failed</Badge>;
    }
  };

  return (
    <PageContainer>
      <div className="documents-page">
        <div className="documents-header">
          <div>
            <h1>Documents</h1>
            <p className="documents-subtitle">Upload business context documents for AI-powered backlog generation.</p>
          </div>
        </div>

        {/* Upload Area */}
        <div
          className="documents-upload"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleUpload(file);
          }}
        >
          <Upload size={24} />
          <div>
            <p>Drag & drop files here, or click to browse</p>
            <span>Supports PDF, TXT, and Markdown files</span>
          </div>
          <input
            type="file"
            accept=".pdf,.txt,.md"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
            className="documents-upload-input"
          />
          {uploading && <Spinner size="sm" />}
        </div>

        {/* Document List */}
        {loading && (
          <div className="documents-loading">
            <Spinner size="lg" />
          </div>
        )}

        {!loading && documents.length === 0 && (
          <EmptyState
            icon={<FileText size={48} />}
            title="No documents yet"
            description="Upload business documents to provide context for the AI when generating backlogs."
          />
        )}

        {!loading && documents.length > 0 && (
          <div className="documents-list">
            {documents.map((doc) => (
              <div key={doc._id} className="document-card card">
                <div className="document-icon">
                  <FileText size={20} />
                </div>
                <div className="document-info">
                  <h4>{doc.filename}</h4>
                  <span className="document-date">
                    {new Date(doc.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="document-actions">
                  {getStatusBadge(doc.syncStatus)}
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Trash2 size={14} />}
                    onClick={() => handleDelete(doc._id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
