import { describe, it, after, before } from "node:test";
import assert from "node:assert/strict";
import { ChromaClient } from "chromadb";

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const TEST_COLLECTION = "test_health_check";

let isReachable = false;

describe("ChromaDB Health Check", () => {
  let client;

  before(async () => {
    try {
      client = new ChromaClient({ path: CHROMA_URL });
      await client.heartbeat();
      isReachable = true;
    } catch {
      console.log("  ⚠ ChromaDB not reachable — skipping health checks");
      isReachable = false;
    }
  });

  it("connects and returns heartbeat", { skip: !isReachable }, async () => {
    const heartbeat = await client.heartbeat();
    assert.ok(heartbeat > 0);
  });

  it("returns version", { skip: !isReachable }, async () => {
    const version = await client.version();
    assert.ok(typeof version === "string");
    assert.ok(version.length > 0);
  });

  it("can create and delete a collection", { skip: !isReachable }, async () => {
    const collection = await client.getOrCreateCollection({
      name: TEST_COLLECTION,
      embeddingFunction: null,
    });
    assert.ok(collection);
    assert.equal(collection.name, TEST_COLLECTION);

    await client.deleteCollection({ name: TEST_COLLECTION });

    const collections = await client.listCollections();
    const names = collections.map(c => typeof c === "string" ? c : c.name);
    assert.ok(!names.includes(TEST_COLLECTION));
  });

  after(async () => {
    if (isReachable) {
      try {
        await client.deleteCollection({ name: TEST_COLLECTION });
      } catch {}
    }
  });
});
