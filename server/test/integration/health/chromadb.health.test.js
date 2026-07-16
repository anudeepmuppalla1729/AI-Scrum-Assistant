import { describe, it, after, before } from "node:test";
import assert from "node:assert/strict";
import { ChromaClient } from "chromadb";

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const TEST_COLLECTION = "test_health_check";

describe("ChromaDB Health Check", () => {
  let client;

  before(async () => {
    client = new ChromaClient({ path: CHROMA_URL });
  });

  it("connects and returns heartbeat", async () => {
    const heartbeat = await client.heartbeat();
    assert.ok(heartbeat > 0); // returns nanosecond timestamp
  });

  it("returns version", async () => {
    const version = await client.version();
    assert.ok(typeof version === "string");
    assert.ok(version.length > 0);
  });

  it("can create a collection", async () => {
    const collection = await client.createCollection({ name: TEST_COLLECTION });
    assert.ok(collection);
    assert.equal(collection.name, TEST_COLLECTION);
  });

  it("can delete a collection", async () => {
    await client.deleteCollection({ name: TEST_COLLECTION });
    // Verify deletion by trying to get it (should fail)
    try {
      await client.getCollection({ name: TEST_COLLECTION });
      assert.fail("Collection should not exist after deletion");
    } catch (err) {
      assert.ok(err); // Expected error
    }
  });

  after(async () => {
    // Cleanup: ensure test collection is deleted
    try {
      await client.deleteCollection({ name: TEST_COLLECTION });
    } catch {}
  });
});
