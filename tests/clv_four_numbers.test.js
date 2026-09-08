/* FOUR NUMBERS, NOT ONE — what a retired board is allowed to imply.
 *
 * On 2026-09-08 the CLV retirement rule was corrected: it had compared a
 * vig-inclusive number to ZERO, and zero is not that number's break-even. The
 * first slate published under the corrected rule showed why the SURFACE
 * mattered as much as the rule.
 *
 * tb2's raw CLV is -3.2 pp. Read alone, that says the market was losing to
 * the close, and that is what the board implied. Its excess over its OWN
 * break-even (-3.31) is +0.11 pp, CI -0.09 to +0.32. tb2 closed at about
 * fair. What retired it was ROI, -34.3% over 268 settled bets.
 *
 * So one number cannot stand for four. This file pins that:
 *
 *   1. RAW CLV says out loud that it is vig-inclusive and is not a P&L.
 *   2. BREAK-EVEN CLV is the market's own, and the surface never derives it.
 *   3. EXCESS VS BREAK-EVEN is the measured quantity, and the only one that
 *      is compared with zero.
 *   4. RETIREMENT TEST names the rule AND which criterion actually fired, so
 *      "still retired" is never read as "still failing the CLV test".
 */
const fs = require('fs'), path = require('path'), assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, '..', 'current.html'), 'utf8');

function grab(re, what) {
  const m = html.match(re);
  assert(m, what + ' not found in current.html');
  return m[0];
}
eval(grab(/function esc\(s\)\{[\s\S]*?\n\}/, 'esc'));
eval(grab(/function isNum\(v\)\{[\s\S]*?\n\}/, 'isNum'));
eval(grab(/function clvPp\(v\)\{[^\n]*\}/, 'clvPp'));
eval(grab(/function clvCiTxt\(ci\)\{[\s\S]*?\n\}/, 'clvCiTxt'));
eval(grab(/function clvRow\(label,val,why\)\{[\s\S]*?\n\}/, 'clvRow'));
const ledgerSrc = grab(/function clvLedger\(k\)\{[\s\S]*?\n\}/, 'clvLedger');
eval(ledgerSrc);

let pass = 0, fail = 0;
const t = (name, cond) => {
  try { assert(cond); console.log('  [PASS] ' + name); pass++; }
  catch (e) { console.log('  [FAIL] ' + name); fail++; }
};
const strip = s => s.replace(/<[^>]+>/g, ' ').replace(/&middot;/g, '·')
  .replace(/\s+/g, ' ').trim();

/* The real tb2, as run #636 published it. */
const TB2 = {
  mean_clv_pp: -3.2, clvBreakEvenPp: -3.31, clvCi: [-3.4, -2.99],
  clv: { rawClvPp: -3.2, rawClvCi: [-3.4, -2.99], breakEvenClvPp: -3.31,
         excessClvPp: 0.11, excessClvCi: [-0.09, 0.32],
         nPriced: 26, nNormalised: 26 },
  killTest: { rule: 'excess_clv_ci_hi < 0' },
  reason: 'ROI -34.3% over 268 settled bets',
};
global.D = { learned: { retirementHistory: { tb2: { correctedMeasurement: {
  retainedBy: 'ROI',
  retainedByWhy: 'NOT the CLV test. Excess CLV over this market\'s own '
    + 'break-even is -0.09 to 0.32 pp, which does not clear the retirement '
    + 'threshold. Realised ROI carries the retirement: -34.3% over 268 '
    + 'settled bets.',
} } } } };
let MARKET = TB2;
global.boardMarket = () => MARKET;

/* ---- 1. THE FOUR ARE FOUR, AND THEY ARE LABELLED ---- */
const out = strip(clvLedger('tb2'));
t('the raw number is labelled raw', /RAW CLV/i.test(out));
t('the break-even is labelled break-even', /BREAK-EVEN CLV/i.test(out));
t('the measured quantity is labelled excess', /EXCESS VS BREAK-EVEN/i.test(out));
t('the rule is labelled retirement test', /RETIREMENT TEST/i.test(out));

/* ---- 2. RAW IS NOT A PROFIT AND LOSS, AND SAYS SO ---- */
t('raw prints with units, never bare', /-3\.20 pp/.test(out));
t('...and carries its own interval', /-3\.40 pp to -2\.99 pp/.test(out));
t('...and states it is vig-inclusive', /vig-inclusive/i.test(out));
t('...and refuses to be read as a P&L',
  /not a profit or a loss/i.test(out));
t('...and the board never calls a negative raw CLV losing',
  !/\blosing\b/i.test(out));

/* ---- 3. THE YARDSTICK IS THIS MARKET'S OWN ---- */
t('break-even is printed', /-3\.31 pp/.test(out));
t('...and said to be this market\'s own', /own break-even/i.test(out));
t('...and the surface derives no break-even of its own',
  !/2\.38|1\.19|devig|implied/i.test(ledgerSrc));

/* ---- 4. EXCESS IS THE MEASURED QUANTITY ----
 * +0.11 with a CI straddling zero. A reader must be able to see that this
 * market closed at about fair, which the raw number alone denies.
 */
t('excess is printed with a sign', /\+0\.11 pp/.test(out));
t('...with its interval', /-0\.09 pp to \+0\.32 pp/.test(out));
t('...and is named as the only one compared with zero',
  /only one .* compared with zero/i.test(out));

/* ---- 5. "STILL RETIRED" NEVER MEANS "STILL FAILING THE CLV TEST" ---- */
t('the rule is printed verbatim', /excess_clv_ci_hi < 0/.test(out));
t('...and the criterion that actually fired is named', /fired on ROI/.test(out));
t('...and the reason says outright it was not the CLV test',
  /NOT the CLV test/.test(out));

/* ---- 6. IT DEGRADES, IT DOES NOT INVENT ---- */
MARKET = { mean_clv_pp: -3.2, clvBreakEvenPp: -3.31, clvCi: [-3.4, -2.99] };
const old = strip(clvLedger('tb2'));
t('a payload predating the clv block still renders', /-3\.20 pp/.test(old));
t('...and shows an em dash where excess is unknown', /—/.test(old));
t('...and invents no excess figure', !/\+0\.11/.test(old));

MARKET = {};
t('a market with no closing measurement renders nothing',
  clvLedger('x') === '');
MARKET = { clv: { rawClvPp: null, breakEvenClvPp: null, excessClvPp: null } };
t('...and so does one whose numbers are all null', clvLedger('x') === '');

/* ---- 7. THE RETIRED BOARD ACTUALLY CARRIES IT ---- */
const emptySrc = grab(/function boardEmpty\(k\)\{[\s\S]*?\n\}/, 'boardEmpty');
t('the empty board appends the ledger', /clvLedger\(k\)/.test(emptySrc));
t('...after the reason, not instead of it',
  emptySrc.indexOf('boardWhyText') < emptySrc.indexOf('clvLedger'));

/* ---- 8. THE THREE SURFACES DO NOT DRIFT ---- */
['index.html', 'preview.html'].forEach(f => {
  const other = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  t(f + ' carries the same ledger', other.indexOf(ledgerSrc) >= 0);
});

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
