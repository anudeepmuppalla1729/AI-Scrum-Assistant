import { describe, it, after, before } from "node:test";
import assert from "node:assert/strict";
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let isReachable = false;

describe("Redis Health Check", () => {
  let client;

  before(async () => {
    try {
      client = new Redis(REDIS_URL, { maxRetriesPerRequest: 1, connectTimeout: 3000 });
      await client.ping();
      isReachable = true;
    } catch {
      console.log("  ⚠ Redis not reachable — skipping health checks");
      isReachable = false;
    }
  });

  it("connects to Redis", { skip: !isReachable }, async () => {
    const pong = await client.ping();
    assert.equal(pong, "PONG");
  });

  it("can SET and GET a key", { skip: !isReachable }, async () => {
    await client.set("test:health:key", "hello");
    const value = await client.get("test:health:key");
    assert.equal(value, "hello");
  });

  it("can DEL a key", { skip: !isReachable }, async () => {
    await client.set("test:health:del", "temp");
    const result = await client.del("test:health:del");
    assert.equal(result, 1);
    const value = await client.get("test:health:del");
    assert.equal(value, null);
  });

  it("returns server INFO", { skip: !isReachable }, async () => {
    const info = await client.info("server");
    assert.ok(info.includes("redis_version"));
  });

  after(async () => {
    if (client && isReachable) await client.quit();
  });
});
