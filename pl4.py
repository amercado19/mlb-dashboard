"""THE ONLY PUSH GATE ON THE PUBLIC DASHBOARD HAS BEEN RED FOR DAYS.

tests.yml runs on every push, including the bot's, and every one of the last
ten runs failed. A gate that is always red gates nothing: a real regression
lands inside a wall of pre-existing failures and nobody can tell it apart.
That is worse than having no gate, because the repository LOOKS checked.

Three files fail. None of them fails for the reason its name suggests.

1. tests/daily_hero.test.js -- 11 assertions, ALL from a stale harness.
   hProp() and hMoneyline() now route every row through mktDeadRow/mktDead
   (the started-game work), and the harness never brought those functions
   across. hTileSafe catches the ReferenceError, files a diagnostic, and
   renders an empty card -- so eleven assertions about what a Hero card may
   CLAIM fail because the card was never built. The product is fine. Fixed by
   eval'ing the market-state helpers, and by busting predIndex's window._PIX
   memo on every assignment to D, without which scenario two would be scored
   against scenario one's predictions.

2. tests/model_agreement_surface.test.js -- 1 assertion, and THE TEST IS
   RIGHT. maSummary() moved its `why` sentence into a title= attribute. On a
   phone that is not a subtle explanation, it is an absent one. The sentence
   is the one a reader seeing "MIXED MODEL SIGNALS" actually needs -- that two
   models disagreeing is two models answering two questions, not a fault. It
   now renders. Same defect class as the playoff chips in the release this
   ships beside, so it gets the same answer rather than a looser assertion.

3. tests/contract_e2e.test.js -- 1 assertion, and it is reading a selector
   that no longer exists. The lineup word was deliberately removed from the
   Slate card head ("two places for one fact is the clutter") and lives on the
   View-lineup drawer's badge. The assertion's INTENT -- a card that cannot
   say any of the four words is the defect -- is preserved exactly; only the
   selector moves. And while checking it: the no-batting-order branch of that
   drawer omitted the badge entirely, so those cards genuinely could not say
   any of the four words. That is a real gap and it is fixed too.

None of this loosens an assertion. Two of the three are product fixes; the
third restores a harness to the code it is testing.
"""
from __future__ import annotations

import pathlib
import sys

FAIL: list[str] = []
HTML = ("current.html", "index.html", "preview.html")

# ------------------------------------------------------------------ 1. maSummary
MA_OLD = """  return '<div class="masum" title="'+esc(s.why||'')+'"><b>'+esc(s.label)
    +'</b> &middot; '+esc(bits.join(' · '))+'</div>';"""

MA_NEW = """  /* THE WHY WAS HOVER-ONLY, WHICH ON A PHONE MEANS IT DID NOT EXIST. It is
     one sentence, and it is the sentence a reader seeing "MIXED MODEL
     SIGNALS" needs: two models disagreeing is two models answering two
     questions, not a fault. So it renders. The title stays for the pointer
     and is no longer the only way to reach it. */
  return '<div class="masum" title="'+esc(s.why||'')+'"><b>'+esc(s.label)
    +'</b> &middot; '+esc(bits.join(' · '))
    +(s.why?'<span class="masumw">'+esc(s.why)+'</span>':'')+'</div>';"""

MA_CSS_OLD = (".masum b{color:var(--txt);font-family:var(--mono);"
              "font-size:10.5px;letter-spacing:.04em}")
MA_CSS_NEW = (MA_CSS_OLD
              + "\n.masumw{display:block;margin-top:4px;color:var(--muted);"
                "font-size:11px;line-height:1.5;opacity:.92}")

# ------------------------------------------------------------ 2. lineup badge
LU_OLD = """  if(!A.length&&!H.length)
    return '<details class="s3d"><summary>View lineup</summary><div class="s3db">'
      +'<div class="s3note">No batting order in today’s payload for this game.</div></div></details>';"""

LU_NEW = """  /* EVEN WITH NO ORDER, THE CARD SAYS THE WORD. Omitting the badge leaves a
     reader unable to tell "we are waiting" from "we never looked" -- the same
     silence-shaped ambiguity the empty prop boards had. PENDING is a legal
     answer; saying nothing is not. */
  if(!A.length&&!H.length)
    return '<details class="s3d"><summary>View lineup'
      +'<span class="s3n">'+lineupWord3(gState)+'</span></summary><div class="s3db">'
      +'<div class="s3note">No batting order in today’s payload for this game.</div></div></details>';"""

HTML_EDITS = [
    ("model-agreement why renders", MA_OLD, MA_NEW),
    ("model-agreement why css", MA_CSS_OLD, MA_CSS_NEW),
    ("lineup badge on the no-order drawer", LU_OLD, LU_NEW),
]
HTML_ALREADY = "masumw"

# --------------------------------------------------- 3. contract_e2e selector
CE_OLD = """        lineupWord: (c.querySelector('.s3st') || {}).textContent || '',"""

CE_NEW = """        /* The lineup word moved when the Slate card was redesigned: it is
           no longer a chip in the card head and now lives on the View-lineup
           drawer's own badge. `.s3n` is shared with the parlay drawer's leg
           count, so find the lineup drawer by its summary and read only its
           badge. The assertion this feeds is unchanged. */
        lineupWord: (function () {
          var ds = [].slice.call(c.querySelectorAll('details.s3d'));
          for (var i = 0; i < ds.length; i++) {
            var sm = ds[i].querySelector('summary');
            if (sm && /view lineup/i.test(sm.textContent || ''))
              return (ds[i].querySelector('.s3n') || {}).textContent || '';
          }
          return '';
        })(),"""

# ------------------------------------------------------ 4. daily_hero harness
DH_OLD = """eval(grab(/function fmtTime\\([\\s\\S]*?\\n\\}/, 'fmtTime'));"""

DH_NEW = """eval(grab(/function fmtTime\\([\\s\\S]*?\\n\\}/, 'fmtTime'));
/* THE HERO NOW ASKS WHETHER THE MARKET IS STILL OPEN, and this harness never
 * brought that machinery across. hProp() and hMoneyline() route every row
 * through mktDeadRow/mktDead; without them the call throws, hTileSafe catches
 * it, files a diagnostic and renders an empty card -- and eleven assertions
 * about what a Hero card may CLAIM fail because no card was ever built. They
 * were not testing the product, they were testing an omission here. */
global.window = global.window || {};
eval(grab(/var DEAD_MARKET=\\{[\\s\\S]*?\\};/, 'DEAD_MARKET'));
eval(grab(/function predIndex\\(\\)\\{[\\s\\S]*?\\n\\}/, 'predIndex'));
eval(grab(/function mktState\\(pk\\)\\{[\\s\\S]*?\\n\\}/, 'mktState'));
eval(grab(/function mktDead\\(pk\\)\\{.*?\\}/, 'mktDead'));
eval(grab(/function mktDeadRow\\(r\\)\\{[\\s\\S]*?\\n\\}/, 'mktDeadRow'));
/* hMoneyline() sorts by the canonical recommendation rather than re-deriving
 * one, so recFor and the predOf it reads have to come across too. */
eval(grab(/function predOf\\(g,m\\)\\{[\\s\\S]*?\\n\\}/, 'predOf'));
eval(grab(/function recFor\\(g,m\\)\\{[\\s\\S]*?\\n\\}/, 'recFor'));
/* predIndex() memoises into window._PIX. A scenario that assigns a new D
 * would otherwise be scored against the PREVIOUS scenario's predictions --
 * a harness bug that would make a market-state assertion pass for the wrong
 * reason. Every assignment to D busts the memo, which keeps the existing
 * `global.D = ...` lines correct without editing any of them. */
var _HERO_D = null;
Object.defineProperty(global, 'D', {
  configurable: true,
  get: function () { return _HERO_D; },
  set: function (v) { _HERO_D = v; global.window._PIX = null; }
});"""

JS_EDITS = [
    ("tests/contract_e2e.test.js", "lineup word selector", CE_OLD, CE_NEW,
     "view lineup/i.test"),
    ("tests/daily_hero.test.js", "market-state helpers in the harness", DH_OLD, DH_NEW,
     "mktDeadRow"),
]


def main() -> int:
    buf: dict[str, str] = {}

    for fn in HTML:
        p = pathlib.Path(fn)
        if not p.exists():
            FAIL.append("%s: missing" % fn)
            continue
        s = p.read_text(encoding="utf-8")
        if HTML_ALREADY in s:
            FAIL.append("%s: already patched (%r present)" % (fn, HTML_ALREADY))
            continue
        for label, old, new in HTML_EDITS:
            n = s.count(old)
            if n != 1:
                FAIL.append("%s / %s: anchor found %d time(s), expected 1" % (fn, label, n))
                continue
            s = s.replace(old, new, 1)
        buf[fn] = s

    for fn, label, old, new, already in JS_EDITS:
        p = pathlib.Path(fn)
        if not p.exists():
            FAIL.append("%s: missing" % fn)
            continue
        s = p.read_text(encoding="utf-8")
        if already in s:
            FAIL.append("%s: already patched (%r present)" % (fn, already))
            continue
        n = s.count(old)
        if n != 1:
            FAIL.append("%s / %s: anchor found %d time(s), expected 1" % (fn, label, n))
            continue
        buf[fn] = s.replace(old, new, 1)

    if FAIL:
        print("ANCHOR FAILURES -- nothing written:")
        for f in FAIL:
            print("  - " + f)
        return 1

    for fn, s in buf.items():
        pathlib.Path(fn).write_text(s, encoding="utf-8")
        print("  patched %s" % fn)
    return 0


if __name__ == "__main__":
    sys.exit(main())
