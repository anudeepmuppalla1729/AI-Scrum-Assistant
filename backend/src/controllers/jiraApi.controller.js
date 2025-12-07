import axios from "axios";
import User from "../models/User.js";

export const getProjects = async (req, res) => {
  try {
    const userId = req.user.userId; // from JWT middleware
    const user = await User.findById(userId);

    if (!user || !user.jiraTokens?.accessToken) {
      return res.status(400).json({ error: "Jira tokens not found" });
    }

    if (!user.cloudId) {
      return res.status(400).json({ error: "cloudId not found" });
    }

    const url = `https://api.atlassian.com/ex/jira/${user.cloudId}/rest/api/3/project/search`;

    console.log(`Fetching projects for cloudId: ${user.cloudId}`);
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${user.jiraTokens.accessToken}`,
        Accept: "application/json"
      }
    });
    console.log("Projects response status:", response.status);
    console.log("Projects data keys:", Object.keys(response.data));
    return res.json(response.data);

  } catch (err) {
    console.error("Project fetch error:", err.response?.data || err.message);
    const status = err.response?.status || 500;
    return res.status(status).json({
      error: "Failed to fetch Jira projects",
      details: err.response?.data || err.message
    });
  }
};
