/* +1.5 RUN LINE ON THE SLATE — what the card may and may not claim.
 *
 * ALT15-RUNDIST-1 publishes from day one under a PROVISIONAL label. Three
 * ways to get this wrong were available and each is closed here:
 *
 *   1. UPGRADING THE LABEL. Publishing and being validated are different
 *      claims. The surface copies the producer's label and never strengthens
 *      it, and never uses SAFE / SAFER / LOCK.
 *   2. TIDYING THE TWO SIDES. Both +1.5 sides cover in a one-run game, so the
 *      probabilities do not sum to 1. Nothing may render the other side as
 *      1 minus this one.
 *   3. LETTING ABSENT READ AS EMPTY. A producer that did not run must not
 *      render as "no +1.5 edge today". The slate names the reason instead.
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
eval(grab(/function alt15For\(pk\)\{[\s\S]*?\n\}/, 'alt15For'));
eval(grab(/function alt15Note\(\)\{[\s\S]*?\n\}/, 'alt15Note'));
eval(grab(/function a15Pct\(p\)\{[\s\S]*?\n\}/, 'a15Pct'));
eval(grab(/function alt15Row\(g\)\{[\s\S]*?\n\}/, 'alt15Row'));

let pass = 0, fail = 0;
const t = (name, cond) => {
  try { assert(cond); console.log('  [PASS] ' + name); pass++; }
  catch (e) { console.log('  [FAIL] ' + name); fail++; }
};

const PICK = {
  gamePk: 776, game: 'NYM@ATL', bestPlus15Side: 'away', bestPlus15Team: 'NYM',
  bestPlus15Probability: 0.8312, pHomePlus15: 0.7104, pAwayPlus15: 0.8312,
  modelProjectedWinner: 'ATL',
  bestOutcome: { outcome: 'NYM +1.5', team: 'NYM', class: 'PLUS15',
                 probability: 0.8312 }
};
const AVAIL = {
  available: true, reason: null, date: '2026-09-07',
  label: 'TOP +1.5 PICK', evidence: 'PROVISIONAL',
  evidenceNote: 'the model may publish daily +1.5 rankings as soon as it is '
    + 'technically correct and running prospectively. Publishing is not the '
    + 'same as being validated, and the label says which one this is.',
  publishingModel: 'BASE-RESID-EMPIRICAL-1',
  publishingModelWhy: 'the preregistered challenger measured as a dead tie.',
  bothSidesNote: 'both +1.5 sides cover in a one-run game, so the two '
    + 'probabilities do not sum to 1 and are never made to.',
  bestOutcomeNote: 'BEST OUTCOME is the highest-probability outcome among the '
    + 'classes this model prices. It is NOT the best bet: no price enters it, '
    + 'so it says nothing about value, and it is allowed to disagree with '
    + 'MODEL WINNER.',
  byGamePk: { '776': PICK }, picks: [PICK]
};

/* ---- 1. THE ROW RENDERS, WITH THE PRODUCER'S OWN LABEL ---------------- */
global.D = { alt15: AVAIL };
const row = alt15Row({ gamePk: 776 });
t('the +1.5 row renders for a priced game', /Best \+1\.5/.test(row));
t('...naming the side', /NYM \+1\.5/.test(row));
t('...and the probability to a tenth', /83\.1%/.test(row));
t('the PROVISIONAL label is carried onto the card', /PROVISIONAL/.test(row));
t('...next to the producer\'s own pick label', /TOP \+1\.5 PICK/.test(row));
/* The chip's VISIBLE text is the producer's label verbatim. Checking the
   whole row for the word "validated" would fail on the evidence note, which
   uses it in a negation ("publishing is not the same as being validated") —
   and that sentence is the point, not a violation. So the assertion is on
   what the chip claims, plus that every use of the word is a denial. */
const chip = (row.match(/<span class="badge b-unk"[^>]*>([^<]*)<\/span>/) || [])[1];
t('the chip claims exactly the producer\'s label and evidence',
  chip === 'TOP +1.5 PICK · PROVISIONAL');
t('...so it is never upgraded to VALIDATED or STRONG',
  !/VALIDATED|STRONG/i.test(chip || ''));
t('every use of "validated" on the row is a denial',
  (row.match(/validated/gi) || []).length ===
  (row.match(/not the same as being validated/gi) || []).length);
['SAFE', 'SAFER', 'LOCK', 'GUARANTEED', "CAN'T LOSE"].forEach(w =>
  t('the row never says ' + w, row.toUpperCase().indexOf(w) < 0));

/* ---- 2. THE TWO SIDES ARE NOT COMPLEMENTS ----------------------------- */
t('the card says both sides cover in a one-run game',
  /one-run game/.test(row));
t('...and never prints the complement of the shown probability',
  row.indexOf('16.9%') < 0);
t('the OTHER side\'s own probability is not silently shown as the pick',
  row.indexOf('71.0%') < 0);

/* ---- 3. BEST OUTCOME IS NOT BEST VALUE -------------------------------- */
t('the best-outcome row renders', /Best outcome/.test(row));
t('...saying no price enters it', /no price enters it/.test(row));
t('...and that it may disagree with MODEL WINNER',
  /disagree with MODEL WINNER/.test(row));
/* the model projects ATL; the best outcome is NYM +1.5. The card shows both
   and does not reconcile them. */
t('best outcome may name a team the model does not project to win',
  /NYM \+1\.5/.test(row) && PICK.modelProjectedWinner === 'ATL');

/* ---- 4. ABSENT IS NAMED, NEVER RENDERED AS EMPTY ---------------------- */
const REASONS = {
  NO_ALT15_ARTIFACT: 'scripts/build_alt15.py produced nothing for this run.',
  ALT15_UNREADABLE: 'the artifact exists but could not be parsed.',
  ALT15_IS_FOR_ANOTHER_DATE: 'the artifact on disk is for a DIFFERENT date.',
  ALT15_HAS_NO_PICKS: 'the producer ran and priced no games.'
};
Object.keys(REASONS).forEach(code => {
  global.D = { alt15: { available: false, reason: code, why: REASONS[code] } };
  const n = alt15Note();
  t(code + ' prints a named reason on the slate',
    n.indexOf(code) >= 0 && n.indexOf(REASONS[code]) >= 0);
  t('...and no card renders a +1.5 row for it',
    alt15Row({ gamePk: 776 }) === '');
});
global.D = { alt15: { available: false, reason: 'NO_ALT15_ARTIFACT', why: 'x' } };
t('the unavailable line does not claim there is no edge',
  !/no \+1\.5 edge|no edge|nothing to bet/i.test(alt15Note()));
t('...and says NOT PUBLISHED rather than none found',
  /not published/i.test(alt15Note()));

/* ---- 5. A PAYLOAD WITHOUT THE BLOCK INVENTS NOTHING ------------------- */
global.D = {};
t('a payload predating the block prints no reason it was never given',
  alt15Note() === '');
t('...and renders no row', alt15Row({ gamePk: 776 }) === '');
global.D = { alt15: AVAIL };
t('a game the producer did not price renders no row',
  alt15Row({ gamePk: 999 }) === '');
t('an absent probability prints nothing rather than 0%', a15Pct(null) === null);
t('...and a real one prints', a15Pct(0.5) === '50.0%');

/* ---- 6. THE CARD AND THE SLATE ACTUALLY CALL THEM --------------------- */
t('slateCard2 renders the +1.5 row', /\+alt15Row\(g\)/.test(html));
t('...after the Bet row, so price verdict comes first',
  html.indexOf("<i>Bet</i>'+bet+'</div>'\n      +alt15Row(g)") >= 0);
t('renderSlate prints the unavailable line once, not per card',
  /head\+alt15Note\(\)\+body/.test(html));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
