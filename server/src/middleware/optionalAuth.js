import jwt from "jsonwebtoken";
import jwtConfig from "../config/jwt.js";

/**
 * Optional auth middleware — decodes JWT if present but never rejects.
 * Sets req.user to the decoded token payload, or null if no valid token.
 * Use for routes that work both logged-in and anonymous.
 */
export const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = decoded;
  } catch {
    req.user = null;
  }

  next();
};
