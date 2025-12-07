import PRDSession from "../models/PRDSession.js";

// --- PRD Sessions ---

export const getPRDSessions = async (req, res) => {
    try {
        const userId = req.user.userId;
        // Return mostly metadata, maybe limit epics if they are huge? No, usually fine.
        // Selecting only necessary fields for list view might be an optimization, but keep simple for now.
        const sessions = await PRDSession.find({ userId }).sort({ updatedAt: -1 });
        res.status(200).json(sessions);
    } catch (error) {
        console.error("Error fetching PRD sessions:", error);
        res.status(500).json({ error: "Failed to fetch PRD sessions." });
    }
};

export const createPRDSession = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { prompt, epics, options, title } = req.body;

        const session = new PRDSession({
            userId,
            title: title || `PRD Generation - ${new Date().toLocaleDateString()}`,
            prompt: prompt || "",
            epics: epics || [],
            options: options || {},
        });

        await session.save();
        res.status(201).json(session);
    } catch (error) {
        console.error("Error creating PRD session:", error);
        res.status(500).json({ error: "Failed to create PRD session." });
    }
};

export const getPRDSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await PRDSession.findOne({ _id: sessionId, userId: req.user.userId });

        if (!session) {
            return res.status(404).json({ error: "Session not found." });
        }
        res.status(200).json(session);
    } catch (error) {
        console.error("Error fetching PRD session:", error);
        res.status(500).json({ error: "Failed to fetch PRD session." });
    }
};

export const updatePRDSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { epics, title, prompt, options } = req.body;

        const updateData = {};
        if (epics !== undefined) updateData.epics = epics;
        if (title !== undefined) updateData.title = title;
        if (prompt !== undefined) updateData.prompt = prompt;
        if (options !== undefined) updateData.options = options;

        const session = await PRDSession.findOneAndUpdate(
            { _id: sessionId, userId: req.user.userId },
            updateData,
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: "Session not found." });
        }

        res.status(200).json(session);
    } catch (error) {
        console.error("Error updating PRD session:", error);
        res.status(500).json({ error: "Failed to update PRD session." });
    }
};

export const deletePRDSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await PRDSession.findOneAndDelete({
            _id: sessionId,
            userId: req.user.userId,
        });

        if (!session) {
            return res.status(404).json({ error: "Session not found." });
        }

        res.status(200).json({ message: "Session deleted." });
    } catch (error) {
        console.error("Error deleting PRD session:", error);
        res.status(500).json({ error: "Failed to delete PRD session." });
    }
};
