#!/usr/bin/env python3
"""Lighthouse-like metrics via Playwright: LCP, TBT approx, JS size."""
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
LABEL = sys.argv[1] if len(sys.argv) > 1 else "run"


def _reexec():
    if Path(sys.executable).resolve() == VENV_PY.resolve():
        return
    os.execv(str(VENV_PY), [str(VENV_PY), str(Path(__file__).resolve()), *sys.argv[1:]])


_reexec()

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


def js_disk_bytes():
    total = 0
    files = []
    for p in sorted((ROOT / "js").glob("*.js")):
        n = p.stat().st_size
        total += n
        files.append({"name": p.name, "bytes": n})
    app = ROOT / "app.js"
    return {
        "jsDirBytes": total,
        "jsFiles": files,
        "legacyAppJsBytes": app.stat().st_size if app.exists() else 0,
        "entry": "js/main.js",
    }


def main():
    proc = ensure_mock()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            page.add_init_script(
                """
              window.__longtasks=[];
              try{
                new PerformanceObserver((list)=>{
                  for (const e of list.getEntries()) window.__longtasks.push(e.duration);
                }).observe({type:'longtask', buffered:true});
              }catch(e){}
            """
            )
            t0 = time.time()
            page.goto(BASE + "/", wait_until="networkidle")
            page.wait_for_timeout(1200)
            metrics = page.evaluate(
                """() => {
              const nav = performance.getEntriesByType('navigation')[0];
              const paints = performance.getEntriesByType('paint');
              const lcp = performance.getEntriesByType('largest-contentful-paint');
              const res = performance.getEntriesByType('resource');
              const js = res.filter(r => /\\.js(\\?|$)/.test(r.name));
              const tbtApprox = (window.__longtasks||[]).reduce((s,d)=>s+Math.max(0,d-50),0);
              return {
                dcl: nav ? nav.domContentLoadedEventEnd : null,
                load: nav ? nav.loadEventEnd : null,
                fcp: (paints.find(p=>p.name==='first-contentful-paint')||{}).startTime || null,
                lcp: lcp.length ? lcp[lcp.length-1].startTime : null,
                tbtApprox,
                jsTransfer: js.reduce((s,r)=>s+(r.transferSize||r.encodedBodySize||0),0),
                jsDecoded: js.reduce((s,r)=>s+(r.decodedBodySize||0),0),
                jsFiles: js.map(r => ({
                  name: r.name.split('/').pop(),
                  transfer: r.transferSize||0,
                  decoded: r.decodedBodySize||0,
                })),
              };
            }"""
            )
            metrics["wallMs"] = round((time.time() - t0) * 1000)
            metrics["disk"] = js_disk_bytes()
            metrics["label"] = LABEL
            out = TESTS / f"perf-{LABEL}.json"
            out.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
            print(json.dumps(metrics, ensure_ascii=False, indent=2))
            browser.close()
    finally:
        if proc:
            proc.terminate()


if __name__ == "__main__":
    main()
