import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { mockReq, mockRes, mockNext } from "../helpers/mockReqRes.js";

// We need to set JWT_SECRET before importing auth
process.env.JWT_SECRET = "test-secret-key-for-unit-tests";

// Dynamic import to ensure env is set
const { auth } = await import("../../src/middleware/auth.js");

describe("auth middleware", () => {
  it("returns 401 when no token is provided", () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();
    const next = mockNext();

    auth(req, res, next);

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, "Unauthorized");
    assert.equal(next.called, false);
  });

  it("returns 401 for invalid token", () => {
    const req = mockReq({ headers: { authorization: "Bearer invalid-token" } });
    const res = mockRes();
    const next = mockNext();

    auth(req, res, next);

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, "Invalid or expired token");
    assert.equal(next.called, false);
  });

  it("returns 401 for expired token", () => {
    const expiredToken = jwt.sign({ userId: "123" }, process.env.JWT_SECRET, { expiresIn: "-1s" });
    const req = mockReq({ headers: { authorization: `Bearer ${expiredToken}` } });
    const res = mockRes();
    const next = mockNext();

    auth(req, res, next);

    assert.equal(res.statusCode, 401);
    assert.equal(next.called, false);
  });

  it("sets req.user and calls next for valid token", () => {
    const token = jwt.sign({ userId: "user-123" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const res = mockRes();
    const next = mockNext();

    auth(req, res, next);

    assert.equal(next.called, true);
    assert.equal(req.user.userId, "user-123");
  });
});
