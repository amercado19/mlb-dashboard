/* THE +1.5 LEG ON THE TICKET — label, and the leg that was left off.
 *
 * The pipeline now offers run-line legs to the parlay builder and drops one
 * that is already contained by a leg on the slip. Two things can go wrong on
 * the surface, and both look fine:
 *
 *   1. The +1.5 leg falls through to the generic tier fallback and is drawn
 *      as LEAN because its probability happens to exceed 0.6. That invents a
 *      confidence label the run-line model never assigned, and it is exactly
 *      the upgrade the directive forbids: PROVISIONAL must arrive as
 *      PROVISIONAL, not be promoted for entering a parlay.
 *
 *   2. The skip is invisible. A ticket that silently declined a leg looks
 *      identical to a ticket that was never offered one, so the reader
 *      cannot tell a working guard from a dead one.
 */
const fs = require('fs'), path = require('path'), assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, '..', 'current.html'), 'utf8');

function grab(re, what) {
  const m = html.match(re);
  assert(m, what + ' not found in current.html');
  return m[0];
}
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
let D = {};
function rate10fn() { return function () { return '0'; }; }
eval(grab(/function legTierInfo\(l\)\{[\s\S]*?\n\}/, 'legTierInfo'));
eval(grab(/function tpNestedNote\(tp\)\{[\s\S]*?\n\}/, 'tpNestedNote'));
eval(grab(/function legDesc\([\s\S]*?\n/, 'legDesc'));

let pass = 0, fail = 0;
const t = (name, cond) => {
  try { assert(cond); console.log('  [PASS] ' + name); pass++; }
  catch (e) { console.log('  [FAIL] ' + name); fail++; }
};
const strip = s => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/* ---- 1. THE LABEL IS THE PRODUCER'S, NOT ONE THE SURFACE PICKED ----- */
D = { ml: [{ gamePk: 1, team: 'KC', tier: 'STRONG' }], boardsFull: {} };
const p15 = { betType: 'plus15', team: 'KC', gamePk: 1, prob: 0.83,
              evidenceStatus: 'PROVISIONAL' };

t('a +1.5 leg wears the label its producer published',
  legTierInfo(p15)[0] === 'PROVISIONAL');
t('...and is not promoted to LEAN by a high probability',
  legTierInfo(p15)[0] !== 'LEAN');
t('...nor to STRONG', legTierInfo(p15)[0] !== 'STRONG');
t('...and is drawn in the unknown-tier style, not a confidence colour',
  legTierInfo(p15)[1] === 'b-unk');
t('the same team\'s moneyline keeps its own STRONG tier',
  legTierInfo({ betType: 'ml', team: 'KC', gamePk: 1 })[0] === 'STRONG');
t('a +1.5 leg whose producer labelled nothing says UNLABELLED',
  legTierInfo({ betType: 'plus15', team: 'KC', gamePk: 1, prob: 0.83 })[0] === 'UNLABELLED');
t('...rather than borrowing a tier from its probability',
  legTierInfo({ betType: 'plus15', team: 'KC', gamePk: 1, prob: 0.9 })[0] === 'UNLABELLED');
t('a −1.5 leg is treated the same way',
  legTierInfo({ betType: 'minus15', team: 'KC', gamePk: 1, prob: 0.4,
                evidenceStatus: 'PROVISIONAL' })[0] === 'PROVISIONAL');

/* ---- 2. THE SKIP IS VISIBLE, OR IT DID NOT HAPPEN ------------------- */
const skipped = strip(tpNestedNote({
  nestedSkipped: ['KC +1.5 was skipped: winning the game means losing by no more than one, so the moneyline implies the same team\'s +1.5 cover'],
  nestedNote: 'the default ticket prefers legs that do not nest, because a nested pair is one unit of risk priced as two. The combination is still legal and the guard still allows it.',
  plus15Considered: 2
}));

t('the ticket says a leg was left off', /Left off this ticket: 1 run-line leg/.test(skipped));
t('...naming the leg', /KC \+1\.5/.test(skipped));
t('...and the mathematical reason it was dropped',
  /winning the game means losing by no more than one/.test(skipped));
t('...and that the combination was legal, not banned', /still legal/.test(skipped));
t('...and calls it one unit of risk priced as two',
  /one unit of risk priced as two/.test(skipped));
t('the count of candidates examined is published too',
  /2 considered/.test(skipped));
t('two skips are pluralised', /2 run-line legs/.test(strip(tpNestedNote({
  nestedSkipped: ['a', 'b'], plus15Considered: 3 }))));

/* ---- 3. AN EMPTY SKIP LIST PRINTS NOTHING, AND CLAIMS NOTHING ------- */
t('a ticket that skipped nothing prints no note',
  tpNestedNote({ nestedSkipped: [], plus15Considered: 0 }) === '');
t('...and a payload from before the field existed prints nothing either',
  tpNestedNote({}) === '' && tpNestedNote(null) === '' &&
  tpNestedNote({ nestedSkipped: null }) === '');
t('a skip note never claims a leg was skipped when none was',
  strip(tpNestedNote({ nestedSkipped: [], plus15Considered: 4 })).indexOf('Left off') < 0);

/* ---- 4. THE SKIP TEXT IS THE PIPELINE'S, NOT REWRITTEN HERE --------- */
t('the reason is printed verbatim from the payload',
  /skipped: winning the game/.test(skipped));
t('the surface does not invent its own reason string',
  !/because it looked correlated/i.test(html));
t('the note is escaped, so a payload cannot inject markup',
  strip(tpNestedNote({ nestedSkipped: ['<img src=x onerror=1>'] })).indexOf('<img') < 0);

/* ---- 5. THE CARD ACTUALLY CALLS IT ---------------------------------- */
t('renderParlay renders the note on the suggested ticket',
  /\+tpNestedNote\(tp\)/.test(html));
t('...above the legs, where a reader sees it before the price',
  html.indexOf('+tpNestedNote(tp)') < html.indexOf("+legHtml+'<div class=\"tppay\""));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
