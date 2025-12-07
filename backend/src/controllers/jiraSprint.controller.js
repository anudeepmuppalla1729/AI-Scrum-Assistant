import axios from "axios";
import User from "../models/User.js";

export const getSprints = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        const { boardId } = req.params;

        if (!boardId) {
            return res.status(400).json({ error: "boardId is required" });
        }

        const url = `https://api.atlassian.com/ex/jira/${user.cloudId}/rest/agile/1.0/board/${boardId}/sprint`;

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${user.jiraTokens.accessToken}`
            }
        });

        return res.json(response.data);

    } catch (err) {
        console.error("Sprint Error:", err.response?.data || err);
        res.status(500).json({ error: "Failed to fetch sprints" });
    }
};
