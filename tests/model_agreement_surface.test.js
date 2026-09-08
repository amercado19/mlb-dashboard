/* TWO MODELS, TWO QUESTIONS — what the card is allowed to say about a split.
 *
 * On 2026-09-08 the win model and the run projection named different teams in
 * six of eleven games. The only place that fact reached anyone was six
 * consistency warnings on an admin page, which reads as "the system is
 * degraded on half the slate". It was not degraded. Two models of two
 * different quantities disagreed, which is a fact about those games.
 *
 * Three rules this file enforces:
 *
 *   1. THE CARD NEVER DERIVES THE SPLIT ITSELF. The pipeline publishes
 *      `modelAgreement`, computed from RAW run projections. The card prints
 *      rounded ones — 4.6501 and 4.6499 render as "4.7 - 4.6" — so a surface
 *      that compared what it draws would invent disagreements that the raw
 *      numbers do not contain.
 *
 *   2. THE TWO QUESTIONS ARE LABELLED. "MODEL WINNER" and "PROJECTED SCORE"
 *      are different claims from different models, and a reader must not have
 *      to infer that one is a restatement of the other.
 *
 *   3. A SPLIT IS NEVER SHOWN AS A FAULT. No warning styling, no severity
 *      word, no "score_direction". It is uncertainty about the game.
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
eval(grab(/function pill\(txt,cls,tip\)\{[\s\S]*?\n\}/, 'pill'));
eval(grab(/function maOf\(P\)\{[\s\S]*?\n\}/, 'maOf'));
eval(grab(/function maMixed\(P\)\{[\s\S]*?\n\}/, 'maMixed'));
eval(grab(/function maChip\(P\)\{[\s\S]*?\n\}/, 'maChip'));
eval(grab(/function maSummary\(\)\{[\s\S]*?\n\}/, 'maSummary'));

let pass = 0, fail = 0;
const t = (name, cond) => {
  try { assert(cond); console.log('  [PASS] ' + name); pass++; }
  catch (e) { console.log('  [FAIL] ' + name); fail++; }
};
const strip = s => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

const SPLIT = {
  status: 'DISAGREEMENT', moneylineWinner: 'BAL', moneylineProb: 0.5183,
  runProjectionWinner: 'CLE', projectedRunDiffRaw: 0.62, magnitude: 'CLEAR',
  runProjectionNote: '', userLabel: 'MIXED SIGNAL',
  userWhy: 'Win model favours BAL; the run model projects more runs for CLE by 0.62.',
};
const NEAR = {
  status: 'NEAR_TIE', moneylineWinner: 'BAL', moneylineProb: 0.5183,
  runProjectionWinner: null, projectedRunDiffRaw: 0.05, magnitude: 'TINY',
  runProjectionNote: 'NEAR EVEN', userLabel: 'MIXED SIGNAL',
  userWhy: 'Win model favours BAL; the run model projects a near-even game (0.05 runs apart).',
};
const AGREE = {
  status: 'AGREEMENT', moneylineWinner: 'MIL', moneylineProb: 0.6436,
  runProjectionWinner: 'MIL', projectedRunDiffRaw: 1.8, magnitude: 'CLEAR',
  runProjectionNote: '', userLabel: '', userWhy: '',
};

/* ---- 1. THE CARD READS THE PUBLISHED OBJECT, IT DOES NOT DERIVE ONE ---- */
t('a payload with no agreement object yields no chip', maChip({}) === '');
t('...and no mixed state', maMixed({}) === false);
t('...so a payload predating the field renders as it did before',
  maOf({ awayProjectedRuns: 4.7, homeProjectedRuns: 4.6 }) === null);
t('a published split is read, not recomputed',
  maOf({ modelAgreement: SPLIT }) === SPLIT);
t('the card source never compares projected runs to pick a run winner',
  !/awayRuns\s*[<>]\s*.*homeRuns|homeRuns\s*[<>]\s*.*awayRuns/.test(
    grab(/function slateCard2\(g,m\)\{[\s\S]*?\n\}/, 'slateCard2')));

/* ---- 2. A SPLIT IS SHOWN, AND SHOWN AS UNCERTAINTY ---- */
const chip = maChip({ modelAgreement: SPLIT });
t('a split gets a chip', /MIXED SIGNAL/.test(chip));
t('...that is not styled as a warning', !/b-warn|b-fail|b-bad/.test(chip));
t('...and never uses a severity word',
  !/severe|warning|error|degraded|corrupt/i.test(strip(chip)));
t('...and never leaks the internal check name',
  !/score_direction/i.test(strip(chip)));
t('...but carries the raw run difference where a reader can find it',
  /0\.62 raw runs/.test(chip));
t('an agreement gets no chip at all', maChip({ modelAgreement: AGREE }) === '');

/* ---- 3. A NEAR TIE IS NOT A CONTRADICTION ----
 * "the run model favours CLE" is a claim. At 0.05 runs it is not one worth
 * making, and the object refuses to name a run winner for it.
 */
t('a near tie names no run-model winner', NEAR.runProjectionWinner === null);
t('...and says NEAR EVEN instead', NEAR.runProjectionNote === 'NEAR EVEN');
t('...and still counts as mixed', maMixed({ modelAgreement: NEAR }) === true);
t('...with the run gap in its own words',
  /near-even game \(0\.05 runs apart\)/.test(maChip({ modelAgreement: NEAR })));

/* ---- 4. THE TWO QUESTIONS ARE LABELLED ON THE CARD ---- */
const cardSrc = grab(/function slateCard2\(g,m\)\{[\s\S]*?\n\}/, 'slateCard2');
t('the card labels the win model', /model winner/.test(cardSrc));
t('...and labels the run model separately', /projected score/.test(cardSrc));
t('...and renders NEAR EVEN beside the score, not instead of it',
  /runProjectionNote/.test(cardSrc) && /g2proj/.test(cardSrc));
t('...and prints the reason under them', /g2why/.test(cardSrc));

/* ---- 5. THE SLATE SAYS IT ONCE, IN COUNTS ---- */
global.D = { modelAgreementSummary: {
  games: 15, agreement: 8, nearTie: 2, disagreement: 4, notMeasurable: 1,
  mixed: 6, label: 'MIXED MODEL SIGNALS — 6 of 15 games',
  why: 'The win model and the run model are separate models of separate questions.' } };
const sum = strip(maSummary());
t('the slate summarises the split', /MIXED MODEL SIGNALS/.test(sum));
t('...in counts, not a verdict', /8 agree/.test(sum) && /4 split/.test(sum));
t('...naming near-even separately from split', /2 near-even/.test(sum));
t('...and never calls the system degraded',
  !/degraded|unhealthy|critical|fault|error/i.test(sum));
t('...and explains that two models are two questions',
  /separate models of separate questions/.test(sum));

global.D = { modelAgreementSummary: {
  games: 15, agreement: 15, nearTie: 0, disagreement: 0, notMeasurable: 0,
  mixed: 0, label: '', why: '' } };
t('a slate with no split says nothing at all', maSummary() === '');
global.D = {};
t('a payload with no summary says nothing either', maSummary() === '');

/* ---- 6. THE THRESHOLDS ARE NOT PRESENTED AS MEASURED ----
 * 0.25 and 0.50 runs are display semantics. The surface must not restate them
 * as a rule, and must not print a number the pipeline did not publish.
 */
t('the surface hardcodes no run threshold of its own',
  !/0\.25|NEAR_TIE_RUNS|SMALL_EDGE_RUNS/.test(cardSrc));
t('...and derives no magnitude band itself',
  !/TINY|CLEAR/.test(cardSrc.replace(/magnitude/g, '')));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
