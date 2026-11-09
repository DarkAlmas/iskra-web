/* МойGPT feature: evolution (ES module). */

export function install(api) {
  "use strict";
  const {
    state, el, API, url, uid, escapeHtml, isSafeHttpUrl, safeHref,
    makeExternalLink, renderMarkdown, renderInlineMd, renderTextBlock, highlightCode, renderCodeBlock, hostLabel, filterSources,
    scoreTip, sourceLabel, sourceHref, renderSources, renderAnswerMeta, estimateTokens, saveStore, saveStoreNow,
    loadStore, renderSidebar, renderAll, fillModelSelect, closeOtherPanels, openOverlay, closeOverlay, closeAllOverlays,
    consumeStream, fetchChatStream, buildMessagesPayload, setStreamingUI, ensureChat, activeChat, addNode, syncMessagesFromLeaf,
    pathToLeaf, deepestLeafUnder, siblingsOf, saveElo, loadElo, ensureElo, applyEloVote, eloExpected,
    safeCalc, parseSseBuffer, parseSseLine, matchChatTool, ckptLabel, heatColor, renderConfHtml, attachFeedback,
    loadLocalFeedback, saveLocalFeedback, loadPrompts, savePrompts, loadSft, saveSft, loadNotifs, saveNotifs,
    pushNotif, renderNotifBadge, loadAccent, applyAccent, updateThemeContrast, hexToRgb, relLuminance, contrastRatio,
    applyTheme, toggleTheme, newChat, stop, exportMarkdown, autoResize, checkHealth, setHealth,
    loadModels, maybeAnnounceSft, showAppToast, pickDistinctModelsPure, findSftModelsPure, fetchFirstOk, showError, isMobile,
    registerPwa, openSidebar, setupMobileGestures, resetGenToServer, syncGenSettingsUI, persistGenFromUI, syncSystemField, makeBtn,
    createBotColumn, finalizeBotColumn, runOneStream, liveUpdate, bindCodeCopy, chatGen, emptyTreeChat, nid,
    effectiveSystem, sortedChats, makeChatItem, clearMessagesDom, appendUserBubble, switchBranch, renderMessages, editUserNode,
    findAssistantChild, showAnswerDiff, FALLBACK_MODELS, CTX_WINDOW, TOUR_KEY, STORE_KEY, THEME_KEY, MAX_RENDER_MSGS,
    DEFAULT_GEN, DONUT_COLORS, MAX_ATTACH_BYTES, MAX_ATTACH_CHARS, MAX_TEACH_BYTES, MIN_TEACH_CHARS, CORPUS_LOCAL_KEY, CORPUS_GROWTH_KEY,
    PROMPTS_KEY, FOLDERS_KEY, ELO_KEY, FEEDBACK_KEY, PERSONA_KEY, SFT_KEY, LANG_KEY, GEN_CLAMP,
    I18N, ACCENT_KEY, NOTIF_KEY, OFFLINE_Q_KEY, WS_SCHEMA, TOK_COLORS, DEFAULT_PERSONAS, ensureFeat,
    lazyBindTab, registerTabFn, tabFn, drawLossChart, normalizeTrain, pollTrain, setTrainOpen, resumeTrain,
    renderTrainSamples, parseTs, dedupeEvalRows, bestBpcIndex, renderEvalBars, collectCats, fillCatFilter, renderEvalQaDetail,
    renderEvalTable, applyEvalCatFilter, loadEval, setEvalOpen, setEvalOpenImpl, fillEvalDiffSelects, qaCatBreakdown, renderQaCatPills,
    renderEvalDiff, smoothSeries, formatEta, maybeNotifyCkpt, highlightSnippet, runCorpusSearch, setCorpusOpen, corpusSourceLabel,
    corpusSourcesFromStats, recordCorpusGrowth, drawDonut, drawGrowth, formatChars, loadDashCorpusExtra, fmtNum, refreshDashboard,
    setDashOpen, setDashOpenImpl, runTokenize, runNextProbs, setLabOpen, updateConfToggleState, trapFocus, releaseFocusTrap,
    renderEloTable, setEloOpen, setArenaOpen, setArenaOpenImpl, runArena, stopArena, voteArena, openExplain,
    explainStep, renderExplainBars, pickExplainCand, explainNextTop, explainAutoToggle, explainReset, modelGroup, fillModelSelectGrouped,
    pickDistinctModels, applyArenaPair, compareSftInArena, ensureArenaDistinct, startTour, endTour, renderTour, openWorkspace,
    exportWorkspace, importWorkspaceFile, openPrompts, renderPromptsList, hideSlashPopup, showSlashPopup, applySlashPrompt, onInputSlash,
    createFolder, cmdActions, renderCmdList, openCmdPalette, openMsgSearch, highlightMsgSnippet, runMsgSearch, renderSftList,
    exportSftJsonl, uniqueSourcesFromHits, renderDatasetChips, renderDatasetList, openDatasetDoc, runDatasetSearch, addCurrentDocToSft, setDatasetOpen,
    setDatasetOpenImpl, buildStandaloneHtml, shareChatHtml, shareChatPng, roundRect, wrapText, exportHtml, openThemeBuilder,
    ensureSimilarWorker, requestSimilarChats, renderSimilarList, updateTokenBudget, scheduleTokenBudget, setModelCardOpen, fillModelCardSelect, matchEvalRow,
    refreshModelCard, appendToolCard, runChatTool, setChatStatsOpen, gatherChatStats, drawDayChart, drawModelPie, renderChatStats,
    setPlaygroundOpen, setPlaygroundOpenImpl, pgStopSeqs, renderPgTabs, paintPgActive, runPlaygroundViaNext, runPlayground, stopPlayground,
    renderNotifList, openNotifs, clearNotifs, pollNotifEvents, runSandboxedJs, runPerfCheck, sendFeedback, syncLocalFeedback,
    setupVoice, updateAttachWarn, renderAttachChips, readTextFile, addAttachFiles, postCorpusAdd, submitTeach, syncLocalCorpusOnce,
    setupAttachDnD, syncPersonaSelect, onPersonaChange, addPersona, regenerateAnswer, regenerateFromEditedUser
  } = api;


  let evoAbort = null;
  function evoModels() {
    const names = (state.models && state.models.length ? state.models : FALLBACK_MODELS).slice();
    const steps = names.filter((n) => /^step_\d+/i.test(n)).sort((a, b) => {
      const na = Number((a.match(/(\d+)/) || [0, 0])[1]);
      const nb = Number((b.match(/(\d+)/) || [0, 0])[1]);
      return na - nb;
    });
    const out = steps.slice();
    ["v0", "v1", "mygpt-latest"].forEach((n) => { if (names.indexOf(n) >= 0 && out.indexOf(n) < 0) out.push(n); });
    if (!out.length) out.push("mygpt-latest");
    return out;
  }

  async function loadEvoBpcMap() {
    const map = {};
    try {
      const res = await fetch(url(API.eval) + "?latest_only=true", { cache: "no-store" });
      if (!res.ok) return map;
      const rows = await res.json();
      (Array.isArray(rows) ? rows : []).forEach((r) => {
        const ck = String(r.ckpt || "");
        const base = ck.split("/").filter(Boolean).pop() || ck;
        const name = base.replace(/\.pt$/i, "");
        // map step_00500.pt folder names etc.
        let key = name;
        if (ck.indexOf("step_") >= 0) {
          const m = ck.match(/step_\d+/);
          if (m) key = m[0];
        } else if (ck.indexOf("/v0/") >= 0 || name === "v0") key = "v0";
        else if (ck.indexOf("/v1/") >= 0 || name === "v1") key = "v1";
        else if (name === "ckpt" && ck.indexOf("/v1/") >= 0) key = "v1";
        if (r.bpc != null) map[key] = Number(r.bpc);
        // also latest alias
        if (key === "v1") map["mygpt-latest"] = Number(r.bpc);
      });
    } catch (_) {}
    return map;
  }

  async function runEvolution() {
    if (!el.evoScroller) return;
    const prompt = ((el.evoPrompt && el.evoPrompt.value) || "").trim();
    if (!prompt) return;
    const models = evoModels();
    const bpcMap = await loadEvoBpcMap();
    el.evoScroller.innerHTML = "";
    if (el.evoStatus) el.evoStatus.textContent = "прогон " + models.length + " чекпоинтов…";
    if (el.btnEvoRun) el.btnEvoRun.disabled = true;
    if (el.btnEvoStop) el.btnEvoStop.hidden = false;
    evoAbort = new AbortController();
    const cards = {};
    let bestBpc = Infinity;
    models.forEach((m) => {
      const card = document.createElement("div");
      card.className = "evo-card";
      card.setAttribute("role", "listitem");
      const bpc = bpcMap[m];
      if (bpc != null && bpc < bestBpc) bestBpc = bpc;
      card.innerHTML =
        '<div class="evo-card-head"><strong>' + escapeHtml(m) + '</strong>' +
        '<span class="evo-bpc">' + (bpc != null ? 'bpc <em>' + Number(bpc).toFixed(3) + "</em>" : "bpc —") + "</span></div>" +
        '<div class="evo-out">…</div><div class="evo-meta">ожидание</div>';
      el.evoScroller.appendChild(card);
      cards[m] = card;
    });
    // mark best bpc
    models.forEach((m) => {
      if (bpcMap[m] != null && Number(bpcMap[m]) === bestBpc) cards[m].classList.add("best");
    });
    for (let i = 0; i < models.length; i++) {
      if (evoAbort.signal.aborted) break;
      const m = models[i];
      const card = cards[m];
      card.classList.add("running");
      card.querySelector(".evo-meta").textContent = "генерация…";
      const out = card.querySelector(".evo-out");
      out.textContent = "";
      try {
        const body = {
          messages: [{ role: "user", content: prompt }],
          model: m,
          max_new_tokens: 80,
          temperature: 0.7,
          top_k: 50,
          top_p: 0.95,
          repetition_penalty: 1.15,
          use_rag: false,
        };
        const res = await fetch(url(API.chat), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: evoAbort.signal,
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("chat " + res.status);
        let full = "";
        await consumeStream(res, (t) => { full = t; out.textContent = t; }, () => {}, null);
        card.querySelector(".evo-meta").textContent = "готово · " + estimateTokens(full) + " tok";
      } catch (err) {
        if (err.name === "AbortError") {
          card.querySelector(".evo-meta").textContent = "стоп";
          break;
        }
        out.textContent = "ошибка: " + (err.message || err);
        card.querySelector(".evo-meta").textContent = "ошибка";
      }
      card.classList.remove("running");
      card.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
    }
    if (el.evoStatus) el.evoStatus.textContent = evoAbort.signal.aborted ? "остановлено" : "готово";
    if (el.btnEvoRun) el.btnEvoRun.disabled = false;
    if (el.btnEvoStop) el.btnEvoStop.hidden = true;
    evoAbort = null;
  }

  function stopEvolution() { if (evoAbort) evoAbort.abort(); }

  function collectStepBpc(rows) {
    const pts = [];
    (Array.isArray(rows) ? rows : []).forEach((r) => {
      const ck = String(r.ckpt || "");
      const m = ck.match(/step_(\d+)/i);
      if (!m) return;
      if (r.bpc == null || isNaN(Number(r.bpc))) return;
      pts.push({ step: Number(m[1]), bpc: Number(r.bpc), ckpt: ck, ts: r.ts || "" });
    });
    pts.sort((a, b) => a.step - b.step);
    const map = {};
    pts.forEach((p) => { map[p.step] = p; });
    return Object.keys(map).map(Number).sort((a,b)=>a-b).map((k) => map[k]);
  }
  function renderBpcChart(rows) {
    let host = document.getElementById("evoBpcChart");
    if (!host && el.evoPanel) {
      host = document.createElement("div");
      host.id = "evoBpcChart";
      host.className = "evo-bpc-chart";
      host.setAttribute("aria-label", "Кривая bpc по шагам");
      const scroller = el.evoScroller;
      if (scroller && scroller.parentNode) scroller.parentNode.insertBefore(host, scroller);
      else el.evoPanel.appendChild(host);
    }
    if (!host) return;
    const pts = collectStepBpc(rows);
    host.textContent = "";
    if (!pts.length) {
      const empty = document.createElement("div");
      empty.className = "evo-empty";
      empty.textContent = "нет step_* в /api/eval";
      host.appendChild(empty);
      return;
    }
    const W = 560, H = 180, padL = 44, padR = 12, padT = 16, padB = 28;
    const xs = pts.map((p) => p.step);
    const ys = pts.map((p) => p.bpc);
    const minX = xs[0], maxX = xs[xs.length - 1];
    const minY = Math.min.apply(null, ys);
    const maxY = Math.max.apply(null, ys);
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(0.01, maxY - minY);
    const xAt = (x) => padL + ((x - minX) / spanX) * (W - padL - padR);
    const yAt = (y) => padT + (1 - (y - minY) / spanY) * (H - padT - padB);
    let d = "";
    pts.forEach((p, i) => {
      const x = xAt(p.step), y = yAt(p.bpc);
      d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1) + " ";
    });
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", String(H));
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "bpc " + Number(pts[0].bpc).toFixed(2) + " → " + Number(pts[pts.length-1].bpc).toFixed(2));
    [minY, (minY+maxY)/2, maxY].forEach((v) => {
      const y = yAt(v);
      const t = document.createElementNS(svgNS, "text");
      t.setAttribute("x", "4"); t.setAttribute("y", String(y+3)); t.setAttribute("class", "evo-axis");
      t.textContent = Number(v).toFixed(2); svg.appendChild(t);
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", String(padL)); line.setAttribute("x2", String(W-padR));
      line.setAttribute("y1", String(y)); line.setAttribute("y2", String(y));
      line.setAttribute("class", "evo-grid"); svg.appendChild(line);
    });
    pts.forEach((p) => {
      const x = xAt(p.step);
      const t = document.createElementNS(svgNS, "text");
      t.setAttribute("x", String(x)); t.setAttribute("y", String(H-6));
      t.setAttribute("text-anchor", "middle"); t.setAttribute("class", "evo-axis");
      t.textContent = String(p.step); svg.appendChild(t);
    });
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", d.trim()); path.setAttribute("class", "evo-line"); path.setAttribute("fill", "none");
    svg.appendChild(path);
    pts.forEach((p) => {
      const c = document.createElementNS(svgNS, "circle");
      c.setAttribute("cx", String(xAt(p.step))); c.setAttribute("cy", String(yAt(p.bpc)));
      c.setAttribute("r", "4"); c.setAttribute("class", "evo-dot");
      const title = document.createElementNS(svgNS, "title");
      title.textContent = String(p.step) + ": " + Number(p.bpc).toFixed(2);
      c.appendChild(title); svg.appendChild(c);
    });
    host.appendChild(svg);
    const meta = document.createElement("div");
    meta.className = "lab-meta";
    meta.append("bpc step_* : ");
    const s1 = document.createElement("strong"); s1.textContent = Number(pts[0].bpc).toFixed(2); meta.appendChild(s1);
    meta.append(" → ");
    const s2 = document.createElement("strong"); s2.textContent = Number(pts[pts.length-1].bpc).toFixed(2); meta.appendChild(s2);
    meta.append(" (" + pts.length + " точек)");
    host.appendChild(meta);
  }
  async function refreshEvoChart() {
    try {
      const res = await fetch(url(API.eval), { cache: "no-store" });
      if (!res.ok) return;
      const rows = await res.json();
      renderBpcChart(rows);
      state._evoEvalSig = (Array.isArray(rows) ? rows : []).map((r) => (r.ckpt || "") + ":" + (r.bpc != null ? Number(r.bpc).toFixed(4) : "")).join("|");
    } catch (_) {}
  }
  let evoWatchTimer = null;
  function startEvoWatch() {
    if (evoWatchTimer) return;
    refreshEvoChart();
    evoWatchTimer = setInterval(async () => {
      try {
        const res = await fetch(url(API.eval), { cache: "no-store" });
        if (!res.ok) return;
        const rows = await res.json();
        const sig = (Array.isArray(rows) ? rows : []).map((r) => (r.ckpt || "") + ":" + (r.bpc != null ? Number(r.bpc).toFixed(4) : "")).join("|");
        if (sig !== state._evoEvalSig) { state._evoEvalSig = sig; renderBpcChart(rows); }
      } catch (_) {}
    }, 30000);
  }
  function setEvoOpen(open) {
    if (!el.evoPanel) return;
    if (open) closeOtherPanels("evo");
    el.evoPanel.hidden = !open;
    if (open) { startEvoWatch(); refreshEvoChart(); }
  }

  const exported = { evoModels, loadEvoBpcMap, runEvolution, stopEvolution, setEvoOpen, renderBpcChart, refreshEvoChart, startEvoWatch, collectStepBpc };
  Object.assign(api, exported);
  return exported;
}
