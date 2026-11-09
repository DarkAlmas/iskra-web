/* МойGPT feature: onboarding (ES module). */

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
    fillModelSelectGrouped, pickDistinctModels, applyArenaPair, compareSftInArena, ensureArenaDistinct, openWorkspace, exportWorkspace, importWorkspaceFile,
    openPrompts, renderPromptsList, hideSlashPopup, showSlashPopup, applySlashPrompt, onInputSlash, createFolder, cmdActions,
    renderCmdList, openCmdPalette, openMsgSearch, highlightMsgSnippet, runMsgSearch, renderSftList, exportSftJsonl, uniqueSourcesFromHits,
    renderDatasetChips, renderDatasetList, openDatasetDoc, runDatasetSearch, addCurrentDocToSft, setDatasetOpen, setDatasetOpenImpl, buildStandaloneHtml,
    shareChatHtml, shareChatPng, roundRect, wrapText, exportHtml, openThemeBuilder, ensureSimilarWorker, requestSimilarChats,
    renderSimilarList, updateTokenBudget, scheduleTokenBudget, setModelCardOpen, fillModelCardSelect, matchEvalRow, refreshModelCard, appendToolCard,
    runChatTool, evoModels, loadEvoBpcMap, runEvolution, stopEvolution, setChatStatsOpen, gatherChatStats, drawDayChart,
    drawModelPie, renderChatStats, setPlaygroundOpen, setPlaygroundOpenImpl, pgStopSeqs, renderPgTabs, paintPgActive, runPlaygroundViaNext,
    runPlayground, stopPlayground, renderNotifList, openNotifs, clearNotifs, pollNotifEvents, runSandboxedJs, runPerfCheck,
    sendFeedback, syncLocalFeedback, setupVoice, updateAttachWarn, renderAttachChips, readTextFile, addAttachFiles, postCorpusAdd,
    submitTeach, syncLocalCorpusOnce, setupAttachDnD, syncPersonaSelect, onPersonaChange, addPersona, setEvoOpen, renderBpcChart,
    regenerateAnswer, regenerateFromEditedUser
  } = api;


  const TOUR_STEPS = [
    { title: "Добро пожаловать в МойGPT", body: "Свой чат на своём корпусе. Пять шагов — и вы в деле.", sel: ".brand" },
    { title: "Чат и стрим", body: "Пишите внизу. Ответы стримятся, источники кликабельны только по http(s).", sel: "#composerBox" },
    { title: "Арена моделей", body: "Один промпт → две модели. Голосуйте A/B/ничья — строится локальный Elo.", sel: "#btnToggleArena" },
    { title: "Объяснить", body: "Под ответом — «Объяснить»: пошаговый replay через /api/next.", sel: "#btnToggleLab" },
    { title: "Палитра и workspace", body: "Ctrl+K — команды. Workspace экспортирует чаты, папки и промпты одним JSON.", sel: "#btnCmdPalette" },
  ];

  function startTour(step) {
    state.tourStep = step || 0;
    if (!el.tour) return;
    el.tour.hidden = false;
    trapFocus(el.tourDialog || el.tour);
    renderTour();
  }

  function endTour() {
    if (el.tour) el.tour.hidden = true;
    localStorage.setItem(TOUR_KEY, "1");
    releaseFocusTrap();
    if (el.tourSpot) {
      el.tourSpot.style.top = "-9999px";
      el.tourSpot.style.left = "-9999px";
      el.tourSpot.style.width = "0";
      el.tourSpot.style.height = "0";
    }
  }

  function renderTour() {
    const step = TOUR_STEPS[state.tourStep] || TOUR_STEPS[0];
    if (el.tourProgress) el.tourProgress.textContent = "Шаг " + Number(state.tourStep + 1) + " / " + Number(TOUR_STEPS.length);
    if (el.tourTitle) el.tourTitle.textContent = step.title;
    if (el.tourBody) el.tourBody.textContent = step.body;
    if (el.btnTourNext) el.btnTourNext.textContent = state.tourStep >= TOUR_STEPS.length - 1 ? "Готово" : "Далее";
    if (el.btnTourPrev) el.btnTourPrev.disabled = state.tourStep <= 0;
    const target = document.querySelector(step.sel);
    if (target && el.tourSpot) {
      const r = target.getBoundingClientRect();
      el.tourSpot.style.top = Math.max(8, r.top - 6) + "px";
      el.tourSpot.style.left = Math.max(8, r.left - 6) + "px";
      el.tourSpot.style.width = r.width + 12 + "px";
      el.tourSpot.style.height = r.height + 12 + "px";
    }
  }

  const exported = { startTour, endTour, renderTour };
  Object.assign(api, exported);
  return exported;
}
