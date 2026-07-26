
  const isRo = () => {
  const lang =
    globalThis.document?.documentElement?.lang ||
    globalThis.localStorage?.getItem?.("mh_lang") ||
    "ro";
  return !String(lang).toLowerCase().startsWith("en");
};

  function msg(key) {
    const ro = {
      not_equal: "Nu se potrivește răspunsul așteptat.",
      rounding: "Aproape! Verifică rotunjirea / cifrele zecimale.",
      need_simplest: "Te rog scrie fracția în formă ireductibilă (a/b redus).",
      prefer_fraction: "Corect numeric, dar aici se cere forma a/b.",
      could_reduce: "Corect. Nota: fracția ta se poate reduce.",
      drop_units: "Scrie doar numărul, fără unități.",
      need_integer: "Se cere un număr întreg.",
      expect_list: "Se așteaptă o listă de valori.",
      list_size: "Număr diferit de elemente față de răspunsul așteptat.",
      unparsable: "Nu am putut interpreta unele elemente din răspuns.",
      interval_mismatch: "Intervalul nu este scris corect.",
      set_mismatch: "Mulțimea nu corespunde răspunsului așteptat."
    };

    const en = {
      not_equal: "Doesn't match the expected answer.",
      rounding: "Close! Check rounding / decimals.",
      need_simplest: "Please write the fraction in simplest form (reduced a/b).",
      prefer_fraction: "Numerically correct, but the task asks for a/b form.",
      could_reduce: "Correct. Note: your fraction can be reduced.",
      drop_units: "Write just the number, without units.",
      need_integer: "An integer is required.",
      expect_list: "A list of values is expected.",
      list_size: "Different number of elements than expected.",
      unparsable: "Could not interpret some items in the answer.",
      interval_mismatch: "The interval is not written correctly.",
      set_mismatch: "The set does not match the expected answer."
    };

    return (isRo() ? ro[key] : en[key]) || key;
  }

  const U = {
    trim(s) {
      return (s || "").toString().trim();
    },

    canon(s) {
      s = (s || "").toString();

      return s
        .replace(/[\u2212\u2013\u2014]/g, "-")
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/π/gi, "pi")
        .replace(/\s+/g, " ")
        .trim();
    },

    stripVariablePrefix(s) {
      return String(s || "")
        .replace(/^\s*[a-zA-Z][a-zA-Z0-9_]*\s*(=|∈)\s*/u, "")
        .trim();
    },

    stripUnits(s) {
      let t = String(s || "").trim();

      const re =
        /\s*(cm|mm|m|km|g|kg|mg|l|ml|lei|ron|eur|euro|usd|h|min|sec|s|grade|°|%)(?![\w/])\s*$/i;

      while (re.test(t)) {
        t = t.replace(re, "").trim();
      }

      return t;
    },

    normalizeNumericComma(s) {
      const t = String(s || "").trim();

      if (/^[+-]?\d+,\d+$/.test(t)) {
        return t.replace(",", ".");
      }

      return t;
    },

    gcd(a, b) {
      a = Math.abs(Number(a) || 0);
      b = Math.abs(Number(b) || 0);

      while (b) {
        const t = a % b;
        a = b;
        b = t;
      }

      return a || 1;
    },

    makeFrac(n, d) {
      n = Number(n);
      d = Number(d);

      if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) {
        return { n: NaN, d: 0 };
      }

      if (d < 0) {
        n = -n;
        d = -d;
      }

      return { n, d };
    },

    reduceFrac(f) {
      if (!f || !Number.isFinite(f.n) || !Number.isFinite(f.d) || f.d === 0) {
        return f;
      }

      const g = U.gcd(f.n, f.d);
      return U.makeFrac(f.n / g, f.d / g);
    },

    fracEqual(a, b) {
      if (!a || !b || a.d === 0 || b.d === 0) return false;
      return a.n * b.d === b.n * a.d;
    },

    fracToNumber(f) {
      if (!f || f.d === 0) return NaN;
      return f.n / f.d;
    },

    numericEqual(a, b, expectedHint) {
      let eps = 1e-9;

      if (typeof expectedHint === "string" && expectedHint.includes(".")) {
        const k = (expectedHint.split(".")[1] || "").length;
        eps = Math.pow(10, -(k + 1)) * 5;
      }

      return Math.abs(a - b) <= eps;
    },

    unwrapPair(s, open, close) {
      s = String(s || "").trim();
      if (!s.startsWith(open) || !s.endsWith(close)) return null;

      let depth = 0;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === open) depth++;
        if (ch === close) depth--;

        if (depth === 0 && i < s.length - 1) {
          return null;
        }
      }

      return s.slice(1, -1);
    },

    splitTopLevel(s) {
      const out = [];
      let cur = "";
      let par = 0;
      let sq = 0;
      let br = 0;

      for (let i = 0; i < s.length; i++) {
        const ch = s[i];

        if (ch === "(") par++;
        else if (ch === ")") par--;
        else if (ch === "[") sq++;
        else if (ch === "]") sq--;
        else if (ch === "{") br++;
        else if (ch === "}") br--;

        if ((ch === "," || ch === ";") && par === 0 && sq === 0 && br === 0) {
          out.push(cur.trim());
          cur = "";
          continue;
        }

        cur += ch;
      }

      if (cur.trim() || out.length) out.push(cur.trim());
      return out.filter(Boolean);
    },

    normalizeTextForCompare(s) {
      return U.canon(s)
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
    }
  };

  function decimalStringToFraction(str) {
    str = U.canon(str);

    const sign = str.startsWith("-") ? -1 : 1;
    if (sign < 0) str = str.slice(1);

    if (!str.includes(".")) {
      return U.makeFrac(sign * parseInt(str || "0", 10), 1);
    }

    const [ip, fp] = str.split(".");
    const den = Math.pow(10, fp.length);
    const num = parseInt((ip || "0") + fp, 10);

    return U.reduceFrac(U.makeFrac(sign * num, den));
  }

  function evalMathExpr(raw) {
    let s = U.canon(raw).toLowerCase();
    s = s.replace(/\s+/g, "");

    s = s.replace(/√\(/g, "sqrt(");
    s = s.replace(/√([0-9.]+|pi|\([^)]+\))/g, "sqrt($1)");

    s = s.replace(/(\d|\))(?=(pi|sqrt|abs|\())/g, "$1*");
    s = s.replace(/(pi)(?=\d|\()/g, "$1*");
    s = s.replace(/(\))(?=\d|pi|sqrt|abs)/g, "$1*");

    s = s.replace(/\^/g, "**");

    if (!/^[0-9+\-*/().a-z*]*$/i.test(s)) return NaN;

    const stripped = s.replace(/pi|sqrt|abs/g, "");
    if (/[a-z]/i.test(stripped)) return NaN;

    s = s
      .replace(/\bpi\b/g, "Math.PI")
      .replace(/\bsqrt\(/g, "Math.sqrt(")
      .replace(/\babs\(/g, "Math.abs(");

    try {
      const value = Function(`"use strict"; return (${s});`)();
      return Number.isFinite(value) ? value : NaN;
    } catch {
      return NaN;
    }
  }

  function tokenToNumber(tok) {
    if (!tok) return NaN;

    if (tok.kind === "fraction") return U.fracToNumber(tok.f);
    if (tok.kind === "integer") return Number(tok.num);
    if (tok.kind === "decimal") return Number(tok.num);
    if (tok.kind === "expression") return Number(tok.num);

    return NaN;
  }

  function isNumericToken(tok) {
    return ["fraction", "integer", "decimal", "expression"].includes(tok?.kind);
  }

  function parseSingleValue(raw) {
    const before = U.stripVariablePrefix(U.canon(raw));
    const noUnits = U.stripUnits(before);
    let s = U.normalizeNumericComma(noUnits);

    const hadUnits = before !== noUnits;

    if (!s) return { kind: "empty", raw: s, hadUnits };

    let m = s.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (m) {
      const sign = m[1].startsWith("-") ? -1 : 1;
      const A = Math.abs(parseInt(m[1], 10));
      const b = parseInt(m[2], 10);
      const c = parseInt(m[3], 10);

      if (c === 0) return { kind: "nan", raw: s, hadUnits };

      const f = U.reduceFrac(U.makeFrac(sign * (A * c + b), c));

      return {
        kind: "fraction",
        f,
        raw: s,
        reducible: false,
        hadUnits
      };
    }

    m = s.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
    if (m) {
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);

      if (b === 0) return { kind: "nan", raw: s, hadUnits };

      const original = U.makeFrac(a, b);
      const reduced = U.reduceFrac(original);

      return {
        kind: "fraction",
        f: reduced,
        raw: s,
        reducible: !(original.n === reduced.n && original.d === reduced.d),
        hadUnits
      };
    }

    if (/^[-+]?\d*(?:\.\d+)?$/.test(s)) {
      const f = decimalStringToFraction(s);

      return {
        kind: s.includes(".") ? "decimal" : "integer",
        f,
        num: U.fracToNumber(f),
        raw: s,
        hadUnits
      };
    }

    const val = evalMathExpr(s);
    if (Number.isFinite(val)) {
      return {
        kind: "expression",
        num: val,
        raw: s,
        hadUnits
      };
    }

    return { kind: "text", raw: s, hadUnits };
  }

  function parseStructured(raw, opts = {}) {
    const forceCollection = !!opts.forceCollection;

    let s = U.stripVariablePrefix(U.stripUnits(U.canon(raw)));
    if (!s) return { kind: "empty", raw: s };

    if (/^±/.test(s)) {
      const inner = parseSingleValue(s.slice(1));
      const n = tokenToNumber(inner);

      if (!Number.isFinite(n)) return { kind: "text", raw: s };

      return {
        kind: "set",
        raw: s,
        items: [
          { kind: "expression", num: -n, raw: String(-n) },
          { kind: "expression", num: n, raw: String(n) }
        ]
      };
    }

    if (
      (s.startsWith("[") || s.startsWith("(")) &&
      (s.endsWith("]") || s.endsWith(")"))
    ) {
      const inner = s.slice(1, -1);
      const parts = U.splitTopLevel(inner);

      if (parts.length === 2) {
        return {
          kind: "interval",
          raw: s,
          leftClosed: s.startsWith("["),
          rightClosed: s.endsWith("]"),
          left: parseSingleValue(parts[0]),
          right: parseSingleValue(parts[1])
        };
      }
    }

    const innerSet = U.unwrapPair(s, "{", "}");
    if (innerSet !== null) {
      const parts = U.splitTopLevel(innerSet);

      return {
        kind: "set",
        raw: s,
        items: parts.map(parseSingleValue)
      };
    }

    if (!forceCollection && /^[+-]?\d+,\d+$/.test(s)) {
      return parseSingleValue(s);
    }

    const top = U.splitTopLevel(s);
    if (top.length > 1) {
      return {
        kind: "list",
        raw: s,
        items: top.map(parseSingleValue)
      };
    }

    return parseSingleValue(s);
  }

  function inferPolicy(problem = {}, expectedRaw = "") {
    const policy = {
      type: "auto",
      simplest: false,
      integer: false
    };

    const st =
      String(problem?.statement_ro || "") +
      " " +
      String(problem?.statement_en || "") +
      " " +
      String(expectedRaw || "");

    const s = st.toLowerCase();

    if (/ireductibil|ireductibilă|simplest|reduced/.test(s)) {
      policy.simplest = true;
    }

    if (/\ba\s*\/\s*b\b/.test(s)) {
      policy.type = "fraction";
    }

    if (/(număr\s*întreg|numar\s*intreg|integer\s*only|integer)/i.test(s)) {
      policy.integer = true;
    }

    if (/(mulțime|multime|set)/i.test(s)) {
      policy.type = "set";
    }

    if (/(interval)/i.test(s)) {
      policy.type = "interval";
    }

    if (typeof problem?.answer === "string" && /\d\s*\/\s*\d/.test(problem.answer)) {
      if (policy.type === "auto") {
        policy.type = "fraction";
      }
    }

    return policy;
  }

  function comparePrimitive(userTok, expTok, policy, expectedRaw) {
    if (isNumericToken(userTok) && isNumericToken(expTok)) {
      const userNum = tokenToNumber(userTok);
      const expNum = tokenToNumber(expTok);

      if (policy.integer) {
        if (!Number.isInteger(userNum)) {
          return { ok: false, reason: msg("need_integer") };
        }

        if (U.numericEqual(userNum, expNum, expectedRaw)) {
          return {
            ok: true,
            note: userTok.hadUnits ? msg("drop_units") : null
          };
        }

        return { ok: false, reason: msg("not_equal") };
      }

      if (policy.type === "fraction") {
        if (userTok.kind !== "fraction") {
          if (U.numericEqual(userNum, expNum, expectedRaw)) {
            return { ok: true, note: msg("prefer_fraction") };
          }

          return { ok: false, reason: msg("not_equal") };
        }

        if (!U.numericEqual(userNum, expNum, expectedRaw)) {
          if (Math.abs(userNum - expNum) <= 1e-3) {
            return { ok: false, reason: msg("rounding") };
          }
          return { ok: false, reason: msg("not_equal") };
        }

        if (policy.simplest && userTok.reducible) {
          return { ok: false, reason: msg("need_simplest") };
        }

        return {
          ok: true,
          note: userTok.hadUnits ? msg("drop_units") : null
        };
      }

      if (U.numericEqual(userNum, expNum, expectedRaw)) {
        if (policy.simplest && userTok.kind === "fraction" && userTok.reducible) {
          return { ok: true, note: msg("could_reduce") };
        }

        return {
          ok: true,
          note: userTok.hadUnits ? msg("drop_units") : null
        };
      }

      if (Math.abs(userNum - expNum) <= 1e-3) {
        return { ok: false, reason: msg("rounding") };
      }

      return { ok: false, reason: msg("not_equal") };
    }

    const a = U.normalizeTextForCompare(userTok?.raw || "");
    const b = U.normalizeTextForCompare(expTok?.raw || "");

    return a === b
      ? { ok: true, note: null }
      : { ok: false, reason: msg("not_equal") };
  }

  function compareCollections(userItems, expItems, unordered, policy, expectedRaw) {
    if (!Array.isArray(userItems) || !Array.isArray(expItems)) {
      return { ok: false, reason: msg("unparsable") };
    }

    if (userItems.length !== expItems.length) {
      return { ok: false, reason: msg("list_size") };
    }

    const expAllNumeric = expItems.every(isNumericToken);
    const userAllNumeric = userItems.every(isNumericToken);

    if (expAllNumeric && userAllNumeric) {
      const ua = userItems.map(tokenToNumber);
      const ea = expItems.map(tokenToNumber);

      if (ua.some((x) => !Number.isFinite(x)) || ea.some((x) => !Number.isFinite(x))) {
        return { ok: false, reason: msg("unparsable") };
      }

      if (unordered) {
        ua.sort((a, b) => a - b);
        ea.sort((a, b) => a - b);
      }

      for (let i = 0; i < ua.length; i++) {
        if (!U.numericEqual(ua[i], ea[i], expectedRaw)) {
          return {
            ok: false,
            reason: unordered ? msg("set_mismatch") : msg("not_equal")
          };
        }
      }

      return { ok: true, note: null };
    }

    const ua = userItems.map((x) => U.normalizeTextForCompare(x?.raw || ""));
    const ea = expItems.map((x) => U.normalizeTextForCompare(x?.raw || ""));

    if (unordered) {
      ua.sort();
      ea.sort();
    }

    for (let i = 0; i < ua.length; i++) {
      if (ua[i] !== ea[i]) {
        return {
          ok: false,
          reason: unordered ? msg("set_mismatch") : msg("not_equal")
        };
      }
    }

    return { ok: true, note: null };
  }

  function compareIntervals(userTok, expTok, policy, expectedRaw) {
    if (!userTok || userTok.kind !== "interval") {
      return { ok: false, reason: msg("interval_mismatch") };
    }

    if (
      !!userTok.leftClosed !== !!expTok.leftClosed ||
      !!userTok.rightClosed !== !!expTok.rightClosed
    ) {
      return { ok: false, reason: msg("interval_mismatch") };
    }

    const leftCmp = comparePrimitive(userTok.left, expTok.left, policy, expectedRaw);
    if (!leftCmp.ok) return { ok: false, reason: msg("interval_mismatch") };

    const rightCmp = comparePrimitive(userTok.right, expTok.right, policy, expectedRaw);
    if (!rightCmp.ok) return { ok: false, reason: msg("interval_mismatch") };

    return { ok: true, note: null };
  }

  function compareTokens(userTok, expTok, policy, expectedRaw) {
    if (expTok.kind === "interval") {
      return compareIntervals(userTok, expTok, policy, expectedRaw);
    }

    if (expTok.kind === "set") {
      let userCollection = userTok;

      if (
        userTok.kind !== "set" &&
        userTok.kind !== "list" &&
        /[,;]/.test(String(userTok.raw || ""))
      ) {
        userCollection = parseStructured(userTok.raw, { forceCollection: true });
      }

      if (userCollection.kind !== "set" && userCollection.kind !== "list") {
        return { ok: false, reason: msg("set_mismatch") };
      }

      return compareCollections(
        userCollection.items,
        expTok.items,
        true,
        policy,
        expectedRaw
      );
    }

    if (expTok.kind === "list") {
      let userCollection = userTok;

      if (
        userTok.kind !== "set" &&
        userTok.kind !== "list" &&
        /[,;]/.test(String(userTok.raw || ""))
      ) {
        userCollection = parseStructured(userTok.raw, { forceCollection: true });
      }

      if (userCollection.kind !== "list") {
        return { ok: false, reason: msg("expect_list") };
      }

      return compareCollections(
        userCollection.items,
        expTok.items,
        false,
        policy,
        expectedRaw
      );
    }

    return comparePrimitive(userTok, expTok, policy, expectedRaw);
  }

  function check({ user, expected, problem }) {
    const expectedRaw = String(expected ?? "");
    const policy = inferPolicy(problem || {}, expectedRaw);

    const normalizedExpected = parseStructured(expectedRaw);
    const normalizedUser = parseStructured(String(user ?? ""));

    const res = compareTokens(
      normalizedUser,
      normalizedExpected,
      policy,
      expectedRaw
    );

    return {
      ok: !!res.ok,
      message: res.ok ? res.note || null : res.reason,
      normalizedUser,
      normalizedExpected,
      policy
    };
  }

export const SmartAnswer = {
  check,
  _U: U,
  _parseStructured: parseStructured,
  _parseSingleValue: parseSingleValue
};

if (globalThis.window) {
  globalThis.window.SmartAnswer = SmartAnswer;
}
