/* THE CROSS-REPO CONTRACT TEST — producer shape in, rendered page out.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Every other test in this directory eval()s a function out of current.html and
 * checks what it returns. That is useful and it is not enough. Three times this
 * season a core surface disappeared from PRODUCTION while this suite stayed
 * green, because the bug was never in one function — it was in the shape the
 * pipeline emitted meeting the shape the dashboard assumed:
 *
 *   1. SLATE     boards.diagnostics is a DICT sitting beside board ARRAYS.
 *                Code that walked the boards object and called an array method
 *                on each value threw on that one key.
 *   2. PARLAY    modelParlay.dependence.why changed from an ARRAY to a STRING.
 *                The dashboard called .join(). The card vanished. The unit
 *                fixture said why:[] and passed the whole time.
 *   3. BOARDS    a market RETIRED in governance history came back WATCH for a
 *                day and published 25 rows, because suppression keyed on the
 *                day's status rather than the retirement record.
 *
 * So this test does the only thing that would have caught all three: it loads
 * the REAL published payload, with those exact shapes present, into the REAL
 * page, in a REAL browser, and asserts what a human would see.
 *
 * It is also a test of the detector itself. A silent-failure alarm that has
 * never fired is indistinguishable from one that is broken, so the negative
 * cases below deliberately poison the payload and REQUIRE the alarm to sound.
 *
 *   node tests/contract_e2e.test.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const FIXTURE = path.join(__dirname, 'fixtures', 'contract-dangerous-shapes.json');

/* Playwright and its browser live in different places on a developer box, in
   CI, and in the sandbox this repo is often edited from. Resolve both, and if
   neither turns up, FAIL — a contract test that quietly skips itself is the
   same silent-green problem this file exists to end. */
function requirePlaywright() {
  const candidates = ['playwright', '@playwright/test',
    '/opt/node-tools/node_modules/playwright'];
  for (const c of candidates) {
    try { return require(c); } catch (e) { /* try the next one */ }
  }
  console.error('FAIL: playwright is not installed. This test renders the real '
    + 'page in a real browser and cannot be approximated.\n'
    + '      npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}
function chromePath() {
  /* An explicitly pinned binary if this environment ships one; otherwise let
     Playwright use whatever it installed for itself. */
  const pinned = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  return fs.existsSync(pinned) ? pinned : undefined;
}

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('  ok   ' + name); }
  catch (e) { failures++; console.log('  FAIL ' + name + '\n       ' + e.message); }
}

/* Build a standalone page: the shipped current.html with its inline payload
   swapped for the one under test. Nothing else about the page changes. */
const PAGE = fs.readFileSync(path.join(ROOT, 'current.html'), 'utf8');
const OPEN = '<script id="bb-data" type="application/json">';
const payloadStart = PAGE.indexOf(OPEN);
assert(payloadStart >= 0, 'current.html has no inline bb-data payload');
const bodyStart = payloadStart + OPEN.length;
const bodyEnd = PAGE.indexOf('</script>', bodyStart);
assert(bodyEnd > bodyStart, 'bb-data payload is not closed');

function pageWith(payload) {
  return PAGE.slice(0, bodyStart) + JSON.stringify(payload) + PAGE.slice(bodyEnd);
}

/* Render one payload and report everything the contract cares about. */
async function render(browser, payload, widths) {
  const file = path.join(os.tmpdir(), 'contract-' + Math.random().toString(36).slice(2) + '.html');
  fs.writeFileSync(file, pageWith(payload), 'utf8');
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e && e.message || e)));
  /* The page must render from its own inline payload with no network at all.
     Anything it tries to fetch is a dependency the contract does not cover. */
  await page.route('**', r => (r.request().url().startsWith('file:') ? r.continue() : r.abort()));
  await page.goto('file://' + file, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);

  const seen = await page.evaluate(() => ({
    slateCards: document.querySelectorAll('#slate .sgrid > .gc2').length,
    heroText: (document.getElementById('picks') || {}).textContent ?
      document.getElementById('picks').textContent.trim().length : 0,
    parlayText: (document.getElementById('parlay') || {}).textContent ?
      document.getElementById('parlay').textContent.trim().length : 0,
    modelParlay: document.body.innerHTML.indexOf('Best model parlay') >= 0,
    diagnostics: (window.__RENDER_DIAGNOSTICS || []).map(d => d.code),
    diagPanelShown: document.body.innerHTML.indexOf('Render diagnostics') >= 0,
    sectionsFailed: [...document.querySelectorAll('main section .empty')]
      .filter(el => /failed to render/.test(el.textContent))
      .map(el => el.closest('section').id),
    /* A retired market must publish no rows, whatever today's verdict says. */
    hrrRows: (function () {
      const d = window.D || {};
      return ((d.boards || {}).hrr || []).length;
    })(),
  }));

  const overflow = {};
  for (const w of (widths || [])) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(250);
    overflow[w] = await page.evaluate(() =>
      Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
  }

  await ctx.close();
  fs.unlinkSync(file);
  return { ...seen, pageErrors, overflow };
}

/* The payload under test is the one the page actually ships, with the
   dangerous shapes laid over it. Reading it out of current.html rather than
   from a stored copy means this test can never drift into proving that the
   dashboard renders some payload from three months ago. */
function buildPayload() {
  const shipped = JSON.parse(PAGE.slice(bodyStart, bodyEnd));
  const ov = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  const d = JSON.parse(JSON.stringify(shipped));

  /* 1. boards mixes ARRAYS with a diagnostics DICT. Already true of the real
        payload; asserted below so it cannot quietly stop being true. */

  /* 2. a market RETIRED in governance history, returning WATCH for a day. */
  d.learned = d.learned || {}; d.learned.markets = d.learned.markets || {};
  d.learned.markets.hrr = Object.assign({}, d.learned.markets.hrr, { status: 'WATCH' });
  d.learned.suppressedNotKilled = Object.assign({}, d.learned.suppressedNotKilled, {
    hrr: 'WATCH today, RETIRED in governance_history (REACTIVATION_REVIEW)' });
  d.boards = d.boards || {}; d.boards.hrr = [];

  /* 3. dependence.why as a STRING here, and as the LEGACY ARRAY next door. */
  d.modelParlay = d.modelParlay || {};
  d.modelParlay.dependence = Object.assign({}, d.modelParlay.dependence, {
    why: 'every pair is in a different game, so multiplying them under an '
       + 'explicit independence assumption is licensed' });
  d.pricedParlay = d.pricedParlay || {};
  d.pricedParlay.dependence = Object.assign({}, d.pricedParlay.dependence, {
    why: ov.legacyDependenceWhy });

  /* 4. the full settlement lifecycle, corrections and unresolved included. */
  d.settlementIntegrity = ov.settlementIntegrity;
  return d;
}

(async () => {
  const { chromium } = requirePlaywright();
  const launch = { args: ['--no-sandbox'] };
  const exe = chromePath();
  if (exe) launch.executablePath = exe;
  const browser = await chromium.launch(launch);
  const real = buildPayload();

  /* ------------------------------------------------------------------ *
   * The fixture is only worth running if it still carries the shapes    *
   * it was built to carry. A fixture that quietly loses its teeth is    *
   * worse than no fixture, because the suite goes green either way.     *
   * ------------------------------------------------------------------ */
  console.log('\nfixture carries the dangerous shapes');
  check('boards mixes ARRAYS with a diagnostics DICT', () => {
    assert(Array.isArray(real.boards.h1), 'boards.h1 should be an array');
    assert(real.boards.diagnostics && !Array.isArray(real.boards.diagnostics),
      'boards.diagnostics should be a non-array object');
  });
  check('dependence.why ships as a STRING and, elsewhere, as an ARRAY', () => {
    assert.strictEqual(typeof real.modelParlay.dependence.why, 'string');
    assert(Array.isArray(real.pricedParlay.dependence.why),
      'the legacy array shape must also be present');
  });
  check('a market is RETIRED in history while today says WATCH', () => {
    assert.strictEqual(real.learned.markets.hrr.status, 'WATCH');
    assert(/RETIRED/.test(real.learned.suppressedNotKilled.hrr));
  });
  check('settlement carries a correction, an UNRESOLVED and a void candidate', () => {
    const s = real.settlementIntegrity;
    assert(s.correctionsApplied.length >= 1, 'no correction in the fixture');
    assert(Array.isArray(s.unresolved), 'unresolved must be a list of records');
    assert(s.unresolved.length >= 1, 'no UNRESOLVED row in the fixture');
    assert.strictEqual(s.unresolved[0].settlementState, 'UNRESOLVED');
    assert(s.unresolved[0].attemptCount >= 1, 'UNRESOLVED must carry retry metadata');
    assert.strictEqual(s.voidCandidates[0].financialSettlement, 'UNKNOWN_BOOK_RULE');
  });

  /* ------------------------------------------------------------------ *
   * THE SETTLEMENT POPULATION, AS THE PRODUCER ACTUALLY SHIPS IT.       *
   *                                                                    *
   * These read the payload the page ships, NOT the overlay, because the *
   * claim under test is about what the pipeline publishes: a row nobody *
   * could grade is represented, carries its history, and is never a     *
   * loss. This block would have failed outright before 2026-09-08, when *
   * the field was the string NOT_PERSISTED.                            *
   * ------------------------------------------------------------------ */
  console.log('\nthe shipped settlement block tells the truth about unresolved rows');
  const shipped = JSON.parse(PAGE.slice(bodyStart, bodyEnd)).settlementIntegrity || {};
  check('unresolved persistence is operational, not a placeholder', () =>
    assert.strictEqual(shipped.unresolvedPersistence, 'OPERATIONAL',
      'got ' + JSON.stringify(shipped.unresolvedPersistence)));
  check('unresolved is a list of records', () =>
    assert(Array.isArray(shipped.unresolved),
      'unresolved is ' + JSON.stringify(shipped.unresolved).slice(0, 80)));
  check('every published unresolved row is genuinely non-terminal', () =>
    shipped.unresolved.forEach(r => assert(
      ['PENDING', 'UNRESOLVED'].includes(r.settlementState),
      r.pickId + ' is published as unresolved but reads ' + r.settlementState)));
  check('no unresolved row was quietly settled as a loss', () =>
    shipped.unresolved.forEach(r => {
      assert.notStrictEqual(r.statisticalOutcome, 'MISS', r.pickId + ' became a MISS');
      assert.notStrictEqual(r.financialSettlement, 'LOSS', r.pickId + ' became a LOSS');
    }));
  check('every unresolved row carries the metadata needed to retry it', () =>
    shipped.unresolved.forEach(r => {
      assert(r.settlementReason, r.pickId + ' has no settlement reason');
      assert(r.identityResolution, r.pickId + ' has no identity resolution');
      assert(r.graderVersion, r.pickId + ' has no grader version');
      assert(r.firstAttemptedAt, r.pickId + ' has no first attempt');
      assert(r.lastAttemptedAt, r.pickId + ' has no last attempt');
      assert(Number(r.attemptCount) >= 1, r.pickId + ' has no attempt count');
      assert(r.market, r.pickId + ' has no market family');
    }));
  check('the per-market counts match the rows they claim to count', () => {
    const tally = {};
    shipped.unresolved.forEach(r => { tally[r.market] = (tally[r.market] || 0) + 1; });
    assert.deepStrictEqual(shipped.unresolvedCounts || {}, tally,
      'counts ' + JSON.stringify(shipped.unresolvedCounts)
      + ' do not match the published rows ' + JSON.stringify(tally));
  });

  /* ------------------------------------------------------------------ *
   * POSITIVE: the real payload renders, whole, at every width.          *
   * ------------------------------------------------------------------ */
  console.log('\nthe real payload renders end to end');
  const WIDTHS = [375, 414, 768, 1200, 1440];
  const r = await render(browser, real, WIDTHS);
  check('no uncaught page errors', () =>
    assert.deepStrictEqual(r.pageErrors, []));
  check('no renderer recorded a diagnostic', () =>
    assert.deepStrictEqual(r.diagnostics, []));
  check('no section printed the failed-to-render message', () =>
    assert.deepStrictEqual(r.sectionsFailed, []));
  check('the Slate rendered game cards', () =>
    assert(r.slateCards > 0, 'slate rendered 0 cards'));
  check('the daily picks hero has content', () =>
    assert(r.heroText > 200, 'hero is empty or near-empty (' + r.heroText + ' chars)'));
  check('the Model Parlay card survived a STRING dependence.why', () =>
    assert(r.modelParlay, 'Best model parlay is missing from the page'));
  check('a retired market published zero rows despite a WATCH verdict', () =>
    assert.strictEqual(r.hrrRows, 0));
  for (const w of WIDTHS) {
    check('no horizontal overflow at ' + w + 'px', () =>
      assert.strictEqual(r.overflow[w], 0,
        w + 'px overflows by ' + r.overflow[w] + 'px'));
  }

  /* ------------------------------------------------------------------ *
   * NEGATIVE: the alarm has to actually sound. Each case reproduces a   *
   * failure this suite once missed, and REQUIRES the diagnostic that    *
   * would now catch it. If any of these goes green, the detector is     *
   * broken and every positive result above is worthless.                *
   * ------------------------------------------------------------------ */
  console.log('\nthe silent-failure alarm actually fires');

  const poisonSlate = JSON.parse(JSON.stringify(real));
  /* gameCards as a non-iterable object is the class of shape that broke the
     Slate walk. The page must survive it AND say so. */
  poisonSlate.gameCards = { notAnArray: true };
  poisonSlate.predictions = { notAnArray: true };
  const rs = await render(browser, poisonSlate);
  check('a broken Slate payload raises SLATE_RENDER_ERROR', () =>
    assert(rs.diagnostics.includes('SLATE_RENDER_ERROR'),
      'expected SLATE_RENDER_ERROR, got ' + JSON.stringify(rs.diagnostics)));
  check('the render-diagnostics panel becomes visible on the page', () =>
    assert(rs.diagPanelShown, 'a surface failed and the page never said so'));
  check('the rest of the page still rendered', () =>
    assert(rs.parlayText > 100, 'one bad section blanked the page'));

  const poisonParlay = JSON.parse(JSON.stringify(real));
  poisonParlay.modelParlay.legs = { notAnArray: true };
  const rp = await render(browser, poisonParlay);
  check('a broken parlay payload raises MODEL_PARLAY_RENDER_ERROR', () =>
    assert(rp.diagnostics.includes('MODEL_PARLAY_RENDER_ERROR'),
      'expected MODEL_PARLAY_RENDER_ERROR, got ' + JSON.stringify(rp.diagnostics)));
  /* The hero lives inside the Slate, so this is the case that used to take the
     product's main surface down with the parlay tile. It must not any more. */
  check('the failing hero tile is isolated, not fatal to the Slate', () =>
    assert(rp.diagnostics.includes('HERO_TILE_MODEL_PARLAY_ERROR'),
      'expected the tile to fail in place, got ' + JSON.stringify(rp.diagnostics)));
  check('the Slate still rendered every game card', () =>
    assert(rp.slateCards > 0, 'a parlay tile failure took the slate with it'));
  check('the Slate did not raise its own error', () =>
    assert(!rp.diagnostics.includes('SLATE_RENDER_ERROR'),
      'one bad tile still escalated to a whole-slate failure'));

  /* ------------------------------------------------------------------ *
   * REGRESSION: the legacy array shape must not resurrect incident 2.   *
   * ------------------------------------------------------------------ */
  console.log('\nthe legacy producer shape is still accepted');
  const legacy = JSON.parse(JSON.stringify(real));
  legacy.modelParlay.dependence.why = [
    'this is how the producer used to emit it',
    'a consumer that assumes a string must not break here'];
  const rl = await render(browser, legacy);
  check('an ARRAY dependence.why renders without a diagnostic', () =>
    assert.deepStrictEqual(rl.diagnostics, []));
  check('the Model Parlay card is still on the page', () =>
    assert(rl.modelParlay, 'Best model parlay vanished on the legacy shape'));

  await browser.close();
  console.log('\n' + (failures ? failures + ' FAILURE(S)' : 'contract holds'));
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
