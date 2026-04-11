import jwt from "jsonwebtoken";
import jwtConfig from "../config/jwt.js";

export const generateToken = (payload) => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn
  });
};
