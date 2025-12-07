import axios from "axios";
import User from "../models/User.js";

export const createIssue = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    const { fields } = req.body;
    if (!fields) return res.status(400).json({ error: "fields is required" });

    const url = `https://api.atlassian.com/ex/jira/${user.cloudId}/rest/api/3/issue`;

    const response = await axios.post(url, { fields }, {
      headers: {
        Authorization: `Bearer ${user.jiraTokens.accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    return res.json(response.data);

  } catch (err) {
    console.error("Issue Create Error:", err.response?.data || err);
    res.status(500).json({ error: "Failed to create Jira issue" });
  }
};
