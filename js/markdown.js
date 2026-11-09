import { escapeHtml } from './safe.js';
export { escapeHtml } from './safe.js';

export function renderInlineMd(s) {
  return s
    .replace(/\$\$([\s\S]+?)\$\$/g, function (_, m) {
      return '<span class="md-math-block">' + m + "</span>";
    })
    .replace(/\$([^\$\n]+?)\$/g, '<span class="md-math">$1</span>')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^\*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
}

export function renderTextBlock(escaped) {
  const lines = escaped.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*\|.+\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        rows.push(lines[i]);
        i++;
      }
      if (rows.length >= 2) {
        const parseRow = (r) =>
          r
            .replace(/^\s*\|/, "")
            .replace(/\|\s*$/, "")
            .split("|")
            .map((c) => c.trim());
        const head = parseRow(rows[0]);
        const body = rows.slice(2).map(parseRow);
        let html = '<div class="md-table-wrap"><table class="md-table"><thead><tr>';
        head.forEach((c) => (html += "<th>" + renderInlineMd(c) + "</th>"));
        html += "</tr></thead><tbody>";
        body.forEach((r) => {
          html += "<tr>";
          r.forEach((c) => (html += "<td>" + renderInlineMd(c) + "</td>"));
          html += "</tr>";
        });
        html += "</tbody></table></div>";
        out.push(html);
        continue;
      }
    }
    const hm = line.match(/^(#{1,3})\s+(.+)$/);
    if (hm) {
      const lvl = hm[1].length;
      out.push('<div class="md-h md-h' + lvl + '">' + renderInlineMd(hm[2]) + "</div>");
      i++;
      continue;
    }
    if (/^>\s?/.test(line)) {
      const q = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        q.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push('<blockquote class="md-quote">' + renderInlineMd(q.join("<br>")) + "</blockquote>");
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push("<li class=\"md-li\">" + renderInlineMd(lines[i].replace(/^\s*[-*]\s+/, "")) + "</li>");
        i++;
      }
      out.push('<ul class="md-ul">' + items.join("") + "</ul>");
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push("<li class=\"md-li\">" + renderInlineMd(lines[i].replace(/^\s*\d+\.\s+/, "")) + "</li>");
        i++;
      }
      out.push('<ol class="md-ol">' + items.join("") + "</ol>");
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|>\s|\s*[-*]\s|\s*\d+\.\s|\s*\|)/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    out.push('<p class="md-p">' + renderInlineMd(para.join("<br>")) + "</p>");
  }
  return out.join("");
}

export function highlightCode(lang, escapedSrc) {
  const src = escapedSrc || "";
  const L = (lang || "").toLowerCase();
  if (!L || L === "text" || L === "plain") return src;
  const patterns = [];
  if (L === "js" || L === "javascript" || L === "ts" || L === "tsx") {
    patterns.push([/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, "cm"]);
    patterns.push([/(`(?:\\.|[^`])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g, "str"]);
    patterns.push([/\b(0x[\da-fA-F]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/g, "num"]);
    patterns.push([/\b(const|let|var|function|return|if|else|for|while|class|new|typeof|await|async|import|export|from|try|catch|throw|of|in|break|continue|switch|case|default|null|undefined|true|false)\b/g, "kw"]);
    patterns.push([/\b([A-Za-z_$][\w$]*)\s*(?=\()/g, "fn"]);
  } else if (L === "py" || L === "python") {
    patterns.push([/(#.*?$)/gm, "cm"]);
    patterns.push([/("""[\s\S]*?"""|'''[\s\S]*?'''|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g, "str"]);
    patterns.push([/\b(\d+(?:\.\d+)?)\b/g, "num"]);
    patterns.push([/\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|raise|with|yield|lambda|True|False|None|and|or|not|in|is|pass|break|continue|async|await)\b/g, "kw"]);
    patterns.push([/\b([A-Za-z_][\w]*)\s*(?=\()/g, "fn"]);
  } else if (L === "json") {
    patterns.push([/("(?:\\.|[^"\\])*")(\s*:)/g, "key"]);
    patterns.push([/("(?:\\.|[^"\\])*")/g, "str"]);
    patterns.push([/\b(true|false|null)\b/g, "kw"]);
    patterns.push([/-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/gi, "num"]);
  } else if (L === "html" || L === "xml") {
    patterns.push([/(&lt;!--[\s\S]*?--&gt;)/g, "cm"]);
    patterns.push([/(&lt;\/?[a-zA-Z][^&]*?&gt;)/g, "kw"]);
    patterns.push([/(&quot;[^&]*&quot;)/g, "str"]);
  } else if (L === "css") {
    patterns.push([/(\/\*[\s\S]*?\*\/)/g, "cm"]);
    patterns.push([/([.#]?[a-zA-Z_-][\w-]*)\s*(?=\{)/g, "fn"]);
    patterns.push([/\b(\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw)?)\b/g, "num"]);
    patterns.push([/(:root|@media|@import|!important)\b/g, "kw"]);
  } else if (L === "bash" || L === "sh" || L === "shell") {
    patterns.push([/(#.*?$)/gm, "cm"]);
    patterns.push([/('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g, "str"]);
    patterns.push([/\b(if|then|fi|for|do|done|in|echo|export|cd|ls|cat|grep|curl|python3|npm|git)\b/g, "kw"]);
  } else {
    return src;
  }
  let marked = src;
  const store = [];
  patterns.forEach(function (pair) {
    const re = pair[0], type = pair[1];
    marked = marked.replace(re, function () {
      const full = arguments[0];
      if (type === "key") {
        const id = store.length;
        store.push('<span class="tok-str">' + arguments[1] + "</span>");
        return "\uE000" + id + "\uE001" + (arguments[2] || "");
      }
      const id = store.length;
      store.push('<span class="tok-' + type + '">' + full + "</span>");
      return "\uE000" + id + "\uE001";
    });
  });
  return marked.replace(/\uE000(\d+)\uE001/g, function (_, i) { return store[Number(i)] || ""; });
}

export function renderCodeBlock(lang, escapedBody) {
  const L = (lang || "").toLowerCase();
  const lines = (escapedBody || "").split("\n");
  const highlighted = highlightCode(L, escapedBody || "");
  const hiLines = highlighted.split("\n");
  let ln = "";
  let src = "";
  for (let i = 0; i < Math.max(lines.length, hiLines.length); i++) {
    ln += String(i + 1) + "\n";
    src += (hiLines[i] != null ? hiLines[i] : "") + (i < hiLines.length - 1 ? "\n" : "");
  }
  const canRun = L === "js" || L === "javascript";
  return (
    '<div class="code-wrap" data-lang="' + escapeHtml(L) + '">' +
    '<div class="code-toolbar">' +
    '<span class="code-lang">' + escapeHtml(L || "text") + "</span>" +
    '<button type="button" class="btn btn-ghost btn-sm code-copy">Копировать</button>' +
    (canRun ? '<button type="button" class="btn btn-ghost btn-sm code-run">▶ Run</button>' : "") +
    "</div>" +
    "<pre><div class=\"code-lines\"><div class=\"code-ln\" aria-hidden=\"true\">" +
    ln.replace(/\n$/, "") +
    '</div><code class="code-src">' +
    src +
    "</code></div></pre></div>"
  );
}

export function renderMarkdown(text) {
  const escaped = escapeHtml(text || "");
  const parts = [];
  let last = 0;
  const fence = /```([\w-]*)\n?([\s\S]*?)```/g;
  let m;
  while ((m = fence.exec(escaped)) !== null) {
    parts.push({ type: "text", value: escaped.slice(last, m.index) });
    parts.push({ type: "code", lang: m[1] || "", value: m[2].replace(/\n$/, "") });
    last = m.index + m[0].length;
  }
  parts.push({ type: "text", value: escaped.slice(last) });
  return parts
    .map((p) => {
      if (p.type === "code") return renderCodeBlock(p.lang, p.value);
      return renderTextBlock(p.value);
    })
    .join("");
}

