/* МойGPT feature: arena (ES module). */

export function install(api) {
  "use strict";
  const {
    state, el, API, url, uid, escapeHtml, isSafeHttpUrl, safeHref,
    makeExternalLink, renderMarkdown, renderInlineMd, renderTextBlock, highlightCode, renderCodeBlock, hostLabel, filterSources,
    scoreTip, sourceLabel, sourceHref, renderSources, renderAnswerMeta, estimateTokens, t, saveStore,
    saveStoreNow, loadStore, renderSidebar, renderAll, fillModelSelect, closeOtherPanels, openOverlay, closeOverlay,
    closeAllOverlays, consumeStream, fetchChatStream, buildMessagesPayload, setStreamingUI, ensureChat, activeChat, addNode,
    syncMessagesFromLeaf, pathToLeaf, deepestLeafUnder, siblingsOf, saveElo, loadElo, ensureElo, applyEloVote,
    eloExpected, safeCalc, parseSseBuffer, parseSseLine, matchChatTool, ckptLabel, heatColor, renderConfHtml,
    attachFeedback, loadLocalFeedback, saveLocalFeedback, loadPrompts, savePrompts, loadSft, saveSft, loadNotifs,
    saveNotifs, pushNotif, renderNotifBadge, loadAccent, applyAccent, updateThemeContrast, hexToRgb, relLuminance,
    contrastRatio, applyTheme, toggleTheme, newChat, stop, exportMarkdown, autoResize, checkHealth,
    setHealth, loadModels, maybeAnnounceSft, showAppToast, pickDistinctModelsPure, findSftModelsPure, fetchFirstOk, showError,
    isMobile, registerPwa, openSidebar, setupMobileGestures, resetGenToServer, syncGenSettingsUI, persistGenFromUI, syncSystemField,
    makeBtn, createBotColumn, finalizeBotColumn, runOneStream, liveUpdate, bindCodeCopy, chatGen, emptyTreeChat,
    nid, effectiveSystem, sortedChats, makeChatItem, clearMessagesDom, appendUserBubble, switchBranch, renderMessages,
    editUserNode, findAssistantChild, showAnswerDiff, FALLBACK_MODELS, CTX_WINDOW, TOUR_KEY, STORE_KEY, THEME_KEY,
    MAX_RENDER_MSGS, DEFAULT_GEN, DONUT_COLORS, MAX_ATTACH_BYTES, MAX_ATTACH_CHARS, MAX_TEACH_BYTES, MIN_TEACH_CHARS, CORPUS_LOCAL_KEY,
    CORPUS_GROWTH_KEY, PROMPTS_KEY, FOLDERS_KEY, ELO_KEY, FEEDBACK_KEY, PERSONA_KEY, SFT_KEY, LANG_KEY,
    GEN_CLAMP, I18N, ACCENT_KEY, NOTIF_KEY, OFFLINE_Q_KEY, WS_SCHEMA, TOK_COLORS, DEFAULT_PERSONAS,
    ensureFeat, lazyBindTab, registerTabFn, tabFn, drawLossChart, normalizeTrain, pollTrain, setTrainOpen,
    resumeTrain, renderTrainSamples, parseTs, dedupeEvalRows, bestBpcIndex, renderEvalBars, collectCats, fillCatFilter,
    renderEvalQaDetail, renderEvalTable, applyEvalCatFilter, loadEval, setEvalOpen, setEvalOpenImpl, fillEvalDiffSelects, qaCatBreakdown,
    renderQaCatPills, renderEvalDiff, smoothSeries, formatEta, maybeNotifyCkpt, highlightSnippet, runCorpusSearch, setCorpusOpen,
    corpusSourceLabel, corpusSourcesFromStats, recordCorpusGrowth, drawDonut, drawGrowth, formatChars, loadDashCorpusExtra, fmtNum,
    refreshDashboard, setDashOpen, setDashOpenImpl, runTokenize, runNextProbs, setLabOpen, updateConfToggleState, startTour,
    endTour, renderTour, openWorkspace, exportWorkspace, importWorkspaceFile, openPrompts, renderPromptsList, hideSlashPopup,
    showSlashPopup, applySlashPrompt, onInputSlash, createFolder, cmdActions, renderCmdList, openCmdPalette, openMsgSearch,
    highlightMsgSnippet, runMsgSearch, renderSftList, exportSftJsonl, uniqueSourcesFromHits, renderDatasetChips, renderDatasetList, openDatasetDoc,
    runDatasetSearch, addCurrentDocToSft, setDatasetOpen, setDatasetOpenImpl, buildStandaloneHtml, shareChatHtml, shareChatPng, roundRect,
    wrapText, exportHtml, openThemeBuilder, ensureSimilarWorker, requestSimilarChats, renderSimilarList, updateTokenBudget, scheduleTokenBudget,
    setModelCardOpen, fillModelCardSelect, matchEvalRow, refreshModelCard, appendToolCard, runChatTool, evoModels, loadEvoBpcMap,
    runEvolution, stopEvolution, setChatStatsOpen, gatherChatStats, drawDayChart, drawModelPie, renderChatStats, setPlaygroundOpen,
    setPlaygroundOpenImpl, pgStopSeqs, renderPgTabs, paintPgActive, runPlaygroundViaNext, runPlayground, stopPlayground, renderNotifList,
    openNotifs, clearNotifs, pollNotifEvents, runSandboxedJs, runPerfCheck, sendFeedback, syncLocalFeedback, setupVoice,
    updateAttachWarn, renderAttachChips, readTextFile, addAttachFiles, postCorpusAdd, submitTeach, syncLocalCorpusOnce, setupAttachDnD,
    syncPersonaSelect, onPersonaChange, addPersona, setEvoOpen, renderBpcChart, regenerateAnswer, regenerateFromEditedUser
  } = api;


  let explainTimer = null;
  function trapFocus(dialog) {
    releaseFocusTrap();
    if (!dialog) return;
    const sel = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';
    const handler = (e) => {
      if (e.key !== "Tab") return;
      const nodes = Array.from(dialog.querySelectorAll(sel)).filter((n) => n.offsetParent !== null || n === document.activeElement);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", handler);
    state.focusTrap = { dialog: dialog, handler: handler };
    const first = dialog.querySelector(sel);
    if (first) setTimeout(() => first.focus(), 0);
  }

  function releaseFocusTrap() {
    if (state.focusTrap && state.focusTrap.dialog && state.focusTrap.handler) {
      try { state.focusTrap.dialog.removeEventListener("keydown", state.focusTrap.handler); } catch (_) {}
    }
    state.focusTrap = null;
  }

  function renderEloTable() {
    if (!el.eloTable) return;
    const tbody = el.eloTable.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const rows = Object.keys(state.elo || {}).map((k) => Object.assign({ model: k }, state.elo[k]));
    rows.sort((x, y) => (y.rating || 0) - (x.rating || 0));
    if (el.eloEmpty) el.eloEmpty.hidden = rows.length > 0;
    rows.forEach((r, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + Number(i + 1) + "</td>" +
        "<td>" + escapeHtml(r.model) + "</td>" +
        "<td>" + Number(r.rating || 0) + "</td>" +
        "<td>" + Number(r.w || 0) + "</td>" +
        "<td>" + Number(r.l || 0) + "</td>" +
        "<td>" + Number(r.t || 0) + "</td>" +
        "<td>" + Number(r.games || 0) + "</td>";
      tbody.appendChild(tr);
    });
  }

  function setEloOpen(open) {
    if (!el.eloPanel) return;
    el.eloPanel.hidden = !open;
    if (open) {
      closeOtherPanels("elo");
      renderEloTable();
    }
  }

  async function setArenaOpen(open) {
    return setArenaOpenImpl(open);
  }

  function setArenaOpenImpl(open) {
    if (!el.arenaPanel) return;
    el.arenaPanel.hidden = !open;
    if (open) {
      closeOtherPanels("arena");
      if (el.arenaMode) el.arenaMode.checked = true;
      if (el.compareModels) el.compareModels.hidden = false;
      try { applyArenaPair(state.models || []); } catch (_) {}
    }
  }

  async function runArena() {
    const prompt = ((el.arenaPrompt && el.arenaPrompt.value) || "").trim();
    if (!prompt || state.arena.running) return;
    const modelA = (el.arenaModelA && el.arenaModelA.value) || (el.modelSelectA && el.modelSelectA.value) || "mygpt-latest";
    const modelB = (el.arenaModelB && el.arenaModelB.value) || (el.modelSelectB && el.modelSelectB.value) || "rag-only";
    state.arena = { running: true, abortA: new AbortController(), abortB: new AbortController(), prompt: prompt, modelA: modelA, modelB: modelB, textA: "", textB: "", voted: false };
    if (el.arenaLabelA) el.arenaLabelA.textContent = modelA;
    if (el.arenaLabelB) el.arenaLabelB.textContent = modelB;
    if (el.arenaBubbleA) el.arenaBubbleA.innerHTML = "";
    if (el.arenaBubbleB) el.arenaBubbleB.innerHTML = "";
    if (el.arenaColA) el.arenaColA.classList.remove("winner");
    if (el.arenaColB) el.arenaColB.classList.remove("winner");
    if (el.arenaVote) el.arenaVote.hidden = true;
    if (el.arenaVoteStatus) el.arenaVoteStatus.textContent = "";
    if (el.btnArenaRun) el.btnArenaRun.disabled = true;
    if (el.btnArenaStop) el.btnArenaStop.hidden = false;

    const messages = buildMessagesPayload([{ role: "user", content: prompt }], "");
    const paint = (side, text) => {
      const bubble = side === "A" ? el.arenaBubbleA : el.arenaBubbleB;
      if (!bubble) return;
      bubble.innerHTML = renderMarkdown(text || "");
      bindCodeCopy(bubble);
    };
    const streamSide = async (side, model, ac) => {
      let text = "";
      try {
        const res = await fetchChatStream(model, messages, ac.signal, null);
        text = await consumeStream(
          res,
          (full) => { text = full; paint(side, text); },
          () => {},
          null
        );
      } catch (err) {
        if (err && err.name === "AbortError") {
          /* stop */
        } else {
          text = text || ("ошибка: " + (err && err.message ? err.message : "stream"));
          paint(side, text);
        }
      }
      if (side === "A") state.arena.textA = text;
      else state.arena.textB = text;
      paint(side, text);
      return text;
    };

    await Promise.all([
      streamSide("A", modelA, state.arena.abortA),
      streamSide("B", modelB, state.arena.abortB),
    ]);
    state.arena.running = false;
    if (el.btnArenaRun) el.btnArenaRun.disabled = false;
    if (el.btnArenaStop) el.btnArenaStop.hidden = true;
    if (el.arenaVote) el.arenaVote.hidden = false;
  }

  function stopArena() {
    if (state.arena.abortA) state.arena.abortA.abort();
    if (state.arena.abortB) state.arena.abortB.abort();
    state.arena.running = false;
    if (el.btnArenaRun) el.btnArenaRun.disabled = false;
    if (el.btnArenaStop) el.btnArenaStop.hidden = true;
  }

  async function voteArena(vote) {
    if (state.arena.voted) return;
    state.arena.voted = true;
    const modelA = state.arena.modelA;
    const modelB = state.arena.modelB;
    if (vote === "A" && el.arenaColA) el.arenaColA.classList.add("winner");
    if (vote === "B" && el.arenaColB) el.arenaColB.classList.add("winner");
    applyEloVote(modelA, modelB, vote);
    const payload = {
      type: "arena",
      vote: vote,
      model_a: modelA,
      model_b: modelB,
      prompt: state.arena.prompt,
      answer_a: state.arena.textA,
      answer_b: state.arena.textB,
      chat_id: state.activeId || "",
      ts: Date.now(),
    };
    try {
      const res = await fetch(url(API.feedback), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 404 || res.status === 405) throw new Error("missing");
      if (!res.ok) throw new Error("fb");
      if (el.arenaVoteStatus) el.arenaVoteStatus.textContent = "голос сохранён";
    } catch (_) {
      saveLocalFeedback(payload);
      if (el.arenaVoteStatus) el.arenaVoteStatus.textContent = "голос сохранён локально";
    }
  }

  async function openExplain(prompt, answer, model) {
    closeAllOverlays();
    state.explain = { prompt: prompt || "", built: "", model: model || el.modelSelect.value || "", step: 0, timer: null, lastCands: [], answer: answer || "" };
    if (el.explainPrompt) el.explainPrompt.textContent = "Промпт: " + (prompt || "(пусто)");
    if (el.explainBuilt) el.explainBuilt.textContent = "";
    if (el.explainBars) el.explainBars.innerHTML = "";
    if (el.explainStepMeta) el.explainStepMeta.textContent = "Шаг 0 · модель " + (model || "");
    openOverlay(el.explainOverlay);
    await explainStep();
  }

  async function explainStep() {
    const ex = state.explain;
    const fullPrompt = (ex.prompt || "") + (ex.built || "");
    if (el.explainStepMeta) el.explainStepMeta.textContent = "Шаг " + Number(ex.step) + " · запрос /api/next…";
    try {
      const res = await fetch(url(API.next), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fullPrompt || "МойGPT:",
          model: ex.model || "",
          top_k: 8,
          temperature: chatGen(activeChat()).temperature,
        }),
      });
      if (!res.ok) throw new Error("next " + res.status);
      const data = await res.json();
      const cands = data.candidates || [];
      ex.lastCands = cands;
      renderExplainBars(cands);
      if (el.explainStepMeta) {
        el.explainStepMeta.textContent = "Шаг " + Number(ex.step) + " · " + Number(cands.length) + " кандидатов";
      }
    } catch (_) {
      if (el.explainBars) el.explainBars.textContent = "нет данных (/api/next)";
      if (el.explainStepMeta) el.explainStepMeta.textContent = "ошибка шага";
    }
  }

  function renderExplainBars(cands) {
    if (!el.explainBars) return;
    el.explainBars.innerHTML = "";
    const maxP = Math.max.apply(null, (cands || []).map((c) => Number(c.p) || 0).concat([0.0001]));
    (cands || []).forEach((c, idx) => {
      const row = document.createElement("div");
      row.className = "lab-bar-row";
      row.tabIndex = 0;
      row.title = "выбрать «" + (c.text || "") + "»";
      const track = document.createElement("div");
      track.className = "lab-bar-track";
      const fill = document.createElement("div");
      fill.className = "lab-bar-fill";
      fill.style.width = Math.max(2, ((Number(c.p) || 0) / maxP) * 100) + "%";
      const label = document.createElement("div");
      label.textContent = JSON.stringify(c.text);
      track.appendChild(fill);
      const left = document.createElement("div");
      left.appendChild(label);
      left.appendChild(track);
      const pv = document.createElement("div");
      pv.className = "lab-bar-p";
      pv.textContent = ((Number(c.p) || 0) * 100).toFixed(1) + "%";
      row.appendChild(left);
      row.appendChild(pv);
      const pick = () => pickExplainCand(c);
      row.addEventListener("click", pick);
      row.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
      if (idx === 0) row.classList.add("explain-cand-pick");
      el.explainBars.appendChild(row);
    });
  }

  async function pickExplainCand(c) {
    state.explain.built += c.text || "";
    state.explain.step += 1;
    if (el.explainBuilt) el.explainBuilt.textContent = state.explain.built;
    await explainStep();
  }

  async function explainNextTop() {
    const cands = state.explain.lastCands || [];
    if (!cands.length) {
      await explainStep();
      return;
    }
    // pick highest p
    let best = cands[0];
    cands.forEach((c) => { if ((Number(c.p) || 0) > (Number(best.p) || 0)) best = c; });
    await pickExplainCand(best);
  }

  function explainAutoToggle() {
    if (state.explain.timer) {
      clearInterval(state.explain.timer);
      state.explain.timer = null;
      if (el.btnExplainAuto) el.btnExplainAuto.textContent = "Авто ▶";
      return;
    }
    if (el.btnExplainAuto) el.btnExplainAuto.textContent = "Стоп ◼";
    state.explain.timer = setInterval(() => {
      if (state.explain.step >= 40) {
        explainAutoToggle();
        return;
      }
      explainNextTop();
    }, 700);
  }

  function explainReset() {
    if (state.explain.timer) {
      clearInterval(state.explain.timer);
      state.explain.timer = null;
      if (el.btnExplainAuto) el.btnExplainAuto.textContent = "Авто ▶";
    }
    state.explain.built = "";
    state.explain.step = 0;
    state.explain.lastCands = [];
    if (el.explainBuilt) el.explainBuilt.textContent = "";
    explainStep();
  }

  function modelGroup(name) {
    const n = String(name || "");
    if (n === "rag-only" || /^rag/i.test(n) || /\+rag$/i.test(n)) return "RAG";
    if (/^step_/i.test(n)) return "Шаги";
    return "Релизы";
  }

  function fillModelSelectGrouped(sel, names, preferred) {
    if (!sel) return;
    const groups = { "Релизы": [], "Шаги": [], "RAG": [] };
    (names || []).forEach((n) => {
      const g = modelGroup(n);
      if (!groups[g]) groups[g] = [];
      groups[g].push(n);
    });
    sel.innerHTML = "";
    ["Релизы", "Шаги", "RAG"].forEach((label) => {
      const arr = groups[label] || [];
      if (!arr.length) return;
      const og = document.createElement("optgroup");
      og.label = label;
      arr.forEach((n) => {
        const opt = document.createElement("option");
        opt.value = n;
        opt.textContent = n;
        og.appendChild(opt);
      });
      sel.appendChild(og);
    });
    if (preferred && names.indexOf(preferred) >= 0) sel.value = preferred;
    else if (names && names.length) sel.value = names[0];
  }

  function pickDistinctModels(names) {
    if (typeof pickDistinctModelsPure === "function") {
      const r = pickDistinctModelsPure(names);
      return { a: r.a, b: r.b, kind: r.kind };
    }
    const list = (names || []).slice();
    const sfts = list.filter((n) => /_sft$/i.test(String(n))).sort((x, y) => String(y).localeCompare(String(x)));
    for (let i = 0; i < sfts.length; i++) {
      const sft = sfts[i];
      const base = String(sft).replace(/_sft$/i, "");
      if (base && list.indexOf(base) >= 0 && base !== sft) return { a: sft, b: base, kind: "sft" };
    }
    const latest = list.indexOf("mygpt-latest") >= 0 ? "mygpt-latest" : list[0];
    let other = list.indexOf("v0") >= 0 ? "v0" : null;
    if (!other || other === latest) {
      other = null;
      for (let i = 0; i < list.length; i++) { if (list[i] !== latest) { other = list[i]; break; } }
    }
    if (!other) other = latest;
    return { a: latest, b: other, kind: "latest" };
  }

  function applyArenaPair(names) {
    const pair = pickDistinctModels(names || state.models || []);
    if (el.arenaModelA) fillModelSelectGrouped(el.arenaModelA, names || state.models || [], pair.a);
    if (el.arenaModelB) fillModelSelectGrouped(el.arenaModelB, names || state.models || [], pair.b);
    ensureArenaDistinct();
    return pair;
  }

  async function compareSftInArena(sftName) {
    const names = (state.models && state.models.length ? state.models : []).slice();
    const sft = sftName || (names.find((n) => /_sft$/i.test(n)));
    if (!sft) return;
    const base = String(sft).replace(/_sft$/i, "");
    await setArenaOpen(true);
    if (el.arenaModelA) el.arenaModelA.value = sft;
    if (el.arenaModelB && names.indexOf(base) >= 0) el.arenaModelB.value = base;
    ensureArenaDistinct();
  }

  function ensureArenaDistinct(changed) {
    if (!el.arenaModelA || !el.arenaModelB) return;
    const a = el.arenaModelA.value;
    const b = el.arenaModelB.value;
    let hint = el.arenaSameHint;
    if (!hint) {
      hint = document.createElement("div");
      hint.id = "arenaSameHint";
      hint.className = "arena-same-hint";
      hint.hidden = true;
      const wrap = el.arenaModelB.closest(".arena-models") || el.arenaModelB.parentNode;
      if (wrap) wrap.appendChild(hint);
      el.arenaSameHint = hint;
    }
    if (a && b && a === b) {
      hint.hidden = false;
      hint.textContent = t("arena.same");
      const names = [];
      Array.from(el.arenaModelA.options).forEach((o) => { if (o.value) names.push(o.value); });
      // also from optgroups
      Array.from(el.arenaModelA.querySelectorAll("option")).forEach((o) => {
        if (o.value && names.indexOf(o.value) < 0) names.push(o.value);
      });
      const alt = names.find((n) => n !== a);
      if (alt) {
        if (changed === "A") el.arenaModelB.value = alt;
        else el.arenaModelA.value = alt;
      }
    } else {
      hint.hidden = true;
    }
  }

  const exported = { trapFocus, releaseFocusTrap, renderEloTable, setEloOpen, setArenaOpen, setArenaOpenImpl, runArena, stopArena, voteArena, openExplain, explainStep, renderExplainBars, pickExplainCand, explainNextTop, explainAutoToggle, explainReset, modelGroup, fillModelSelectGrouped, pickDistinctModels, ensureArenaDistinct, applyArenaPair, compareSftInArena };
  Object.assign(api, exported);
  return exported;
}
