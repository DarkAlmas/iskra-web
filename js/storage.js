/** localStorage keys and JSON helpers. */
export const STORE_KEY = "mygpt.chats.v2";
export const STORE_KEY_LEGACY = "mygpt.chats.v1";
export const THEME_KEY = "mygpt.theme";
export const FEEDBACK_KEY = "mygpt.feedback.v1";
export const PERSONA_KEY = "mygpt.personas.v1";
export const CORPUS_LOCAL_KEY = "mygpt.corpus.local.v1";
export const CORPUS_GROWTH_KEY = "mygpt.corpus.growth.v1";
export const PROMPTS_KEY = "mygpt.prompts.v1";
export const FOLDERS_KEY = "mygpt.folders.v1";
export const ELO_KEY = "mygpt.elo.v1";
export const TOUR_KEY = "mygpt.tour.done.v1";
export const ACCENT_KEY = "mygpt.accent.v1";
export const NOTIF_KEY = "mygpt.notif.v1";
export const OFFLINE_Q_KEY = "mygpt.offline.queue.v1";
export const LANG_KEY = "mygpt.lang.v1";
export const WS_SCHEMA = 1;
export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (_) { return fallback; }
}
export function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
