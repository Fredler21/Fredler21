// Builds the GitHub activity cards (desktop and mobile) from live GitHub data.
// Runs every day in .github/workflows/snake.yml, which publishes them to the "output" branch.
// Local run: GITHUB_TOKEN=... node build-activity.mjs [outDir]
import path from "node:path";
import { F, C, text, measure, svg, card, write, HERE } from "./lib.mjs";

const LOGIN = process.env.PROFILE_LOGIN || "Fredler21";
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const OUT = path.resolve(process.argv[2] || path.join(HERE, "..", "..", "dist"));
const fail = (msg) => { console.error(msg); process.exit(1); };
if (!TOKEN) fail("Set GITHUB_TOKEN to a GitHub token.");

const QUERY = `query($login:String!){user(login:$login){
  contributionsCollection{totalCommitContributions totalPullRequestContributions contributionCalendar{totalContributions}}
  repositories(ownerAffiliations:OWNER,isFork:false,privacy:PUBLIC,first:100){nodes{languages(first:20,orderBy:{field:SIZE,direction:DESC}){edges{size node{name}}}}}
}}`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { authorization: `bearer ${TOKEN}`, "content-type": "application/json", "user-agent": "profile-readme-tools" },
  body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
});
const json = await res.json().catch(() => ({}));
const user = json?.data?.user;
if (!res.ok || json.errors || !user) fail(`GitHub API error ${res.status}: ${JSON.stringify(json.errors || json).slice(0, 300)}`);

const cc = user.contributionsCollection;
const num = (n) => Number(n).toLocaleString("en-US");
const STATS = [
  [num(cc.contributionCalendar.totalContributions), "Contributions"],
  [num(cc.totalCommitContributions), "Commits"],
  [num(cc.totalPullRequestContributions), "Pull requests"],
];

// Languages by code size across public repos. Top four, the rest folded into "Other".
const sizes = new Map();
for (const repo of user.repositories.nodes) {
  for (const e of repo.languages.edges) sizes.set(e.node.name, (sizes.get(e.node.name) || 0) + e.size);
}
const total = [...sizes.values()].reduce((a, b) => a + b, 0);
if (!total) fail("No language data came back, keeping the previous cards.");
const ranked = [...sizes.entries()].sort((a, b) => b[1] - a[1]).map(([name, size]) => ({ name, share: size / total }));
const LANGS = ranked.slice(0, 4);
const rest = ranked.slice(4).reduce((a, l) => a + l.share, 0);
if (rest > 0.0005) LANGS.push({ name: "Other", share: rest, other: true });
const pct = (s) => (s * 100).toFixed(1) + "%";

const TITLE = `GitHub activity in the last 12 months: ${STATS.map(([v, l]) => `${v} ${l.toLowerCase()}`).join(", ")}. ` +
  `Top languages by code size: ${LANGS.map((l) => `${l.name} ${pct(l.share)}`).join(", ")}.`;

const ELLIPSIS = F.regular.charToGlyphIndex("…") ? "…" : "...";
function fit(str, font, size, maxW) {
  if (measure(str, font, size) <= maxW) return str;
  let s = str;
  while (s.length > 1 && measure(s + ELLIPSIS, font, size) > maxW) s = s.slice(0, -1);
  return s.trimEnd() + ELLIPSIS;
}

const eyebrow = (str, x, y, size = 10.5) => text(str, { font: F.monoMedium, size, x, y, fill: C.mute, tracking: 0.11 });

// Ranked bars: one hue, square at the baseline, rounded at the data end, value at the tip.
function bars({ x, y, width, nameW, pitch, thick = 8, size = 12 }) {
  const maxW = width - nameW - 52;
  const top = Math.max(...LANGS.map((l) => l.share));
  let b = "";
  LANGS.forEach((l, i) => {
    const cy = y + i * pitch;
    b += text(fit(l.name, F.regular, size, nameW - 10), { font: F.regular, size, x, y: cy + size * 0.35, fill: C.soft });
    const w = Math.max(2, (l.share / top) * maxW);
    const r = Math.min(4, thick / 2, w);
    const bx = x + nameW, by = cy - thick / 2;
    b += `<path d="M${bx} ${by}h${(w - r).toFixed(1)}a${r} ${r} 0 0 1 ${r} ${r}v${thick - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${(-(w - r)).toFixed(1)}z" fill="${l.other ? C.dim : C.mark}"/>`;
    b += text(pct(l.share), { font: F.regular, size, x: bx + w + 8, y: cy + size * 0.35, fill: C.mute });
  });
  return b;
}

function activity() {
  const W = 828, P = 6, H = 174, x0 = P + 40, split = 478, x1 = split + 28;
  let b = card(P, P, W - 2 * P, H - 2 * P);
  b += eyebrow("LAST 12 MONTHS ON GITHUB", x0, 46);
  STATS.forEach(([v, l], i) => {
    const x = x0 + i * 140;
    b += text(v, { font: F.semi, size: 31, x: x - 1, y: 106, tracking: -0.02 });
    b += text(l, { font: F.regular, size: 12.5, x, y: 129, fill: C.mute });
  });
  b += `<rect x="${split}" y="${P + 26}" width="1" height="${H - 2 * P - 52}" fill="${C.faint}"/>`;
  b += eyebrow("TOP LANGUAGES BY CODE SIZE", x1, 46);
  b += bars({ x: x1, y: 70, width: W - P - 40 - x1, nameW: 84, pitch: 19 });
  return svg(W, H, b, { title: TITLE });
}

function activityMobile() {
  const W = 320, P = 4, x0 = P + 20, avail = W - 2 * (P + 20);
  let y = P + 20 + 20;
  let b = eyebrow("LAST 12 MONTHS ON GITHUB", x0, y, 9.5);
  y += 44;
  STATS.forEach(([v, l], i) => {
    const x = x0 + i * (avail / 3);
    b += text(v, { font: F.semi, size: 25, x: x - 1, y, tracking: -0.02 });
    b += text(l, { font: F.regular, size: 11.5, x, y: y + 20, fill: C.mute });
  });
  y += 44;
  b += `<rect x="${x0}" y="${y}" width="${avail}" height="1" fill="${C.faint}"/>`;
  y += 30;
  b += eyebrow("TOP LANGUAGES BY CODE SIZE", x0, y, 9.5);
  y += 26;
  b += bars({ x: x0, y, width: avail, nameW: 78, pitch: 19, size: 11.5 });
  const H = Math.round(y + (LANGS.length - 1) * 19 + 28 + P);
  return svg(W, H, card(P, P, W - 2 * P, H - 2 * P) + b, { title: TITLE });
}

write("activity.svg", activity(), OUT);
write("activity-mobile.svg", activityMobile(), OUT);
console.log(TITLE);
console.log("written to", OUT);
