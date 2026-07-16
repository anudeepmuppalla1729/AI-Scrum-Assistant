import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildVelocityRef } from "../../src/backlog-generator/utils/velocityRef.js";

describe("buildVelocityRef", () => {
  it("returns all point labels", () => {
    const ref = buildVelocityRef({ velocity: 20, open_bugs: 0 });
    assert.ok("1pt" in ref);
    assert.ok("2pt" in ref);
    assert.ok("3pt" in ref);
    assert.ok("5pt" in ref);
    assert.ok("8pt" in ref);
    assert.ok("team_velocity" in ref);
    assert.ok("capacity_per_sprint" in ref);
  });

  it("sets team_velocity from input", () => {
    assert.equal(buildVelocityRef({ velocity: 30, open_bugs: 0 }).team_velocity, 30);
    assert.equal(buildVelocityRef({ velocity: 15, open_bugs: 0 }).team_velocity, 15);
  });

  it("calculates capacity_per_sprint without bugs", () => {
    // 20 * 0.85 - 0 * 1.5 = 17
    const ref = buildVelocityRef({ velocity: 20, open_bugs: 0 });
    assert.equal(ref.capacity_per_sprint, 17);
  });

  it("calculates capacity_per_sprint with bugs", () => {
    // 20 * 0.85 - 5 * 1.5 = 17 - 7.5 = 9.5
    const ref = buildVelocityRef({ velocity: 20, open_bugs: 5 });
    assert.equal(ref.capacity_per_sprint, 9.5);
  });

  it("floors capacity at 0 (never negative)", () => {
    // 2 * 0.85 - 100 * 1.5 = 1.7 - 150 = -148.3 -> max(0, ...) = 0
    const ref = buildVelocityRef({ velocity: 2, open_bugs: 100 });
    assert.equal(ref.capacity_per_sprint, 0);
  });
});
