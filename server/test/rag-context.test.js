import test from "node:test";
import assert from "node:assert/strict";
import {
  LEGACY_COLLECTION_NAME,
  buildBoardCollectionName,
  extractBoardIdFromJiraPayload,
  getCandidateCollectionNames,
  normalizeBoardId,
} from "../src/services/ai/rag.context.js";

test("buildBoardCollectionName isolates data by board id", () => {
  const board12 = buildBoardCollectionName(12);
  const board99 = buildBoardCollectionName(99);

  assert.notEqual(board12, board99);
  assert.equal(board12, "scrum_kb_board_v3_12");
  assert.equal(board99, "scrum_kb_board_v3_99");
});

test("query candidates prefer board collection and fallback to legacy", () => {
  assert.deepEqual(getCandidateCollectionNames(77), [
    "scrum_kb_board_v3_77",
    LEGACY_COLLECTION_NAME,
  ]);
  assert.deepEqual(
    getCandidateCollectionNames(77, { includeLegacyFallback: false }),
    ["scrum_kb_board_v3_77"],
  );
  assert.deepEqual(getCandidateCollectionNames(null), [LEGACY_COLLECTION_NAME]);
});

test("normalizeBoardId handles numbers and strings", () => {
  assert.equal(normalizeBoardId(123), "123");
  assert.equal(normalizeBoardId(" 456 "), "456");
  assert.equal(normalizeBoardId(""), null);
  assert.equal(normalizeBoardId(undefined), null);
});

test("extractBoardIdFromJiraPayload finds board context from sprint payload", () => {
  const payload = {
    webhookEvent: "sprint_closed",
    sprint: {
      id: 1001,
      name: "Sprint 18",
      originBoardId: 45,
    },
  };

  assert.equal(extractBoardIdFromJiraPayload(payload), "45");
});

test("extractBoardIdFromJiraPayload finds nested boardId fields", () => {
  const payload = {
    issue: {
      fields: {
        sprintData: [{ boardId: 501 }],
      },
    },
  };

  assert.equal(extractBoardIdFromJiraPayload(payload), "501");
});
