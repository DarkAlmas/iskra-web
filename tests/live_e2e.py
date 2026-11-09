#!/usr/bin/env python3
"""Live end-to-end against :8800 (real server). Exit 0 on success."""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

BASE = "http://127.0.0.1:8800"
OUT = Path(__file__).resolve().parent / "live-e2e-report.json"


def main():
    from playwright.sync_api import sync_playwright
    import urllib.request

    # API preflight
    apis = {}
    for path in ["/api/models", "/api/corpus/stats", "/api/eval", "/api/health"]:
        try:
            with urllib.request.urlopen(BASE + path, timeout=8) as r:
                apis[path] = {"status": r.status, "bytes": len(r.read())}
        except Exception as e:
            apis[path] = {"error": str(e)}
            print("API fail", path, e)
            raise SystemExit(2)

    results = {"apis": apis, "checks": {}, "errors": []}
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path="/usr/bin/google-chrome",
            args=["--no-sandbox", "--disable-gpu"],
        )
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.on("pageerror", lambda e: results["errors"].append("pageerror:" + str(e)))
        page.on(
            "console",
            lambda m: results["errors"].append("console:" + m.text) if m.type == "error" else None,
        )
        page.add_init_script("localStorage.setItem('mygpt.tour.done.v1','1');")
        page.goto(BASE + "/", wait_until="networkidle", timeout=60000)
        page.wait_for_selector("#input", timeout=15000)
        results["checks"]["boot"] = True

        # Chat SSE with sources
        page.fill("#input", "Что такое трансформер в машинном обучении?")
        page.click("#btnSend")
        page.wait_for_selector(".msg.bot .bubble", timeout=120000)
        # wait until send re-enabled (stream done)
        page.wait_for_function(
            "() => !document.getElementById('btnSend')?.disabled",
            timeout=180000,
        )
        bot = page.locator(".msg.bot").last
        text = bot.locator(".bubble").inner_text()
        has_sources = bot.locator(".sources, .msg-sources, .cite, a[href^='http']").count() > 0
        results["checks"]["chat_sse"] = {"ok": bool(text.strip()), "chars": len(text), "sources": has_sources}
        if not text.strip():
            raise SystemExit("empty chat")

        # Arena two models
        page.click("#btnToggleArena")
        page.wait_for_selector("#arenaPanel:not([hidden])", timeout=10000)
        a = page.locator("#arenaModelA").input_value()
        b = page.locator("#arenaModelB").input_value()
        results["checks"]["arena_pair"] = {"a": a, "b": b, "distinct": a != b}
        if a == b:
            raise SystemExit("arena same models: " + a)
        page.fill("#arenaPrompt", "Назови столицу Франции одним словом")
        page.click("#btnArenaRun")
        page.wait_for_function(
            "() => !document.getElementById('btnArenaRun')?.disabled",
            timeout=180000,
        )
        ta = page.locator("#arenaBubbleA").inner_text()
        tb = page.locator("#arenaBubbleB").inner_text()
        results["checks"]["arena_stream"] = {"a_chars": len(ta), "b_chars": len(tb)}

        # Evolution chart
        if page.locator("#btnToggleEvo").count():
            page.click("#btnToggleEvo")
            page.wait_for_selector("#evoPanel:not([hidden])", timeout=10000)
            # chart may render async
            page.wait_for_timeout(1500)
            has_chart = page.locator("#evoBpcChart svg, #evoBpcChart .evo-empty").count() > 0
            results["checks"]["evolution"] = {"chart": has_chart}
        else:
            results["checks"]["evolution"] = {"skipped": True}

        # Dashboard
        page.click("#btnToggleDash")
        page.wait_for_selector("#dashPanel:not([hidden])", timeout=10000)
        page.wait_for_timeout(800)
        results["checks"]["dashboard"] = {"open": True}

        # Playground n=2
        if page.locator("#btnTogglePlayground").count():
            page.click("#btnTogglePlayground")
            page.wait_for_selector("#playgroundPanel:not([hidden])", timeout=10000)
            if page.locator("#pgNBest").count():
                page.fill("#pgNBest", "2")
            if page.locator("#pgPrompt").count():
                page.fill("#pgPrompt", "Москва — это")
            if page.locator("#pgSteps").count():
                page.fill("#pgSteps", "24")
            page.click("#btnPgRun")
            page.wait_for_function(
                "() => !document.getElementById('btnPgRun')?.disabled",
                timeout=180000,
            )
            ntabs = page.locator("#pgTabs .pg-tab").count()
            results["checks"]["playground_n2"] = {"tabs": ntabs, "ok": ntabs >= 1}
        else:
            results["checks"]["playground_n2"] = {"skipped": True}

        # /wiki tool via chat
        page.click("#btnToggleArena")  # close-ish; ensure chat visible
        # close panels
        page.evaluate("""() => {
          document.querySelectorAll('.arena-panel,.dash-panel,.evo-panel,.playground-panel,[id$=Panel]').forEach(n => { try { n.hidden = true; } catch(e){} });
        }""")
        page.fill("#input", "/wiki трансформер")
        page.click("#btnSend")
        page.wait_for_function(
            "() => !document.getElementById('btnSend')?.disabled",
            timeout=120000,
        )
        wiki_ok = page.locator(".msg.bot").last.locator("a[href^='http'], .tool-card, .wiki-card, .sources").count() > 0 or \
                  len(page.locator(".msg.bot").last.inner_text()) > 10
        results["checks"]["wiki"] = {"ok": bool(wiki_ok)}

        # Demo pair logic via page evaluate
        pair = page.evaluate("""() => {
          const names = (window.__models || []);
          return null;
        }""")
        models = page.evaluate("""async () => {
          const r = await fetch('/api/models');
          const d = await r.json();
          return d.models || d;
        }""")
        results["checks"]["models"] = models
        arena_a = page.locator("#arenaModelA").input_value() if page.locator("#arenaModelA").count() else None
        results["checks"]["arena_after"] = {"a": arena_a}

        browser.close()

    # soft filter known noisy console
    soft = [e for e in results["errors"] if "favicon" not in e.lower()]
    results["errors"] = soft[:20]
    OUT.write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(json.dumps(results["checks"], ensure_ascii=False, indent=2))
    if not results["checks"].get("chat_sse", {}).get("ok"):
        raise SystemExit("chat failed")
    if not results["checks"].get("arena_pair", {}).get("distinct"):
        raise SystemExit("arena not distinct")
    print("LIVE E2E PASS")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SystemExit:
        raise
    except Exception as e:
        print("LIVE E2E FAIL", e)
        raise
