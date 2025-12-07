import axios from "axios";
import User from "../models/User.js";

export const getBoards = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("Hit getBoards controller. UserID:", userId);
    const user = await User.findById(userId);

    if (!user || !user.jiraTokens?.accessToken) {
      return res.status(400).json({ error: "Jira tokens not found" });
    }

    if (!user.cloudId) {
      return res.status(400).json({ error: "cloudId not found" });
    }

    // Agile API endpoint
    const url = `https://api.atlassian.com/ex/jira/${user.cloudId}/rest/agile/1.0/board`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${user.jiraTokens.accessToken}`,
        Accept: "application/json",
      },
    });

    return res.json(response.data); // includes boards list
  } catch (err) {
    console.error(err.response?.data || err);
    return res.status(500).json({ error: "Failed to fetch Jira boards" });
  }
};
