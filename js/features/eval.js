/* МойGPT feature: eval (ES module). */

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
    renderTrainSamples, highlightSnippet, runCorpusSearch, setCorpusOpen, corpusSourceLabel, corpusSourcesFromStats, recordCorpusGrowth, drawDonut,
    drawGrowth, formatChars, loadDashCorpusExtra, fmtNum, refreshDashboard, setDashOpen, setDashOpenImpl, runTokenize,
    runNextProbs, setLabOpen, updateConfToggleState, trapFocus, releaseFocusTrap, renderEloTable, setEloOpen, setArenaOpen,
    setArenaOpenImpl, runArena, stopArena, voteArena, openExplain, explainStep, renderExplainBars, pickExplainCand,
    explainNextTop, explainAutoToggle, explainReset, modelGroup, fillModelSelectGrouped, pickDistinctModels, applyArenaPair, compareSftInArena,
    ensureArenaDistinct, startTour, endTour, renderTour, openWorkspace, exportWorkspace, importWorkspaceFile, openPrompts,
    renderPromptsList, hideSlashPopup, showSlashPopup, applySlashPrompt, onInputSlash, createFolder, cmdActions, renderCmdList,
    openCmdPalette, openMsgSearch, highlightMsgSnippet, runMsgSearch, renderSftList, exportSftJsonl, uniqueSourcesFromHits, renderDatasetChips,
    renderDatasetList, openDatasetDoc, runDatasetSearch, addCurrentDocToSft, setDatasetOpen, setDatasetOpenImpl, buildStandaloneHtml, shareChatHtml,
    shareChatPng, roundRect, wrapText, exportHtml, openThemeBuilder, ensureSimilarWorker, requestSimilarChats, renderSimilarList,
    updateTokenBudget, scheduleTokenBudget, setModelCardOpen, fillModelCardSelect, matchEvalRow, refreshModelCard, appendToolCard, runChatTool,
    evoModels, loadEvoBpcMap, runEvolution, stopEvolution, setChatStatsOpen, gatherChatStats, drawDayChart, drawModelPie,
    renderChatStats, setPlaygroundOpen, setPlaygroundOpenImpl, pgStopSeqs, renderPgTabs, paintPgActive, runPlaygroundViaNext, runPlayground,
    stopPlayground, renderNotifList, openNotifs, clearNotifs, pollNotifEvents, runSandboxedJs, runPerfCheck, sendFeedback,
    syncLocalFeedback, setupVoice, updateAttachWarn, renderAttachChips, readTextFile, addAttachFiles, postCorpusAdd, submitTeach,
    syncLocalCorpusOnce, setupAttachDnD, syncPersonaSelect, onPersonaChange, addPersona, setEvoOpen, renderBpcChart, regenerateAnswer,
    regenerateFromEditedUser
  } = api;


  function parseTs(ts) {
    if (!ts) return 0;
    const t = Date.parse(String(ts).replace(" ", "T"));
    return isNaN(t) ? 0 : t;
  }

  function dedupeEvalRows(rows) {
    const map = new Map();
    (rows || []).forEach((r) => {
      const key = r.ckpt || r.run || JSON.stringify(r);
      const prev = map.get(key);
      if (!prev || parseTs(r.ts) >= parseTs(prev.ts)) map.set(key, r);
    });
    return Array.from(map.values()).sort((a, b) => {
      const ba = a.bpc == null ? Infinity : Number(a.bpc);
      const bb = b.bpc == null ? Infinity : Number(b.bpc);
      if (ba !== bb) return ba - bb;
      return parseTs(b.ts) - parseTs(a.ts);
    });
  }

  function bestBpcIndex(rows) {
    let bi = -1, best = Infinity;
    rows.forEach((r, i) => {
      if (r.bpc == null || isNaN(Number(r.bpc))) return;
      const v = Number(r.bpc);
      if (v < best) { best = v; bi = i; }
    });
    return bi;
  }

  function renderEvalBars(rows) {
    el.evalBars.innerHTML = "";
    const vals = rows.map((r) => (r.bpc == null ? null : Number(r.bpc)));
    const finite = vals.filter((v) => v != null && !isNaN(v));
    if (!finite.length) {
      el.evalBars.innerHTML = '<div class="eval-empty">нет bpc</div>';
      return;
    }
    const max = Math.max.apply(null, finite);
    const min = Math.min.apply(null, finite);
    const bi = bestBpcIndex(rows);
    rows.forEach((r, i) => {
      const v = r.bpc == null ? null : Number(r.bpc);
      const row = document.createElement("div");
      row.className = "eval-bar-row" + (i === bi ? " best" : "");
      const name = document.createElement("div");
      name.className = "name";
      name.title = r.ckpt || "";
      name.textContent = ckptLabel(r.ckpt);
      const track = document.createElement("div");
      track.className = "eval-bar-track";
      const fill = document.createElement("div");
      fill.className = "eval-bar-fill";
      // lower bpc = better → invert bar length relative to max
      if (v == null || isNaN(v) || max <= 0) fill.style.width = "0%";
      else {
        const inverted = max - v + min * 0.05;
        const pct = Math.max(4, Math.min(100, (inverted / max) * 100));
        fill.style.width = pct + "%";
      }
      track.appendChild(fill);
      const val = document.createElement("div");
      val.className = "val";
      val.textContent = v == null || isNaN(v) ? "—" : v.toFixed(3);
      row.appendChild(name);
      row.appendChild(track);
      row.appendChild(val);
      el.evalBars.appendChild(row);
    });
  }

  function collectCats(rows) {
    const set = new Set();
    rows.forEach((r) => (r.qa || []).forEach((q) => { if (q && q.cat) set.add(q.cat); }));
    return Array.from(set).sort();
  }

  function fillCatFilter(rows) {
    const cur = el.evalCatFilter.value;
    const cats = collectCats(rows);
    el.evalCatFilter.innerHTML = '<option value="">все</option>';
    cats.forEach((c) => {
      const o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      el.evalCatFilter.appendChild(o);
    });
    if (cats.indexOf(cur) >= 0) el.evalCatFilter.value = cur;
  }

  function renderEvalQaDetail(r) {
    const wrap = document.createElement("div");
    const ul = document.createElement("ul");
    ul.className = "eval-qa-list";
    const cat = el.evalCatFilter.value;
    (r.qa || []).forEach((q) => {
      const li = document.createElement("li");
      li.className = "eval-qa-item" + (cat && q.cat !== cat ? " hidden-cat" : "");
      li.dataset.cat = q.cat || "";
      const top = document.createElement("div");
      top.className = "qa-top";
      top.innerHTML =
        '<span class="qa-cat">' +
        escapeHtml(q.cat || "—") +
        '</span><span class="' +
        (q.ok ? "qa-ok" : "qa-bad") +
        '">' +
        (q.ok ? "✓" : "✗") +
        "</span><span>#" +
        escapeHtml(String(q.id != null ? q.id : "")) +
        "</span>";
      const qq = document.createElement("div");
      qq.className = "qa-q";
      qq.textContent = q.q || "";
      const out = document.createElement("div");
      out.className = "qa-out";
      out.textContent = q.out || "";
      li.appendChild(top);
      li.appendChild(qq);
      li.appendChild(out);
      ul.appendChild(li);
    });
    wrap.appendChild(ul);
    return wrap;
  }

  function renderEvalTable(rows) {
    const tb = el.evalTable.querySelector("tbody");
    tb.innerHTML = "";
    const bi = bestBpcIndex(rows);
    rows.forEach((r, i) => {
      const tr = document.createElement("tr");
      if (i === bi) tr.className = "best-bpc";
      const key = r.ckpt || String(i);
      const expand = document.createElement("button");
      expand.type = "button";
      expand.className = "expand-btn";
      expand.textContent = state.evalExpanded[key] ? "▾" : "▸";
      expand.title = "QA детали";
      expand.addEventListener("click", () => {
        state.evalExpanded[key] = !state.evalExpanded[key];
        renderEvalTable(rows);
      });
      const td0 = document.createElement("td");
      td0.appendChild(expand);
      const cells = [
        { t: ckptLabel(r.ckpt), title: r.ckpt || "" },
        { t: r.step != null ? String(r.step) : "—" },
        { t: r.bpc != null ? Number(r.bpc).toFixed(4) : "—", cls: "bpc-cell" },
        { t: r.val_ppl != null ? Number(r.val_ppl).toFixed(2) : "—", cls: "ppl-tip", title: "не сравнима между разными токенизаторами" },
        { t: (r.qa_score != null ? r.qa_score : "—") + "/" + (r.qa_total != null ? r.qa_total : "—") },
        { t: r.params_M != null ? Number(r.params_M).toFixed(2) + "M" : "—" },
      ];
      tr.appendChild(td0);
      cells.forEach((c) => {
        const td = document.createElement("td");
        if (c.cls) td.className = c.cls;
        if (c.title) td.title = c.title;
        td.textContent = c.t;
        tr.appendChild(td);
      });
      tb.appendChild(tr);
      if (state.evalExpanded[key]) {
        const det = document.createElement("tr");
        det.className = "eval-detail";
        const td = document.createElement("td");
        td.colSpan = 7;
        td.appendChild(renderEvalQaDetail(r));
        det.appendChild(td);
        tb.appendChild(det);
      }
    });
  }

  function applyEvalCatFilter() {
    const cat = el.evalCatFilter.value;
    document.querySelectorAll(".eval-qa-item").forEach((n) => {
      n.classList.toggle("hidden-cat", !!(cat && n.dataset.cat !== cat));
    });
  }

  async function loadEval() {
    if (el.evalEmpty) { el.evalEmpty.hidden = false; el.evalEmpty.className = "eval-empty panel-state loading"; el.evalEmpty.textContent = "загрузка…"; }
    try {
      const res = await fetch(url(API.eval) + (url(API.eval).indexOf("?") >= 0 ? "&" : "?") + "latest_only=true", { cache: "no-store" });
      if (res.status === 404) throw new Error("404");
      if (!res.ok) throw new Error("eval " + res.status);
      let data = await res.json();
      if (!Array.isArray(data)) {
        if (data && Array.isArray(data.results)) data = data.results;
        else if (data && typeof data === "object") data = [data];
        else data = [];
      }
      const rows = dedupeEvalRows(data);
      state.evalRows = rows;
      if (!rows.length) {
        el.evalEmpty.hidden = false;
        el.evalEmpty.className = "eval-empty panel-state empty";
        el.evalEmpty.textContent = "нет данных";
        el.evalBody.hidden = true;
        return;
      }
      el.evalEmpty.hidden = true;
      el.evalBody.hidden = false;
      fillCatFilter(rows);
      renderEvalBars(rows);
      renderEvalTable(rows);
      if (typeof fillEvalDiffSelects === "function") fillEvalDiffSelects(rows);
    } catch (_) {
      el.evalEmpty.hidden = false;
      el.evalEmpty.className = "eval-empty panel-state error";
      el.evalEmpty.textContent = "ошибка загрузки";
      el.evalBody.hidden = true;
    }
  }

  async function setEvalOpen(open) {
    return setEvalOpenImpl(open);
  }

  function setEvalOpenImpl(open) {
    el.evalPanel.hidden = !open;
    if (open) {
      closeOtherPanels("eval");
      el.evalPanel.hidden = false;
      loadEval();
    }
  }

  function fillEvalDiffSelects(rows) {
    if (!el.evalDiffA || !el.evalDiffB) return;
    const fill = (sel, preferIdx) => {
      sel.innerHTML = "";
      rows.forEach((r, i) => {
        const o = document.createElement("option");
        o.value = String(i);
        o.textContent = ckptLabel(r.ckpt) + " · bpc " + (r.bpc != null ? Number(r.bpc).toFixed(3) : "—");
        sel.appendChild(o);
      });
      if (rows.length) sel.value = String(Math.min(preferIdx, rows.length - 1));
    };
    fill(el.evalDiffA, 0);
    fill(el.evalDiffB, Math.min(1, Math.max(0, rows.length - 1)));
  }

  function qaCatBreakdown(r) {
    const map = Object.create(null);
    (r.qa || []).forEach((q) => {
      const cat = q.cat || "—";
      if (!map[cat]) map[cat] = { ok: 0, total: 0 };
      map[cat].total += 1;
      if (q.ok) map[cat].ok += 1;
    });
    return map;
  }

  function renderQaCatPills(target, r) {
    if (!target) return;
    target.innerHTML = "";
    const map = qaCatBreakdown(r);
    Object.keys(map).sort().forEach((cat) => {
      const span = document.createElement("span");
      span.className = "eval-cat-pill mc-cat";
      span.innerHTML = escapeHtml(cat) + "<strong class=ok>" + Number(map[cat].ok) + "</strong>/" + Number(map[cat].total);
      target.appendChild(span);
    });
  }

  function renderEvalDiff() {
    if (!el.evalDiffGrid || !el.evalDiffA || !el.evalDiffB) return;
    const rows = state.evalRows || [];
    const ia = Number(el.evalDiffA.value);
    const ib = Number(el.evalDiffB.value);
    const A = rows[ia];
    const B = rows[ib];
    if (!A || !B) {
      el.evalDiffGrid.hidden = true;
      return;
    }
    el.evalDiffGrid.hidden = false;
    el.evalDiffGrid.innerHTML = "";
    const best = bestBpcIndex([A, B]);
    const meta = document.createElement("div");
    meta.className = "eval-diff-meta";
    meta.style.gridColumn = "1 / -1";
    const bpcA = A.bpc != null ? Number(A.bpc).toFixed(4) : "—";
    const bpcB = B.bpc != null ? Number(B.bpc).toFixed(4) : "—";
    const pplA = A.val_ppl != null ? Number(A.val_ppl).toFixed(2) : "—";
    const pplB = B.val_ppl != null ? Number(B.val_ppl).toFixed(2) : "—";
    meta.innerHTML =
      "bpc: <strong>" + escapeHtml(ckptLabel(A.ckpt)) + "</strong> " + escapeHtml(bpcA) +
      (best === 0 ? ' <span class="best-bpc-label">лучший</span>' : "") +
      " · <strong>" + escapeHtml(ckptLabel(B.ckpt)) + "</strong> " + escapeHtml(bpcB) +
      (best === 1 ? ' <span class="best-bpc-label">лучший</span>' : "") +
      ' · <span class="ppl-tip" title="не сравнима между разными токенизаторами">ppl ' +
      escapeHtml(pplA) + " / " + escapeHtml(pplB) + "</span>";
    el.evalDiffGrid.appendChild(meta);
    const catsWrap = document.createElement("div");
    catsWrap.className = "eval-cat-sum";
    catsWrap.style.gridColumn = "1 / -1";
    const left = document.createElement("div");
    left.innerHTML = "<strong>" + escapeHtml(ckptLabel(A.ckpt)) + "</strong>";
    const right = document.createElement("div");
    right.innerHTML = "<strong>" + escapeHtml(ckptLabel(B.ckpt)) + "</strong>";
    const pillsA = document.createElement("div");
    pillsA.className = "mc-cats";
    const pillsB = document.createElement("div");
    pillsB.className = "mc-cats";
    renderQaCatPills(pillsA, A);
    renderQaCatPills(pillsB, B);
    left.appendChild(pillsA);
    right.appendChild(pillsB);
    catsWrap.appendChild(left);
    catsWrap.appendChild(right);
    el.evalDiffGrid.appendChild(catsWrap);

    const colA = document.createElement("div");
    colA.className = "eval-diff-col" + (best === 0 ? " mc-best" : "");
    const colB = document.createElement("div");
    colB.className = "eval-diff-col" + (best === 1 ? " mc-best" : "");
    const ha = document.createElement("h4");
    ha.textContent = ckptLabel(A.ckpt) + " · bpc " + bpcA;
    const hb = document.createElement("h4");
    hb.textContent = ckptLabel(B.ckpt) + " · bpc " + bpcB;
    colA.appendChild(ha);
    colB.appendChild(hb);
    const mapB = new Map();
    (B.qa || []).forEach((q) => mapB.set(String(q.id), q));
    (A.qa || []).forEach((qa) => {
      const qb = mapB.get(String(qa.id)) || {};
      const rowA = document.createElement("div");
      rowA.className = "eval-diff-row";
      const rowB = document.createElement("div");
      rowB.className = "eval-diff-row";
      const same = String(qa.out || "") === String(qb.out || "");
      const badgesA = '<div class="qa-badges"><span class="' + (qa.ok ? "badge-ok" : "badge-fail") + '">' + (qa.ok ? "OK" : "FAIL") + '</span>' +
        '<span class="' + (same ? "badge-same" : "badge-diff") + '">' + (same ? "=" : "≠") + "</span>" +
        '<span class="qa-cat">' + escapeHtml(qa.cat || "—") + "</span></div>";
      const badgesB = '<div class="qa-badges"><span class="' + (qb.ok ? "badge-ok" : "badge-fail") + '">' + (qb.ok ? "OK" : "FAIL") + "</span>" +
        '<span class="qa-cat">' + escapeHtml(qb.cat || qa.cat || "—") + "</span></div>";
      rowA.innerHTML = badgesA + "<div><strong>#" + escapeHtml(String(qa.id)) + "</strong> " + escapeHtml(qa.q || "") + "</div><div>" + escapeHtml(qa.out || "") + "</div>";
      rowB.innerHTML = badgesB + "<div><strong>#" + escapeHtml(String(qb.id != null ? qb.id : qa.id)) + "</strong> " + escapeHtml(qb.q || qa.q || "") + "</div><div>" + escapeHtml(qb.out || "") + "</div>";
      colA.appendChild(rowA);
      colB.appendChild(rowB);
    });
    el.evalDiffGrid.appendChild(colA);
    el.evalDiffGrid.appendChild(colB);
  }

  function smoothSeries(vals, window) {
    const w = Math.max(1, Number(window) || 1);
    if (w <= 1) return vals.slice();
    const out = [];
    for (let i = 0; i < vals.length; i++) {
      let s = 0, n = 0;
      for (let j = Math.max(0, i - Math.floor(w / 2)); j <= Math.min(vals.length - 1, i + Math.floor(w / 2)); j++) {
        s += vals[j];
        n++;
      }
      out.push(s / n);
    }
    return out;
  }

  function formatEta(sec) {
    if (sec == null || !isFinite(sec) || sec < 0) return "—";
    const s = Math.round(sec);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    if (h > 0) return h + "ч " + m + "м";
    if (m > 0) return m + "м " + r + "с";
    return r + "с";
  }

  function maybeNotifyCkpt(ckpt) {
    if (ckpt && state.lastNotifiedCkpt && ckpt !== state.lastNotifiedCkpt && typeof pushNotif === "function") {
      pushNotif("checkpoint", "Checkpoint: " + ckpt);
    }
    if (!el.trainNotify || !el.trainNotify.checked) return;
    if (!ckpt || ckpt === state.lastNotifiedCkpt) return;
    state.lastNotifiedCkpt = ckpt;
    if (!("Notification" in window)) return;
    const show = () => {
      try {
        new Notification("МойGPT", { body: "Новый чекпоинт: " + ckpt });
      } catch (_) {}
    };
    if (Notification.permission === "granted") show();
    else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((p) => { if (p === "granted") show(); });
    }
  }

  const exported = { parseTs, dedupeEvalRows, bestBpcIndex, renderEvalBars, collectCats, fillCatFilter, renderEvalQaDetail, renderEvalTable, applyEvalCatFilter, loadEval, setEvalOpen, setEvalOpenImpl, fillEvalDiffSelects, qaCatBreakdown, renderQaCatPills, renderEvalDiff, smoothSeries, formatEta, maybeNotifyCkpt };
  Object.assign(api, exported);
  return exported;
}
