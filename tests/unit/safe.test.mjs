import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  escapeHtml,
  isSafeHttpUrl,
  safeHref,
  safeWikiHrefAttr,
} from "../../js/safe.mjs";
import { buggyWikiHrefAttr } from "../helpers/buggyWikiHrefAttr.mjs";

const XSS_URL = 'https://x" onmouseover="alert(1)';

describe("isSafeHttpUrl", () => {
  it("rejects attribute-break XSS URL", () => {
    assert.equal(isSafeHttpUrl(XSS_URL), false);
    assert.equal(safeHref(XSS_URL), "");
  });

  it("rejects javascript: and non-http schemes", () => {
    assert.equal(isSafeHttpUrl("javascript:alert(1)"), false);
    assert.equal(isSafeHttpUrl("data:text/html,hi"), false);
    assert.equal(safeHref("javascript:alert(1)"), "");
  });

  it("accepts plain https URLs", () => {
    assert.equal(isSafeHttpUrl("https://example.com/wiki/Foo"), true);
    assert.equal(safeHref("https://example.com/wiki/Foo"), "https://example.com/wiki/Foo");
    assert.equal(isSafeHttpUrl("http://127.0.0.1:8800/x"), true);
  });

  it("rejects whitespace and angle brackets", () => {
    assert.equal(isSafeHttpUrl("https://x.com/a b"), false);
    assert.equal(isSafeHttpUrl("https://x.com/<script>"), false);
  });
});

describe("escapeHtml + wiki href attr", () => {
  it("escapeHtml turns quotes into entities so attr stays one value", () => {
    const esc = escapeHtml(XSS_URL);
    assert.match(esc, /&quot;/);
    assert.equal(/[^&]/.test(esc) && esc.includes('"'), false);
    const attr = 'href="' + esc + '"';
    // only the wrapping quotes are raw "; entities do not close the attribute
    assert.match(attr, /^href="[^"]*"$/);
    assert.equal((attr.match(/"/g) || []).length, 2);
  });

  it("buggy concat would break out of attribute (documents the WARN)", () => {
    const html = buggyWikiHrefAttr(XSS_URL);
    assert.match(html, / onmouseover="/);
    assert.notEqual((html.match(/"/g) || []).length, 2);
  });

  it("safeWikiHrefAttr drops XSS URL entirely", () => {
    assert.equal(safeWikiHrefAttr(XSS_URL), "");
  });

  it("safeWikiHrefAttr keeps a clean https URL escaped", () => {
    const html = safeWikiHrefAttr("https://example.com/a");
    assert.match(html, /^<a href="https:\/\/example\.com\/a"/);
  });
});
