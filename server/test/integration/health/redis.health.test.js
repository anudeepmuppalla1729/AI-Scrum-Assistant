import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

describe("Redis Health Check", () => {
  let client;

  it("connects to Redis", async () => {
    client = new Redis(REDIS_URL, { maxRetriesPerRequest: 1, connectTimeout: 5000 });
    const pong = await client.ping();
    assert.equal(pong, "PONG");
  });

  it("can SET and GET a key", async () => {
    await client.set("test:health:key", "hello");
    const value = await client.get("test:health:key");
    assert.equal(value, "hello");
  });

  it("can DEL a key", async () => {
    await client.set("test:health:del", "temp");
    const result = await client.del("test:health:del");
    assert.equal(result, 1);
    const value = await client.get("test:health:del");
    assert.equal(value, null);
  });

  it("returns server INFO", async () => {
    const info = await client.info("server");
    assert.ok(info.includes("redis_version"));
  });

  after(async () => {
    if (client) await client.quit();
  });
});
