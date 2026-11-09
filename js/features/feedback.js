/* МойGPT feature: feedback (ES module). */

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
    openThemeBuilder, ensureSimilarWorker, requestSimilarChats, renderSimilarList, updateTokenBudget, scheduleTokenBudget, setModelCardOpen, fillModelCardSelect,
    matchEvalRow, refreshModelCard, appendToolCard, runChatTool, evoModels, loadEvoBpcMap, runEvolution, stopEvolution,
    setChatStatsOpen, gatherChatStats, drawDayChart, drawModelPie, renderChatStats, setPlaygroundOpen, setPlaygroundOpenImpl, pgStopSeqs,
    renderPgTabs, paintPgActive, runPlaygroundViaNext, runPlayground, stopPlayground, renderNotifList, openNotifs, clearNotifs,
    pollNotifEvents, runSandboxedJs, runPerfCheck, setupVoice, updateAttachWarn, renderAttachChips, readTextFile, addAttachFiles,
    postCorpusAdd, submitTeach, syncLocalCorpusOnce, setupAttachDnD, syncPersonaSelect, onPersonaChange, addPersona, setEvoOpen,
    renderBpcChart, regenerateAnswer, regenerateFromEditedUser
  } = api;


  async function sendFeedback(payload, btnUp, btnDown, noteEl, rating) {
    btnUp.classList.toggle("active-up", rating === 1);
    btnDown.classList.toggle("active-down", rating === -1);
    try {
      const res = await fetch(url(API.feedback), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.assign({}, payload, { rating: rating })),
      });
      if (res.status === 404 || res.status === 405) throw new Error("missing");
      if (!res.ok) throw new Error("fb " + res.status);
      if (noteEl) {
        noteEl.textContent = "сохранено";
        noteEl.hidden = false;
      }
    } catch (_) {
      saveLocalFeedback(Object.assign({ rating: rating, ts: Date.now() }, payload));
      if (noteEl) {
        noteEl.textContent = "сохранено локально";
        noteEl.hidden = false;
      }
    }
  }

  async function syncLocalFeedback() {
    const all = loadLocalFeedback();
    if (!all.length) return;
    const left = [];
    for (const entry of all) {
      try {
        const res = await fetch(url(API.feedback), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        });
        if (!res.ok) {
          left.push(entry);
          continue;
        }
      } catch (_) {
        left.push(entry);
      }
    }
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(left));
  }

  const exported = { sendFeedback, syncLocalFeedback };
  Object.assign(api, exported);
  return exported;
}
