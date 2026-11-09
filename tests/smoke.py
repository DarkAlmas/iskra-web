#!/usr/bin/env python3
"""Playwright smoke against mock_server on :8090. Exit 0 on success."""
from __future__ import annotations

import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TESTS = Path(__file__).resolve().parent
BASE = "http://127.0.0.1:8090"
VENV_PY = TESTS / ".venv" / "bin" / "python"



def open_menu_click(page, menu_btn: str, item: str):
    """Open a topbar overflow/export menu then click a menuitem inside it."""
    page.click(menu_btn)
    page.wait_for_selector(f"{item}:visible", timeout=3000)
    page.click(item)


def click_tab(page, tab_id: str):
    """Click a primary tab, opening the tabs overflow menu when the track is collapsed."""
    loc = page.locator(tab_id)
    if loc.count() and loc.first.is_visible():
        loc.first.click()
        return
    # open overflow and click by data-origin-id or visible text via JS trigger on original
    page.click("#btnTabsMore")
    page.wait_for_selector("#tabsMenu:not([hidden])", timeout=3000)
    page.evaluate(
        """(id) => {
          const origin = document.querySelector(id);
          if (origin) origin.click();
          const menu = document.getElementById('tabsMenu');
          if (menu) menu.hidden = true;
          const btn = document.getElementById('btnTabsMore');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        }""",
        tab_id,
    )

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

def ensure_mock():
    try:
        import urllib.request

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
    for _ in range(40):
        try:
            import urllib.request

            urllib.request.urlopen(BASE + "/api/health", timeout=1)
            return proc
        except Exception:
            time.sleep(0.15)
    proc.kill()
    raise SystemExit("mock server failed to start")


def main():
    from playwright.sync_api import sync_playwright

    owned = ensure_mock()
    errors = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                executable_path="/usr/bin/google-chrome",
                args=["--no-sandbox", "--disable-gpu"],
            )
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            page.on("pageerror", lambda e: errors.append("pageerror:" + str(e)))
            page.on(
                "console",
                lambda m: errors.append("console:" + m.text) if m.type == "error" else None,
            )
            # skip auto tour for smoke
            page.add_init_script("localStorage.setItem('mygpt.tour.done.v1','1');")
            page.goto(BASE + "/", wait_until="networkidle", timeout=30000)
            assert page.locator("#input").count() == 1, "no input"
            page.fill("#input", "привет smoke")
            page.click("#btnSend")
            page.wait_for_function(
                "() => !document.getElementById('btnSend')?.disabled",
                timeout=20000,
            )
            page.wait_for_selector(".msg.bot .bubble", timeout=10000)
            text = page.locator(".msg.bot .bubble").last.inner_text()
            assert text.strip(), "empty stream response"

            # tabs (may live under ⋯ overflow at 1280)
            for btn, panel in [
                ("#btnToggleDash", "#dashPanel"),
                ("#btnToggleTrain", "#trainPanel"),
                ("#btnToggleEval", "#evalPanel"),
                ("#btnToggleCorpus", "#corpusPanel"),
                ("#btnToggleDataset", "#datasetPanel"),
                ("#btnToggleLab", "#labPanel"),
                ("#btnToggleArena", "#arenaPanel"),
                ("#btnToggleElo", "#eloPanel"),
            ]:
                click_tab(page, btn)
                page.wait_for_selector(panel + ":not([hidden])", timeout=5000)
            click_tab(page, "#btnToggleElo")  # close
            assert page.locator("#eloPanel[hidden]").count() == 1

            # v8: command palette
            page.keyboard.press("Control+k")
            page.wait_for_selector("#cmdPalette:not([hidden])", timeout=5000)
            page.fill("#cmdInput", "арена")
            page.wait_for_selector("#cmdList li", timeout=3000)
            page.keyboard.press("Escape")
            assert page.locator("#cmdPalette[hidden]").count() == 1

            # v8/v9: settings + gen fields + reset
            click_tab(page, "#btnToggleSettings")
            page.wait_for_selector("#settingsPanel:not([hidden])", timeout=5000)
            assert page.locator("#toppSlider").count() == 1
            assert page.locator("#repSlider").count() == 1
            assert page.locator("#btnResetGen").count() == 1
            page.locator("#heatmapToggle").check()
            assert page.locator("#heatmapLegend:not([hidden])").count() == 1
            # default rep should be 1.15
            rep = page.locator("#repSlider").input_value()
            assert abs(float(rep) - 1.15) < 0.001, "rep default " + rep
            # v10 clamp ranges match server
            assert page.locator("#tempSlider").get_attribute("min") == "0"
            assert page.locator("#tempSlider").get_attribute("max") == "5"
            assert page.locator("#tokensSlider").get_attribute("min") == "1"
            assert page.locator("#tokensSlider").get_attribute("max") == "4096"
            assert page.locator("#topkSlider").get_attribute("max") == "500"
            assert page.locator("#toppSlider").get_attribute("min") == "0.01"
            assert page.locator("#repSlider").get_attribute("min") == "0.5"
            assert page.locator("#repSlider").get_attribute("max") == "3"

            # v8: prompts slash
            page.click("#btnPrompts")
            page.wait_for_selector("#promptsOverlay:not([hidden])", timeout=5000)
            page.keyboard.press("Escape")

            # v8: msg search
            page.keyboard.press("Control+f")
            page.wait_for_selector("#msgSearchOverlay:not([hidden])", timeout=5000)
            page.fill("#msgSearchInput", "smoke")
            page.wait_for_timeout(200)
            page.keyboard.press("Escape")

            assert page.locator("#btnNewFolder").count() == 1

            # dashboard corpus stats
            click_tab(page, "#btnToggleDash")
            page.wait_for_selector("#dashPanel:not([hidden])", timeout=5000)
            page.wait_for_timeout(500)
            meta = page.locator("#dashCorpusMeta").inner_text()
            assert "clean" in meta.lower() or "документ" in meta.lower() or "rag" in meta.lower()
            # scrub card may show
            scrub = page.locator("#dashScrubCard")
            if scrub.count() and not scrub.is_hidden():
                assert "EMAIL" in scrub.inner_text() or "dup" in scrub.inner_text().lower() or "secret" in scrub.inner_text().lower()

            # v9 arena run + vote
            click_tab(page, "#btnToggleArena")
            page.wait_for_selector("#arenaPanel:not([hidden])", timeout=5000)
            page.fill("#arenaPrompt", "smoke arena prompt")
            page.click("#btnArenaRun")
            page.wait_for_selector("#arenaVote:not([hidden])", timeout=25000)
            page.click("#btnArenaA")
            page.wait_for_timeout(300)
            status = page.locator("#arenaVoteStatus").inner_text()
            assert "сохран" in status.lower()

            # elo updated
            click_tab(page, "#btnToggleElo")
            page.wait_for_selector("#eloPanel:not([hidden])", timeout=5000)
            rows = page.locator("#eloTable tbody tr").count()
            assert rows >= 1, "elo empty after vote"

            # explain button
            click_tab(page, "#btnToggleElo")  # close panels via toggle? may reopen - open chat
            # ensure messages visible: close panels
            page.evaluate("() => { document.querySelectorAll('.arena-panel,.elo-panel,.dash-panel,.settings').forEach(n=>n.hidden=true) }")
            page.wait_for_selector("button:has-text('Объяснить')", timeout=5000)
            page.click("button:has-text('Объяснить')")
            page.wait_for_selector("#explainOverlay:not([hidden])", timeout=5000)
            page.wait_for_timeout(400)
            page.keyboard.press("Escape")
            assert page.locator("#explainOverlay[hidden]").count() == 1

            # workspace export UI
            open_menu_click(page, "#btnExportMenu", "#btnWorkspace")
            page.wait_for_selector("#workspaceOverlay:not([hidden])", timeout=5000)
            assert page.locator("#btnWsExport").count() == 1
            page.keyboard.press("Escape")

            # tour reopen via palette
            page.keyboard.press("Control+k")
            page.fill("#cmdInput", "обзор")
            page.wait_for_selector("#cmdList li", timeout=3000)
            page.locator("#cmdList li").first.click()
            page.wait_for_selector("#tour:not([hidden])", timeout=5000)
            page.click("#btnTourSkip")
            assert page.locator("#tour[hidden]").count() == 1

            # v10 dataset search + sft
            click_tab(page, "#btnToggleDataset")
            page.wait_for_selector("#datasetPanel:not([hidden])", timeout=5000)
            page.fill("#datasetQuery", "трансформер")
            page.click("#btnDatasetSearch")
            page.wait_for_selector("#datasetList .dataset-item", timeout=10000)
            page.locator("#datasetList .dataset-item").first.click()
            page.wait_for_selector("#datasetDoc:not([hidden])", timeout=5000)
            page.click("#btnSftAdd")
            page.wait_for_timeout(200)
            assert int(page.locator("#sftCount").inner_text().strip() or "0") >= 1

            # v10 train live controls
            click_tab(page, "#btnToggleTrain")
            page.wait_for_selector("#trainPanel:not([hidden])", timeout=5000)
            page.wait_for_timeout(600)
            assert page.locator("#smoothSlider").count() == 1
            assert page.locator("#trainEta").count() == 1
            assert page.locator("#lossChart").count() == 1

            # v10 eval diff
            click_tab(page, "#btnToggleEval")
            page.wait_for_selector("#evalPanel:not([hidden])", timeout=5000)
            page.wait_for_timeout(500)
            if page.locator("#evalDiffA option").count() >= 2:
                page.click("#btnEvalDiff")
                page.wait_for_selector("#evalDiffGrid:not([hidden])", timeout=5000)
                assert page.locator("#evalDiffGrid .eval-diff-col").count() == 2

            # v10 arena grouped models + distinct
            click_tab(page, "#btnToggleArena")
            page.wait_for_selector("#arenaPanel:not([hidden])", timeout=5000)
            a = page.locator("#arenaModelA").input_value()
            b = page.locator("#arenaModelB").input_value()
            assert a != b, f"arena models should differ: {a} vs {b}"
            assert page.locator("#arenaModelA optgroup").count() >= 1

            # v10 i18n + share buttons exist
            assert page.locator("#btnLang").count() == 1
            assert page.locator("#btnShareHtml").count() == 1
            assert page.locator("#btnSharePng").count() == 1
            assert page.locator("#btnPerf").count() == 1
            open_menu_click(page, "#btnMoreMenu", "#btnLang")
            page.wait_for_timeout(100)
            assert page.locator("#btnToggleDataset").inner_text().strip() in ("Dataset", "Датасет")

            # v11 model card
            click_tab(page, "#btnToggleModelCard")
            page.wait_for_selector("#modelCardPanel:not([hidden])", timeout=5000)
            page.wait_for_timeout(600)
            assert page.locator("#mcParams").count() == 1
            assert page.locator("#mcMetrics").count() == 1
            meta = page.locator("#mcMetrics").inner_text()
            assert "bpc" in meta.lower()

            # v11 playground
            click_tab(page, "#btnTogglePlayground")
            page.wait_for_selector("#playgroundPanel:not([hidden])", timeout=5000)
            page.fill("#pgPrompt", "МойGPT:")
            page.fill("#pgSteps", "3")
            page.fill("#pgNBest", "2")
            page.click("#btnPgRun")
            page.wait_for_timeout(2500)
            assert page.locator("#pgOut").inner_text().strip() != "" or page.locator("#pgNBestOut .pg-nbest-card").count() >= 1

            # v11 theme builder + contrast
            open_menu_click(page, "#btnMoreMenu", "#btnThemeBuilder")
            page.wait_for_selector("#themeBuilderOverlay:not([hidden])", timeout=5000)
            assert page.locator("#accentPicker").count() == 1
            page.wait_for_timeout(100)
            contrast = page.locator("#themeContrast").inner_text()
            assert "WCAG" in contrast
            page.keyboard.press("Escape")

            # v11 notifications + token budget + similar
            assert page.locator("#btnNotif").count() == 1
            assert page.locator("#tokenBudget").count() == 1
            assert page.locator("#similarBox").count() == 1
            page.fill("#input", "проверка бюджета токенов " * 5)
            page.wait_for_timeout(600)
            assert "токены:" in page.locator("#tokenBudgetLabel").inner_text()

            # v11 eval diff cats / bpc
            click_tab(page, "#btnToggleEval")
            page.wait_for_selector("#evalPanel:not([hidden])", timeout=5000)
            page.wait_for_timeout(400)
            if page.locator("#evalDiffA option").count() >= 2:
                page.click("#btnEvalDiff")
                page.wait_for_selector("#evalDiffGrid:not([hidden])", timeout=5000)
                grid = page.locator("#evalDiffGrid").inner_text()
                assert "bpc" in grid.lower()

            # v12 evolution
            click_tab(page, "#btnToggleEvo")
            page.wait_for_selector("#evoPanel:not([hidden])", timeout=5000)
            page.fill("#evoPrompt", "smoke evo")
            page.click("#btnEvoRun")
            page.wait_for_selector("#evoScroller .evo-card", timeout=5000)
            page.wait_for_timeout(2500)
            assert page.locator("#evoScroller .evo-card").count() >= 2

            # v12 tools /calc /time
            page.evaluate("() => { document.querySelectorAll('.evo-panel,.playground-panel,.chatstats-panel,.dash-panel,.settings,.arena-panel,.elo-panel,.dataset-panel,.train-panel,.eval-panel,.corpus-panel,.lab-panel,.modelcard-panel').forEach(n=>n.hidden=true) }")
            page.fill("#input", "/calc 2+2*3")
            page.click("#btnSend")
            page.wait_for_selector(".tool-card", timeout=8000)
            assert "8" in page.locator(".tool-card").last.inner_text()
            page.fill("#input", "/time")
            page.click("#btnSend")
            page.wait_for_function("() => document.querySelectorAll('.tool-badge').length >= 2", timeout=8000)
            assert page.locator(".tool-badge").count() >= 2

            # v12 chat stats
            click_tab(page, "#btnToggleChatStats")
            page.wait_for_selector("#chatStatsPanel:not([hidden])", timeout=5000)
            page.wait_for_timeout(300)
            assert "сообщений" in page.locator("#csSummary").inner_text().lower() or "messages" in page.locator("#csSummary").inner_text().lower()

            # v12 playground raw/n
            click_tab(page, "#btnTogglePlayground")
            page.wait_for_selector("#playgroundPanel:not([hidden])", timeout=5000)
            page.fill("#pgPrompt", "МойGPT:")
            page.fill("#pgSteps", "32")
            page.fill("#pgNBest", "2")
            page.click("#btnPgRun")
            page.wait_for_timeout(2500)
            assert page.locator("#pgOut").inner_text().strip() != "" or page.locator("#pgNBestOut .pg-variant, #pgNBestOut .pg-nbest-card").count() >= 1

            # v12 help sheet
            open_menu_click(page, "#btnMoreMenu", "#btnHelp")
            page.wait_for_selector("#helpTip:not([hidden])", timeout=3000)
            assert "/calc" in page.locator("#helpTip").inner_text()
            page.keyboard.press("Escape")

            # v12 code run button exists after a code reply — send prompt that triggers mock js fence
            page.evaluate("() => { document.querySelectorAll('.playground-panel,.chatstats-panel,.evo-panel,.settings,.dash-panel').forEach(n=>n.hidden=true) }")
            page.fill("#input", "покажи js")
            page.click("#btnSend")
            page.wait_for_function("() => !document.getElementById('btnSend')?.disabled", timeout=20000)
            page.wait_for_selector(".code-run", state="attached", timeout=10000)
            page.evaluate("""() => {
              document.querySelectorAll('section').forEach(n => n.hidden = true);
              const b = document.querySelector('.msg.bot:last-of-type .code-run') || document.querySelector('.code-run');
              if (b) { b.scrollIntoView({block:'center'}); b.click(); }
            }""")
            page.wait_for_selector(".code-run-out", state="attached", timeout=5000)

            # mobile viewport smoke
            page.set_viewport_size({"width": 390, "height": 844})
            page.wait_for_timeout(200)
            click_tab(page, "#btnToggleSettings")
            page.wait_for_selector("#settingsPanel:not([hidden])", timeout=5000)
            page.keyboard.press("Escape")

            browser.close()
    finally:
        if owned is not None:
            owned.terminate()
            try:
                owned.wait(timeout=3)
            except Exception:
                owned.kill()

    real = [
        e
        for e in errors
        if "favicon" not in e.lower()
        and "Download the React DevTools" not in e
        and "sandboxed and lacks the 'allow-same-origin'" not in e
        and "sandboxed and lacks the \"allow-same-origin\"" not in e
    ]
    if real:
        print("FAIL console/page errors:")
        for e in real:
            print(" ", e)
        raise SystemExit(1)
    print("OK smoke passed")


if __name__ == "__main__":
    main()
