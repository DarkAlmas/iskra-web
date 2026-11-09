/* МойGPT TF-IDF similar chats — embedding-free, runs in Worker */
self.onmessage = function (e) {
  var msg = e.data || {};
  if (msg.type !== "similar") return;
  var activeId = msg.activeId;
  var chats = msg.chats || [];
  var docs = [];
  for (var i = 0; i < chats.length; i++) {
    var c = chats[i];
    var parts = [c.title || ""];
    var msgs = c.messages || [];
    for (var j = 0; j < msgs.length && j < 40; j++) {
      var m = msgs[j];
      if (m && (m.role === "user" || m.role === "assistant") && m.content) {
        parts.push(String(m.content).slice(0, 800));
      }
    }
    docs.push({ id: c.id, title: c.title || "чат", text: parts.join("\n") });
  }
  function tokenize(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^\u0400-\u04FFa-zA-Z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(function (t) { return t.length > 1; });
  }
  var tokenized = docs.map(function (d) {
    return { id: d.id, title: d.title, tokens: tokenize(d.text) };
  });
  var df = Object.create(null);
  tokenized.forEach(function (d) {
    var seen = Object.create(null);
    d.tokens.forEach(function (t) {
      if (seen[t]) return;
      seen[t] = 1;
      df[t] = (df[t] || 0) + 1;
    });
  });
  var N = Math.max(1, tokenized.length);
  function vec(tokens) {
    var tf = Object.create(null);
    tokens.forEach(function (t) { tf[t] = (tf[t] || 0) + 1; });
    var v = Object.create(null);
    var len = 0;
    Object.keys(tf).forEach(function (t) {
      var idf = Math.log((N + 1) / ((df[t] || 0) + 1)) + 1;
      var w = (tf[t] / Math.max(1, tokens.length)) * idf;
      v[t] = w;
      len += w * w;
    });
    return { v: v, norm: Math.sqrt(len) || 1 };
  }
  var vectors = tokenized.map(function (d) {
    return { id: d.id, title: d.title, vec: vec(d.tokens) };
  });
  var active = null;
  for (var k = 0; k < vectors.length; k++) {
    if (vectors[k].id === activeId) { active = vectors[k]; break; }
  }
  if (!active) {
    self.postMessage({ type: "similar", items: [] });
    return;
  }
  function cos(a, b) {
    var sum = 0;
    var keys = Object.keys(a.v);
    for (var i = 0; i < keys.length; i++) {
      var t = keys[i];
      if (b.v[t]) sum += a.v[t] * b.v[t];
    }
    return sum / (a.norm * b.norm);
  }
  var scored = [];
  for (var i = 0; i < vectors.length; i++) {
    if (vectors[i].id === activeId) continue;
    var s = cos(active.vec, vectors[i].vec);
    if (s > 0.02) scored.push({ id: vectors[i].id, title: vectors[i].title, score: s });
  }
  scored.sort(function (a, b) { return b.score - a.score; });
  self.postMessage({ type: "similar", items: scored.slice(0, 8) });
};
