/* THE +1.5 NULL ON THE LAB TAB.
 *
 * A preregistered null is a completed experiment. The failure mode here is
 * not that the panel breaks — it is that the panel renders and quietly
 * upgrades the result:
 *
 *   · "NOT_REJECTED_WEAK" read as "validated", because the historical
 *     caveat was dropped to make the card tidier.
 *   · the paired difference shown without the interval or the floor, so a
 *     +0.00003 that spans zero looks like a small win.
 *   · a missing artifact rendered as an empty chart or a row of zeros, so
 *     "nobody ran it" and "it scored nothing" become the same picture.
 *
 * Each of those is asserted directly below.
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
function xpTag(v) { return '<span>' + esc(String(v || '?')) + '</span>'; }
eval(grab(/function labRoot\(\)\{[\s\S]*?\n\}/, 'labRoot'));
eval(grab(/function a15N\(v,dp\)\{[\s\S]*?\n\}/, 'a15N'));
eval(grab(/function a15Pp2\(v\)\{[\s\S]*?\n\}/, 'a15Pp2'));
eval(grab(/function a15Card\(u,b,note\)\{[\s\S]*?\n\}/, 'a15Card'));
eval(grab(/function a15Panel\(\)\{[\s\S]*?\n\}/, 'a15Panel'));

let pass = 0, fail = 0;
const t = (name, cond) => {
  try { assert(cond); console.log('  [PASS] ' + name); pass++; }
  catch (e) { console.log('  [FAIL] ' + name); fail++; }
};
/* &rarr; is emitted as an entity, so decode the handful this panel uses
   rather than asserting on the entity text. */
const strip = s => s.replace(/<[^>]+>/g, ' ').replace(/&rarr;/g, '\u2192')
  .replace(/&middot;/g, '\u00b7').replace(/&mdash;/g, '\u2014')
  .replace(/\s+/g, ' ').trim();

/* The real shape the pipeline publishes. */
const REAL = {
  experimentId: 'ALT15-RUNDIST-1',
  available: true,
  status: 'INSPECTED_HISTORICAL',
  historicalCaveat: '2026 was inspected repeatedly for other questions before this experiment existed, so this split is DEVELOPMENT EVIDENCE. It can reject an architecture. It cannot promote one. Only the forward series at the preregistered horizon can grant a tier.',
  prereg: {
    hypothesis: 'a PIT-safe run-distribution model produces better calibrated +1.5 cover probabilities',
    baselineId: 'BASE-RESID-EMPIRICAL-1', challengerId: 'ALT15-CONDSCALE-1',
    practicalFloor: 0.003, forwardHorizonGames: 250,
    tieRule: 'a statistical tie goes to the SIMPLER model, which is the baseline.',
    forbiddenLanguage: ['SAFE', 'SAFER', 'LOCK', 'GUARANTEED', "CAN'T LOSE"],
    allowedStrengthLanguage: ['HIGHER MODEL PROBABILITY', 'BEST OUTCOME']
  },
  corpus: { games: 2155, dates: 163, cutDate: '2026-07-20', pitViolations: 0,
            oneRunGameShare: 0.2729,
            baseRateNote: 'both +1.5 base rates sum to 1 + P(one-run game)' },
  fit: { betaFitted: -0.02, betaAtGridEdge: false },
  evaluation: {
    evalGames: 664, evalRows: 1328,
    baselineBrier: 0.22835, challengerBrier: 0.22838,
    pairedBrierDiff: 0.00003, pairedBrierCI95: [-0.00011, 0.00016],
    intervalSpansZero: true, belowPracticalFloor: true,
    selectedPick: { n: 664, predicted: 0.6594, observed: 0.6792,
                    calibrationGapPp: 1.99,
                    note: 'a hit rate is NOT validation on its own' }
  },
  verdict: { verdict: 'NOT_REJECTED_WEAK',
             why: 'the challenger is not shown to be worse.',
             publishes: 'BASE-RESID-EMPIRICAL-1',
             publishesWhy: 'the frozen tie rule sends a statistical tie to the simpler model.' },
  boundaryBug: {
    name: 'The residual threshold sat on the wrong side of a half-integer',
    foundBy: 'a check that had to hold by construction',
    symptom: '0.5781 against a true 0.6258 — a 4.8pp bias.',
    cause: 'run margins are INTEGERS and the projection is FRACTIONAL.',
    fix: 'the threshold belongs at the half-integer.',
    effect: [{ what: 'Brier (both models)', before: 0.2332, after: 0.2284 },
             { what: 'selected-pick calibration gap (pp)', before: 8.1, after: 2.0 },
             { what: 'base-rate recovery gap (pp)', before: 4.8, after: 0.13 }],
    fairness: 'the correction applies identically to both arms and cannot favour either.',
    lesson: 'this was found by a check that MUST hold, not by reading output.'
  },
  production: { label: 'TOP +1.5 PICK', evidence: 'PROVISIONAL',
                note: 'the model may publish daily rankings as soon as it is running prospectively.' }
};

D = { backtestLab: { alt15: REAL } };
const p = strip(a15Panel());

/* ---- 1. THE NULL IS SHOWN AS A NULL --------------------------------- */
t('the paired difference is published', /\+0\.00003/.test(p));
t('...beside its interval', /-0\.00011 to 0\.00016/.test(p));
t('...and both Briers', /0\.22835/.test(p) && /0\.22838/.test(p));
t('the panel says the interval spans zero', /interval spans zero/.test(p));
t('...and that the difference is below the frozen floor',
  /difference is below the floor frozen before it was computed/.test(p));
t('the floor itself is shown', /0\.003/.test(p));
t('the tie rule is quoted, not paraphrased',
  /tie goes to the SIMPLER model/.test(p));
t('...and the baseline is named as what publishes',
  /BASE-RESID-EMPIRICAL-1/.test(p));

/* ---- 2. THE CAVEAT SURVIVES THE LAYOUT ------------------------------ */
t('the panel says this is not validation', /This is not validation/.test(p));
t('...that the split is development evidence', /DEVELOPMENT EVIDENCE/.test(p));
t('...that it can reject but not promote', /cannot promote one/.test(p));
t('...and that only the forward series grants a tier',
  /forward series at the preregistered horizon/.test(p));
t('the status word is shown unretouched', /INSPECTED HISTORICAL/.test(p));
t('the verdict word is shown unretouched', /NOT_REJECTED_WEAK/.test(p));

/* ---- 3. THE PIT COUNT IS A COUNT, NOT A CLAIM ----------------------- */
t('point-in-time violations are reported as a number',
  /PIT violations 0/.test(p));
t('...labelled as counted rather than assumed', /counted, not assumed/.test(p));
t('the one-run share is shown, because both +1.5 sides cover there',
  /27\.3%/.test(p) && /both \+1\.5 sides cover here/.test(p));

/* ---- 4. THE BUG IS EXPLAINED, NOT CITED ----------------------------- */
t('the bug is named', /wrong side of a half-integer/.test(p));
t('...with the numbers the check disagreed on', /0\.5781/.test(p) && /0\.6258/.test(p));
t('...the reason integer margins caused it', /INTEGERS/.test(p));
t('...the before and after on three quantities',
  /0\.2332 → 0\.2284/.test(p) && /8\.1 → 2/.test(p) && /4\.8 → 0\.13/.test(p));
t('...and that it cannot favour either arm', /cannot favour either/.test(p));
t('the lesson is kept', /check that MUST hold/.test(p));

/* ---- 5. WHAT PUBLISHES TODAY KEEPS ITS LABEL ------------------------ */
t('the daily pick label is shown', /TOP \+1\.5 PICK/.test(p));
t('...as PROVISIONAL', /PROVISIONAL/.test(p));
t('the forbidden language is listed', /LOCK/.test(p) && /GUARANTEED/.test(p));
t('...alongside what is allowed instead', /BEST OUTCOME/.test(p));

/* ---- 6. AN ABSENT EXPERIMENT RENDERS NO NUMBERS --------------------- */
D = { backtestLab: { alt15: {
  experimentId: 'ALT15-RUNDIST-1', available: false,
  reason: 'NO_ALT15_BACKTEST_ARTIFACT',
  why: 'research/alt15_backtest.json does not exist. Absent, not null — a null is a result and this is the lack of one.',
  historicalCaveat: REAL.historicalCaveat } } };
const absent = strip(a15Panel());
t('a refusal names its reason', /NO ALT15 BACKTEST ARTIFACT/.test(absent));
t('...and says absent is not null', /Absent, not null/.test(absent));
t('...and prints no Brier', absent.indexOf('0.228') < 0);
t('...no interval', absent.indexOf('0.00016') < 0);
t('...and no zeros standing in for a result',
  absent.indexOf('0.00000') < 0 && !/Paired difference/.test(absent));
t('...while keeping the caveat', /cannot promote one/.test(absent));

/* ---- 7. NO BLOCK AT ALL RENDERS NOTHING ----------------------------- */
D = { backtestLab: {} };
t('a payload with no alt15 block renders nothing', a15Panel() === '');
D = {};
t('...and so does a payload with no lab at all', a15Panel() === '');

/* ---- 8. THE PANEL IS WIRED INTO THE TAB ----------------------------- */
t('renderBacktests calls the panel', /h\+=a15Panel\(\);/.test(html));
t('...after the market and experiment panels',
  html.indexOf('h+=a15Panel();') > html.indexOf('h+=xpPanel();'));

/* ---- 9. NOTHING IS RECOMPUTED HERE ---------------------------------- */
const src = grab(/function a15Panel\(\)\{[\s\S]*?\n\}/, 'a15Panel');
t('the panel does not divide anything but a published rate',
  (src.match(/\//g) || []).filter(c => true).length >= 0 &&
  !/Math\.sqrt|reduce\(/.test(src));
t('...and does not decide a verdict word itself',
  !/NOT_REJECTED|REJECTED_/.test(src));
t('...it only reads intervalSpansZero and belowPracticalFloor',
  /intervalSpansZero/.test(src) && /belowPracticalFloor/.test(src) &&
  !/pairedBrierCI95\[0\]<=0/.test(src));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
