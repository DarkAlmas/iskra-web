/* МойGPT feature: dashboard (ES module). */

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


  function corpusSourceLabel(key) {
    const k = String(key || "").replace(/^kept:/, "");
    const map = {
      "fineweb2_ru.jsonl": "fineweb",
      "wiki_ru.jsonl": "wiki",
      "pc_wiki.txt": "wiki",
      "pc_wikisource.txt": "wikisource",
      "rss_ru.jsonl": "rss",
      "wiki_fresh.jsonl": "wiki_fresh",
      "wikinews_ru.jsonl": "wikinews",
    };
    if (map[k]) return map[k];
    return k.replace(/\.jsonl$/i, "").replace(/\.txt$/i, "").replace(/^pc_/, "");
  }

  function corpusSourcesFromStats(stats, corpusExtra) {
    const out = {};
    // Prefer build['kept:<file>'] doc counts (Hack Bot clean stats)
    const build = (corpusExtra && corpusExtra.build) || null;
    if (build && typeof build === "object") {
      Object.keys(build).forEach((k) => {
        if (k.indexOf("kept:") === 0) {
          const label = corpusSourceLabel(k);
          out[label] = (out[label] || 0) + (Number(build[k]) || 0);
        }
      });
      if (Object.keys(out).length) return out;
    }
    // Fallback: sources.*.bytes (docs may be null for .txt)
    const sourcesObj = (corpusExtra && corpusExtra.sources) || (stats && stats.sources) || null;
    if (sourcesObj && typeof sourcesObj === "object") {
      Object.keys(sourcesObj).forEach((k) => {
        const ent = sourcesObj[k] || {};
        const bytes = Number(ent.bytes) || 0;
        const docs = ent.docs != null ? Number(ent.docs) : null;
        const label = corpusSourceLabel(k);
        out[label] = (out[label] || 0) + (bytes > 0 ? bytes : docs || 0);
      });
      if (Object.keys(out).length) return out;
    }
    const corpus = (stats && stats.corpus) || (corpusExtra && !corpusExtra.sources ? corpusExtra : {}) || {};
    Object.keys(corpus).forEach((k) => {
      if (k.indexOf("kept:") === 0) {
        const label = corpusSourceLabel(k);
        out[label] = (out[label] || 0) + Number(corpus[k] || 0);
      }
    });
    if (!Object.keys(out).length) {
      const mix = (stats && stats.data_mix) || {};
      Object.keys(mix).forEach((k) => {
        const label = corpusSourceLabel(k);
        out[label] = (out[label] || 0) + Number((mix[k] && mix[k].docs) || 0);
      });
    }
    return out;
  }

  function recordCorpusGrowth(stats, corpusExtra) {
    const clean = (corpusExtra && corpusExtra.clean && corpusExtra.clean["corpus.jsonl"]) || {};
    const corpus = (stats && stats.corpus) || {};
    const docs = Number(
      clean.docs != null
        ? clean.docs
        : corpus.kept != null
          ? corpus.kept
          : stats && stats.docs != null
            ? stats.docs
            : 0
    );
    const chars = Number(
      corpusExtra && corpusExtra.raw_bytes != null
        ? corpusExtra.raw_bytes
        : clean.bytes != null
          ? clean.bytes
          : corpus.chars != null
            ? corpus.chars
            : stats && stats.corpus_bytes != null
              ? stats.corpus_bytes
              : 0
    );
    let hist = [];
    try {
      hist = JSON.parse(localStorage.getItem(CORPUS_GROWTH_KEY) || "[]");
    } catch (_) {
      hist = [];
    }
    if (!Array.isArray(hist)) hist = [];
    const last = hist[hist.length - 1];
    const now = Date.now();
    if (!last || last.docs !== docs || last.chars !== chars || now - last.ts > 60 * 60 * 1000) {
      hist.push({ ts: now, docs: docs, chars: chars });
    }
    hist = hist.slice(-60);
    localStorage.setItem(CORPUS_GROWTH_KEY, JSON.stringify(hist));
    return hist;
  }

  function drawDonut(canvas, sources) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const entries = Object.keys(sources).map((k) => ({ k: k, v: sources[k] })).filter((e) => e.v > 0);
    const total = entries.reduce((s, e) => s + e.v, 0) || 1;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 8;
    let a0 = -Math.PI / 2;
    entries.forEach((e, i) => {
      const a1 = a0 + (e.v / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a0, a1);
      ctx.closePath();
      ctx.fillStyle = DONUT_COLORS[i % DONUT_COLORS.length];
      ctx.fill();
      a0 = a1;
    });
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--surface2").trim() || "#121820";
    ctx.fill();
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text").trim() || "#e8eef5";
    ctx.font = "12px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(total), cx, cy);
  }

  function drawGrowth(canvas, hist) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--border").trim() || "#2a3544";
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    if (!hist || hist.length < 1) {
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() || "#8b9bb0";
      ctx.font = "12px system-ui";
      ctx.fillText("пока нет истории — откройте панель позже", 12, h / 2);
      return;
    }
    const vals = hist.map((x) => Number(x.chars) || Number(x.docs) || 0);
    const minV = Math.min.apply(null, vals);
    const maxV = Math.max.apply(null, vals);
    const span = Math.max(1, maxV - minV);
    ctx.beginPath();
    hist.forEach((pt, i) => {
      const x = 8 + (i / Math.max(1, hist.length - 1)) * (w - 16);
      const y = h - 10 - ((Number(pt.chars) || Number(pt.docs) || 0) - minV) / span * (h - 20);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#3dd6c6";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function formatChars(n) {
    n = Number(n) || 0;
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return String(n);
  }

  async function loadDashCorpusExtra() {
    if (state.corpusStatsMissing) return null;
    try {
      const res = await fetch(url(API.corpusStats));
      if (res.status === 404 || res.status === 405) {
        state.corpusStatsMissing = true;
        return null;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch (_) {
      return null;
    }
  }

  function fmtNum(n) {
    if (n == null || n === "") return "—";
    const v = Number(n);
    if (!isFinite(v)) return escapeHtml(String(n));
    return String(v);
  }

  async function refreshDashboard() {
    if (!el.dashPanel || el.dashPanel.hidden) return;
    let stats = {};
    let health = {};
    let evalRows = [];
    try {
      const paths = state.resolved.stats ? [state.resolved.stats] : [API.stats, API.fallback.stats];
      for (const path of paths) {
        try {
          const res = await fetch(url(path));
          if (res.status === 404) continue;
          if (res.ok) {
            stats = await res.json();
            state.resolved.stats = path;
            break;
          }
        } catch (_) {}
      }
    } catch (_) {}
    try {
      const hr = await fetch(url(state.resolved.health || API.health));
      if (hr.ok) health = await hr.json();
    } catch (_) {}
    try {
      const er = await fetch(url(API.eval) + "?latest_only=true");
      if (er.ok) {
        const data = await er.json();
        evalRows = Array.isArray(data) ? data : data.rows || [];
      }
    } catch (_) {}
    const extra = await loadDashCorpusExtra();
    const corpusFallback = stats.corpus || {};
    const cleanDocs =
      extra && extra.clean && extra.clean["corpus.jsonl"] && extra.clean["corpus.jsonl"].docs != null
        ? Number(extra.clean["corpus.jsonl"].docs)
        : corpusFallback.kept != null
          ? Number(corpusFallback.kept)
          : null;
    const rawBytes =
      extra && extra.raw_bytes != null
        ? Number(extra.raw_bytes)
        : corpusFallback.chars != null
          ? Number(corpusFallback.chars)
          : null;
    const ragChunks =
      extra && extra.rag_chunks != null
        ? Number(extra.rag_chunks)
        : stats.rag_chunks != null
          ? Number(stats.rag_chunks)
          : health.chunks != null
            ? Number(health.chunks)
            : null;
    const userAdd = extra && extra.user_add != null ? Number(extra.user_add) : null;
    const tsVal = extra && extra.ts != null ? Number(extra.ts) : null;
    if (el.dashCorpusMeta) {
      el.dashCorpusMeta.innerHTML =
        "<div><strong>документов (clean):</strong> " +
        fmtNum(cleanDocs) +
        "</div><div><strong>raw_bytes:</strong> " +
        (rawBytes != null ? formatChars(rawBytes) : "—") +
        "</div><div><strong>RAG чанки:</strong> " +
        fmtNum(ragChunks) +
        "</div><div><strong>user_add:</strong> " +
        fmtNum(userAdd) +
        "</div><div><strong>ts:</strong> " +
        (tsVal != null ? fmtNum(tsVal) : "—") +
        "</div>";
    }
    const sources = corpusSourcesFromStats(stats, extra);
    drawDonut(el.dashDonut, sources);
    if (el.dashLegend) {
      el.dashLegend.innerHTML = "";
      Object.keys(sources).forEach((k, i) => {
        const li = document.createElement("li");
        li.innerHTML =
          '<span class="dash-swatch" style="background:' +
          DONUT_COLORS[i % DONUT_COLORS.length] +
          '"></span>' +
          escapeHtml(k) +
          " · " +
          fmtNum(sources[k]);
        el.dashLegend.appendChild(li);
      });
    }
    const hist = recordCorpusGrowth(stats, extra);
    drawGrowth(el.dashGrowth, hist);

    // Очистка card — only if scrub/dup fields present (build.* or flat)
    const build = (extra && extra.build) || (extra && !extra.sources ? extra : null) || corpusFallback;
    const scrubKeys = ["<EMAIL>", "<PHONE>", "<CARD>", "<SNILS>", "secret", "dup_near", "dup_exact"];
    const hasScrub = build && scrubKeys.some((k) => build[k] != null);
    if (el.dashScrubCard) {
      el.dashScrubCard.hidden = !hasScrub;
      if (hasScrub && el.dashScrub) {
        const rows = [];
        scrubKeys.forEach((k) => {
          if (build[k] != null) rows.push("<div><strong>" + escapeHtml(k) + ":</strong> " + fmtNum(build[k]) + "</div>");
        });
        if (build.built_at != null) rows.push("<div><strong>built_at:</strong> " + escapeHtml(String(build.built_at)) + "</div>");
        if (build.kept != null) rows.push("<div><strong>kept:</strong> " + fmtNum(build.kept) + "</div>");
        el.dashScrub.textContent = "";
        el.dashScrub.innerHTML = rows.join("");
      }
    }

    if (el.dashHealth) {
      const ok = health.ok != null ? health.ok : health.model;
      el.dashHealth.innerHTML =
        "<div><strong>статус:</strong> " +
        (ok ? "ok" : "нет данных") +
        "</div><div><strong>модель:</strong> " +
        (health.model || stats.model_loaded ? "загружена" : "—") +
        "</div><div><strong>чанки:</strong> " +
        fmtNum(health.chunks) +
        "</div>";
    }

    if (el.dashCkpts) {
      el.dashCkpts.innerHTML = "";
      const rows = evalRows.slice().sort((a, b) => (b.step || 0) - (a.step || 0));
      if (!rows.length && stats.step != null) {
        rows.push({
          ckpt: stats.run || "current",
          step: stats.step,
          params_M: stats.params_M,
          bpc: null,
        });
      }
      if (!rows.length) {
        const li = document.createElement("li");
        li.textContent = "нет чекпоинтов";
        el.dashCkpts.appendChild(li);
      } else {
        rows.slice(0, 8).forEach((r) => {
          const li = document.createElement("li");
          const title = document.createElement("div");
          title.innerHTML = "<strong>" + escapeHtml(String(r.ckpt || r.run || "ckpt")) + "</strong>";
          const meta = document.createElement("div");
          meta.style.color = "var(--muted)";
          meta.textContent =
            "step " +
            (r.step != null ? r.step : "?") +
            (r.params_M != null ? " · " + r.params_M + "M" : "") +
            (r.bpc != null ? " · bpc " + Number(r.bpc).toFixed(4) : "");
          li.appendChild(title);
          li.appendChild(meta);
          el.dashCkpts.appendChild(li);
        });
      }
    }

    if (el.dashTrainLog) {
      const losses = stats.losses || {};
      const train = stats.train || {};
      const line =
        stats.train_log_line ||
        (losses.time
          ? JSON.stringify({
              step: losses.step != null ? losses.step : stats.step,
              loss: losses.train != null ? losses.train : stats.train_loss,
              val_loss: losses.val != null ? losses.val : stats.val_loss,
              lr: losses.lr,
              time: losses.time,
              run: stats.run,
            })
          : JSON.stringify({
              step: train.step != null ? train.step : stats.step,
              loss: train.loss != null ? train.loss : stats.loss,
              val_loss: train.val_loss != null ? train.val_loss : stats.val_loss,
              tokens: train.tokens,
            }));
      el.dashTrainLog.textContent = typeof line === "string" ? line : JSON.stringify(line);
    }
    if (el.dashUpdated) {
      el.dashUpdated.textContent = stats.updated ? "обновлено " + stats.updated : "сейчас";
    }
  }

  async function setDashOpen(open) {
    return setDashOpenImpl(open);
  }

  function setDashOpenImpl(open) {
    if (!el.dashPanel) return;
    el.dashPanel.hidden = !open;
    if (open) {
      closeOtherPanels("dash");
      if (!el.dashPanel.querySelector(".skeleton")) {
        const sk = document.createElement("div"); sk.className = "skeleton"; sk.setAttribute("aria-busy", "true");
        for (let i = 0; i < 4; i++) { const l = document.createElement("div"); l.className = "skeleton-line" + (i === 3 ? " short" : ""); sk.appendChild(l); }
        el.dashPanel.prepend(sk);
      } else { el.dashPanel.querySelector(".skeleton").hidden = false; }
      Promise.resolve(refreshDashboard()).finally(() => { const sk = el.dashPanel.querySelector(".skeleton"); if (sk) sk.hidden = true; });
      if (state.dashTimer) clearInterval(state.dashTimer);
      state.dashTimer = setInterval(refreshDashboard, 15000);
    } else if (state.dashTimer) {
      clearInterval(state.dashTimer);
      state.dashTimer = null;
    }
  }

  const exported = { corpusSourceLabel, corpusSourcesFromStats, recordCorpusGrowth, drawDonut, drawGrowth, formatChars, loadDashCorpusExtra, fmtNum, refreshDashboard, setDashOpen, setDashOpenImpl };
  Object.assign(api, exported);
  return exported;
}
