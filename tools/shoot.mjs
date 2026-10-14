// Smoke test: render a page in headless Chromium with software WebGL, screenshot every chapter and section,
// and print any console error or warning. See README.md § 7.
//   npm i playwright@1.47.2 && python3 -m http.server 8765 &
//   node tools/shoot.mjs ./shots                 (the investor page)
//   PAGE=for node tools/shoot.mjs ./shots-for    (the builders page; SITE=https://forage-demo.vercel.app/ to test the live one)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const out = process.argv[2] || './shots'; mkdirSync(out, { recursive: true });
const page_ = process.env.PAGE || '';
const base = (process.env.SITE || 'http://127.0.0.1:8765/') + (page_ ? page_ + '.html' : '');
// Chapters after the hero and the section ids, per page. A chapter that plays several flights gets a longer wait.
const PAGES = {
  '':    { stops: [[1, 'problem'], [2, 'picture'], [3, 'start'], [4, 'fund'], [5, 'call', 12000], [6, 'sign'], [7, 'settle', 12000], [8, 'forage'], [9, 'why']], secs: ['who', 'install', 'story-intro', 'status', 'token', 'field', 'stack', 'contact'], phoneSec: 'who' },
  'for': { stops: [[1, 'install'], [2, 'fund'], [3, 'find'], [4, 'call', 14000], [5, 'record', 10000], [6, 'next']], secs: ['sides-sec', 'install', 'call', 'suppliers', 'apps', 'ledger', 'status', 'contact'], phoneSec: 'install' },
}[page_];
// CHANNEL=chrome uses the installed Google Chrome instead of Playwright's own build.
const browser = await chromium.launch({ headless: true, channel: process.env.CHANNEL || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);
await page.screenshot({ path: out + '/00-hero.png' });
await page.waitForTimeout(9000);
await page.screenshot({ path: out + '/00-hero-loop.png' });
for (const [i, name, ms] of PAGES.stops) {
  await page.evaluate(i => document.querySelectorAll('.track .ch')[i].scrollIntoView({ behavior: 'instant', block: 'start' }), i);
  await page.waitForTimeout(ms || 5000);
  await page.screenshot({ path: `${out}/0${i}-${name}.png` });
}
for (const id of PAGES.secs) {
  await page.evaluate(id => document.getElementById(id).scrollIntoView({ behavior: 'instant', block: 'start' }), id);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/site-${id}.png` });
}
// phone
const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
phone.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push('phone ' + m.type() + ': ' + m.text()); });
phone.on('pageerror', e => errs.push('phone pageerror: ' + e.message));
await phone.goto(base, { waitUntil: 'networkidle' });
await phone.waitForTimeout(5000);
await phone.screenshot({ path: out + '/phone-hero.png' });
await phone.evaluate(id => document.getElementById(id).scrollIntoView(), PAGES.phoneSec);
await phone.waitForTimeout(800);
await phone.screenshot({ path: out + '/phone-' + PAGES.phoneSec + '.png' });
console.log(errs.join('\n') || 'no console errors');
await browser.close();
