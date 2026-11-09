#!/usr/bin/env python3
"""Convert feature install._src + new Function/with into real strict ES module install(api)."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
KEYS = json.loads(Path("/tmp/mygpt_ctx_keys.json").read_text())
BASE_KEYS: list[str] = []
seen: set[str] = set()
for k in KEYS["ctx"] + KEYS["lazy"]:
    if k not in seen and k.isidentifier():
        seen.add(k)
        BASE_KEYS.append(k)


def extract_src(text: str) -> str:
    m = re.search(r"install\._src\s*=\s*`([\s\S]*?)`;\s*$", text)
    if m:
        body = m.group(1)
        out: list[str] = []
        i = 0
        while i < len(body):
            if body[i] == "\\" and i + 1 < len(body):
                out.append("\\")
                out.append(body[i + 1])
                i += 2
            else:
                out.append(body[i])
                i += 1
        return "".join(out)

    m = re.search(r'install\._src\s*=\s*"((?:\\.|[^"\\])*)"\s*;\s*$', text)
    if not m:
        raise ValueError("no install._src")
    raw = m.group(1)

    def repl_unicode(mo: re.Match[str]) -> str:
        return chr(int(mo.group(1), 16))

    raw = re.sub(r"\\u([0-9a-fA-F]{4})", repl_unicode, raw)
    parts: list[str] = []
    i = 0
    while i < len(raw):
        if raw[i] == "\\" and i + 1 < len(raw):
            nxt = raw[i + 1]
            mapping = {"n": "\n", "t": "\t", "r": "\r", '"': '"', "'": "'", "\\": "\\", "/": "/", "`": "`"}
            if nxt in mapping:
                parts.append(mapping[nxt])
                i += 2
            else:
                parts.append("\\")
                parts.append(nxt)
                i += 2
        else:
            parts.append(raw[i])
            i += 1
    return "".join(parts)


def strip_with(body: str) -> tuple[str, str]:
    body = body.strip()
    if body.startswith("with"):
        body = re.sub(r"^with\s*\(\s*api\s*\)\s*\{", "", body, count=1).rstrip()
        if body.endswith("}"):
            body = body[:-1].rstrip()
    rm = re.search(r"\n[ \t]*return\s*(\{[^;]*\})\s*;\s*$", body)
    if not rm:
        raise ValueError("no return object")
    return body[: rm.start()].rstrip(), rm.group(1)


def return_keys(ret: str) -> set[str]:
    # { a, b, c } or { a: a, b }
    inner = ret.strip()
    if inner.startswith("{"):
        inner = inner[1:]
    if inner.endswith("}"):
        inner = inner[:-1]
    keys: set[str] = set()
    for part in inner.split(","):
        part = part.strip()
        if not part:
            continue
        if ":" in part:
            part = part.split(":", 1)[0].strip()
        if re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", part):
            keys.add(part)
    return keys


def local_decls(funcs: str) -> set[str]:
    names: set[str] = set()
    for mo in re.finditer(r"\bfunction\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(", funcs):
        names.add(mo.group(1))
    for mo in re.finditer(r"\b(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=", funcs):
        names.add(mo.group(1))
    return names


def convert(path: Path) -> str:
    text = path.read_text()
    if "install._src" not in text or "new Function" not in text:
        return text
    preamble = text.split("export function install")[0].rstrip()
    if preamble:
        preamble = re.sub(r"\(lazy, v\d+\)", "(ES module)", preamble)
        preamble = re.sub(r"— v\d+", "— ES module", preamble)
    else:
        preamble = f"/* МойGPT feature: {path.stem} (ES module). */"
    # Capture body of old install() before new Function, e.g. api.safeCalc = ...
    pre_install = ""
    im = re.search(r"export function install\(api\)\s*\{([\s\S]*?)(?:const exported = new Function|return new Function)", text)
    if im:
        pre_install = im.group(1).strip()
        # drop install._src references if any
        pre_install = "\n".join(
            ln for ln in pre_install.splitlines()
            if "new Function" not in ln and "install._src" not in ln and ln.strip()
        )
    src = extract_src(text)
    funcs, ret = strip_with(src)
    skip = return_keys(ret) | local_decls(funcs)
    # If preamble imports safeCalc as alias, prefer that name in body by assigning after destructure
    keys = [k for k in BASE_KEYS if k not in skip]
    lines = [preamble, "", "export function install(api) {", '  "use strict";']
    if pre_install:
        for ln in pre_install.splitlines():
            lines.append("  " + ln if ln.strip() else "")
        lines.append("")
    lines.append("  const {")
    chunk: list[str] = []
    for i, k in enumerate(keys):
        chunk.append(k)
        if len(chunk) == 8 or i == len(keys) - 1:
            comma = "," if i < len(keys) - 1 else ""
            lines.append("    " + ", ".join(chunk) + comma)
            chunk = []
    lines.append("  } = api;")
    lines.append("")
    for line in funcs.splitlines():
        lines.append(("  " + line) if line.strip() else "")
    lines.append("")
    lines.append(f"  const exported = {ret};")
    lines.append("  Object.assign(api, exported);")
    lines.append("  return exported;")
    lines.append("}")
    lines.append("")
    return "\n".join(lines)


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: convert_feature_esm.py <file>...", file=sys.stderr)
        return 2
    for arg in argv[1:]:
        path = Path(arg)
        if not path.is_absolute():
            path = (ROOT / path).resolve()
        out = convert(path)
        # emoji in old \u escapes may produce surrogates; write safely
        data = out.encode("utf-8", errors="surrogatepass")
        path.write_bytes(data)
        print("converted", path, "bytes", len(out), "newFunction", "new Function" in out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
