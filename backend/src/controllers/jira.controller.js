import querystring from "querystring";
import axios from "axios";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

export const startJiraAuth = (req, res) => {
  const base = "https://auth.atlassian.com/authorize";

  const params = {
    audience: "api.atlassian.com",
    client_id: process.env.ATLASSIAN_CLIENT_ID,
    redirect_uri: process.env.ATLASSIAN_REDIRECT_URI,
    scope: [
      "read:me",
      "read:user:jira",
      "write:issue:jira",
      "read:jira-work",
      "read:board-scope:jira-software",
      "read:sprint:jira-software",
      "read:project:jira",
      "read:issue:jira",
    ].join(" "),
    state: "state-123",
    response_type: "code",
    prompt: "consent"
  };

  const authUrl = `${base}?${querystring.stringify(params)}`;
  res.redirect(authUrl);
};

export const jiraCallback = async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).json({ error: "Authorization code missing" });
  }

  try {
    // 1. Exchange code for tokens
    const tokenResponse = await axios.post(
      "https://auth.atlassian.com/oauth/token",
      {
        grant_type: "authorization_code",
        client_id: process.env.ATLASSIAN_CLIENT_ID,
        client_secret: process.env.ATLASSIAN_CLIENT_SECRET,
        code,
        redirect_uri: process.env.ATLASSIAN_REDIRECT_URI
      }
    );

    const { access_token, refresh_token, expires_in, scope } = tokenResponse.data;
    console.log("Jira OAuth Token Response:", tokenResponse.data);
    console.log("Granted Scopes:", scope);

    // 2. Fetch user’s Atlassian info
    const userInfo = await axios.get("https://api.atlassian.com/me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const { account_id, email, name } = userInfo.data;

    // 3. Find or create user in MongoDB
    let user = await User.findOne({ atlassianAccountId: account_id });

    if (!user) {
      user = await User.create({
        email: email,
        atlassianAccountId: account_id,
        displayName: name,
        jiraTokens: {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: new Date(Date.now() + expires_in * 1000)
        }
      });
    } else {
      // update tokens
      user.jiraTokens = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * 1000)
      };
      await user.save();
    }

    // 4. Create JWT for your own app
    const sessionJWT = generateToken({
      userId: user._id,
      email: user.email
    });

    // 5. Redirect back to frontend WITH JWT
    return res.redirect(
      `${process.env.FRONTEND_SUCCESS_URL}?token=${sessionJWT}`
    );

  } catch (err) {
    console.error(err.response?.data || err);
    return res.status(500).json({ error: "Jira OAuth failed" });
  }
};