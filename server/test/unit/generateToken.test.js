import { describe, it } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "test-secret-key-for-unit-tests";

const { generateToken } = await import("../../src/utils/generateToken.js");

describe("generateToken", () => {
  it("returns a string", () => {
    const token = generateToken({ userId: "123" });
    assert.equal(typeof token, "string");
  });

  it("contains the payload when decoded", () => {
    const token = generateToken({ userId: "user-abc" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    assert.equal(decoded.userId, "user-abc");
  });

  it("has an expiration field", () => {
    const token = generateToken({ userId: "123" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    assert.ok(decoded.exp);
    assert.ok(decoded.iat);
  });

  it("tokens are valid JWT format", () => {
    const token = generateToken({ userId: "123" });
    const parts = token.split(".");
    assert.equal(parts.length, 3); // header.payload.signature
  });
});
