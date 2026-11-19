// Renders every built image on a light and a dark page so they can be checked by eye.
// Run: node preview.mjs   (writes .work/preview-light.png and .work/preview-dark.png)
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, HERE } from "./lib.mjs";

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const A = path.join(ROOT, "assets");
const u = (f) => pathToFileURL(path.join(A, f)).href;
const D = path.join(HERE, ".work", "dist");
const has = (f) => fs.existsSync(path.join(A, f));
const live = (f, attr) => (fs.existsSync(path.join(D, f)) ? `<img src="${pathToFileURL(path.join(D, f)).href}" ${attr}>` : "");
const img = (f, attr) => (has(f) ? `<img src="${u(f)}" ${attr}>` : "");
const chips = fs.readdirSync(path.join(A, "chips")).map((f) => img("chips/" + f, `height="28"`)).join(" ");
const work = has("work") ? fs.readdirSync(path.join(A, "work")).map((f) => img("work/" + f, `width="412"`)).join(" ") : "";

const block = (bg) => `<div style="background:${bg};padding:24px;width:876px">
<p>${img("hero.svg", `width="828"`)}</p>
<p>${img("btn-email.svg", `height="40"`)} ${img("btn-linkedin.svg", `height="40"`)} ${img("btn-work.svg", `height="40"`)}</p>
<p>${img("numbers.svg", `width="828"`)}</p>
<p>${work}</p>
<p>${chips}</p>
<p>${live("activity.svg", `width="828"`)}</p>
<p>${img("cta.svg", `width="828"`)}</p>
<p>${img("hero-mobile.svg", `width="308"`)} ${img("numbers-mobile.svg", `width="308" style="vertical-align:top"`)}</p>
<p>${live("activity-mobile.svg", `width="308"`)} ${img("cta-mobile.svg", `width="308" style="vertical-align:top"`)}</p></div>`;

const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0}p{margin:0 0 16px;text-align:center}</style>${block("#ffffff")}${block("#0d1117")}`;
fs.mkdirSync(path.join(HERE, ".work"), { recursive: true });
const file = path.join(HERE, ".work", "preview.html");
fs.writeFileSync(file, html);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--hide-scrollbars"] });
const page = await browser.newPage();
await page.setViewport({ width: 876, height: 900, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(file).href);
await new Promise((r) => setTimeout(r, Number(process.argv[2] || 4300)));
const divs = await page.$$("body > div");
await divs[0].screenshot({ path: path.join(HERE, ".work", "preview-light.png") });
await divs[1].screenshot({ path: path.join(HERE, ".work", "preview-dark.png") });
await browser.close();
console.log("preview written");
