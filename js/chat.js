/** Chat tree helpers (pure-ish). Heavy UI stays in core.js; this module is the documented API surface. */

export function uid(prefix = "c_") {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function emptyTreeChat(extra = {}) {
  const rootId = "n_" + Math.random().toString(36).slice(2, 10);
  return Object.assign({
    id: uid(),
    title: "Новый чат",
    systemPrompt: "",
    personaId: "default",
    updatedAt: Date.now(),
    pinned: false,
    folderId: null,
    messages: [],
    nodes: { [rootId]: { id: rootId, role: "root", content: "", parentId: null, children: [] } },
    rootId,
    leafId: rootId,
  }, extra);
}

export function chatGenDefaults() {
  return { temperature: 0.8, top_k: 50, top_p: 0.95, max_tokens: 200, repetition_penalty: 1.15 };
}
