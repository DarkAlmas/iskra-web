/** UI shell helpers (theme / overlays). Used by core; exported for the module map. */

export function applyThemeToDocument(theme) {
  document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "dark");
}

export function openOverlayEl(node) {
  if (!node) return;
  node.hidden = false;
}

export function closeOverlayEl(node) {
  if (!node) return;
  node.hidden = true;
}
