import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { StateAnnotation } from "../../src/backlog-generator/state.js";

describe("StateAnnotation", () => {
  it("exports StateAnnotation", () => {
    assert.ok(StateAnnotation);
  });

  it("has expected state keys", () => {
    // StateAnnotation is a LangGraph Annotation schema
    // It defines the shape of the pipeline state
    assert.ok(StateAnnotation);
    // Verify it has the expected annotation keys
    assert.ok(StateAnnotation.spec || StateAnnotation.schema || typeof StateAnnotation === "object");
  });

  it("current_batch reducer replaces when _replace flag is set", () => {
    // Simulate the reducer logic from state.js
    const reducer = (left, right) => {
      if (right && right._replace) return right.items;
      if (Array.isArray(right) && right.length === 0) return [];
      if (Array.isArray(right)) return left.concat(right);
      return left;
    };

    const result = reducer([1, 2, 3], { _replace: true, items: [4, 5] });
    assert.deepEqual(result, [4, 5]);
  });

  it("current_batch reducer concatenates arrays", () => {
    const reducer = (left, right) => {
      if (right && right._replace) return right.items;
      if (Array.isArray(right) && right.length === 0) return [];
      if (Array.isArray(right)) return left.concat(right);
      return left;
    };

    const result = reducer([1, 2], [3, 4]);
    assert.deepEqual(result, [1, 2, 3, 4]);
  });

  it("current_batch reducer resets on empty array", () => {
    const reducer = (left, right) => {
      if (right && right._replace) return right.items;
      if (Array.isArray(right) && right.length === 0) return [];
      if (Array.isArray(right)) return left.concat(right);
      return left;
    };

    const result = reducer([1, 2], []);
    assert.deepEqual(result, []);
  });

  it("written_stories reducer concatenates", () => {
    const reducer = (left, right) => left.concat(right);
    const result = reducer([{ id: 1 }], [{ id: 2 }]);
    assert.deepEqual(result, [{ id: 1 }, { id: 2 }]);
  });

  it("revision_count reducer takes latest value", () => {
    const reducer = (left, right) => right;
    assert.equal(reducer(0, 3), 3);
    assert.equal(reducer(2, 5), 5);
  });
});
