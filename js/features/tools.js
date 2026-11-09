/* МойGPT feature: tools (ES module). */
import { safeCalc as safeCalcPure } from '../calc.js';

export function install(api) {
  "use strict";
  api.safeCalc = safeCalcPure;

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
    matchEvalRow, refreshModelCard, evoModels, loadEvoBpcMap, runEvolution, stopEvolution, setChatStatsOpen, gatherChatStats,
    drawDayChart, drawModelPie, renderChatStats, setPlaygroundOpen, setPlaygroundOpenImpl, pgStopSeqs, renderPgTabs, paintPgActive,
    runPlaygroundViaNext, runPlayground, stopPlayground, renderNotifList, openNotifs, clearNotifs, pollNotifEvents, runSandboxedJs,
    runPerfCheck, sendFeedback, syncLocalFeedback, setupVoice, updateAttachWarn, renderAttachChips, readTextFile, addAttachFiles,
    postCorpusAdd, submitTeach, syncLocalCorpusOnce, setupAttachDnD, syncPersonaSelect, onPersonaChange, addPersona, setEvoOpen,
    renderBpcChart, regenerateAnswer, regenerateFromEditedUser
  } = api;


  function appendToolCard(chat, toolName, title, bodyHtml, plain) {
    el.emptyState.hidden = true;
    const wrap = document.createElement("div");
    wrap.className = "msg bot tool-msg";
    const av = document.createElement("div");
    av.className = "avatar";
    av.textContent = "✦";
    const col = document.createElement("div");
    col.className = "msg-col";
    const card = document.createElement("div");
    card.className = "tool-card";
    card.innerHTML =
      '<div class="tool-head"><span class="tool-badge">' + escapeHtml(toolName) + '</span>' +
      '<span class="tool-title">' + escapeHtml(title) + "</span></div>" +
      '<div class="tool-body"></div>';
    const toolBody = card.querySelector(".tool-body");
    if (bodyHtml && typeof bodyHtml === "object" && bodyHtml.nodeType) {
      toolBody.appendChild(bodyHtml);
    } else {
      toolBody.innerHTML = bodyHtml || "";
    }
    col.appendChild(card);
    wrap.appendChild(av);
    wrap.appendChild(col);
    el.messages.appendChild(wrap);
    el.messages.scrollTop = el.messages.scrollHeight;
    if (chat) {
      addNode(chat, chat.leafId, {
        role: "assistant",
        content: plain || title + "\n" + (card.querySelector(".tool-body") || {}).textContent || "",
        model: "tool:" + toolName,
        tool: toolName,
      });
      saveStore();
      renderSidebar();
    }
  }

  async function runChatTool(tool) {
    const chat = ensureChat();
    // record user turn
    addNode(chat, chat.leafId, { role: "user", content: tool.name === "time" ? "/time" : ("/" + tool.name + " " + tool.arg) });
    chat.updatedAt = Date.now();
    if (chat.title === "Новый чат") chat.title = "/" + tool.name;
    saveStore();
    renderAll();
    try {
      if (tool.name === "calc") {
        const val = safeCalc(tool.arg);
        appendToolCard(chat, "calc", tool.arg, "<strong>" + escapeHtml(String(val)) + "</strong>", String(val));
      } else if (tool.name === "time") {
        const now = new Date();
        const fmt = new Intl.DateTimeFormat("ru-RU", {
          timeZone: "Europe/Moscow",
          dateStyle: "full",
          timeStyle: "medium",
        }).format(now);
        appendToolCard(chat, "time", "Europe/Moscow", escapeHtml(fmt + " (MSK)"), fmt + " (MSK)");
      } else if (tool.name === "wiki") {
        const res = await fetch(url(API.search) + "?q=" + encodeURIComponent(tool.arg) + "&k=3", { cache: "no-store" });
        if (!res.ok) throw new Error("search " + res.status);
        const data = await res.json();
        const hits = Array.isArray(data) ? data : (data.results || data.hits || []);
        if (!hits.length) {
          appendToolCard(chat, "wiki", tool.arg, "ничего не найдено", "ничего не найдено");
        } else {
          const top = hits[0];
          const title = top.title || "Источник";
          const snip = top.snippet || top.text || "";
          const href = safeHref(top.url || "");
          const body = document.createElement("div");
          const snipDiv = document.createElement("div");
          snipDiv.textContent = snip;
          body.appendChild(snipDiv);
          const cite = document.createElement("div");
          cite.className = "tool-cite";
          cite.appendChild(document.createTextNode("источник: "));
          if (href) {
            cite.appendChild(makeExternalLink(href, hostLabel(href), ""));
          } else {
            const span = document.createElement("span");
            span.textContent = title;
            cite.appendChild(span);
          }
          body.appendChild(cite);
          appendToolCard(chat, "wiki", title, body, snip + (href ? "\n" + href : ""));
        }
      }
    } catch (err) {
      appendToolCard(chat, tool.name, "ошибка", escapeHtml(err.message || String(err)), err.message || String(err));
    }
  }

  const exported = { appendToolCard, runChatTool };
  Object.assign(api, exported);
  return exported;
}
