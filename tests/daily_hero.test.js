/* DAILY HERO — what the top of the page is allowed to claim.
 *
 * The Hero is the most-read surface on the product, so it is the surface
 * where an invented number would do the most damage. One rule governs it:
 *
 *   EVERY NUMBER ON A HERO CARD IS A NUMBER THE PAYLOAD ALREADY PUBLISHES,
 *   WEARING THE LABEL THE PAYLOAD ALREADY GAVE IT.
 *
 * Nothing here computes a probability, upgrades a label, or invents a
 * category so the row of cards looks even. Today three of the eight markets
 * are legitimately empty; those cards stay, in plain English, because a
 * category that silently disappears reads as "there was nothing worth
 * showing", which is a different claim from "the board was empty".
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
eval(grab(/var TEAMS=\{[\s\S]*?\};/, 'TEAMS'));
eval('var IDBYABBR={}; for (var k in TEAMS) IDBYABBR[TEAMS[k][0]]=k;');
eval(grab(/function etStamp\([\s\S]*?\n\}/, 'etStamp'));
eval(grab(/function tms\([\s\S]*?\n\}/, 'tms'));
eval(grab(/function fmtTime\([\s\S]*?\n\}/, 'fmtTime'));
eval(grab(/function legDesc\([\s\S]*?\n\}/, 'legDesc'));
/* Direct eval keeps these in module scope, where the helpers above already
   live. An indirect eval would put them in global scope and they would no
   longer see esc/pill/isNum. */
eval(grab(/function hInit\(n\)\{[\s\S]*?\n\}/, 'hInit'));
eval(grab(/function hFace\(pid,name\)\{[\s\S]*?\n\}/, 'hFace'));
eval(grab(/function hTeam\(ab\)\{[\s\S]*?\n\}/, 'hTeam'));
eval(grab(/function hCard\(cat,subject,num,chips,why,extra\)\{[\s\S]*?\n\}/, 'hCard'));
eval(grab(/function hNone\(cat,why,state\)\{[\s\S]*?\n\}/, 'hNone'));
eval(grab(/var BOARD_NAME=\{[\s\S]*?\};/, 'BOARD_NAME'));
eval(grab(/function boardMarket\(k\)\{[\s\S]*?\n\}/, 'boardMarket'));
eval(grab(/function boardDiag\(k\)\{[\s\S]*?\n\}/, 'boardDiag'));
eval(grab(/function boardRetired\(k\)\{[\s\S]*?\n\}/, 'boardRetired'));
eval(grab(/function boardWhyText\(k\)\{[\s\S]*?\n\}/, 'boardWhyText'));
eval(grab(/function boardState\(k\)\{[\s\S]*?\n\}/, 'boardState'));
eval(grab(/function hPropChip\(row\)\{[\s\S]*?\n\}/, 'hPropChip'));
eval(grab(/function hProp\(cat,fam,label\)\{[\s\S]*?\n\}/, 'hProp'));
eval(grab(/function mpBandRow\(l\)\{[\s\S]*?\n\}/, 'mpBandRow'));
eval(grab(/function mpPct\(v\)\{[\s\S]*?\n\}/, 'mpPct'));
eval(grab(/function mlSideProb\(m,team\)\{[\s\S]*?\n\}/, 'mlSideProb'));
eval(grab(/function mlBand\(gamePk\)\{[\s\S]*?\n\}/, 'mlBand'));
eval(grab(/function hMoneyline\(\)\{[\s\S]*?\n\}/, 'hMoneyline'));
eval(grab(/function hPlus15\(\)\{[\s\S]*?\n\}/, 'hPlus15'));
eval(grab(/function hHomeRun\(\)\{[\s\S]*?\n\}/, 'hHomeRun'));
eval(grab(/function hLegShort\(l\)\{[\s\S]*?\n\}/, 'hLegShort'));
eval(grab(/function mpLegShort\(l\)\{[\s\S]*?\n\}/, 'mpLegShort'));
eval(grab(/function hModelParlay\(\)\{[\s\S]*?\n\}/, 'hModelParlay'));
eval(grab(/function hParlay\(\)\{[\s\S]*?\n\}/, 'hParlay'));
/* dailyHero now isolates each tile, so the tile wrapper and the diagnostic
   sink it calls have to come across with it. Stubbing renderDiag here would
   hide a throw; this records it so the assertions below can see one. */
const RENDER_DIAGNOSTICS = [];
function renderDiag(code, err, ctx) {
  RENDER_DIAGNOSTICS.push({ code: code, message: (err && err.message) || String(err), ctx: ctx });
}
eval(grab(/function hTileSafe\(code, build\)\{[\s\S]*?\n\}/, 'hTileSafe'));
eval(grab(/function dailyHero\(\)\{[\s\S]*?\n\}/, 'dailyHero'));

let pass = 0, fail = 0;
const t = (name, cond) => {
  try { assert(cond); console.log('  [PASS] ' + name); pass++; }
  catch (e) { console.log('  [FAIL] ' + name); fail++; }
};
const strip = s => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

/* The shape production actually publishes: prop probabilities suppressed
   (their calibration is UNVERIFIED), HR unpriced, two boards empty. */
const BASE = {
  generatedAt: '2026-09-07T18:17:29Z',
  gameCards: [{ gamePk: 1, game: 'AZ@KC', projectedWinner: 'KC',
                home_sp: { team: 'KC' }, away_sp: { team: 'AZ' } }],
  // Shaped like a production ml row. `conf` is the rule score the tier is
  // cut on; the win probability is a different number entirely, and it is
  // the one the calibration bands were measured on.
  ml: [{ gamePk: 1, tier: 'LEAN', conf: 68.0, edge: 8.3, pickSide: 'home',
         home: 'KC', away: 'AZ', projectedWinner: 'KC',
         homeWinProb: 0.8718, awayWinProb: 0.1282, winProb: 0.8718 },
       { gamePk: 2, tier: 'PASS', conf: 67.7, edge: 1.9, pickSide: 'home',
         home: 'SD', away: 'WSH', projectedWinner: 'SD',
         homeWinProb: 0.8908, awayWinProb: 0.1092, winProb: 0.8908 }],
  predictions: [{ gamePk: 1, decision: { modelConfidence: {
      tier: 'LOW_MODEL', winProbability: 0.8718, measuredBand: null,
      why: 'no measured band covers this probability, so nothing supports a confidence claim about it' } } }],
  boards: {
    h1: [{ playerId: 11, name: 'Bobby Witt Jr.', team: 'KC', metric: 82,
           order: 2, model_prob: null, p_raw: 0.7989 }],
    h2: [], tb2: [],
    hrr: [{ playerId: 12, name: 'Leo Bernal', team: 'STL', metric: 3.17,
            order: 5, model_prob: null }]
  },
  hrProps: [{ playerId: 13, name: 'Carter Jensen', team: 'KC', score: 66,
              tier: 'AVD', model_prob: null, note: 'NO_ODDS', iso: 0.21,
              hr: 22, park: 'Kauffman Stadium', wind: '9 mph cross', temp: '89' }],
  topParlay: {
    parlayValid: true, legCount: 2,
    legs: [{ desc: 'TOR ML — favorite by run proj 4.8-3.7 (~62%)', betType: 'ml' },
           { desc: 'STL@SF OVER 7.5 (proj 9.1)', betType: 'over' }],
    combined: { americanOdds: '+178', hitPct: 37.3, probMethod: 'independent',
                correlationNote: 'Every pair of legs is in a different game.' }
  }
};
global.D = JSON.parse(JSON.stringify(BASE));
const hero = dailyHero();
const heroTxt = strip(hero);

/* ---- 1. EVERY CATEGORY IS PRESENT, EVEN WHEN EMPTY ------------------- */
/* Nine now: the parlay slot split into the two products, because a model
   combination and a book-priced ticket are different recommendations and
   collapsing them into one tile would make the reader guess which they are
   looking at. */
t('all nine categories render', (hero.match(/class="hcard"/g) || []).length === 9);
['Best moneyline', 'Best +1.5', 'Best 1+ hit', 'Best 1+ double',
 'Best 2+ total bases', 'Best H+R+RBI', 'Top home run',
 'Best model parlay', 'Best priced parlay']
  .forEach(c => t('"' + c + '" has a card', heroTxt.indexOf(c) >= 0));
t('the model parlay leads the priced one',
  heroTxt.indexOf('Best model parlay') < heroTxt.indexOf('Best priced parlay'));
t('an empty board still gets a card, not a gap',
  (hero.match(/class="hnone"/g) || []).length === 4);
/* The old sentence here was "No eligible pick on today's slate for this
   market", printed for every silence alike. Two of the four empty cards on
   this fixture are RETIRED MARKETS, and one sentence about today's slate was
   wrong about both. The card now says which silence it is. */
t('...and the empty card says which silence it is',
  /MARKET RETIRED|NOTHING TO RANK|NO PICK TODAY|LINEUPS PENDING|UNEXPLAINED/
    .test(heroTxt));
t('...never calling a retirement a judgement about today’s slate',
  !/No eligible pick on today’s slate/.test(heroTxt));

/* ---- 2. NO NUMBER IS INVENTED ---------------------------------------- */
/* Every prop board today publishes model_prob: null because its calibration
   is UNVERIFIED. The Hero must show the ranking score, never a percentage. */
t('a suppressed prop shows its score, not a probability',
  /82 1\+ hit score/.test(heroTxt) && heroTxt.indexOf('79.9%') < 0);
t('...and says the ranking is all it is', /RANKING ONLY/.test(heroTxt));
t('...alongside what it IS: the board’s top pick', /TOP MODEL PICK/.test(heroTxt));
t('the H+R+RBI card does the same', /3\.17 hits \+ runs \+ RBI score/.test(heroTxt));
t('the home-run card ranks rather than prices',
  /66 home run score/.test(heroTxt) && /LONGSHOT RANKING/.test(heroTxt));
t('...and says no book priced it', /NO BOOK PRICE/.test(heroTxt));
/* the raw internal code must not reach the reader */
t('internal refusal codes stay out of the Hero',
  heroTxt.indexOf('NO_ODDS') < 0 && heroTxt.indexOf('UNVERIFIED') < 0);
t('no experiment id reaches a Hero card', !/ALT15|RUNDIST|P2\b|V3\.4/.test(heroTxt));
t('no AUC or Brier reaches a Hero card', !/AUC|Brier/i.test(heroTxt));

/* a verified probability, when one exists, IS shown as one */
global.D = JSON.parse(JSON.stringify(BASE));
D.boards.h1[0].model_prob = 0.71;
t('a market with a verified probability shows the percentage',
  /71.0%/.test(strip(hProp('Best 1+ hit', 'h1', '1+ hit'))));
t('...and drops the RANKING ONLY chip',
  strip(hProp('Best 1+ hit', 'h1', '1+ hit')).indexOf('RANKING ONLY') < 0);

/* ---- 3. THE MODEL'S CALL AND THE BET VERDICT ARE DIFFERENT ----------- */
global.D = JSON.parse(JSON.stringify(BASE));
const ml1 = strip(hMoneyline());
t('the best moneyline is the highest tier, not the highest confidence',
  /KC/.test(ml1) && !/SD/.test(ml1));
t('...labelled with its tier', /LEAN/.test(ml1));

/* THE NUMBER IS THE WIN PROBABILITY, NOT THE RULE SCORE.
   This tile published `conf` as "68.0% model" while the same payload's win
   probability for that game was 0.8718 — and the model-parlay card on this
   same site printed 87.2% for the same team. One game, two "model %". */
t('the tile publishes the win probability', /87\.2%/.test(ml1));
t('...labelled as a win probability', /win probability/.test(ml1));
t('...and the rule score is not printed as a percentage',
  !/68\.0%/.test(ml1));
t('...with the band that measured it, or its named absence',
  /no measured band covers this probability/.test(ml1));

/* the probability shown belongs to the side the tile NAMES */
global.D = JSON.parse(JSON.stringify(BASE));
D.ml[0].team = 'AZ';               // a dog-edge bet on the projected loser
const dog = strip(hMoneyline());
t('a bet on the other side shows THAT side\u2019s probability',
  /12\.8%/.test(dog) && !/87\.2%/.test(dog));

/* and where no probability exists for the named side, nothing is borrowed */
global.D = JSON.parse(JSON.stringify(BASE));
D.ml = [{ gamePk: 1, tier: 'LEAN', conf: 68.0, edge: 8.3, pickSide: 'home' }];
const noprob = strip(hMoneyline());
t('a row with no published probability says so',
  /PROBABILITY NOT PUBLISHED/.test(noprob));
t('...and does not fall back to the rule score', !/68\.0%/.test(noprob));

global.D = JSON.parse(JSON.stringify(BASE));
D.ml = [{ gamePk: 1, tier: 'PASS', conf: 53.9, edge: -17.0, pickSide: 'home',
          home: 'KC', away: 'AZ', projectedWinner: 'KC',
          homeWinProb: 0.539, awayWinProb: 0.461, winProb: 0.539 }];
const allPass = strip(hMoneyline());
t('an all-PASS slate still publishes the model’s best call',
  /53.9%/.test(allPass));
t('...marked as not a bet at this price', /NO BET AT THIS PRICE/.test(allPass));
t('...and says so in words', /not as a bet/.test(allPass));
t('a PASS is never rendered as a recommendation', !/\bSTRONG\b/.test(allPass));

/* ---- 4. THE PARLAY NUMBER CARRIES ITS ASSUMPTION --------------------- */
global.D = JSON.parse(JSON.stringify(BASE));
t('a licensed product shows the percentage', /37.3%/.test(strip(hParlay())));
t('...with the assumption attached', /INDEPENDENCE ASSUMED/.test(strip(hParlay())));
D.topParlay.combined = { americanOdds: '+178', hitPct: null,
  probMethod: 'not_measured', correlationNote: 'NOT MEASURED — nested legs.' };
t('an unlicensed product publishes no percentage',
  strip(hParlay()).indexOf('37.3%') < 0);
t('...and says NOT MEASURED', /NOT MEASURED/.test(strip(hParlay())));
t('the payout still shows, because it comes from the book',
  /\+178 combined/.test(strip(hParlay())));
D.topParlay = { parlayValid: false, legs: [], noParlayReason: 'only one leg survived' };
t('no valid parlay says why, in plain English',
  /only one leg survived/.test(strip(hParlay())));
t('leg text drops the model reasoning after the dash',
  hLegShort({ desc: 'TOR ML — favorite by run proj 4.8-3.7' }) === 'TOR ML');

/* ---- 5. +1.5 CARRIES THE PRODUCER'S LABEL, UNCHANGED ----------------- */
global.D = JSON.parse(JSON.stringify(BASE));
D.alt15 = { available: true, evidence: 'PROVISIONAL',
  evidenceNote: 'publishing is not the same as being validated.',
  picks: [{ game: 'NYM@ATL', bestPlus15Team: 'NYM',
            bestPlus15Probability: 0.8312 }] };
const p15 = strip(hPlus15());
t('the +1.5 card shows the side and probability',
  /NYM \+1.5/.test(p15) && /83.1%/.test(p15));
t('...with the producer’s PROVISIONAL label unchanged', /PROVISIONAL/.test(p15));
t('...never upgraded', !/VALIDATED|STRONG/.test(p15));
t('...and says both sides cover in a one-run game',
  /not one minus the other/.test(p15));
D.alt15 = { available: false, why: 'the artifact on disk is for a DIFFERENT date.' };
t('an unpublished +1.5 names the reason',
  /DIFFERENT date/.test(strip(hPlus15())));
delete D.alt15;
t('a payload predating the block says that, rather than inventing a reason',
  /before the \+1.5 model was wired in/.test(strip(hPlus15())));

/* ---- 6. IMAGES DEGRADE TO INITIALS, NEVER TO A BROKEN ICON ----------- */
t('a player card requests a headshot', /img.mlbstatic.com/.test(hFace(11, 'Bobby Witt Jr.')));
t('...with a lazy attribute', /loading="lazy"/.test(hFace(11, 'X')));
t('...and an onerror that swaps in initials', /onerror/.test(hFace(11, 'Bobby')));
t('a player with no id gets initials immediately',
  /class="hini">B</.test(hFace(null, 'Bobby Witt Jr.')));
t('a known team requests its logo', /midfield.mlbstatic.com/.test(hTeam('KC')));
t('an unknown team falls back to initials', /class="hini"/.test(hTeam('ZZZ')));
t('initials never render empty', hInit('') === '?' && hInit(null) === '?');

/* ---- 7. THE SLATE ACTUALLY RENDERS IT -------------------------------- */
t('renderSlate puts the Hero first', /dailyHero\(\)\+decisionSummaryStrip\(\)/.test(html));
t('the Hero is defined once', (html.match(/function dailyHero\(\)/g) || []).length === 1);
t('...and does not collide with the per-game hero block',
  /function heroBlock\(/.test(html));

/* ---- 10. A TILE WITH NO PICK STILL HAS A HEADLINE -------------------
 * The +1.5 tile rendered its refusal as four lines of engineering prose in
 * the primary picks list. The reason must survive - a zero without its
 * reason is worse than an ugly one - but the reader has to be able to tell
 * at a glance that the tile holds no pick.
 */
global.D = JSON.parse(JSON.stringify(BASE));
D.alt15 = { available: false, why: "the artifact on disk is for a DIFFERENT date. It is refused, not reused." };
const refused = strip(hPlus15());
t('a refused +1.5 leads with its state', /NOT PUBLISHED TODAY/.test(refused));
t('...and keeps the whole reason', /refused, not reused/.test(refused));
D.alt15 = { available: true, picks: [] };
t('an empty board says NO PICK TODAY', /NO PICK TODAY/.test(strip(hPlus15())));
delete D.alt15;
t('a payload predating the block says THAT', /NOT WIRED IN YET/.test(strip(hPlus15())));

/* ---- 11. A SCORE NAMES ITS SCALE ------------------------------------
 * "82 score", "2.71 score" and "66 score" appeared in one column: three
 * different quantities under one word, inviting a reader to rank them
 * against each other.
 */
global.D = JSON.parse(JSON.stringify(BASE));
const h1c = strip(hProp('Best 1+ hit', 'h1', '1+ hit'));
const hrc = strip(hProp('Best H+R+RBI', 'hrr', 'hits + runs + RBI'));
t('a board score names its market', /1\+ hit score/.test(h1c));
t('...and another market names its own', /hits \+ runs \+ RBI score/.test(hrc));
t('...so the bare word "score" is not what labels the number',
  !/\b82\s*score\b/.test(h1c));
const grid = strip(dailyHero());
t('the grid says once that scores are not comparable',
  /different scales/.test(grid) && /cannot be compared/.test(grid));
t('...and points at the rank as what the evidence licenses',
  /ranks inside its own board/.test(grid));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
