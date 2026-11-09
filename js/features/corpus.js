/* МойGPT feature: corpus (ES module). */

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
    renderQaCatPills, renderEvalDiff, smoothSeries, formatEta, maybeNotifyCkpt, corpusSourceLabel, corpusSourcesFromStats, recordCorpusGrowth,
    drawDonut, drawGrowth, formatChars, loadDashCorpusExtra, fmtNum, refreshDashboard, setDashOpen, setDashOpenImpl,
    runTokenize, runNextProbs, setLabOpen, updateConfToggleState, trapFocus, releaseFocusTrap, renderEloTable, setEloOpen,
    setArenaOpen, setArenaOpenImpl, runArena, stopArena, voteArena, openExplain, explainStep, renderExplainBars,
    pickExplainCand, explainNextTop, explainAutoToggle, explainReset, modelGroup, fillModelSelectGrouped, pickDistinctModels, applyArenaPair,
    compareSftInArena, ensureArenaDistinct, startTour, endTour, renderTour, openWorkspace, exportWorkspace, importWorkspaceFile,
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


  function highlightSnippet(text, query) {
    const esc = escapeHtml(text || "");
    const words = String(query || "").trim().split(/\s+/).filter((w) => w.length > 1).slice(0, 8);
    if (!words.length) return esc;
    let out = esc;
    words.forEach((w) => {
      const re = new RegExp("(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
      out = out.replace(re, "<mark>$1</mark>");
    });
    return out;
  }

  async function runCorpusSearch(q) {
    const query = (q || el.corpusQuery.value || "").trim();
    if (!query) {
      el.corpusEmpty.hidden = false;
      el.corpusEmpty.textContent = "Введите запрос";
      el.corpusList.innerHTML = "";
      return;
    }
    el.corpusEmpty.hidden = false;
    el.corpusEmpty.textContent = "Ищем…";
    el.corpusList.innerHTML = "";
    try {
      const res = await fetch(url(API.search) + "?q=" + encodeURIComponent(query) + "&k=10", { cache: "no-store" });
      if (res.status === 404) throw new Error("404");
      if (!res.ok) throw new Error("search " + res.status);
      let data = await res.json();
      const rows = Array.isArray(data) ? data : data.results || data.hits || [];
      if (!rows.length) {
        el.corpusEmpty.textContent = "Ничего не найдено";
        return;
      }
      el.corpusEmpty.hidden = true;
      rows.forEach((r) => {
        const li = document.createElement("li");
        li.className = "corpus-item";
        const title = document.createElement("div");
        title.className = "c-title";
        title.textContent = r.title || "(без названия)";
        const src = document.createElement("div");
        src.className = "c-src";
        src.textContent = r.src || r.source || "";
        const snip = document.createElement("div");
        snip.className = "c-snip";
        snip.innerHTML = highlightSnippet(r.text || r.snippet || "", query);
        const linkWrap = document.createElement("div");
        linkWrap.style.marginTop = "6px";
        const raw = r.url || r.href || "";
        linkWrap.appendChild(makeExternalLink(raw, isSafeHttpUrl(raw) ? raw : "нет ссылки", "c-link"));
        li.appendChild(title);
        if (src.textContent) li.appendChild(src);
        li.appendChild(snip);
        li.appendChild(linkWrap);
        el.corpusList.appendChild(li);
      });
    } catch (_) {
      el.corpusEmpty.hidden = false;
      el.corpusEmpty.textContent = "нет данных (поиск недоступен)";
    }
  }

  function setCorpusOpen(open) {
    el.corpusPanel.hidden = !open;
    if (open) {
      closeOtherPanels("corpus");
      el.corpusQuery.focus();
    }
  }

  const exported = { highlightSnippet, runCorpusSearch, setCorpusOpen };
  Object.assign(api, exported);
  return exported;
}
