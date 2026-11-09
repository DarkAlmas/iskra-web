import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { safeCalc } from "../../js/calc.js";

describe("safeCalc", () => {
  it("adds and multiplies", () => {
    assert.equal(safeCalc("2+3*4"), 14);
    assert.equal(safeCalc("(2+3)*4"), 20);
  });
  it("supports power and unary minus", () => {
    assert.equal(safeCalc("2^3"), 8);
    assert.equal(safeCalc("-3+5"), 2);
  });
  it("rejects letters", () => {
    assert.throws(() => safeCalc("alert(1)"), /только|недопустимый|букв|цифр/i);
  });
});
