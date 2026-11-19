// Builds the project cards in /assets/work from live screenshots.
// Needs Chrome on this machine. Run: npm run cards   (add --fresh to retake screenshots)
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, HERE, C, esc } from "./lib.mjs";

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SHOTS = path.join(HERE, ".work", "shots");
const OUT = path.join(ROOT, "assets", "work");
const fresh = process.argv.includes("--fresh");

export const WORK = [
  {
    slug: "bulletproof-sentinel", bar: "bulletproofsentinel.com", web: "https://bulletproofsentinel.com",
    eyebrow: "Honeypot \u00b7 Threat monitoring", title: "BulletProof Sentinel",
    desc: "Decoy admin logins, fake WordPress pages, and bait API endpoints that record what attackers do.",
    metric: "10+ attackers trapped in its first 2 weeks", tags: ["Next.js", "TypeScript", "Firebase"],
  },
  {
    slug: "freddysec", bar: "freddy.py",
    terminal: [
      "# Scan a target with Nmap", "python3 freddy.py scan 192.168.1.10", "",
      "# Analyze log files (auth.log, web logs, syslog)", "python3 freddy.py logs /var/log/auth.log", "",
      "# Check IP against threat feeds", "python3 freddy.py threat-intel 45.33.32.156", "",
      "# Full system security audit", "python3 freddy.py audit",
    ],
    eyebrow: "Security CLI \u00b7 Python", title: "FreddySec",
    desc: "A terminal copilot that runs the scan, reads the raw output, and explains what matters in plain language.",
    metric: "Maps findings to MITRE ATT&CK", tags: ["Python", "Linux", "Kali"],
  },
  {
    slug: "security-training", bar: "edight-security-training.vercel.app", web: "https://edight-security-training.vercel.app",
    eyebrow: "Security awareness", title: "EdLight Security Training",
    desc: "Security training for EdLight staff, with lessons and quizzes made for people who are not technical.",
    metric: "Version 1 is live: modules and quizzes", tags: ["Next.js", "TypeScript"],
  },
  {
    slug: "trycleaninghacks", bar: "trycleaninghacks.com", web: "https://trycleaninghacks.com", dismiss: "Decline",
    eyebrow: "Content platform", title: "TryCleaningHacks",
    desc: "A content site I built and run end to end: code, SEO, publishing, and security.",
    metric: "1,500+ monthly visitors", tags: ["Next.js", "Vercel", "Firebase"],
  },
  {
    slug: "prezidan-pa-m", bar: "prezidan-pa-m.web.app", web: "https://prezidan-pa-m.web.app",
    eyebrow: "Civic tech \u00b7 Haiti 2027", title: "Prezidan Pa M",
    desc: "A neutral people's vote and civic game for Haiti's 2027 election, in Krey\u00f2l, French, and English.",
    metric: "Firestore rules enforce one vote per person", tags: ["TypeScript", "Vite", "Firebase"],
  },
  {
    slug: "devicepeek", bar: "fredler21.github.io/devicepeek",
    image: "https://raw.githubusercontent.com/Fredler21/devicepeek/HEAD/docs/screenshot.png",
    eyebrow: "Developer tool", title: "DevicePeek",
    desc: "See any website as an iPhone and a laptop, side by side, right in the browser.",
    metric: "Reports JavaScript errors and layout overflow", tags: ["TypeScript", "Vite"],
  },
];

const font = (pkg, file) => pathToFileURL(path.join(HERE, "node_modules", "@fontsource", pkg, "files", file)).href;
const face = (family, pkg, base, weight) =>
  `@font-face{font-family:"${family}";font-weight:${weight};src:url("${font(pkg, `${base}-latin-${weight}-normal.woff2`)}") format("woff2")}`;

const CSS = [
  face("Geist", "geist-sans", "geist-sans", 400), face("Geist", "geist-sans", "geist-sans", 500), face("Geist", "geist-sans", "geist-sans", 600),
  face("Geist Mono", "geist-mono", "geist-mono", 400), face("Geist Mono", "geist-mono", "geist-mono", 500),
  `*{box-sizing:border-box;margin:0;padding:0}`,
  `html,body{background:transparent}`,
  `body{width:412px;padding:6px;font-family:Geist,sans-serif}`,
  `.card{width:400px;border:1px solid ${C.line};border-radius:14px;background:${C.ink};overflow:hidden}`,
  `.bar{position:relative;height:30px;display:flex;align-items:center;padding:0 12px;background:${C.raised};border-bottom:1px solid ${C.line}}`,
  `.dots{display:flex;gap:6px}.dots i{width:8px;height:8px;border-radius:50%;background:${C.line}}`,
  `.bar span{position:absolute;left:0;right:0;text-align:center;font:500 10.5px "Geist Mono",monospace;color:${C.mute};letter-spacing:.01em}`,
  `.shot,.term{height:216px;border-bottom:1px solid ${C.line};overflow:hidden}`,
  `.shot img{display:block;width:100%;height:100%;object-fit:cover;object-position:top center}`,
  `.term{padding:15px 18px;font:400 10.6px/16.8px "Geist Mono",monospace;color:${C.text};white-space:pre}`,
  `.term .c{color:${C.dim}}.term .p{color:${C.accent};font-weight:500}`,
  `.body{height:186px;padding:17px 20px 18px;display:flex;flex-direction:column}`,
  `.eyebrow{font:500 10px/12px "Geist Mono",monospace;letter-spacing:.11em;text-transform:uppercase;color:${C.mute}}`,
  `.title{margin-top:9px;font:600 19px/23px Geist,sans-serif;letter-spacing:-.015em;color:${C.text}}`,
  `.desc{margin-top:6px;font:400 13px/19px Geist,sans-serif;color:${C.mute}}`,
  `.metric{margin-top:auto;display:flex;align-items:center;gap:8px;font:500 12.5px/16px Geist,sans-serif;color:${C.soft}}`,
  `.metric::before{content:"";flex:none;width:6px;height:6px;border-radius:2px;background:${C.mark}}`,
  `.tags{margin-top:11px;display:flex;gap:6px}`,
  `.tags span{font:500 10px/14px "Geist Mono",monospace;color:${C.soft};background:${C.raised};border:1px solid ${C.line};border-radius:6px;padding:2px 7px}`,
].join("\n");

function top(w) {
  if (w.terminal) {
    const rows = w.terminal.map((l) =>
      l === "" ? "<div> </div>" : l.startsWith("#") ? `<div class="c">${esc(l)}</div>` : `<div><span class="p">$</span> ${esc(l)}</div>`);
    return `<div class="term">${rows.join("")}</div>`;
  }
  return `<div class="shot"><img src="${pathToFileURL(path.join(SHOTS, w.slug + ".png")).href}"></div>`;
}

const page = (w) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="card">
<div class="bar"><div class="dots"><i></i><i></i><i></i></div><span>${esc(w.bar)}</span></div>
${top(w)}
<div class="body"><div class="eyebrow">${esc(w.eyebrow)}</div><div class="title">${esc(w.title)}</div><div class="desc">${esc(w.desc)}</div>
<div class="metric">${esc(w.metric)}</div><div class="tags">${w.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div></div>
</div></body></html>`;

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(HERE, "build-cards.mjs")) {
  fs.mkdirSync(SHOTS, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true, userDataDir: path.join(HERE, ".chrome-profile"),
    args: ["--no-first-run", "--hide-scrollbars", "--disable-extensions", "--disable-lcd-text"],
  });

  // 1. Screenshots (kept in .work/shots, retaken with --fresh).
  for (const w of WORK) {
    const file = path.join(SHOTS, w.slug + ".png");
    if (fs.existsSync(file) && !fresh) continue;
    if (w.image) {
      const res = await fetch(w.image);
      if (!res.ok) throw new Error(`Could not download ${w.image}: ${res.status}`);
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      console.log("image", w.slug);
    } else if (w.web) {
      const p = await browser.newPage();
      await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
      await p.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
      await p.goto(w.web, { waitUntil: "networkidle2", timeout: 60000 });
      if (w.dismiss) {
        await p.evaluate((label) => {
          const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === label);
          if (b) b.click();
        }, w.dismiss);
      }
      // Stop transitions so a slider is never caught halfway between two slides.
      await p.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation-play-state:paused!important}" });
      await new Promise((r) => setTimeout(r, 1200));
      await p.screenshot({ path: file });
      await p.close();
      console.log("shot", w.slug);
    }
  }

  // 2. Cards.
  const p = await browser.newPage();
  await p.setViewport({ width: 412, height: 600, deviceScaleFactor: 2 });
  for (const w of WORK) {
    const html = path.join(HERE, ".work", `card-${w.slug}.html`);
    fs.writeFileSync(html, page(w));
    await p.goto(pathToFileURL(html).href, { waitUntil: "load" });
    await p.evaluate(() => document.fonts.ready);
    const over = await p.evaluate(() => { const b = document.querySelector(".body"); return b.scrollHeight - b.clientHeight; });
    if (over > 0) console.log(`WARNING ${w.slug}: text overflows the card by ${over}px`);
    const dl = await p.evaluate(() => Math.round(document.querySelector(".desc").getBoundingClientRect().height / 19));
    if (dl > 2) console.log(`WARNING ${w.slug}: description runs to ${dl} lines, keep it to 2`);
    const body = await p.$("body");
    const file = path.join(OUT, w.slug + ".webp");
    await body.screenshot({ path: file, type: "webp", quality: 92, omitBackground: true });
    console.log("card", w.slug, fs.statSync(file).size);
  }
  await browser.close();
}
