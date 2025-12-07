import ChatSession from "../models/ChatSession.js";
import ChatMessage from "../models/ChatMessage.js";
import { chatWithAI } from "../services/ai/chatbot.service.js";

// --- Sessions ---

// --- Sessions ---

export const getSessions = async (req, res) => {
    try {
        const userId = req.user.userId;
        const sessions = await ChatSession.find({ userId }).sort({ updatedAt: -1 });
        res.status(200).json(sessions);
    } catch (error) {
        console.error("Error fetching sessions:", error);
        res.status(500).json({ error: "Failed to fetch chat sessions." });
    }
};

export const createSession = async (req, res) => {
    try {
        const userId = req.user.userId;
        const session = new ChatSession({ userId, title: "New Chat" });
        await session.save();
        res.status(201).json(session);
    } catch (error) {
        console.error("Error creating session:", error);
        res.status(500).json({ error: "Failed to create chat session." });
    }
};

export const renameSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { title } = req.body;

        const session = await ChatSession.findOneAndUpdate(
            { _id: sessionId, userId: req.user.userId },
            { title },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: "Session not found." });
        }

        res.status(200).json(session);
    } catch (error) {
        console.error("Error renaming session:", error);
        res.status(500).json({ error: "Failed to rename session." });
    }
};

export const deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await ChatSession.findOneAndDelete({
            _id: sessionId,
            userId: req.user.userId,
        });

        if (!session) {
            return res.status(404).json({ error: "Session not found." });
        }

        // Also delete all messages in this session
        await ChatMessage.deleteMany({ sessionId });

        res.status(200).json({ message: "Session deleted." });
    } catch (error) {
        console.error("Error deleting session:", error);
        res.status(500).json({ error: "Failed to delete session." });
    }
};

// --- Messages ---

export const getMessages = async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Security check: ensure session belongs to user
        const session = await ChatSession.findOne({
            _id: sessionId,
            userId: req.user.userId,
        });
        if (!session) {
            return res.status(404).json({ error: "Session not found." });
        }

        const messages = await ChatMessage.find({ sessionId }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Failed to fetch messages." });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { message } = req.body;
        const userId = req.user.userId;

        if (!message) {
            return res.status(400).json({ error: "Message is required." });
        }

        // Verify session ownership
        const session = await ChatSession.findOne({ _id: sessionId, userId });
        if (!session) {
            return res.status(404).json({ error: "Session not found." });
        }

        // 1. Save User Message
        const userMsg = new ChatMessage({
            sessionId,
            role: "user",
            content: message,
        });
        await userMsg.save();

        // 2. Generate AI Response
        // For context, we might want to fetch last N messages. 
        // For now, let's keep it simple or fetch the history to pass to context if needed?
        // The `chatWithAI` service might just take a string. 
        // If it supports history, we should fetch it here.
        const answer = await chatWithAI(message);

        // 3. Save Assistant Message
        const assistantMsg = new ChatMessage({
            sessionId,
            role: "assistant",
            content: answer,
        });
        await assistantMsg.save();

        // 4. Update session title if it's the first real interaction and title is generic
        // (A primitive check: if there are only 2 messages now)
        const msgCount = await ChatMessage.countDocuments({ sessionId });
        if (msgCount <= 2 && session.title === "New Chat") {
            // Simple heuristic: Use first ~30 chars of user message
            let newTitle = message.substring(0, 30);
            if (message.length > 30) newTitle += "...";
            session.title = newTitle;
            await session.save();
        } else {
            // Just touch the updated at
            session.updatedAt = new Date();
            await session.save();
        }

        res.status(200).json({
            userMessage: userMsg,
            assistantMessage: assistantMsg
        });

    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Failed to process message." });
    }
};
