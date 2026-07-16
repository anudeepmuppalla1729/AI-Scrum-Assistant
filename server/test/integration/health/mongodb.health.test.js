import { describe, it, after, before } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "jira_app_test";

let isReachable = false;

describe("MongoDB Health Check", () => {
  before(async () => {
    try {
      await mongoose.connect(MONGODB_URI, { dbName: DB_NAME, serverSelectionTimeoutMS: 3000 });
      isReachable = true;
    } catch {
      console.log("  ⚠ MongoDB not reachable — skipping health checks");
      isReachable = false;
    }
  });

  it("connection is ready", { skip: !isReachable }, () => {
    assert.equal(mongoose.connection.readyState, 1);
  });

  it("responds to ping", { skip: !isReachable }, async () => {
    const result = await mongoose.connection.db.admin().ping();
    assert.equal(result.ok, 1);
  });

  it("can write and read a document", { skip: !isReachable }, async () => {
    const TestModel = mongoose.model("HealthCheck", new mongoose.Schema({ key: String, value: String }));
    const doc = await TestModel.create({ key: "test-health", value: "alive" });
    const found = await TestModel.findById(doc._id);
    assert.equal(found.value, "alive");
    await TestModel.deleteOne({ _id: doc._id });
  });

  it("can delete a document", { skip: !isReachable }, async () => {
    const TestModel = mongoose.model("HealthCheck");
    const doc = await TestModel.create({ key: "test-delete", value: "temp" });
    await TestModel.deleteOne({ _id: doc._id });
    const found = await TestModel.findById(doc._id);
    assert.equal(found, null);
  });

  after(async () => {
    if (isReachable) {
      await mongoose.connection.dropCollection("healthchecks").catch(() => {});
      await mongoose.disconnect();
    }
  });
});
