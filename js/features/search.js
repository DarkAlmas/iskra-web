/* МойGPT feature: search (ES module). */

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
    renderTrainSamples, parseTs, dedupeEvalRows, bestBpcIndex, renderEvalBars, collectCats, fillCatFilter, renderEvalQaDetail,
    renderEvalTable, applyEvalCatFilter, loadEval, setEvalOpen, setEvalOpenImpl, fillEvalDiffSelects, qaCatBreakdown, renderQaCatPills,
    renderEvalDiff, smoothSeries, formatEta, maybeNotifyCkpt, highlightSnippet, runCorpusSearch, setCorpusOpen, corpusSourceLabel,
    corpusSourcesFromStats, recordCorpusGrowth, drawDonut, drawGrowth, formatChars, loadDashCorpusExtra, fmtNum, refreshDashboard,
    setDashOpen, setDashOpenImpl, runTokenize, runNextProbs, setLabOpen, updateConfToggleState, trapFocus, releaseFocusTrap,
    renderEloTable, setEloOpen, setArenaOpen, setArenaOpenImpl, runArena, stopArena, voteArena, openExplain,
    explainStep, renderExplainBars, pickExplainCand, explainNextTop, explainAutoToggle, explainReset, modelGroup, fillModelSelectGrouped,
    pickDistinctModels, applyArenaPair, compareSftInArena, ensureArenaDistinct, startTour, endTour, renderTour, openWorkspace,
    exportWorkspace, importWorkspaceFile, openPrompts, renderPromptsList, hideSlashPopup, showSlashPopup, applySlashPrompt, onInputSlash,
    createFolder, cmdActions, renderCmdList, openCmdPalette, renderSftList, exportSftJsonl, uniqueSourcesFromHits, renderDatasetChips,
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


  function openMsgSearch() {
    closeAllOverlays();
    openOverlay(el.msgSearchOverlay);
    el.msgSearchInput.value = state.msgSearchQ || "";
    runMsgSearch(el.msgSearchInput.value);
    setTimeout(() => el.msgSearchInput.focus(), 0);
  }

  function highlightMsgSnippet(text, q) {
    const t = String(text || "");
    const qq = String(q || "").trim();
    if (!qq) return escapeHtml(t.slice(0, 160));
    const idx = t.toLowerCase().indexOf(qq.toLowerCase());
    if (idx < 0) return escapeHtml(t.slice(0, 160));
    const start = Math.max(0, idx - 40);
    const end = Math.min(t.length, idx + qq.length + 80);
    const before = escapeHtml(t.slice(start, idx));
    const mid = escapeHtml(t.slice(idx, idx + qq.length));
    const after = escapeHtml(t.slice(idx + qq.length, end));
    return (start > 0 ? "…" : "") + before + "<mark>" + mid + "</mark>" + after + (end < t.length ? "…" : "");
  }

  function runMsgSearch(q) {
    state.msgSearchQ = q || "";
    el.msgSearchList.innerHTML = "";
    const qq = (q || "").toLowerCase().trim();
    if (!qq) {
      const li = document.createElement("li");
      li.textContent = "Введите запрос…";
      el.msgSearchList.appendChild(li);
      return;
    }
    let hits = 0;
    state.chats.forEach((chat) => {
      (chat.messages || []).forEach((m, mi) => {
        const content = m.content || "";
        if (content.toLowerCase().indexOf(qq) === -1) return;
        hits++;
        if (hits > 80) return;
        const li = document.createElement("li");
        li.innerHTML =
          '<span class="ms-chat">' +
          escapeHtml(chat.title || "Чат") +
          " · " +
          escapeHtml(m.role || "") +
          '</span><span class="ms-snip">' +
          highlightMsgSnippet(content, qq) +
          "</span>";
        li.addEventListener("click", () => {
          state.activeId = chat.id;
          saveStore();
          syncSystemField();
          syncGenSettingsUI();
          closeOverlay(el.msgSearchOverlay);
          renderAll();
          // highlight in visible bubbles
          setTimeout(() => {
            const bubbles = el.messages.querySelectorAll(".bubble");
            bubbles.forEach((b) => {
              if ((b.textContent || "").toLowerCase().indexOf(qq) !== -1) {
                b.scrollIntoView({ behavior: "smooth", block: "center" });
                const html = b.innerHTML;
                // soft mark pass on text nodes already rendered — wrap via mark class on container
                b.classList.add("msg-jump");
                setTimeout(() => b.classList.remove("msg-jump"), 1600);
              }
            });
          }, 50);
        });
        el.msgSearchList.appendChild(li);
      });
    });
    if (!hits) {
      const li = document.createElement("li");
      li.textContent = "Ничего не найдено";
      el.msgSearchList.appendChild(li);
    }
  }

  const exported = { openMsgSearch, highlightMsgSnippet, runMsgSearch };
  Object.assign(api, exported);
  return exported;
}
