/* PARLAY MATH — what a combined number is allowed to claim.
 *
 * Three renderers printed a combined price and a percentage, and all three
 * said something they could not support:
 *
 *   tpRecalc      multiplied the odds the USER typed, then printed
 *                 "X% to hit" — which reads as the model's probability.
 *   buildCustom   multiplied the MODEL's fair leg prices and used the same
 *                 words, so the two were indistinguishable.
 *   hpCardHtml    used the BOOK price where a leg had one and the model's
 *                 fair price where it did not, then labelled the result
 *                 "model-fair".
 *
 * The first pass attributed each percentage to whatever produced it. This
 * pass removes the last invented input: all three also multiplied same-game
 * legs through a flat 0.62 factor that was never fitted against a settled
 * parlay. Naming an invented number does not make the price built from it
 * true, so the factor is gone and nothing replaced it as a factor. What the
 * surface publishes instead is the independent product — arithmetic, not a
 * model — plus the statement that for dependent legs the combined figure is
 * NOT MEASURED.
 *
 * The dependence classifier here mirrors the pipeline's: only mathematically
 * true implications are encoded, and a pair it cannot cover is reported as
 * dependent-unmeasured, never as independent.
 */
const fs = require('fs'), path = require('path'), assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, '..', 'current.html'), 'utf8');

function grab(re, what) {
  const m = html.match(re);
  assert(m, what + ' not found in current.html');
  return m[0];
}
eval(grab(/var PL_INDEP=[\s\S]*?;\n/, 'PL_* relationship constants'));
eval(grab(/var PL_ALIAS=\{[\s\S]*?\n[^\n]*?\};\n/, 'PL_ALIAS'));
eval(grab(/function plType\([\s\S]*?\n\}/, 'plType'));
eval(grab(/function plWho\([\s\S]*?\n\}/, 'plWho'));
eval(grab(/var PL_IMPLIES=\{[\s\S]*?\};\n/, 'PL_IMPLIES'));
eval(grab(/function plPairRel\(a,b\)\{[\s\S]*?\n\}/, 'plPairRel'));
eval(grab(/function parlayDependence\(legs\)\{[\s\S]*?\n\}/, 'parlayDependence'));
eval(grab(/var PARLAY_SOURCE=\{[\s\S]*?\n\};/, 'PARLAY_SOURCE'));
eval(grab(/function amDec\([\s\S]*?\n\}/, 'amDec'));
eval(grab(/function decToAm\([\s\S]*?\n\}/, 'decToAm'));
eval(grab(/function parlayDepNote\(dep\)\{[\s\S]*?\n\}/, 'parlayDepNote'));
eval(grab(/function parlayPayoutHtml\(dec,dep,kind\)\{[\s\S]*?\n\}/, 'parlayPayoutHtml'));
eval(grab(/function tpPayoutHtml\(dec,dep\)\{[\s\S]*?\n\}/, 'tpPayoutHtml'));

let pass = 0, fail = 0;
const t = (name, cond) => {
  try { assert(cond); console.log('  [PASS] ' + name); pass++; }
  catch (e) { console.log('  [FAIL] ' + name); fail++; }
};
const strip = s => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const L = (o) => Object.assign({ gamePk: 1 }, o);

/* ---- 1. ONLY MATHEMATICALLY TRUE IMPLICATIONS ARE NESTED ------------ */
const nested = [
  ['ML contains the same team\'s +1.5', { betType: 'ml', team: 'KC' }, { betType: 'plus15', team: 'KC' }],
  ['−1.5 contains the moneyline', { betType: 'minus15', team: 'KC' }, { betType: 'ml', team: 'KC' }],
  ['−1.5 contains +1.5', { betType: 'minus15', team: 'KC' }, { betType: 'plus15', team: 'KC' }],
  ['a home run contains a hit', { betType: 'hr', playerId: 9 }, { betType: 'hit', playerId: 9 }],
  ['a home run contains 2+ total bases', { betType: 'hr', playerId: 9 }, { betType: '2tb', playerId: 9 }],
  ['a double contains a hit', { betType: 'h2', playerId: 9 }, { betType: 'hit', playerId: 9 }],
  ['a double contains 2+ total bases', { betType: 'h2', playerId: 9 }, { betType: '2tb', playerId: 9 }],
];
nested.forEach(([name, a, b]) => {
  t(name, plPairRel(L(a), L(b)).rel === PL_NESTED);
  t('...and the implication is symmetric: ' + name,
    plPairRel(L(b), L(a)).rel === PL_NESTED);
});

/* ---- 2. WHAT IS NOT NESTED STAYS DEPENDENT, NOT INDEPENDENT --------- */
t('a double does not contain 2+ hits/runs/RBI — that needs a threshold',
  plPairRel(L({ betType: 'h2', playerId: 9 }), L({ betType: 'hrr', playerId: 9 })).rel === PL_DEP);
t('a home run and an HRR threshold nobody published is dependent, not nested',
  plPairRel(L({ betType: 'hr', playerId: 9 }), L({ betType: 'hrr', playerId: 9 })).rel === PL_DEP);
t('two different players in one game are dependent, not independent',
  plPairRel(L({ betType: 'hr', playerId: 9 }), L({ betType: 'hit', playerId: 4 })).rel === PL_DEP);
t('a team leg and a player leg in one game are dependent',
  plPairRel(L({ betType: 'ml', team: 'KC' }), L({ betType: 'hit', playerId: 4 })).rel === PL_DEP);
t('+1.5 on one team and +1.5 on the other is NOT nested — both cover a one-run game',
  plPairRel(L({ betType: 'plus15', team: 'KC' }), L({ betType: 'plus15', team: 'BOS' })).rel === PL_DEP);

/* ---- 3. DIFFERENT GAMES ARE THE ONLY LICENSED CASE ------------------ */
t('different games are independent',
  plPairRel(L({ betType: 'hr', playerId: 9 }), { gamePk: 2, betType: 'hr', playerId: 4 }).rel === PL_INDEP);
t('an untyped leg infers nothing and is never called independent',
  plPairRel(L({ betType: 'mystery' }), { gamePk: 2, betType: 'hr', playerId: 4 }).rel === PL_DEP);
t('a leg with no game infers nothing either',
  plPairRel({ betType: 'hr', playerId: 9 }, { gamePk: 2, betType: 'hr', playerId: 4 }).rel === PL_DEP);

/* ---- 4. IMPOSSIBLE PAIRS ARE NAMED AS IMPOSSIBLE, NOT DEPENDENT ----- */
t('both sides of one moneyline cannot both win',
  plPairRel(L({ betType: 'ml', team: 'KC' }), L({ betType: 'ml', team: 'BOS' })).rel === PL_EXCL);
t('OVER and UNDER on one total cannot both win',
  plPairRel(L({ betType: 'over' }), L({ betType: 'under' })).rel === PL_EXCL);
t('NRFI and YRFI cannot both win',
  plPairRel(L({ betType: 'nrfi' }), L({ betType: 'yrfi' })).rel === PL_EXCL);
t('the same selection written twice is refused',
  plPairRel(L({ betType: 'hit', playerId: 9 }), L({ betType: 'hit', playerId: 9 })).rel === PL_EXCL);

/* ---- 5. THE TICKET-LEVEL VERDICT ------------------------------------ */
const across = [{ gamePk: 1, betType: 'ml', team: 'KC' },
                { gamePk: 2, betType: 'hr', playerId: 9 },
                { gamePk: 3, betType: 'hit', playerId: 4 }];
const nest = [{ gamePk: 1, betType: 'ml', team: 'KC' },
              { gamePk: 1, betType: 'plus15', team: 'KC' }];
const sg = [{ gamePk: 1, betType: 'ml', team: 'KC' },
            { gamePk: 1, betType: 'hit', playerId: 4 }];
t('a fully cross-game ticket is licensed', parlayDependence(across).licensed === true);
t('a nested ticket is not', parlayDependence(nest).licensed === false);
t('...and the nested pair is reported as nested', parlayDependence(nest).nested.length === 1);
t('a same-game ticket is not licensed either', parlayDependence(sg).licensed === false);
t('...and is reported as dependent, not nested',
  parlayDependence(sg).dependent.length === 1 && parlayDependence(sg).nested.length === 0);
t('a single leg is never called licensed', parlayDependence([{ gamePk: 1, betType: 'ml', team: 'KC' }]).licensed === false);
t('an empty slip is never called licensed', parlayDependence([]).licensed === false);

/* ---- 6. WHAT EACH RENDERED LINE CLAIMS ------------------------------ */
const price = strip(tpPayoutHtml(6.0, parlayDependence(across)));
const model = strip(parlayPayoutHtml(4.2, parlayDependence(sg), 'MODEL'));
const mixed = strip(parlayPayoutHtml(9.0, parlayDependence(nest), 'MIXED'));

t('a licensed ticket may state its percentage',
  /16\.7% is what THIS PRICE implies/.test(price));
t('...attributed to the price, not the model',
  /not the model's number/.test(price));
t('...and says why multiplying was allowed',
  /No two legs share a game/.test(price));
t('a dependent ticket states NOT MEASURED instead of a percentage',
  /Combined hit chance: NOT MEASURED/.test(model));
t('...and names the blocking pair', /legs 1 and 2 are dependent/.test(model));
t('...and refuses to invent a coefficient',
  /No dependence coefficient is fitted/.test(model));
t('...while saying the ticket is still bettable',
  /ticket is still bettable/.test(model));
t('a nested ticket says which legs nest',
  /leg 1 and leg 2 are nested/.test(mixed));
t('...quoting the mathematical reason',
  /winning the game means losing by no more than one/.test(mixed));
t('...and calls a nested pair one unit of risk priced as two',
  /one unit of risk priced as two/.test(mixed));

/* ---- 7. THE UNLICENSED PRICE IS LABELLED AS ARITHMETIC -------------- */
t('a dependent ticket does not print "Combined" as if it were a quote',
  model.indexOf('Combined +320') < 0 && /Independent-product/.test(model));
t('...and says the legs are not independent', /They are not/.test(model));
t('an only-nested ticket may call the product an upper bound',
  /UPPER BOUND/.test(mixed));
t('...but a ticket with unmeasured dependence may not',
  model.indexOf('UPPER BOUND') < 0 &&
  /Whether the true price is longer or shorter than this is not measured/.test(model));

/* ---- 8. THE 0.62 IS GONE FROM THE MATH, NOT RENAMED ----------------- */
t('no same-game factor constant survives', !/SGP_ASSUMED/.test(html));
t('no renderer multiplies through a factor',
  !/\(1\+\(gd-1\)\*/.test(html) && !/d=1\+\(d-1\)\*/.test(html));
t('no rendered line mentions 0.62',
  [price, model, mixed].every(s => s.indexOf('0.62') < 0));
t('no rendered line says "% to hit"',
  [price, model, mixed].every(s => s.indexOf('% to hit') < 0));
t('no rendered line says "correlation discount"',
  [price, model, mixed].every(s => s.indexOf('correlation discount') < 0));
t('no renderer still calls a mixed number "model-fair"',
  mixed.indexOf('model-fair') < 0);
t('all renderers go through one payout builder',
  (html.match(/parlayPayoutHtml\(/g) || []).length >= 4);

/* ---- 9. THE MONEY IS STILL RIGHT ------------------------------------ */
t('a $10 stake at 6.0 decimal returns $60', /\$10→\$60/.test(price));
t('...and $100 returns $600', /\$100→\$600/.test(price));
t('the combined American price is shown', /Combined \+500/.test(price));
t('the three source sentences remain three different sentences',
  new Set([PARLAY_SOURCE.PRICE, PARLAY_SOURCE.MODEL, PARLAY_SOURCE.MIXED]).size === 3);
t('the MODEL sentence no longer claims dependence was handled',
  /no two legs here share a game/.test(PARLAY_SOURCE.MODEL));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
