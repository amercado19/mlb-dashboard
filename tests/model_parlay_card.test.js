/* THE MODEL PARLAY CARD — a bet slip's styling without a bet slip's claim.
 *
 * This card is the most dangerous surface in the product, because it looks
 * exactly like something you can hand to a sportsbook. Three specific ways
 * it could lie, each asserted below:
 *
 *   1. It shows a combined percentage when the pipeline said NOT MEASURED,
 *      because a card with a big number reads better than one without.
 *   2. It shows a price, or an EV, or anything that implies a book has
 *      quoted this ticket. Nobody has.
 *   3. It shows 71% on a run line and 71% on a moneyline as if they were
 *      the same claim. They are not: the run line covers ~64% before any
 *      model runs and the moneyline is 50% by construction, so the base
 *      rate has to travel with the number.
 *
 * A prop leg carries no probability at all — the publish gate suppresses
 * prop probabilities as unvalidated — so it must read RANKING ONLY and must
 * never be multiplied into a ticket number.
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
function isNum(x) { return typeof x === 'number' && isFinite(x); }
const SH_ABSENT = '—';
let D = {};
function hFace(id, name) { return '<img alt="' + esc(name || '') + '" src="face/' + id + '">'; }
function hTeam(t) { return '<img alt="' + esc(t) + '" src="logo/' + t + '">'; }
function pill(txt, cls, tip) {
  return '<span class="badge ' + cls + '" title="' + esc(tip || '') + '">' + esc(txt) + '</span>';
}
eval(grab(/function mpPct\(v\)\{[\s\S]*?\n\}/, 'mpPct'));
eval(grab(/function mpLabelTone\(l\)\{[\s\S]*?\n\}/, 'mpLabelTone'));
eval(grab(/function mpBandRow\(l\)\{[\s\S]*?\n\}/, 'mpBandRow'));
eval(grab(/function mpLegRow\(l,i\)\{[\s\S]*?\n\}/, 'mpLegRow'));
eval(grab(/function mpStatusRow\(k,v,tone,tip\)\{[\s\S]*?\n\}/, 'mpStatusRow'));
eval(grab(/function mpFunnel\(f\)\{[\s\S]*?\n\}/, 'mpFunnel'));
eval(grab(/function modelParlayCard\(\)\{[\s\S]*?\n\}/, 'modelParlayCard'));
eval(grab(/function mpLegShort\(l\)\{[\s\S]*?\n\}/, 'mpLegShort'));

let pass = 0, fail = 0;
const t = (name, cond) => {
  try { assert(cond); console.log('  [PASS] ' + name); pass++; }
  catch (e) { console.log('  [FAIL] ' + name); fail++; }
};
const strip = s => s.replace(/<[^>]+>/g, ' ').replace(/&middot;/g, '·')
  .replace(/&mdash;/g, '—').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

const LEG_P15 = {
  desc: 'LAD +1.5', betType: 'plus15', team: 'LAD', gamePk: 1,
  likelihood: 0.715, likelihoodBasis: 'MODEL_PROBABILITY',
  label: 'PROVISIONAL', baseRate: 0.6364, baseRateStatus: 'PUBLISHED',
  baseRateSource: 'ALT15 corpus, 2155 games'
};
const LEG_ML = {
  desc: 'BOS ML', betType: 'ml', team: 'BOS', gamePk: 2,
  likelihood: 0.63, likelihoodBasis: 'MODEL_PROBABILITY', label: 'LEAN',
  baseRate: 0.5, baseRateStatus: 'PUBLISHED',
  baseRateSource: 'arithmetic: one winner between two sides'
};
const LEG_PROP = {
  desc: 'Judge 1+ Hit', betType: 'h1', playerId: 592450, name: 'Judge',
  team: 'NYY', gamePk: 3, likelihood: null,
  likelihoodBasis: 'BOARD_SELECTION', label: 'TOP MODEL PICK',
  boardRank: 1, boardOf: 10, baseRate: 0.6122, baseRateStatus: 'PUBLISHED',
  baseRateSource: 'full eligible universe, 14720 row(s)'
};

const BASE = {
  schemaVersion: 'MODEL-PARLAY-1', ticketType: 'MODEL_PARLAY',
  priceStatus: 'NOT_CAPTURED',
  priceWhy: 'legs are chosen on outcome likelihood, not on whether a book has quoted them',
  evStatus: 'NOT_MEASURED',
  evWhy: 'expected value needs a price and a validated ticket probability. This ticket has neither',
  baseRateNote: 'a probability is only meaningful against its market\'s base rate.',
  notBettableNote: 'This is the model\'s most likely combination, not a priced ticket.',
  dependence: { independenceLicensed: true, why: [] },
  whyTheseLegs: ['3 leg(s) carry the model\'s own outcome probability'],
  funnel: { considered: 9, selected: 3, conserves: true,
            note: 'the two products have separate funnels',
            rejected: [{ desc: 'KC +1.5', reason: 'NESTED_WITH_A_SELECTED_LEG',
                         why: 'a selected leg already contains this outcome' }] }
};

/* ---- 1. A MEASURED COMBINED NUMBER IS LABELLED AN ESTIMATE ---------- */
D = { modelParlay: Object.assign({}, BASE, {
  legs: [LEG_P15, LEG_ML], legCount: 2,
  combinedProbability: 0.4505,
  combinedProbabilityStatus: 'INDEPENDENCE_ESTIMATE',
  combinedProbabilityWhy: 'no two legs share a game, so multiplying them is licensed. This is an INDEPENDENCE ESTIMATE, not a measured parlay hit rate' }) };
const est = strip(modelParlayCard());
t('a licensed ticket shows the combined number', /45\.1%/.test(est));
t('...labelled an independence estimate', /INDEPENDENCE ESTIMATE/.test(est));
t('...never called a measured hit rate',
  est.indexOf('hit probability') < 0 && est.indexOf('% to hit') < 0);

/* ---- 2. AN UNMEASURED ONE SHOWS NO NUMBER AT ALL -------------------- */
D = { modelParlay: Object.assign({}, BASE, {
  legs: [LEG_P15, LEG_PROP], legCount: 2,
  combinedProbability: null,
  combinedProbabilityStatus: 'NOT_MEASURED',
  combinedProbabilityWhy: '1 leg(s) publish no probability — a board score is not a chance' }) };
const notm = strip(modelParlayCard());
t('an unmeasured ticket says NOT MEASURED', /Combined chance NOT MEASURED/.test(notm));
t('...and prints no combined percentage',
  !/\b\d\d\.\d% · INDEPENDENCE/.test(notm));
t('...and the prop leg reads RANKING ONLY', /RANKING ONLY/.test(notm));
/* The base rate IS a percentage and belongs on the row, so a blanket
   "no percent near this leg" scan would flag the honest half. What must
   be absent is the LIKELIHOOD slot: the value cell shows RANKING ONLY
   where a probability would otherwise sit. */
const _propRow = mpLegRow(LEG_PROP, 0);
const _valueCell = _propRow.slice(_propRow.indexOf('class="mpv"'));
t('...and the value cell holds RANKING ONLY',
  /RANKING ONLY/.test(_valueCell));
t('...with no probability in it',
  !/\d+\.\d%/.test(_valueCell.replace(/<[^>]+>/g, ' ')));
t('...while the base rate still appears on the row',
  /base 61\.2%/.test(strip(_propRow)));

/* ---- 3. NO PRICE, NO EV, EVER --------------------------------------- */
t('the card says the book price was not captured',
  /Book price NOT CAPTURED/.test(est));
t('...and EV is not measured', /EV NOT MEASURED/.test(est));
t('...and it says it is not a priced ticket',
  /not a priced ticket/.test(est));
t('no dollar figure appears anywhere', est.indexOf('$') < 0);
t('no American price appears anywhere',
  !/[+-]\d{3}\b/.test(est));

/* ---- 4. A BASE RATE TRAVELS WITH EVERY PROBABILITY ------------------ */
t('the run line shows its own base rate', /base 63\.6%/.test(est));
t('...and how far above it the model sits', /\+7\.9pp vs base/.test(est));
t('the moneyline shows a 50% base', /base 50\.0%/.test(est));
t('...and its larger lift', /\+13\.0pp vs base/.test(est));
t('the card explains why base rates are shown',
  /only meaningful against its market/.test(est));
/* The whole point: 71.5% and 63% must not read as "the run line is the
   better pick" — the lifts say otherwise and both are on the card. */
t('the weaker-looking leg is visibly the bigger lift',
  est.indexOf('+13.0pp') > est.indexOf('+7.9pp'));

/* ---- 5. AN ABSENT BASE RATE IS SAID, NOT OMITTED -------------------- */
D = { modelParlay: Object.assign({}, BASE, {
  legs: [Object.assign({}, LEG_P15, { baseRate: null,
    baseRateStatus: 'NOT_AVAILABLE',
    baseRateWhy: 'no measured base rate is published for this market' }), LEG_ML],
  legCount: 2, combinedProbability: null,
  combinedProbabilityStatus: 'NOT_MEASURED', combinedProbabilityWhy: 'x' }) };
const nobase = strip(modelParlayCard());
t('a leg with no base rate says so', /base rate not available/.test(nobase));
t('...and invents no number for it', !/base \d/.test(nobase.split('BOS ML')[0]));

/* ---- 6. EVIDENCE LABELS ARE NOT FORCED INTO ONE SYSTEM -------------- */
t('the +1.5 keeps PROVISIONAL', /PROVISIONAL/.test(est));
t('the moneyline keeps its own tier', /LEAN/.test(est));
D = { modelParlay: Object.assign({}, BASE, {
  legs: [LEG_PROP, LEG_ML], legCount: 2, combinedProbability: null,
  combinedProbabilityStatus: 'NOT_MEASURED', combinedProbabilityWhy: 'x' }) };
t('the prop keeps TOP MODEL PICK', /TOP MODEL PICK/.test(strip(modelParlayCard())));
t('a PROVISIONAL label is not tinted as confidence',
  mpLabelTone('PROVISIONAL') === 'b-unk');
t('...nor is TOP MODEL PICK', mpLabelTone('TOP MODEL PICK') === 'b-unk');
t('a measured MODERATE may be tinted', mpLabelTone('MODERATE') === 'b-lean');

/* ---- 7. FEWER THAN TWO LEGS IS NOT A PARLAY ------------------------- */
D = { modelParlay: Object.assign({}, BASE, { legs: [LEG_ML], legCount: 1 }) };
const one = strip(modelParlayCard());
t('a one-leg model ticket says NOT A PARLAY', /NOT A PARLAY/.test(one));
t('...and explains the minimum', /needs at least two legs/.test(one));
t('...and prints no combined anything', one.indexOf('Combined chance') < 0);

/* ---- 8. A FAILED BUILD IS A NAMED REFUSAL --------------------------- */
D = { modelParlay: { buildFailed: true, why: 'KeyError: boards' } };
const bad = strip(modelParlayCard());
t('a failed build says NOT BUILT', /NOT BUILT/.test(bad));
t('...and carries the reason', /KeyError/.test(bad));
t('...and shows no legs', bad.indexOf('Combined chance') < 0);

/* ---- 9. NO BLOCK RENDERS NOTHING ------------------------------------ */
D = {};
t('a payload with no model parlay renders nothing', modelParlayCard() === '');

/* ---- 10. WHAT WAS LEFT OFF IS VISIBLE ------------------------------- */
t('the funnel is rendered', /What was left off/.test(est));
t('...naming the dropped leg and its reason',
  /KC \+1\.5/.test(est) && /NESTED WITH A SELECTED LEG/.test(est));
t('...and saying the two products have separate funnels',
  /separate funnels/.test(est));

/* ---- 11. WIRED IN, MODEL FIRST -------------------------------------- */
t('the parlay page renders the model card', /lockBan\+_mpcard\+sugg/.test(html));
t('...before the priced one',
  html.indexOf('_mpcard+sugg') > 0);
t('the priced card is named as book-priced',
  /Best priced parlay<\/span><span class="t">book-priced/.test(html));
t('the hero uses the model parlay as its primary parlay tile',
  /hHomeRun\(\),hModelParlay\(\),hParlay\(\)/.test(html));

/* ---- 12. A PROBABILITY CARRIES THE BAND THAT MEASURED IT ------------
 * The moneyline leg publishes P(win). That number has been measured band
 * by band, and the bands are wildly uneven: 0.50-0.60 holds n=332 while
 * 0.80+ holds n=2. An 87% leg printed the same way as a 55% leg tells the
 * reader those two claims are equally supported. They are not.
 */
const thin = mpLegRow({desc:'KC ML', team:'KC', likelihood:0.8718,
  baseRate:0.5, baseRateStatus:'PUBLISHED', baseRateSource:'arithmetic',
  label:'MODERATE_MODEL', measuredBandN:2, measuredBandWinRate:0.0,
  measuredBandStatus:'UNDERPOWERED', measuredBandGapPp:-81.3}, 0);
t('a moneyline leg prints its calibration band', /band n=2/.test(thin));
t('...and what that band actually did', /measured 0\.0%/.test(thin));
t('...and the gap between the two', /-81\.3pp gap/.test(thin));
t('...and the sample status in words', /underpowered/.test(thin));
t('...flagged, so a thin band does not read like a thick one',
  /mpband mpthin/.test(thin));
t('...while the lift over base is still shown',
  /\+37\.2pp vs base/.test(thin));

const thick = mpLegRow({desc:'PHI ML', team:'PHI', likelihood:0.5495,
  baseRate:0.5, baseRateStatus:'PUBLISHED', baseRateSource:'arithmetic',
  label:'MODERATE_MODEL', measuredBandN:332, measuredBandWinRate:0.5482,
  measuredBandStatus:'ADEQUATE_SAMPLE', measuredBandGapPp:1.0}, 0);
t('a well-sampled band is not flagged', !/mpthin/.test(thick));
t('...and still prints its n', /band n=332/.test(thick));
t('...and its status', /adequate sample/.test(thick));

const noband = mpLegRow({desc:'Judge 1+ Hit', playerId:1, likelihood:null,
  baseRate:0.612, baseRateStatus:'PUBLISHED', baseRateSource:'universe',
  label:'MODERATE'}, 0);
t('a leg with no measured band prints no band row', !/mpband/.test(noband));
t('...and still reads RANKING ONLY', /RANKING ONLY/.test(noband));
t('a band row is never invented from an absent n',
  mpBandRow({measuredBandN:null, measuredBandStatus:'UNDERPOWERED'}) === '');

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
