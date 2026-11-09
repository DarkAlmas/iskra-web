#!/usr/bin/env node
/**
 * ESLint-free static check for attr-break XSS (Hack Bot WARN class):
 *   '...href="' + someVar + '"'  without escapeHtml(someVar)
 * Scans web/js recursively, including feature install._src payloads.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "js");

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith(".js")) out.push(p);
  }
  return out;
}

// attrName=" + VAR + "   OR  attrName=' + VAR + '
const ATTR_BREAK =
  /(?:href|src|action|formaction|cite|poster|xlink:href|data-[\w-]+)\s*=\s*(['"])\s*\+\s*(?!escapeHtml\s*\()([A-Za-z_$][\w$]*)\s*\+\s*\1/gi;

const findings = [];

function scan(blob, fileLabel) {
  let m;
  ATTR_BREAK.lastIndex = 0;
  while ((m = ATTR_BREAK.exec(blob))) {
    const line = blob.slice(0, m.index).split(/\n/).length;
    findings.push({
      file: fileLabel,
      line,
      id: m[2],
      snip: m[0].replace(/\s+/g, " ").slice(0, 140),
    });
  }
}

const files = walk(ROOT);
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const rel = path.relative(path.resolve(ROOT, ".."), file);
  scan(src, rel);
  const mSrc = src.match(/install\._src\s*=\s*("(?:\\.|[^"\\])*")/);
  if (mSrc) {
    try {
      scan(JSON.parse(mSrc[1]), rel + "#_src");
    } catch (_) {}
  }
}

const seen = new Set();
const uniq = findings.filter((f) => {
  const k = f.file + ":" + f.line + ":" + f.id;
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

if (uniq.length) {
  console.error("static-innerhtml: FAIL (" + uniq.length + " findings)");
  for (const f of uniq) {
    console.error("- " + f.file + ":" + f.line + " +" + f.id + " :: " + f.snip);
  }
  process.exit(1);
}
console.log("static-innerhtml: PASS (" + files.length + " files)");
