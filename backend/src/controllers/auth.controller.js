import { generateToken } from "../utils/generateToken.js";

export const createSession = (req, res) => {
  // fake user from DB just for testing JWT
  const userId = "1234567890";
  const email = "test@example.com";

  const token = generateToken({ userId, email });

  res.json({
    success: true,
    token
  });
};

export const getProfile = (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user
  });
};
