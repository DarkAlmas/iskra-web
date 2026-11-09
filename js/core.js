/* МойGPT web UI v15 — slim core + lazy features (no CDN, no build). */
import { escapeHtml as escapeHtmlPure, isSafeHttpUrl as isSafeHttpUrlPure, safeHref as safeHrefPure } from './safe.js';
import {
  renderMarkdown as renderMarkdownPure,
  renderInlineMd as renderInlineMdPure,
  renderTextBlock as renderTextBlockPure,
  highlightCode as highlightCodePure,
  renderCodeBlock as renderCodeBlockPure,
} from './markdown.js';

function isSafeHttpUrl(href) { return isSafeHttpUrlPure(href); }
function safeHref(raw) { return safeHrefPure(raw); }
function escapeHtml(s) { return escapeHtmlPure(s); }
function renderInlineMd(s) { return renderInlineMdPure(s); }
function renderTextBlock(escaped) { return renderTextBlockPure(escaped); }
function highlightCode(lang, escapedSrc) { return highlightCodePure(lang, escapedSrc); }
function renderCodeBlock(lang, escapedBody) { return renderCodeBlockPure(lang, escapedBody); }
function renderMarkdown(text) { return renderMarkdownPure(text); }
function safeCalc(expr) {
  throw new Error("safeCalc: load tools feature first");
}

let parseSseBuffer;
let parseSseLine;
let _sseReady = import('./sse.js').then((m) => {
  parseSseBuffer = m.parseSseBuffer;
  parseSseLine = m.parseSseLine;
  return m;
});

const API = {
  base: "https://tbbaztmtkcrzxnkkmtqv.supabase.co/functions/v1/iskra",
  chat: "/api/chat",
  models: "/api/models",
  stats: "/api/stats",
  train: "/api/train",
  health: "/api/health",
  eval: "/api/eval",
  search: "/api/search",
  feedback: "/api/feedback",
  tokenize: "/api/tokenize",
  next: "/api/next",
  corpusAdd: "/api/corpus/add",
  corpusStats: "/api/corpus/stats",
  fallback: { chat: "/chat/stream", stats: "/stats", train: "/train", health: "/health" },
};

const FALLBACK_MODELS = ["mygpt-latest", "rag-only", "ckpt-latest"];
function findSftModelsPure(names) { return (names || []).filter((n) => /_sft$/i.test(String(n))); }
function pickDistinctModelsPure(names) {
  const list = (names || []).filter(Boolean).map(String);
  if (!list.length) return { a: "mygpt-latest", b: "v0", kind: "latest" };
  const sfts = findSftModelsPure(list).sort((x, y) => String(y).localeCompare(String(x)));
  for (let i = 0; i < sfts.length; i++) {
    const sft = sfts[i], base = String(sft).replace(/_sft$/i, "");
    if (base && list.indexOf(base) >= 0 && base !== sft) return { a: sft, b: base, kind: "sft" };
  }
  const latest = list.indexOf("mygpt-latest") >= 0 ? "mygpt-latest" : list[0];
  let other = list.indexOf("v0") >= 0 ? "v0" : null;
  if (!other || other === latest) {
    other = null;
    for (let i = 0; i < list.length; i++) if (list[i] !== latest) { other = list[i]; break; }
  }
  return { a: latest, b: other || latest, kind: "latest" };
}
const STORE_KEY = "mygpt.chats.v2";
const STORE_KEY_LEGACY = "mygpt.chats.v1";
const THEME_KEY = "mygpt.theme";
const FEEDBACK_KEY = "mygpt.feedback.v1";
const PERSONA_KEY = "mygpt.personas.v1";
const TOK_COLORS = ["#1a4a46","#2a3a5a","#3a2a4a","#2a4a2a","#4a3a1a","#1a3a4a","#4a1a2a","#2a2a4a"];
const MAX_ATTACH_BYTES = 200 * 1024;
const MAX_ATTACH_CHARS = 4000;
const MAX_TEACH_BYTES = 256 * 1024;
const MIN_TEACH_CHARS = 20;
const CORPUS_LOCAL_KEY = "mygpt.corpus.local.v1";
const CORPUS_GROWTH_KEY = "mygpt.corpus.growth.v1";
const PROMPTS_KEY = "mygpt.prompts.v1";
const FOLDERS_KEY = "mygpt.folders.v1";
const DEFAULT_GEN = { temperature: 0.8, top_k: 50, top_p: 0.95, max_tokens: 200, repetition_penalty: 1.15 };
const ELO_KEY = "mygpt.elo.v1";
const TOUR_KEY = "mygpt.tour.done.v1";
const WS_SCHEMA = 1;
const DONUT_COLORS = ["#3dd6c6","#6ea8fe","#c084fc","#fbbf24","#f87171","#34d399","#a78bfa","#fb7185","#38bdf8","#a3e635"];
const MAX_RENDER_MSGS = 120;
const DEFAULT_PERSONAS = [
  { id: "default", name: "По умолчанию", system: "" },
  { id: "teacher", name: "Учитель", system: "Ты терпеливый учитель. Объясняй просто, с примерами." },
  { id: "coder", name: "Кодер", system: "Ты опытный программист. Отвечай кратко, с кодом и пояснениями." },
];

const $ = (id) => document.getElementById(id);
const el = {
  sidebar: $("sidebar"),
  backdrop: $("sidebarBackdrop"),
  chatList: $("chatList"),
  chatSearch: $("chatSearch"),
  modelSelect: $("modelSelect"),
  modelSelectA: $("modelSelectA"),
  modelSelectB: $("modelSelectB"),
  compareMode: $("compareMode"),
  compareModels: $("compareModels"),
  chatTitle: $("chatTitle"),
  messages: $("messages"),
  emptyState: $("emptyState"),
  errorBanner: $("errorBanner"),
  settingsPanel: $("settingsPanel"),
  trainPanel: $("trainPanel"),
  trainEmpty: $("trainEmpty"),
  trainBody: $("trainBody"),
  trainStats: $("trainStats"),
  trainMsg: $("trainMsg"),
  lossChart: $("lossChart"),
  healthDot: $("healthDot"),
  helpTip: $("helpTip"),
  systemPrompt: $("systemPrompt"),
  input: $("input"),
  btnSend: $("btnSend"),
  btnStop: $("btnStop"),
  btnNewChat: $("btnNewChat"),
  btnRetry: $("btnRetry"),
  btnToggleSidebar: $("btnToggleSidebar"),
  btnToggleSettings: $("btnToggleSettings"),
  btnToggleTrain: $("btnToggleTrain"),
  btnToggleEval: $("btnToggleEval"),
  btnToggleCorpus: $("btnToggleCorpus"),
  btnToggleLab: $("btnToggleLab"),
  labPanel: $("labPanel"),
  labTokText: $("labTokText"),
  labTokMeta: $("labTokMeta"),
  labTokPills: $("labTokPills"),
  btnLabTok: $("btnLabTok"),
  labNextPrompt: $("labNextPrompt"),
  labNextBars: $("labNextBars"),
  btnLabNext: $("btnLabNext"),
  btnLabNextReset: $("btnLabNextReset"),
  confToggle: $("confToggle"),
  trainSamples: $("trainSamples"),
  trainSamplesList: $("trainSamplesList"),
  corpusPanel: $("corpusPanel"),
  corpusForm: $("corpusForm"),
  corpusQuery: $("corpusQuery"),
  corpusEmpty: $("corpusEmpty"),
  corpusList: $("corpusList"),
  btnVoice: $("btnVoice"),
  btnExportMenu: $("btnExportMenu"),
  btnMoreMenu: $("btnMoreMenu"),
  btnTabsMore: $("btnTabsMore"),
  exportMenu: $("exportMenu"),
  moreMenu: $("moreMenu"),
  tabsMenu: $("tabsMenu"),
  topbarTabsTrack: $("topbarTabsTrack"),
  btnExportHtml: $("btnExportHtml"),
  btnRefreshEval: $("btnRefreshEval"),
  evalPanel: $("evalPanel"),
  evalEmpty: $("evalEmpty"),
  evalBody: $("evalBody"),
  evalBars: $("evalBars"),
  evalTable: $("evalTable"),
  evalCatFilter: $("evalCatFilter"),
  btnResumeTrain: $("btnResumeTrain"),
  btnExport: $("btnExport"),
  btnTheme: $("btnTheme"),
  btnHelp: $("btnHelp"),
  tempSlider: $("tempSlider"),
  tokensSlider: $("tokensSlider"),
  topkSlider: $("topkSlider"),
  tempVal: $("tempVal"),
  tokensVal: $("tokensVal"),
  topkVal: $("topkVal"),
  examples: $("examples"),
  personaSelect: $("personaSelect"),
  btnPersonaAdd: $("btnPersonaAdd"),
  btnAttach: $("btnAttach"),
  fileAttach: $("fileAttach"),
  attachChips: $("attachChips"),
  composerBox: $("composerBox"),
  teachTitle: $("teachTitle"),
  teachText: $("teachText"),
  teachFile: $("teachFile"),
  btnTeachFile: $("btnTeachFile"),
  btnTeachSubmit: $("btnTeachSubmit"),
  teachStatus: $("teachStatus"),
  btnToggleDash: $("btnToggleDash"),
  dashPanel: $("dashPanel"),
  btnDashRefresh: $("btnDashRefresh"),
  dashUpdated: $("dashUpdated"),
  dashHealth: $("dashHealth"),
  dashCorpusMeta: $("dashCorpusMeta"),
  dashDonut: $("dashDonut"),
  dashLegend: $("dashLegend"),
  dashGrowth: $("dashGrowth"),
  dashCkpts: $("dashCkpts"),
  dashTrainLog: $("dashTrainLog"),
  attachWarn: $("attachWarn"),
  toppSlider: $("toppSlider"),
  toppVal: $("toppVal"),
  repSlider: $("repSlider"),
  repVal: $("repVal"),
  heatmapToggle: $("heatmapToggle"),
  heatmapLegend: $("heatmapLegend"),
  btnCmdPalette: $("btnCmdPalette"),
  cmdPalette: $("cmdPalette"),
  cmdInput: $("cmdInput"),
  cmdList: $("cmdList"),
  btnMsgSearch: $("btnMsgSearch"),
  msgSearchOverlay: $("msgSearchOverlay"),
  msgSearchInput: $("msgSearchInput"),
  msgSearchList: $("msgSearchList"),
  btnMsgSearchClose: $("btnMsgSearchClose"),
  btnPrompts: $("btnPrompts"),
  promptsOverlay: $("promptsOverlay"),
  btnPromptsClose: $("btnPromptsClose"),
  promptForm: $("promptForm"),
  promptName: $("promptName"),
  promptSlash: $("promptSlash"),
  promptBody: $("promptBody"),
  promptsList: $("promptsList"),
  btnPromptExport: $("btnPromptExport"),
  btnPromptImport: $("btnPromptImport"),
  promptImportFile: $("promptImportFile"),
  slashPopup: $("slashPopup"),
  btnNewFolder: $("btnNewFolder"),
  dashScrubCard: $("dashScrubCard"),
  dashScrub: $("dashScrub"),
  arenaMode: $("arenaMode"),
  arenaPanel: $("arenaPanel"),
  arenaPrompt: $("arenaPrompt"),
  btnArenaRun: $("btnArenaRun"),
  btnArenaStop: $("btnArenaStop"),
  arenaModelA: $("arenaModelA"),
  arenaModelB: $("arenaModelB"),
  arenaBubbleA: $("arenaBubbleA"),
  arenaBubbleB: $("arenaBubbleB"),
  arenaLabelA: $("arenaLabelA"),
  arenaLabelB: $("arenaLabelB"),
  arenaColA: $("arenaColA"),
  arenaColB: $("arenaColB"),
  arenaVote: $("arenaVote"),
  arenaVoteStatus: $("arenaVoteStatus"),
  btnArenaA: $("btnArenaA"),
  btnArenaB: $("btnArenaB"),
  btnArenaTie: $("btnArenaTie"),
  btnToggleArena: $("btnToggleArena"),
  btnToggleElo: $("btnToggleElo"),
  eloPanel: $("eloPanel"),
  eloTable: $("eloTable"),
  eloEmpty: $("eloEmpty"),
  btnEloReset: $("btnEloReset"),
  explainOverlay: $("explainOverlay"),
  explainDialog: $("explainDialog"),
  explainPrompt: $("explainPrompt"),
  explainBuilt: $("explainBuilt"),
  explainStepMeta: $("explainStepMeta"),
  explainBars: $("explainBars"),
  btnExplainClose: $("btnExplainClose"),
  btnExplainNext: $("btnExplainNext"),
  btnExplainAuto: $("btnExplainAuto"),
  btnExplainReset: $("btnExplainReset"),
  workspaceOverlay: $("workspaceOverlay"),
  btnWorkspace: $("btnWorkspace"),
  btnWorkspaceClose: $("btnWorkspaceClose"),
  btnWsExport: $("btnWsExport"),
  btnWsImport: $("btnWsImport"),
  wsImportFile: $("wsImportFile"),
  wsStatus: $("wsStatus"),
  tour: $("tour"),
  tourDialog: $("tourDialog"),
  tourProgress: $("tourProgress"),
  tourTitle: $("tourTitle"),
  tourBody: $("tourBody"),
  tourSpot: $("tourSpot"),
  btnTourSkip: $("btnTourSkip"),
  btnTourPrev: $("btnTourPrev"),
  btnTourNext: $("btnTourNext"),
  btnResetGen: $("btnResetGen"),
  btnSettingsClose: $("btnSettingsClose"),
  btnToggleDataset: $("btnToggleDataset"),
  datasetPanel: $("datasetPanel"),
  datasetForm: $("datasetForm"),
  datasetQuery: $("datasetQuery"),
  datasetChips: $("datasetChips"),
  datasetList: $("datasetList"),
  datasetEmpty: $("datasetEmpty"),
  datasetDoc: $("datasetDoc"),
  datasetDocTitle: $("datasetDocTitle"),
  datasetDocMeta: $("datasetDocMeta"),
  datasetDocBody: $("datasetDocBody"),
  btnSftAdd: $("btnSftAdd"),
  sftStatus: $("sftStatus"),
  sftBox: $("sftBox"),
  sftCount: $("sftCount"),
  sftList: $("sftList"),
  btnSftExport: $("btnSftExport"),
  btnSftClear: $("btnSftClear"),
  smoothSlider: $("smoothSlider"),
  smoothVal: $("smoothVal"),
  trainNotify: $("trainNotify"),
  trainEta: $("trainEta"),
  trainTps: $("trainTps"),
  trainCkptLive: $("trainCkptLive"),
  evalDiffA: $("evalDiffA"),
  evalDiffB: $("evalDiffB"),
  btnEvalDiff: $("btnEvalDiff"),
  evalDiffGrid: $("evalDiffGrid"),
  btnShareHtml: $("btnShareHtml"),
  btnSharePng: $("btnSharePng"),
  btnLang: $("btnLang"),
  btnPerf: $("btnPerf"),
  similarBox: $("similarBox"),
  similarList: $("similarList"),
  similarEmpty: $("similarEmpty"),
  tokenBudget: $("tokenBudget"),
  tokenBudgetLabel: $("tokenBudgetLabel"),
  tokenBudgetWarn: $("tokenBudgetWarn"),
  tokenBudgetBar: $("tokenBudgetBar"),
  tokenBudgetFill: $("tokenBudgetFill"),
  modelCardPanel: $("modelCardPanel"),
  modelCardSelect: $("modelCardSelect"),
  btnToggleModelCard: $("btnToggleModelCard"),
  btnModelCardRefresh: $("btnModelCardRefresh"),
  mcParams: $("mcParams"),
  mcMetrics: $("mcMetrics"),
  mcCats: $("mcCats"),
  mcCorpus: $("mcCorpus"),
  mcSamples: $("mcSamples"),
  playgroundPanel: $("playgroundPanel"),
  btnTogglePlayground: $("btnTogglePlayground"),
  pgPrompt: $("pgPrompt"),
  pgStop: $("pgStop"),
  pgNBest: $("pgNBest"),
  pgSteps: $("pgSteps"),
  pgModel: $("pgModel"),
  btnPgRun: $("btnPgRun"),
  btnPgStop: $("btnPgStop"),
  pgOut: $("pgOut"),
  pgNBestOut: $("pgNBestOut"),
  btnNotif: $("btnNotif"),
  notifBadge: $("notifBadge"),
  notifOverlay: $("notifOverlay"),
  notifList: $("notifList"),
  notifEmpty: $("notifEmpty"),
  btnNotifClose: $("btnNotifClose"),
  btnNotifClear: $("btnNotifClear"),
  btnThemeBuilder: $("btnThemeBuilder"),
  themeBuilderOverlay: $("themeBuilderOverlay"),
  accentPicker: $("accentPicker"),
  themeContrast: $("themeContrast"),
  btnAccentApply: $("btnAccentApply"),
  btnAccentReset: $("btnAccentReset"),
  btnThemeBuilderClose: $("btnThemeBuilderClose"),
  btnToggleEvo: $("btnToggleEvo"),
  evoPanel: $("evoPanel"),
  evoPrompt: $("evoPrompt"),
  btnEvoRun: $("btnEvoRun"),
  btnEvoStop: $("btnEvoStop"),
  evoScroller: $("evoScroller"),
  evoStatus: $("evoStatus"),
  btnToggleChatStats: $("btnToggleChatStats"),
  chatStatsPanel: $("chatStatsPanel"),
  btnChatStatsRefresh: $("btnChatStatsRefresh"),
  csDayChart: $("csDayChart"),
  csSummary: $("csSummary"),
  csModelPie: $("csModelPie"),
  csModelLegend: $("csModelLegend"),
  csFeedback: $("csFeedback"),
  csFeedbackBar: $("csFeedbackBar"),
  csFeedbackFill: $("csFeedbackFill"),
  pgTabs: $("pgTabs"),
  pgStatus: $("pgStatus"),
  btnHelpClose: $("btnHelpClose"),
};

let state = {
  chats: [],
  activeId: null,
  streaming: false,
  abort: null,
  aborts: { A: null, B: null },
  trainTimer: null,
  lossHistory: [],
  lossSmooth: 3,
  lastNotifiedCkpt: null,
  lastTrainPollAt: null,
  lastTokensSeen: null,
  datasetHits: [],
  datasetSources: [],
  datasetSource: "*",
  datasetSelected: -1,
  datasetDoc: null,
  datasetQuery: "",
  sft: [],
  lang: localStorage.getItem("mygpt.lang.v1") || "ru",
  lazyTabs: {},
  perfTimer: null,
  evalRows: [],
  evalExpanded: {},
  confHighlight: false,
  sseHasP: false,
  resolved: { chat: null, stats: null, train: null, health: null },
  search: "",
  personas: DEFAULT_PERSONAS.slice(),
  pendingAttach: [],
  saveTimer: null,
  branchEditParentId: null,
  dashTimer: null,
  pendingApiAttach: [],
  corpusStatsMissing: false,
  heatmap: false,
  prompts: [],
  folders: [],
  folderCollapsed: {},
  slashIdx: 0,
  cmdIdx: 0,
  msgSearchQ: "",
  arena: { running: false, abortA: null, abortB: null, prompt: "", modelA: "", modelB: "", textA: "", textB: "", voted: false },
  elo: {},
  explain: { prompt: "", built: "", model: "", step: 0, timer: null, lastCands: [] },
  tourStep: 0,
  focusTrap: null,
  touchStartX: 0,
};

function url(path) {
  return (API.base || "") + path;
}
function uid() {
  return "c_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}



function makeExternalLink(href, text, className) {
  const safe = safeHref(href);
  if (safe) {
    const a = document.createElement("a");
    a.href = safe;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = className || "";
    a.textContent = text;
    return a;
  }
  const span = document.createElement("span");
  span.className = (className || "") + " nolink";
  span.textContent = text;
  return span;
}

function isMobile() {
  return window.matchMedia("(max-width: 760px)").matches;
}
function showError(on) {
  el.errorBanner.hidden = !on;
}
function setHealth(kind, title) {
  el.healthDot.classList.remove("ok", "bad", "busy");
  if (kind) el.healthDot.classList.add(kind);
  el.healthDot.title = title || "";
}

/* Theme */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "dark");
  localStorage.setItem(THEME_KEY, theme === "light" ? "light" : "dark");
  el.btnTheme.textContent = theme === "light" ? "◑ Тема" : "◐ Тема";
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") || "dark";
  applyTheme(cur === "light" ? "dark" : "light");
}

/* Store + tree branching */
function nid() {
  return "n_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function emptyTreeChat(extra) {
  const c = {
    id: uid(),
    title: "Новый чат",
    messages: [],
    nodes: {},
    leafId: null,
    personaId: "default",
    systemPrompt: "",
    updatedAt: Date.now(),
    pinned: false,
    folderId: null,
    genSettings: Object.assign({}, DEFAULT_GEN),
  };
  if (extra) Object.assign(c, extra);
  return c;
}

function chatGen(chat) {
  const g = (chat && chat.genSettings) || {};
  return {
    temperature: g.temperature != null ? Number(g.temperature) : DEFAULT_GEN.temperature,
    top_k: g.top_k != null ? Number(g.top_k) : DEFAULT_GEN.top_k,
    top_p: g.top_p != null ? Number(g.top_p) : DEFAULT_GEN.top_p,
    max_tokens: g.max_tokens != null ? Number(g.max_tokens) : DEFAULT_GEN.max_tokens,
    repetition_penalty: g.repetition_penalty != null ? Number(g.repetition_penalty) : DEFAULT_GEN.repetition_penalty,
  };
}

function migrateChatToTree(chat) {
  if (!chat) return chat;
  if (chat.nodes && typeof chat.nodes === "object") {
    if (!chat.personaId) chat.personaId = "default";
    if (!chat.genSettings) chat.genSettings = Object.assign({}, DEFAULT_GEN);
    if (chat.pinned == null) chat.pinned = false;
    if (chat.folderId === undefined) chat.folderId = null;
    syncMessagesFromLeaf(chat);
    return chat;
  }
  chat.nodes = {};
  chat.leafId = null;
  chat.personaId = chat.personaId || "default";
  let parentId = null;
  (chat.messages || []).forEach((m) => {
    const id = nid();
    const node = Object.assign({}, m, { id: id, parentId: parentId, children: [] });
    chat.nodes[id] = node;
    if (parentId && chat.nodes[parentId]) chat.nodes[parentId].children.push(id);
    parentId = id;
    chat.leafId = id;
  });
  syncMessagesFromLeaf(chat);
  return chat;
}

function pathToLeaf(chat) {
  if (!chat || !chat.leafId || !chat.nodes) return [];
  const path = [];
  let cur = chat.leafId;
  const guard = {};
  while (cur && chat.nodes[cur] && !guard[cur]) {
    guard[cur] = true;
    path.push(chat.nodes[cur]);
    cur = chat.nodes[cur].parentId;
  }
  path.reverse();
  return path;
}

function syncMessagesFromLeaf(chat) {
  if (!chat) return;
  chat.messages = pathToLeaf(chat).map((n) => {
    const copy = Object.assign({}, n);
    delete copy.children;
    delete copy.parentId;
    return copy;
  });
}

function deepestLeafUnder(chat, nodeId) {
  let cur = nodeId;
  const guard = {};
  while (cur && chat.nodes[cur] && !guard[cur]) {
    guard[cur] = true;
    const kids = chat.nodes[cur].children || [];
    if (!kids.length) break;
    cur = kids[kids.length - 1];
  }
  return cur;
}

function addNode(chat, parentId, fields) {
  const id = nid();
  const node = Object.assign({ id: id, parentId: parentId || null, children: [], role: "user", content: "" }, fields);
  chat.nodes[id] = node;
  if (parentId && chat.nodes[parentId]) {
    if (!chat.nodes[parentId].children) chat.nodes[parentId].children = [];
    chat.nodes[parentId].children.push(id);
  }
  chat.leafId = id;
  syncMessagesFromLeaf(chat);
  return node;
}

function siblingsOf(chat, nodeId) {
  const node = chat.nodes[nodeId];
  if (!node) return [];
  if (!node.parentId) {
    return Object.keys(chat.nodes)
      .map((k) => chat.nodes[k])
      .filter((n) => !n.parentId && n.role === node.role);
  }
  const parent = chat.nodes[node.parentId];
  if (!parent) return [node];
  return (parent.children || []).map((id) => chat.nodes[id]).filter((n) => n && n.role === node.role);
}

function loadPersonas() {
  try {
    const raw = localStorage.getItem(PERSONA_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) {
        state.personas = arr;
        return;
      }
    }
  } catch (_) {}
  state.personas = DEFAULT_PERSONAS.slice();
}
function savePersonas() {
  localStorage.setItem(PERSONA_KEY, JSON.stringify(state.personas));
}

function loadFolders() {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    const data = raw ? JSON.parse(raw) : [];
    state.folders = Array.isArray(data) ? data : [];
  } catch (_) {
    state.folders = [];
  }
}
function saveFolders() {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(state.folders || []));
}
function loadPrompts() {
  try {
    const raw = localStorage.getItem(PROMPTS_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (Array.isArray(data) && data.length) state.prompts = data;
    else {
      state.prompts = [
        { id: "p_explain", name: "Объясни просто", slash: "/explain", body: "Объясни простыми словами: " },
        { id: "p_sum", name: "Суммируй", slash: "/sum", body: "Кратко суммируй следующее:\n\n" },
        { id: "p_code", name: "Код", slash: "/code", body: "Напиши код и поясни:\n\n" },
      ];
    }
  } catch (_) {
    state.prompts = [];
  }
}
function savePrompts() {
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(state.prompts || []));
}
function loadStore() {
  try {
    let raw = localStorage.getItem(STORE_KEY);
    if (!raw) raw = localStorage.getItem(STORE_KEY_LEGACY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.chats)) state.chats = data.chats.map(migrateChatToTree);
    state.activeId = data.activeId || (state.chats[0] && state.chats[0].id) || null;
    if (Array.isArray(data.folders)) state.folders = data.folders;
  } catch (_) {}
}
function saveStoreNow() {
  localStorage.setItem(STORE_KEY, JSON.stringify({ chats: state.chats, activeId: state.activeId, folders: state.folders }));
  saveFolders();
}
function saveStore() {
  if (state.saveTimer) clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(() => {
    state.saveTimer = null;
    saveStoreNow();
  }, 250);
}
function activeChat() {
  return state.chats.find((c) => c.id === state.activeId) || null;
}
function ensureChat() {
  let chat = activeChat();
  if (chat) return migrateChatToTree(chat);
  chat = emptyTreeChat({ systemPrompt: el.systemPrompt.value || "" });
  state.chats.unshift(chat);
  state.activeId = chat.id;
  saveStore();
  return chat;
}

function effectiveSystem(chat) {
  const persona = state.personas.find((p) => p.id === (chat && chat.personaId)) || state.personas[0];
  const fromPersona = (persona && persona.system) || "";
  const fromChat = (chat && chat.systemPrompt) || "";
  if (fromChat && fromPersona) return fromPersona + "\n\n" + fromChat;
  return fromChat || fromPersona || "";
}

/* Markdown + code copy (escape-first; tables/math/lists/headings/quotes) */




function bindCodeCopy(root) {
  root.querySelectorAll(".code-copy").forEach((btn) => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener("click", async () => {
      const wrap = btn.closest(".code-wrap");
      const code = wrap ? wrap.querySelector("code") : null;
      try {
        await navigator.clipboard.writeText(code ? code.textContent : "");
        btn.textContent = "Скопировано";
        setTimeout(() => (btn.textContent = "Копировать"), 1200);
      } catch (_) {
        btn.textContent = "Ошибка";
      }
    });
  });
  root.querySelectorAll(".code-run").forEach((btn) => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener("click", () => runSandboxedJs(btn));
  });
}


/* Sources */
function hostLabel(href) {
  try {
    const u = new URL(href);
    return u.hostname.replace(/^www\./, "") || href;
  } catch (_) {
    return href;
  }
}
function filterSources(sources) {
  if (!Array.isArray(sources)) return [];
  return sources.filter((s) => {
    const title = (s && s.title && String(s.title).trim()) || "";
    const href = (s && (s.url || s.src)) || "";
    return !!(title || href);
  });
}
function scoreTip(s) {
  if (!s || s.score == null || isNaN(Number(s.score))) return "";
  const n = Number(s.score);
  if (n <= 1) return "score ≈ " + Math.round(n * 100) + "%";
  const pct = Math.round(100 / (1 + Math.exp(-n / 5)));
  return "score ≈ " + pct + "% (" + n.toFixed(2) + ")";
}
function sourceLabel(s, i) {
  if (s && s.title && String(s.title).trim()) return String(s.title).trim();
  const href = s && (s.url || s.src);
  if (href) return hostLabel(href);
  return "Источник " + (i + 1);
}
function sourceHref(s) {
  return safeHref((s && (s.url || s.src)) || "");
}

function renderSources(container, sources) {
  const list = filterSources(sources);
  if (!list.length) return;
  const wrap = document.createElement("div");
  wrap.className = "sources-wrap";
  const lab = document.createElement("div");
  lab.className = "chip-label";
  lab.textContent = "Источники";
  wrap.appendChild(lab);
  const box = document.createElement("div");
  box.className = "sources";
  list.forEach((s, i) => {
    const raw = (s && (s.url || s.src)) || "";
    const label = sourceLabel(s, i);
    const tip = [isSafeHttpUrl(raw) ? raw : "", scoreTip(s)].filter(Boolean).join(" · ");
    const node = makeExternalLink(raw, label, "chip");
    if (tip) node.title = tip;
    box.appendChild(node);
  });
  wrap.appendChild(box);
  container.appendChild(wrap);
}

/* Stats line under answer */
function renderAnswerMeta(container, info) {
  const meta = document.createElement("div");
  meta.className = "answer-meta";
  if (info.model) {
    const tag = document.createElement("span");
    tag.className = "model-tag";
    tag.textContent = info.model;
    meta.appendChild(tag);
  }
  const tps = document.createElement("span");
  tps.className = "tps";
  tps.textContent = (info.tps != null ? info.tps.toFixed(1) : "—") + " tok/s";
  meta.appendChild(tps);
  const elap = document.createElement("span");
  elap.className = "elapsed";
  elap.textContent = (info.elapsed != null ? info.elapsed.toFixed(1) : "—") + " с";
  meta.appendChild(elap);
  container.appendChild(meta);
  return { meta, tps, elap };
}

function estimateTokens(text) {
  // rough: ~4 chars / token for mixed RU/EN
  return Math.max(1, Math.round(String(text || "").length / 4));
}

/* Sidebar */
function sortedChats() {
  return state.chats.slice().sort((a, b) => {
    const pa = a.pinned ? 1 : 0;
    const pb = b.pinned ? 1 : 0;
    if (pb !== pa) return pb - pa;
    const oa = a.order != null ? a.order : 0;
    const ob = b.order != null ? b.order : 0;
    if (oa !== ob) return oa - ob;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });
}

function makeChatItem(chat, q) {
  const hay = (
    (chat.title || "") +
    " " +
    (chat.messages || []).map((m) => m.content || "").join(" ")
  ).toLowerCase();
  const match = !q || hay.indexOf(q) !== -1;
  const li = document.createElement("li");
  li.className =
    "chat-item" +
    (chat.id === state.activeId ? " active" : "") +
    (chat.pinned ? " pinned" : "") +
    (match ? "" : " hidden");
  li.draggable = true;
  li.dataset.chatId = chat.id;
  li.addEventListener("dragstart", (e) => {
    li.classList.add("dragging");
    e.dataTransfer.setData("text/plain", chat.id);
    e.dataTransfer.effectAllowed = "move";
  });
  li.addEventListener("dragend", () => li.classList.remove("dragging"));
  li.addEventListener("dragover", (e) => {
    e.preventDefault();
    li.classList.add("drag-over");
  });
  li.addEventListener("dragleave", () => li.classList.remove("drag-over"));
  li.addEventListener("drop", (e) => {
    e.preventDefault();
    li.classList.remove("drag-over");
    const fromId = e.dataTransfer.getData("text/plain");
    if (!fromId || fromId === chat.id) return;
    const from = state.chats.find((c) => c.id === fromId);
    const to = chat;
    if (!from || !to) return;
    from.folderId = to.folderId || null;
    const ids = sortedChats().map((c) => c.id);
    const fi = ids.indexOf(fromId);
    const ti = ids.indexOf(to.id);
    if (fi < 0 || ti < 0) return;
    ids.splice(fi, 1);
    ids.splice(ti, 0, fromId);
    ids.forEach((id, i) => {
      const c = state.chats.find((x) => x.id === id);
      if (c) c.order = i;
    });
    saveStore();
    renderSidebar();
  });
  const openBtn = document.createElement("button");
  openBtn.type = "button";
  openBtn.className = "chat-open";
  openBtn.textContent = chat.title || "Без названия";
  openBtn.addEventListener("click", () => {
    state.activeId = chat.id;
    saveStore();
    syncSystemField();
    syncGenSettingsUI();
    renderAll();
    if (isMobile()) {
      el.sidebar.classList.remove("open");
      el.backdrop.hidden = true;
    }
  });
  const actions = document.createElement("div");
  actions.className = "chat-actions";
  const pin = document.createElement("button");
  pin.type = "button";
  pin.textContent = chat.pinned ? "📌" : "📍";
  pin.title = chat.pinned ? "Открепить" : "Закрепить";
  pin.addEventListener("click", (e) => {
    e.stopPropagation();
    chat.pinned = !chat.pinned;
    saveStore();
    renderSidebar();
  });
  const rename = document.createElement("button");
  rename.type = "button";
  rename.textContent = "✎";
  rename.addEventListener("click", (e) => {
    e.stopPropagation();
    const next = prompt("Название чата", chat.title);
    if (next && next.trim()) {
      chat.title = next.trim();
      saveStore();
      renderAll();
    }
  });
  const fold = document.createElement("button");
  fold.type = "button";
  fold.textContent = "📁";
  fold.title = "Папка";
  fold.addEventListener("click", (e) => {
    e.stopPropagation();
    const names = ["(без папки)"].concat(state.folders.map((f) => f.name));
    const pick = prompt("Папка:\\n" + names.map((n, i) => i + ". " + n).join("\\n"), "0");
    if (pick == null) return;
    const idx = parseInt(pick, 10);
    if (idx === 0 || isNaN(idx)) chat.folderId = null;
    else if (state.folders[idx - 1]) chat.folderId = state.folders[idx - 1].id;
    saveStore();
    renderSidebar();
  });
  const del = document.createElement("button");
  del.type = "button";
  del.textContent = "✕";
  del.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!confirm("Удалить этот чат?")) return;
    state.chats = state.chats.filter((c) => c.id !== chat.id);
    if (state.activeId === chat.id) state.activeId = state.chats[0] ? state.chats[0].id : null;
    saveStore();
    syncSystemField();
    syncGenSettingsUI();
    renderAll();
  });
  actions.appendChild(pin);
  actions.appendChild(fold);
  actions.appendChild(rename);
  actions.appendChild(del);
  li.appendChild(openBtn);
  li.appendChild(actions);
  return li;
}

function renderSidebar() {
  const q = (state.search || "").toLowerCase().trim();
  el.chatList.innerHTML = "";
  const chats = sortedChats();
  const unfiled = chats.filter((c) => !c.folderId);
  unfiled.forEach((chat) => el.chatList.appendChild(makeChatItem(chat, q)));
  (state.folders || []).forEach((folder) => {
    const kids = chats.filter((c) => c.folderId === folder.id);
    const row = document.createElement("li");
    row.className = "folder-row";
    const collapsed = !!state.folderCollapsed[folder.id];
    row.innerHTML =
      "<span>" +
      (collapsed ? "▸" : "▾") +
      " 📁 " +
      escapeHtml(folder.name) +
      '</span><span class="folder-count">' +
      Number(kids.length) +
      "</span>";
    const wrap = document.createElement("ul");
    wrap.className = "folder-chats";
    wrap.hidden = collapsed;
    kids.forEach((chat) => wrap.appendChild(makeChatItem(chat, q)));
    row.addEventListener("click", () => {
      state.folderCollapsed[folder.id] = !state.folderCollapsed[folder.id];
      renderSidebar();
    });
    row.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (!confirm("Удалить папку «" + folder.name + "»? Чаты останутся.")) return;
      state.chats.forEach((c) => {
        if (c.folderId === folder.id) c.folderId = null;
      });
      state.folders = state.folders.filter((f) => f.id !== folder.id);
      saveFolders();
      saveStore();
      renderSidebar();
    });
    // drop onto folder
    row.addEventListener("dragover", (e) => e.preventDefault());
    row.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const fromId = e.dataTransfer.getData("text/plain");
      const from = state.chats.find((c) => c.id === fromId);
      if (!from) return;
      from.folderId = folder.id;
      saveStore();
      renderSidebar();
    });
    const holder = document.createElement("li");
    holder.style.listStyle = "none";
    holder.appendChild(row);
    holder.appendChild(wrap);
    el.chatList.appendChild(holder);
  });
}

function clearMessagesDom() {
  Array.from(el.messages.children).forEach((n) => {
    if (n.id !== "emptyState") n.remove();
  });
}

function appendUserBubble(content, opts) {
  opts = opts || {};
  el.emptyState.hidden = true;
  const wrap = document.createElement("div");
  wrap.className = "msg user";
  if (opts.nodeId) wrap.dataset.nodeId = opts.nodeId;
  const av = document.createElement("div");
  av.className = "avatar";
  av.textContent = "Я";
  const col = document.createElement("div");
  col.className = "msg-col";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = renderMarkdown(content);
  col.appendChild(bubble);
  if (opts.attachments && opts.attachments.length) {
    opts.attachments.forEach((a) => {
      const chip = document.createElement("span");
      chip.className = "attach-chip";
      chip.textContent = "📎 " + (a.name || "файл");
      col.appendChild(chip);
    });
  }
  const meta = document.createElement("div");
  meta.className = "msg-meta";
  if (opts.siblings && opts.siblings.length > 1) {
    const nav = document.createElement("div");
    nav.className = "branch-nav";
    const prev = document.createElement("button");
    prev.type = "button";
    prev.textContent = "‹";
    prev.title = "Предыдущая ветка";
    const label = document.createElement("span");
    label.textContent = opts.sibIndex + "/" + opts.siblings.length;
    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "›";
    next.title = "Следующая ветка";
    prev.addEventListener("click", () => switchBranch(opts.nodeId, -1));
    next.addEventListener("click", () => switchBranch(opts.nodeId, 1));
    nav.appendChild(prev);
    nav.appendChild(label);
    nav.appendChild(next);
    meta.appendChild(nav);
  }
  if (opts.showEdit) {
    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Изменить";
    edit.addEventListener("click", () => editUserNode(opts.nodeId, content));
    meta.appendChild(edit);
  }
  if (meta.childNodes.length) col.appendChild(meta);
  wrap.appendChild(av);
  wrap.appendChild(col);
  el.messages.appendChild(wrap);
  return { wrap, bubble, col };
}

function switchBranch(nodeId, delta) {
  const chat = activeChat();
  if (!chat || !chat.nodes[nodeId]) return;
  const sibs = siblingsOf(chat, nodeId);
  if (sibs.length < 2) return;
  const idx = sibs.findIndex((s) => s.id === nodeId);
  const next = sibs[(idx + delta + sibs.length) % sibs.length];
  chat.leafId = deepestLeafUnder(chat, next.id);
  syncMessagesFromLeaf(chat);
  chat.updatedAt = Date.now();
  saveStore();
  renderAll();
}

function createBotColumn(modelName) {
  const col = document.createElement("div");
  col.className = "msg-col";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = '<span class="cursor"></span>';
  col.appendChild(bubble);
  const live = renderAnswerMeta(col, { model: modelName, tps: 0, elapsed: 0 });
  return { col, bubble, live };
}

function finalizeBotColumn(col, bubble, content, sources, info, actions) {
  bubble.innerHTML = renderMarkdown(content || "(пустой ответ)");
  bindCodeCopy(bubble);
  if (liveUpdate(col, info), sources) renderSources(col, sources);
  // refresh meta
  const old = col.querySelector(".answer-meta");
  if (old) old.remove();
  renderAnswerMeta(col, info);
  if (actions && actions.length) {
    const meta = document.createElement("div");
    meta.className = "msg-meta";
    actions.forEach((a) => meta.appendChild(a));
    col.appendChild(meta);
  }
}
function liveUpdate() {}

function makeBtn(label, fn) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  b.addEventListener("click", fn);
  return b;
}

function renderMessages() {
  clearMessagesDom();
  const chat = activeChat();
  if (chat) migrateChatToTree(chat);
  el.chatTitle.textContent = chat ? chat.title : "Новый чат";
  syncPersonaSelect(chat);
  if (!chat || !chat.messages.length) {
    el.emptyState.hidden = false;
    return;
  }
  el.emptyState.hidden = true;
  let msgs = chat.messages;
  let truncated = 0;
  if (msgs.length > MAX_RENDER_MSGS) {
    truncated = msgs.length - MAX_RENDER_MSGS;
    msgs = msgs.slice(-MAX_RENDER_MSGS);
    const note = document.createElement("div");
    note.className = "msg-trunc";
    note.textContent = "Показаны последние " + MAX_RENDER_MSGS + " из " + chat.messages.length + " сообщений";
    el.messages.appendChild(note);
  }
  let lastUserIdx = -1;
  msgs.forEach((m, i) => {
    if (m.role === "user") lastUserIdx = i;
  });
  msgs.forEach((m, i) => {
    if (m.role === "system") return;
    if (m.role === "user") {
      const sibs = m.id && chat.nodes[m.id] ? siblingsOf(chat, m.id) : [];
      const sibIndex = Math.max(0, sibs.findIndex((s) => s.id === m.id)) + 1;
      appendUserBubble(m.content, {
        showEdit: i === lastUserIdx,
        nodeId: m.id,
        attachments: m.attachments,
        siblings: sibs,
        sibIndex: sibIndex,
      });
      return;
    }
    if (m.compare && Array.isArray(m.compare)) {
      const row = document.createElement("div");
      row.className = "compare-row";
      m.compare.forEach((side) => {
        const ccol = document.createElement("div");
        ccol.className = "compare-col";
        const head = document.createElement("div");
        head.className = "compare-head";
        head.innerHTML = "<strong>" + escapeHtml(side.model || "?") + "</strong>";
        ccol.appendChild(head);
        const bubble = document.createElement("div");
        bubble.className = "bubble";
        bubble.innerHTML = renderMarkdown(side.content || "");
        bindCodeCopy(bubble);
        ccol.appendChild(bubble);
        renderSources(ccol, side.sources);
        renderAnswerMeta(ccol, {
          model: side.model,
          tps: side.tps,
          elapsed: side.elapsed,
        });
        row.appendChild(ccol);
      });
      el.messages.appendChild(row);
      return;
    }
    // tool cards from /calc /wiki /time
    const toolName = m.tool || ((m.model || "").indexOf("tool:") === 0 ? String(m.model).slice(5) : "");
    if (toolName) {
      const wrap = document.createElement("div");
      wrap.className = "msg bot tool-msg";
      if (m.id) wrap.dataset.nodeId = m.id;
      const av = document.createElement("div");
      av.className = "avatar";
      av.textContent = "✦";
      const col = document.createElement("div");
      col.className = "msg-col";
      const card = document.createElement("div");
      card.className = "tool-card";
      card.innerHTML =
        '<div class="tool-head"><span class="tool-badge">' + escapeHtml(toolName) + '</span>' +
        '<span class="tool-title">tool</span></div><div class="tool-body"></div>';
      const toolBody = card.querySelector(".tool-body");
      // wiki may contain URL on second line — build cite via DOM (no href concat)
      if (toolName === "wiki") {
        const lines = String(m.content || "").split("\n");
        const snip = lines[0] || "";
        const maybeUrl = lines[1] || "";
        const snipDiv = document.createElement("div");
        snipDiv.textContent = snip;
        toolBody.appendChild(snipDiv);
        const href = safeHref(maybeUrl);
        if (href) {
          const cite = document.createElement("div");
          cite.className = "tool-cite";
          cite.appendChild(document.createTextNode("источник: "));
          cite.appendChild(makeExternalLink(href, hostLabel(href), ""));
          toolBody.appendChild(cite);
        }
      } else {
        toolBody.textContent = m.content || "";
      }
      col.appendChild(card);
      wrap.appendChild(av);
      wrap.appendChild(col);
      el.messages.appendChild(wrap);
      return;
    }
    const wrap = document.createElement("div");
    wrap.className = "msg bot";
    if (m.id) wrap.dataset.nodeId = m.id;
    const av = document.createElement("div");
    av.className = "avatar";
    av.textContent = "✦";
    const col = document.createElement("div");
    col.className = "msg-col";
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    if ((state.heatmap || state.confHighlight) && m.tokenParts && m.tokenParts.length) {
      bubble.innerHTML = renderConfHtml(m.tokenParts);
    } else {
      bubble.innerHTML = renderMarkdown(m.content || "");
    }
    bindCodeCopy(bubble);
    col.appendChild(bubble);
    renderSources(col, m.sources);
    renderAnswerMeta(col, { model: m.model, tps: m.tps, elapsed: m.elapsed });
    const meta = document.createElement("div");
    meta.className = "msg-meta";
    if (m.id && chat.nodes[m.id]) {
      const sibs = siblingsOf(chat, m.id);
      if (sibs.length > 1) {
        const nav = document.createElement("div");
        nav.className = "branch-nav";
        const prev = document.createElement("button");
        prev.type = "button";
        prev.textContent = "‹";
        const label = document.createElement("span");
        const sibIndex = Math.max(0, sibs.findIndex((s) => s.id === m.id)) + 1;
        label.textContent = sibIndex + "/" + sibs.length;
        const next = document.createElement("button");
        next.type = "button";
        next.textContent = "›";
        prev.addEventListener("click", () => switchBranch(m.id, -1));
        next.addEventListener("click", () => switchBranch(m.id, 1));
        nav.appendChild(prev);
        nav.appendChild(label);
        nav.appendChild(next);
        meta.appendChild(nav);
      }
    }
    meta.appendChild(
      makeBtn("Копировать", async () => {
        try {
          await navigator.clipboard.writeText(m.content || "");
        } catch (_) {}
      })
    );
    meta.appendChild(makeBtn("Заново", () => regenerateAnswer()));
    const prevUser = [...msgs].slice(0, i).reverse().find((x) => x.role === "user");
    attachFeedback(meta, { model: m.model, prompt: prevUser ? prevUser.content : "", answer: m.content });
    meta.appendChild(
      makeBtn("Объяснить", () =>
        openExplain(prevUser ? prevUser.content : "", m.content || "", m.model || el.modelSelect.value || "")
      )
    );
    col.appendChild(meta);
    if (m.diffFrom) showAnswerDiff(col, m.diffFrom, m.content || "");
    wrap.appendChild(av);
    wrap.appendChild(col);
    el.messages.appendChild(wrap);
  });
  el.messages.scrollTop = el.messages.scrollHeight;
}

function renderAll() {
  renderSidebar();
  renderMessages();
    if (typeof requestSimilarChats === "function") requestSimilarChats();
  if (typeof scheduleTokenBudget === "function") scheduleTokenBudget();
}

function syncSystemField() {
  const chat = activeChat();
  el.systemPrompt.value = (chat && chat.systemPrompt) || "";
}

function syncGenSettingsUI() {
  const g = chatGen(activeChat());
  if (el.tempSlider) el.tempSlider.value = g.temperature;
  if (el.tokensSlider) el.tokensSlider.value = g.max_tokens;
  if (el.topkSlider) el.topkSlider.value = g.top_k;
  if (el.toppSlider) el.toppSlider.value = g.top_p;
  if (el.repSlider) el.repSlider.value = g.repetition_penalty;
  if (el.tempVal) el.tempVal.textContent = Number(g.temperature).toFixed(2);
  if (el.tokensVal) el.tokensVal.textContent = String(g.max_tokens);
  if (el.topkVal) el.topkVal.textContent = String(g.top_k);
  if (el.toppVal) el.toppVal.textContent = Number(g.top_p).toFixed(2);
  if (el.repVal) el.repVal.textContent = Number(g.repetition_penalty).toFixed(2);
  if (el.heatmapToggle) el.heatmapToggle.checked = !!state.heatmap;
  if (el.heatmapLegend) el.heatmapLegend.hidden = !state.heatmap;
}

function persistGenFromUI() {
  const chat = ensureChat();
      chat.genSettings = {
    temperature: Math.min(5, Math.max(0, Number(el.tempSlider.value))),
    max_tokens: Math.min(4096, Math.max(1, Number(el.tokensSlider.value))),
    top_k: Math.min(500, Math.max(0, Number(el.topkSlider.value))),
    top_p: el.toppSlider ? Math.min(1, Math.max(0.01, Number(el.toppSlider.value))) : DEFAULT_GEN.top_p,
    repetition_penalty: el.repSlider ? Math.min(3, Math.max(0.5, Number(el.repSlider.value))) : DEFAULT_GEN.repetition_penalty,
  };
  saveStore();
}

function newChat() {
  const chat = emptyTreeChat({
    systemPrompt: el.systemPrompt.value || "",
    personaId: (el.personaSelect && el.personaSelect.value) || "default",
  });
  state.chats.unshift(chat);
  state.activeId = chat.id;
  saveStore();
  syncSystemField();
  renderAll();
  el.input.focus();
}

function autoResize() {
  el.input.style.height = "auto";
  el.input.style.height = Math.min(el.input.scrollHeight, 160) + "px";
}

/* SSE parse: data: {"content","p","lp","i"}, event: sources, event: end {i}, data: [DONE] */
async function consumeStream(res, onChunk, onSources, onToken, onEvent) {
  if (_sseReady) await _sseReady;
  const ctype = (res.headers.get("content-type") || "").toLowerCase();
  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buf = "";
  let full = "";
  let eventName = "";
  const sse = ctype.includes("text/event-stream");
  const variants = {}; // i -> text

  function handleData(payload) {
    if (payload === "[DONE]") {
      if (onEvent) onEvent("done", {});
      return;
    }
    try {
      const obj = JSON.parse(payload);
      if (eventName === "sources" || obj.sources) {
        const src = obj.sources || obj;
        if (Array.isArray(src)) onSources(src);
        return;
      }
      if (eventName === "end") {
        if (onEvent) onEvent("end", obj || {});
        return;
      }
      const t = obj.content || obj.token || obj.text || "";
      const idx = obj.i != null ? Number(obj.i) : 0;
      if (obj.p != null || obj.prob != null || obj.lp != null) {
        state.sseHasP = true;
        updateConfToggleState();
      }
      if (t) {
        if (!variants[idx]) variants[idx] = "";
        variants[idx] += t;
        if (idx === 0) {
          full = variants[0];
          onChunk(full);
        } else if (onEvent) {
          onEvent("variant", { i: idx, text: variants[idx] });
        }
        if (onToken) {
          onToken({
            text: t,
            p: obj.p != null ? obj.p : obj.prob,
            lp: obj.lp != null ? obj.lp : null,
            i: idx,
          });
        }
      } else if (onEvent && (obj.i != null)) {
        onEvent(eventName || "meta", obj);
      }
    } catch (_) {
      if (eventName === "sources" || eventName === "end") {
        if (eventName === "end" && onEvent) {
          try { onEvent("end", JSON.parse(payload)); } catch (e2) { onEvent("end", {}); }
        }
        return;
      }
      full += payload;
      onChunk(full);
    }
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const piece = decoder.decode(value, { stream: true });
    if (sse || piece.includes("data:") || piece.includes("event:") || buf.startsWith("data:")) {
      buf += piece;
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
          continue;
        }
        if (line.startsWith("data:")) {
          handleData(line.slice(5).trimStart());
          eventName = "";
          continue;
        }
        if (!line.trim()) eventName = "";
      }
    } else {
      full += piece;
      onChunk(full);
    }
  }
  return full;
}

function buildMessagesPayload(chatMessages, systemPrompt) {
  const out = [];
  if (systemPrompt && systemPrompt.trim()) {
    out.push({ role: "system", content: systemPrompt.trim() });
  }
  chatMessages.forEach((m) => {
    if (m.role === "system") return;
    if (m.compare) return; // don't resend compare blobs
    out.push({ role: m.role, content: m.content });
  });
  return out;
}

async function fetchChatStream(model, messages, signal, attachments) {
  const gen = chatGen(activeChat());
  const body = {
    messages: messages,
    model: model,
    max_new_tokens: gen.max_tokens,
    temperature: gen.temperature,
    top_k: gen.top_k,
    top_p: gen.top_p,
    repetition_penalty: gen.repetition_penalty,
    use_rag: true,
    attachments: (attachments || []).map((a) => ({
      name: a.name || "file.txt",
      text: String(a.text || "").slice(0, MAX_ATTACH_CHARS),
    })),
  };
  const paths = state.resolved.chat ? [state.resolved.chat] : [API.chat, API.fallback.chat];
  let lastErr = null;
  for (const path of paths) {
    try {
      const payload =
        path.indexOf("/api/") === 0
          ? body
          : {
              message: (messages.filter((m) => m.role === "user").pop() || {}).content || "",
              history: messages.filter((m) => m.role !== "user" || m !== messages[messages.length - 1]),
              use_rag: true,
              max_new_tokens: body.max_new_tokens,
              temperature: body.temperature,
              top_k: body.top_k,
              top_p: body.top_p,
              repetition_penalty: body.repetition_penalty,
            };
      const res = await fetch(url(path), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream, text/plain" },
        body: JSON.stringify(payload),
        signal: signal,
      });
      if (res.status === 404) {
        lastErr = new Error("404");
        continue;
      }
      if (!res.ok || !res.body) throw new Error("chat " + res.status);
      state.resolved.chat = path;
      return res;
    } catch (e) {
      if (e.name === "AbortError") throw e;
      lastErr = e;
    }
  }
  throw lastErr || new Error("chat failed");
}

async function runOneStream(model, messages, bubble, liveEls, signal) {
  const t0 = performance.now();
  let sources = [];
  let full = "";
  const tokenParts = [];
  const tick = setInterval(() => {
    const elapsed = (performance.now() - t0) / 1000;
    const tps = estimateTokens(full) / Math.max(elapsed, 0.05);
    if (liveEls) {
      liveEls.tps.textContent = tps.toFixed(1) + " tok/s";
      liveEls.elap.textContent = elapsed.toFixed(1) + " с";
    }
  }, 200);
  try {
    showError(false);
    const res = await fetchChatStream(model, messages, signal, state.pendingApiAttach);
    full = await consumeStream(
      res,
      (t) => {
        full = t;
        if ((state.heatmap || state.confHighlight) && tokenParts.length) {
          bubble.innerHTML = renderConfHtml(tokenParts) + '<span class="cursor"></span>';
        } else {
          bubble.innerHTML = renderMarkdown(t) + '<span class="cursor"></span>';
          bindCodeCopy(bubble);
        }
        el.messages.scrollTop = el.messages.scrollHeight;
      },
      (src) => {
        sources = src;
      },
      (part) => {
        tokenParts.push(part);
      }
    );
    showError(false);
  } catch (e) {
    if (e && e.name === "AbortError") {
      full = (full || bubble.textContent || "").replace(/\s*$/, "");
      if (full) full += "…";
    } else {
      showError(true);
      full = full || "_Ошибка ответа_";
    }
  } finally {
    clearInterval(tick);
  }
  const elapsed = (performance.now() - t0) / 1000;
  const tps = estimateTokens(full) / Math.max(elapsed, 0.05);
  return { content: full || "(пустой ответ)", sources: sources, model: model, tps: tps, elapsed: elapsed, tokenParts: tokenParts };
}

function setStreamingUI(on) {
  state.streaming = on;
  el.btnSend.disabled = on;
  el.btnStop.hidden = !on;
  el.input.disabled = on;
  if (!on) state.pendingApiAttach = [];
}

async function sendMessage(text) {
  let content = (text || el.input.value || "").trim();
  if ((!content && !state.pendingAttach.length) || state.streaming) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    enqueueOfflineMessage(content || "(вложение)");
    el.input.value = "";
    autoResize();
    return;
  }

  // Agent-style tools: /calc /wiki /time
  const tool = matchChatTool(content);
  if (tool) {
    el.input.value = "";
    autoResize();
    await runChatTool(tool);
    return;
  }

  const chat = ensureChat();
  chat.systemPrompt = el.systemPrompt.value || "";
  if (el.personaSelect) chat.personaId = el.personaSelect.value || chat.personaId || "default";

  const attachments = state.pendingAttach.slice();
  state.pendingAttach = [];
  renderAttachChips();
  if (attachments.length) {
    const blob = attachments
      .map((a) => "--- файл: " + a.name + " ---\n" + a.text)
      .join("\n\n");
    content = (content ? content + "\n\n" : "") + blob;
  }
  if (!content.trim()) return;

  if (chat.title === "Новый чат") chat.title = content.slice(0, 42) + (content.length > 42 ? "…" : "");

  let parentId = chat.leafId;
  if (state.branchEditParentId !== null && state.branchEditParentId !== undefined) {
    parentId = state.branchEditParentId;
    state.branchEditParentId = null;
  }
  const userNode = addNode(chat, parentId, {
    role: "user",
    content: content,
    attachments: attachments.map((a) => ({ name: a.name, size: a.size, chars: (a.text || "").length })),
  });
  state.pendingApiAttach = attachments.slice();
  chat.updatedAt = Date.now();
  el.input.value = "";
  autoResize();
  saveStore();
  renderAll();

  const apiMsgs = buildMessagesPayload(chat.messages, effectiveSystem(chat));
  const compare = el.compareMode.checked;

  if (!compare) {
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
    const meta = document.createElement("div");
    meta.className = "msg-meta";
    meta.appendChild(
      makeBtn("Копировать", async () => {
        try {
          await navigator.clipboard.writeText(result.content);
        } catch (_) {}
      })
    );
    meta.appendChild(makeBtn("Заново", () => regenerateAnswer()));
    const prevU = [...chat.messages].reverse().find((x) => x.role === "user");
    attachFeedback(meta, { model: result.model, prompt: prevU ? prevU.content : "", answer: result.content });
    built.col.appendChild(meta);

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
    renderSidebar();
    return;
  }

  // Compare mode
  const modelA = el.modelSelectA.value || "mygpt-latest";
  const modelB = el.modelSelectB.value || "rag-only";
  const row = document.createElement("div");
  row.className = "compare-row";
  const sides = [
    { key: "A", model: modelA },
    { key: "B", model: modelB },
  ].map((s) => {
    const ccol = document.createElement("div");
    ccol.className = "compare-col";
    const head = document.createElement("div");
    head.className = "compare-head";
    const title = document.createElement("strong");
    title.textContent = s.model;
    const stopBtn = document.createElement("button");
    stopBtn.type = "button";
    stopBtn.className = "btn btn-danger btn-sm";
    stopBtn.textContent = "Стоп";
    head.appendChild(title);
    head.appendChild(stopBtn);
    ccol.appendChild(head);
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = '<span class="cursor"></span>';
    ccol.appendChild(bubble);
    const live = renderAnswerMeta(ccol, { model: s.model, tps: 0, elapsed: 0 });
    row.appendChild(ccol);
    return { ...s, ccol, bubble, live, stopBtn };
  });
  el.messages.appendChild(row);

  setStreamingUI(true);
  el.btnStop.hidden = false;
  const ctrls = { A: new AbortController(), B: new AbortController() };
  state.aborts = ctrls;
  state.abort = {
    abort() {
      ctrls.A.abort();
      ctrls.B.abort();
    },
  };
  sides.forEach((s) => {
    s.stopBtn.addEventListener("click", () => ctrls[s.key].abort());
  });

  const results = await Promise.all(
    sides.map((s) => runOneStream(s.model, apiMsgs, s.bubble, s.live, ctrls[s.key].signal))
  );

  state.abort = null;
  state.aborts = { A: null, B: null };
  setStreamingUI(false);

  results.forEach((result, i) => {
    const s = sides[i];
    s.bubble.innerHTML = renderMarkdown(result.content);
    bindCodeCopy(s.bubble);
    const old = s.ccol.querySelector(".answer-meta");
    if (old) old.remove();
    // remove stop from head
    const stop = s.ccol.querySelector(".compare-head .btn-danger");
    if (stop) stop.remove();
    renderSources(s.ccol, result.sources);
    renderAnswerMeta(s.ccol, result);
  });

  addNode(chat, userNode.id, {
    role: "assistant",
    compare: results.map((r) => ({
      model: r.model,
      content: r.content,
      sources: r.sources,
      tps: r.tps,
      elapsed: r.elapsed,
    })),
    content: results.map((r) => "**" + r.model + "**\n\n" + r.content).join("\n\n---\n\n"),
  });
  saveStore();
  renderSidebar();
}






function stop() {
  if (state.abort) state.abort.abort();
  if (state.aborts.A) state.aborts.A.abort();
  if (state.aborts.B) state.aborts.B.abort();
}


/* Models / health / train — same as v2 */
async function fetchFirstOk(paths, init) {
  let lastErr = null;
  for (const path of paths) {
    try {
      const res = await fetch(url(path), init);
      if (res.status === 404) continue;
      return { res, path };
    } catch (e) {
      lastErr = e;
    }
  }
  if (lastErr) throw lastErr;
  throw new Error("all 404");
}

function fillModelSelect(sel, names, preferred) {
  if (!sel) return;
  const groups = { "Релизы": [], "Шаги": [], "RAG": [] };
  (names || []).forEach((n) => {
    const s = String(n || "");
    let g = "Релизы";
    if (s === "rag-only" || /^rag/i.test(s) || /\+rag$/i.test(s)) g = "RAG";
    else if (/^step_/i.test(s)) g = "Шаги";
    groups[g].push(n);
  });
  sel.innerHTML = "";
  ["Релизы", "Шаги", "RAG"].forEach((label) => {
    const arr = groups[label];
    if (!arr.length) return;
    const og = document.createElement("optgroup");
    og.label = label;
    arr.forEach((n) => {
      const opt = document.createElement("option");
      opt.value = n;
      opt.textContent = n;
      og.appendChild(opt);
    });
    sel.appendChild(og);
  });
  if (preferred && names.indexOf(preferred) >= 0) sel.value = preferred;
}

async function loadModels() {
  let names = FALLBACK_MODELS.slice();
  try {
    const res = await fetch(url(API.models), { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length) names = data.map((x) => (typeof x === "string" ? x : x.name || x.id)).filter(Boolean);
      else if (data && Array.isArray(data.models)) names = data.models.map((x) => (typeof x === "string" ? x : x.name || x.id)).filter(Boolean);
    }
  } catch (_) {}
  const prev = (state.models || []).slice();
  state.models = names.slice();
  const pair = pickDistinctModelsPure(names);
  const latest = names.indexOf("mygpt-latest") >= 0 ? "mygpt-latest" : names[0];
  fillModelSelect(el.modelSelect, names, latest);
  fillModelSelect(el.modelSelectA, names, pair.a);
  fillModelSelect(el.modelSelectB, names, pair.b);
  fillModelSelect(el.arenaModelA, names, pair.a);
  fillModelSelect(el.arenaModelB, names, pair.b);
  if (el.pgModel) fillModelSelect(el.pgModel, names, latest);
  if (typeof fillModelCardSelect === "function") fillModelCardSelect();
  if (typeof ensureArenaDistinct === "function") ensureArenaDistinct();
  maybeAnnounceSft(prev, names, pair);
}

function maybeAnnounceSft(prev, names, pair) {
  const prevSet = new Set(prev || []);
  const fresh = findSftModelsPure(names).filter((n) => !prevSet.has(n));
  if (!fresh.length) return;
  if (!prev.length) { state._knownSft = findSftModelsPure(names).slice(); return; }
  const sft = fresh[0];
  const base = pair && pair.kind === "sft" ? pair.b : (sft.replace(/_sft$/i, ""));
  pushNotif("model", "Новая модель: " + sft);
  showAppToast("Новая модель", sft + (base ? " · vs " + base : ""), {
    actionLabel: "Сравнить в арене",
    onAction: () => {
      const b = base && base !== sft ? base : "v1";
      if (typeof compareSftInArena === "function") { compareSftInArena(sft); return; }
      ensureFeat("arena").then((a) => {
        if (a && a.compareSftInArena) return a.compareSftInArena(sft);
        if (el.arenaModelA) el.arenaModelA.value = sft;
        if (el.arenaModelB) el.arenaModelB.value = b;
        if (a && a.setArenaOpen) a.setArenaOpen(true);
        else if (typeof setArenaOpen === "function") setArenaOpen(true);
      });
    },
  });
}

function showAppToast(title, body, opts) {
  opts = opts || {};
  let toast = document.getElementById("appToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.className = "app-toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = "";
  const h = document.createElement("strong");
  h.textContent = title || "";
  const p = document.createElement("div");
  p.className = "app-toast-body";
  p.textContent = body || "";
  toast.appendChild(h);
  toast.appendChild(p);
  if (opts.actionLabel && typeof opts.onAction === "function") {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-primary btn-sm";
    btn.textContent = opts.actionLabel;
    btn.addEventListener("click", () => {
      toast.hidden = true;
      try { opts.onAction(); } catch (_) {}
    });
    toast.appendChild(btn);
  }
  toast.hidden = false;
  clearTimeout(state._appToastTimer);
  state._appToastTimer = setTimeout(() => { toast.hidden = true; }, opts.ms || 10000);
}

async function checkHealth() {
  setHealth("busy", "Проверка…");
  try {
    const { res, path } = await fetchFirstOk([API.health, API.fallback.health], { cache: "no-store" });
    state.resolved.health = path;
    if (!res.ok) throw new Error("bad");
    const data = await res.json().catch(() => ({}));
    setHealth("ok", "Онлайн · " + path);
    return !!data;
  } catch (_) {
    setHealth("bad", "Сервер недоступен");
    return false;
  }
}






function ckptLabel(ckpt) {
  if (!ckpt) return "?";
  const parts = String(ckpt).split("/");
  return parts.slice(-2).join("/") || ckpt;
}
















function loadLocalFeedback() {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]");
  } catch (_) {
    return [];
  }
}

function saveLocalFeedback(entry) {
  const all = loadLocalFeedback();
  all.push(entry);
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(all.slice(-200)));
}


function attachFeedback(metaEl, info) {
  const up = document.createElement("button");
  up.type = "button";
  up.className = "fb-btn";
  up.textContent = "👍";
  up.setAttribute("aria-label", "Нравится");
  const down = document.createElement("button");
  down.type = "button";
  down.className = "fb-btn";
  down.textContent = "👎";
  down.setAttribute("aria-label", "Не нравится");
  const note = document.createElement("span");
  note.className = "fb-local";
  note.hidden = true;
  const payload = {
    chat_id: state.activeId || "",
    model: info.model || "",
    prompt: info.prompt || "",
    answer: info.answer || "",
  };
  up.addEventListener("click", () => sendFeedback(payload, up, down, note, 1));
  down.addEventListener("click", () => sendFeedback(payload, up, down, note, -1));
  metaEl.appendChild(up);
  metaEl.appendChild(down);
  metaEl.appendChild(note);
}



function registerPwa() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}


function closeOtherPanels(except) {
  const map = {
    train: el.trainPanel,
    eval: el.evalPanel,
    corpus: el.corpusPanel,
    dataset: el.datasetPanel,
    lab: el.labPanel,
    settings: el.settingsPanel,
    dash: el.dashPanel,
    arena: el.arenaPanel,
    elo: el.eloPanel,
    modelcard: el.modelCardPanel,
    playground: el.playgroundPanel,
    evo: el.evoPanel,
    chatstats: el.chatStatsPanel,
  };
  Object.keys(map).forEach((k) => {
    if (k !== except && map[k]) map[k].hidden = true;
  });
  if (except !== "train" && state.trainTimer) {
    clearInterval(state.trainTimer);
    state.trainTimer = null;
  }
  if (except !== "dash" && state.dashTimer) {
    clearInterval(state.dashTimer);
    state.dashTimer = null;
  }
}





function heatColor(p) {
  // low p -> red, mid -> spark, high -> accent
  p = Math.max(0, Math.min(1, Number(p) || 0));
  const r1 = 232, g1 = 93, b1 = 93;
  const r2 = 240, g2 = 160, b2 = 48;
  const r3 = 61, g3 = 214, b3 = 198;
  let r, g, b;
  if (p < 0.5) {
    const t = p / 0.5;
    r = Math.round(r1 + (r2 - r1) * t);
    g = Math.round(g1 + (g2 - g1) * t);
    b = Math.round(b1 + (b2 - b1) * t);
  } else {
    const t = (p - 0.5) / 0.5;
    r = Math.round(r2 + (r3 - r2) * t);
    g = Math.round(g2 + (g3 - g2) * t);
    b = Math.round(b2 + (b3 - b2) * t);
  }
  return "rgba(" + r + "," + g + "," + b + ",0.55)";
}

function renderConfHtml(parts) {
  // parts: [{text,p?}]
  const heat = !!state.heatmap;
  const conf = !!state.confHighlight;
  return parts
    .map((part) => {
      const raw = escapeHtml(part.text || "");
      if (part.p == null) return raw;
      const p = Math.max(0, Math.min(1, Number(part.p)));
      if (heat) {
        return '<span class="hm-tok" style="background:' + heatColor(p) + '" title="p=' + p.toFixed(3) + '">' + raw + "</span>";
      }
      if (!conf) return raw;
      const alpha = (0.15 + 0.55 * p).toFixed(2);
      return '<span class="conf-tok" style="background:rgba(61,214,198,' + alpha + ')" title="p=' + p.toFixed(3) + '">' + raw + "</span>";
    })
    .join("");
}




























/* ——— UI v9: focus trap / arena / elo / explain / tour / workspace / mobile ——— */

function loadElo() {
  try {
    const raw = JSON.parse(localStorage.getItem(ELO_KEY) || "{}");
    state.elo = raw && typeof raw === "object" ? raw : {};
  } catch (_) {
    state.elo = {};
  }
}
function saveElo() {
  localStorage.setItem(ELO_KEY, JSON.stringify(state.elo || {}));
}
function ensureElo(model) {
  const m = model || "?";
  if (!state.elo[m]) state.elo[m] = { rating: 1000, w: 0, l: 0, t: 0, games: 0 };
  return state.elo[m];
}
function eloExpected(ra, rb) {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}
function applyEloVote(modelA, modelB, vote) {
  const a = ensureElo(modelA);
  const b = ensureElo(modelB);
  const ea = eloExpected(a.rating, b.rating);
  const eb = 1 - ea;
  const K = 32;
  let sa = 0.5, sb = 0.5;
  if (vote === "A") { sa = 1; sb = 0; a.w++; b.l++; }
  else if (vote === "B") { sa = 0; sb = 1; a.l++; b.w++; }
  else { sa = 0.5; sb = 0.5; a.t++; b.t++; }
  a.rating = Math.round(a.rating + K * (sa - ea));
  b.rating = Math.round(b.rating + K * (sb - eb));
  a.games++; b.games++;
  saveElo();
  renderEloTable();
}

















function resetGenToServer() {
  const chat = ensureChat();
  chat.genSettings = Object.assign({}, DEFAULT_GEN);
  saveStore();
  syncGenSettingsUI();
}


function openSidebar(open) {
  if (!el.sidebar) return;
  el.sidebar.classList.toggle("open", !!open);
  if (el.backdrop) {
    el.backdrop.hidden = !open;
    el.backdrop.classList.toggle("show", !!open);
  }
}


/* ——— UI v8: prompts / slash / palette / msg search ——— */
function openOverlay(node) {
  if (!node) return;
  node.hidden = false;
  const dialog = node.querySelector("[role=dialog]") || node;
  trapFocus(dialog);
}
function closeOverlay(node) {
  if (!node) return;
  node.hidden = true;
  releaseFocusTrap();
}
function closeAllOverlays() {
  closeOverlay(el.cmdPalette);
  closeOverlay(el.msgSearchOverlay);
  closeOverlay(el.promptsOverlay);
  closeOverlay(el.explainOverlay);
  closeOverlay(el.workspaceOverlay);
  if (el.notifOverlay) closeOverlay(el.notifOverlay);
  if (el.themeBuilderOverlay) closeOverlay(el.themeBuilderOverlay);
  hideSlashPopup();
}














/* ——— UI v10 ——— */
const SFT_KEY = "mygpt.sft.v1";
const LANG_KEY = "mygpt.lang.v1";
const GEN_CLAMP = {
  temperature: [0, 5],
  max_tokens: [1, 4096],
  top_k: [0, 500],
  top_p: [0.01, 1],
  repetition_penalty: [0.5, 3],
};
let I18N = { ru: {}, en: {} };

function t(key) {
  const lang = state.lang || "ru";
  return (I18N[lang] && I18N[lang][key]) || (I18N.ru && I18N.ru[key]) || key;
}

async function ensureI18n() {
  if (I18N && I18N.ru && Object.keys(I18N.ru).length) return;
  try {
    const m = await import('./i18n.js');
    I18N = m.I18N;
  } catch (_) {}
}
function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (!key) return;
    node.textContent = t(key);
  });
  if (el.btnLang) el.btnLang.textContent = (state.lang || "ru") === "ru" ? "EN" : "RU";
  document.documentElement.lang = state.lang || "ru";
}

function setLang(lang) {
  state.lang = lang === "en" ? "en" : "ru";
  localStorage.setItem(LANG_KEY, state.lang);
  applyI18n();
}

function toggleLang() {
  setLang((state.lang || "ru") === "ru" ? "en" : "ru");
}





function loadSft() {
  try {
    state.sft = JSON.parse(localStorage.getItem(SFT_KEY) || "[]");
    if (!Array.isArray(state.sft)) state.sft = [];
  } catch (_) {
    state.sft = [];
  }
}
function saveSft() {
  localStorage.setItem(SFT_KEY, JSON.stringify(state.sft.slice(-500)));
}























async function lazyBindTab(name, opener) {
  state.lazyTabs = state.lazyTabs || {};
  const map = { arena: "arena", dashboard: "dashboard", playground: "playground", dataset: "dataset", eval: "eval", evo: "evolution", stats: "stats", lab: "lab", train: "train", corpus: "corpus", modelcard: "modelcard" };
  if (!state.lazyTabs[name]) {
    state.lazyTabs[name] = "loading";
    try {
      const feat = map[name];
      if (feat) await ensureFeat(feat);
    } catch (err) {
      console.warn("[mygpt] lazy tab", name, err);
    }
    state.lazyTabs[name] = true;
  }
  return opener(true);
}



/* ——— UI v11 ——— */
const ACCENT_KEY = "mygpt.accent.v1";
const NOTIF_KEY = "mygpt.notif.v1";
const OFFLINE_Q_KEY = "mygpt.offline.queue.v1";
const CTX_WINDOW = 2048;

function loadAccent() {
  const a = localStorage.getItem(ACCENT_KEY);
  if (a && /^#[0-9a-fA-F]{6}$/.test(a)) applyAccent(a, false);
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function relLuminance(rgb) {
  const s = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
}
function contrastRatio(hex1, hex2) {
  const L1 = relLuminance(hexToRgb(hex1));
  const L2 = relLuminance(hexToRgb(hex2));
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}
function applyAccent(hex, persist) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  document.documentElement.style.setProperty("--accent", hex);
  state.accent = hex;
  if (persist !== false) localStorage.setItem(ACCENT_KEY, hex);
  if (el.accentPicker) el.accentPicker.value = hex;
  updateThemeContrast();
}
function updateThemeContrast() {
  if (!el.themeContrast) return;
  const accent = state.accent || getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#3dd6c6";
  const theme = document.documentElement.getAttribute("data-theme") || "dark";
  const bg = theme === "light" ? "#f4f7fb" : "#0b0f14";
  const ratio = contrastRatio(accent, bg);
  const pass = ratio >= 4.5;
  el.themeContrast.className = "theme-contrast " + (pass ? "pass" : "fail");
  el.themeContrast.textContent = "контраст accent/bg: " + ratio.toFixed(2) + ":1 · WCAG AA " + (pass ? "PASS" : "FAIL");
}

/* Similar chats TF-IDF worker */

/* Token budget via /api/tokenize */

/* Model card */

/* ——— UI v12: tools / evolution / chat stats / playground ——— */

function matchChatTool(content) {
  const t = (content || "").trim();
  let m = t.match(/^\/calc\s+(.+)$/i);
  if (m) return { name: "calc", arg: m[1].trim() };
  m = t.match(/^\/wiki\s+(.+)$/i);
  if (m) return { name: "wiki", arg: m[1].trim() };
  if (/^\/time\s*$/i.test(t) || /^\/time\s+/i.test(t)) return { name: "time", arg: "" };
  return null;
}




/* Evolution timeline */

/* Chat statistics */

/* Playground */

/* Notifications center */
function loadNotifs() {
  try {
    state.notifs = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]");
    if (!Array.isArray(state.notifs)) state.notifs = [];
  } catch (e) { state.notifs = []; }
}
function saveNotifs() {
  localStorage.setItem(NOTIF_KEY, JSON.stringify((state.notifs || []).slice(0, 100)));
}
function pushNotif(type, text, extra) {
  state.notifs = state.notifs || [];
  state.notifs.unshift({ id: "n_" + Date.now(), type: type, text: text, extra: extra || null, ts: Date.now(), read: false });
  saveNotifs();
  renderNotifBadge();
  if (el.notifOverlay && !el.notifOverlay.hidden) renderNotifList();
}
function renderNotifBadge() {
  if (!el.notifBadge) return;
  const n = (state.notifs || []).filter((x) => !x.read).length;
  el.notifBadge.hidden = n === 0;
  el.notifBadge.textContent = String(Math.min(99, n));
}

function startNotifPoll() {
  ensureFeat("notifications").then((f) => {
    if (f && f.pollNotifEvents) {
      f.pollNotifEvents();
      if (!state._notifPollTimer) state._notifPollTimer = setInterval(() => f.pollNotifEvents(), 15000);
    }
  }).catch(() => {});
}

/* Offline queue */
function loadOfflineQueue() {
  try {
    state.offlineQ = JSON.parse(localStorage.getItem(OFFLINE_Q_KEY) || "[]");
    if (!Array.isArray(state.offlineQ)) state.offlineQ = [];
  } catch (e) { state.offlineQ = []; }
}
function saveOfflineQueue() {
  localStorage.setItem(OFFLINE_Q_KEY, JSON.stringify(state.offlineQ || []));
}
function showOfflineBanner(on) {
  let b = document.getElementById("offlineBanner");
  if (on) {
    if (!b) {
      b = document.createElement("div");
      b.id = "offlineBanner";
      b.className = "offline-banner";
      b.textContent = "Офлайн — сообщения в очереди, отправим при сети";
      document.body.appendChild(b);
    }
    b.hidden = false;
  } else if (b) b.hidden = true;
}
function enqueueOfflineMessage(text) {
  state.offlineQ = state.offlineQ || [];
  state.offlineQ.push({ text: text, chatId: state.activeId, ts: Date.now() });
  saveOfflineQueue();
  showOfflineBanner(true);
  pushNotif("offline", "В очереди: " + String(text).slice(0, 80));
}
async function flushOfflineQueue() {
  if (!navigator.onLine) return;
  const q = (state.offlineQ || []).slice();
  if (!q.length) { showOfflineBanner(false); return; }
  state.offlineQ = [];
  saveOfflineQueue();
  showOfflineBanner(false);
  for (let i = 0; i < q.length; i++) {
    try {
      if (q[i].chatId) state.activeId = q[i].chatId;
      await sendMessage(q[i].text);
    } catch (e) {
      state.offlineQ.push(q[i]);
    }
  }
  saveOfflineQueue();
  if (state.offlineQ.length) showOfflineBanner(true);
  else pushNotif("offline", "Очередь отправлена");
}
function setupOffline() {
  loadOfflineQueue();
  window.addEventListener("offline", () => showOfflineBanner(true));
  window.addEventListener("online", () => { showOfflineBanner(false); flushOfflineQueue(); });
  if (!navigator.onLine) showOfflineBanner(true);
  else if ((state.offlineQ || []).length) flushOfflineQueue();
}


  function wire() {
  el.btnNewChat.addEventListener("click", newChat);
  el.btnSend.addEventListener("click", () => sendMessage());
  el.btnStop.addEventListener("click", stop);
  el.btnRetry.addEventListener("click", () => {
    showError(false);
    checkHealth();
    loadModels();
  });
  el.btnToggleSidebar.addEventListener("click", () => {
    if (isMobile()) openSidebar(!el.sidebar.classList.contains("open"));
    else el.sidebar.classList.toggle("collapsed");
  });
  el.backdrop.addEventListener("click", () => openSidebar(false));
  el.btnToggleSettings.addEventListener("click", () => {
    const open = el.settingsPanel.hidden;
    el.settingsPanel.hidden = !open;
    if (open) {
      closeOtherPanels("settings");
      syncGenSettingsUI();
    }
  });
  if (el.btnToggleDash) el.btnToggleDash.addEventListener("click", () => setDashOpen(el.dashPanel.hidden));
  if (el.btnDashRefresh) el.btnDashRefresh.addEventListener("click", () => refreshDashboard());
  el.btnToggleTrain.addEventListener("click", () => setTrainOpen(el.trainPanel.hidden));
  el.btnToggleEval.addEventListener("click", () => setEvalOpen(el.evalPanel.hidden));
  el.btnToggleCorpus.addEventListener("click", () => setCorpusOpen(el.corpusPanel.hidden));
  if (el.btnToggleDataset) el.btnToggleDataset.addEventListener("click", () => setDatasetOpen(el.datasetPanel.hidden));
  if (el.datasetForm) el.datasetForm.addEventListener("submit", (e) => { e.preventDefault(); runDatasetSearch(); });
  if (el.btnSftAdd) el.btnSftAdd.addEventListener("click", () => addCurrentDocToSft());
  if (el.btnSftExport) el.btnSftExport.addEventListener("click", () => exportSftJsonl());
  if (el.btnSftClear) el.btnSftClear.addEventListener("click", () => {
    if (!state.sft.length || !confirm("Очистить SFT?")) return;
    state.sft = [];
    saveSft();
    renderSftList();
  });
  if (el.btnEvalDiff) el.btnEvalDiff.addEventListener("click", () => renderEvalDiff());
  if (el.evalDiffA) el.evalDiffA.addEventListener("change", () => {});
  if (el.smoothSlider) el.smoothSlider.addEventListener("input", () => {
    state.lossSmooth = Number(el.smoothSlider.value);
    if (el.smoothVal) el.smoothVal.textContent = String(state.lossSmooth);
    drawLossChart(state.lossHistory || []);
  });
  if (el.trainNotify) el.trainNotify.addEventListener("change", () => {
    if (el.trainNotify.checked && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  });
  if (el.btnShareHtml) el.btnShareHtml.addEventListener("click", () => shareChatHtml());
  if (el.btnSharePng) el.btnSharePng.addEventListener("click", () => shareChatPng());
  if (el.btnLang) el.btnLang.addEventListener("click", () => toggleLang());
  if (el.btnPerf) el.btnPerf.addEventListener("click", () => runPerfCheck());
  if (el.arenaModelA) el.arenaModelA.addEventListener("change", () => ensureArenaDistinct("A"));
  if (el.arenaModelB) el.arenaModelB.addEventListener("change", () => ensureArenaDistinct("B"));
  el.btnToggleLab.addEventListener("click", () => setLabOpen(el.labPanel.hidden));
  if (el.btnToggleArena) el.btnToggleArena.addEventListener("click", () => setArenaOpen(el.arenaPanel.hidden));
  if (el.btnToggleElo) el.btnToggleElo.addEventListener("click", () => setEloOpen(el.eloPanel.hidden));
  if (el.btnArenaRun) el.btnArenaRun.addEventListener("click", () => runArena());
  if (el.btnArenaStop) el.btnArenaStop.addEventListener("click", () => stopArena());
  if (el.btnArenaA) el.btnArenaA.addEventListener("click", () => voteArena("A"));
  if (el.btnArenaB) el.btnArenaB.addEventListener("click", () => voteArena("B"));
  if (el.btnArenaTie) el.btnArenaTie.addEventListener("click", () => voteArena("tie"));
  if (el.arenaMode) el.arenaMode.addEventListener("change", () => {
    if (el.arenaMode.checked) setArenaOpen(true);
    else if (el.arenaPanel) el.arenaPanel.hidden = true;
    if (el.compareModels) el.compareModels.hidden = !(el.arenaMode.checked || el.compareMode.checked);
  });
  if (el.btnExplainClose) el.btnExplainClose.addEventListener("click", () => {
    if (state.explain.timer) explainAutoToggle();
    closeOverlay(el.explainOverlay);
  });
  if (el.btnExplainNext) el.btnExplainNext.addEventListener("click", () => explainNextTop());
  if (el.btnExplainAuto) el.btnExplainAuto.addEventListener("click", () => explainAutoToggle());
  if (el.btnExplainReset) el.btnExplainReset.addEventListener("click", () => explainReset());
  if (el.btnWorkspace) el.btnWorkspace.addEventListener("click", () => openWorkspace());
  if (el.btnWorkspaceClose) el.btnWorkspaceClose.addEventListener("click", () => closeOverlay(el.workspaceOverlay));
  if (el.btnWsExport) el.btnWsExport.addEventListener("click", () => exportWorkspace());
  if (el.btnWsImport && el.wsImportFile) {
    el.btnWsImport.addEventListener("click", () => el.wsImportFile.click());
    el.wsImportFile.addEventListener("change", async () => {
      const f = el.wsImportFile.files && el.wsImportFile.files[0];
      if (!f) return;
      await importWorkspaceFile(f);
      el.wsImportFile.value = "";
    });
  }
  if (el.btnResetGen) el.btnResetGen.addEventListener("click", () => resetGenToServer());
  if (el.btnSettingsClose) el.btnSettingsClose.addEventListener("click", () => { el.settingsPanel.hidden = true; });
  if (el.btnEloReset) el.btnEloReset.addEventListener("click", () => {
    if (!confirm("Сбросить Elo?")) return;
    state.elo = {};
    saveElo();
    renderEloTable();
  });
  if (el.btnTourSkip) el.btnTourSkip.addEventListener("click", () => endTour());
  if (el.btnTourPrev) el.btnTourPrev.addEventListener("click", () => {
    state.tourStep = Math.max(0, state.tourStep - 1);
    renderTour();
  });
  if (el.btnTourNext) el.btnTourNext.addEventListener("click", () => {
    if (state.tourStep >= TOUR_STEPS.length - 1) endTour();
    else { state.tourStep += 1; renderTour(); }
  });
  if (el.personaSelect) el.personaSelect.addEventListener("change", onPersonaChange);
  if (el.btnPersonaAdd) el.btnPersonaAdd.addEventListener("click", addPersona);
  if (el.btnAttach && el.fileAttach) {
    el.btnAttach.addEventListener("click", () => el.fileAttach.click());
    el.fileAttach.addEventListener("change", () => {
      addAttachFiles(el.fileAttach.files);
      el.fileAttach.value = "";
    });
  }
  if (el.btnTeachFile && el.teachFile) {
    el.btnTeachFile.addEventListener("click", () => el.teachFile.click());
    el.teachFile.addEventListener("change", async () => {
      const f = el.teachFile.files && el.teachFile.files[0];
      if (!f) return;
      try {
        const text = await readTextFile(f, MAX_TEACH_BYTES);
        if (text.length < MIN_TEACH_CHARS) {
          if (el.teachStatus) el.teachStatus.textContent = "минимум " + MIN_TEACH_CHARS + " символов";
        }
        if (el.teachText) el.teachText.value = text;
        if (el.teachTitle && !el.teachTitle.value) el.teachTitle.value = f.name.replace(/\.[^.]+$/, "");
      } catch (e) {
        if (el.teachStatus) el.teachStatus.textContent = e.message || "ошибка";
      }
      el.teachFile.value = "";
    });
  }
  if (el.btnTeachSubmit) el.btnTeachSubmit.addEventListener("click", () => submitTeach());

  el.btnLabTok.addEventListener("click", () => runTokenize());
  el.btnLabNext.addEventListener("click", () => runNextProbs());
  el.btnLabNextReset.addEventListener("click", () => { el.labNextPrompt.value = "МойGPT:"; el.labNextBars.innerHTML = ""; });
  el.confToggle.addEventListener("change", () => { state.confHighlight = !!el.confToggle.checked; renderMessages(); });
  el.corpusForm.addEventListener("submit", (e) => { e.preventDefault(); runCorpusSearch(); });
  if (el.btnExportHtml) el.btnExportHtml.addEventListener("click", exportHtml);
  el.btnRefreshEval.addEventListener("click", () => loadEval());
  el.evalCatFilter.addEventListener("change", () => applyEvalCatFilter());
  el.btnResumeTrain.addEventListener("click", resumeTrain);
  el.btnExport.addEventListener("click", exportMarkdown);
  el.btnTheme.addEventListener("click", toggleTheme);
  el.btnHelp.addEventListener("click", () => {
    el.helpTip.hidden = !el.helpTip.hidden;
  });
  el.compareMode.addEventListener("change", () => {
    el.compareModels.hidden = !(el.compareMode.checked || (el.arenaMode && el.arenaMode.checked));
  });
  el.chatSearch.addEventListener("input", () => {
    state.search = el.chatSearch.value;
    renderSidebar();
  });
  el.systemPrompt.addEventListener("change", () => {
    const chat = ensureChat();
    chat.systemPrompt = el.systemPrompt.value;
    saveStore();
  });
  el.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && (el.slashPopup.hidden !== false || !el.slashPopup._items || !el.slashPopup._items.length)) {
      e.preventDefault();
      sendMessage();
    }
  });
  el.examples.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-prompt]");
    if (!btn) return;
    sendMessage(btn.getAttribute("data-prompt"));
  });
  const sync = () => {
    if (el.tempVal) el.tempVal.textContent = Number(el.tempSlider.value).toFixed(2);
    if (el.tokensVal) el.tokensVal.textContent = el.tokensSlider.value;
    if (el.topkVal) el.topkVal.textContent = el.topkSlider.value;
    if (el.toppVal && el.toppSlider) el.toppVal.textContent = Number(el.toppSlider.value).toFixed(2);
    if (el.repVal && el.repSlider) el.repVal.textContent = Number(el.repSlider.value).toFixed(2);
    persistGenFromUI();
  };
  el.tempSlider.addEventListener("input", sync);
  el.tokensSlider.addEventListener("input", sync);
  el.topkSlider.addEventListener("input", sync);
  if (el.toppSlider) el.toppSlider.addEventListener("input", sync);
  if (el.repSlider) el.repSlider.addEventListener("input", sync);
  if (el.heatmapToggle) {
    el.heatmapToggle.addEventListener("change", () => {
      state.heatmap = !!el.heatmapToggle.checked;
      if (el.heatmapLegend) el.heatmapLegend.hidden = !state.heatmap;
      renderMessages();
    });
  }
  sync();

  if (el.btnCmdPalette) el.btnCmdPalette.addEventListener("click", openCmdPalette);
  if (el.btnMsgSearch) el.btnMsgSearch.addEventListener("click", openMsgSearch);
  if (el.btnMsgSearchClose) el.btnMsgSearchClose.addEventListener("click", () => closeOverlay(el.msgSearchOverlay));
  if (el.msgSearchInput) el.msgSearchInput.addEventListener("input", () => runMsgSearch(el.msgSearchInput.value));
  if (el.btnPrompts) el.btnPrompts.addEventListener("click", openPrompts);
  if (el.btnPromptsClose) el.btnPromptsClose.addEventListener("click", () => closeOverlay(el.promptsOverlay));
  if (el.btnNewFolder) el.btnNewFolder.addEventListener("click", createFolder);
  if (el.promptForm) {
    el.promptForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = (el.promptName.value || "").trim();
      let slash = (el.promptSlash.value || "").trim();
      const body = el.promptBody.value || "";
      if (!name || !body.trim()) return;
      if (slash && slash[0] !== "/") slash = "/" + slash;
      if (!slash) slash = "/" + name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_-]/gi, "").slice(0, 24);
      state.prompts.push({ id: "p_" + Math.random().toString(36).slice(2, 9), name: name, slash: slash, body: body });
      savePrompts();
      el.promptName.value = "";
      el.promptSlash.value = "";
      el.promptBody.value = "";
      renderPromptsList();
    });
  }
  if (el.btnPromptExport) {
    el.btnPromptExport.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state.prompts, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "mygpt-prompts.json";
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }
  if (el.btnPromptImport && el.promptImportFile) {
    el.btnPromptImport.addEventListener("click", () => el.promptImportFile.click());
    el.promptImportFile.addEventListener("change", async () => {
      const f = el.promptImportFile.files && el.promptImportFile.files[0];
      if (!f) return;
      try {
        const text = await f.text();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error("not array");
        data.forEach((pr) => {
          if (!pr || !pr.body) return;
          state.prompts.push({
            id: pr.id || "p_" + Math.random().toString(36).slice(2, 9),
            name: pr.name || "промпт",
            slash: pr.slash || "/p",
            body: pr.body,
          });
        });
        savePrompts();
        renderPromptsList();
      } catch (err) {
        alert("Не удалось импортировать JSON");
      }
      el.promptImportFile.value = "";
    });
  }
  if (el.cmdInput) {
    el.cmdInput.addEventListener("input", () => renderCmdList(el.cmdInput.value));
    el.cmdInput.addEventListener("keydown", (e) => {
      const items = el.cmdList._items || [];
      if (e.key === "ArrowDown") {
        e.preventDefault();
        state.cmdIdx = Math.min(items.length - 1, (state.cmdIdx || 0) + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        state.cmdIdx = Math.max(0, (state.cmdIdx || 0) - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const a = items[state.cmdIdx || 0];
        if (a) {
          closeOverlay(el.cmdPalette);
          a.run();
        }
        return;
      } else return;
      Array.from(el.cmdList.children).forEach((li, i) => li.classList.toggle("active", i === state.cmdIdx));
    });
  }
  el.input.addEventListener("input", () => {
    autoResize();
    onInputSlash();
    scheduleTokenBudget();
  });
  // replace previous input-only autoResize binding — already have keydown Enter
  el.input.addEventListener("keydown", (e) => {
    if (!el.slashPopup.hidden && el.slashPopup._items && el.slashPopup._items.length) {
      const items = el.slashPopup._items;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        state.slashIdx = Math.min(items.length - 1, (state.slashIdx || 0) + 1);
        Array.from(el.slashPopup.children).forEach((n, i) => n.classList.toggle("active", i === state.slashIdx));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        state.slashIdx = Math.max(0, (state.slashIdx || 0) - 1);
        Array.from(el.slashPopup.children).forEach((n, i) => n.classList.toggle("active", i === state.slashIdx));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applySlashPrompt(items[state.slashIdx || 0]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        hideSlashPopup();
        return;
      }
    }
  });


  if (el.btnToggleModelCard) el.btnToggleModelCard.addEventListener("click", () => setModelCardOpen(el.modelCardPanel.hidden));
  if (el.btnModelCardRefresh) el.btnModelCardRefresh.addEventListener("click", () => refreshModelCard());
  if (el.modelCardSelect) el.modelCardSelect.addEventListener("change", () => refreshModelCard());
  if (el.btnTogglePlayground) el.btnTogglePlayground.addEventListener("click", () => setPlaygroundOpen(el.playgroundPanel.hidden));
  if (el.btnPgRun) el.btnPgRun.addEventListener("click", () => runPlayground());
  if (el.btnPgStop) el.btnPgStop.addEventListener("click", () => stopPlayground());
  if (el.btnToggleEvo) el.btnToggleEvo.addEventListener("click", () => setEvoOpen(el.evoPanel.hidden));
  if (el.btnEvoRun) el.btnEvoRun.addEventListener("click", () => runEvolution());
  if (el.btnEvoStop) el.btnEvoStop.addEventListener("click", () => stopEvolution());
  if (el.btnToggleChatStats) el.btnToggleChatStats.addEventListener("click", () => setChatStatsOpen(el.chatStatsPanel.hidden));
  if (el.btnChatStatsRefresh) el.btnChatStatsRefresh.addEventListener("click", () => renderChatStats());
  if (el.btnHelpClose) el.btnHelpClose.addEventListener("click", () => { el.helpTip.hidden = true; });
  if (el.btnNotif) el.btnNotif.addEventListener("click", () => openNotifs());
  if (el.btnNotifClose) el.btnNotifClose.addEventListener("click", () => closeOverlay(el.notifOverlay));
  if (el.btnNotifClear) el.btnNotifClear.addEventListener("click", () => clearNotifs());
  if (el.btnThemeBuilder) el.btnThemeBuilder.addEventListener("click", () => openThemeBuilder());
  if (el.btnThemeBuilderClose) el.btnThemeBuilderClose.addEventListener("click", () => closeOverlay(el.themeBuilderOverlay));
  if (el.accentPicker) el.accentPicker.addEventListener("input", () => {
    applyAccent(el.accentPicker.value, false);
    updateThemeContrast();
  });
  if (el.btnAccentApply) el.btnAccentApply.addEventListener("click", () => {
    applyAccent(el.accentPicker.value, true);
    closeOverlay(el.themeBuilderOverlay);
  });
  if (el.btnAccentReset) el.btnAccentReset.addEventListener("click", () => {
    applyAccent("#3dd6c6", true);
    localStorage.removeItem(ACCENT_KEY);
  });

  document.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName) || "";
    const typing = tag === "INPUT" || tag === "TEXTAREA" || (e.target && e.target.isContentEditable);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openCmdPalette();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
      e.preventDefault();
      openMsgSearch();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
      e.preventDefault();
      newChat();
      return;
    }
    if (e.key === "Escape") {
      if (el.tour && !el.tour.hidden) { endTour(); return; }
      if (!el.cmdPalette.hidden || !el.msgSearchOverlay.hidden || !el.promptsOverlay.hidden || (el.explainOverlay && !el.explainOverlay.hidden) || (el.workspaceOverlay && !el.workspaceOverlay.hidden) || (el.notifOverlay && !el.notifOverlay.hidden) || (el.themeBuilderOverlay && !el.themeBuilderOverlay.hidden)) {
        closeAllOverlays();
        return;
      }
      if (!el.helpTip.hidden) {
        el.helpTip.hidden = true;
        return;
      }
      if (!el.slashPopup.hidden) {
        hideSlashPopup();
        return;
      }
      stop();
      return;
    }
    if (!typing && e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      el.input.focus();
    }
    if (!typing && e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      el.helpTip.hidden = !el.helpTip.hidden;
    }
  });
}



/* ——— v15 lazy feature registry ——— */
const _feat = {};
const _featLoading = {};
const FEAT_LOADERS = {
  train: () => import('./features/train.js'),
  eval: () => import('./features/eval.js'),
  corpus: () => import('./features/corpus.js'),
  dashboard: () => import('./features/dashboard.js'),
  lab: () => import('./features/lab.js'),
  arena: () => import('./features/arena.js'),
  onboarding: () => import('./features/onboarding.js'),
  workspace: () => import('./features/workspace.js'),
  prompts: () => import('./features/prompts.js'),
  palette: () => import('./features/palette.js'),
  search: () => import('./features/search.js'),
  dataset: () => import('./features/dataset.js'),
  share: () => import('./features/share.js'),
  theme: () => import('./features/theme.js'),
  modelcard: () => import('./features/modelcard.js'),
  tools: () => import('./features/tools.js'),
  evolution: () => import('./features/evolution.js'),
  stats: () => import('./features/stats.js'),
  playground: () => import('./features/playground.js'),
  notifications: () => import('./features/notifications.js'),
  codeRun: () => import('./features/code-run.js'),
  perf: () => import('./features/perf.js'),
  feedback: () => import('./features/feedback.js'),
  voice: () => import('./features/voice.js'),
  teach: () => import('./features/teach.js'),
  persona: () => import('./features/persona.js'),
  presentation: () => import('./features/presentation.js'),
  chatEdit: () => import('./features/chat-edit.js'),
};

async function ensureFeat(name) {
  if (_feat[name]) return _feat[name];
  if (_featLoading[name]) return _featLoading[name];
  const loader = FEAT_LOADERS[name];
  if (!loader) throw new Error("unknown feature " + name);
  _featLoading[name] = (async () => {
    const mod = await loader();
    const exported = mod.install(getCtx());
    _feat[name] = exported || true;
    return _feat[name];
  })();
  try { return await _featLoading[name]; }
  finally { delete _featLoading[name]; }
}

function lazyFn(feat, name) {
  const wrapped = async function () {
    const f = await ensureFeat(feat);
    const fn = f[name];
    if (typeof fn !== "function") throw new Error("feature " + feat + " missing " + name);
    return fn.apply(this, arguments);
  };
  state._lazyBound = state._lazyBound || {};
  state._lazyBound[name] = wrapped;
  return wrapped;
}

const drawLossChart = lazyFn("train", "drawLossChart");
const normalizeTrain = lazyFn("train", "normalizeTrain");
const pollTrain = lazyFn("train", "pollTrain");
const setTrainOpen = lazyFn("train", "setTrainOpen");
const resumeTrain = lazyFn("train", "resumeTrain");
const renderTrainSamples = lazyFn("train", "renderTrainSamples");
const parseTs = lazyFn("eval", "parseTs");
const dedupeEvalRows = lazyFn("eval", "dedupeEvalRows");
const bestBpcIndex = lazyFn("eval", "bestBpcIndex");
const renderEvalBars = lazyFn("eval", "renderEvalBars");
const collectCats = lazyFn("eval", "collectCats");
const fillCatFilter = lazyFn("eval", "fillCatFilter");
const renderEvalQaDetail = lazyFn("eval", "renderEvalQaDetail");
const renderEvalTable = lazyFn("eval", "renderEvalTable");
const applyEvalCatFilter = lazyFn("eval", "applyEvalCatFilter");
const loadEval = lazyFn("eval", "loadEval");
const setEvalOpen = lazyFn("eval", "setEvalOpen");
const setEvalOpenImpl = lazyFn("eval", "setEvalOpenImpl");
const fillEvalDiffSelects = lazyFn("eval", "fillEvalDiffSelects");
const qaCatBreakdown = lazyFn("eval", "qaCatBreakdown");
const renderQaCatPills = lazyFn("eval", "renderQaCatPills");
const renderEvalDiff = lazyFn("eval", "renderEvalDiff");
const smoothSeries = lazyFn("eval", "smoothSeries");
const formatEta = lazyFn("eval", "formatEta");
const maybeNotifyCkpt = lazyFn("eval", "maybeNotifyCkpt");
const highlightSnippet = lazyFn("corpus", "highlightSnippet");
const runCorpusSearch = lazyFn("corpus", "runCorpusSearch");
const setCorpusOpen = lazyFn("corpus", "setCorpusOpen");
const corpusSourceLabel = lazyFn("dashboard", "corpusSourceLabel");
const corpusSourcesFromStats = lazyFn("dashboard", "corpusSourcesFromStats");
const recordCorpusGrowth = lazyFn("dashboard", "recordCorpusGrowth");
const drawDonut = lazyFn("dashboard", "drawDonut");
const drawGrowth = lazyFn("dashboard", "drawGrowth");
const formatChars = lazyFn("dashboard", "formatChars");
const loadDashCorpusExtra = lazyFn("dashboard", "loadDashCorpusExtra");
const fmtNum = lazyFn("dashboard", "fmtNum");
const refreshDashboard = lazyFn("dashboard", "refreshDashboard");
const setDashOpen = lazyFn("dashboard", "setDashOpen");
const setDashOpenImpl = lazyFn("dashboard", "setDashOpenImpl");
const runTokenize = lazyFn("lab", "runTokenize");
const runNextProbs = lazyFn("lab", "runNextProbs");
const setLabOpen = lazyFn("lab", "setLabOpen");
const updateConfToggleState = lazyFn("lab", "updateConfToggleState");
const trapFocus = lazyFn("arena", "trapFocus");
const releaseFocusTrap = lazyFn("arena", "releaseFocusTrap");
const renderEloTable = lazyFn("arena", "renderEloTable");
const setEloOpen = lazyFn("arena", "setEloOpen");
const setArenaOpen = lazyFn("arena", "setArenaOpen");
const setArenaOpenImpl = lazyFn("arena", "setArenaOpenImpl");
const runArena = lazyFn("arena", "runArena");
const stopArena = lazyFn("arena", "stopArena");
const voteArena = lazyFn("arena", "voteArena");
const openExplain = lazyFn("arena", "openExplain");
const explainStep = lazyFn("arena", "explainStep");
const renderExplainBars = lazyFn("arena", "renderExplainBars");
const pickExplainCand = lazyFn("arena", "pickExplainCand");
const explainNextTop = lazyFn("arena", "explainNextTop");
const explainAutoToggle = lazyFn("arena", "explainAutoToggle");
const explainReset = lazyFn("arena", "explainReset");
const modelGroup = lazyFn("arena", "modelGroup");
const fillModelSelectGrouped = lazyFn("arena", "fillModelSelectGrouped");
const pickDistinctModels = lazyFn("arena", "pickDistinctModels");
const applyArenaPair = lazyFn("arena", "applyArenaPair");
const compareSftInArena = lazyFn("arena", "compareSftInArena");
const ensureArenaDistinct = lazyFn("arena", "ensureArenaDistinct");
const startTour = lazyFn("onboarding", "startTour");
const endTour = lazyFn("onboarding", "endTour");
const renderTour = lazyFn("onboarding", "renderTour");
const openWorkspace = lazyFn("workspace", "openWorkspace");
const exportWorkspace = lazyFn("workspace", "exportWorkspace");
const importWorkspaceFile = lazyFn("workspace", "importWorkspaceFile");
const openPrompts = lazyFn("prompts", "openPrompts");
const renderPromptsList = lazyFn("prompts", "renderPromptsList");
const hideSlashPopup = lazyFn("prompts", "hideSlashPopup");
const showSlashPopup = lazyFn("prompts", "showSlashPopup");
const applySlashPrompt = lazyFn("prompts", "applySlashPrompt");
const onInputSlash = lazyFn("prompts", "onInputSlash");
const createFolder = lazyFn("prompts", "createFolder");
const cmdActions = lazyFn("palette", "cmdActions");
const renderCmdList = lazyFn("palette", "renderCmdList");
const openCmdPalette = lazyFn("palette", "openCmdPalette");
const openMsgSearch = lazyFn("search", "openMsgSearch");
const highlightMsgSnippet = lazyFn("search", "highlightMsgSnippet");
const runMsgSearch = lazyFn("search", "runMsgSearch");
const renderSftList = lazyFn("dataset", "renderSftList");
const exportSftJsonl = lazyFn("dataset", "exportSftJsonl");
const uniqueSourcesFromHits = lazyFn("dataset", "uniqueSourcesFromHits");
const renderDatasetChips = lazyFn("dataset", "renderDatasetChips");
const renderDatasetList = lazyFn("dataset", "renderDatasetList");
const openDatasetDoc = lazyFn("dataset", "openDatasetDoc");
const runDatasetSearch = lazyFn("dataset", "runDatasetSearch");
const addCurrentDocToSft = lazyFn("dataset", "addCurrentDocToSft");
const setDatasetOpen = lazyFn("dataset", "setDatasetOpen");
const setDatasetOpenImpl = lazyFn("dataset", "setDatasetOpenImpl");
const buildStandaloneHtml = lazyFn("share", "buildStandaloneHtml");
const shareChatHtml = lazyFn("share", "shareChatHtml");
const shareChatPng = lazyFn("share", "shareChatPng");
const roundRect = lazyFn("share", "roundRect");
const wrapText = lazyFn("share", "wrapText");
const exportHtml = lazyFn("share", "exportHtml");
const openThemeBuilder = lazyFn("theme", "openThemeBuilder");
const ensureSimilarWorker = lazyFn("modelcard", "ensureSimilarWorker");
const requestSimilarChats = lazyFn("modelcard", "requestSimilarChats");
const renderSimilarList = lazyFn("modelcard", "renderSimilarList");
const updateTokenBudget = lazyFn("modelcard", "updateTokenBudget");
const scheduleTokenBudget = lazyFn("modelcard", "scheduleTokenBudget");
const setModelCardOpen = lazyFn("modelcard", "setModelCardOpen");
const fillModelCardSelect = lazyFn("modelcard", "fillModelCardSelect");
const matchEvalRow = lazyFn("modelcard", "matchEvalRow");
const refreshModelCard = lazyFn("modelcard", "refreshModelCard");
const appendToolCard = lazyFn("tools", "appendToolCard");
const runChatTool = lazyFn("tools", "runChatTool");
const evoModels = lazyFn("evolution", "evoModels");
const loadEvoBpcMap = lazyFn("evolution", "loadEvoBpcMap");
const runEvolution = lazyFn("evolution", "runEvolution");
const stopEvolution = lazyFn("evolution", "stopEvolution");
const setChatStatsOpen = lazyFn("stats", "setChatStatsOpen");
const gatherChatStats = lazyFn("stats", "gatherChatStats");
const drawDayChart = lazyFn("stats", "drawDayChart");
const drawModelPie = lazyFn("stats", "drawModelPie");
const renderChatStats = lazyFn("stats", "renderChatStats");
const setPlaygroundOpen = lazyFn("playground", "setPlaygroundOpen");
const setPlaygroundOpenImpl = lazyFn("playground", "setPlaygroundOpenImpl");
const pgStopSeqs = lazyFn("playground", "pgStopSeqs");
const renderPgTabs = lazyFn("playground", "renderPgTabs");
const paintPgActive = lazyFn("playground", "paintPgActive");
const runPlaygroundViaNext = lazyFn("playground", "runPlaygroundViaNext");
const runPlayground = lazyFn("playground", "runPlayground");
const stopPlayground = lazyFn("playground", "stopPlayground");
const renderNotifList = lazyFn("notifications", "renderNotifList");
const openNotifs = lazyFn("notifications", "openNotifs");
const clearNotifs = lazyFn("notifications", "clearNotifs");
const pollNotifEvents = lazyFn("notifications", "pollNotifEvents");
const runSandboxedJs = lazyFn("codeRun", "runSandboxedJs");
const runPerfCheck = lazyFn("perf", "runPerfCheck");
const sendFeedback = lazyFn("feedback", "sendFeedback");
const syncLocalFeedback = lazyFn("feedback", "syncLocalFeedback");
const setupVoice = lazyFn("voice", "setupVoice");
const updateAttachWarn = lazyFn("teach", "updateAttachWarn");
const renderAttachChips = lazyFn("teach", "renderAttachChips");
const readTextFile = lazyFn("teach", "readTextFile");
const addAttachFiles = lazyFn("teach", "addAttachFiles");
const postCorpusAdd = lazyFn("teach", "postCorpusAdd");
const submitTeach = lazyFn("teach", "submitTeach");
const syncLocalCorpusOnce = lazyFn("teach", "syncLocalCorpusOnce");
const setupAttachDnD = lazyFn("teach", "setupAttachDnD");
const syncPersonaSelect = lazyFn("persona", "syncPersonaSelect");
const onPersonaChange = lazyFn("persona", "onPersonaChange");
const addPersona = lazyFn("persona", "addPersona");
const setEvoOpen = lazyFn("evolution", "setEvoOpen");
const renderBpcChart = lazyFn("evolution", "renderBpcChart");
const regenerateAnswer = lazyFn("chatEdit", "regenerateAnswer");
const editUserNode = lazyFn("chatEdit", "editUserNode");
const findAssistantChild = lazyFn("chatEdit", "findAssistantChild");
const showAnswerDiff = lazyFn("chatEdit", "showAnswerDiff");
const regenerateFromEditedUser = lazyFn("chatEdit", "regenerateFromEditedUser");
const exportMarkdown = lazyFn("chatEdit", "exportMarkdown");
const setupMobileGestures = lazyFn("chatEdit", "setupMobileGestures");

const _tabFns = {};

function closeTopbarMenus() {
  ["exportMenu", "moreMenu", "tabsMenu"].forEach((id) => {
    const m = el[id] || document.getElementById(id);
    if (m) m.hidden = true;
  });
  ["btnExportMenu", "btnMoreMenu", "btnTabsMore"].forEach((id) => {
    const b = el[id] || document.getElementById(id);
    if (b) b.setAttribute("aria-expanded", "false");
  });
}

function toggleTopbarMenu(btn, menu) {
  if (!btn || !menu) return;
  const open = menu.hidden;
  closeTopbarMenus();
  if (open) {
    menu.hidden = false;
    btn.setAttribute("aria-expanded", "true");
  }
}

function layoutTopbarTabs() {
  const track = el.topbarTabsTrack || document.getElementById("topbarTabsTrack");
  const moreBtn = el.btnTabsMore || document.getElementById("btnTabsMore");
  const menu = el.tabsMenu || document.getElementById("tabsMenu");
  const tabsNav = el.topbarTabs || document.getElementById("topbarTabs");
  if (!track || !moreBtn || !menu) return;
  const narrow = window.innerWidth <= 1100;
  const tabs = Array.from(track.querySelectorAll(".tab-btn"));
  const stashTab = (t) => {
    t.hidden = true;
    t.style.display = "none";
    const clone = t.cloneNode(true);
    clone.classList.add("menu-item");
    clone.classList.remove("tab-btn");
    clone.hidden = false;
    clone.style.display = "";
    if (clone.id) { clone.dataset.originId = clone.id; clone.removeAttribute("id"); }
    if (clone.tagName === "A") {
      clone.addEventListener("click", () => closeTopbarMenus());
    } else {
      clone.addEventListener("click", (ev) => {
        ev.preventDefault();
        t.click();
        closeTopbarMenus();
      });
    }
    menu.appendChild(clone);
  };
  // reset
  tabs.forEach((t) => { t.hidden = false; t.style.display = ""; });
  menu.textContent = "";
  moreBtn.hidden = true;
  moreBtn.dataset.forceShow = "";
  if (tabsNav) tabsNav.classList.remove("has-overflow");
  if (narrow) {
    moreBtn.hidden = false;
    moreBtn.dataset.forceShow = "1";
    if (tabsNav) tabsNav.classList.add("has-overflow");
    tabs.forEach(stashTab);
    return;
  }
  // Reserve room for ⋯ so showing it cannot re-clip the last visible tab.
  moreBtn.hidden = false;
  moreBtn.dataset.forceShow = "1";
  moreBtn.style.visibility = "hidden";
  void track.offsetWidth;
  const btnW = Math.ceil(moreBtn.getBoundingClientRect().width) || 40;
  const trackRight = track.getBoundingClientRect().right;
  const limit = trackRight - btnW - 4;
  let overflow = [];
  tabs.forEach((t) => {
    if (t.getBoundingClientRect().right > limit) overflow.push(t);
  });
  moreBtn.style.visibility = "";
  if (!overflow.length) {
    moreBtn.hidden = true;
    moreBtn.dataset.forceShow = "";
    return;
  }
  if (tabsNav) tabsNav.classList.add("has-overflow");
  overflow.forEach(stashTab);
  // Second pass: after ⋯ takes real space, hide more if still clipped.
  void track.offsetWidth;
  const limit2 = track.getBoundingClientRect().right - 2;
  const extra = [];
  tabs.forEach((t) => {
    if (t.hidden) return;
    if (t.getBoundingClientRect().right > limit2) extra.push(t);
  });
  extra.forEach(stashTab);
}

function wireTopbarMenus() {
  const exportBtn = el.btnExportMenu || document.getElementById("btnExportMenu");
  const moreBtn = el.btnMoreMenu || document.getElementById("btnMoreMenu");
  const tabsBtn = el.btnTabsMore || document.getElementById("btnTabsMore");
  if (exportBtn) exportBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleTopbarMenu(exportBtn, el.exportMenu || document.getElementById("exportMenu"));
  });
  if (moreBtn) moreBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleTopbarMenu(moreBtn, el.moreMenu || document.getElementById("moreMenu"));
  });
  if (tabsBtn) tabsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleTopbarMenu(tabsBtn, el.tabsMenu || document.getElementById("tabsMenu"));
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest && e.target.closest(".menu-wrap")) return;
    closeTopbarMenus();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeTopbarMenus();
  });
  // close menus after choosing an item
  ["exportMenu", "moreMenu"].forEach((id) => {
    const m = document.getElementById(id);
    if (!m) return;
    m.addEventListener("click", (e) => {
      if (e.target.closest("button, a")) closeTopbarMenus();
    });
  });
  layoutTopbarTabs();
  window.addEventListener("resize", () => {
    closeTopbarMenus();
    layoutTopbarTabs();
  });
}

export function getCtx() {
  const ctx = {
    state, el, API, url, uid, escapeHtml, isSafeHttpUrl, safeHref, makeExternalLink,
    renderMarkdown, renderInlineMd, renderTextBlock, highlightCode, renderCodeBlock,
    hostLabel, filterSources, scoreTip, sourceLabel, sourceHref, renderSources,
    renderAnswerMeta, estimateTokens, t, saveStore, saveStoreNow, loadStore, renderSidebar, renderAll,
    fillModelSelect, closeOtherPanels, openOverlay, closeOverlay, closeAllOverlays,
    consumeStream, fetchChatStream, buildMessagesPayload, setStreamingUI,
    ensureChat, activeChat, addNode, syncMessagesFromLeaf, pathToLeaf, deepestLeafUnder, siblingsOf,
    saveElo, loadElo, ensureElo, applyEloVote, eloExpected,
    safeCalc, parseSseBuffer, parseSseLine, matchChatTool,
    ckptLabel, heatColor, renderConfHtml, attachFeedback, loadLocalFeedback, saveLocalFeedback,
    loadPrompts, savePrompts, loadSft, saveSft, loadNotifs, saveNotifs, pushNotif, renderNotifBadge,
    loadAccent, applyAccent, updateThemeContrast, hexToRgb, relLuminance, contrastRatio,
    applyTheme, toggleTheme, newChat, stop, exportMarkdown, autoResize, checkHealth, setHealth,
    loadModels, maybeAnnounceSft, showAppToast, pickDistinctModelsPure, findSftModelsPure, fetchFirstOk, showError, isMobile, registerPwa, openSidebar, setupMobileGestures,
    resetGenToServer, syncGenSettingsUI, persistGenFromUI, syncSystemField,
    makeBtn, createBotColumn, finalizeBotColumn, runOneStream, liveUpdate, bindCodeCopy,
    chatGen, emptyTreeChat, nid, effectiveSystem, sortedChats, makeChatItem, clearMessagesDom,
    appendUserBubble, switchBranch, renderMessages, editUserNode, findAssistantChild, showAnswerDiff,
    FALLBACK_MODELS, CTX_WINDOW, TOUR_KEY, STORE_KEY, THEME_KEY, MAX_RENDER_MSGS, DEFAULT_GEN,
    DONUT_COLORS, MAX_ATTACH_BYTES, MAX_ATTACH_CHARS, MAX_TEACH_BYTES, MIN_TEACH_CHARS,
    CORPUS_LOCAL_KEY, CORPUS_GROWTH_KEY, PROMPTS_KEY, FOLDERS_KEY, ELO_KEY, FEEDBACK_KEY,
    PERSONA_KEY, SFT_KEY, LANG_KEY, GEN_CLAMP, I18N, ACCENT_KEY, NOTIF_KEY, OFFLINE_Q_KEY, WS_SCHEMA,
    TOK_COLORS, DEFAULT_PERSONAS, ensureFeat, lazyBindTab,
    registerTabFn: (name, fn) => { _tabFns[name] = fn; },
    tabFn: (name) => _tabFns[name],
  };
  Object.assign(ctx, state._lazyBound || {});
  return ctx;
}

export function boot() {
  // Demo seed
  if (/[?&]demo=1\b/.test(location.search)) {
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({
        activeId: "c_demo01",
        chats: [
          {
            id: "c_demo01",
            title: "Как устроен трансформер?",
            systemPrompt: "",
            updatedAt: Date.now(),
            messages: [
              { role: "user", content: "Объясни, как устроен трансформер простыми словами" },
              {
                role: "assistant",
                content:
                  "Это **ответ** МойGPT.\n\nТрансформер — сеть с вниманием.\n\n```python\nfrom model.generate import load_model, generate_stream\n```",
                model: "mygpt-latest",
                tps: 42.5,
                elapsed: 1.8,
                sources: [
                  { title: "Трансформер (вики)", url: "https://ru.wikipedia.org/wiki/Трансформер_(машинное_обучение)", score: 12.1 },
                  { title: "Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", score: 9.4 },
                ],
              },
            ],
          },
        ],
      })
    );
  }

  applyTheme(localStorage.getItem(THEME_KEY) || "dark");
  loadAccent();
  loadNotifs();
  loadPersonas();
  loadFolders();
  loadPrompts();
  loadElo();
  loadSft();
  loadStore();
  wire();
  wireTopbarMenus();
  ensureI18n().then(() => applyI18n());
  setupVoice();
  setupAttachDnD();
  setupMobileGestures();
  setupOffline();
  registerPwa();
  syncLocalFeedback();
  syncLocalCorpusOnce();
  updateConfToggleState();
  syncSystemField();
  syncGenSettingsUI();
  renderNotifBadge();
  renderAll();
  loadModels().then(() => { fillModelCardSelect(); if (el.pgModel) fillModelSelect(el.pgModel, state.models || FALLBACK_MODELS); });
  if (!state._modelsPollTimer) state._modelsPollTimer = setInterval(() => { loadModels().catch(() => {}); }, 20000);
  checkHealth();
  startNotifPoll();
  updateTokenBudget();
  if (/[?&]train=1\b/.test(location.search)) setTrainOpen(true);
  if (/[?&]eval=1\b/.test(location.search)) setEvalOpen(true);
  if (/[?&]corpus=1\b/.test(location.search)) setCorpusOpen(true);
  if (/[?&]dataset=1\b/.test(location.search)) setDatasetOpen(true);
  if (/[?&]lab=1\b/.test(location.search)) setLabOpen(true);
  if (/[?&]dash=1\b/.test(location.search)) setDashOpen(true);
  if (/[?&]arena=1\b/.test(location.search)) setArenaOpen(true);
  if (/[?&]playground=1\b/.test(location.search)) setPlaygroundOpen(true);
  if (/[?&]evo=1\b/.test(location.search)) setEvoOpen(true);
  if (/[?&]stats=1\b/.test(location.search)) setChatStatsOpen(true);
  if (/[?&]modelcard=1\b/.test(location.search)) setModelCardOpen(true);
  if (/[?&]theme=1\b/.test(location.search)) openThemeBuilder();
  if (/[?&]elo=1\b/.test(location.search)) setEloOpen(true);
  if (/[?&]compare=1\b/.test(location.search)) {
    el.compareMode.checked = true;
    el.compareModels.hidden = false;
  }
  if (/[?&]light=1\b/.test(location.search)) applyTheme("light");
  if (/[?&]tour=1\b/.test(location.search)) startTour(0);
  else if (!localStorage.getItem(TOUR_KEY)) setTimeout(() => startTour(0), 400);
  if (/[?&]demo=1\b/.test(location.search)) {
    ensureFeat("presentation").then((p) => { if (p && p.startPresentation) return p.startPresentation(); }).catch((e) => console.warn(e));
  }
}