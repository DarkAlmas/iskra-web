import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.resolve(here, "..", "static_innerhtml_check.mjs");

describe("static innerHTML attr-concat check", () => {
  it("passes on web/js", () => {
    const r = spawnSync(process.execPath, [script], { encoding: "utf8" });
    assert.equal(r.status, 0, (r.stdout || "") + (r.stderr || ""));
  });
});
