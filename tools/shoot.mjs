// Smoke test: render the site in headless Chromium with software WebGL, screenshot every chapter and section,
// and print any console error or warning. See README.md § 7.
//   npm i playwright@1.47.2 && python3 -m http.server 8765 &
//   node tools/shoot.mjs ./shots            (SITE=https://forage-demo.vercel.app/ to test the live one)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const out = process.argv[2] || './shots'; mkdirSync(out, { recursive: true });
const base = process.env.SITE || 'http://127.0.0.1:8765/';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);
await page.screenshot({ path: out + '/00-hero.png' });
const stops = [[1, 'problem'], [2, 'picture'], [3, 'start'], [4, 'fund'], [5, 'call'], [6, 'sign'], [7, 'settle'], [8, 'forage'], [9, 'why']];
for (const [i, name] of stops) {
  await page.evaluate(i => document.querySelectorAll('#track .ch')[i].scrollIntoView({ behavior: 'instant', block: 'start' }), i);
  await page.waitForTimeout(i === 5 || i === 7 ? 12000 : 5000);
  await page.screenshot({ path: `${out}/0${i}-${name}.png` });
}
for (const id of ['who', 'token', 'field', 'stack', 'contact']) {
  await page.evaluate(id => document.getElementById(id).scrollIntoView({ behavior: 'instant', block: 'start' }), id);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/site-${id}.png` });
}
// phone
const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
await phone.goto(base, { waitUntil: 'networkidle' });
await phone.waitForTimeout(5000);
await phone.screenshot({ path: out + '/phone-hero.png' });
await phone.evaluate(() => document.getElementById('who').scrollIntoView());
await phone.waitForTimeout(800);
await phone.screenshot({ path: out + '/phone-who.png' });
console.log(errs.join('\n') || 'no console errors');
await browser.close();
