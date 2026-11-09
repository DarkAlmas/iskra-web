export const I18N = {
  ru: {
    "tab.dataset": "Датасет",
    "tab.train": "Обучение",
    "train.resume": "Дообучить",
    "train.notify": "уведомлять о ckpt",
    "train.eta": "ETA",
    "train.samples": "Примеры из обучения",
    "dataset.search": "Найти",
    "dataset.empty": "Выберите документ или выполните поиск (/api/search).",
    "dataset.sft": "В SFT",
    "dataset.sftbox": "SFT пары (локально)",
    "dataset.export": "Экспорт JSONL",
    "dataset.clear": "Очистить",
    "eval.diff": "Сравнение QA",
    "eval.compare": "Сравнить",
    "arena.same": "Выберите разные модели для A и B",
    "new.chat": "Новый чат",
  },
  en: {
    "tab.dataset": "Dataset",
    "tab.train": "Training",
    "train.resume": "Resume train",
    "train.notify": "notify on ckpt",
    "train.eta": "ETA",
    "train.samples": "Training samples",
    "dataset.search": "Search",
    "dataset.empty": "Pick a document or search (/api/search).",
    "dataset.sft": "Add to SFT",
    "dataset.sftbox": "SFT pairs (local)",
    "dataset.export": "Export JSONL",
    "dataset.clear": "Clear",
    "eval.diff": "QA compare",
    "eval.compare": "Compare",
    "arena.same": "Pick different models for A and B",
    "new.chat": "New chat",
  },
};

export function t(lang, key) {
  const L = lang || "ru";
  return (I18N[L] && I18N[L][key]) || (I18N.ru && I18N.ru[key]) || key;
}
