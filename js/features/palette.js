/* МойGPT feature: palette (ES module). */

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
    onInputSlash, createFolder, openMsgSearch, highlightMsgSnippet, runMsgSearch, renderSftList, exportSftJsonl, uniqueSourcesFromHits,
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


  function cmdActions() {
    return [
      { id: "new", label: "Новый чат", hint: "Ctrl+N", run: () => newChat() },
      { id: "settings", label: "Настройки генерации", hint: "температура / top_p…", run: () => { el.settingsPanel.hidden = false; closeOtherPanels("settings"); } },
      { id: "dash", label: "Панель проекта", run: () => setDashOpen(true) },
      { id: "train", label: "Обучение", run: () => setTrainOpen(true) },
      { id: "eval", label: "Оценка", run: () => setEvalOpen(true) },
      { id: "corpus", label: "Корпус", run: () => setCorpusOpen(true) },
      { id: "dataset", label: "Датасет", run: () => setDatasetOpen(true) },
      { id: "lab", label: "Лаборатория", run: () => setLabOpen(true) },
      { id: "sharehtml", label: "Шаринг HTML", run: () => shareChatHtml() },
      { id: "sharepng", label: "Шаринг PNG", run: () => shareChatPng() },
      { id: "lang", label: "Language RU/EN", run: () => toggleLang() },
      { id: "perf", label: "Perf check", run: () => runPerfCheck() },
      { id: "arena", label: "Арена", hint: "две модели · голос", run: () => setArenaOpen(true) },
      { id: "elo", label: "Elo рейтинг", run: () => setEloOpen(true) },
      { id: "prompts", label: "Библиотека промптов", hint: "/", run: () => openPrompts() },
      { id: "msgsearch", label: "Поиск по сообщениям", hint: "Ctrl+F", run: () => openMsgSearch() },
      { id: "heatmap", label: "Тепловая карта токенов", run: () => { state.heatmap = !state.heatmap; syncGenSettingsUI(); renderMessages(); } },
      { id: "theme", label: "Сменить тему", run: () => toggleTheme() },
      { id: "export", label: "Экспорт Markdown", run: () => exportMarkdown() },
      { id: "workspace", label: "Экспорт/импорт workspace", run: () => openWorkspace() },
      { id: "playground", label: "Playground", run: () => setPlaygroundOpen(true) },
      { id: "evo", label: "Эволюция чекпоинтов", hint: "таймлайн", run: () => setEvoOpen(true) },
      { id: "chatstats", label: "Статистика чатов", run: () => setChatStatsOpen(true) },
      { id: "help", label: "Горячие клавиши", hint: "?", run: () => { el.helpTip.hidden = false; } },
      { id: "modelcard", label: "Карточка модели", run: () => setModelCardOpen(true) },
      { id: "notifs", label: "Уведомления", run: () => openNotifs() },
      { id: "themebuilder", label: "Конструктор темы", run: () => openThemeBuilder() },
      { id: "tour", label: "Обзор (онбординг)", run: () => startTour(0) },
      { id: "folder", label: "Новая папка", run: () => createFolder() },
      { id: "stop", label: "Стоп генерации", hint: "Esc", run: () => stop() },
    ];
  }

  function renderCmdList(q) {
    const qq = (q || "").toLowerCase().trim();
    const items = cmdActions().filter((a) => !qq || (a.label + " " + (a.hint || "")).toLowerCase().indexOf(qq) !== -1);
    el.cmdList.innerHTML = "";
    state.cmdIdx = 0;
    items.forEach((a, i) => {
      const li = document.createElement("li");
      li.className = i === 0 ? "active" : "";
      li.innerHTML = "<span>" + escapeHtml(a.label) + '</span><span class="cmd-hint">' + escapeHtml(a.hint || "") + "</span>";
      li.addEventListener("click", () => {
        closeOverlay(el.cmdPalette);
        a.run();
      });
      el.cmdList.appendChild(li);
    });
    el.cmdList._items = items;
  }

  function openCmdPalette() {
    closeAllOverlays();
    openOverlay(el.cmdPalette);
    el.cmdInput.value = "";
    renderCmdList("");
    setTimeout(() => el.cmdInput.focus(), 0);
  }

  const exported = { cmdActions, renderCmdList, openCmdPalette };
  Object.assign(api, exported);
  return exported;
}
