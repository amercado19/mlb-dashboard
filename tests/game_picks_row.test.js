/* THE PICKS ROW ON A SLATE CARD — this game's props, not the slate's.
 *
 * The card carried the moneyline, the run line and the weather and said
 * nothing about props or the parlay, so a reader looking at one game had to
 * leave it to learn whether the system liked anybody in it.
 *
 * The two ways a row like this lies:
 *
 *   1. It falls back to the slate leader when the game has no candidate, so
 *      every card shows a name and the reader cannot tell which of them the
 *      model actually likes HERE.
 *   2. It prints the board's ranking metric with a % sign, or beside a
 *      probability from another market, so a score becomes a chance. Today's
 *      payload publishes model_prob: null for every prop, which means this is
 *      not a hypothetical — it is the default case.
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
let D = {};
eval(grab(/function gameTopRow\(fam,pk\)\{[\s\S]*?\n\}/, 'gameTopRow'));
eval(grab(/function gamePickChip\(fam,pk,label\)\{[\s\S]*?\n\}/, 'gamePickChip'));
eval(grab(/function gameParlayChip\(pk\)\{[\s\S]*?\n\}/, 'gameParlayChip'));
eval(grab(/function gamePicksRow\(g\)\{[\s\S]*?\n\}/, 'gamePicksRow'));

let pass = 0, fail = 0;
const t = (name, cond) => {
  try { assert(cond); console.log('  [PASS] ' + name); pass++; }
  catch (e) { console.log('  [FAIL] ' + name); fail++; }
};
const strip = s => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/* Today's shape: every prop's model_prob is null and the board ranks on a
   score. Game 1 has candidates; game 2 has none. */
D = {
  boards: {
    h1: [{ gamePk: 1, name: 'Bobby Witt Jr.', team: 'KC', metric: 71, model_prob: null },
         { gamePk: 1, name: 'Vinnie Pasquantino', team: 'KC', metric: 64, model_prob: null }],
    hr: [{ gamePk: 3, name: 'Kyle Schwarber', team: 'PHI', metric: 58, model_prob: null },
         { gamePk: 1, name: 'Salvador Perez', team: 'KC', metric: 51, model_prob: null }],
    tb2: []
  },
  topParlay: { legs: [{ gamePk: 1, betType: 'ml', team: 'KC' },
                      { gamePk: 3, betType: 'hr', playerId: 7 }] }
};

const g1 = strip(gamePicksRow({ gamePk: 1 }));
const g2 = strip(gamePicksRow({ gamePk: 2 }));
const g3 = strip(gamePicksRow({ gamePk: 3 }));

/* ---- 1. THE ROW SHOWS THIS GAME'S PICKS, NOT THE SLATE'S ------------ */
t('a game with a hit candidate names it', /Bobby Witt Jr\./.test(g1));
t('...and takes the highest-ranked one from THIS game, not the list head',
  g1.indexOf('Bobby Witt Jr.') >= 0 && g1.indexOf('Pasquantino') < 0);
t('a game whose HR candidate sits second on the board still finds it',
  /Salvador Perez/.test(g1));
t('...and does not show the slate\'s HR leader from another game',
  g1.indexOf('Schwarber') < 0);
t('game 3 shows its own HR leader', /Schwarber/.test(g3));
t('...and not the other game\'s hit leader', g3.indexOf('Witt') < 0);

/* ---- 2. A GAME WITH NOTHING SAYS NOTHING, AND BORROWS NOTHING ------- */
t('a game with no candidate says so plainly',
  /No prop from this game reached a board today/.test(g2));
t('...and names no player at all',
  g2.indexOf('Witt') < 0 && g2.indexOf('Schwarber') < 0 && g2.indexOf('Perez') < 0);
t('an empty board contributes no chip', gamePickChip('tb2', 1, 'Top 2+ TB') === '');
t('a board that does not exist contributes no chip',
  gamePickChip('hrr', 1, 'Top HRR') === '');
t('a card with no gamePk renders nothing rather than guessing',
  gamePicksRow({}) === '' && gamePicksRow(null) === '');

/* ---- 3. A SCORE IS NEVER DRESSED AS A PROBABILITY ------------------- */
t('a prop with no published probability shows its score',
  /71 score/.test(g1));
t('...labelled RANKING ONLY', /RANKING ONLY/.test(g1));
t('...and carries no percent sign', !/71%/.test(g1));
D.boards.h1[0].model_prob = 0.62;
const withProb = strip(gamePicksRow({ gamePk: 1 }));
t('a prop that DOES publish a probability shows the percentage',
  /62\.0%/.test(withProb));
t('...and drops the ranking-only marker for that chip',
  withProb.indexOf('Bobby Witt Jr. 62.0% RANKING ONLY') < 0);
t('...while the HR chip beside it, which has none, keeps its marker',
  /Salvador Perez 51 score RANKING ONLY/.test(withProb));
D.boards.h1[0].model_prob = null;

/* ---- 4. THE PARLAY MARKER COUNTS LEGS, AND ONLY THIS GAME'S -------- */
t('a game supplying one parlay leg says one leg',
  /Parlay 1 leg\b/.test(strip(gamePicksRow({ gamePk: 3 }))));
t('a game supplying none shows no parlay chip',
  strip(gamePicksRow({ gamePk: 2 })).indexOf('Parlay') < 0);
D.topParlay.legs.push({ gamePk: 1, betType: 'plus15', team: 'KC' });
t('two legs from one game are pluralised',
  /Parlay 2 legs/.test(strip(gamePicksRow({ gamePk: 1 }))));
t('...and the chip says those legs are dependent',
  /dependent/.test(gameParlayChip(1)));
D.topParlay = {};
t('a payload with no parlay shows no parlay chip', gameParlayChip(1) === '');

/* ---- 5. THE ROW IS RENDERED ON THE CARD ---------------------------- */
t('slateCard2 renders the picks row', /\+gamePicksRow\(g\)/.test(html));
t('...after the bet and the run line, where a reader has the price first',
  html.indexOf('+gamePicksRow(g)') > html.indexOf('+alt15Row(g)'));
t('...and before the technical decision chips',
  html.indexOf('+gamePicksRow(g)') <
  html.indexOf("'<div class=\"g2row\"><i>Decision</i>'"));

/* ---- 6. THE ROW CANNOT BE INJECTED THROUGH ------------------------- */
D = { boards: { h1: [{ gamePk: 1, name: '<img src=x onerror=1>', metric: 9 }] }, topParlay: {} };
t('a player name is escaped',
  gamePicksRow({ gamePk: 1 }).indexOf('<img') < 0);

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
