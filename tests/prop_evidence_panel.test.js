/* PROP EVIDENCE ON THE LAB TAB.
 *
 * The panel has to hold two things apart that a reader will merge on sight:
 *
 *   SELECTION  being on the board is a real signal — true in all five markets.
 *   ORDERING   the printed position means something — true in two.
 *
 * If the page shows one "accuracy" per market, the three markets whose rank
 * order is chance inherit the credibility of the two whose isn't, and rank 1
 * starts reading as a stronger pick than rank 8 in markets where it demonstrably
 * is not. So both verdicts appear per row, and the summary sentence names the
 * markets where rank may carry a label rather than counting them vaguely.
 *
 * The second job is the retraction. A withdrawn number needs four parts. A
 * correction that says only "this was fixed" leaves a reader who saw the
 * original claim with no way to know what it was or why it went away.
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
const SH_ABSENT = '—';
let D = {};
function ahs(title, right, body) {
  return '<section><h>' + title + '</h><r>' + right + '</r>' + body + '</section>';
}
eval(grab(/function labRoot\(\)\{[\s\S]*?\n\}/, 'labRoot'));
eval(grab(/function peVerdict\(v\)\{[\s\S]*?\n\}/, 'peVerdict'));
eval(grab(/function pePct\(v,dp\)\{[\s\S]*?\n\}/, 'pePct'));
eval(grab(/function peAuc\(b\)\{[\s\S]*?\n\}/, 'peAuc'));
eval(grab(/function peLift\(b,k\)\{[\s\S]*?\n\}/, 'peLift'));
eval(grab(/function peCorrection\(c\)\{[\s\S]*?\n\}/, 'peCorrection'));
eval(grab(/function pePanel\(\)\{[\s\S]*?\n\}/, 'pePanel'));

let pass = 0, fail = 0;
const t = (name, cond) => {
  try { assert(cond); console.log('  [PASS] ' + name); pass++; }
  catch (e) { console.log('  [FAIL] ' + name); fail++; }
};
const strip = s => s.replace(/<[^>]+>/g, ' ').replace(/&middot;/g, '·')
  .replace(/&mdash;/g, '—').replace(/&gt;/g, '>').replace(/&lt;/g, '<')
  .replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

const fam = (label, short, cond, uauc, uverd, ubase, bbase, mauc, mverd,
             rauc, rverd) => ({
  label: { humanName: label, shortName: short, targetCondition: cond },
  fullUniverse: { n: 14720, auc: uauc, ci95: [uauc - 0.01, uauc + 0.01],
                  verdict: uverd, baseRate: ubase,
                  top5: { hitRate: 0.71, liftVsBase: 1.159, n: 310 } },
  boardMetric: { n: 594, auc: mauc, ci95: [mauc - 0.05, mauc + 0.05],
                 verdict: mverd, baseRate: bbase },
  boardPrintedRank: { n: 594, auc: rauc, ci95: [rauc - 0.05, rauc + 0.05],
                      verdict: rverd, baseRate: bbase },
  selection: { boardBaseRate: bbase, universeBaseRate: ubase,
               boardAboveUniverse: bbase > ubase,
               how: 'a comparison of two published base rates, not a new measurement' }
});

const REAL = {
  available: true, daysEvaluated: 62, dateRange: ['2026-06-04', '2026-08-09'],
  universeMembership: 'BOXSCORE_STARTERS',
  universeNote: 'the pool is the nine starting batters per side. That is outcome-adjacent.',
  featureAsOf: 'PREVIOUS_DAY',
  notRepublished: 'the publishedBoard AUC is computed on p_raw, which chose nobody. It is deliberately not shown here.',
  separateClaims: 'SELECTION AND ORDERING ARE SEPARATE CLAIMS. A board can do the first and not the second.',
  readingNote: 'a board base rate above the universe base rate means the board picks good players.',
  notScoredHere: 'p_raw is deliberately NOT scored on these rows.',
  families: {
    h1: fam('1+ Hit', '1+ H', 'hits >= 1', 0.552, 'DISCRIMINATES', 0.6122, 0.6700,
            0.4862, 'NO_MEASURED_DISCRIMINATION', 0.4997, 'NO_MEASURED_DISCRIMINATION'),
    h2: fam('1+ Double', '1+ 2B', 'doubles >= 1', 0.5236, 'DISCRIMINATES', 0.1541, 0.2432,
            0.5853, 'DISCRIMINATES', 0.5622, 'DISCRIMINATES'),
    hr: fam('Home Run', 'HR', 'homeRuns >= 1', 0.5845, 'DISCRIMINATES', 0.1224, 0.2300,
            0.5430, 'NO_MEASURED_DISCRIMINATION', 0.5692, 'DISCRIMINATES'),
    tb2: fam('2+ Total Bases', '2+ TB', 'totalBases >= 2', 0.554, 'DISCRIMINATES', 0.3599, 0.4550,
             0.5322, 'NO_MEASURED_DISCRIMINATION', 0.4944, 'NO_MEASURED_DISCRIMINATION'),
    hrr: fam('2+ Hits + Runs + RBI', '2+ H+R+RBI', 'hits + runs + rbi >= 2', 0.559,
             'DISCRIMINATES', 0.4573, 0.5840, 0.4905, 'NO_MEASURED_DISCRIMINATION',
             0.4667, 'NO_MEASURED_DISCRIMINATION')
  },
  corrections: [
    { id: 'PROP-BOARD-INVERSION-2026-09-07',
      earlierResultInvalidated: 'two prop families were reported INVERTED on their published boards.',
      cause: 'the AUC was measured on p_raw, which does not select the board.',
      correctedResult: 'nothing is inverted, in any family, on any universe.',
      currentLimitation: 'prop_calibration.json verdicts may not be cited.',
      whyItMatters: 'range restriction FLATTENS an AUC; it cannot manufacture an inversion.' },
    { id: 'PROP-PRAW-DENOMINATOR-2026-09-07',
      earlierResultInvalidated: 'the published p_raw for hr and h1 was inflated.',
      cause: 'shrunk_rate divided by the prior alone because PLATE APPEARANCES were missing.',
      correctedResult: 'fixed on 2026-08-07.',
      currentLimitation: 'the gate caught the symptom. A suppression is not a diagnosis.' }
  ]
};

D = { backtestLab: { propEvidence: REAL } };
const p = strip(pePanel());

/* ---- 1. THE TWO CLAIMS ARE VISIBLY SEPARATE -------------------------- */
t('the panel leads with the separation',
  /SELECTION AND ORDERING ARE SEPARATE CLAIMS/.test(p));
t('every market shows a universe verdict and a rank verdict',
  (p.match(/DISCRIMINATES/g) || []).length >= 5 &&
  (p.match(/NO MEASURED DISCRIMINATION/g) || []).length >= 5);
t('a market that selects well is marked SELECTS', /SELECTS/.test(p));
t('...and the board base rate is shown against the universe base rate',
  /67\.0%/.test(p) && /universe 61\.2%/.test(p));
t('the AUC carries its interval, never a bare number',
  /0\.5520 \[0\.542, 0\.562\]/.test(p));

/* ---- 2. THE UNCOMFORTABLE HALF IS STATED, NOT COUNTED VAGUELY -------- */
t('the summary says how many markets select', /signal in 5 of 5 markets/.test(p));
t('...and how many order', /carry information in 2/.test(p));
t('...naming them rather than leaving it to the table',
  /1\+ Double and Home Run/.test(p));
t('...and says rank 1 is not stronger than rank 8 elsewhere',
  /rank 1 is not a stronger pick than rank 8/.test(p));
t('...and that no label may imply otherwise', /no label may imply/.test(p));

/* ---- 3. THE RETRACTED NUMBER IS NAMED AS ABSENT ---------------------- */
t('the panel says the p_raw board AUC is not shown',
  /deliberately not shown here/.test(p));
t('...and why', /chose nobody/.test(p));
t('no INVERTED verdict is rendered anywhere in the table',
  p.indexOf('INVERTED') === p.lastIndexOf('INVERTED') ||
  !/Board order[\s\S]*INVERTED/.test(p));

/* ---- 4. A CORRECTION HAS FOUR PARTS ---------------------------------- */
const c = strip(peCorrection(REAL.corrections[0]));
t('a correction states what was invalidated', /Earlier result invalidated/.test(c));
t('...the cause', /Cause/.test(c));
t('...the corrected result', /Corrected result/.test(c));
t('...and the current limitation', /Current limitation/.test(c));
t('...carrying its identifier', /PROP-BOARD-INVERSION-2026-09-07/.test(c));
t('both corrections are rendered', /PROP-PRAW-DENOMINATOR-2026-09-07/.test(p));
t('the suppression-is-not-a-diagnosis line survives',
  /suppression is not a diagnosis/.test(p));

/* ---- 5. THE POOL IS NAMED ON THE PAGE -------------------------------- */
t('the pool is named', /BOXSCORE_STARTERS/.test(p));
t('...and called outcome-adjacent', /outcome-adjacent/.test(p));
t('features are dated', /PREVIOUS_DAY/.test(p));

/* ---- 6. LABELS, NEVER SLUGS ------------------------------------------ */
t('h2 renders as 1+ Double', /1\+ Double/.test(p));
t('...and never as its wire slug', p.indexOf('hit_2plus') < 0);
/* The trap is specific: the 1+ DOUBLE market must never be described with
   the word "hit". "2+ Hits + Runs + RBI" is a different market and its
   label is correct, so a blanket scan for "2+ hits" would flag the wrong
   thing. Assert on the h2 label itself. */
t('...and the 1+ Double label contains no mention of hits',
  !/hit/i.test(REAL.families.h2.label.humanName));
t('...while the H+R+RBI market keeps its own legitimate wording',
  /2\+ Hits \+ Runs \+ RBI/.test(p));
t('the settlement condition is shown so the label can be checked',
  /doubles >= 1/.test(p));

/* ---- 7. AN ABSENT MEASUREMENT STILL CARRIES THE RETRACTION ----------- */
D = { backtestLab: { propEvidence: {
  available: false, reason: 'NO_PROP_UNIVERSE_ARTIFACT',
  why: 'the artifact does not exist. Absent, not zero.',
  corrections: REAL.corrections } } };
const absent = strip(pePanel());
t('a refusal names its reason', /NO PROP UNIVERSE ARTIFACT/.test(absent));
t('...and says absent is not zero', /Absent, not zero/.test(absent));
t('...and prints no AUC', absent.indexOf('0.55') < 0);
t('...and no verdict words', absent.indexOf('DISCRIMINATES') < 0);
t('...but still carries both corrections',
  /PROP-BOARD-INVERSION/.test(absent) && /PROP-PRAW-DENOMINATOR/.test(absent));
t('...and says a retraction outlives the measurement',
  /retraction survives the absence/.test(absent));

/* ---- 8. NO BLOCK RENDERS NOTHING ------------------------------------- */
D = { backtestLab: {} };
t('no prop evidence block renders nothing', pePanel() === '');
D = {};
t('...and neither does a payload with no lab', pePanel() === '');

/* ---- 9. WIRED IN, AND COMPUTING NOTHING ------------------------------ */
t('renderBacktests calls the panel', /h\+=pePanel\(\);/.test(html));
const src = grab(/function pePanel\(\)\{[\s\S]*?\n\}/, 'pePanel');
t('the panel computes no AUC of its own', !/Math\.sqrt|\bauc\s*=/.test(src));
t('...and decides no verdict of its own',
  !/'DISCRIMINATES'\s*:/.test(src.replace(/verdict\)===.DISCRIMINATES./g, '')));
t('...it reads boardAboveUniverse rather than comparing rates itself',
  /boardAboveUniverse/.test(src) &&
  !/boardBaseRate\s*>\s*universeBaseRate/.test(src));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
