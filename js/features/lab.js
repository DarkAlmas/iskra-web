/* МойGPT feature: lab (ES module). */

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
    refreshDashboard, setDashOpen, setDashOpenImpl, trapFocus, releaseFocusTrap, renderEloTable, setEloOpen, setArenaOpen,
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


  async function runTokenize() {
    const text = (el.labTokText.value || "").trim();
    if (!text) return;
    el.labTokPills.innerHTML = "";
    el.labTokMeta.textContent = "…";
    try {
      const res = await fetch(url(API.tokenize), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text, model: el.modelSelect.value || "" }),
      });
      if (!res.ok) throw new Error("tok " + res.status);
      const data = await res.json();
      const tokens = data.tokens || [];
      tokens.forEach((tok, i) => {
        const span = document.createElement("span");
        span.className = "tok-pill";
        span.style.background = TOK_COLORS[i % TOK_COLORS.length];
        span.textContent = tok.text;
        span.title = "id=" + tok.id;
        el.labTokPills.appendChild(span);
      });
      const n = tokens.length || 1;
      const cpt = (text.length / n).toFixed(2);
      el.labTokMeta.textContent = n + " токенов · " + cpt + " симв/токен";
    } catch (_) {
      el.labTokMeta.textContent = "нет данных (/api/tokenize)";
    }
  }

  async function runNextProbs() {
    const prompt = el.labNextPrompt.value || "";
    el.labNextBars.innerHTML = "";
    try {
      const res = await fetch(url(API.next), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          model: el.modelSelect.value || "",
          top_k: 10,
          temperature: Number(el.tempSlider.value),
        }),
      });
      if (!res.ok) throw new Error("next " + res.status);
      const data = await res.json();
      const cands = data.candidates || [];
      const maxP = Math.max.apply(null, cands.map((c) => Number(c.p) || 0).concat([0.0001]));
      cands.forEach((c) => {
        const row = document.createElement("div");
        row.className = "lab-bar-row";
        row.title = "id=" + (c.id != null ? c.id : "?") + " · Добавить «" + (c.text || "") + "» и пересчитать";
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
        row.addEventListener("click", () => {
          el.labNextPrompt.value = prompt + (c.text || "");
          runNextProbs();
        });
        el.labNextBars.appendChild(row);
      });
      if (!cands.length) el.labNextBars.textContent = "пусто";
    } catch (_) {
      el.labNextBars.textContent = "нет данных (/api/next)";
    }
  }

  function setLabOpen(open) {
    el.labPanel.hidden = !open;
    if (open) {
      closeOtherPanels("lab");
      if (!el.labTokText.value) el.labTokText.value = "Привет, МойGPT!";
      if (!el.labNextPrompt.value) el.labNextPrompt.value = "МойGPT:";
      updateConfToggleState();
    }
  }

  function updateConfToggleState() {
    if (!el.confToggle) return;
    if (!state.sseHasP) {
      el.confToggle.disabled = true;
      el.confToggle.parentElement.title = "Сервер не шлёт p в SSE — подсветка недоступна";
      el.confToggle.checked = false;
      state.confHighlight = false;
    } else {
      el.confToggle.disabled = false;
      el.confToggle.parentElement.title = "Подсветка уверенности по полю p в SSE";
    }
  }

  const exported = { runTokenize, runNextProbs, setLabOpen, updateConfToggleState };
  Object.assign(api, exported);
  return exported;
}
