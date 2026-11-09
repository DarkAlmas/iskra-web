/** Pure URL / HTML helpers shared by UI modules and unit tests. */

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isSafeHttpUrl(href) {
  if (typeof href !== "string") return false;
  // reject attr-breakers / whitespace before URL parse (\x60 = backtick)
  if (/[\s"'<>\x60\\]/.test(href)) return false;
  try {
    const u = new URL(href);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch (_) {
    return false;
  }
}

export function safeHref(raw) {
  const h = (raw || "").trim();
  return isSafeHttpUrl(h) ? h : "";
}

/** Defense-in-depth attribute form. */
export function safeWikiHrefAttr(href) {
  const h = safeHref(href);
  if (!h) return "";
  return '<a href="' + escapeHtml(h) + '" target="_blank" rel="noopener noreferrer">';
}
