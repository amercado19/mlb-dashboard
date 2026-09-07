/* PARLAY MATH — what a combined number is allowed to claim.
 *
 * Three renderers printed a combined price and a percentage, and all three
 * said something they could not support:
 *
 *   tpRecalc      multiplied the odds the USER typed, then printed
 *                 "≈X% to hit" — which reads as the model's probability.
 *   buildCustom   multiplied the MODEL's fair leg prices and used the same
 *                 words, so the two were indistinguishable.
 *   hpCardHtml    used the BOOK price where a leg had one and the model's
 *                 fair price where it did not, then labelled the result
 *                 "model-fair".
 *
 * All three applied a flat 0.62 factor to same-game legs. That number has
 * never been fitted against a settled parlay. Multiplying dependent legs as
 * independent overstates a parlay; discounting them by a number nobody
 * measured is the same error pointed the other way, by an unknown amount —
 * so the assumption is applied, named at every use, and its consequence
 * stated, rather than quietly folded into a percentage.
 */
const fs = require('fs'), path = require('path'), assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, '..', 'current.html'), 'utf8');

function grab(re, what) {
  const m = html.match(re);
  assert(m, what + ' not found in current.html');
  return m[0];
}
eval(grab(/var SGP_ASSUMED=[\s\S]*?;\n/, 'SGP_ASSUMED'));
eval(grab(/var SGP_PROVENANCE=[\s\S]*?;\n/, 'SGP_PROVENANCE'));
eval(grab(/var PARLAY_SOURCE=\{[\s\S]*?\n\};/, 'PARLAY_SOURCE'));
eval(grab(/function amDec\([\s\S]*?\n\}/, 'amDec'));
eval(grab(/function decToAm\([\s\S]*?\n\}/, 'decToAm'));
eval(grab(/function tpCorrelatedGames\(byG\)\{[\s\S]*?\n\}/, 'tpCorrelatedGames'));
eval(grab(/function parlayCorrNote\(corr\)\{[\s\S]*?\n\}/, 'parlayCorrNote'));
eval(grab(/function parlayPayoutHtml\(dec,corr,kind,money\)\{[\s\S]*?\n\}/, 'parlayPayoutHtml'));
eval(grab(/function tpPayoutHtml\(dec,byG\)\{[\s\S]*?\n\}/, 'tpPayoutHtml'));

let pass = 0, fail = 0;
const t = (name, cond) => {
  try { assert(cond); console.log('  [PASS] ' + name); pass++; }
  catch (e) { console.log('  [FAIL] ' + name); fail++; }
};
const strip = s => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

const price = strip(tpPayoutHtml(6.0, { a: [1], b: [1], c: [1] }));
const model = strip(parlayPayoutHtml(4.2, 1, 'MODEL', '$10→$42'));
const mixed = strip(parlayPayoutHtml(9.0, 2, 'MIXED', '$10 → ~$90'));

/* ---- 1. EACH PERCENTAGE IS ATTRIBUTED TO WHAT PRODUCED IT ------------ */
t('the price-built figure is attributed to the price',
  /16\.7% is what THIS PRICE implies/.test(price));
t('...and explicitly disclaimed for the model',
  /not the model's number/.test(price) &&
  /does not publish a probability for a parlay/.test(price));
t('the model-built figure says it is the model\'s legs multiplied',
  /23\.8% is the model's own leg probabilities multiplied together/.test(model));
t('...and that it is not a measured parlay hit rate',
  /not a measured parlay hit rate/.test(model));
t('the mixed figure admits it mixes sources',
  /11\.1% mixes sources/.test(mixed));
t('...naming the book where a leg has one', /BOOK price where a leg has one/.test(mixed));
t('...and refusing both labels',
  /neither a pure market number nor a pure model number/.test(mixed));
t('the three sources are three different sentences',
  new Set([PARLAY_SOURCE.PRICE, PARLAY_SOURCE.MODEL, PARLAY_SOURCE.MIXED]).size === 3);

/* the old wording is gone from every RENDERED line. The strings survive in
   the comment that explains their removal, which is why this asserts on
   output rather than on the file — the file-scan version flags its own
   corrective prose. */
[price, model, mixed].forEach((s, i) => {
  t('rendered line ' + (i + 1) + ' no longer says "% to hit"',
    s.indexOf('% to hit') < 0);
  t('rendered line ' + (i + 1) + ' no longer says "correlation discount"',
    s.indexOf('correlation discount') < 0);
});
t('no renderer still calls a mixed number "model-fair"',
  mixed.indexOf('model-fair') < 0);

/* ---- 2. THE CORRELATION FACTOR IS NAMED AT EVERY USE ----------------- */
t('a same-game pair is reported, in the singular',
  /1 game carries more than one leg/.test(model));
t('two are reported in the plural', /2 games carry more than one leg/.test(mixed));
t('the legs are called dependent', /Those legs are dependent/.test(model));
t('the factor is called assumed', /assumed 0\.62 correlation factor/.test(model));
t('...with its provenance stated', /ASSUMED, NOT MEASURED/.test(model));
t('...and called a placeholder rather than a fitted value',
  /placeholder, not a fitted value/.test(model));
t('SGP_PROVENANCE itself says it was never measured',
  /NOT MEASURED/.test(SGP_PROVENANCE));
t('the factor is 0.62, unchanged — this pass renames, it does not retune',
  SGP_ASSUMED === 0.62);

/* ---- 3. NO ASSUMPTION IS CLAIMED WHEN NONE WAS APPLIED --------------- */
t('an all-different-games parlay says no assumption was applied',
  /no correlation assumption was applied/.test(price));
t('...and does not mention the factor at all', price.indexOf('0.62') < 0);

/* ---- 4. THE COUNTER COUNTS WHAT IT SAYS ------------------------------ */
t('a game with one leg is not correlated',
  tpCorrelatedGames({ a: [1], b: [1] }) === 0);
t('a game with two legs is', tpCorrelatedGames({ a: [1, 2] }) === 1);
t('three legs on one game is still one game',
  tpCorrelatedGames({ a: [1, 2, 3] }) === 1);
t('an empty slip counts nothing',
  tpCorrelatedGames({}) === 0 && tpCorrelatedGames(null) === 0);
/* hpCardHtml keeps its per-game tally as counts, not arrays */
t('numeric per-game counts are understood too',
  tpCorrelatedGames({ a: 2, b: 1 }) === 1);

/* ---- 5. THE ARITHMETIC STILL RUNS THROUGH THE ASSUMPTION ------------- */
/* The note must describe a calculation that still happens. */
t('tpRecalc combines same-game legs through the named constant',
  /var SGP=SGP_ASSUMED/.test(html));
t('buildCustom does too', /\(1\+\(gd-1\)\*SGP_ASSUMED\)/.test(html));
t('hpCardHtml does too', /d=1\+\(d-1\)\*SGP_ASSUMED/.test(html));
t('no bare 0.62 remains in the parlay math',
  !/\*\.62\b/.test(html) && !/\*0\.62\b/.test(html));
t('the factor is defined exactly once',
  (html.match(/SGP_ASSUMED\s*=/g) || []).length === 1);
t('all three renderers go through one payout builder',
  (html.match(/parlayPayoutHtml\(/g) || []).length >= 4);

/* ---- 6. THE MONEY IS UNCHANGED AND STILL RIGHT ----------------------- */
t('a $10 stake at 6.0 decimal returns $60', /\$10→\$60/.test(price));
t('...and $100 returns $600', /\$100→\$600/.test(price));
t('the combined American price is shown', /Combined \+500/.test(price));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
