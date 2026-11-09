import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, renderMarkdown } from "../../js/markdown.js";

describe("markdown escaping", () => {
  it("escapes HTML before formatting", () => {
    const html = renderMarkdown('<script>alert(1)</script> **bold**');
    assert.equal(html.includes("<script>"), false);
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /<strong>bold<\/strong>/);
  });

  it("does not create javascript: anchors (no raw md links; text escaped)", () => {
    const html = renderMarkdown('click [x](javascript:alert(1)) and https://evil');
    assert.equal(/href\s*=\s*["']javascript:/i.test(html), false);
    assert.equal(html.includes("javascript:alert"), true); // remains as escaped text content path
    // escaped angle content only — no tag injection
    assert.equal(html.includes("<a "), false);
  });

  it("escapeHtml quotes", () => {
    assert.equal(escapeHtml('a"b'), "a&quot;b");
  });
});
