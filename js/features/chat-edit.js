/* МойGPT feature: chat-edit (ES module). */

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
    applyTheme, toggleTheme, newChat, stop, autoResize, checkHealth, setHealth, loadModels,
    maybeAnnounceSft, showAppToast, pickDistinctModelsPure, findSftModelsPure, fetchFirstOk, showError, isMobile, registerPwa,
    openSidebar, resetGenToServer, syncGenSettingsUI, persistGenFromUI, syncSystemField, makeBtn, createBotColumn, finalizeBotColumn,
    runOneStream, liveUpdate, bindCodeCopy, chatGen, emptyTreeChat, nid, effectiveSystem, sortedChats,
    makeChatItem, clearMessagesDom, appendUserBubble, switchBranch, renderMessages, FALLBACK_MODELS, CTX_WINDOW, TOUR_KEY,
    STORE_KEY, THEME_KEY, MAX_RENDER_MSGS, DEFAULT_GEN, DONUT_COLORS, MAX_ATTACH_BYTES, MAX_ATTACH_CHARS, MAX_TEACH_BYTES,
    MIN_TEACH_CHARS, CORPUS_LOCAL_KEY, CORPUS_GROWTH_KEY, PROMPTS_KEY, FOLDERS_KEY, ELO_KEY, FEEDBACK_KEY, PERSONA_KEY,
    SFT_KEY, LANG_KEY, GEN_CLAMP, I18N, ACCENT_KEY, NOTIF_KEY, OFFLINE_Q_KEY, WS_SCHEMA,
    TOK_COLORS, DEFAULT_PERSONAS, ensureFeat, lazyBindTab, registerTabFn, tabFn, drawLossChart, normalizeTrain,
    pollTrain, setTrainOpen, resumeTrain, renderTrainSamples, parseTs, dedupeEvalRows, bestBpcIndex, renderEvalBars,
    collectCats, fillCatFilter, renderEvalQaDetail, renderEvalTable, applyEvalCatFilter, loadEval, setEvalOpen, setEvalOpenImpl,
    fillEvalDiffSelects, qaCatBreakdown, renderQaCatPills, renderEvalDiff, smoothSeries, formatEta, maybeNotifyCkpt, highlightSnippet,
    runCorpusSearch, setCorpusOpen, corpusSourceLabel, corpusSourcesFromStats, recordCorpusGrowth, drawDonut, drawGrowth, formatChars,
    loadDashCorpusExtra, fmtNum, refreshDashboard, setDashOpen, setDashOpenImpl, runTokenize, runNextProbs, setLabOpen,
    updateConfToggleState, trapFocus, releaseFocusTrap, renderEloTable, setEloOpen, setArenaOpen, setArenaOpenImpl, runArena,
    stopArena, voteArena, openExplain, explainStep, renderExplainBars, pickExplainCand, explainNextTop, explainAutoToggle,
    explainReset, modelGroup, fillModelSelectGrouped, pickDistinctModels, applyArenaPair, compareSftInArena, ensureArenaDistinct, startTour,
    endTour, renderTour, openWorkspace, exportWorkspace, importWorkspaceFile, openPrompts, renderPromptsList, hideSlashPopup,
    showSlashPopup, applySlashPrompt, onInputSlash, createFolder, cmdActions, renderCmdList, openCmdPalette, openMsgSearch,
    highlightMsgSnippet, runMsgSearch, renderSftList, exportSftJsonl, uniqueSourcesFromHits, renderDatasetChips, renderDatasetList, openDatasetDoc,
    runDatasetSearch, addCurrentDocToSft, setDatasetOpen, setDatasetOpenImpl, buildStandaloneHtml, shareChatHtml, shareChatPng, roundRect,
    wrapText, exportHtml, openThemeBuilder, ensureSimilarWorker, requestSimilarChats, renderSimilarList, updateTokenBudget, scheduleTokenBudget,
    setModelCardOpen, fillModelCardSelect, matchEvalRow, refreshModelCard, appendToolCard, runChatTool, evoModels, loadEvoBpcMap,
    runEvolution, stopEvolution, setChatStatsOpen, gatherChatStats, drawDayChart, drawModelPie, renderChatStats, setPlaygroundOpen,
    setPlaygroundOpenImpl, pgStopSeqs, renderPgTabs, paintPgActive, runPlaygroundViaNext, runPlayground, stopPlayground, renderNotifList,
    openNotifs, clearNotifs, pollNotifEvents, runSandboxedJs, runPerfCheck, sendFeedback, syncLocalFeedback, setupVoice,
    updateAttachWarn, renderAttachChips, readTextFile, addAttachFiles, postCorpusAdd, submitTeach, syncLocalCorpusOnce, setupAttachDnD,
    syncPersonaSelect, onPersonaChange, addPersona, setEvoOpen, renderBpcChart
  } = api;


  async function regenerateAnswer() {
    if (state.streaming) return;
    const chat = activeChat();
    if (!chat || !chat.leafId) return;
    migrateChatToTree(chat);
    let leaf = chat.nodes[chat.leafId];
    if (!leaf) return;
    // If leaf is assistant, branch a new assistant under its parent (user)
    let userNode = leaf.role === "user" ? leaf : chat.nodes[leaf.parentId];
    while (userNode && userNode.role !== "user" && userNode.parentId) {
      userNode = chat.nodes[userNode.parentId];
    }
    if (!userNode || userNode.role !== "user") return;
    // set leaf to user so path stops at user; then stream new assistant sibling
    chat.leafId = userNode.id;
    syncMessagesFromLeaf(chat);
    saveStore();
    renderMessages();

    const apiMsgs = buildMessagesPayload(chat.messages, effectiveSystem(chat));
    const model = el.modelSelect.value || FALLBACK_MODELS[0];
    const wrap = document.createElement("div");
    wrap.className = "msg bot";
    const av = document.createElement("div");
    av.className = "avatar";
    av.textContent = "✦";
    const built = createBotColumn(model);
    wrap.appendChild(av);
    wrap.appendChild(built.col);
    el.messages.appendChild(wrap);
    const ctrl = new AbortController();
    state.abort = ctrl;
    setStreamingUI(true);
    const result = await runOneStream(model, apiMsgs, built.bubble, built.live, ctrl.signal);
    state.abort = null;
    setStreamingUI(false);
    if ((state.heatmap || state.confHighlight) && result.tokenParts && result.tokenParts.length) {
      built.bubble.innerHTML = renderConfHtml(result.tokenParts);
    } else {
      built.bubble.innerHTML = renderMarkdown(result.content);
    }
    bindCodeCopy(built.bubble);
    const oldMeta = built.col.querySelector(".answer-meta");
    if (oldMeta) oldMeta.remove();
    renderSources(built.col, result.sources);
    renderAnswerMeta(built.col, result);
    addNode(chat, userNode.id, {
      role: "assistant",
      content: result.content,
      sources: result.sources,
      model: result.model,
      tps: result.tps,
      elapsed: result.elapsed,
      tokenParts: result.tokenParts || [],
    });
    saveStore();
    renderAll();
  }

  function editUserNode(nodeId, content) {
    if (state.streaming) return;
    const chat = activeChat();
    if (!chat || !chat.nodes[nodeId]) return;
    const wrap = el.messages.querySelector('.msg.user[data-node-id="' + CSS.escape(nodeId) + '"]');
    if (!wrap) {
      // fallback: branch into composer
      const node = chat.nodes[nodeId];
      state.branchEditParentId = node.parentId || null;
      chat.leafId = node.parentId || null;
      syncMessagesFromLeaf(chat);
      saveStore();
      renderMessages();
      el.input.value = content;
      autoResize();
      el.input.focus();
      return;
    }
    const col = wrap.querySelector(".msg-col");
    if (!col || col.querySelector(".msg-edit-box")) return;
    const box = document.createElement("div");
    box.className = "msg-edit-box";
    const ta = document.createElement("textarea");
    ta.value = content;
    const actions = document.createElement("div");
    actions.className = "msg-edit-actions";
    const save = document.createElement("button");
    save.type = "button";
    save.className = "btn btn-primary btn-sm";
    save.textContent = "Сохранить и перегенерировать";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn btn-ghost btn-sm";
    cancel.textContent = "Отмена";
    cancel.addEventListener("click", () => box.remove());
    save.addEventListener("click", () => {
      const next = (ta.value || "").trim();
      box.remove();
      if (!next) return;
      regenerateFromEditedUser(nodeId, next);
    });
    actions.appendChild(save);
    actions.appendChild(cancel);
    box.appendChild(ta);
    box.appendChild(actions);
    col.appendChild(box);
    ta.focus();
  }

  function findAssistantChild(chat, userNodeId) {
    const kids = Object.values(chat.nodes || {}).filter((n) => n.parentId === userNodeId && n.role === "assistant");
    if (!kids.length) return null;
    // prefer current leaf path
    const path = pathToLeaf(chat);
    for (let i = path.length - 1; i >= 0; i--) {
      if (path[i].parentId === userNodeId && path[i].role === "assistant") return path[i];
    }
    return kids[kids.length - 1];
  }

  function showAnswerDiff(col, oldText, newText) {
    if (!col) return;
    let box = col.querySelector(".msg-diff");
    if (!box) {
      box = document.createElement("div");
      box.className = "msg-diff";
      col.appendChild(box);
    }
    box.innerHTML =
      "<div><strong>Diff</strong></div>" +
      '<div class="diff-old">' + escapeHtml(oldText || "(пусто)") + "</div>" +
      '<div class="diff-new">' + escapeHtml(newText || "(пусто)") + "</div>";
  }

  async function regenerateFromEditedUser(nodeId, newContent) {
    if (state.streaming) return;
    const chat = activeChat();
    if (!chat || !chat.nodes[nodeId]) return;
    const oldAssistant = findAssistantChild(chat, nodeId);
    const oldText = oldAssistant ? oldAssistant.content : "";
    // Branch: new user sibling under same parent with edited text
    const parentId = chat.nodes[nodeId].parentId || null;
    const userNode = addNode(chat, parentId, { role: "user", content: newContent });
    chat.updatedAt = Date.now();
    saveStore();
    renderAll();

    const apiMsgs = buildMessagesPayload(chat.messages, effectiveSystem(chat));
    const model = el.modelSelect.value || FALLBACK_MODELS[0];
    const wrap = document.createElement("div");
    wrap.className = "msg bot";
    const av = document.createElement("div");
    av.className = "avatar";
    av.textContent = "✦";
    const built = createBotColumn(model);
    wrap.appendChild(av);
    wrap.appendChild(built.col);
    el.messages.appendChild(wrap);
    const ctrl = new AbortController();
    state.abort = ctrl;
    setStreamingUI(true);
    const result = await runOneStream(model, apiMsgs, built.bubble, built.live, ctrl.signal);
    state.abort = null;
    setStreamingUI(false);
    built.bubble.innerHTML = renderMarkdown(result.content);
    bindCodeCopy(built.bubble);
    const oldMeta = built.col.querySelector(".answer-meta");
    if (oldMeta) oldMeta.remove();
    renderSources(built.col, result.sources);
    renderAnswerMeta(built.col, result);
    showAnswerDiff(built.col, oldText, result.content);
    addNode(chat, userNode.id, {
      role: "assistant",
      content: result.content,
      sources: result.sources,
      model: result.model,
      tps: result.tps,
      elapsed: result.elapsed,
      tokenParts: result.tokenParts || [],
      diffFrom: oldText || "",
    });
    saveStore();
    renderAll();
    // re-show diff after render
    setTimeout(() => {
      const lastBot = el.messages.querySelector(".msg.bot:last-of-type .msg-col");
      if (lastBot) showAnswerDiff(lastBot, oldText, result.content);
    }, 0);
  }

  function exportMarkdown() {
    const chat = activeChat();
    if (!chat || !chat.messages.length) return;
    let md = "# " + (chat.title || "Чат") + "\n\n";
    if (chat.systemPrompt) md += "> system: " + chat.systemPrompt + "\n\n";
    chat.messages.forEach((m) => {
      if (m.role === "user") md += "## Пользователь\n\n" + m.content + "\n\n";
      else if (m.compare) {
        md += "## Сравнение\n\n";
        m.compare.forEach((s) => {
          md += "### " + s.model + " (" + (s.tps || 0).toFixed?.(1) + " tok/s)\n\n" + s.content + "\n\n";
        });
      } else if (m.role === "assistant") {
        md += "## МойGPT (" + (m.model || "") + ")\n\n" + m.content + "\n\n";
      }
    });
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (chat.title || "chat").replace(/[^\wа-яё\-]+/gi, "_").slice(0, 40) + ".md";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function setupMobileGestures() {
    let startX = 0, startY = 0, tracking = false;
    document.addEventListener("touchstart", (e) => {
      if (!isMobile() || !e.touches || !e.touches[0]) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = startX < 24 || (el.sidebar && el.sidebar.classList.contains("open"));
    }, { passive: true });
    document.addEventListener("touchend", (e) => {
      if (!tracking || !isMobile()) return;
      tracking = false;
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      if (dy > 60) return;
      if (dx > 60 && startX < 40) openSidebar(true);
      if (dx < -60 && el.sidebar && el.sidebar.classList.contains("open")) openSidebar(false);
    }, { passive: true });
  }

  const exported = { regenerateAnswer, editUserNode, findAssistantChild, showAnswerDiff, regenerateFromEditedUser, exportMarkdown, setupMobileGestures };
  Object.assign(api, exported);
  return exported;
}
