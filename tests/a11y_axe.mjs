/**
 * Freeze-safe axe-core audit against live :8800 (or A11Y_BASE).
 * Local axe-core / @axe-core/playwright only — no CDN.
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.A11Y_BASE || 'http://127.0.0.1:8800';
const OUT = path.join(__dirname, process.env.A11Y_OUT || 'a11y-report.json');

const VIEWS = [
  { id: 'home', path: '/' },
  { id: 'dash', path: '/?dash=1' },
  { id: 'arena', path: '/?arena=1' },
  { id: 'playground', path: '/?playground=1' },
  { id: 'eval', path: '/?eval=1' },
  { id: 'dataset', path: '/?dataset=1' },
  { id: 'demo', path: '/?demo=1' },
  { id: 'about', path: '/about.html' },
];

function summarize(results) {
  const by = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const items = [];
  for (const v of results.violations) {
    const impact = v.impact || 'minor';
    by[impact] = (by[impact] || 0) + v.nodes.length;
    items.push({
      id: v.id,
      impact,
      help: v.help,
      description: v.description,
      nodes: v.nodes.length,
      targets: v.nodes.slice(0, 8).map((n) => ({ target: n.target, html: (n.html || '').slice(0, 120) })),
    });
  }
  return { by, items, passes: results.passes.length, incomplete: results.incomplete.length };
}

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu'],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

const report = { base: BASE, ts: new Date().toISOString(), views: {} };
let total = { critical: 0, serious: 0, moderate: 0, minor: 0 };
let failed = false;

for (const view of VIEWS) {
  const page = await context.newPage();
  const consoleMsgs = [];
  page.on('console', (m) => {
    if (['error', 'warning'].includes(m.type())) consoleMsgs.push({ type: m.type(), text: m.text() });
  });
  page.on('pageerror', (e) => consoleMsgs.push({ type: 'pageerror', text: String(e) }));
  try {
    await page.goto(BASE + view.path, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(800);
    // dismiss onboarding if present (home) so main UI is auditable
    if (view.id === 'home' || view.id === 'dash') {
      const skip = page.locator('#btnOnboardSkip, [data-onboard-skip], button:has-text("Пропустить")');
      if (await skip.count()) {
        try { await skip.first().click({ timeout: 1000 }); } catch {}
      }
    }
    if (view.id === 'demo') {
      for (let i = 0; i < 2; i++) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(250);
      }
    }
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const sum = summarize(results);
    report.views[view.id] = { ...sum, console: consoleMsgs };
    for (const k of Object.keys(total)) total[k] += sum.by[k] || 0;
    console.log(
      view.id,
      'critical=' + sum.by.critical,
      'serious=' + sum.by.serious,
      'moderate=' + sum.by.moderate,
      'minor=' + sum.by.minor,
      'console=' + consoleMsgs.length,
    );
    for (const it of sum.items.filter((x) => x.impact === 'critical' || x.impact === 'serious')) {
      console.log('  ', it.impact, it.id, 'nodes=' + it.nodes, it.help);
      for (const t of it.targets.slice(0, 3)) console.log('     ', JSON.stringify(t.target), t.html);
    }
  } catch (err) {
    failed = true;
    console.error(view.id, 'FAIL', err.message || err);
    report.views[view.id] = { error: String(err) };
  }
  await page.close();
}

report.total = total;
fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log('TOTAL', JSON.stringify(total));
console.log('wrote', OUT);
await browser.close();
const bad = (total.critical || 0) + (total.serious || 0);
process.exit(failed ? 1 : bad > 0 ? 2 : 0);
