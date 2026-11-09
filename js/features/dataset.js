/* МойGPT feature: dataset (ES module). */

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
    buildStandaloneHtml, shareChatHtml, shareChatPng, roundRect, wrapText, exportHtml, openThemeBuilder, ensureSimilarWorker,
    requestSimilarChats, renderSimilarList, updateTokenBudget, scheduleTokenBudget, setModelCardOpen, fillModelCardSelect, matchEvalRow, refreshModelCard,
    appendToolCard, runChatTool, evoModels, loadEvoBpcMap, runEvolution, stopEvolution, setChatStatsOpen, gatherChatStats,
    drawDayChart, drawModelPie, renderChatStats, setPlaygroundOpen, setPlaygroundOpenImpl, pgStopSeqs, renderPgTabs, paintPgActive,
    runPlaygroundViaNext, runPlayground, stopPlayground, renderNotifList, openNotifs, clearNotifs, pollNotifEvents, runSandboxedJs,
    runPerfCheck, sendFeedback, syncLocalFeedback, setupVoice, updateAttachWarn, renderAttachChips, readTextFile, addAttachFiles,
    postCorpusAdd, submitTeach, syncLocalCorpusOnce, setupAttachDnD, syncPersonaSelect, onPersonaChange, addPersona, setEvoOpen,
    renderBpcChart, regenerateAnswer, regenerateFromEditedUser
  } = api;


  function renderSftList() {
    if (!el.sftList) return;
    el.sftList.innerHTML = "";
    if (el.sftCount) el.sftCount.textContent = String(Number(state.sft.length) || 0);
    state.sft.forEach((pair, idx) => {
      const li = document.createElement("li");
      const q = document.createElement("div");
      q.className = "sft-q";
      q.textContent = "Q: " + ((pair.messages && pair.messages[0] && pair.messages[0].content) || "").slice(0, 160);
      const a = document.createElement("div");
      a.className = "sft-a";
      a.textContent = "A: " + ((pair.messages && pair.messages[1] && pair.messages[1].content) || "").slice(0, 160);
      const del = document.createElement("button");
      del.type = "button";
      del.className = "btn btn-ghost btn-sm";
      del.textContent = "×";
      del.addEventListener("click", () => {
        state.sft.splice(idx, 1);
        saveSft();
        renderSftList();
      });
      li.appendChild(q);
      li.appendChild(a);
      li.appendChild(del);
      el.sftList.appendChild(li);
    });
  }

  function exportSftJsonl() {
    if (!state.sft.length) return;
    const lines = state.sft.map((p) => JSON.stringify(p));
    const blob = new Blob([lines.join("\n") + "\n"], { type: "application/x-ndjson" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mygpt-sft.jsonl";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function uniqueSourcesFromHits(hits) {
    const set = new Set();
    (hits || []).forEach((h) => {
      const s = h.source || h.src || "";
      if (s) set.add(s);
    });
    return Array.from(set).sort();
  }

  function renderDatasetChips(sources) {
    if (!el.datasetChips) return;
    const all = ["*"].concat(sources || []);
    el.datasetChips.innerHTML = "";
    all.forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dataset-chip" + ((state.datasetSource || "*") === s ? " active" : "");
      btn.textContent = s === "*" ? "все" : s;
      btn.addEventListener("click", () => {
        state.datasetSource = s;
        renderDatasetChips(state.datasetSources || sources);
        renderDatasetList();
      });
      el.datasetChips.appendChild(btn);
    });
  }

  function renderDatasetList() {
    if (!el.datasetList) return;
    el.datasetList.innerHTML = "";
    const src = state.datasetSource || "*";
    const rows = (state.datasetHits || []).filter((r) => src === "*" || (r.source || r.src) === src);
    if (!rows.length) {
      if (el.datasetEmpty) {
        el.datasetEmpty.hidden = false;
        el.datasetEmpty.textContent = t("dataset.empty");
      }
      return;
    }
    rows.forEach((r, i) => {
      const li = document.createElement("li");
      li.className = "dataset-item" + (state.datasetSelected === i ? " active" : "");
      const title = document.createElement("div");
      title.className = "c-title";
      title.textContent = r.title || "(без названия)";
      const srcEl = document.createElement("div");
      srcEl.className = "c-src";
      srcEl.textContent = r.source || r.src || "";
      const snip = document.createElement("div");
      snip.className = "c-snip";
      snip.innerHTML = highlightSnippet(r.snippet || r.text || "", state.datasetQuery || "");
      li.appendChild(title);
      if (srcEl.textContent) li.appendChild(srcEl);
      li.appendChild(snip);
      li.addEventListener("click", () => openDatasetDoc(r, i));
      el.datasetList.appendChild(li);
    });
  }

  function openDatasetDoc(r, idx) {
    state.datasetSelected = idx;
    state.datasetDoc = r;
    renderDatasetList();
    if (el.datasetEmpty) el.datasetEmpty.hidden = true;
    if (el.datasetDoc) el.datasetDoc.hidden = false;
    if (el.datasetDocTitle) el.datasetDocTitle.textContent = r.title || "(без названия)";
    if (el.datasetDocMeta) {
      el.datasetDocMeta.innerHTML = "";
      const bits = [];
      const src = r.source || r.src || "";
      if (src) bits.push("<span>" + escapeHtml(src) + "</span>");
      if (r.score != null) bits.push("<span>score " + escapeHtml(String(Number(r.score))) + "</span>");
      const raw = r.url || "";
      const link = document.createElement("div");
      link.innerHTML = bits.join(" · ");
      el.datasetDocMeta.appendChild(link);
      if (raw) el.datasetDocMeta.appendChild(makeExternalLink(raw, isSafeHttpUrl(raw) ? raw : "нет ссылки", "c-link"));
    }
    if (el.datasetDocBody) el.datasetDocBody.textContent = r.snippet || r.text || "";
  }

  async function runDatasetSearch(q) {
    const query = (q || (el.datasetQuery && el.datasetQuery.value) || "").trim();
    state.datasetQuery = query;
    if (!query) {
      if (el.datasetEmpty) {
        el.datasetEmpty.hidden = false;
        el.datasetEmpty.textContent = t("dataset.empty");
      }
      if (el.datasetList) el.datasetList.innerHTML = "";
      return;
    }
    if (el.datasetEmpty) {
      el.datasetEmpty.hidden = false;
      el.datasetEmpty.textContent = "…";
    }
    try {
      const res = await fetch(url(API.search) + "?q=" + encodeURIComponent(query) + "&k=20", { cache: "no-store" });
      if (!res.ok) throw new Error("search");
      let data = await res.json();
      const rows = Array.isArray(data) ? data : data.results || data.hits || [];
      state.datasetHits = rows;
      state.datasetSources = uniqueSourcesFromHits(rows);
      state.datasetSelected = -1;
      renderDatasetChips(state.datasetSources);
      renderDatasetList();
      if (el.datasetEmpty) el.datasetEmpty.hidden = !!rows.length;
      if (el.datasetDoc) el.datasetDoc.hidden = true;
    } catch (_) {
      if (el.datasetEmpty) {
        el.datasetEmpty.hidden = false;
        el.datasetEmpty.textContent = "нет данных";
      }
    }
  }

  function addCurrentDocToSft() {
    const doc = state.datasetDoc;
    if (!doc) return;
    const title = doc.title || "doc";
    const body = (doc.snippet || doc.text || "").trim();
    if (body.length < 20) {
      if (el.sftStatus) el.sftStatus.textContent = "текст слишком короткий";
      return;
    }
    const q = "Расскажи о: " + title;
    const a = body.slice(0, 2000);
    state.sft.push({
      messages: [
        { role: "user", content: q },
        { role: "assistant", content: a },
      ],
      meta: {
        title: title,
        url: doc.url || "",
        source: doc.source || doc.src || "",
        score: doc.score != null ? Number(doc.score) : null,
        added_at: new Date().toISOString(),
      },
    });
    saveSft();
    renderSftList();
    if (el.sftStatus) el.sftStatus.textContent = "добавлено · " + Number(state.sft.length);
  }

  async function setDatasetOpen(open) {
    return setDatasetOpenImpl(open);
  }

  function setDatasetOpenImpl(open) {
    if (!el.datasetPanel) return;
    el.datasetPanel.hidden = !open;
    if (open) {
      closeOtherPanels("dataset");
      if (el.datasetQuery) el.datasetQuery.focus();
      renderSftList();
      if (!(state.datasetHits || []).length && el.datasetQuery) {
        // soft auto-search
      }
    }
  }

  const exported = { renderSftList, exportSftJsonl, uniqueSourcesFromHits, renderDatasetChips, renderDatasetList, openDatasetDoc, runDatasetSearch, addCurrentDocToSft, setDatasetOpen, setDatasetOpenImpl };
  Object.assign(api, exported);
  return exported;
}
