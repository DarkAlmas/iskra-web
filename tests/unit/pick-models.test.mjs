import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickDistinctModels, sftBaseName, findSftModels } from "../../js/pick-models.js";

describe("pickDistinctModels", () => {
  it("pairs sft with its base, not latest", () => {
    const r = pickDistinctModels(["mygpt-latest", "v0", "v1", "v1_sft", "rag-only"]);
    assert.equal(r.a, "v1_sft");
    assert.equal(r.b, "v1");
    assert.equal(r.kind, "sft");
    assert.notEqual(r.a, "mygpt-latest");
  });

  it("falls back to latest vs v0 when no sft", () => {
    const r = pickDistinctModels(["mygpt-latest", "v0", "v1", "step_00500"]);
    assert.equal(r.a, "mygpt-latest");
    assert.equal(r.b, "v0");
    assert.equal(r.kind, "latest");
  });

  it("skips sft whose base is missing", () => {
    const r = pickDistinctModels(["mygpt-latest", "v0", "orphan_sft"]);
    assert.equal(r.a, "mygpt-latest");
    assert.equal(r.b, "v0");
  });

  it("never returns identical pair when alternatives exist", () => {
    const r = pickDistinctModels(["mygpt-latest", "v1"]);
    assert.notEqual(r.a, r.b);
  });

  it("sftBaseName / findSftModels helpers", () => {
    assert.equal(sftBaseName("v1_sft"), "v1");
    assert.equal(sftBaseName("mygpt-latest"), null);
    assert.deepEqual(findSftModels(["v0", "v1_sft", "x"]), ["v1_sft"]);
  });
});
