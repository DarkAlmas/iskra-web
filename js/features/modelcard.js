/* МойGPT feature: modelcard (ES module). */

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
    refreshDashboard, setDashOpen, setDashOpenImpl, runTokenize, runNextProbs, setLabOpen, updateConfToggleState, trapFocus,
    releaseFocusTrap, renderEloTable, setEloOpen, setArenaOpen, setArenaOpenImpl, runArena, stopArena, voteArena,
    openExplain, explainStep, renderExplainBars, pickExplainCand, explainNextTop, explainAutoToggle, explainReset, modelGroup,
    fillModelSelectGrouped, pickDistinctModels, applyArenaPair, compareSftInArena, ensureArenaDistinct, startTour, endTour, renderTour,
    openWorkspace, exportWorkspace, importWorkspaceFile, openPrompts, renderPromptsList, hideSlashPopup, showSlashPopup, applySlashPrompt,
    onInputSlash, createFolder, cmdActions, renderCmdList, openCmdPalette, openMsgSearch, highlightMsgSnippet, runMsgSearch,
    renderSftList, exportSftJsonl, uniqueSourcesFromHits, renderDatasetChips, renderDatasetList, openDatasetDoc, runDatasetSearch, addCurrentDocToSft,
    setDatasetOpen, setDatasetOpenImpl, buildStandaloneHtml, shareChatHtml, shareChatPng, roundRect, wrapText, exportHtml,
    openThemeBuilder, appendToolCard, runChatTool, evoModels, loadEvoBpcMap, runEvolution, stopEvolution, setChatStatsOpen,
    gatherChatStats, drawDayChart, drawModelPie, renderChatStats, setPlaygroundOpen, setPlaygroundOpenImpl, pgStopSeqs, renderPgTabs,
    paintPgActive, runPlaygroundViaNext, runPlayground, stopPlayground, renderNotifList, openNotifs, clearNotifs, pollNotifEvents,
    runSandboxedJs, runPerfCheck, sendFeedback, syncLocalFeedback, setupVoice, updateAttachWarn, renderAttachChips, readTextFile,
    addAttachFiles, postCorpusAdd, submitTeach, syncLocalCorpusOnce, setupAttachDnD, syncPersonaSelect, onPersonaChange, addPersona,
    setEvoOpen, renderBpcChart, regenerateAnswer, regenerateFromEditedUser
  } = api;


  let similarWorker = null;
  let tokenBudgetTimer = null;
  function ensureSimilarWorker() {
    if (similarWorker) return similarWorker;
    try {
      similarWorker = new Worker("./tfidf-worker.js");
      similarWorker.onmessage = (e) => {
        if (!e.data || e.data.type !== "similar") return;
        renderSimilarList(e.data.items || []);
      };
      similarWorker.onerror = () => {};
    } catch (err) {
      similarWorker = null;
    }
    return similarWorker;
  }

  function requestSimilarChats() {
    const w = ensureSimilarWorker();
    const chat = activeChat();
    if (!w || !chat) {
      renderSimilarList([]);
      return;
    }
    const payload = (state.chats || []).map((c) => ({
      id: c.id,
      title: c.title,
      messages: (c.messages || []).slice(-20).map((m) => ({ role: m.role, content: (m.content || "").slice(0, 600) })),
    }));
    w.postMessage({ type: "similar", activeId: chat.id, chats: payload });
  }

  function renderSimilarList(items) {
    if (!el.similarList) return;
    el.similarList.innerHTML = "";
    if (el.similarEmpty) el.similarEmpty.hidden = !!(items && items.length);
    (items || []).forEach((it) => {
      const li = document.createElement("li");
      li.innerHTML = "<span>" + escapeHtml(it.title || "чат") + '</span><span class="sim-score">' + Number(it.score || 0).toFixed(2) + "</span>";
      li.addEventListener("click", () => {
        state.activeId = it.id;
        saveStore();
        renderAll();
        requestSimilarChats();
        updateTokenBudget();
      });
      el.similarList.appendChild(li);
    });
  }

  async function updateTokenBudget() {
    if (!el.tokenBudgetLabel) return;
    const chat = activeChat();
    const draft = (el.input && el.input.value) || "";
    const hist = ((chat && chat.messages) || []).map((m) => m.content || "").join("\n");
    const text = (hist + "\n" + draft).slice(-12000);
    const estimate = Math.max(1, Math.round(text.length / 3.2));
    let n = estimate;
    try {
      const res = await fetch(url(API.tokenize), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(-4000), model: (el.modelSelect && el.modelSelect.value) || "mygpt-latest" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.tokens)) n = Number(data.tokens.length) || estimate;
      }
    } catch (e) {}
    const max = CTX_WINDOW;
    const pct = Math.min(100, Math.round((n / max) * 100));
    el.tokenBudgetLabel.textContent = "токены: " + Number(n) + " / " + Number(max);
    if (el.tokenBudgetFill) el.tokenBudgetFill.style.width = pct + "%";
    if (el.tokenBudgetBar) el.tokenBudgetBar.setAttribute("aria-valuenow", String(pct));
    el.tokenBudget.classList.toggle("warn", pct >= 70 && pct < 90);
    el.tokenBudget.classList.toggle("danger", pct >= 90);
    if (el.tokenBudgetWarn) el.tokenBudgetWarn.hidden = pct < 70;
  }

  function scheduleTokenBudget() {
    clearTimeout(tokenBudgetTimer);
    tokenBudgetTimer = setTimeout(updateTokenBudget, 350);
  }

  function setModelCardOpen(open) {
    if (!el.modelCardPanel) return;
    if (open) closeOtherPanels("modelcard");
    el.modelCardPanel.hidden = !open;
    if (open) refreshModelCard();
  }

  function fillModelCardSelect() {
    if (!el.modelCardSelect) return;
    const names = (state.models && state.models.length ? state.models : FALLBACK_MODELS).slice();
    const cur = el.modelCardSelect.value;
    el.modelCardSelect.innerHTML = "";
    names.forEach((n) => {
      const o = document.createElement("option");
      o.value = n;
      o.textContent = n;
      el.modelCardSelect.appendChild(o);
    });
    if (cur && names.indexOf(cur) >= 0) el.modelCardSelect.value = cur;
    else if (el.modelSelect && names.indexOf(el.modelSelect.value) >= 0) el.modelCardSelect.value = el.modelSelect.value;
  }

  function matchEvalRow(modelId, rows) {
    const id = String(modelId || "");
    const short = id.replace(/^mygpt-/, "").replace(/\.pt$/, "");
    let best = null;
    (rows || []).forEach((r) => {
      const ck = String(r.ckpt || "");
      if (ck.indexOf(short) >= 0 || ck.indexOf(id) >= 0 || (short === "latest" && ck.indexOf("v1") >= 0)) best = r;
    });
    if (!best && rows && rows.length) {
      // latest → best bpc
      const bi = bestBpcIndex(rows);
      if (short === "latest" || id === "mygpt-latest") best = rows[bi];
    }
    return best;
  }

  async function refreshModelCard() {
    fillModelCardSelect();
    const mid = (el.modelCardSelect && el.modelCardSelect.value) || "mygpt-latest";
    let rows = state.evalRows || [];
    if (!rows.length) {
      try {
        await loadEval();
        rows = state.evalRows || [];
      } catch (e) {}
    }
    const r = matchEvalRow(mid, rows);
    if (el.mcParams) {
      el.mcParams.innerHTML =
        "<div>id <strong>" + escapeHtml(mid) + "</strong></div>" +
        "<div>step <strong>" + (r && r.step != null ? Number(r.step) : "—") + "</strong></div>" +
        "<div>params <strong>" + (r && r.params_M != null ? Number(r.params_M).toFixed(2) + "M" : "—") + "</strong></div>" +
        "<div>ckpt <strong title=\"" + escapeHtml((r && r.ckpt) || "") + "\">" + escapeHtml(r ? ckptLabel(r.ckpt) : "—") + "</strong></div>";
    }
    if (el.mcMetrics) {
      const bi = rows.length ? bestBpcIndex(rows) : -1;
      const isBest = r && rows[bi] === r;
      el.mcMetrics.innerHTML =
        "<div>bpc <strong" + (isBest ? ' class="best-bpc-label"' : "") + ">" + (r && r.bpc != null ? Number(r.bpc).toFixed(4) : "—") + (isBest ? " · лучший" : "") + "</strong></div>" +
        '<div><span class="ppl-tip" title="не сравнима между разными токенизаторами">val_ppl</span> <strong>' + (r && r.val_ppl != null ? Number(r.val_ppl).toFixed(2) : "—") + "</strong></div>" +
        "<div>QA <strong>" + (r && r.qa_score != null ? Number(r.qa_score) : "—") + "/" + (r && r.qa_total != null ? Number(r.qa_total) : "—") + "</strong></div>";
      renderQaCatPills(el.mcCats, r || { qa: [] });
    }
    try {
      const res = await fetch(url(API.corpusStats), { cache: "no-store" });
      if (res.ok) {
        const st = await res.json();
        const docs = st.clean && st.clean["corpus.jsonl"] && st.clean["corpus.jsonl"].docs != null ? Number(st.clean["corpus.jsonl"].docs) : (st.build && st.build.kept != null ? Number(st.build.kept) : null);
        const chunks = st.rag_chunks != null ? Number(st.rag_chunks) : null;
        const chars = st.build && st.build.chars != null ? Number(st.build.chars) : null;
        if (el.mcCorpus) {
          el.mcCorpus.innerHTML =
            "<div>docs <strong>" + (docs != null ? Number(docs) : "—") + "</strong></div>" +
            "<div>rag chunks <strong>" + (chunks != null ? Number(chunks) : "—") + "</strong></div>" +
            "<div>chars <strong>" + (chars != null ? Number(chars) : "—") + "</strong></div>" +
            "<div>user_add <strong>" + (st.user_add != null ? Number(st.user_add) : "—") + "</strong></div>";
        }
      }
    } catch (e) {
      if (el.mcCorpus) el.mcCorpus.textContent = "нет /api/corpus/stats";
    }
    // samples from stats
    try {
      const res = await fetch(url(API.stats), { cache: "no-store" });
      if (res.ok) {
        const st = await res.json();
        const samples = st.samples || (st.train && st.train.samples) || [];
        if (el.mcSamples) {
          el.mcSamples.textContent = samples.length
            ? samples.slice(-5).map((x) => "step " + (x.step != null ? x.step : "?") + ": " + String(x.text || x.prompt || "").slice(0, 160)).join("\n\n")
            : "нет samples";
        }
      }
    } catch (e) {
      if (el.mcSamples) el.mcSamples.textContent = "—";
    }
  }

  const exported = { ensureSimilarWorker, requestSimilarChats, renderSimilarList, updateTokenBudget, scheduleTokenBudget, setModelCardOpen, fillModelCardSelect, matchEvalRow, refreshModelCard };
  Object.assign(api, exported);
  return exported;
}
