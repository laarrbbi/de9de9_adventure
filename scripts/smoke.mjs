// Opens the game in a phone-sized headless browser, taps through the home
// screen, reloads to check the save, and fails on any error in the page.
// Writes a screenshot to smoke.png (or the path given as the first argument).
//
// Needs Playwright with Chromium. If it isn't installed globally:
//   npm i -D playwright && npx playwright install chromium
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'www');
const OUT = process.argv[2] || 'smoke.png';
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  if (path.endsWith('/')) path += 'index.html';
  try {
    const body = await readFile(join(ROOT, path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((ok) => server.listen(0, ok));
const url = `http://localhost:${server.address().port}/`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const problems = [];
page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));
page.on('requestfailed', (r) => problems.push(`failed to load: ${r.url()}`));

const coins = async () => Number((await page.textContent('[data-ref="coins"]')).replace(/,/g, ''));
const check = (ok, what) => ok || problems.push(`expected ${what}`);

try {
  await page.goto(url);
  await page.waitForSelector('.home-svg');
  const start = await coins();

  await page.tap('.need[data-need="hunger"]');
  check((await coins()) === start - 5, 'eating to cost 5 coins');
  await page.tap('.need[data-need="clean"]');
  await page.tap('.obj[data-act="play"]');
  await page.tap('.obj[data-act="talk"]');
  check(await page.isVisible('.speech'), 'Nemla to say something when tapped');

  await page.tap('.need[data-need="energy"]');
  check(await page.$eval('.home-svg', (svg) => svg.classList.contains('asleep')), 'Nemla to fall asleep');
  await page.tap('.need[data-need="energy"]');
  check(!(await page.$eval('.home-svg', (svg) => svg.classList.contains('asleep'))), 'Nemla to wake up');

  await page.tap('.tab[data-tab="garden"]');
  check((await page.textContent('#toasts')).includes('coming'), 'a locked tab to say it is coming');

  // Work: play a job until it ends on its own, then collect the pay.
  await page.tap('.tab[data-tab="work"]');
  check(await page.isVisible('.job-go'), 'jobs on the Work screen');
  const beforeJob = await coins();
  await page.tap('.job-go');
  await page.waitForSelector('.play canvas[data-state="ready"]');
  await page.tap('.play canvas', { position: { x: 30, y: 600 } });
  await page.waitForSelector('.play canvas[data-state="done"]', { timeout: 60e3 });
  await page.waitForTimeout(1000);
  await page.tap('.play canvas');
  await page.waitForSelector('.play', { state: 'detached' });
  check((await coins()) > beforeJob, 'a job to pay coins');
  check(await page.isVisible('.job.done'), 'the job to show as done');
  await page.screenshot({ path: OUT.replace(/\.png$/, '-work.png') });
  await page.tap('.tab[data-tab="home"]');

  const before = await coins();
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForSelector('.home-svg');
  check((await coins()) === before, 'coins to survive a reload');

  await page.waitForTimeout(400);
  await page.screenshot({ path: OUT });
} finally {
  await browser.close();
  server.close();
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Smoke test passed. Screenshot: ${OUT}`);
