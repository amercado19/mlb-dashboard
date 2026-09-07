/* MEASUREMENT MATURITY RENDER — what the CLV card is allowed to say.
 *
 * On 2026-09-07 the production ledger's verified CLV count went 15 -> 0 when
 * the capture-provenance contract tightened: all 15 rows had a
 * `close_captured_at` that was the moment `update_close` happened to run, not
 * the moment the quote was pulled. Two failures were available at that moment
 * and this file exists so neither can ship:
 *
 *   1. KEEPING THE OLD COUNT. The surface must print whatever the pipeline
 *      recomputed under the CURRENT contract, and print 0 as 0.
 *   2. RENDERING THE ZERO AS AN OUTAGE. A working producer with no verified
 *      rows yet is a young measurement, not a broken machine. Colouring it
 *      red is the same lie as the inflated count, pointed the other way.
 *
 * The helpers are eval'd out of the shipped file so this tests shipped code.
 */
const fs = require('fs'), path = require('path'), assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, '..', 'current.html'), 'utf8');

function grab(re, what) {
  const m = html.match(re);
  assert(m, what + ' not found in current.html');
  return m[0];
}
eval(grab(/var SH_ABSENT=[\s\S]*?;\n/, 'SH_ABSENT'));
eval(grab(/var SH_AX_TONE=\{[\s\S]*?\n\};/, 'SH_AX_TONE'));
eval(grab(/function esc\(s\)\{[\s\S]*?\n\}/, 'esc'));
eval(grab(/function isNum\(v\)\{[\s\S]*?\n\}/, 'isNum'));
eval(grab(/function shKv\(k,v\)\{[\s\S]*?\n\}/, 'shKv'));
eval(grab(/function shNum\(v,unit\)\{[\s\S]*?\n\}/, 'shNum'));
eval(grab(/function shAxis\(label,val,tip\)\{[\s\S]*?\n\}/, 'shAxis'));
eval(grab(/function shDetails\(inner,label\)\{[\s\S]*?\n\}/, 'shDetails'));
eval(grab(/function shClauseRows\(byClause\)\{[\s\S]*?\n\}/, 'shClauseRows'));
eval(grab(/function shClvMaturity\(d\)\{[\s\S]*?\n\}/, 'shClvMaturity'));

let pass = 0, fail = 0;
const t = (name, cond) => {
  try { assert(cond); console.log('  [PASS] ' + name); pass++; }
  catch (e) { console.log('  [FAIL] ' + name); fail++; }
};

/* The exact shape learn/clv_contract.maturity() publishes for production
   today: 15 rows reclassified, nothing verified, producer working. */
const ZERO = {
  eraStart: '2026-09-06T04:33:41Z',
  eraNote: 'the era start is IMMUTABLE. It records when the forward measurement '
    + 'contract began. Individual rows inside it were later found invalid, which '
    + 'is a fact about the rows, not about the era, and moving the start would '
    + 'rewrite history to flatter a count.',
  validForwardClvN: 0,
  recomputedNote: 'recomputed from rows that satisfy the CURRENT contract. Never '
    + 'carried forward from an earlier count, and reported as 0 when it is 0.',
  rowsExcludedAsSyntheticCapture: 15,
  measurementMaturity: 'NOT_ENOUGH_VERIFIED_DATA',
  operationalHealthIsSeparate: 'measurement maturity says how much trustworthy '
    + 'evidence exists. It says NOTHING about whether the capture producer is '
    + 'working right now, which is the operational axis and is judged elsewhere.',
  producerCapturing: true,
  userFacing: {
    headline: 'CLV MEASUREMENT — NOT ENOUGH VERIFIED DATA',
    verifiedForwardRows: 0,
    reason: 'historical close timestamps did not preserve the original quote '
      + 'capture time, so those rows cannot verify a closing line. Forward '
      + 'capture is active and new rows carry the feed’s own timestamp.',
    forwardCapture: 'ACTIVE'
  },
  excludedByContractClause: {
    OTHER: { count: 2339, codes: ['NOT_SETTLED'] },
    MISSING_OPEN_PROVENANCE: { count: 1085, codes: ['NO_OPEN', 'OPEN_PROVENANCE_UNKNOWN'] },
    SNAPSHOT_TIMESTAMP_MISSING: { count: 15, codes: ['CLOSE_CAPTURE_TIME_SYNTHETIC'] },
    MISSING_CLOSE_PROVENANCE: { count: 2, codes: ['NO_CLOSE'] }
  }
};
const zero = shClvMaturity({ maturity: ZERO });

/* ---- 1. THE COUNT IS THE RECOMPUTED ONE, AND 0 PRINTS AS 0 ------------- */
t('the zero is rendered, not skipped', /<b>0<\/b>/.test(zero));
t('...and is labelled as recomputed under the current contract',
  /recomputed under the current contract/.test(zero));
t('the old inflated count 15 never appears as a verified count',
  !/<b>15<\/b>\s*<span class="sshage">recomputed/.test(zero));
t('the 15 appear only as EXCLUDED rows', /Excluded as synthetic capture/.test(zero));
t('...described as classified rather than repaired',
  /classified, never rewritten/.test(zero));

/* ---- 2. ZERO IS NOT AN OUTAGE ----------------------------------------- */
t('the headline says NOT ENOUGH VERIFIED DATA', /NOT ENOUGH VERIFIED DATA/.test(zero));
t('the headline does not say FAILED or BROKEN', !/FAIL|BROKEN|OUTAGE/i.test(zero));
t('NOT_ENOUGH_VERIFIED_DATA is muted, never the bad tone',
  SH_AX_TONE.NOT_ENOUGH_VERIFIED_DATA === 'a-unk');
t('...and is explicitly mapped, not left to a default',
  Object.prototype.hasOwnProperty.call(SH_AX_TONE, 'NOT_ENOUGH_VERIFIED_DATA'));
t('a working producer still reads ACTIVE', /ACTIVE/.test(zero));
t('...on the OK tone, independent of the evidence count',
  SH_AX_TONE.ACTIVE === 'a-ok');
t('the two axes are stated to be separate',
  /says NOTHING about whether the capture producer/.test(zero));
t('the reason blames the historical stamp, not the producer',
  /cannot verify a closing line/.test(zero));

/* ---- 3. THE ERA IS SHOWN AS IMMUTABLE --------------------------------- */
t('the era start is printed', /2026-09-06T04:33:41Z/.test(zero));
t('...and marked immutable', /immutable/.test(zero));
t('...with the reason it may not move', /rewrite history to flatter a count/.test(zero));

/* ---- 4. THE REFUSAL HISTOGRAM READS IN ONE VOCABULARY ------------------ */
t('clause rows are rendered', /snapshot timestamp missing/.test(zero));
t('...naming the underlying producer code', /CLOSE_CAPTURE_TIME_SYNTHETIC/.test(zero));
t('every clause in the payload is shown',
  Object.keys(ZERO.excludedByContractClause)
    .every(k => zero.indexOf(esc(k.replace(/_/g, ' ').toLowerCase())) >= 0));

/* ---- 5. THE POSITIVE CONTROL ------------------------------------------ */
/* A surface that renders zero beautifully but cannot render a real count is
   not honest, it is just stuck. */
const five = shClvMaturity({
  maturity: Object.assign({}, ZERO, {
    validForwardClvN: 5, measurementMaturity: 'EARLY_SAMPLE',
    rowsExcludedAsSyntheticCapture: 0,
    userFacing: { headline: 'CLV MEASUREMENT', verifiedForwardRows: 5,
      reason: 'no verified forward rows yet.', forwardCapture: 'ACTIVE' }
  })
});
t('a real count renders', /<b>5<\/b>/.test(five));
t('...as an EARLY SAMPLE', /EARLY SAMPLE/.test(five));
t('...and drops the exclusion row when nothing was excluded',
  !/Excluded as synthetic capture/.test(five));
t('EARLY_SAMPLE is the warn tone, not the ok tone',
  SH_AX_TONE.EARLY_SAMPLE === 'a-warn');
t('MEASURED is the ok tone', SH_AX_TONE.MEASURED === 'a-ok');

/* ---- 6. ABSENCE IS NOT ZERO, AND IS NEVER DERIVED HERE ---------------- */
t('a payload with no maturity block renders nothing at all',
  shClvMaturity({}) === '' && shClvMaturity(null) === '');
const unk = shClvMaturity({ maturity: {
  measurementMaturity: 'UNKNOWN', why: 'clv_contract.maturity unavailable' } });
t('an UNKNOWN maturity says the pipeline could not compute it',
  /could not compute it/.test(unk));
t('...and refuses to derive it on the surface', /NOT derived here/.test(unk));
t('...printing no count of any kind', !/<b>0<\/b>/.test(unk));
const nonum = shClvMaturity({ maturity: Object.assign({}, ZERO,
  { validForwardClvN: null }) });
t('an absent count reads "not reported", never 0', /not reported/.test(nonum));

/* ---- 7. THE CARD ACTUALLY CALLS IT ------------------------------------ */
t('shClvCard2 renders the maturity block', /extra:shClvMaturity\(d\)/.test(html));
t('the maturity block comes FIRST in the card',
  html.indexOf('extra:shClvMaturity(d)+cur') >= 0);

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
