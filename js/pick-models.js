/* Pure arena/demo model pairing (v15). No DOM.
 * Rule: if *_sft present → [sft, its base]; else [latest, v0].
 * Never two ids that would resolve to the same checkpoint.
 */
export function sftBaseName(name) {
  const n = String(name || "");
  const m = n.match(/^(.*)_sft$/i);
  return m ? m[1] : null;
}

export function findSftModels(names) {
  return (names || []).filter((n) => /_sft$/i.test(String(n)));
}

/** @returns {{ a: string, b: string, kind: 'sft'|'latest' }} */
export function pickDistinctModels(names) {
  const list = (names || []).filter(Boolean).map(String);
  if (!list.length) return { a: "mygpt-latest", b: "v0", kind: "latest" };

  const sfts = findSftModels(list);
  // Prefer newest-looking sft: v1_sft over v0_sft, else first
  sfts.sort((x, y) => String(y).localeCompare(String(x)));
  for (let i = 0; i < sfts.length; i++) {
    const sft = sfts[i];
    const base = sftBaseName(sft);
    if (base && list.indexOf(base) >= 0 && base !== sft) {
      return { a: sft, b: base, kind: "sft" };
    }
  }

  const latest = list.indexOf("mygpt-latest") >= 0 ? "mygpt-latest" : list[0];
  let other = list.indexOf("v0") >= 0 ? "v0" : null;
  if (!other || other === latest) {
    other = null;
    for (let i = 0; i < list.length; i++) {
      if (list[i] !== latest) { other = list[i]; break; }
    }
  }
  if (!other) other = latest;
  return { a: latest, b: other, kind: "latest" };
}
