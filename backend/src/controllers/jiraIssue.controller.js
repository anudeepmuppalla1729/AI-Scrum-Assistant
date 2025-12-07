import axios from "axios";
import User from "../models/User.js";

export const getSprintIssues = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        const { sprintId } = req.params;

        if (!sprintId) {
            return res.status(400).json({ error: "sprintId is required" });
        }

        const url = `https://api.atlassian.com/ex/jira/${user.cloudId}/rest/api/3/search/jql`;

        console.log("Fetching issues from URL (POST):", url);
        console.log("JQL Query:", `sprint=${sprintId}`);

        // Using POST as recommended for the new JQL endpoint
        const response = await axios.post(url, {
            jql: `sprint=${sprintId}`,
            fields: ["summary", "status", "issuetype", "priority", "created", "updated"]
        }, {
            headers: {
                Authorization: `Bearer ${user.jiraTokens.accessToken}`,
                Accept: "application/json"
            }
        });

        return res.json(response.data);

    } catch (err) {
        console.error("Issues Error - Status:", err.response?.status);
        console.error("Issues Error - Data:", JSON.stringify(err.response?.data, null, 2));
        console.error("Issues Error - Headers:", err.response?.headers);
        res.status(500).json({ error: "Failed to fetch sprint issues" });
    }
};
