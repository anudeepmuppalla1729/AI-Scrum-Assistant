import axios from "axios";
import User from "../models/User.js";

export const fetchCloudId = async (req, res) => {
  try {
    const userId = req.user.userId; // from JWT middleware
    const user = await User.findById(userId);

    if (!user || !user.jiraTokens?.accessToken) {
      return res.status(400).json({ error: "No Jira tokens found for user" });
    }

    // Call Atlassian to fetch cloud resources
    const response = await axios.get(
      "https://api.atlassian.com/oauth/token/accessible-resources",
      {
        headers: {
          Authorization: `Bearer ${user.jiraTokens.accessToken}`
        }
      }
    );

    const resources = response.data;
    console.log("Accessible Resources found:", resources.length, resources);

    if (!resources.length) {
      return res.status(400).json({ error: "No Jira sites found" });
    }

    // Pick the first site (most users only have one)
    const cloudId = resources[0].id;

    // Save to DB
    user.cloudId = cloudId;
    await user.save();

    return res.json({
      cloudId,
      siteName: resources[0].name,
      url: resources[0].url
    });

  } catch (err) {
    console.error(err.response?.data || err);
    return res.status(500).json({ error: "Failed to fetch cloudId" });
  }
};
