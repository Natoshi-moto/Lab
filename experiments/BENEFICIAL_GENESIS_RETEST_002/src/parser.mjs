import { REJECTION } from "./constants.mjs";

/**
 * Strict raw JSON parser that rejects duplicate object keys at every nesting level.
 * Returns { ok, value } or { ok:false, code: DUPLICATE_JSON_KEY }.
 */
export function parseJsonRejectDuplicates(text) {
  if (typeof text !== "string") {
    return { ok: false, code: REJECTION.TYPE_ERROR, detail: "raw input must be string" };
  }
  let i = 0;
  const s = text;
  const len = s.length;

  function skipWs() {
    while (i < len && /[ \t\r\n]/.test(s[i])) i++;
  }

  function parseValue() {
    skipWs();
    if (i >= len) throw new SyntaxError("unexpected end");
    const c = s[i];
    if (c === "{") return parseObject();
    if (c === "[") return parseArray();
    if (c === '"') return parseString();
    if (c === "t" || c === "f") return parseBool();
    if (c === "n") return parseNull();
    if (c === "-" || (c >= "0" && c <= "9")) return parseNumber();
    throw new SyntaxError(`unexpected ${c}`);
  }

  function parseObject() {
    i++; // {
    skipWs();
    const obj = Object.create(null);
    const seen = new Set();
    if (i < len && s[i] === "}") {
      i++;
      return obj;
    }
    while (true) {
      skipWs();
      if (s[i] !== '"') throw new SyntaxError("object key");
      const key = parseString();
      if (seen.has(key)) {
        const err = new Error("duplicate key");
        err.code = REJECTION.DUPLICATE_JSON_KEY;
        err.key = key;
        throw err;
      }
      seen.add(key);
      skipWs();
      if (s[i] !== ":") throw new SyntaxError("expected :");
      i++;
      const value = parseValue();
      obj[key] = value;
      skipWs();
      if (s[i] === ",") {
        i++;
        continue;
      }
      if (s[i] === "}") {
        i++;
        break;
      }
      throw new SyntaxError("expected , or }");
    }
    return obj;
  }

  function parseArray() {
    i++; // [
    skipWs();
    const arr = [];
    if (i < len && s[i] === "]") {
      i++;
      return arr;
    }
    while (true) {
      arr.push(parseValue());
      skipWs();
      if (s[i] === ",") {
        i++;
        continue;
      }
      if (s[i] === "]") {
        i++;
        break;
      }
      throw new SyntaxError("expected , or ]");
    }
    return arr;
  }

  function parseString() {
    i++; // "
    let out = "";
    while (i < len) {
      const c = s[i];
      if (c === '"') {
        i++;
        return out;
      }
      if (c === "\\") {
        i++;
        const e = s[i];
        const map = { '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" };
        if (e in map) {
          out += map[e];
          i++;
        } else if (e === "u") {
          const hex = s.slice(i + 1, i + 5);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new SyntaxError("bad unicode");
          out += String.fromCharCode(parseInt(hex, 16));
          i += 5;
        } else {
          throw new SyntaxError("bad escape");
        }
      } else {
        out += c;
        i++;
      }
    }
    throw new SyntaxError("unterminated string");
  }

  function parseBool() {
    if (s.startsWith("true", i)) {
      i += 4;
      return true;
    }
    if (s.startsWith("false", i)) {
      i += 5;
      return false;
    }
    throw new SyntaxError("bool");
  }

  function parseNull() {
    if (s.startsWith("null", i)) {
      i += 4;
      return null;
    }
    throw new SyntaxError("null");
  }

  function parseNumber() {
    const start = i;
    if (s[i] === "-") i++;
    if (s[i] === "0") {
      i++;
    } else if (s[i] >= "1" && s[i] <= "9") {
      while (i < len && s[i] >= "0" && s[i] <= "9") i++;
    } else throw new SyntaxError("number");
    if (s[i] === ".") {
      i++;
      if (!(s[i] >= "0" && s[i] <= "9")) throw new SyntaxError("number fraction");
      while (i < len && s[i] >= "0" && s[i] <= "9") i++;
    }
    if (s[i] === "e" || s[i] === "E") {
      i++;
      if (s[i] === "+" || s[i] === "-") i++;
      if (!(s[i] >= "0" && s[i] <= "9")) throw new SyntaxError("number exp");
      while (i < len && s[i] >= "0" && s[i] <= "9") i++;
    }
    const num = Number(s.slice(start, i));
    if (!Number.isFinite(num)) throw new SyntaxError("nonfinite");
    return num;
  }

  try {
    const value = parseValue();
    skipWs();
    if (i !== len) return { ok: false, code: REJECTION.TYPE_ERROR, detail: "trailing data" };
    return { ok: true, value };
  } catch (e) {
    if (e && e.code === REJECTION.DUPLICATE_JSON_KEY) {
      return { ok: false, code: REJECTION.DUPLICATE_JSON_KEY, key: e.key };
    }
    return { ok: false, code: REJECTION.TYPE_ERROR, detail: String(e.message || e) };
  }
}
