// Shared helpers for the profile README images.
// Text is converted to outlines with the Geist typeface so every image
// looks the same on every device, with no web fonts to load.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "..", "..");

function load(pkg, file) {
  const b = fs.readFileSync(path.join(HERE, "node_modules", "@fontsource", pkg, "files", file));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}

export const F = {
  regular: load("geist-sans", "geist-sans-latin-400-normal.woff"),
  medium: load("geist-sans", "geist-sans-latin-500-normal.woff"),
  semi: load("geist-sans", "geist-sans-latin-600-normal.woff"),
  bold: load("geist-sans", "geist-sans-latin-700-normal.woff"),
  mono: load("geist-mono", "geist-mono-latin-400-normal.woff"),
  monoMedium: load("geist-mono", "geist-mono-latin-500-normal.woff"),
};

// One flat palette. Solid colors only.
export const C = {
  ink: "#0d1117",      // card surface
  raised: "#161b22",   // chips, bars, tracks
  line: "#30363d",     // hairlines and borders
  faint: "#21262d",    // quiet dividers
  text: "#f0f6fc",     // primary ink
  soft: "#c9d1d9",     // secondary ink
  mute: "#9198a1",     // labels
  dim: "#656c76",      // tertiary
  accent: "#00e676",   // small accents only: status dot, primary button
  mark: "#1aab5e",     // chart marks (validated against the card surface)
  onAccent: "#04140b", // text on the accent fill
};

const opts = (tracking) => ({ kerning: true, letterSpacing: tracking || 0 });

export function measure(str, font, size, tracking = 0) {
  for (const ch of str) {
    if (ch !== " " && font.charToGlyphIndex(ch) === 0) throw new Error(`Missing glyph "${ch}" in "${str}"`);
  }
  const w = font.getAdvanceWidth(str, size, opts(tracking));
  return tracking ? w - tracking * size : w;
}

export function text(str, o) {
  const { font, size, x, y, fill = C.text, tracking = 0, anchor = "start", extra = "" } = o;
  const w = measure(str, font, size, tracking);
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  const d = font.getPath(str, x0, y, size, opts(tracking)).toPathData(2);
  return `<path d="${d}" fill="${fill}"${extra ? " " + extra : ""}/>`;
}

// Wraps to the fewest lines that fit, then evens the lines out so no word is left alone.
export function wrap(str, font, size, maxWidth, tracking = 0) {
  const words = str.split(" ");
  const greedy = (limit) => {
    const out = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? cur + " " + w : w;
      if (cur && measure(next, font, size, tracking) > limit) { out.push(cur); cur = w; } else cur = next;
    }
    if (cur) out.push(cur);
    return out;
  };
  let best = greedy(maxWidth);
  if (best.length < 2) return best;
  let lo = 0, hi = maxWidth;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const l = greedy(mid);
    if (l.length <= best.length && l.every((x) => measure(x, font, size, tracking) <= maxWidth)) { hi = mid; best = l; } else lo = mid;
  }
  return best;
}

export function lines(arr, o, leading) {
  return arr.map((l, i) => text(l, { ...o, y: o.y + i * leading })).join("");
}

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

export function svg(w, h, body, { title = "", style = "" } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"` +
    (title ? ` aria-label="${esc(title)}"><title>${esc(title)}</title>` : ">") +
    (style ? `<style>${style}</style>` : "") + body + "</svg>\n";
}

export function card(x, y, w, h, r = 14, fill = C.ink, stroke = C.line) {
  return `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
}

export function mix(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function write(rel, content, base = ROOT) {
  const f = path.resolve(base, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
  return f;
}
