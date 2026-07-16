import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  estimateTokenCount,
  getComplexityTier,
} from "../../src/backlog-generator/utils/tokenizer.js";

describe("estimateTokenCount", () => {
  it("returns 0 for empty string", () => {
    assert.equal(estimateTokenCount(""), 0);
  });

  it("returns 0 for null", () => {
    assert.equal(estimateTokenCount(null), 0);
  });

  it("returns 0 for undefined", () => {
    assert.equal(estimateTokenCount(undefined), 0);
  });

  it("estimates tokens for short text", () => {
    // "hello world" = 11 chars, ceil(11/4) = 3
    assert.equal(estimateTokenCount("hello world"), 3);
  });

  it("estimates tokens for long text", () => {
    const text = "a".repeat(400);
    assert.equal(estimateTokenCount(text), 100);
  });

  it("rounds up", () => {
    // 5 chars -> ceil(5/4) = 2
    assert.equal(estimateTokenCount("abcde"), 2);
  });
});

describe("getComplexityTier", () => {
  it("returns small for < 8000", () => {
    assert.equal(getComplexityTier(5000), "small");
    assert.equal(getComplexityTier(0), "small");
    assert.equal(getComplexityTier(7999), "small");
  });

  it("returns medium for 8000-24999", () => {
    assert.equal(getComplexityTier(8000), "medium");
    assert.equal(getComplexityTier(10000), "medium");
    assert.equal(getComplexityTier(24999), "medium");
  });

  it("returns large for 25000-59999", () => {
    assert.equal(getComplexityTier(25000), "large");
    assert.equal(getComplexityTier(30000), "large");
    assert.equal(getComplexityTier(59999), "large");
  });

  it("returns xlarge for >= 60000", () => {
    assert.equal(getComplexityTier(60000), "xlarge");
    assert.equal(getComplexityTier(70000), "xlarge");
  });
});
