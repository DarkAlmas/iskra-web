#!/usr/bin/env python3
"""Record short demo webm + poster against live :8800."""
from __future__ import annotations

import sys
import time
from pathlib import Path

BASE = "http://127.0.0.1:8800"
ROOT = Path(__file__).resolve().parents[1]
DEMO = ROOT / "demo"
DEMO.mkdir(exist_ok=True)


def main():
    from playwright.sync_api import sync_playwright

    video_dir = DEMO / "_rec"
    video_dir.mkdir(exist_ok=True)
    for p in video_dir.glob("*"):
        p.unlink()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path="/usr/bin/google-chrome",
            args=["--no-sandbox", "--disable-gpu"],
        )
        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=str(video_dir),
            record_video_size={"width": 1280, "height": 720},
        )
        page = context.new_page()
        page.add_init_script("localStorage.setItem('mygpt.tour.done.v1','1');")
        page.goto(BASE + "/?demo=1", wait_until="networkidle", timeout=60000)
        page.wait_for_selector("#demoBar", timeout=20000)
        # step through slides with Next, pausing for capture
        for i in range(6):
            page.wait_for_timeout(1800)
            if i == 0:
                page.screenshot(path=str(DEMO / "poster.png"), full_page=False)
            nxt = page.locator("#demoNext")
            if nxt.count():
                nxt.click()
            page.wait_for_timeout(1200)
        # ensure Итоги visible
        page.wait_for_timeout(2500)
        if page.locator("#demoItogi:not([hidden])").count():
            page.screenshot(path=str(DEMO / "poster-itogi.png"), full_page=False)
        context.close()
        browser.close()

    vids = list(video_dir.glob("*.webm"))
    if not vids:
        raise SystemExit("no webm recorded")
    dest = DEMO / "demo.webm"
    dest.write_bytes(vids[0].read_bytes())
    # cleanup temp
    for p in video_dir.glob("*"):
        p.unlink()
    try:
        video_dir.rmdir()
    except OSError:
        pass
    print("wrote", dest, "bytes", dest.stat().st_size)
    print("poster", DEMO / "poster.png")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
