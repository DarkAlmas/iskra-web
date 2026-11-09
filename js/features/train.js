/* МойGPT feature: train (ES module). */

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
    lazyBindTab, registerTabFn, tabFn, parseTs, dedupeEvalRows, bestBpcIndex, renderEvalBars, collectCats,
    fillCatFilter, renderEvalQaDetail, renderEvalTable, applyEvalCatFilter, loadEval, setEvalOpen, setEvalOpenImpl, fillEvalDiffSelects,
    qaCatBreakdown, renderQaCatPills, renderEvalDiff, smoothSeries, formatEta, maybeNotifyCkpt, highlightSnippet, runCorpusSearch,
    setCorpusOpen, corpusSourceLabel, corpusSourcesFromStats, recordCorpusGrowth, drawDonut, drawGrowth, formatChars, loadDashCorpusExtra,
    fmtNum, refreshDashboard, setDashOpen, setDashOpenImpl, runTokenize, runNextProbs, setLabOpen, updateConfToggleState,
    trapFocus, releaseFocusTrap, renderEloTable, setEloOpen, setArenaOpen, setArenaOpenImpl, runArena, stopArena,
    voteArena, openExplain, explainStep, renderExplainBars, pickExplainCand, explainNextTop, explainAutoToggle, explainReset,
    modelGroup, fillModelSelectGrouped, pickDistinctModels, applyArenaPair, compareSftInArena, ensureArenaDistinct, startTour, endTour,
    renderTour, openWorkspace, exportWorkspace, importWorkspaceFile, openPrompts, renderPromptsList, hideSlashPopup, showSlashPopup,
    applySlashPrompt, onInputSlash, createFolder, cmdActions, renderCmdList, openCmdPalette, openMsgSearch, highlightMsgSnippet,
    runMsgSearch, renderSftList, exportSftJsonl, uniqueSourcesFromHits, renderDatasetChips, renderDatasetList, openDatasetDoc, runDatasetSearch,
    addCurrentDocToSft, setDatasetOpen, setDatasetOpenImpl, buildStandaloneHtml, shareChatHtml, shareChatPng, roundRect, wrapText,
    exportHtml, openThemeBuilder, ensureSimilarWorker, requestSimilarChats, renderSimilarList, updateTokenBudget, scheduleTokenBudget, setModelCardOpen,
    fillModelCardSelect, matchEvalRow, refreshModelCard, appendToolCard, runChatTool, evoModels, loadEvoBpcMap, runEvolution,
    stopEvolution, setChatStatsOpen, gatherChatStats, drawDayChart, drawModelPie, renderChatStats, setPlaygroundOpen, setPlaygroundOpenImpl,
    pgStopSeqs, renderPgTabs, paintPgActive, runPlaygroundViaNext, runPlayground, stopPlayground, renderNotifList, openNotifs,
    clearNotifs, pollNotifEvents, runSandboxedJs, runPerfCheck, sendFeedback, syncLocalFeedback, setupVoice, updateAttachWarn,
    renderAttachChips, readTextFile, addAttachFiles, postCorpusAdd, submitTeach, syncLocalCorpusOnce, setupAttachDnD, syncPersonaSelect,
    onPersonaChange, addPersona, setEvoOpen, renderBpcChart, regenerateAnswer, regenerateFromEditedUser
  } = api;


  function drawLossChart(history) {
    const canvas = el.lossChart;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 640;
    const cssH = 180;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--code-bg").trim() || "#0a1018";
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#3dd6c6";
    const muted = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() || "#8b9bb0";
    const border = getComputedStyle(document.documentElement).getPropertyValue("--border").trim() || "#2a3544";
    const spark = getComputedStyle(document.documentElement).getPropertyValue("--spark").trim() || "#f0a030";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cssW, cssH);
    if (!history || history.length < 2) {
      ctx.fillStyle = muted;
      ctx.font = "12px sans-serif";
      ctx.fillText("мало точек для графика", 12, 24);
      return;
    }
    const pad = 28;
    const raw = history.map((h) => Number(typeof h === "number" ? h : h.loss != null ? h.loss : h.train_loss));
    const win = Number((el.smoothSlider && el.smoothSlider.value) || state.lossSmooth || 1);
    state.lossSmooth = win;
    if (el.smoothVal) el.smoothVal.textContent = String(win);
    const vals = (typeof smoothSeries === "function") ? smoothSeries(raw, win) : raw;
    const min = Math.min.apply(null, vals.concat(raw));
    const max = Math.max.apply(null, vals.concat(raw));
    const span = max - min || 1;
    ctx.strokeStyle = border;
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, cssH - pad);
    ctx.lineTo(cssW - 8, cssH - pad);
    ctx.stroke();
    function strokeLine(series, color, width, alpha) {
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      series.forEach((v, i) => {
        const x = pad + (i / (series.length - 1)) * (cssW - pad - 8);
        const y = cssH - pad - ((v - min) / span) * (cssH - pad * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    strokeLine(raw, muted, 1, 0.35);
    strokeLine(vals, accent, 2, 1);
    // end marker
    const last = vals[vals.length - 1];
    const lx = pad + (cssW - pad - 8);
    const ly = cssH - pad - ((last - min) / span) * (cssH - pad * 2);
    ctx.fillStyle = spark;
    ctx.beginPath();
    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function normalizeTrain(data) {
    const t = data && data.train && typeof data.train === "object" ? Object.assign({}, data, data.train) : data || {};
    const loss = t.loss != null ? t.loss : t.train_loss;
    let history = t.loss_history || t.history || t.losses || null;
    if (!history && loss != null) {
      state.lossHistory.push({ loss: Number(loss), t: Date.now() });
      if (state.lossHistory.length > 60) state.lossHistory.shift();
      history = state.lossHistory.slice();
    } else if (history) state.lossHistory = history.slice(-60);
    return {
      step: t.step != null ? t.step : t.global_step,
      total: t.total != null ? t.total : t.max_steps,
      loss: loss,
      val_loss: t.val_loss != null ? t.val_loss : t.val,
      ppl: t.ppl != null ? t.ppl : t.perplexity,
      tokens_per_sec: t.tokens_per_sec != null ? t.tokens_per_sec : t.tps,
      checkpoint: t.checkpoint || t.ckpt || t.run,
      history: history,
      corpus_bytes: data && data.corpus_bytes,
      chunks: data && data.chunks,
      model: data && data.model,
      raw: data,
    };
  }

  async function pollTrain() {
    try {
      const { res } = await fetchFirstOk([API.stats, API.fallback.stats], { cache: "no-store" });
      if (!res.ok) throw new Error("stats");
      const data = await res.json();
      const n = normalizeTrain(data);
      const cells = [];
      function cell(label, val) {
        if (val == null || val === "") return;
        cells.push("<div>" + escapeHtml(label) + "<strong>" + escapeHtml(String(val)) + "</strong></div>");
      }
      cell("step", n.step != null ? n.step + (n.total != null ? " / " + n.total : "") : null);
      cell("loss", n.loss != null ? Number(n.loss).toFixed(4) : null);
      cell("val_loss", n.val_loss != null ? Number(n.val_loss).toFixed(4) : null);
      cell("ppl", n.ppl != null ? Number(n.ppl).toFixed(2) : null);
      // derive tok/s if missing
      let tps = n.tokens_per_sec;
      const tokensSeen = (data && data.tokens_seen != null) ? Number(data.tokens_seen) : null;
      const now = Date.now();
      if ((tps == null || !isFinite(Number(tps))) && tokensSeen != null && state.lastTokensSeen != null && state.lastTrainPollAt) {
        const dt = (now - state.lastTrainPollAt) / 1000;
        if (dt > 0) tps = (tokensSeen - state.lastTokensSeen) / dt;
      }
      if (tokensSeen != null) {
        state.lastTokensSeen = tokensSeen;
        state.lastTrainPollAt = now;
      }
      cell("tok/s", tps != null && isFinite(Number(tps)) ? Number(tps).toFixed(1) : null);
      cell("ckpt", n.checkpoint);
      cell("chunks", n.chunks != null ? Number(n.chunks) : (data && data.rag_chunks != null ? Number(data.rag_chunks) : null));
      cell("корпус", n.corpus_bytes != null ? (n.corpus_bytes / 1e6).toFixed(1) + " МБ" : null);
      cell("модель", n.model === true ? "да" : n.model === false ? "нет" : n.model);
      // ETA
      let etaStr = "—";
      if (n.step != null && n.total != null && Number(n.total) > Number(n.step)) {
        const left = Number(n.total) - Number(n.step);
        // estimate sec/step from history length heuristics or tokens
        let secPerStep = null;
        if (tps && data && data.config && data.config.block_size) {
          const tokPerStep = Number(data.config.block_size) || 256;
          secPerStep = tokPerStep / Math.max(1, Number(tps));
        } else if (state._trainStepAt && state._trainStepAt.step != null) {
          const dStep = Number(n.step) - Number(state._trainStepAt.step);
          const dSec = (now - state._trainStepAt.at) / 1000;
          if (dStep > 0 && dSec > 0) secPerStep = dSec / dStep;
        }
        state._trainStepAt = { step: Number(n.step), at: now };
        if (secPerStep) etaStr = (typeof formatEta === "function") ? formatEta(left * secPerStep) : Math.round(left * secPerStep) + "s";
      }
      if (el.trainEta) el.trainEta.textContent = etaStr;
      if (el.trainTps) el.trainTps.textContent = tps != null && isFinite(Number(tps)) ? Number(tps).toFixed(1) : "—";
      if (el.trainCkptLive) el.trainCkptLive.textContent = n.checkpoint ? String(n.checkpoint).split("/").slice(-2).join("/") : "—";
      if (typeof maybeNotifyCkpt === "function") maybeNotifyCkpt(n.checkpoint || (n.step != null ? ("step_" + n.step) : null));
      if (!cells.length) {
        el.trainEmpty.hidden = false;
        el.trainBody.hidden = true;
        return;
      }
      el.trainEmpty.hidden = true;
      el.trainBody.hidden = false;
      el.trainStats.innerHTML = cells.join("");
      renderTrainSamples((data && data.samples) || (n.raw && n.raw.samples) || []);
      drawLossChart(n.history || []);
    } catch (_) {
      el.trainEmpty.hidden = false;
      el.trainEmpty.textContent = "нет данных";
      el.trainBody.hidden = true;
    }
  }

  function setTrainOpen(open) {
    el.trainPanel.hidden = !open;
    if (open) {
      closeOtherPanels("train");
      el.trainPanel.hidden = false;
      pollTrain();
      if (state.trainTimer) clearInterval(state.trainTimer);
      state.trainTimer = setInterval(pollTrain, 5000);
    } else if (state.trainTimer) {
      clearInterval(state.trainTimer);
      state.trainTimer = null;
    }
  }

  async function resumeTrain() {
    el.trainMsg.hidden = true;
    try {
      const { res } = await fetchFirstOk([API.train, API.fallback.train, "/train/resume"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (res.status === 404) {
        el.trainMsg.hidden = false;
        el.trainMsg.className = "train-msg warn";
        el.trainMsg.textContent = "Дообучить: эндпоинт ещё не готов (404)";
        return;
      }
      const data = await res.json().catch(() => ({}));
      el.trainMsg.hidden = false;
      el.trainMsg.className = "train-msg";
      el.trainMsg.textContent = data.started
        ? "Обучение запущено (pid " + (data.pid || "?") + ")"
        : data.running
          ? "Уже идёт (pid " + (data.pid || "?") + ")"
          : JSON.stringify(data);
      pollTrain();
    } catch (_) {
      el.trainMsg.hidden = false;
      el.trainMsg.className = "train-msg warn";
      el.trainMsg.textContent = "Не удалось вызвать /api/train";
    }
  }

  function renderTrainSamples(samples) {
    if (!el.trainSamples || !el.trainSamplesList) return;
    if (!Array.isArray(samples) || !samples.length) {
      el.trainSamples.hidden = true;
      el.trainSamplesList.innerHTML = "";
      return;
    }
    el.trainSamples.hidden = false;
    el.trainSamplesList.innerHTML = "";
    samples
      .slice()
      .sort((a, b) => (a.step || 0) - (b.step || 0))
      .forEach((s) => {
        const li = document.createElement("li");
        const prompt = s.prompt ? escapeHtml(String(s.prompt)) + " → " : "";
        li.innerHTML = '<span class="tl-step">step ' + escapeHtml(String(s.step != null ? Number(s.step) : "?")) + "</span>" + escapeHtml(prompt) + escapeHtml((s.text || "").slice(0, 220));
        el.trainSamplesList.appendChild(li);
      });
  }

  const exported = { drawLossChart, normalizeTrain, pollTrain, setTrainOpen, resumeTrain, renderTrainSamples };
  Object.assign(api, exported);
  return exported;
}
