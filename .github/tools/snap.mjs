// Renders a few images side by side at 2x for a close look. Usage: node snap.mjs out.png bg file:width ...
import puppeteer from "puppeteer-core";
import path from "node:path";
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import { HERE } from "./lib.mjs";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const [out, bg, ...items] = process.argv.slice(2);
const imgs = items.map((it) => { const i = it.lastIndexOf(":"); return `<img src="${pathToFileURL(path.resolve(it.slice(0, i))).href}" width="${it.slice(i + 1)}" style="vertical-align:top;margin:8px">`; }).join("");
const file = path.join(HERE, ".work", "snap.html");
fs.writeFileSync(file, `<!doctype html><meta charset="utf-8"><body style="margin:0;background:${bg};display:inline-block;padding:12px">${imgs}</body>`);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--hide-scrollbars"] });
const page = await browser.newPage();
await page.setViewport({ width: 1300, height: 800, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(file).href);
await new Promise((r) => setTimeout(r, 400));
await (await page.$("body")).screenshot({ path: path.resolve(out) });
await browser.close();
console.log("snap", out);
