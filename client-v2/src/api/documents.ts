import api from "./axios";
import type { BusinessDocument } from "../types";

export async function getDocuments(boardId?: string): Promise<BusinessDocument[]> {
  const params = boardId ? `?boardId=${boardId}` : "";
  const { data } = await api.get(`/api/v1/documents${params}`);
  return data;
}

export async function uploadDocument(file: File, boardId?: string): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  if (boardId) formData.append("boardId", boardId);
  await api.post("/api/v1/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/api/v1/documents/${id}`);
}
