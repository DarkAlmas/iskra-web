/* МойGPT feature: stats (ES module). */

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
    setPlaygroundOpen, setPlaygroundOpenImpl, pgStopSeqs, renderPgTabs, paintPgActive, runPlaygroundViaNext, runPlayground, stopPlayground,
    renderNotifList, openNotifs, clearNotifs, pollNotifEvents, runSandboxedJs, runPerfCheck, sendFeedback, syncLocalFeedback,
    setupVoice, updateAttachWarn, renderAttachChips, readTextFile, addAttachFiles, postCorpusAdd, submitTeach, syncLocalCorpusOnce,
    setupAttachDnD, syncPersonaSelect, onPersonaChange, addPersona, setEvoOpen, renderBpcChart, regenerateAnswer, regenerateFromEditedUser
  } = api;


  function setChatStatsOpen(open) {
    if (!el.chatStatsPanel) return;
    if (open) closeOtherPanels("chatstats");
    el.chatStatsPanel.hidden = !open;
    if (open) renderChatStats();
  }

  function gatherChatStats() {
    const byDay = {};
    const byModel = {};
    let msgs = 0, userMsgs = 0, botMsgs = 0, tokens = 0;
    (state.chats || []).forEach((c) => {
      const list = c.messages || [];
      list.forEach((m) => {
        msgs++;
        const day = new Date(c.updatedAt || Date.now()).toISOString().slice(0, 10);
        // prefer message ts if present
        const ts = m.ts || c.updatedAt || Date.now();
        const d = new Date(ts).toISOString().slice(0, 10);
        byDay[d] = (byDay[d] || 0) + 1;
        tokens += estimateTokens(m.content || "");
        if (m.role === "user") userMsgs++;
        if (m.role === "assistant") {
          botMsgs++;
          const mod = m.model || "unknown";
          byModel[mod] = (byModel[mod] || 0) + 1;
        }
      });
    });
    let up = 0, down = 0;
    try {
      const fb = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]");
      (Array.isArray(fb) ? fb : []).forEach((f) => {
        if (f.rating === "up" || f.rating === 1 || f.vote === "up") up++;
        else if (f.rating === "down" || f.rating === -1 || f.vote === "down") down++;
      });
    } catch (_) {}
    return { byDay, byModel, msgs, userMsgs, botMsgs, tokens, up, down };
  }

  function drawDayChart(canvas, byDay) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const days = Object.keys(byDay).sort().slice(-21);
    if (!days.length) {
      ctx.fillStyle = "#8b9bb0";
      ctx.fillText("нет данных", 12, 24);
      return;
    }
    const vals = days.map((d) => byDay[d]);
    const max = Math.max.apply(null, vals.concat([1]));
    const pad = 24;
    const bw = (w - pad * 2) / days.length;
    ctx.strokeStyle = "#2a3544";
    ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();
    days.forEach((d, i) => {
      const v = vals[i];
      const bh = ((h - pad * 2) * v) / max;
      const x = pad + i * bw + 2;
      const y = h - pad - bh;
      ctx.fillStyle = "#3dd6c6";
      ctx.fillRect(x, y, Math.max(2, bw - 4), bh);
    });
    ctx.fillStyle = "#8b9bb0";
    ctx.font = "10px sans-serif";
    ctx.fillText(days[0].slice(5), pad, h - 6);
    ctx.fillText(days[days.length - 1].slice(5), w - pad - 28, h - 6);
  }

  function drawModelPie(canvas, byModel, legend) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const entries = Object.keys(byModel).map((k) => ({ k: k, v: byModel[k] })).sort((a, b) => b.v - a.v).slice(0, 8);
    const total = entries.reduce((s, e) => s + e.v, 0) || 1;
    let a0 = -Math.PI / 2;
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 8;
    if (legend) legend.innerHTML = "";
    entries.forEach((e, i) => {
      const a1 = a0 + (e.v / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a0, a1);
      ctx.closePath();
      ctx.fillStyle = DONUT_COLORS[i % DONUT_COLORS.length];
      ctx.fill();
      a0 = a1;
      if (legend) {
        const li = document.createElement("li");
        li.innerHTML = '<span style="color:' + DONUT_COLORS[i % DONUT_COLORS.length] + '">●</span> ' +
          escapeHtml(e.k) + " · " + Number(e.v);
        legend.appendChild(li);
      }
    });
    if (!entries.length) {
      ctx.fillStyle = "#8b9bb0";
      ctx.fillText("нет данных", 40, h / 2);
    }
  }

  function renderChatStats() {
    const st = gatherChatStats();
    if (el.csSummary) {
      const avg = st.msgs ? (st.tokens / st.msgs) : 0;
      el.csSummary.innerHTML =
        "<div>чатов <strong>" + Number(state.chats.length) + "</strong></div>" +
        "<div>сообщений <strong>" + Number(st.msgs) + "</strong></div>" +
        "<div>user/bot <strong>" + Number(st.userMsgs) + "/" + Number(st.botMsgs) + "</strong></div>" +
        "<div>ср. токенов <strong>" + Number(avg).toFixed(1) + "</strong></div>";
    }
    drawDayChart(el.csDayChart, st.byDay);
    drawModelPie(el.csModelPie, st.byModel, el.csModelLegend);
    const totalFb = st.up + st.down;
    const ratio = totalFb ? st.up / totalFb : 0;
    if (el.csFeedback) {
      el.csFeedback.innerHTML =
        "<div>������ <strong>" + Number(st.up) + "</strong></div>" +
        "<div>������ <strong>" + Number(st.down) + "</strong></div>" +
        "<div>доля ������ <strong>" + (totalFb ? (ratio * 100).toFixed(0) + "%" : "—") + "</strong></div>";
    }
    if (el.csFeedbackFill) el.csFeedbackFill.style.width = (ratio * 100).toFixed(0) + "%";
  }

  const exported = { setChatStatsOpen, gatherChatStats, drawDayChart, drawModelPie, renderChatStats };
  Object.assign(api, exported);
  return exported;
}
