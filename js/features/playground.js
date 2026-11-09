/* МойGPT feature: playground (ES module). */

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
    setChatStatsOpen, gatherChatStats, drawDayChart, drawModelPie, renderChatStats, renderNotifList, openNotifs, clearNotifs,
    pollNotifEvents, runSandboxedJs, runPerfCheck, sendFeedback, syncLocalFeedback, setupVoice, updateAttachWarn, renderAttachChips,
    readTextFile, addAttachFiles, postCorpusAdd, submitTeach, syncLocalCorpusOnce, setupAttachDnD, syncPersonaSelect, onPersonaChange,
    addPersona, setEvoOpen, renderBpcChart, regenerateAnswer, regenerateFromEditedUser
  } = api;


  let pgAbort = null;
  let pgVariants = [];
  let pgActive = 0;
  async function setPlaygroundOpen(open) {
    return setPlaygroundOpenImpl(open);
  }

  function setPlaygroundOpenImpl(open) {
    if (!el.playgroundPanel) return;
    if (open) closeOtherPanels("playground");
    el.playgroundPanel.hidden = !open;
    if (open) {
      fillModelSelect(el.pgModel, state.models && state.models.length ? state.models : FALLBACK_MODELS, el.modelSelect && el.modelSelect.value);
    }
  }

  function pgStopSeqs() {
    const raw = (el.pgStop && el.pgStop.value) || "";
    return raw.split("|").map((s) => s.replace(/\\n/g, "\n")).filter(Boolean).slice(0, 8);
  }

  function renderPgTabs() {
    if (!el.pgTabs) return;
    if (pgVariants.length <= 1) {
      el.pgTabs.hidden = true;
      el.pgTabs.innerHTML = "";
      return;
    }
    el.pgTabs.hidden = false;
    el.pgTabs.innerHTML = "";
    pgVariants.forEach((v, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pg-tab" + (i === pgActive ? " active" : "");
      b.setAttribute("role", "tab");
      const sumLp = (v.tokens || []).reduce((a, t) => a + (t.lp != null ? Number(t.lp) : Math.log(Math.max(1e-12, Number(t.p) || 1e-12))), 0);
      b.textContent = "#" + (i + 1) + " · Σlp " + Number(sumLp).toFixed(1);
      b.addEventListener("click", () => { pgActive = i; paintPgActive(); renderPgTabs(); });
      el.pgTabs.appendChild(b);
    });
  }

  function paintPgActive() {
    if (!el.pgOut) return;
    el.pgOut.innerHTML = "";
    const v = pgVariants[pgActive];
    if (!v) return;
    (v.tokens || []).forEach((t) => {
      const span = document.createElement("span");
      span.className = "pg-tok";
      span.textContent = t.text || "";
      if (t.lp != null && !isNaN(Number(t.lp))) {
        span.title = "lp=" + Number(t.lp).toFixed(4) + (t.p != null ? " · p=" + Number(t.p).toFixed(3) : "");
        if (t.p != null) span.style.background = heatColor(Number(t.p));
        const meta = document.createElement("sup");
        meta.className = "pg-lp";
        meta.textContent = Number(t.lp).toFixed(2);
        span.appendChild(meta);
      } else if (t.p != null) {
        const lp = Math.log(Math.max(1e-12, Number(t.p)));
        span.title = "p=" + Number(t.p).toFixed(3) + " · lp=" + lp.toFixed(2);
        span.style.background = heatColor(Number(t.p));
        const meta = document.createElement("sup");
        meta.className = "pg-lp";
        meta.textContent = lp.toFixed(2);
        span.appendChild(meta);
      }
      el.pgOut.appendChild(span);
    });
    if (el.pgNBestOut) {
      el.pgNBestOut.innerHTML = "";
      el.pgNBestOut.className = "pg-variants";
      pgVariants.forEach((vv, i) => {
        const card = document.createElement("div");
        card.className = "pg-variant" + (i === pgActive ? " active" : "");
        const sumLp = (vv.tokens || []).reduce((a, t) => a + (t.lp != null ? Number(t.lp) : 0), 0);
        card.innerHTML = "<h4>#" + Number(i + 1) + " · Σlp " + Number(sumLp).toFixed(2) + "</h4>";
        const pre = document.createElement("pre");
        pre.textContent = vv.text || "(пусто)";
        card.appendChild(pre);
        card.addEventListener("click", () => { pgActive = i; paintPgActive(); renderPgTabs(); });
        el.pgNBestOut.appendChild(card);
      });
    }
  }

  async function runPlaygroundViaNext(prompt0, model, steps, nBest, stops) {
    // fallback loop using /api/next
    const branches = [];
    for (let b = 0; b < nBest; b++) branches.push({ text: prompt0, tokens: [], dead: false });
    for (let step = 0; step < steps; step++) {
      if (pgAbort.signal.aborted) break;
      let anyAlive = false;
      for (let bi = 0; bi < branches.length; bi++) {
        const br = branches[bi];
        if (br.dead) continue;
        anyAlive = true;
        const res = await fetch(url(API.next), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: pgAbort.signal,
          body: JSON.stringify({
            prompt: br.text,
            model: model,
            top_k: Math.max(nBest + 2, 8),
            temperature: Number(el.tempSlider && el.tempSlider.value) || 0.8,
          }),
        });
        if (!res.ok) throw new Error("next " + res.status);
        const data = await res.json();
        const cands = (data.candidates || []).slice();
        cands.sort((a, b) => Number(b.p || 0) - Number(a.p || 0));
        const pick = cands[Math.min(bi, cands.length - 1)] || cands[0];
        if (!pick) { br.dead = true; continue; }
        const p = Number(pick.p || 0);
        const lp = Math.log(Math.max(1e-12, p));
        br.text += pick.text || "";
        br.tokens.push({ text: pick.text || "", p: p, lp: lp });
        // stop check on completion part
        const gen = br.text.slice(prompt0.length);
        for (let si = 0; si < stops.length; si++) {
          const s = stops[si];
          const idx = gen.indexOf(s);
          if (idx >= 0) {
            br.text = prompt0 + gen.slice(0, idx);
            br.dead = true;
            break;
          }
        }
      }
      if (!anyAlive) break;
      pgVariants = branches.map((br) => ({ text: br.text.slice(prompt0.length), tokens: br.tokens.slice() }));
      pgActive = 0;
      paintPgActive();
      renderPgTabs();
    }
    pgVariants = branches.map((br) => ({ text: br.text.slice(prompt0.length), tokens: br.tokens.slice() }));
  }

  async function runPlayground() {
    if (!el.pgPrompt || !el.pgOut) return;
    const prompt0 = el.pgPrompt.value || "";
    if (!prompt0.trim()) return;
    const model = (el.pgModel && el.pgModel.value) || "mygpt-latest";
    const maxTok = Math.min(4096, Math.max(1, Number(el.pgSteps && el.pgSteps.value) || 64));
    const nBest = Math.min(4, Math.max(1, Number(el.pgNBest && el.pgNBest.value) || 1));
    const stops = pgStopSeqs();
    el.pgOut.textContent = "";
    if (el.pgNBestOut) el.pgNBestOut.innerHTML = "";
    if (el.pgTabs) { el.pgTabs.hidden = true; el.pgTabs.innerHTML = ""; }
    if (el.pgStatus) el.pgStatus.textContent = "streaming /api/chat raw…";
    if (el.btnPgRun) el.btnPgRun.disabled = true;
    if (el.btnPgStop) el.btnPgStop.hidden = false;
    pgAbort = new AbortController();
    pgVariants = [];
    for (let i = 0; i < nBest; i++) pgVariants.push({ text: "", tokens: [] });
    pgActive = 0;
    try {
      const body = {
        messages: [{ role: "user", content: prompt0 }],
        model: model,
        max_new_tokens: maxTok,
        temperature: Number(el.tempSlider && el.tempSlider.value) || 0.8,
        top_k: Number(el.topkSlider && el.topkSlider.value) || 50,
        top_p: Number(el.toppSlider && el.toppSlider.value) || 0.95,
        repetition_penalty: Number(el.repSlider && el.repSlider.value) || 1.15,
        use_rag: false,
        raw: true,
        stop: stops,
        n: nBest,
      };
      const res = await fetch(url(API.chat), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: pgAbort.signal,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("chat " + res.status);
      await consumeStream(
        res,
        (t) => {
          if (!pgVariants[0]) pgVariants[0] = { text: "", tokens: [] };
          pgVariants[0].text = t;
          if (pgActive === 0) paintPgActive();
        },
        () => {},
        (part) => {
          const i = part.i != null ? Number(part.i) : 0;
          if (!pgVariants[i]) pgVariants[i] = { text: "", tokens: [] };
          pgVariants[i].tokens.push({ text: part.text, p: part.p, lp: part.lp });
          if (i !== 0) pgVariants[i].text = (pgVariants[i].text || "") + (part.text || "");
          if (i === pgActive) paintPgActive();
          renderPgTabs();
        },
        (ev, data) => {
          if (ev === "end" && data && data.i != null) {
            renderPgTabs();
            paintPgActive();
          }
          if (ev === "variant" && data) {
            const i = Number(data.i);
            if (!pgVariants[i]) pgVariants[i] = { text: "", tokens: [] };
            pgVariants[i].text = data.text || "";
          }
        }
      );
      // ensure texts from tokens
      pgVariants.forEach((v) => {
        if (!v.text && v.tokens && v.tokens.length) v.text = v.tokens.map((t) => t.text || "").join("");
      });
      paintPgActive();
      renderPgTabs();
      if (el.pgStatus) el.pgStatus.textContent = "готово · n=" + pgVariants.length;
    } catch (err) {
      if (err.name === "AbortError") {
        if (el.pgStatus) el.pgStatus.textContent = "стоп";
      } else {
        if (el.pgStatus) el.pgStatus.textContent = "fallback /api/next: " + (err.message || err);
        try {
          await runPlaygroundViaNext(prompt0, model, Math.min(64, maxTok), nBest, stops);
          paintPgActive();
          renderPgTabs();
          if (el.pgStatus) el.pgStatus.textContent = "fallback /api/next готово";
        } catch (err2) {
          const msg = document.createElement("div");
          msg.className = "eval-note";
          msg.textContent = "Playground: " + (err2.message || err2);
          el.pgOut.appendChild(msg);
        }
      }
    } finally {
      if (el.btnPgRun) el.btnPgRun.disabled = false;
      if (el.btnPgStop) el.btnPgStop.hidden = true;
      pgAbort = null;
    }
  }

  function stopPlayground() {
    if (pgAbort) pgAbort.abort();
  }

  const exported = { setPlaygroundOpen, setPlaygroundOpenImpl, pgStopSeqs, renderPgTabs, paintPgActive, runPlaygroundViaNext, runPlayground, stopPlayground };
  Object.assign(api, exported);
  return exported;
}
