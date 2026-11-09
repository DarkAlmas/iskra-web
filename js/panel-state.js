/* Panel empty/loading/error helpers (v15). */
export function setPanelState(host, kind, text) {
  if (!host) return null;
  let box = host.querySelector(":scope > .panel-state");
  if (!box) {
    box = document.createElement("div");
    box.className = "panel-state";
    host.prepend(box);
  }
  box.className = "panel-state" + (kind ? " " + kind : "");
  box.hidden = !kind;
  box.textContent = text || "";
  return box;
}

export function showSkeleton(host, lines) {
  if (!host) return null;
  let sk = host.querySelector(":scope > .skeleton");
  if (!sk) {
    sk = document.createElement("div");
    sk.className = "skeleton";
    sk.setAttribute("aria-hidden", "true");
    host.prepend(sk);
  }
  sk.textContent = "";
  const n = Math.max(2, Number(lines) || 4);
  for (let i = 0; i < n; i++) {
    const d = document.createElement("div");
    d.className = "skeleton-line" + (i === n - 1 ? " short" : "");
    sk.appendChild(d);
  }
  sk.hidden = false;
  return sk;
}

export function hideSkeleton(host) {
  const sk = host && host.querySelector(":scope > .skeleton");
  if (sk) sk.hidden = true;
}
