/* МойGPT presentation / demo mode (?demo=1) — ES module. */

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
    corpusSourcesFromStats, recordCorpusGrowth, drawDonut, drawGrowth, formatChars, loadDashCorpusExtra, refreshDashboard, setDashOpen,
    setDashOpenImpl, runTokenize, runNextProbs, setLabOpen, updateConfToggleState, trapFocus, releaseFocusTrap, renderEloTable,
    setEloOpen, setArenaOpen, setArenaOpenImpl, runArena, stopArena, voteArena, openExplain, explainStep,
    renderExplainBars, pickExplainCand, explainNextTop, explainAutoToggle, explainReset, modelGroup, fillModelSelectGrouped, pickDistinctModels,
    applyArenaPair, compareSftInArena, ensureArenaDistinct, startTour, endTour, renderTour, openWorkspace, exportWorkspace,
    importWorkspaceFile, openPrompts, renderPromptsList, hideSlashPopup, showSlashPopup, applySlashPrompt, onInputSlash, createFolder,
    cmdActions, renderCmdList, openCmdPalette, openMsgSearch, highlightMsgSnippet, runMsgSearch, renderSftList, exportSftJsonl,
    uniqueSourcesFromHits, renderDatasetChips, renderDatasetList, openDatasetDoc, runDatasetSearch, addCurrentDocToSft, setDatasetOpen, setDatasetOpenImpl,
    buildStandaloneHtml, shareChatHtml, shareChatPng, roundRect, wrapText, exportHtml, openThemeBuilder, ensureSimilarWorker,
    requestSimilarChats, renderSimilarList, updateTokenBudget, scheduleTokenBudget, setModelCardOpen, fillModelCardSelect, matchEvalRow, refreshModelCard,
    appendToolCard, runChatTool, evoModels, loadEvoBpcMap, runEvolution, stopEvolution, setChatStatsOpen, gatherChatStats,
    drawDayChart, drawModelPie, renderChatStats, setPlaygroundOpen, setPlaygroundOpenImpl, pgStopSeqs, renderPgTabs, paintPgActive,
    runPlaygroundViaNext, runPlayground, stopPlayground, renderNotifList, openNotifs, clearNotifs, pollNotifEvents, runSandboxedJs,
    runPerfCheck, sendFeedback, syncLocalFeedback, setupVoice, updateAttachWarn, renderAttachChips, readTextFile, addAttachFiles,
    postCorpusAdd, submitTeach, syncLocalCorpusOnce, setupAttachDnD, syncPersonaSelect, onPersonaChange, addPersona, setEvoOpen,
    renderBpcChart, regenerateAnswer, regenerateFromEditedUser
  } = api;


    let demoTimer = null;
    let demoIdx = 0;
    let demoPaused = false;

    function catFacts(row) {
      const qa = (row && row.qa) || [];
      let ok = 0, tot = 0;
      qa.forEach((q) => {
        if (String(q.cat || '') !== 'факты') return;
        tot += 1;
        if (q.ok) ok += 1;
      });
      return { ok: ok, total: tot };
    }

    async function demoApplyArenaPair() {
      const names = (state.models && state.models.length ? state.models : []).slice();
      if (!names.length && typeof loadModels === 'function') {
        try { await loadModels(); } catch (_) {}
      }
      const list = (state.models && state.models.length ? state.models : names).slice();
      let pair = null;
      let promptKind = 'chat';
      // Prefer ctx+rag vs sft+rag when ctx facts beat sft+rag facts.
      try {
        const eRes = await fetch(url(API.eval), { cache: 'no-store' });
        if (eRes.ok) {
          let rows = await eRes.json();
          if (!Array.isArray(rows)) rows = (rows && rows.results) || [];
          const tsOf = (ts) => {
            if (typeof parseTs === 'function') return parseTs(ts);
            if (!ts) return 0;
            const t = Date.parse(String(ts).replace(' ', 'T'));
            return isNaN(t) ? 0 : t;
          };
          const ckptIdOf = (ck) => {
            let s = String(ck || '').replace(/\\/g, '/');
            if (/rag-only/i.test(s)) return 'rag-only';
            let rag = '';
            if (/\+rag$/i.test(s)) { rag = '+rag'; s = s.replace(/\+rag$/i, ''); }
            const m = s.match(/\/ckpt\/([^/]+)\//i);
            let id;
            if (m) id = m[1];
            else {
              const parts = s.split('/').filter(Boolean);
              if (parts.length >= 2 && /ckpt\.pt$/i.test(parts[parts.length - 1])) id = parts[parts.length - 2];
              else id = (parts[parts.length - 1] || s).replace(/\.pt$/i, '');
            }
            return id + rag;
          };
          const newest = (id) => {
            let hit = null;
            rows.forEach((r) => {
              if (ckptIdOf(r.ckpt) !== id) return;
              if (!hit || tsOf(r.ts) >= tsOf(hit.ts)) hit = r;
            });
            return hit;
          };
          const ctxRag = newest('v1_sft_ctx+rag');
          const sftRag = newest('v1_sft+rag');
          if (ctxRag && sftRag && list.indexOf('v1_sft_ctx+rag') >= 0 && list.indexOf('v1_sft+rag') >= 0) {
            const fa = catFacts(ctxRag).ok;
            const fb = catFacts(sftRag).ok;
            if (fa > fb) {
              pair = { a: 'v1_sft_ctx+rag', b: 'v1_sft+rag', kind: 'ctx-rag' };
              promptKind = 'fact';
            }
          }
        }
      } catch (_) {}
      if (!pair) {
        if (typeof pickDistinctModelsPure === 'function') pair = pickDistinctModelsPure(list);
        else if (typeof pickDistinctModels === 'function') pair = pickDistinctModels(list);
        else pair = { a: 'mygpt-latest', b: 'v0', kind: 'latest' };
        // Prefer explicit [v1_sft, v1] when both exist.
        if (list.indexOf('v1_sft') >= 0 && list.indexOf('v1') >= 0) {
          pair = { a: 'v1_sft', b: 'v1', kind: 'sft' };
        }
        promptKind = 'chat';
      }
      if (el.arenaModelA) {
        if (typeof fillModelSelectGrouped === 'function') fillModelSelectGrouped(el.arenaModelA, list, pair.a);
        else el.arenaModelA.value = pair.a;
        el.arenaModelA.value = pair.a;
      }
      if (el.arenaModelB) {
        if (typeof fillModelSelectGrouped === 'function') fillModelSelectGrouped(el.arenaModelB, list, pair.b);
        else el.arenaModelB.value = pair.b;
        el.arenaModelB.value = pair.b;
      }
      if (el.arenaLabelA) el.arenaLabelA.textContent = pair.a;
      if (el.arenaLabelB) el.arenaLabelB.textContent = pair.b;
      if (typeof ensureArenaDistinct === 'function') ensureArenaDistinct();
      pair.promptKind = promptKind;
      return pair;
    }

    function fmtNum(n, digits) {
      if (n == null || isNaN(Number(n))) return '—';
      const v = Number(n);
      return digits != null ? v.toFixed(digits) : String(Math.round(v));
    }

    async function fetchItogi() {
      const out = {
        docs: null, rag_chunks: null, best_bpc: null, best_step: null,
        params_M: null, qa_score: null, qa_total: null, steps: null,
        has_sft: false, sft_name: null, base_name: null, rag_name: null,
        sft_qa: null, base_qa: null, rag_qa: null, rag_only: null,
        qa_table: [], caption: null,
        step_bpc: [], corpus_sources: null,
      };
      try {
        const cRes = await fetch(url(API.corpusStats), { cache: 'no-store' });
        if (cRes.ok) {
          const st = await cRes.json();
          out.docs = (st.build && st.build.kept != null) ? Number(st.build.kept)
            : (st.clean && st.clean['corpus.jsonl'] && st.clean['corpus.jsonl'].docs != null
              ? Number(st.clean['corpus.jsonl'].docs) : null);
          out.rag_chunks = st.rag_chunks != null ? Number(st.rag_chunks) : null;
          const sources = {};
          if (st.build && typeof st.build === 'object') {
            Object.keys(st.build).forEach((k) => {
              if (k.indexOf('kept:') === 0) {
                const label = k.slice(5).replace(/\\.jsonl$/i, '').replace(/\\.txt$/i, '').replace(/^pc_/, '').replace(/_ru$/, '');
                sources[label] = (sources[label] || 0) + (Number(st.build[k]) || 0);
              }
            });
          }
          if (!Object.keys(sources).length && st.sources && typeof st.sources === 'object') {
            Object.keys(st.sources).forEach((k) => {
              const ent = st.sources[k] || {};
              const label = String(k).replace(/\\.jsonl$/i, '').replace(/\\.txt$/i, '').replace(/^pc_/, '');
              const n = ent.docs != null ? Number(ent.docs) : Number(ent.bytes) || 0;
              sources[label] = (sources[label] || 0) + n;
            });
          }
          out.corpus_sources = sources;
        }
      } catch (_) {}
      try {
        const eRes = await fetch(url(API.eval), { cache: 'no-store' });
        if (eRes.ok) {
          let rows = await eRes.json();
          if (!Array.isArray(rows)) rows = (rows && rows.results) || [];
          let best = null;
          rows.forEach((r) => {
            if (r.bpc == null || isNaN(Number(r.bpc))) return;
            if (!best || Number(r.bpc) < Number(best.bpc)) best = r;
          });
          if (best) {
            out.best_bpc = Number(best.bpc);
            out.best_step = best.step != null ? Number(best.step) : null;
            out.params_M = best.params_M != null ? Number(best.params_M) : null;
            out.qa_score = best.qa_score != null ? Number(best.qa_score) : null;
            out.qa_total = best.qa_total != null ? Number(best.qa_total) : null;
          }
          const steps = [];
          const stepPts = [];
          rows.forEach((r) => {
            const ck = String(r.ckpt || '');
            const m = ck.match(/step_(\d+)/i);
            if (m) {
              const step = Number(m[1]);
              steps.push(step);
              if (r.bpc != null && !isNaN(Number(r.bpc))) {
                stepPts.push({ step: step, bpc: Number(r.bpc) });
              }
            } else if (r.step != null) steps.push(Number(r.step));
          });
          if (steps.length) out.steps = Math.max.apply(null, steps);
          stepPts.sort((a, b) => a.step - b.step);
          const uniq = {};
          stepPts.forEach((p) => { uniq[p.step] = p; });
          out.step_bpc = Object.keys(uniq).map(Number).sort((a,b)=>a-b).map((k) => uniq[k]);

          const names = state.models || [];
          const tsOf = (ts) => {
            if (typeof parseTs === 'function') return parseTs(ts);
            if (!ts) return 0;
            const t = Date.parse(String(ts).replace(' ', 'T'));
            return isNaN(t) ? 0 : t;
          };
          const ckptIdOf = (ck) => {
            let s = String(ck || '').replace(/\\/g, '/');
            if (/rag-only/i.test(s)) return 'rag-only';
            let rag = '';
            if (/\+rag$/i.test(s)) { rag = '+rag'; s = s.replace(/\+rag$/i, ''); }
            const m = s.match(/\/ckpt\/([^/]+)\//i);
            let id;
            if (m) id = m[1];
            else {
              const parts = s.split('/').filter(Boolean);
              if (parts.length >= 2 && /ckpt\.pt$/i.test(parts[parts.length - 1])) id = parts[parts.length - 2];
              else id = (parts[parts.length - 1] || s).replace(/\.pt$/i, '');
            }
            return id + rag;
          };
          const matchRow = (id) => {
            const want = String(id || '');
            if (!want) return null;
            let hit = null;
            rows.forEach((r) => {
              const cid = ckptIdOf(r.ckpt);
              if (cid !== want && String(r.ckpt || '') !== want) return;
              if (!hit || tsOf(r.ts) >= tsOf(hit.ts)) hit = r;
            });
            return hit;
          };
          const catBreakdown = (qa) => {
            const want = [
              { key: 'факты', label: 'факты' },
              { key: 'диалог', label: 'диалог' },
              { key: 'код', label: 'код' },
              { key: 'безопасность', label: 'безоп' },
            ];
            const map = {};
            (qa || []).forEach((q) => {
              const c = String(q.cat || '');
              if (!map[c]) map[c] = { ok: 0, total: 0 };
              map[c].total += 1;
              if (q.ok) map[c].ok += 1;
            });
            return want.map((w) => {
              const m = map[w.key] || { ok: 0, total: 0 };
              return { key: w.key, label: w.label, ok: m.ok, total: m.total };
            });
          };
          const pack = (id, opts) => {
            const r = matchRow(id);
            if (!r) return null;
            const cats = catBreakdown(r.qa);
            const facts = cats.find((c) => c.key === 'факты') || { ok: 0, total: 0 };
            return {
              id: id,
              label: (opts && opts.label) || id,
              muted: !!(opts && opts.muted),
              score: r.qa_score != null ? Number(r.qa_score) : null,
              total: r.qa_total != null ? Number(r.qa_total) : null,
              bpc: r.bpc != null ? Number(r.bpc) : null,
              step: r.step != null ? Number(r.step) : null,
              ts: r.ts || '',
              cats: cats,
              facts_ok: facts.ok,
              facts_total: facts.total,
            };
          };
          // Preferred table order; include ctx variants automatically when eval rows exist.
          const tableIds = [
            { id: 'v1', label: 'v1' },
            { id: 'v1_sft', label: 'v1_sft' },
            { id: 'v1_sft_ctx', label: 'v1_sft_ctx' },
            { id: 'v1+rag', label: 'v1+rag' },
            { id: 'v1_sft+rag', label: 'v1_sft+rag' },
            { id: 'v1_sft_ctx+rag', label: 'v1_sft_ctx+rag' },
            { id: 'rag-only', label: 'только поиск (не модель)', muted: true },
          ];
          out.qa_table = tableIds.map((x) => pack(x.id, x)).filter(Boolean);
          const byId = {};
          out.qa_table.forEach((r) => { byId[r.id] = r; });
          out.has_sft = !!(byId['v1_sft'] || byId['v1_sft_ctx']);
          out.sft_name = byId['v1_sft'] ? 'v1_sft' : (byId['v1_sft_ctx'] ? 'v1_sft_ctx' : null);
          out.base_name = 'v1';
          out.sft_qa = byId['v1_sft'] || byId['v1_sft_ctx'] || null;
          out.base_qa = byId['v1'] || null;
          out.rag_name = byId['v1_sft+rag'] ? 'v1_sft+rag' : (byId['v1+rag'] ? 'v1+rag' : null);
          out.rag_qa = byId[out.rag_name] || null;
          out.rag_only = byId['rag-only'] || null;
          // Caption numbers from live rows (no hardcode).
          const baseScore = byId['v1'] && byId['v1'].score != null ? byId['v1'].score : null;
          const sftScore = byId['v1_sft'] && byId['v1_sft'].score != null ? byId['v1_sft'].score : null;
          const sftTotal = byId['v1_sft'] && byId['v1_sft'].total != null ? byId['v1_sft'].total
            : (byId['v1'] && byId['v1'].total != null ? byId['v1'].total : 35);
          const ragFactsOk = byId['rag-only'] ? byId['rag-only'].facts_ok : null;
          const ragFactsTot = byId['rag-only'] ? byId['rag-only'].facts_total : null;
          if (baseScore != null && sftScore != null && ragFactsOk != null && ragFactsTot != null) {
            out.caption = 'SFT: ' + baseScore + '→' + sftScore + '/' + sftTotal
              + ' и связные ответы; поиск находит факт в ' + ragFactsOk + '/' + ragFactsTot
              + ', модель пока не переписывает';
          } else {
            out.caption = null;
          }

        }
      } catch (_) {}
      return out;
    }


    function renderItogiSparkline(host, pts) {
      const wrap = document.createElement('div');
      wrap.className = 'itogi-chart-card';
      const h = document.createElement('h3');
      h.textContent = 'Кривая bpc · step_*';
      wrap.appendChild(h);
      if (!pts || !pts.length) {
        const empty = document.createElement('div');
        empty.className = 'lab-meta';
        empty.textContent = 'нет step_* в /api/eval';
        wrap.appendChild(empty);
        host.appendChild(wrap);
        return;
      }
      const W = 420, H = 110, padL = 36, padR = 8, padT = 10, padB = 22;
      const xs = pts.map((p) => p.step);
      const ys = pts.map((p) => p.bpc);
      const minX = xs[0], maxX = xs[xs.length - 1];
      const minY = Math.min.apply(null, ys);
      const maxY = Math.max.apply(null, ys);
      const spanX = Math.max(1, maxX - minX);
      const spanY = Math.max(0.01, maxY - minY);
      const xAt = (x) => padL + ((x - minX) / spanX) * (W - padL - padR);
      const yAt = (y) => padT + (1 - (y - minY) / spanY) * (H - padT - padB);
      let d = '';
      pts.forEach((p, i) => {
        const x = xAt(p.step), y = yAt(p.bpc);
        d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
      });
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('class', 'itogi-sparkline');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'bpc ' + Number(pts[0].bpc).toFixed(2) + ' → ' + Number(pts[pts.length-1].bpc).toFixed(2));
      [minY, maxY].forEach((v) => {
        const y = yAt(v);
        const t = document.createElementNS(svgNS, 'text');
        t.setAttribute('x', '2'); t.setAttribute('y', String(y + 3)); t.setAttribute('class', 'evo-axis');
        t.textContent = Number(v).toFixed(2); svg.appendChild(t);
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', String(padL)); line.setAttribute('x2', String(W - padR));
        line.setAttribute('y1', String(y)); line.setAttribute('y2', String(y));
        line.setAttribute('class', 'evo-grid'); svg.appendChild(line);
      });
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', d.trim()); path.setAttribute('class', 'evo-line');
      svg.appendChild(path);
      pts.forEach((p) => {
        const c = document.createElementNS(svgNS, 'circle');
        c.setAttribute('cx', String(xAt(p.step))); c.setAttribute('cy', String(yAt(p.bpc)));
        c.setAttribute('r', '3'); c.setAttribute('class', 'evo-dot');
        svg.appendChild(c);
      });
      [pts[0], pts[pts.length - 1]].forEach((p) => {
        const t = document.createElementNS(svgNS, 'text');
        t.setAttribute('x', String(xAt(p.step))); t.setAttribute('y', String(H - 4));
        t.setAttribute('text-anchor', 'middle'); t.setAttribute('class', 'evo-axis');
        t.textContent = String(p.step); svg.appendChild(t);
      });
      wrap.appendChild(svg);
      host.appendChild(wrap);
    }

    function renderItogiCorpusBars(host, sources) {
      const wrap = document.createElement('div');
      wrap.className = 'itogi-chart-card';
      const h = document.createElement('h3');
      h.textContent = 'Корпус по источникам';
      wrap.appendChild(h);
      const entries = Object.keys(sources || {}).map((k) => ({ k: k, v: Number(sources[k]) || 0 }))
        .filter((e) => e.v > 0)
        .sort((a, b) => b.v - a.v)
        .slice(0, 6);
      if (!entries.length) {
        const empty = document.createElement('div');
        empty.className = 'lab-meta';
        empty.textContent = 'нет данных корпуса';
        wrap.appendChild(empty);
        host.appendChild(wrap);
        return;
      }
      const total = entries.reduce((s, e) => s + e.v, 0) || 1;
      const list = document.createElement('div');
      list.className = 'itogi-corpus-bars';
      entries.forEach((e) => {
        const row = document.createElement('div');
        row.className = 'itogi-corpus-row';
        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = e.k;
        const bar = document.createElement('div');
        bar.className = 'bar';
        const fill = document.createElement('i');
        fill.style.width = Math.max(2, Math.round(100 * e.v / total)) + '%';
        bar.appendChild(fill);
        const pct = document.createElement('span');
        pct.className = 'pct';
        pct.textContent = Math.round(100 * e.v / total) + '%';
        row.appendChild(name); row.appendChild(bar); row.appendChild(pct);
        list.appendChild(row);
      });
      wrap.appendChild(list);
      host.appendChild(wrap);
    }

    async function renderItogiSlide() {
      closeOtherPanels('');
      let host = document.getElementById('demoItogi');
      if (!host) {
        host = document.createElement('div');
        host.id = 'demoItogi';
        host.className = 'demo-itogi';
        host.setAttribute('role', 'region');
        host.setAttribute('aria-label', 'Итоги');
        document.body.appendChild(host);
      }
      host.hidden = false;
      host.textContent = '';
      const loading = document.createElement('div');
      loading.className = 'panel-state loading';
      loading.textContent = 'Загрузка итогов…';
      host.appendChild(loading);
      const data = await fetchItogi();
      host.textContent = '';

      const title = document.createElement('h2');
      title.textContent = 'Итоги';
      host.appendChild(title);

      const headline = document.createElement('div');
      headline.className = 'itogi-headline';
      const bpcVal = document.createElement('div');
      bpcVal.className = 'itogi-bpc';
      const bpcNum = document.createElement('strong');
      bpcNum.textContent = data.best_bpc != null ? Number(data.best_bpc).toFixed(2) : '—';
      bpcVal.appendChild(bpcNum);
      const bpcLab = document.createElement('span');
      bpcLab.textContent = data.best_step != null
        ? ('бит/символ · лучший на шаге ' + Number(data.best_step))
        : 'бит/символ · лучший';
      bpcVal.appendChild(bpcLab);
      headline.appendChild(bpcVal);
      host.appendChild(headline);

      const grid = document.createElement('div');
      grid.className = 'itogi-grid';
      const cards = [
        { k: 'Документы корпуса', v: data.docs != null ? Number(data.docs).toLocaleString('ru-RU') : '—' },
        { k: 'RAG chunks', v: data.rag_chunks != null ? Number(data.rag_chunks).toLocaleString('ru-RU') : '—' },
        { k: 'Параметры', v: data.params_M != null ? (Number(data.params_M).toFixed(1) + 'M') : '—' },
        { k: 'Шагов обучения', v: data.steps != null ? Number(data.steps).toLocaleString('ru-RU') : '—' },
      ];
      cards.forEach((c) => {
        const d = document.createElement('div');
        d.className = 'itogi-card';
        const lab = document.createElement('div');
        lab.className = 'itogi-k';
        lab.textContent = c.k;
        const val = document.createElement('div');
        val.className = 'itogi-v';
        val.textContent = c.v;
        d.appendChild(lab);
        d.appendChild(val);
        grid.appendChild(d);
      });
      host.appendChild(grid);

      const qa = document.createElement('div');
      qa.className = 'itogi-qa' + (data.has_sft ? ' itogi-qa-sft' : ' itogi-qa-secondary');
      const h = document.createElement('h3');
      h.textContent = 'QA · сравнение чекпоинтов';
      qa.appendChild(h);
      if (data.has_sft) {
        const badge = document.createElement('span');
        badge.className = 'itogi-badge-pre';
        badge.textContent = 'без утечки теста';
        h.appendChild(document.createTextNode(' '));
        h.appendChild(badge);
      }
      const table = data.qa_table || [];
      if (table.length) {
        const tbl = document.createElement('table');
        tbl.className = 'itogi-qa-table';
        const thead = document.createElement('thead');
        const hr = document.createElement('tr');
        ['модель', 'QA', 'bpc', 'шаг', 'факты', 'диалог', 'код', 'безоп'].forEach((lab) => {
          const th = document.createElement('th');
          th.textContent = lab;
          hr.appendChild(th);
        });
        thead.appendChild(hr);
        tbl.appendChild(thead);
        const tb = document.createElement('tbody');
        table.forEach((r) => {
          const tr = document.createElement('tr');
          if (r.muted) tr.className = 'itogi-row-muted';
          const name = document.createElement('td');
          name.textContent = r.label || r.id;
          tr.appendChild(name);
          const qaCell = document.createElement('td');
          qaCell.textContent = (r.score != null ? r.score : '—') + '/' + (r.total != null ? r.total : '—');
          tr.appendChild(qaCell);
          const bpc = document.createElement('td');
          bpc.textContent = r.bpc != null ? Number(r.bpc).toFixed(2) : '—';
          tr.appendChild(bpc);
          const step = document.createElement('td');
          step.textContent = r.step != null ? String(r.step) : '—';
          tr.appendChild(step);
          const catMap = {};
          (r.cats || []).forEach((c) => { catMap[c.label || c.key] = c; });
          ['факты', 'диалог', 'код', 'безоп'].forEach((lab) => {
            const td = document.createElement('td');
            const c = catMap[lab];
            td.textContent = c && c.total ? (c.ok + '/' + c.total) : '—';
            tr.appendChild(td);
          });
          tb.appendChild(tr);
        });
        tbl.appendChild(tb);
        qa.appendChild(tbl);
      } else {
        const p = document.createElement('p');
        p.textContent = (data.qa_score != null ? Number(data.qa_score) : '—')
          + '/' + (data.qa_total != null ? Number(data.qa_total) : '—')
          + ' · нет строк /api/eval';
        qa.appendChild(p);
      }
      if (data.caption) {
        const cap = document.createElement('p');
        cap.className = 'itogi-caption';
        cap.textContent = data.caption;
        qa.appendChild(cap);
      }
      const note = document.createElement('p');
      note.className = 'itogi-note';
      note.textContent = 'Цифры с /api/eval (newest ts на чекпоинт). Поиск — не генерация.';
      qa.appendChild(note);
      host.appendChild(qa);

      const charts = document.createElement('div');
      charts.className = 'itogi-charts';
      renderItogiSparkline(charts, data.step_bpc || []);
      renderItogiCorpusBars(charts, data.corpus_sources || {});
      host.appendChild(charts);
      return data;
    }

    function hideItogi() {
      const host = document.getElementById('demoItogi');
      if (host) host.hidden = true;
    }

    const DEMO_STEPS = [
      { id: 'chat', title: 'Ответ с источниками', run: async () => {
          hideItogi();
          closeOtherPanels('');
          if (el.messages) el.messages.scrollTop = 0;
          renderAll();
          const src = document.querySelector('.sources, .msg-sources, .cite');
          if (src) src.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }},
      { id: 'heatmap', title: 'Тепловая карта уверенности', run: async () => {
          hideItogi();
          state.showConf = true;
          if (typeof updateConfToggleState === 'function') updateConfToggleState();
          else if (el.btnConf) el.btnConf.setAttribute('aria-pressed', 'true');
          renderAll();
        }},
      { id: 'arena', title: 'Арена моделей', run: async () => {
          hideItogi();
          if (typeof setArenaOpen === 'function') await setArenaOpen(true);
          else { await (api._ensure && api._ensure('arena')); if (api.setArenaOpen) await api.setArenaOpen(true); }
          const pair = await demoApplyArenaPair();
          // Factual prompt only for ctx+rag arena; must NOT be in eval/questions.jsonl.
          const DEMO_ARENA_PROMPT = (pair && pair.promptKind === 'fact')
            ? 'Почему небо голубое?'
            : 'Привет! Расскажи о себе.';
          if (el.arenaPrompt) el.arenaPrompt.value = DEMO_ARENA_PROMPT;
          const runner = (typeof runArena === 'function') ? runArena : (api && api.runArena);
          if (runner) {
            // Stream live into A/B; do not block the slide timer on full completion.
            Promise.resolve(runner()).catch((err) => console.warn('[demo arena]', err));
            await new Promise((r) => setTimeout(r, 700));
          }
        }},
      { id: 'evolution', title: 'Эволюция · кривая bpc', run: async () => {
          hideItogi();
          if (typeof setEvoOpen === 'function') await setEvoOpen(true);
          if (typeof renderBpcChart === 'function') await renderBpcChart();
          else if (api.renderBpcChart) await api.renderBpcChart();
          else if (typeof refreshEvoChart === 'function') await refreshEvoChart();
        }},
      { id: 'dashboard', title: 'Панель корпуса', run: async () => {
          hideItogi();
          if (typeof setDashOpen === 'function') await setDashOpen(true);
        }},
      { id: 'itogi', title: 'Итоги', run: async () => {
          closeOtherPanels('');
          await renderItogiSlide();
        }},
    ];

    function ensureDemoChrome() {
      let bar = document.getElementById('demoBar');
      if (bar) return bar;
      bar = document.createElement('div');
      bar.id = 'demoBar';
      bar.className = 'demo-bar';
      bar.innerHTML = '<div class="demo-bar-inner" role="toolbar" aria-label="Управление презентацией">' +
        '<strong>Режим презентации</strong>' +
        '<span id="demoStepLabel" aria-live="polite"></span>' +
        '<span class="demo-keys">Space пауза · → следующий · ← предыдущий · Esc выход</span>' +
        '<button type="button" id="demoFs" class="ghost" aria-label="⛶" title="Полный экран">⛶</button>' +
        '<button type="button" id="demoPrev" class="ghost" aria-label="←" title="Предыдущий слайд">←</button>' +
        '<button type="button" id="demoNext" class="primary" aria-label="Далее">Далее</button>' +
        '<button type="button" id="demoClose" class="ghost" aria-label="✕" title="Закрыть презентацию">✕</button></div>';
      document.body.appendChild(bar);
      document.body.classList.add('demo-mode');
      document.getElementById('demoNext').onclick = () => { demoPaused = false; demoNext(); };
      document.getElementById('demoPrev').onclick = () => { demoPaused = false; demoPrev(); };
      document.getElementById('demoClose').onclick = () => stopPresentation();
      const fsBtn = document.getElementById('demoFs');
      if (fsBtn) fsBtn.onclick = async () => {
        try {
          if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if (document.exitFullscreen) {
            await document.exitFullscreen();
          }
        } catch (_) {}
      };
      return bar;
    }

    async function runStep(i) {
      demoIdx = Math.max(0, Math.min(DEMO_STEPS.length - 1, i));
      const s = DEMO_STEPS[demoIdx];
      ensureDemoChrome();
      const lab = document.getElementById('demoStepLabel');
      if (lab) lab.textContent = (demoIdx + 1) + '/' + DEMO_STEPS.length + ' · ' + s.title;
      try { await s.run(); } catch (err) { console.warn('[demo]', err); }
    }

    async function demoNext() {
      if (demoIdx >= DEMO_STEPS.length - 1) { await runStep(demoIdx); return; }
      await runStep(demoIdx + 1);
      armTimer();
    }
    async function demoPrev() {
      await runStep(demoIdx - 1);
      armTimer();
    }
    function armTimer() {
      clearTimeout(demoTimer);
      if (demoPaused) return;
      if (demoIdx >= DEMO_STEPS.length - 1) return;
      demoTimer = setTimeout(() => { if (!demoPaused) demoNext(); }, 8000);
    }

    function onDemoKey(e) {
      if (!document.body.classList.contains('demo-mode')) return;
      if (e.key === 'Escape') { e.preventDefault(); stopPresentation(); return; }
      if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); demoPaused = !demoPaused; if (!demoPaused) armTimer(); return; }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); demoPaused = false; demoNext(); return; }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); demoPaused = false; demoPrev(); return; }
    }

    async function startPresentation() {
      ensureDemoChrome();
      // Fullscreen only on explicit user click (#demoFs) — auto-call warns in console.
      document.addEventListener('keydown', onDemoKey);
      demoPaused = false;
      try { if (typeof loadModels === 'function') await loadModels(); } catch (_) {}
      await runStep(0);
      armTimer();
    }

    function stopPresentation() {
      clearTimeout(demoTimer);
      document.removeEventListener('keydown', onDemoKey);
      document.body.classList.remove('demo-mode');
      hideItogi();
      const bar = document.getElementById('demoBar');
      if (bar) bar.remove();
      if (document.fullscreenElement) {
        try { document.exitFullscreen(); } catch (_) {}
      }
    }

  const exported = { startPresentation, stopPresentation, demoNext, demoPrev, renderItogiSlide, demoApplyArenaPair, fetchItogi };
  Object.assign(api, exported);
  return exported;
}
