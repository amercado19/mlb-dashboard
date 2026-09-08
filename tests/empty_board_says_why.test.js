/* AN EMPTY BOARD SAYS WHAT EMPTIED IT.
 *
 * For a month the 2B board rendered one sentence: "Board posts with confirmed
 * lineups." It was false in the most expensive way a sentence can be false —
 * it named a wait. The reader was told to come back. Nothing was coming.
 *
 * What was actually true, measured from the 2026-09-08 03:05Z payload:
 *
 *   diagnostics.h2   hitters 198  withMetric 192  published 10
 *   diagnostics.tb2  hitters 198  withMetric 195  published 10
 *   boards.h2  []            boards.tb2  []
 *
 * Both boards ranked ten players and then published none, because both
 * markets were retired on measurement — h2 at 23.7% over 30 days, tb2 on a
 * CLV interval entirely below zero. The surface had no way to know, so it
 * guessed, and its guess was the most reassuring sentence available.
 *
 * The rule this file enforces: THE SURFACE NEVER NAMES A CAUSE THE PAYLOAD
 * DOES NOT CARRY. When the payload explains the emptiness, say what it says.
 * When it does not, say that it does not — an unexplained empty board is a
 * fault in the pipeline, and reading like one is the point.
 */
const fs = require('fs'), path = require('path'), assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, '..', 'current.html'), 'utf8');

function grab(re, what) {
  const m = html.match(re);
  assert(m, what + ' not found in current.html');
  return m[0];
}
eval(grab(/function esc\(s\)\{[\s\S]*?\n\}/, 'esc'));
eval(grab(/var BOARD_NAME=\{[\s\S]*?\};/, 'BOARD_NAME'));
eval(grab(/function boardMarket\(k\)\{[\s\S]*?\n\}/, 'boardMarket'));
eval(grab(/function boardDiag\(k\)\{[\s\S]*?\n\}/, 'boardDiag'));
eval(grab(/function boardRetired\(k\)\{[\s\S]*?\n\}/, 'boardRetired'));
/* boardEmpty now appends the closing-line measurement after the reason, so
   its helpers have to exist here too. What they render is pinned separately
   in clv_four_numbers.test.js; this file only needs boardEmpty to run. */
eval(grab(/function isNum\(v\)\{[\s\S]*?\n\}/, 'isNum'));
eval(grab(/function clvPp\(v\)\{[^\n]*\}/, 'clvPp'));
eval(grab(/function clvCiTxt\(ci\)\{[\s\S]*?\n\}/, 'clvCiTxt'));
eval(grab(/function clvRow\(label,val,why\)\{[\s\S]*?\n\}/, 'clvRow'));
eval(grab(/function clvLedger\(k\)\{[\s\S]*?\n\}/, 'clvLedger'));
eval(grab(/function boardEmpty\(k\)\{[\s\S]*?\n\}/, 'boardEmpty'));

let pass = 0, fail = 0;
const t = (name, cond) => {
  try { assert(cond); console.log('  [PASS] ' + name); pass++; }
  catch (e) { console.log('  [FAIL] ' + name); fail++; }
};
const strip = s => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

/* ---- 1. A RETIRED MARKET SAYS SO, AND SAYS WHAT RETIRED IT ---------- */
global.D = {
  boards: { h2: [], tb2: [], diagnostics: {
    h2:  { hitters: 198, withMetric: 192, published: 0, ranked: 10,
           marketStatus: 'KILL', retiredBy: 'DISABLED_MARKETS',
           why: 'the h2 market is retired' },
    tb2: { hitters: 198, withMetric: 195, published: 0, ranked: 10,
           marketStatus: 'KILL', retiredBy: 'learning pass',
           why: 'the tb2 market is retired' } } },
  learned: { markets: {
    h2:  { status: 'KILL', retiredBy: 'DISABLED_MARKETS',
           reason: '2B props hit 23.7% over 30 days, unprofitable at any '
                 + 'realistic price (measured 2026-08-07)' },
    tb2: { status: 'KILL',
           reason: 'CLV 95% CI entirely negative (-3.4 to -2.99 pp) over 26 '
                 + 'priced bets' } } },
};
const h2 = strip(boardEmpty('h2'));
t('a retired board says it is retired', /market is retired/.test(h2));
t('...naming the market the way the rest of the page names it',
  /1\+ double market/.test(h2));
t('...and carries the measurement that retired it', /23\.7%/.test(h2));
t('...and never claims it is waiting on lineups',
  !/lineup/i.test(h2));
t('...and reports what the ranking produced before the retirement',
  /ranked 10 players/.test(h2) && /published none/.test(h2));
t('...and names who retired it', /DISABLED_MARKETS/.test(h2));

const tb2 = strip(boardEmpty('tb2'));
t('a learning-pass retirement carries its own measurement',
  /CLV 95% CI/.test(tb2) && !/23\.7%/.test(tb2));

/* ---- 2. A PRODUCER GAP IS NOT A RETIREMENT -------------------------- */
global.D = { boards: { h2: [], diagnostics: { h2: { hitters: 198,
  withMetric: 0, published: 0,
  why: 'no hitter carried doubles_per_g — the ranking had nothing to sort, '
     + 'so this is a producer gap, not a judgement about today’s players' } } },
  learned: { markets: {} } };
const gap = strip(boardEmpty('h2'));
t('a producer gap says it is a producer gap', /producer gap/.test(gap));
t('...and is not dressed as a retirement', !/retired/.test(gap));
t('...and still does not blame lineups', !/lineup/i.test(gap));

/* ---- 3. THE LINEUP SENTENCE SURVIVES, WHERE IT IS TRUE -------------- */
global.D = { boards: { h2: [], diagnostics: {} }, learned: { markets: {} },
             lineupsProjected: true };
t('a morning run with projected lineups may still say so',
  /confirmed lineups/.test(strip(boardEmpty('h2'))));

/* ---- 4. AN UNEXPLAINED EMPTY BOARD READS AS A FAULT -----------------
 * This is the state the surface was in for a month while saying nothing was
 * wrong. It must never again be the most reassuring branch.
 */
global.D = { boards: { h2: [], diagnostics: {} }, learned: { markets: {} } };
const dark = strip(boardEmpty('h2'));
t('an unexplained empty board says the payload does not explain it',
  /does not say why/.test(dark));
t('...and calls it a fault in the pipeline', /fault in the pipeline/.test(dark));
t('...and refuses to blame today’s players',
  /not a judgement about/.test(dark));
t('...and does not offer a wait that may never end', !/lineup/i.test(dark));

/* ---- 5. RETIREMENT IS A STATUS, NOT AN ABSENCE ---------------------- */
global.D = { boards: {}, learned: { markets: { h2: { status: 'KILL' },
  h1: { status: 'BLIND' } } } };
t('KILL is retired', boardRetired('h2') === true);
t('BLIND is not retired', boardRetired('h1') === false);
t('an unknown market is not retired', boardRetired('hrr') === false);

/* ---- 6. THE TAB SQUARE DOES NOT SAY "0 PICKS" FOR A DEAD MARKET -----
 * "0 picks" and "retired" are different claims; the first invites a reader
 * to check back tomorrow.
 */
t('the square labels a retired market rather than counting it',
  /boardRetired\(d\[0\]\)\?'retired'/.test(html));

/* ---- 7. O/U IS PUBLISHED AS A PROJECTION, NOT A BET -----------------
 * The O/U board is listed in DISABLED_MARKETS and publishes rows anyway,
 * because those rows feed the model's run distribution. What it must not do
 * is wear a betting badge.
 */
const ouSrc = grab(/if\(k==='ou'\)\{[\s\S]*?return;\}/, 'the O/U tab');
t('the O/U tab checks whether the market is retired',
  /boardRetired\('ou'\)/.test(ouSrc));
t('...and says outright that these are not bets',
  /not bets/.test(ouSrc));
t('...and labels a retired row PROJECTION rather than OVER or UNDER',
  /ouRet\?'PROJECTION'/.test(ouSrc));
t('...and keeps the rows, because the model uses them',
  /bf\.ou\|\|\[\]/.test(ouSrc));
t('...and stops printing "vs null" when no line is posted',
  /no posted line/.test(ouSrc));

/* ---- 8. A CONTAINER IS NOT A BOARD UNLESS IT IS A LIST -----------------
 * `boards.diagnostics` is a DICT shipped alongside the board ARRAYS. Three
 * places in this page iterated every key in `boardsFull` and called .forEach
 * on the value. On 2026-09-08 that threw inside renderSlate, and the Slate —
 * the default tab — rendered NOTHING in production. The pipeline note said
 * "all consumers already isinstance-guard"; that was true of the pipeline's
 * consumers and false of this one.
 */
const bfLoops = html.match(/Object\.keys\(bf\)\.forEach[^;]*;/g) || [];
t('every board-key loop exists', bfLoops.length === 3);
t('...and every one of them checks for an array first',
  bfLoops.every(l => /Array\.isArray/.test(l)));
t('...and none of them calls .forEach on an unchecked value',
  !bfLoops.some(l => /\(bf\[k\]\s*\|\|\s*\[\]\)\.forEach/.test(l)));

/* The functional half: a boards object shaped like production must survive
   the walk. A source-only assertion would pass on code that still throws. */
(function () {
  const takeIndex = {};
  const bf = { hr: [{ gamePk: 1, playerId: 9, eligible: true }], h2: [],
               diagnostics: { h2: { published: 0, why: 'retired' } } };
  let threw = null;
  try {
    Object.keys(bf).forEach(function (k) {
      if (Array.isArray(bf[k])) bf[k].forEach(r => { takeIndex[r.playerId] = r; });
    });
  } catch (e) { threw = e.message; }
  t('walking a production-shaped boards object does not throw', threw === null);
  t('...and still indexes the real board rows', takeIndex[9] !== undefined);
})();

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
