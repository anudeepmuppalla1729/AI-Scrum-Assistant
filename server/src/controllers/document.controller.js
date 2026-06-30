import BusinessDocument from "../models/BusinessDocument.js";
import { extractTextFromPdfBuffer } from "../services/ai/prdToTickets.service.js";
import { upsertBusinessDocument, deleteBusinessDocument } from "../services/ai/rag.service.js";
import { normalizeBoardId } from "../services/ai/rag.context.js";

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No document file uploaded." });
    }
    const userId = req.user.userId;
    const filename = req.file.originalname;
    const buffer = req.file.buffer;
    let content = "";

    if (filename.toLowerCase().endsWith(".pdf")) {
      content = await extractTextFromPdfBuffer(buffer);
    } else {
      content = buffer.toString("utf-8");
    }

    if (!content || content.length < 10) {
      return res.status(400).json({ error: "Document is empty or text could not be extracted." });
    }
    
    const { boardId } = req.body;
    const normalizedBoardId = boardId ? normalizeBoardId(boardId) : undefined;

    const doc = new BusinessDocument({
      userId,
      filename,
      content,
      boardId: normalizedBoardId,
      syncStatus: "PENDING",
    });

    await doc.save();

    // Async sync to ChromaDB
    upsertBusinessDocument(doc._id.toString(), content, filename)
      .then(async () => {
        doc.syncStatus = "SYNCED";
        await doc.save();
      })
      .catch(async (err) => {
        console.error("Failed to sync doc to ChromaDB:", err);
        doc.syncStatus = "FAILED";
        await doc.save();
      });

    res.status(201).json({
      message: "Document uploaded successfully",
      document: {
        _id: doc._id,
        filename: doc.filename,
        syncStatus: doc.syncStatus,
        createdAt: doc.createdAt,
      },
    });
  } catch (error) {
    console.error("Upload document error:", error);
    res.status(500).json({ error: "Failed to upload document" });
  }
};

export const listDocuments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { boardId } = req.query;
    
    let query = { userId };
    if (boardId) {
        query.boardId = normalizeBoardId(boardId);
    }
    
    const docs = await BusinessDocument.find(query)
      .select("-content")
      .sort({ createdAt: -1 });
    res.status(200).json(docs);
  } catch (error) {
    console.error("List documents error:", error);
    res.status(500).json({ error: "Failed to list documents" });
  }
};

export const removeDocument = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const doc = await BusinessDocument.findOneAndDelete({ _id: id, userId });
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    try {
      await deleteBusinessDocument(id);
    } catch (err) {
      console.error("Error deleting document from ChromaDB:", err);
      // Even if ChromaDB delete fails, we've removed it from Mongo. 
    }

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
};
