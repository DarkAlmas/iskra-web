import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { eloExpected, applyEloVote } from "../../js/elo.js";

describe("Elo", () => {
  it("expected is 0.5 for equal ratings", () => {
    assert.ok(Math.abs(eloExpected(1000, 1000) - 0.5) < 1e-9);
  });
  it("winner gains rating", () => {
    const map = {};
    applyEloVote(map, "a", "b", "A");
    assert.ok(map.a.rating > 1000);
    assert.ok(map.b.rating < 1000);
    assert.equal(map.a.w, 1);
    assert.equal(map.b.l, 1);
  });
  it("tie moves little", () => {
    const map = {};
    applyEloVote(map, "a", "b", "tie");
    assert.equal(map.a.rating, 1000);
    assert.equal(map.b.rating, 1000);
    assert.equal(map.a.t, 1);
  });
});
