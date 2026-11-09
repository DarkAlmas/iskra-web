/* МойGPT feature: teach (ES module). */

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
    setChatStatsOpen, gatherChatStats, drawDayChart, drawModelPie, renderChatStats, setPlaygroundOpen, setPlaygroundOpenImpl, pgStopSeqs,
    renderPgTabs, paintPgActive, runPlaygroundViaNext, runPlayground, stopPlayground, renderNotifList, openNotifs, clearNotifs,
    pollNotifEvents, runSandboxedJs, runPerfCheck, sendFeedback, syncLocalFeedback, setupVoice, syncPersonaSelect, onPersonaChange,
    addPersona, setEvoOpen, renderBpcChart, regenerateAnswer, regenerateFromEditedUser
  } = api;


  function updateAttachWarn() {
    if (!el.attachWarn) return;
    const big = state.pendingAttach.filter((a) => (a.text || "").length > MAX_ATTACH_CHARS);
    if (!big.length) {
      el.attachWarn.hidden = true;
      el.attachWarn.textContent = "";
      return;
    }
    el.attachWarn.hidden = false;
    el.attachWarn.textContent =
      "модель увидит первые " +
      MAX_ATTACH_CHARS +
      " символов" +
      (big.length === 1
        ? " («" + big[0].name + "»: " + big[0].text.length + ")"
        : " (" + big.length + " файла длиннее лимита)");
  }

  function renderAttachChips() {
    if (!el.attachChips) return;
    el.attachChips.innerHTML = "";
    if (!state.pendingAttach.length) {
      el.attachChips.hidden = true;
      updateAttachWarn();
      return;
    }
    el.attachChips.hidden = false;
    state.pendingAttach.forEach((a, idx) => {
      const chip = document.createElement("span");
      chip.className = "attach-chip";
      const over = (a.text || "").length > MAX_ATTACH_CHARS;
      chip.textContent =
        "������ " +
        a.name +
        " (" +
        Math.round(a.size / 1024) +
        " КБ" +
        (over ? ", >" + MAX_ATTACH_CHARS + " симв." : "") +
        ")";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "×";
      btn.setAttribute("aria-label", "Убрать");
      btn.addEventListener("click", () => {
        state.pendingAttach.splice(idx, 1);
        renderAttachChips();
      });
      chip.appendChild(btn);
      el.attachChips.appendChild(chip);
    });
    updateAttachWarn();
  }

  function readTextFile(file, maxBytes) {
    const limit = maxBytes != null ? maxBytes : MAX_ATTACH_BYTES;
    return new Promise((resolve, reject) => {
      if (file.size > limit) {
        reject(new Error("Файл больше " + Math.round(limit / 1024) + " КБ"));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsText(file);
    });
  }

  async function addAttachFiles(fileList) {
    const files = Array.from(fileList || []);
    for (const f of files) {
      const name = f.name || "file.txt";
      if (!/\.(txt|md)$/i.test(name) && f.type && f.type.indexOf("text") !== 0) {
        showError(true);
        continue;
      }
      try {
        const text = await readTextFile(f);
        state.pendingAttach.push({ name: name, size: f.size, text: text });
      } catch (e) {
        if (el.attachWarn) {
          el.attachWarn.hidden = false;
          el.attachWarn.textContent = e.message || "ошибка файла";
        }
        showError(true);
      }
    }
    renderAttachChips();
  }

  async function postCorpusAdd(entry) {
    const res = await fetch(url(API.corpusAdd), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: entry.title,
        text: entry.text,
        url: entry.url || undefined,
        source: entry.source || "ui",
      }),
    });
    return res;
  }

  async function submitTeach() {
    if (!el.teachStatus) return;
    const title = ((el.teachTitle && el.teachTitle.value) || "").trim() || "Без названия";
    const text = ((el.teachText && el.teachText.value) || "").trim();
    if (text.length < MIN_TEACH_CHARS) {
      el.teachStatus.textContent = "минимум " + MIN_TEACH_CHARS + " символов";
      return;
    }
    const bytes = new Blob([text]).size;
    if (bytes > MAX_TEACH_BYTES) {
      el.teachStatus.textContent = "слишком большой текст, макс. 256 КБ";
      return;
    }
    el.teachStatus.textContent = "…";
    try {
      const res = await postCorpusAdd({ title: title, text: text, source: "ui" });
      if (res.status === 413) {
        el.teachStatus.textContent = "слишком большой текст, макс. 256 КБ";
        return;
      }
      if (res.status === 404 || res.status === 405) throw new Error("missing");
      if (!res.ok) throw new Error("add " + res.status);
      let data = {};
      try {
        data = await res.json();
      } catch (_) {}
      const id = data.id || "";
      el.teachStatus.textContent = id ? "добавлено · id=" + id : "добавлено";
      if (el.teachText) el.teachText.value = "";
    } catch (_) {
      try {
        const prev = JSON.parse(localStorage.getItem(CORPUS_LOCAL_KEY) || "[]");
        prev.push({ title: title, text: text, ts: Date.now() });
        localStorage.setItem(CORPUS_LOCAL_KEY, JSON.stringify(prev.slice(-50)));
        el.teachStatus.textContent = "сохранено локально (нет /api/corpus/add)";
      } catch (e2) {
        el.teachStatus.textContent = "ошибка";
      }
    }
  }

  async function syncLocalCorpusOnce() {
    let all = [];
    try {
      all = JSON.parse(localStorage.getItem(CORPUS_LOCAL_KEY) || "[]");
    } catch (_) {
      all = [];
    }
    if (!Array.isArray(all) || !all.length) return;
    const left = [];
    for (const entry of all) {
      try {
        const res = await postCorpusAdd(entry);
        if (res.status === 404 || res.status === 405) {
          left.push(entry);
          break;
        }
        if (res.status === 413) {
          left.push(entry);
          continue;
        }
        if (!res.ok) {
          left.push(entry);
          continue;
        }
      } catch (_) {
        left.push(entry);
        break;
      }
    }
    localStorage.setItem(CORPUS_LOCAL_KEY, JSON.stringify(left));
  }

  function setupAttachDnD() {
    if (!el.composerBox) return;
    const box = el.composerBox;
    ["dragenter", "dragover"].forEach((ev) => {
      box.addEventListener(ev, (e) => {
        e.preventDefault();
        box.classList.add("dragover");
      });
    });
    ["dragleave", "drop"].forEach((ev) => {
      box.addEventListener(ev, (e) => {
        e.preventDefault();
        box.classList.remove("dragover");
      });
    });
    box.addEventListener("drop", (e) => {
      if (e.dataTransfer && e.dataTransfer.files) addAttachFiles(e.dataTransfer.files);
    });
  }

  const exported = { updateAttachWarn, renderAttachChips, readTextFile, addAttachFiles, postCorpusAdd, submitTeach, syncLocalCorpusOnce, setupAttachDnD };
  Object.assign(api, exported);
  return exported;
}
