/* МойGPT feature: prompts (ES module). */

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
    openWorkspace, exportWorkspace, importWorkspaceFile, cmdActions, renderCmdList, openCmdPalette, openMsgSearch, highlightMsgSnippet,
    runMsgSearch, renderSftList, exportSftJsonl, uniqueSourcesFromHits, renderDatasetChips, renderDatasetList, openDatasetDoc, runDatasetSearch,
    addCurrentDocToSft, setDatasetOpen, setDatasetOpenImpl, buildStandaloneHtml, shareChatHtml, shareChatPng, roundRect, wrapText,
    exportHtml, openThemeBuilder, ensureSimilarWorker, requestSimilarChats, renderSimilarList, updateTokenBudget, scheduleTokenBudget, setModelCardOpen,
    fillModelCardSelect, matchEvalRow, refreshModelCard, appendToolCard, runChatTool, evoModels, loadEvoBpcMap, runEvolution,
    stopEvolution, setChatStatsOpen, gatherChatStats, drawDayChart, drawModelPie, renderChatStats, setPlaygroundOpen, setPlaygroundOpenImpl,
    pgStopSeqs, renderPgTabs, paintPgActive, runPlaygroundViaNext, runPlayground, stopPlayground, renderNotifList, openNotifs,
    clearNotifs, pollNotifEvents, runSandboxedJs, runPerfCheck, sendFeedback, syncLocalFeedback, setupVoice, updateAttachWarn,
    renderAttachChips, readTextFile, addAttachFiles, postCorpusAdd, submitTeach, syncLocalCorpusOnce, setupAttachDnD, syncPersonaSelect,
    onPersonaChange, addPersona, setEvoOpen, renderBpcChart, regenerateAnswer, regenerateFromEditedUser
  } = api;


  function openPrompts() {
    closeAllOverlays();
    openOverlay(el.promptsOverlay);
    renderPromptsList();
  }

  function renderPromptsList() {
    if (!el.promptsList) return;
    el.promptsList.innerHTML = "";
    (state.prompts || []).forEach((pr) => {
      const li = document.createElement("li");
      li.innerHTML =
        "<strong>" +
        escapeHtml(pr.name || "") +
        '</strong><span class="prompt-meta">' +
        escapeHtml(pr.slash || "") +
        "</span><div>" +
        escapeHtml((pr.body || "").slice(0, 120)) +
        '</div><div class="prompt-actions"></div>';
      const actions = li.querySelector(".prompt-actions");
      const use = document.createElement("button");
      use.type = "button";
      use.className = "btn btn-ghost btn-sm";
      use.textContent = "Вставить";
      use.addEventListener("click", () => {
        el.input.value = (pr.body || "") + (el.input.value || "");
        closeOverlay(el.promptsOverlay);
        el.input.focus();
        autoResize();
      });
      const del = document.createElement("button");
      del.type = "button";
      del.className = "btn btn-ghost btn-sm";
      del.textContent = "Удалить";
      del.addEventListener("click", () => {
        state.prompts = state.prompts.filter((x) => x.id !== pr.id);
        savePrompts();
        renderPromptsList();
      });
      actions.appendChild(use);
      actions.appendChild(del);
      el.promptsList.appendChild(li);
    });
  }

  function hideSlashPopup() {
    if (el.slashPopup) el.slashPopup.hidden = true;
  }

  function showSlashPopup(filter) {
    if (!el.slashPopup) return;
    const f = (filter || "").toLowerCase();
    const items = (state.prompts || []).filter((p) => {
      const s = (p.slash || "").toLowerCase();
      const n = (p.name || "").toLowerCase();
      return !f || s.indexOf("/" + f) === 0 || s.indexOf(f) >= 0 || n.indexOf(f) >= 0;
    });
    el.slashPopup.innerHTML = "";
    if (!items.length) {
      el.slashPopup.hidden = true;
      return;
    }
    state.slashIdx = 0;
    items.forEach((pr, i) => {
      const div = document.createElement("div");
      div.className = "slash-item" + (i === 0 ? " active" : "");
      div.setAttribute("role", "option");
      div.innerHTML =
        '<span class="slash-cmd">' +
        escapeHtml(pr.slash || "") +
        "</span><span>" +
        escapeHtml(pr.name || "") +
        "</span>";
      div.addEventListener("click", () => applySlashPrompt(pr));
      el.slashPopup.appendChild(div);
    });
    el.slashPopup._items = items;
    el.slashPopup.hidden = false;
  }

  function applySlashPrompt(pr) {
    const val = el.input.value || "";
    const m = val.match(/^(.*?)(\/[a-zA-Z0-9_-]*)$/);
    const prefix = m ? m[1] : "";
    el.input.value = prefix + (pr.body || "");
    hideSlashPopup();
    el.input.focus();
    autoResize();
  }

  function onInputSlash() {
    const val = el.input.value || "";
    const m = val.match(/(?:^|\s)(\/[a-zA-Z0-9_-]*)$/);
    if (m) showSlashPopup(m[1].slice(1));
    else hideSlashPopup();
  }

  function createFolder() {
    const name = prompt("Имя папки");
    if (!name || !name.trim()) return;
    state.folders.push({ id: "f_" + Math.random().toString(36).slice(2, 9), name: name.trim() });
    saveFolders();
    saveStore();
    renderSidebar();
  }

  const exported = { openPrompts, renderPromptsList, hideSlashPopup, showSlashPopup, applySlashPrompt, onInputSlash, createFolder };
  Object.assign(api, exported);
  return exported;
}
