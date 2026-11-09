/** SSE parser for /api/chat (pure). */
export function parseSseLine(line, eventName = "") {
  const out = [];
  if (line.startsWith("event:")) {
    return { eventName: line.slice(6).trim(), events: out };
  }
  if (!line.startsWith("data:")) {
    return { eventName, events: out };
  }
  const payload = line.slice(5).trimStart();
  const evName = eventName || "";
  if (payload === "[DONE]") {
    out.push({ type: "done" });
    return { eventName: "", events: out };
  }
  try {
    const obj = JSON.parse(payload);
    if (evName === "sources" || obj.sources) {
      const src = obj.sources || obj;
      if (Array.isArray(src)) out.push({ type: "sources", sources: src });
      return { eventName: "", events: out };
    }
    if (evName === "end") {
      out.push({ type: "end", data: obj || {}, i: obj && obj.i != null ? Number(obj.i) : undefined });
      return { eventName: "", events: out };
    }
    const t = obj.content || obj.token || obj.text || "";
    const idx = obj.i != null ? Number(obj.i) : 0;
    if (t) {
      out.push({ type: "token", text: t, content: t, p: obj.p != null ? obj.p : obj.prob, lp: obj.lp != null ? obj.lp : null, i: idx });
    } else if (obj.i != null) {
      out.push({ type: "meta", data: obj, eventName: evName || "meta" });
    }
  } catch (_) {
    if (evName === "end") {
      try { out.push({ type: "end", data: JSON.parse(payload) }); }
      catch { out.push({ type: "end", data: {} }); }
      return { eventName: "", events: out };
    }
    if (evName === "sources") return { eventName: "", events: out };
    out.push({ type: "text", content: payload });
  }
  return { eventName: "", events: out };
}
export function parseSseBuffer(buf) {
  const lines = String(buf || "").split(/\r?\n/);
  let eventName = "";
  const events = [];
  for (const line of lines) {
    if (!line) { eventName = ""; continue; }
    const r = parseSseLine(line, eventName);
    eventName = r.eventName;
    events.push(...r.events);
  }
  return events;
}
