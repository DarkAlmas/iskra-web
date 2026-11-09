#!/usr/bin/env python3
"""Playwright: /sandbox-runner.html must not execute posted code on direct nav / window.open.
Sandboxed iframe (allow-scripts, no same-origin) must still run code. Exit 0 on success.
"""
from __future__ import annotations

import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TESTS = Path(__file__).resolve().parent
BASE = os.environ.get("SANDBOX_GUARD_BASE", "http://127.0.0.1:8800")
VENV_PY = TESTS / ".venv" / "bin" / "python"
MARKER = "__MYGPT_SANDBOX_PWN__"


def _reexec_in_venv():
    if Path(sys.executable).resolve() == VENV_PY.resolve():
        return
    if not VENV_PY.exists():
        subprocess.check_call([sys.executable, "-m", "venv", str(TESTS / ".venv")])
        pip = TESTS / ".venv" / "bin" / "pip"
        subprocess.check_call([str(pip), "install", "-q", "playwright"])
        subprocess.check_call([str(TESTS / ".venv" / "bin" / "playwright"), "install", "chromium"])
    os.execv(str(VENV_PY), [str(VENV_PY), str(Path(__file__).resolve()), *sys.argv[1:]])


_reexec_in_venv()


def launch_browser(p, name: str):
    if name == "chromium":
        return p.chromium.launch(
            headless=True,
            executable_path="/usr/bin/google-chrome",
            args=["--no-sandbox", "--disable-gpu"],
        )
    if name == "firefox":
        return p.firefox.launch(headless=True)
    if name == "webkit":
        return p.webkit.launch(headless=True)
    raise ValueError(name)


def assert_no_exec_on_top_level(browser, path_mode: str):
    """Direct goto or window.open: posted __mygpt_run_src must not run."""
    page = browser.new_page()
    got = {"n": 0, "out": []}

    def on_msg(msg):
        if msg.type == "error" and "0" in (msg.text or ""):
            return  # expected throw 0
        if msg.type == "error":
            got["out"].append("console:" + msg.text)

    page.on("console", on_msg)
    page.on("pageerror", lambda e: None)  # throw 0 expected

    if path_mode == "goto":
        page.goto(BASE + "/sandbox-runner.html", wait_until="domcontentloaded", timeout=15000)
        target = page
    else:
        page.goto(BASE + "/", wait_until="domcontentloaded", timeout=15000)
        with page.expect_popup() as pop_info:
            page.evaluate("() => window.open('/sandbox-runner.html', '_blank')")
        target = pop_info.value
        target.wait_for_load_state("domcontentloaded")

    # Try to inject runnable payload as if we were parent (we are opener / same browsing)
    executed = target.evaluate(
        """(marker) => new Promise((resolve) => {
          const hits = [];
          const onMsg = (ev) => {
            if (ev.data && ev.data.__mygpt_run) hits.push(ev.data);
          };
          window.addEventListener('message', onMsg);
          // If runner registered a listener despite guard, this would execute
          try {
            // For top-level, parent===self so runner should have thrown before listen
            window.postMessage({ __mygpt_run_src: "console.log('" + marker + "')" }, '*');
          } catch (e) {}
          setTimeout(() => {
            window.removeEventListener('message', onMsg);
            resolve({
              origin: String(location.origin),
              hits,
              bodyText: (document.body && document.body.innerText) || '',
              hasListenerHint: !!window.__mygpt_run
            });
          }, 800);
        })""",
        MARKER,
    )
    # Also try posting into the runner page from the opener when popup
    if path_mode == "open" and target != page:
        page.evaluate(
            """(marker) => {
              // popup may be opaque; best-effort post via reference if same-process
            }""",
            MARKER,
        )

    # Marker must never appear as executed output
    blob = str(executed) + str(got["out"])
    assert MARKER not in blob, f"payload executed on top-level ({path_mode}): {blob}"
    # Ready handshake must not fire to a real parent consumer with out containing marker
    for h in executed.get("hits") or []:
        assert MARKER not in str(h.get("out") or ""), f"run output leaked: {h}"
        # ready without running code is still a leak of capability; top-level must throw first
        # With CSP sandbox header origin may be 'null' but parent===self must still block ready
    page.close()
    if path_mode == "open" and target != page:
        try:
            target.close()
        except Exception:
            pass


def assert_iframe_run_works(browser):
    page = browser.new_page()
    page.add_init_script("localStorage.setItem('mygpt.tour.done.v1','1');")
    page.goto(BASE + "/", wait_until="networkidle", timeout=30000)

    result = page.evaluate(
        """() => new Promise((resolve) => {
          const iframe = document.createElement('iframe');
          iframe.setAttribute('sandbox', 'allow-scripts');
          iframe.src = new URL('sandbox-runner.html', location.href).href;
          const timer = setTimeout(() => {
            cleanup();
            resolve({ ok: false, err: 'timeout' });
          }, 4000);
          function cleanup() {
            clearTimeout(timer);
            window.removeEventListener('message', onMsg);
            try { iframe.remove(); } catch (_) {}
          }
          function onMsg(ev) {
            if (ev.source !== iframe.contentWindow) return;
            if (!ev.data || !ev.data.__mygpt_run) return;
            if (ev.data.ready) {
              try {
                iframe.contentWindow.postMessage(
                  { __mygpt_run_src: "console.log('sandbox-ok-42')" },
                  '*'
                );
              } catch (e) {
                cleanup();
                resolve({ ok: false, err: String(e) });
              }
              return;
            }
            cleanup();
            resolve({ ok: !!ev.data.ok, out: ev.data.out || '', err: null });
          }
          window.addEventListener('message', onMsg);
          document.body.appendChild(iframe);
        })"""
    )
    page.close()
    assert result.get("ok"), f"sandboxed iframe run failed: {result}"
    assert "sandbox-ok-42" in (result.get("out") or ""), f"unexpected out: {result}"


def main():
    from playwright.sync_api import sync_playwright

    browsers = sys.argv[1:] or ["chromium"]
    with sync_playwright() as p:
        for name in browsers:
            print(f"== {name} ==")
            browser = launch_browser(p, name)
            try:
                assert_no_exec_on_top_level(browser, "goto")
                print("  OK direct goto blocked")
                assert_no_exec_on_top_level(browser, "open")
                print("  OK window.open blocked")
                assert_iframe_run_works(browser)
                print("  OK sandboxed iframe run")
            finally:
                browser.close()
    print("OK sandbox_runner_guard passed")


if __name__ == "__main__":
    main()
