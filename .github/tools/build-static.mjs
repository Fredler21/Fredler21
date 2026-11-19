// Builds the static README images into /assets: banner, number tiles,
// buttons, skill chips, and the contact banner. Run: npm run static
import * as si from "simple-icons";
import { F, C, text, measure, wrap, lines, svg, card, mix, rng, write } from "./lib.mjs";

const WD = 828, P = 6;   // desktop image width and its transparent margin
const WM = 320, PM = 4;  // mobile image width and margin

const EYEBROW = "OPEN TO SECURITY INTERNSHIPS AND JUNIOR ROLES";
const ROLE = ["Cybersecurity student at Miami Dade College.", "Technology & Cybersecurity Lead at EdLight Initiative."];
const TITLE = "Fredler Gracia Pierre-Louis. Cybersecurity student at Miami Dade College and Technology & Cybersecurity Lead at EdLight Initiative. Open to security internships and junior roles.";

// A grid of cells with a scan line that sweeps across it.
function scanGrid({ x, y, cols, rows, dur, seed, cell = 14, gap = 6 }) {
  const pitch = cell + gap;
  const w = cols * pitch - gap, h = rows * pitch - gap;
  const rand = rng(seed);
  const travel = w + 10;
  let base = "", flash = "";
  for (let c = 0; c < cols; c++) {
    let col = "";
    for (let r = 0; r < rows; r++) {
      const v = rand();
      const lit = 0.16 + 0.3 * (c / (cols - 1));
      const level = v > lit ? 0 : v > lit * 0.55 ? 1 : v > lit * 0.22 ? 2 : 3;
      const fill = [C.raised, mix(C.ink, C.accent, 0.2), mix(C.ink, C.accent, 0.48), C.accent][level];
      const px = x + c * pitch, py = y + r * pitch;
      base += `<rect x="${px}" y="${py}" width="${cell}" height="${cell}" rx="3" fill="${fill}"/>`;
      col += `<rect x="${px}" y="${py}" width="${cell}" height="${cell}" rx="3" fill="${level ? C.accent : C.line}"/>`;
    }
    const delay = (((c * pitch + 5) / travel) * dur).toFixed(2);
    flash += `<g class="col" style="animation-delay:${delay}s">${col}</g>`;
  }
  const sweep = `<rect class="sweep" x="${x - 5}" y="${y - 6}" width="1" height="${h + 12}" fill="${C.accent}"/>`;
  const style =
    `.col{opacity:0;animation:flash ${dur}s linear infinite}` +
    `.sweep{opacity:.55;animation:sweep ${dur}s linear infinite}` +
    `.pulse{animation:pulse 2.4s ease-in-out infinite}` +
    `@keyframes flash{0%{opacity:0}1.5%{opacity:.85}12%{opacity:0}100%{opacity:0}}` +
    `@keyframes sweep{from{transform:translateX(0)}to{transform:translateX(${travel}px)}}` +
    `@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}` +
    `@media (prefers-reduced-motion:reduce){.col,.sweep,.pulse{animation:none}.sweep{display:none}}`;
  return { markup: base + flash + sweep, style, w, h };
}

function hero() {
  const H = 312, x0 = P + 40;
  const cols = 12, rows = 10;
  const gw = cols * 20 - 6, gh = rows * 20 - 6;
  const g = scanGrid({ x: WD - P - 40 - gw, y: Math.round((H - gh) / 2), cols, rows, dur: 9, seed: 21 });
  let b = card(P, P, WD - 2 * P, H - 2 * P);
  b += `<circle class="pulse" cx="${x0 + 4}" cy="62" r="4" fill="${C.accent}"/>`;
  b += text(EYEBROW, { font: F.monoMedium, size: 11, x: x0 + 18, y: 66, fill: C.accent, tracking: 0.1 });
  b += text("Fredler Gracia", { font: F.bold, size: 62, x: x0 - 3, y: 142, tracking: -0.035 });
  b += text("Pierre-Louis", { font: F.bold, size: 62, x: x0 - 3, y: 206, tracking: -0.035 });
  b += lines(ROLE, { font: F.regular, size: 15, x: x0, y: 244, fill: C.mute }, 22);
  b += g.markup;
  return svg(WD, H, b, { title: TITLE, style: g.style });
}

function heroMobile() {
  const x0 = PM + 20, avail = WM - 2 * (PM + 20);
  const size = Math.min(46, Math.floor((avail / measure("Fredler Gracia", F.bold, 1, -0.035)) * 10) / 10);
  let y = PM + 20 + 22;
  let b = "";
  b += `<circle class="pulse" cx="${x0 + 3.5}" cy="${y - 3.5}" r="3.5" fill="${C.accent}"/>`;
  b += lines(["OPEN TO SECURITY INTERNSHIPS", "AND JUNIOR ROLES"], { font: F.monoMedium, size: 9.5, x: x0 + 15, y, fill: C.accent, tracking: 0.1 }, 14);
  y += 14 + 20 + size * 0.74;
  b += text("Fredler Gracia", { font: F.bold, size, x: x0 - 2, y, tracking: -0.035 });
  y += size * 1.04;
  b += text("Pierre-Louis", { font: F.bold, size, x: x0 - 2, y, tracking: -0.035 });
  y += 30;
  const role = ROLE.flatMap((r) => wrap(r, F.regular, 13.5, avail));
  b += lines(role, { font: F.regular, size: 13.5, x: x0, y, fill: C.mute }, 20);
  y += (role.length - 1) * 20 + 24;
  const g = scanGrid({ x: x0, y, cols: 13, rows: 3, dur: 9, seed: 5 });
  b += g.markup;
  const H = Math.round(y + g.h + 22 + PM);
  return svg(WM, H, card(PM, PM, WM - 2 * PM, H - 2 * PM) + b, { title: TITLE, style: g.style });
}

// Stat tiles. Values stay in the primary ink, labels in the muted ink.
const STATS = [
  ["200+", "Users on the platform I keep secure"],
  ["10+", "Attackers trapped by my honeypot in 2 weeks"],
  ["3.90", "GPA, A.S. Cybersecurity, Miami Dade College"],
  ["1,000+", "Monthly views on a site I built and run"],
];
const STATS_TITLE = STATS.map(([v, l]) => `${v}: ${l}`).join(". ") + ".";

function numbers() {
  const colW = (WD - 2 * P) / 4, pad = 26;
  const wrapped = STATS.map(([, l]) => wrap(l, F.regular, 12.5, colW - 2 * pad));
  const rowsMax = Math.max(...wrapped.map((w) => w.length));
  const H = P + 30 + 30 + 14 + rowsMax * 17 + 18 + P;
  let b = card(P, P, WD - 2 * P, H - 2 * P);
  STATS.forEach(([v], i) => {
    const x = P + i * colW + pad;
    if (i) b += `<rect x="${P + i * colW}" y="${P + 24}" width="1" height="${H - 2 * P - 48}" fill="${C.faint}"/>`;
    b += text(v, { font: F.semi, size: 31, x: x - 1, y: P + 30 + 26, tracking: -0.02 });
    b += lines(wrapped[i], { font: F.regular, size: 12.5, x, y: P + 30 + 26 + 24, fill: C.mute }, 17);
  });
  return svg(WD, H, b, { title: STATS_TITLE });
}

function numbersMobile() {
  const colW = (WM - 2 * PM) / 2, pad = 18;
  const wrapped = STATS.map(([, l]) => wrap(l, F.regular, 11.5, colW - 2 * pad));
  const rowsMax = Math.max(...wrapped.map((w) => w.length));
  const cellH = 22 + 24 + 12 + rowsMax * 15.5 + 14;
  const H = Math.round(PM + cellH * 2 + PM);
  let b = card(PM, PM, WM - 2 * PM, H - 2 * PM);
  b += `<rect x="${PM + colW}" y="${PM + 18}" width="1" height="${H - 2 * PM - 36}" fill="${C.faint}"/>`;
  b += `<rect x="${PM + 18}" y="${PM + cellH}" width="${WM - 2 * PM - 36}" height="1" fill="${C.faint}"/>`;
  STATS.forEach(([v], i) => {
    const x = PM + (i % 2) * colW + pad, top = PM + Math.floor(i / 2) * cellH;
    b += text(v, { font: F.semi, size: 26, x: x - 1, y: top + 22 + 20, tracking: -0.02 });
    b += lines(wrapped[i], { font: F.regular, size: 11.5, x, y: top + 22 + 20 + 21, fill: C.mute }, 15.5);
  });
  return svg(WM, H, b, { title: STATS_TITLE });
}

function arrowPath(kind, x, y, color) {
  const d = kind === "down"
    ? `M${x + 4.5} ${y}V${y + 9}M${x + 0.5} ${y + 5}L${x + 4.5} ${y + 9}L${x + 8.5} ${y + 5}`
    : `M${x} ${y + 9}L${x + 9} ${y}M${x + 2.5} ${y}H${x + 9}V${y + 6.5}`;
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function button(label, { primary = false, arrow = "" } = {}) {
  const h = 40, size = 14, pad = 18;
  const tw = measure(label, F.semi, size);
  const w = Math.ceil(pad * 2 + tw + (arrow ? 17 : 0));
  const fg = primary ? C.onAccent : C.text;
  let b = primary
    ? `<rect width="${w}" height="${h}" rx="10" fill="${C.accent}"/>`
    : `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="10" fill="${C.raised}" stroke="${C.line}"/>`;
  b += text(label, { font: F.semi, size, x: pad, y: 25, fill: fg });
  if (arrow) b += arrowPath(arrow, pad + tw + 8, 15.5, fg);
  return svg(w, h, b, { title: label });
}

function chip(label, { icon = null, dot = false } = {}) {
  const h = 28, size = 12.5, padL = 10, padR = 11;
  const lead = icon ? 20 : dot ? 13 : 0;
  const tw = measure(label, F.medium, size);
  const w = Math.ceil(padL + lead + tw + padR);
  let b = `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="8" fill="${C.raised}" stroke="${C.line}"/>`;
  if (icon) b += `<path d="${icon.path}" transform="translate(${padL} 7.5) scale(${(13 / 24).toFixed(4)})" fill="${C.mute}"/>`;
  if (dot) b += `<rect x="${padL}" y="11" width="6" height="6" rx="2" fill="${C.mark}"/>`;
  b += text(label, { font: F.medium, size, x: padL + lead, y: 18.4, fill: C.text });
  return svg(w, h, b, { title: label });
}

const CTA_HEAD = "Hiring for a security internship or a junior role?";
const CTA_SUB = "Email is the fastest way to reach me.";

function pill(label, x, y) {
  const tw = measure(label, F.semi, 14), w = Math.ceil(36 + tw);
  return `<rect x="${x}" y="${y}" width="${w}" height="40" rx="10" fill="${C.accent}"/>` +
    text(label, { font: F.semi, size: 14, x: x + 18, y: y + 25, fill: C.onAccent });
}

function cta() {
  const H = 132, x0 = P + 40;
  const pw = Math.ceil(36 + measure("Email me", F.semi, 14));
  let b = card(P, P, WD - 2 * P, H - 2 * P);
  b += text(CTA_HEAD, { font: F.semi, size: 21, x: x0 - 1, y: 62, tracking: -0.015 });
  b += text(CTA_SUB, { font: F.regular, size: 14, x: x0, y: 90, fill: C.mute });
  b += pill("Email me", WD - P - 40 - pw, (H - 40) / 2);
  return svg(WD, H, b, { title: CTA_HEAD + " " + CTA_SUB });
}

function ctaMobile() {
  const x0 = PM + 20, avail = WM - 2 * (PM + 20);
  const head = wrap(CTA_HEAD, F.semi, 19, avail, -0.015);
  let y = PM + 20 + 22;
  let b = lines(head, { font: F.semi, size: 19, x: x0 - 1, y, tracking: -0.015 }, 25);
  y += (head.length - 1) * 25 + 26;
  b += text(CTA_SUB, { font: F.regular, size: 13, x: x0, y, fill: C.mute });
  y += 20;
  b += pill("Email me", x0, y);
  const H = Math.round(y + 40 + 22 + PM);
  return svg(WM, H, card(PM, PM, WM - 2 * PM, H - 2 * PM) + b, { title: CTA_HEAD + " " + CTA_SUB });
}

export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const CHIPS = {
  security: ["Nmap", "Nikto", "Incident Response", "Threat Analysis", "Network Security", "Firebase Security Rules", "Honeypots"],
  build: [["Python", si.siPython], ["TypeScript", si.siTypescript], ["Bash", si.siGnubash], ["Linux", si.siLinux], ["Next.js", si.siNextdotjs], ["Firebase", si.siFirebase], ["Firestore", si.siFirebase], ["Vercel", si.siVercel]],
};

const out = [];
const put = (rel, content) => { write("assets/" + rel, content); out.push(rel + " " + content.length); };

put("hero.svg", hero());
put("hero-mobile.svg", heroMobile());
put("numbers.svg", numbers());
put("numbers-mobile.svg", numbersMobile());
put("cta.svg", cta());
put("cta-mobile.svg", ctaMobile());
put("btn-email.svg", button("Email me", { primary: true }));
put("btn-linkedin.svg", button("LinkedIn", { arrow: "ne" }));
for (const label of CHIPS.security) put(`chips/${slug(label)}.svg`, chip(label, { dot: true }));
for (const [label, icon] of CHIPS.build) put(`chips/${slug(label)}.svg`, chip(label, { icon }));
console.log(out.join("\n"));
