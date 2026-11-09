export function safeCalc(expr) {
  const s = String(expr || "").trim();
  if (!s) throw new Error("пустое выражение");
  if (s.length > 200) throw new Error("слишком длинно");
  if (!/^[\d\s+\-*/().%,eE^]+$/.test(s)) throw new Error("только цифры и + - * / ( ) % ^");
  // tokenize
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === " " || ch === "\t") { i++; continue; }
    if ("+-*/()%^,".indexOf(ch) >= 0) { tokens.push(ch === "," ? "." : ch); i++; continue; }
    if (/\d/.test(ch) || ch === ".") {
      let j = i + 1;
      while (j < s.length && /[\d.]/.test(s[j])) j++;
      if (/[eE]/.test(s[j] || "") && /[+\-\d]/.test(s[j + 1] || "")) {
        j++;
        if (s[j] === "+" || s[j] === "-") j++;
        while (j < s.length && /\d/.test(s[j])) j++;
      }
      tokens.push(s.slice(i, j));
      i = j;
      continue;
    }
    throw new Error("недопустимый символ: " + ch);
  }
  // shunting-yard
  const prec = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2, "^": 3 };
  const right = { "^": 1 };
  const out = [];
  const ops = [];
  let prev = "op";
  for (let k = 0; k < tokens.length; k++) {
    const tok = tokens[k];
    if (/^\d|\d/.test(tok) && /^-?\d/.test(tok) || /^\d/.test(tok) || /^\d*\.\d+/.test(tok) || /^[.\d]+([eE][+-]?\d+)?$/.test(tok)) {
      out.push({ t: "n", v: Number(tok) });
      prev = "n";
    } else if (tok === "(") {
      ops.push(tok); prev = "op";
    } else if (tok === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") out.push({ t: "o", v: ops.pop() });
      if (!ops.length) throw new Error("скобки");
      ops.pop(); prev = "n";
    } else if (prec[tok]) {
      let op = tok;
      if (op === "-" && prev === "op") { out.push({ t: "n", v: 0 }); } // unary minus as 0-x
      while (ops.length && prec[ops[ops.length - 1]]) {
        const top = ops[ops.length - 1];
        if ((right[op] && prec[op] < prec[top]) || (!right[op] && prec[op] <= prec[top])) out.push({ t: "o", v: ops.pop() });
        else break;
      }
      ops.push(op); prev = "op";
    } else throw new Error("токен " + tok);
  }
  while (ops.length) {
    const op = ops.pop();
    if (op === "(" || op === ")") throw new Error("скобки");
    out.push({ t: "o", v: op });
  }
  const st = [];
  out.forEach((x) => {
    if (x.t === "n") st.push(x.v);
    else {
      const b = st.pop(); const a = st.pop();
      if (a == null || b == null) throw new Error("выражение");
      let r = 0;
      if (x.v === "+") r = a + b;
      else if (x.v === "-") r = a - b;
      else if (x.v === "*") r = a * b;
      else if (x.v === "/") r = a / b;
      else if (x.v === "%") r = a % b;
      else if (x.v === "^") r = Math.pow(a, b);
      if (!isFinite(r)) throw new Error("не число");
      st.push(r);
    }
  });
  if (st.length !== 1) throw new Error("выражение");
  return st[0];
}
