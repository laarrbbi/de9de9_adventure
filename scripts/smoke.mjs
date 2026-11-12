// Opens the game in a phone-sized headless browser and plays the first
// minutes the way the guide leads: home, a job, the garden and the market.
// Reloads to check the save, then opens a saved-up game to move home and
// shop. Fails on any error in the page.
// Writes a screenshot to smoke.png (or the path given as the first argument).
//
// Needs Playwright with Chromium. If it isn't installed globally:
//   npm i -D playwright && npx playwright install chromium
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GUIDE_STEP_COINS as STEP } from '../www/js/economy.js';

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
const problems = [];

// A phone-sized page, optionally starting from a given save.
async function phone(save) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  if (save) {
    await context.addInitScript((s) => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('de9adventure.save', JSON.stringify(s));
    }, save);
  }
  const p = await context.newPage();
  p.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));
  p.on('requestfailed', (r) => problems.push(`failed to load: ${r.url()}`));
  await p.goto(url);
  await p.waitForSelector('.home-svg');
  return p;
}

let page;
const coins = async () => Number((await page.textContent('[data-ref="coins"]')).replace(/,/g, ''));
const check = (ok, what) => ok || problems.push(`expected ${what}`);
const guideSays = async (words) => (await page.textContent('#guide')).includes(words);

try {
  page = await phone();
  const start = await coins();
  check(await guideSays('Step 1 of 6'), 'the guide to start at step 1');
  check(await page.isVisible('.need[data-need="hunger"].hint'), 'the guide to point at Eat');

  await page.tap('.need[data-need="hunger"]');
  check((await coins()) === start - 5 + STEP, 'eating to cost 5 coins, and the guide step to pay');
  check(await guideSays('Snail'), "the guide to send Nemla to fix Snail's pipe");
  await page.tap('.need[data-need="clean"]');
  await page.tap('.obj[data-act="play"]');
  await page.tap('.obj[data-act="talk"]');
  check(await page.isVisible('.speech'), 'Nemla to say something when tapped');

  await page.tap('.need[data-need="energy"]');
  check(await page.$eval('.home-svg', (svg) => svg.classList.contains('asleep')), 'Nemla to fall asleep');
  await page.tap('.need[data-need="energy"]');
  check(!(await page.$eval('.home-svg', (svg) => svg.classList.contains('asleep'))), 'Nemla to wake up');

  await page.tap('.tab[data-tab="friends"]');
  check((await page.textContent('#toasts')).includes('coming'), 'a locked tab to say it is coming');

  // Work: play a job until it ends on its own, then collect the pay.
  await page.tap('.guide-go');
  check(await page.isVisible('.work'), "the guide's Go button to open Work");
  check((await page.textContent('.job')).includes('For Snail'), "Snail's leak to be the first job");
  check(await page.isVisible('.job-go.hint'), 'the guide to point at the first job');
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
  check(await guideSays('plant'), 'the guide to move on to the garden');
  await page.screenshot({ path: OUT.replace(/\.png$/, '-work.png') });

  // Garden: the sign at home leads there. Plant mint (the first one takes
  // 2 minutes), move the clock on, harvest it and sell it.
  await page.tap('.tab[data-tab="home"]');
  await page.tap('.obj[data-act="garden"]');
  check(await page.isVisible('.garden'), 'the garden sign to open the Garden');
  check(await page.isVisible('.seed.on[data-arg="mint"]'), 'mint seeds picked at the start');
  const beforePlant = await coins();
  await page.tap('.plot.empty');
  check((await coins()) === beforePlant - 10 + STEP, 'planting mint to cost 10 coins');
  check(await page.isVisible('.plot.growing'), 'the plot to show the mint growing');
  await page.clock.setFixedTime(Date.now() + 3 * 60e3);
  await page.waitForSelector('.plot.ready', { timeout: 5e3 });
  check(await page.isVisible('.tab[data-tab="garden"] .tab-badge'), 'a badge on the Garden tab when a crop is ready');
  await page.tap('.plot.ready');
  check(await page.isVisible('.barn-row[data-crop="mint"]'), 'the harvest to go to the barn');
  const beforeSell = await coins();
  await page.tap('.sell[data-arg="mint"]');
  check((await coins()) === beforeSell + 25 + STEP, 'selling a mint to pay 25 coins');
  check(!(await page.isVisible('.tab[data-tab="garden"] .tab-badge')), 'no badge once harvested');
  await page.screenshot({ path: OUT.replace(/\.png$/, '-garden.png') });
  check(await guideSays('Anthill'), 'the guide to end on the goal of the Anthill');
  await page.tap('.guide-go');
  check(await page.isVisible('.goal.hint'), 'the guide to point at the goal card');
  await page.tap('.guide-go');
  check(!(await page.isVisible('#guide')), 'the guide to close');

  const before = await coins();
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForSelector('.home-svg');
  check((await coins()) === before, 'coins to survive a reload');

  await page.waitForTimeout(400);
  await page.screenshot({ path: OUT });
  await page.context().close();

  // A game with coins saved up: move into the Anthill, buy a scooter and
  // a red cap. Each buy takes two taps.
  const now = Date.now();
  page = await phone({
    version: 1, createdAt: now - 3 * 864e5, lastSeen: now, coins: 6000, totalEarned: 9000,
    nemla: { level: 3, xp: 0, needs: { hunger: 80, energy: 80, clean: 80, fun: 80 }, sleeping: false, outfit: null },
    guide: { step: 6 },
  });
  check(!(await page.isVisible('#guide')), 'no guide for a player who finished it');
  check(await page.isVisible('.goal.ready'), 'the goal card to say the Anthill is affordable');
  await page.tap('.goal');
  check(await page.isVisible('.shop-tab[data-section="home"][aria-selected="true"]'), 'the goal card to open the homes');
  await page.tap('.buy[data-id="anthill"]');
  check((await coins()) === 6000, 'the first tap not to buy');
  await page.tap('.buy[data-id="anthill"].armed');
  check((await coins()) === 4000, 'moving to cost 2,000 coins');
  check((await page.textContent('h1')).includes('anthill'), 'Nemla to live in the anthill');
  await page.screenshot({ path: OUT.replace(/\.png$/, '-anthill.png') });

  await page.tap('.tab[data-tab="shop"]');
  await page.tap('.shop-tab[data-section="car"]');
  await page.tap('.buy[data-id="scooter"]');
  await page.tap('.buy[data-id="scooter"].armed');
  check((await coins()) === 1000, 'the scooter to cost 3,000 coins');
  await page.tap('.shop-tab[data-section="clothes"]');
  await page.tap('.buy[data-id="redCap"]');
  await page.tap('.buy[data-id="redCap"].armed');
  check(await page.isVisible('.wear.on[aria-pressed="true"]'), 'the red cap to go on');
  await page.screenshot({ path: OUT.replace(/\.png$/, '-shop.png') });

  await page.tap('.tab[data-tab="work"]');
  const board = await page.$$eval('.jobs[data-ref="list"] .job b', (els) => els.map((el) => el.textContent));
  check(board.includes('Express delivery'), 'the scooter to put an express delivery on the board');
  check(board.length === 5 + 1 + 1, 'the anthill to add a job a day, plus the express delivery');
} finally {
  await browser.close();
  server.close();
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Smoke test passed. Screenshot: ${OUT}`);
