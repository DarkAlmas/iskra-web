/** API path map and URL helper. */
export const API = {
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
export function url(path, base = API.base) {
  return (base || "") + path;
}
export const FALLBACK_MODELS = ["mygpt-latest", "rag-only", "ckpt-latest"];
