import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseSseBuffer, parseSseLine } from "../../js/sse.js";

describe("SSE parser", () => {
  it("parses content tokens with p/lp/i", () => {
    const events = parseSseBuffer(
      'data: {"content":"при","p":0.9,"lp":-0.105,"i":0}\n\n' +
      'data: {"content":"вет","p":0.8,"lp":-0.223,"i":0}\n\n'
    );
    assert.equal(events.length, 2);
    assert.equal(events[0].type, "token");
    assert.equal(events[0].text, "при");
    assert.equal(events[0].p, 0.9);
    assert.equal(events[0].i, 0);
    assert.equal(events[1].text, "вет");
  });

  it("parses n variants and end events", () => {
    const events = parseSseBuffer(
      'data: {"content":"A","i":0}\n\n' +
      'event: end\n' +
      'data: {"i":0}\n\n' +
      'data: {"content":"B","i":1}\n\n' +
      'event: end\n' +
      'data: {"i":1}\n\n' +
      'data: [DONE]\n\n'
    );
    const types = events.map((e) => e.type);
    assert.deepEqual(types, ["token", "end", "token", "end", "done"]);
    assert.equal(events[1].i, 0);
    assert.equal(events[3].i, 1);
  });

  it("parses sources event", () => {
    const events = parseSseBuffer(
      'event: sources\n' +
      'data: {"sources":[{"title":"t","url":"https://example.com"}]}\n\n'
    );
    assert.equal(events[0].type, "sources");
    assert.equal(events[0].sources[0].url, "https://example.com");
  });

  it("parseSseLine tracks eventName across calls", () => {
    let st = parseSseLine("event: end", "");
    assert.equal(st.eventName, "end");
    st = parseSseLine('data: {"i":2}', st.eventName);
    assert.equal(st.events[0].type, "end");
    assert.equal(st.events[0].i, 2);
  });
});
