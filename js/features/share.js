/* МойGPT feature: share (ES module). */

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
    setDatasetOpen, setDatasetOpenImpl, openThemeBuilder, ensureSimilarWorker, requestSimilarChats, renderSimilarList, updateTokenBudget, scheduleTokenBudget,
    setModelCardOpen, fillModelCardSelect, matchEvalRow, refreshModelCard, appendToolCard, runChatTool, evoModels, loadEvoBpcMap,
    runEvolution, stopEvolution, setChatStatsOpen, gatherChatStats, drawDayChart, drawModelPie, renderChatStats, setPlaygroundOpen,
    setPlaygroundOpenImpl, pgStopSeqs, renderPgTabs, paintPgActive, runPlaygroundViaNext, runPlayground, stopPlayground, renderNotifList,
    openNotifs, clearNotifs, pollNotifEvents, runSandboxedJs, runPerfCheck, sendFeedback, syncLocalFeedback, setupVoice,
    updateAttachWarn, renderAttachChips, readTextFile, addAttachFiles, postCorpusAdd, submitTeach, syncLocalCorpusOnce, setupAttachDnD,
    syncPersonaSelect, onPersonaChange, addPersona, setEvoOpen, renderBpcChart, regenerateAnswer, regenerateFromEditedUser
  } = api;


  function buildStandaloneHtml(chat) {
    const body = (chat.messages || [])
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => {
        if (m.role === "user") return '<div class="u"><div class="role">User</div><pre>' + escapeHtml(m.content || "") + "</pre></div>";
        return '<div class="b"><div class="role">' + escapeHtml(m.model || "МойGPT") + '</div><pre>' + escapeHtml(m.content || "") + "</pre></div>";
      })
      .join("\n");
    return "<!DOCTYPE html><html lang=ru><head><meta charset=UTF-8><title>" +
      escapeHtml(chat.title || "МойGPT") +
      "</title><style>body{font-family:system-ui,sans-serif;background:#0b0f14;color:#e8eef5;margin:0;padding:24px}pre{white-space:pre-wrap;background:#121820;padding:12px;border-radius:10px;border:1px solid #2a3544}.u pre{background:#1a3340}.role{color:#3dd6c6;font-size:12px;margin:12px 0 4px}h1{font-size:20px}</style></head><body><h1>" +
      escapeHtml(chat.title || "МойGPT") +
      "</h1>" + body + "</body></html>";
  }

  function shareChatHtml() {
    const chat = activeChat();
    if (!chat || !chat.messages || !chat.messages.length) return;
    const html = buildStandaloneHtml(chat);
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (chat.title || "mygpt-chat").replace(/[^\wа-яё-]+/gi, "_").slice(0, 40) + ".html";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function shareChatPng() {
    const chat = activeChat();
    if (!chat || !chat.messages || !chat.messages.length) return;
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 520;
    canvas.className = "share-card-canvas";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0, 0, 900, 520);
    ctx.fillStyle = "#121820";
    roundRect(ctx, 40, 40, 820, 440, 18);
    ctx.fill();
    ctx.fillStyle = "#3dd6c6";
    ctx.font = "bold 22px system-ui,sans-serif";
    ctx.fillText("МойGPT", 70, 90);
    ctx.fillStyle = "#e8eef5";
    ctx.font = "600 20px system-ui,sans-serif";
    wrapText(ctx, chat.title || "Чат", 70, 130, 760, 28);
    const user = chat.messages.find((m) => m.role === "user");
    const bot = [...chat.messages].reverse().find((m) => m.role === "assistant");
    ctx.fillStyle = "#8b9bb0";
    ctx.font = "14px system-ui,sans-serif";
    ctx.fillText("User", 70, 190);
    ctx.fillStyle = "#e8eef5";
    ctx.font = "16px system-ui,sans-serif";
    wrapText(ctx, (user && user.content) || "", 70, 220, 760, 22, 3);
    ctx.fillStyle = "#8b9bb0";
    ctx.font = "14px system-ui,sans-serif";
    ctx.fillText((bot && bot.model) || "Assistant", 70, 320);
    ctx.fillStyle = "#e8eef5";
    ctx.font = "16px system-ui,sans-serif";
    wrapText(ctx, (bot && bot.content) || "", 70, 350, 760, 22, 4);
    ctx.fillStyle = "#3dd6c6";
    ctx.font = "12px system-ui,sans-serif";
    ctx.fillText("mygpt · local", 70, 455);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = (chat.title || "mygpt-chat").replace(/[^\wа-яё-]+/gi, "_").slice(0, 40) + ".png";
      a.click();
      URL.revokeObjectURL(a.href);
      canvas.remove();
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxW, lineH, maxLines) {
    const words = String(text || "").replace(/\s+/g, " ").trim().split(" ");
    let line = "";
    let lines = 0;
    const limit = maxLines || 6;
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, y + lines * lineH);
        lines++;
        line = words[i];
        if (lines >= limit) {
          ctx.fillText(line.slice(0, 40) + "…", x, y + lines * lineH);
          return;
        }
      } else line = test;
    }
    if (line && lines < limit) ctx.fillText(line, x, y + lines * lineH);
  }

  function exportHtml() {
    const chat = activeChat();
    if (!chat || !chat.messages.length) return;
    const body = chat.messages
      .map((m) => {
        if (m.role === "user") return '<div class="u"><h3>Пользователь</h3><pre>' + escapeHtml(m.content) + "</pre></div>";
        if (m.compare) {
          return (
            '<div class="cmp">' +
            m.compare
              .map(
                (s) =>
                  "<h3>" +
                  escapeHtml(s.model || "") +
                  "</h3><pre>" +
                  escapeHtml(s.content || "") +
                  "</pre>"
              )
              .join("") +
            "</div>"
          );
        }
        return (
          '<div class="a"><h3>МойGPT' +
          (m.model ? " · " + escapeHtml(m.model) : "") +
          "</h3><pre>" +
          escapeHtml(m.content || "") +
          "</pre></div>"
        );
      })
      .join("\n");
    const html =
      "<!DOCTYPE html><html lang=\"ru\"><head><meta charset=\"UTF-8\"/><title>" +
      escapeHtml(chat.title || "Чат") +
      "</title><style>body{font-family:system-ui,sans-serif;background:#0b0f14;color:#e8eef5;max-width:820px;margin:24px auto;padding:0 16px;line-height:1.5}h1,h3{color:#3dd6c6}pre{white-space:pre-wrap;background:#121820;border:1px solid #2a3544;border-radius:10px;padding:12px}.u pre{border-color:#1a4a46}</style></head><body><h1>" +
      escapeHtml(chat.title || "Чат") +
      "</h1>" +
      body +
      "</body></html>";
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (chat.title || "chat").replace(/[^\wа-яё\-]+/gi, "_").slice(0, 40) + ".html";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const exported = { buildStandaloneHtml, shareChatHtml, shareChatPng, roundRect, wrapText, exportHtml };
  Object.assign(api, exported);
  return exported;
}
