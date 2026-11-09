#!/usr/bin/env python3
"""Visual regression: Playwright screenshots vs baseline with pixel threshold."""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TESTS = Path(__file__).resolve().parent
BASE = "http://127.0.0.1:8090"
VENV_PY = TESTS / ".venv" / "bin" / "python"
BASELINE = TESTS / "baseline"
OUT = TESTS / "screenshots"
THRESHOLD = float(os.environ.get("VREG_THRESHOLD", "0.02"))  # 2% different pixels
UPDATE = "--update" in sys.argv

VIEWS = [
    ("home", "/"),
    ("dash", "/?dash=1"),
    ("arena", "/?arena=1"),
    ("playground", "/?playground=1"),
    ("dataset", "/?dataset=1"),
    ("eval", "/?eval=1"),
]


def _reexec():
    if Path(sys.executable).resolve() == VENV_PY.resolve():
        return
    if not VENV_PY.exists():
        subprocess.check_call([sys.executable, "-m", "venv", str(TESTS / ".venv")])
        pip = TESTS / ".venv" / "bin" / "pip"
        subprocess.check_call([str(pip), "install", "-q", "playwright", "pillow"])
        subprocess.check_call([str(TESTS / ".venv" / "bin" / "playwright"), "install", "chromium"])
    else:
        # ensure pillow
        try:
            import PIL  # noqa
        except Exception:
            subprocess.check_call([str(TESTS / ".venv" / "bin" / "pip"), "install", "-q", "pillow"])
    os.execv(str(VENV_PY), [str(VENV_PY), str(Path(__file__).resolve()), *sys.argv[1:]])


_reexec()

from PIL import Image, ImageChops  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402


def ensure_mock():
    try:
        urllib.request.urlopen(BASE + "/api/health", timeout=2)
        return None
    except Exception:
        pass
    proc = subprocess.Popen(
        [sys.executable, str(ROOT / "mock_server.py")],
        cwd=str(ROOT),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    for _ in range(50):
        try:
            urllib.request.urlopen(BASE + "/api/health", timeout=1)
            return proc
        except Exception:
            time.sleep(0.1)
    raise RuntimeError("mock failed")


def diff_ratio(a: Path, b: Path) -> float:
    ia = Image.open(a).convert("RGB")
    ib = Image.open(b).convert("RGB")
    if ia.size != ib.size:
        ib = ib.resize(ia.size)
    diff = ImageChops.difference(ia, ib)
    # count non-zero pixels
    hist = diff.histogram()
    # RGB hist length 768; nonzero approx
    pixels = ia.size[0] * ia.size[1]
    # sum of histogram bins for values >0 across channels is messy; use getbbox + load
    nz = 0
    px = diff.load()
    w, h = diff.size
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if r or g or b:
                nz += 1
    return nz / pixels if pixels else 1.0


def main():
    BASELINE.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    proc = ensure_mock()
    results = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            for name, path in VIEWS:
                page.goto(BASE + path, wait_until="networkidle")
                page.wait_for_timeout(400)
                shot = OUT / f"{name}.png"
                page.screenshot(path=str(shot), full_page=False)
                base = BASELINE / f"{name}.png"
                if UPDATE or not base.exists():
                    base.write_bytes(shot.read_bytes())
                    results.append({"view": name, "status": "updated", "ratio": 0.0})
                    print(f"UPDATE {name}")
                else:
                    ratio = diff_ratio(base, shot)
                    ok = ratio <= THRESHOLD
                    results.append({"view": name, "status": "pass" if ok else "fail", "ratio": round(ratio, 5)})
                    print(f"{'PASS' if ok else 'FAIL'} {name} ratio={ratio:.5f} (threshold={THRESHOLD})")
            browser.close()
    finally:
        if proc:
            proc.terminate()
    (TESTS / "visual-report.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    failed = [r for r in results if r["status"] == "fail"]
    if failed:
        sys.exit(1)
    print("OK visual regression")


if __name__ == "__main__":
    main()
