/* МойGPT feature: notifications (ES module). */

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
    createFolder, cmdActions, renderCmdList, openCmdPalette, openMsgSearch, highlightMsgSnippet, runMsgSearch, renderSftList,
    exportSftJsonl, uniqueSourcesFromHits, renderDatasetChips, renderDatasetList, openDatasetDoc, runDatasetSearch, addCurrentDocToSft, setDatasetOpen,
    setDatasetOpenImpl, buildStandaloneHtml, shareChatHtml, shareChatPng, roundRect, wrapText, exportHtml, openThemeBuilder,
    ensureSimilarWorker, requestSimilarChats, renderSimilarList, updateTokenBudget, scheduleTokenBudget, setModelCardOpen, fillModelCardSelect, matchEvalRow,
    refreshModelCard, appendToolCard, runChatTool, evoModels, loadEvoBpcMap, runEvolution, stopEvolution, setChatStatsOpen,
    gatherChatStats, drawDayChart, drawModelPie, renderChatStats, setPlaygroundOpen, setPlaygroundOpenImpl, pgStopSeqs, renderPgTabs,
    paintPgActive, runPlaygroundViaNext, runPlayground, stopPlayground, runSandboxedJs, runPerfCheck, sendFeedback, syncLocalFeedback,
    setupVoice, updateAttachWarn, renderAttachChips, readTextFile, addAttachFiles, postCorpusAdd, submitTeach, syncLocalCorpusOnce,
    setupAttachDnD, syncPersonaSelect, onPersonaChange, addPersona, setEvoOpen, renderBpcChart, regenerateAnswer, regenerateFromEditedUser
  } = api;


  let notifPollTimer = null;
  let notifSnap = { ckpt: null, evalSig: null, corpusSig: null };
  function renderNotifList() {
    if (!el.notifList) return;
    el.notifList.innerHTML = "";
    const items = state.notifs || [];
    if (el.notifEmpty) el.notifEmpty.hidden = items.length > 0;
    items.forEach((n) => {
      const li = document.createElement("li");
      if (!n.read) li.className = "unread";
      const t = new Date(n.ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      li.innerHTML = '<span class="n-time">' + escapeHtml(t) + '</span><span class="n-type">' + escapeHtml(n.type) + "</span>" + escapeHtml(n.text || "");
      li.addEventListener("click", () => {
        n.read = true;
        saveNotifs();
        renderNotifBadge();
        renderNotifList();
      });
      el.notifList.appendChild(li);
    });
  }

  function openNotifs() {
    if (!el.notifOverlay) return;
    renderNotifList();
    openOverlay(el.notifOverlay);
  }

  function clearNotifs() {
    state.notifs = [];
    saveNotifs();
    renderNotifBadge();
    renderNotifList();
  }

  async function pollNotifEvents() {
    try {
      const stRes = await fetch(url(API.stats), { cache: "no-store" });
      if (stRes.ok) {
        const st = await stRes.json();
        const t = st.train || st;
        const ck = t.checkpoint || t.ckpt || (t.step != null ? "step_" + t.step : null);
        if (ck && notifSnap.ckpt && ck !== notifSnap.ckpt) pushNotif("checkpoint", "Новый checkpoint: " + ck);
        if (ck) notifSnap.ckpt = ck;
      }
    } catch (e) {}
    try {
      const evRes = await fetch(url(API.eval) + "?latest_only=true", { cache: "no-store" });
      if (evRes.ok) {
        const data = await evRes.json();
        const rows = Array.isArray(data) ? data : (data.results || data.rows || []);
        const sig = rows.map((r) => (r.ckpt || "") + ":" + (r.bpc != null ? Number(r.bpc).toFixed(4) : "")).join("|");
        if (notifSnap.evalSig && sig && sig !== notifSnap.evalSig) pushNotif("eval", "Обновлены метрики eval (" + Number(rows.length) + ")");
        if (sig) notifSnap.evalSig = sig;
      }
    } catch (e) {}
    try {
      const cRes = await fetch(url(API.corpusStats), { cache: "no-store" });
      if (cRes.ok) {
        const st = await cRes.json();
        const built = (st.build && st.build.built_at) || st.ts || "";
        const kept = (st.build && st.build.kept) || (st.clean && st.clean["corpus.jsonl"] && st.clean["corpus.jsonl"].docs) || "";
        const sig = String(built) + ":" + String(kept);
        if (notifSnap.corpusSig && sig && sig !== notifSnap.corpusSig) pushNotif("corpus", "Пересборка корпуса · kept " + kept);
        if (sig) notifSnap.corpusSig = sig;
      }
    } catch (e) {}
    try {
      const mRes = await fetch(url(API.models), { cache: "no-store" });
      if (mRes.ok) {
        const data = await mRes.json();
        const names = Array.isArray(data) ? data : (data.models || []);
        const list = names.map((x) => (typeof x === "string" ? x : x.name || x.id)).filter(Boolean);
        const sfts = list.filter((n) => /_sft$/i.test(String(n)));
        const prev = state._knownSft || [];
        const fresh = sfts.filter((n) => prev.indexOf(n) < 0);
        if (fresh.length && prev.length) {
          const sft = fresh[0];
          const base = String(sft).replace(/_sft$/i, "");
          pushNotif("model", "Новая модель: " + sft);
          if (typeof showAppToast === "function") {
            showAppToast("Новая модель", sft + " · vs " + base, {
              actionLabel: "Сравнить в арене",
              onAction: () => {
                if (typeof compareSftInArena === "function") compareSftInArena(sft);
                else ensureFeat("arena").then((a) => { if (a && a.compareSftInArena) a.compareSftInArena(sft); });
              },
            });
          }
        }
        state._knownSft = sfts.slice();
      }
    } catch (e) {}
  }

  const exported = { renderNotifList, openNotifs, clearNotifs, pollNotifEvents };
  Object.assign(api, exported);
  return exported;
}
