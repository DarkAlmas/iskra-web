#!/usr/bin/env python3
"""Stdlib mock mirroring МойGPT API (port 8090). Primary /api/*, plus legacy fallbacks."""
from __future__ import annotations

import json
import math
import os
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 8090
MODELS = ["mygpt-latest", "v0", "v1", "step_00500", "step_01000", "step_01500", "step_02000", "step_02500", "step_03000", "rag-only"]
_START = time.time()






def fake_tokenize(text):
    """Lightweight mock BPE-ish split without importing tokenizers."""
    import hashlib, re
    text = text or ""
    # split into words and punctuation, then chunk long words
    parts = re.findall(r"\w+|\s+|[^\w\s]", text, flags=re.UNICODE)
    tokens = []
    for part in parts:
        if part.isspace():
            pieces = [part]
        elif len(part) > 6:
            pieces = [part[i:i+3] for i in range(0, len(part), 3)]
        else:
            pieces = [part]
        for piece in pieces:
            hid = int(hashlib.md5(piece.encode("utf-8")).hexdigest()[:6], 16) % 12000
            tokens.append({"id": hid, "text": piece})
    return tokens

def fake_next(prompt, top_k=10, temperature=0.8):
    import math, hashlib
    cands = [" мир", " GPT", " —", " это", " модель", " на", " русском", " языке", ".", ",", "!", " код", " данные"]
    # score by hash distance to prompt end
    end = (prompt or "")[-12:]
    scored = []
    for c in cands:
        h = int(hashlib.md5((end + c).encode("utf-8")).hexdigest()[:8], 16)
        scored.append((c, (h % 1000) / 1000.0))
    scored.sort(key=lambda x: -x[1])
    scored = scored[: max(1, min(int(top_k or 10), 12))]
    # temperature softens
    temp = max(0.1, float(temperature or 0.8))
    logits = [math.log(max(1e-6, s)) / temp for _, s in scored]
    m = max(logits)
    exps = [math.exp(x - m) for x in logits]
    z = sum(exps) or 1.0
    return [{"id": 1000 + i, "text": scored[i][0], "p": round(exps[i] / z, 4)} for i in range(len(scored))]

def mock_search(q, k=10):
    q = (q or "").strip() or "история"
    samples = [
        {"title": "Москва", "url": "https://ru.wikipedia.org/wiki/Москва", "source": "wiki_ru.jsonl", "src": "wiki_ru", "snippet": "Москва — столица России, крупнейший город страны.", "text": "Москва — столица России, крупнейший город страны.", "score": 12.5},
        {"title": "Трансформер (ML)", "url": "https://ru.wikipedia.org/wiki/Трансформер_(машинное_обучение)", "source": "wiki_ru.jsonl", "src": "wiki_ru", "snippet": "Трансформер — архитектура нейронных сетей на основе внимания (attention).", "text": "Трансформер — архитектура нейронных сетей на основе внимания (attention).", "score": 11.2},
        {"title": "RAG", "url": "https://en.wikipedia.org/wiki/Retrieval-augmented_generation", "source": "wiki_en", "src": "wiki_en", "snippet": "Retrieval-augmented generation сочетает поиск по корпусу с генерацией текста.", "text": "Retrieval-augmented generation сочетает поиск по корпусу с генерацией текста.", "score": 10.1},
        {"title": "Локальный файл", "url": "file:///tmp/secret.txt", "source": "local", "src": "local", "snippet": "Этот URL небезопасен и должен рендериться как span без ссылки.", "text": "Этот URL небезопасен и должен рендериться как span без ссылки.", "score": 3.0},
        {"title": "Без ссылки", "url": "", "source": "notes", "src": "notes", "snippet": "Фрагмент без URL — только текст сниппета про запрос «%s»." % q, "text": "Фрагмент без URL — только текст сниппета про запрос «%s»." % q, "score": 2.0},
        {"title": "FineWeb RU пример", "url": "https://example.com/fw", "source": "fineweb2_ru.jsonl", "snippet": "Пример длинного текста из fineweb по запросу «%s»." % q, "text": "Пример длинного текста из fineweb по запросу «%s»." % q, "score": 8.2},
    ]
    ql = q.lower()
    hit = [s for s in samples if any(w in (s["title"] + s["text"]).lower() for w in ql.split()[:6])] or samples
    return hit[: max(1, min(int(k or 10), 10))]

def load_eval():
    """Serve eval/results.jsonl as JSON array. If empty/missing, return 2 synthetic runs for UI demo."""
    path = os.path.abspath(os.path.join(ROOT, "..", "eval", "results.jsonl"))
    rows = []
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    rows.append(json.loads(line))
    except FileNotFoundError:
        rows = []

    def synth(ckpt, step, bpc, ppl, qa_score, ts):
        cats = ["факты", "язык", "математика", "код", "диалог", "безопасность"]
        qa = []
        for i in range(1, 36):
            ok = i <= qa_score
            qa.append({
                "id": i,
                "cat": cats[(i - 1) % len(cats)],
                "q": "Вопрос %d?" % i,
                "out": ("верный ответ" if ok else "не знаю") ,
                "ok": ok,
            })
        return {
            "ckpt": ckpt, "step": step, "params_M": 12.5,
            "val_ppl": ppl, "bpc": bpc, "qa_score": qa_score, "qa_total": 35,
            "sec": 40.0, "ts": ts, "qa": qa,
        }

    if len(rows) == 1:
        base = dict(rows[0])
        base["ckpt"] = "model/ckpt/v1/ckpt.pt"
        base["step"] = int(base.get("step") or 0) + 500
        base["bpc"] = round(float(base.get("bpc") or 2.5) * 0.92, 6)
        if base.get("val_ppl") is not None:
            base["val_ppl"] = round(float(base["val_ppl"]) * 0.85, 6)
        total = int(base.get("qa_total") or 35)
        base["qa_total"] = total
        base["qa_score"] = min(total, int(base.get("qa_score") or 0) + 3)
        base["ts"] = "2026-11-09 09:30:00"
        rows.append(base)
    if not rows:
        rows = [
            synth("model/ckpt/v0/ckpt.pt", 1500, 2.4813, 133.9, 4, "2026-11-09 09:06:11"),
            synth("model/ckpt/v1/ckpt.pt", 2000, 2.2828, 113.8, 7, "2026-11-09 09:30:00"),
        ]
    return rows

def corpus_stats_payload():
    """Mirror live GET /api/corpus/stats (sources by bytes + clean + build scrub)."""
    build = {
        "in": 20152,
        "secret": 3,
        "<EMAIL>": 548,
        "<PHONE>": 359,
        "<CARD>": 11,
        "<SNILS>": 0,
        "kept": 19764,
        "kept:fineweb2_ru.jsonl": 12839,
        "chars": 150164127,
        "drop_not_ru": 222,
        "dup_near": 125,
        "kept:rss_ru.jsonl": 444,
        "drop_short": 30,
        "dup_exact": 11,
        "kept:wiki_fresh.jsonl": 50,
        "kept:wiki_ru.jsonl": 1427,
        "kept:wikinews_ru.jsonl": 2097,
        "kept:pc_wiki.txt": 466,
        "kept:pc_wikisource.txt": 2441,
        "seconds": 83.9,
        "built_at": "09:32",
    }
    return {
        "sources": {
            "fineweb2_ru.jsonl": {"docs": 13130, "bytes": 150046462},
            "pc_wiki.txt": {"docs": None, "bytes": 2935553},
            "pc_wikisource.txt": {"docs": None, "bytes": 120241657},
            "rss_ru.jsonl": {"docs": 491, "bytes": 5251015},
            "user_add.jsonl": {"docs": 3, "bytes": 644},
            "wiki_fresh.jsonl": {"docs": 51, "bytes": 1019310},
            "wiki_ru.jsonl": {"docs": 1875, "bytes": 11116475},
            "wikinews_ru.jsonl": {"docs": 2670, "bytes": 9310738},
        },
        "raw_bytes": 299921854,
        "clean": {
            "corpus.jsonl": {"bytes": 273956044, "mtime": 1794205943, "docs": 19764},
            "corpus.txt": {"bytes": 271143890, "mtime": 1794205943},
        },
        "user_add": 3,
        "rag_chunks": 152917,
        "ts": int(time.time()),
        "build": build,
    }

def corpus_legacy_for_stats():
    """Flat kept:* shape still embedded in /api/stats.corpus for fallback."""
    b = corpus_stats_payload()["build"]
    return {k: b[k] for k in b if k.startswith("kept") or k in ("chars", "in", "seconds", "built_at")}

def train_stats():
    step = int((time.time() - _START) / 3) + 1
    loss = max(0.4, 3.2 * math.exp(-0.04 * step) + 0.15)
    hist = [{"step": i * 20, "loss": max(0.4, 3.2 * math.exp(-0.04 * i) + 0.15), "val_loss": None} for i in range(0, step + 1)]
    corpus = corpus_legacy_for_stats()
    return {
        "step": step,
        "max_steps": 5000,
        "total": 5000,
        "loss": round(loss, 4),
        "train_loss": round(loss, 4),
        "val_loss": round(loss * 1.08, 4),
        "ppl": round(math.exp(min(loss, 5)), 2),
        "tokens_per_sec": 120.5,
        "params_M": 16.77,
        "run": "model/ckpt/v1",
        "checkpoint": "ckpt-mock",
        "loss_history": hist[-40:],
        "history": hist[-40:],
        "corpus_bytes": corpus.get("chars", 150164127),
        "rag_chunks": 130000,
        "chunks": 130000,
        "model": True,
        "model_loaded": True,
        "updated": time.strftime("%Y-%m-%dT%H:%M:%S+0300"),
        "corpus": corpus,
        "data_mix": {
            "fineweb2_ru.jsonl": {"docs": 12839, "chars": 81701825, "weight": 1},
            "rss_ru.jsonl": {"docs": 51, "chars": 716218, "weight": 3},
            "wiki_ru.jsonl": {"docs": 438, "chars": 1408088, "weight": 3},
            "wikinews_ru.jsonl": {"docs": 692, "chars": 1354849, "weight": 3},
            "pc_wiki.txt": {"docs": 467, "chars": 1659106, "weight": 3},
            "pc_wikisource.txt": {"docs": 3483, "chars": 15730566, "weight": 3},
        },
        "losses": {
            "train": round(loss, 4),
            "val": round(loss * 1.08, 4),
            "step": step,
            "time": time.strftime("%H:%M:%S"),
            "lr": 0.00098,
        },
        "samples": [
            {"step": 0, "text": "МойGPT: ..."},
            {"step": 100, "text": "МойGPT: Привет! Я учусь на корпусе."},
            {"step": 500, "text": "МойGPT: Трансформер использует внимание."},
        ],
        "train": {
            "step": step,
            "total": 5000,
            "loss": round(loss, 4),
            "val_loss": round(loss * 1.08, 4),
            "tokens": step * 8192,
            "ppl": round(math.exp(min(loss, 5)), 2),
            "tokens_per_sec": 120.5,
            "checkpoint": "ckpt-mock",
            "loss_history": hist[-40:],
        },
        "train_log_line": json.dumps({
            "step": step,
            "loss": round(loss, 4),
            "val_loss": None,
            "tokens": step * 8192,
            "lr": 0.00098,
            "run": "v1",
            "time": time.strftime("%Y-%m-%dT%H:%M:%S+0300"),
        }, ensure_ascii=False),
    }


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept")

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _write(self, data: bytes):
        try:
            self.wfile.write(data)
            self.wfile.flush()
            return True
        except (BrokenPipeError, ConnectionResetError):
            return False

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path in ("/api/models",):
            return self._json(200, {"models": MODELS})
        if path in ("/api/eval",):
            # honor latest_only like live
            return self._json(200, load_eval())
        if path in ("/api/search",):
            from urllib.parse import parse_qs
            qs = parse_qs(urlparse(self.path).query)
            q = (qs.get("q") or [""])[0]
            k = int((qs.get("k") or ["10"])[0] or 10)
            return self._json(200, mock_search(q, k))
        if path in ("/api/health", "/health"):
            return self._json(200, {"ok": True, "chunks": 130000, "model": True})
        if path in ("/api/stats", "/stats"):
            return self._json(200, train_stats())
        if path in ("/api/corpus/stats",):
            return self._json(200, corpus_stats_payload())
        if path in ("/api/train", "/train"):
            return self._json(200, {"running": False, "pid": None})
        if path in ("/", "/index.html"):
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            data = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            data = {}

        if path in ("/api/train", "/train", "/train/resume"):
            return self._json(200, {"started": True, "running": True, "pid": 4242})
        if path in ("/api/feedback",):
            return self._json(200, {"ok": True, "stored": True})
        if path in ("/api/tokenize",):
            return self._json(200, {"tokens": fake_tokenize(data.get("text") or "")})
        if path in ("/api/next",):
            return self._json(200, {"candidates": fake_next(data.get("prompt") or "", data.get("top_k") or 10, data.get("temperature") or 0.8)})
        if path in ("/api/corpus/add",):
            title = (data.get("title") or "doc").strip()
            text = (data.get("text") or "").strip()
            if len(text) < 20:
                return self._json(400, {"ok": False, "error": "min 20 chars"})
            if len(text.encode("utf-8")) > 256 * 1024:
                return self._json(413, {"ok": False, "error": "too large"})
            return self._json(200, {
                "ok": True,
                "id": "%x" % (abs(hash(title + text)) % 0xFFFFFFFFFFFF),
                "title": title,
                "chars": len(text),
                "note": "попадёт в поиск после ближайшей пересборки корпуса (до 15 мин)",
            })

        if path not in ("/api/chat", "/chat/stream", "/chat"):
            self.send_error(404)
            return

        messages = data.get("messages") or []
        last = data.get("message") or ""
        if not last:
            for m in reversed(messages):
                if m.get("role") == "user":
                    last = (m.get("content") or "").strip()
                    break
        model = data.get("model") or "mygpt-latest"
        max_tokens = int(data.get("max_new_tokens") or 200)
        raw_mode = bool(data.get("raw"))
        n_var = max(1, min(int(data.get("n") or 1), 4))
        stops = [x for x in (data.get("stop") or []) if isinstance(x, str) and x][:8]

        if raw_mode:
            # complete last message as-is
            seed = last or (messages[-1].get("content") if messages else "") or "МойGPT"
            reply = seed + " → продолжение мока (%s) про обучение и токены.\n" % model
            if n_var > 1:
                pass
            sources = []
        else:
            reply = (
                "Это **мок-ответ** МойGPT (`%s`).\n\n"
                "Вы спросили: «%s»\n\n"
                "Когда подключится реальная модель, сюда пойдёт `generate_stream`.\n\n"
                "```javascript\nconsole.log(2 + 2);\n```\n\n"
                "```python\nfrom model.generate import load_model, generate_stream\n```\n"
            ) % (model, (last[:200] or "…"))
            sources = [
                {"title": "Трансформер (вики)", "url": "https://ru.wikipedia.org/wiki/Трансформер_(машинное_обучение)", "score": 12.1},
                {"title": "Attention Is All You Need", "url": "https://arxiv.org/abs/1706.03762", "score": 9.4},
            ]
        text = reply[: max(40, min(len(reply), max_tokens * 4))]

        if path == "/chat":
            return self._json(200, {"answer": text, "sources": sources})

        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        import random, math

        def stream_one(body, idx):
            # apply stops
            cut = -1
            for s in stops:
                p = body.find(s)
                if p >= 0 and (cut < 0 or p < cut):
                    cut = p
            if cut >= 0:
                body = body[:cut]
            buf = ""
            for ch in body:
                buf += ch
                if ch in " \n" or len(buf) >= 8:
                    p = round(random.uniform(0.05, 0.95), 4)
                    lp = round(math.log(max(p, 1e-9)), 4)
                    payload = json.dumps({"content": buf, "p": p, "lp": lp, "i": idx}, ensure_ascii=False)
                    if not self._write(("data: %s\n\n" % payload).encode("utf-8")):
                        return False
                    buf = ""
                    time.sleep(0.008 if raw_mode else 0.012)
            if buf:
                p = round(random.uniform(0.05, 0.95), 4)
                lp = round(math.log(max(p, 1e-9)), 4)
                payload = json.dumps({"content": buf, "p": p, "lp": lp, "i": idx}, ensure_ascii=False)
                if not self._write(("data: %s\n\n" % payload).encode("utf-8")):
                    return False
            if n_var > 1:
                if not self._write(("event: end\ndata: %s\n\n" % json.dumps({"i": idx})).encode("utf-8")):
                    return False
            return True

        for i in range(n_var):
            variant = text if i == 0 else (text + "\n\n[вариант %d · %s]" % (i + 1, model))
            if not stream_one(variant, i):
                return
        if sources:
            src_payload = json.dumps({"sources": sources}, ensure_ascii=False)
            self._write(("event: sources\ndata: %s\n\n" % src_payload).encode("utf-8"))
        self._write(b"data: [DONE]\n\n")


def main():
    os.chdir(ROOT)
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print("МойGPT mock → http://127.0.0.1:%s/" % PORT)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstop")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
