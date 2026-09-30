"""PLAYOFF RELEASE 2 — PRESENTATION. Track B item 1-5 of the converged plan.

THE ONE CONSTRAINT THIS FILE OBEYS
==================================
UX may change what is SHOWN, how it is grouped, what is progressively
disclosed and what is interactive. It may not change what is CLAIMED. No
number appears here that the pipeline did not publish. No state is
relabelled into a friendlier vocabulary. No absence becomes a neutral or a
zero. Nothing becomes actionable that governance does not allow. And --
the clause the second reviewer added and I accepted -- no transformation
may increase the APPARENT EPISTEMIC STRENGTH of a state. Sorting,
prominence, animation, default expansion, iconography and placement can
turn WATCH into something that feels like PICK without changing the word.

So: chips are NOT reordered by favourability, nothing auto-expands because
it is a PICK, the state glyphs are all members of one circle family with no
up/down direction, and PICK and LEAN deliberately SHARE a glyph because the
glyph encodes the category (actionable) and the word carries the strength.

WHAT CHANGES
============
1. CHIP REASONS EXIST ON TOUCH. They were `title=` only, which on a phone is
   not a secret so much as a nonexistence: 8 chips per card whose entire
   explanation lived in a hover. Chips become real buttons with
   aria-expanded, and the reason renders INTO the card in a panel, reachable
   by tap and by keyboard. The title stays for desktop hover -- it costs
   nothing and it is no longer the only way.

2. DENSITY. The card led with the two starters and seven matchup lines
   before it said whether there was anything to do. The order is now
   teams+series, status+first pitch, what is actionable, starters, the
   market chips, and only then the WHY block -- which is collapsed into a
   <details> whose summary COUNTS what is inside it rather than hiding an
   unknown quantity. Open by default at >=768px, closed below, because
   collapsing context reduces apparent strength and never raises it.

3. A LEGEND, because four colours and six words with no key made the reader
   infer the semantics. It states for every state whether it is temporary or
   permanent and who produced it -- the thing a reader cannot infer from
   AWAITING_LINEUP vs UNAVAILABLE. It also states the definition of
   "actionable" that the card summary uses, so that summary is a restatement
   of published states and not a new claim.

4. THE BRACKET IS NAVIGABLE ON A PHONE. Four columns at 700px wide is four
   squeezed columns. Round tabs below 700px, four columns above, driven by
   CSS so a rotation does not need a re-render -- and every column stays in
   the DOM, so the coverage and series assertions still see all four rounds.
   A clinched series now names WHO advances and WHERE, instead of an arrow
   at the end of a score line.

5. THE CARD REACHES THE REST OF THE PRODUCT. Nothing on a playoff card was
   clickable. It now reaches the game's full matchup card and that game's own
   1+ hit and home-run boards -- the views that already exist, not a second
   copy of them. The board links appear only when that market published rows
   for that game, because a link to an empty board is a promise the product
   cannot keep.
"""
from __future__ import annotations

import pathlib
import sys

FILES = ("current.html", "index.html", "preview.html")
FAIL: list[str] = []

CSS_ANCHOR = (".poempty{font-size:11px;color:var(--muted);"
              "font-family:var(--mono);padding:8px 2px}")

CSS_NEW = CSS_ANCHOR + """
.ponow{font-family:var(--mono);font-size:10px;font-weight:800;border-radius:8px;padding:5px 9px;
  margin:1px 0 3px;border:1px solid var(--line2);background:var(--panel2);color:var(--muted);line-height:1.45}
.ponow.on{background:#0b2e1e;color:#7ee2a8;border-color:#166a3f}
button.pomkc{appearance:none;-webkit-appearance:none;cursor:pointer;font-family:var(--mono);
  font-size:9.5px;font-weight:800;line-height:1.55;text-align:left}
button.pomkc[aria-expanded="true"]{border-color:var(--accent)}
button.pomkc:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.pomkc .g{margin-right:3px;opacity:.85}
.potip{display:none;margin-top:8px;background:var(--panel2);border:1px solid var(--line2);
  border-radius:9px;padding:9px 11px}
.potip.on{display:block}
.potiph{display:flex;align-items:center;gap:7px;flex-wrap:wrap;font-family:var(--mono);font-size:9.5px;
  font-weight:800;color:var(--txt);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}
.potip p{margin:0;font-size:11.5px;color:var(--muted);line-height:1.55}
.potips{font-family:var(--mono);font-size:9px;color:var(--muted);opacity:.8;margin-top:6px}
.powhyd{margin-top:10px;border-top:1px solid var(--line);padding-top:8px}
.powhyd>summary{cursor:pointer;font-size:9.5px;font-weight:800;text-transform:uppercase;
  letter-spacing:.06em;color:var(--muted);list-style:none}
.powhyd>summary::-webkit-details-marker{display:none}
.powhyd>summary::after{content:' \\25BE';opacity:.6}
.powhyd[open]>summary::after{content:' \\25B4'}
.powhyd>summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.powhyd .powhy{border-top:0;margin-top:0;padding-top:8px}
.pogo{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px;border-top:1px solid var(--line);padding-top:9px}
.pogo button{appearance:none;-webkit-appearance:none;cursor:pointer;font-family:var(--mono);
  font-size:9.5px;font-weight:800;border:1px solid var(--line2);background:var(--elev);
  color:var(--muted);border-radius:7px;padding:5px 9px}
.pogo button:hover{color:var(--txt);border-color:var(--accent)}
.pogo button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.poleg{margin:0 0 13px}
.poleg>summary{cursor:pointer;font-family:var(--mono);font-size:10.5px;font-weight:800;color:var(--muted);
  background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:9px 12px;list-style:none}
.poleg>summary::-webkit-details-marker{display:none}
.poleg>summary::after{content:' \\25BE';opacity:.6}
.poleg[open]>summary::after{content:' \\25B4'}
.poleg>summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.poleg .in{background:var(--panel);border:1px solid var(--line);border-top:0;border-radius:0 0 10px 10px;
  padding:3px 12px 11px}
.polegr{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-top:1px solid var(--line)}
.polegr:first-child{border-top:0}
.polegr .lab{flex:0 0 126px}
.polegr .d{font-size:11.5px;color:var(--muted);line-height:1.5}
.polegr .d b{color:var(--txt)}
.polegf{font-size:11.5px;color:var(--muted);line-height:1.55;border-top:1px solid var(--line);
  margin-top:4px;padding-top:9px}
.polegf b{color:var(--txt)}
.pobrnav{display:none;gap:6px;flex-wrap:wrap;margin:0 0 10px}
.pobrnav button{appearance:none;-webkit-appearance:none;cursor:pointer;font-family:var(--mono);
  font-size:10px;font-weight:800;border:1px solid var(--line2);background:var(--elev);color:var(--muted);
  border-radius:8px;padding:6px 10px}
.pobrnav button.on{background:var(--panel2);color:var(--txt);border-color:var(--accent)}
.pobrnav button[disabled]{opacity:.45;cursor:default}
.pobrnav button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.pobsadv{font-family:var(--mono);font-size:9.5px;font-weight:800;color:var(--win);margin-top:5px}
.pohl{outline:2px solid var(--accent);outline-offset:3px}
@media(max-width:700px){
  .pobrnav{display:flex}
  .pobr{grid-template-columns:1fr}
  .pobr.sel .pobrr{display:none}
  .pobr.sel .pobrr.on{display:block}
  .posp{grid-template-columns:1fr}
  .powhy li{flex-direction:column;gap:1px}
  .powhy li b{min-width:0;flex:0 0 auto}
  .polegr{flex-direction:column;gap:3px}
  .polegr .lab{flex:0 0 auto}
}"""

# ---------------------------------------------------------------- poChips
CHIPS_OLD = """function poChips(g){
  var mk=g.markets||{},rs=g.markets_reason||{},sr=g.markets_source||{};
  return PO_MARKET_ORDER.filter(function(k){return mk[k];}).map(function(k){
    var st=String(mk[k]);
    var tip=(rs[k]||'')+(sr[k]?('  ['+sr[k]+']'):'');
    return '<span class="pomkc s-'+esc(st)+'" title="'+esc(tip)+'">'
      +esc(PO_MARKET_LABEL[k]||k)+' '+esc(st.replace('AWAITING_LINEUP','AWAITING LINEUP'))
      +'</span>';
  }).join('');
}"""

CHIPS_NEW = """/* A TOOLTIP IS NOT AN EXPLANATION ON A PHONE. Every chip is a button whose
   press puts the producer's own reason INSIDE the card, reachable by tap and
   by keyboard. The glyphs are one family of circles on purpose: they encode
   the CATEGORY (actionable / evaluated / monitored / waiting / none), never a
   direction, and PICK and LEAN share one because the word carries the
   strength and an icon must not add conviction the producer did not publish. */
var PO_STATE_GLYPH={PICK:'\\u25CF',LEAN:'\\u25CF',PASS:'\\u25CB',WATCH:'\\u25CE',
  AWAITING_LINEUP:'\\u25D4',UNAVAILABLE:'\\u2298'};
var PO_ACTIONABLE={PICK:1,LEAN:1};

function poChips(g){
  var mk=g.markets||{},rs=g.markets_reason||{},sr=g.markets_source||{};
  /* PO_MARKET_ORDER, NOT A SORT BY FAVOURABILITY. Floating the PICKs to the
     front would make the same payload read stronger at a glance. */
  return PO_MARKET_ORDER.filter(function(k){return mk[k];}).map(function(k){
    var st=String(mk[k]),lb=PO_MARKET_LABEL[k]||k;
    var why=rs[k]||'';
    var tip=why+(sr[k]?('  ['+sr[k]+']'):'');
    return '<button type="button" class="pomkc s-'+esc(st)+'" aria-expanded="false"'
      +' title="'+esc(tip)+'" data-mk="'+esc(lb)+'" data-st="'+esc(st)+'"'
      +' data-why="'+esc(why)+'" data-src="'+esc(sr[k]||'')+'"'
      +' onclick="poTip(this)">'
      +'<span class="g" aria-hidden="true">'+(PO_STATE_GLYPH[st]||'')+'</span>'
      +esc(lb)+' '+esc(st.replace('AWAITING_LINEUP','AWAITING LINEUP'))
      +'</button>';
  }).join('');
}

/* One open reason per card. Pressing the open chip closes it, which is what
   a reader expects of a control that changed when they pressed it. */
function poTip(btn){
  var card=btn.parentNode;
  while(card&&!(card.className&&String(card.className).indexOf('pog')===0))card=card.parentNode;
  if(!card)return;
  var panel=card.querySelector('.potip');
  if(!panel)return;
  var was=btn.getAttribute('aria-expanded')==='true';
  var chips=card.querySelectorAll('.pomk .pomkc');
  for(var i=0;i<chips.length;i++)chips[i].setAttribute('aria-expanded','false');
  if(was){panel.className='potip';panel.innerHTML='';return;}
  btn.setAttribute('aria-expanded','true');
  var st=btn.getAttribute('data-st')||'';
  var why=btn.getAttribute('data-why')||'';
  panel.innerHTML='<div class="potiph"><span>'+esc(btn.getAttribute('data-mk')||'')+'</span>'
    +'<span class="pomkc s-'+esc(st)+'">'+esc(st.replace('AWAITING_LINEUP','AWAITING LINEUP'))
    +'</span></div>'
    +'<p>'+esc(why||'The payload carries this state with no reason sentence. That is a gap '
      +'in the producer output, not a judgement about this game.')+'</p>'
    +(btn.getAttribute('data-src')
      ?'<div class="potips">published by '+esc(btn.getAttribute('data-src'))+'</div>':'');
  panel.className='potip on';
}

/* A RESTATEMENT, NOT A RANKING. It says which states are actionable, using
   the definition printed in the legend, and it does not order the markets
   against each other -- the backend publishes no cross-market ranking, so a
   UI that named a "strongest" pick would be inventing one. */
function poNow(g){
  var mk=g.markets||{};
  var n=PO_MARKET_ORDER.filter(function(k){return mk[k];}).length;
  if(poDead(g))
    return '<div class="ponow">Not actionable \\u2014 the game is under way or final</div>';
  var act=PO_MARKET_ORDER.filter(function(k){return PO_ACTIONABLE[String(mk[k])];});
  if(!act.length)
    return '<div class="ponow">Nothing actionable \\u2014 '+n+' market'+(n===1?'':'s')
      +' evaluated, none of them a bet</div>';
  return '<div class="ponow on">Actionable now \\u2014 '
    +act.map(function(k){return esc(PO_MARKET_LABEL[k]||k)+' '+esc(String(mk[k]));}).join(', ')
    +'</div>';
}

/* SIX WORDS AND FOUR COLOURS WITH NO KEY. A reader had to infer that
   AWAITING_LINEUP clears on its own and UNAVAILABLE may never. */
var PO_LEGEND=[
  ['PICK','PICK','The producer published a bet at STRONG for this game. <b>Actionable.</b> '
    +'It expires at first pitch, when the market stops being pregame.'],
  ['LEAN','LEAN','The same evaluation at lower conviction. <b>Actionable.</b> Also expires '
    +'at first pitch.'],
  ['PASS','PASS','The producer evaluated this market for this game and declined to bet it. '
    +'<b>Not a bet.</b> It can still change if the producer republishes before first pitch.'],
  ['WATCH','WATCH','The board published rows and governance does not license this market to '
    +'recommend. <b>Not a bet, and it will not become one today</b> \\u2014 it changes only '
    +'when the market\\u2019s governance changes.'],
  ['AWAITING_LINEUP','AWAITING LINEUP','<b>Temporary.</b> Rows exist but no candidate is '
    +'eligible yet, because official lineups are not posted. It becomes WATCH once they are.'],
  ['UNAVAILABLE','UNAVAILABLE','No state could be derived, and the chip\\u2019s own reason says '
    +'which: no rows published, the market is retired, the game is no longer pregame, or the '
    +'producer used a word this page refuses to guess at. <b>Permanent for a retired market, '
    +'and permanent for today once the game starts.</b>']
];

function poLegend(){
  var rows=PO_LEGEND.map(function(r){
    return '<div class="polegr"><span class="lab"><span class="pomkc s-'+r[0]+'">'
      +'<span class="g" aria-hidden="true">'+(PO_STATE_GLYPH[r[0]]||'')+'</span>'+esc(r[1])
      +'</span></span><span class="d">'+r[2]+'</span></div>';
  }).join('');
  return '<details class="poleg">'
    +'<summary>What the six market states mean, and which of them are temporary</summary>'
    +'<div class="in">'+rows
    +'<div class="polegf"><b>Actionable</b> on these cards means PICK or LEAN and nothing else. '
    +'Every chip carries its state as a word, so the colour is redundant rather than load-bearing, '
    +'and the small circle marks the category, not a direction. Press or focus any chip to read '
    +'the producer\\u2019s own reason for it.</div></div></details>';
}

/* THE VIEWS THAT ALREADY EXIST, REACHED \\u2014 NOT REBUILT. */
function poGoMatchup(pk){
  showTab('matchups');
  try{
    var el=document.getElementById('mxg-'+pk);
    if(!el)return;
    el.scrollIntoView({block:'center'});
    el.classList.add('pohl');
    setTimeout(function(){el.classList.remove('pohl');},2400);
  }catch(e){}
}
function poGoProps(fam,pk){
  try{ppSetMkt(fam);ppSetGame(String(pk));}catch(e){}
  showTab('props');
}
function poBoardRows(fam,pk){
  var bf=D.boardsFull||D.boards||{};
  var rows=[].concat(bf[fam]||[],
    fam==='hr'?(D.hrProps||[]):[],fam==='h1'?(D.hitProps||[]):[]);
  var seen={},n=0;
  for(var i=0;i<rows.length;i++){
    var r=rows[i];
    if(!r||String(r.gamePk)!==String(pk))continue;
    var id=r.playerId==null?('x'+i):('p'+r.playerId);
    if(seen[id])continue;
    seen[id]=1;n++;
  }
  return n;
}
function poLinks(g){
  var pk=g.gamePk,bits=[];
  bits.push('<button type="button" onclick="poGoMatchup('+pk+')">Full matchup card \\u203a</button>');
  var h1=poBoardRows('h1',pk),hr=poBoardRows('hr',pk);
  if(h1)bits.push('<button type="button" onclick="poGoProps(\\'h1\\','+pk+')">'
    +'1+ hit board \\u00b7 '+h1+' \\u203a</button>');
  if(hr)bits.push('<button type="button" onclick="poGoProps(\\'hr\\','+pk+')">'
    +'Home-run board \\u00b7 '+hr+' \\u203a</button>');
  return '<div class="pogo">'+bits.join('')+'</div>';
}

var PO_WIDE=true;"""

# ---------------------------------------------------------------- poWhy tail
WHY_OLD = """  return '<div class="powhy">'
    +(drv.length?'<div class="powhyh">What the model produced</div><ul>'
        +drv.join('')+'</ul>':'')
    +(out.length?'<div class="powhyh"'+(drv.length?' style="margin-top:10px"':'')
        +'>Matchup context \\u2014 inputs and surroundings, not model attribution</div>'
        +'<ul>'+out.join('')+'</ul>':'')
    +'</div>';"""

WHY_NEW = """  /* COLLAPSED, AND THE SUMMARY COUNTS WHAT IS INSIDE IT. A control that
     hides an unknown quantity is a control nobody opens. Open by default on
     a wide viewport, closed on a phone -- collapsing context can only lower
     the apparent strength of a state, never raise it. */
  return '<details class="powhyd"'+(PO_WIDE?' open':'')+'>'
    +'<summary>Why this game looks the way it does \\u2014 '
      +drv.length+' model line'+(drv.length===1?'':'s')+', '
      +out.length+' context line'+(out.length===1?'':'s')+'</summary>'
    +'<div class="powhy">'
    +(drv.length?'<div class="powhyh">What the model produced</div><ul>'
        +drv.join('')+'</ul>':'')
    +(out.length?'<div class="powhyh"'+(drv.length?' style="margin-top:10px"':'')
        +'>Matchup context \\u2014 inputs and surroundings, not model attribution</div>'
        +'<ul>'+out.join('')+'</ul>':'')
    +'</div></details>';"""

# ---------------------------------------------------------------- card body
CARD_OLD = """  return '<div class="pog'+(dead?' dead':'')+'">'
    +'<div class="pogh"><div class="pogt">'+hTeam(aw)+'<span>'+esc(aw||'')+'</span>'
      +'<i>@</i>'+hTeam(hm)+'<span>'+esc(hm||'')+'</span></div>'
      +(s.seriesScoreLine?'<span class="poser">'+esc(s.seriesScoreLine)+'</span>':'')+'</div>'
    +'<div class="pogm">'
      +(s.roundLabel?'<span>'+esc(s.roundLabel)+'</span>':'')
      +(isNum(s.gameNumberInSeries)?'<span>Game '+s.gameNumberInSeries
        +(isNum(s.bestOf)?' of '+s.bestOf:'')+'</span>':'')
      +meta.join('')+'</div>'
    +sp
    +poWhy(g)
    +'<div class="pomk">'+poChips(g)+'</div>'
    +(dead?'<div class="poempty">This game is underway or final, so nothing here is '
      +'actionable. These are the market states as of <b>this publish</b> \\u2014 not a '
      +'frozen pre-first-pitch record. What was recommended before first pitch is kept '
      +'by the pick snapshots, and this card is not that record.</div>':'')
    +'</div>';"""

CARD_NEW = """  /* READING ORDER, WHICH ON A PHONE IS THE WHOLE DESIGN. The card used to
     lead with two starters and seven matchup lines and only then say whether
     there was anything to do. Now: who is playing and who leads the series,
     when and what state the game is in, WHAT IS ACTIONABLE, the starters,
     the market chips with their reasons, and last the collapsed WHY. */
  return '<div class="pog'+(dead?' dead':'')+'">'
    +'<div class="pogh"><div class="pogt">'+hTeam(aw)+'<span>'+esc(aw||'')+'</span>'
      +'<i>@</i>'+hTeam(hm)+'<span>'+esc(hm||'')+'</span></div>'
      +(s.seriesScoreLine?'<span class="poser">'+esc(s.seriesScoreLine)+'</span>':'')+'</div>'
    +'<div class="pogm">'
      +(s.roundLabel?'<span>'+esc(s.roundLabel)+'</span>':'')
      +(isNum(s.gameNumberInSeries)?'<span>Game '+s.gameNumberInSeries
        +(isNum(s.bestOf)?' of '+s.bestOf:'')+'</span>':'')
      +meta.join('')+'</div>'
    +poNow(g)
    +sp
    +'<div class="pomk">'+poChips(g)+'</div>'
    +'<div class="potip"></div>'
    +poWhy(g)
    +poLinks(g)
    +(dead?'<div class="poempty">This game is underway or final, so nothing here is '
      +'actionable. These are the market states as of <b>this publish</b> \\u2014 not a '
      +'frozen pre-first-pitch record. What was recommended before first pitch is kept '
      +'by the pick snapshots, and this card is not that record.</div>':'')
    +'</div>';"""

# ---------------------------------------------------------------- series card
SER_OLD = """  return '<div class="pobs'+(done?' win':'')+'">'
    +row(s.teamAAbbrev,s.winsA,!done||aWin)
    +row(s.teamBAbbrev,s.winsB,!done||bWin)
    +'<div class="pobsl'+(done?' clinched':'')+'">'
      +esc(s.seriesScoreLine||'SERIES STATE UNKNOWN')
      +(done&&s.advancesToRound?' \u2192 '+esc(PO_ROUND_LABEL[s.advancesToRound]||s.advancesToRound):'')
      +'</div></div>';"""

SER_NEW = """  /* WHO ADVANCES AND WHERE, ON ITS OWN LINE. An arrow tacked onto the end
     of a score line is the least legible place to put the one fact a reader
     opens a bracket for. */
  var advTeam=done?(aWin?s.teamAAbbrev:(bWin?s.teamBAbbrev:'')):'';
  var advRound=done&&s.advancesToRound
    ?(PO_ROUND_LABEL[s.advancesToRound]||s.advancesToRound):'';
  return '<div class="pobs'+(done?' win':'')+'">'
    +row(s.teamAAbbrev,s.winsA,!done||aWin)
    +row(s.teamBAbbrev,s.winsB,!done||bWin)
    +'<div class="pobsl'+(done?' clinched':'')+'">'
      +esc(s.seriesScoreLine||'SERIES STATE UNKNOWN')+'</div>'
    +((advTeam||advRound)
      ?'<div class="pobsadv">'+esc(advTeam||'The winner')+' advances'
        +(advRound?' to the '+esc(advRound):'')+'</div>':'')
    +'</div>';"""

# ---------------------------------------------------------------- bracket
BR_OLD = """function poBracket(){
  var b=poBlock()||{},br=b.bracket||{},ser=b.series||{};
  var cols=PO_ROUNDS.map(function(r){
    var ids=br[r]||[];
    var body=ids.length
      ? ids.map(function(id){return ser[id]?poSeriesCard(ser[id]):'';}).join('')
      : '<div class="poempty">not reached</div>';
    return '<div class="pobrr"><div class="pobrh">'+esc(PO_ROUND_LABEL[r]||r)+'</div>'+body+'</div>';
  }).join('');
  return '<div class="pobr">'+cols+'</div>';
}"""

BR_NEW = """/* FOUR COLUMNS IS A DESKTOP BRACKET. Below 700px it is four squeezed
   columns, so the rounds become tabs -- and the switch is CSS, not
   JavaScript, so rotating the phone does not need a re-render and EVERY
   round stays in the DOM. That last part matters: hiding a round by
   removing it would make the coverage and series checks pass by looking at
   less of the page. */
function poSetRound(r){
  var wrap=document.querySelector('#playoffs .pobr');
  if(!wrap)return;
  var cols=wrap.querySelectorAll('.pobrr');
  for(var i=0;i<cols.length;i++)
    cols[i].className='pobrr'+(cols[i].getAttribute('data-round')===r?' on':'');
  var bs=document.querySelectorAll('#playoffs .pobrnav button');
  for(var j=0;j<bs.length;j++){
    var on=bs[j].getAttribute('data-round')===r;
    bs[j].className=on?'on':'';
    bs[j].setAttribute('aria-selected',on?'true':'false');
  }
}

function poBracket(){
  var b=poBlock()||{},br=b.bracket||{},ser=b.series||{};
  var played=PO_ROUNDS.filter(function(r){return (br[r]||[]).length;});
  /* The furthest round that actually has a series -- the one a reader in
     October is looking for. Not a prediction about which round matters. */
  var sel=played.length?played[played.length-1]:PO_ROUNDS[0];
  var nav='<div class="pobrnav" role="tablist" aria-label="Bracket round">'
    +PO_ROUNDS.map(function(r){
      var n=(br[r]||[]).length;
      return '<button type="button" role="tab" data-round="'+r+'"'
        +' aria-selected="'+(r===sel?'true':'false')+'" aria-controls="pobrr-'+r+'"'
        +(n?'':' disabled')
        +' class="'+(r===sel?'on':'')+'" onclick="poSetRound(\\''+r+'\\')">'
        +esc(PO_ROUND_LABEL[r]||r)+' '+(n?('\\u00b7 '+n):'\\u00b7 not reached')+'</button>';
    }).join('')+'</div>';
  var cols=PO_ROUNDS.map(function(r){
    var ids=br[r]||[];
    var body=ids.length
      ? ids.map(function(id){return ser[id]?poSeriesCard(ser[id]):'';}).join('')
      : '<div class="poempty">not reached</div>';
    return '<div class="pobrr'+(r===sel?' on':'')+'" data-round="'+r+'" id="pobrr-'+r+'"'
      +' role="tabpanel" aria-label="'+esc(PO_ROUND_LABEL[r]||r)+'">'
      +'<div class="pobrh">'+esc(PO_ROUND_LABEL[r]||r)+'</div>'+body+'</div>';
  }).join('');
  return nav+'<div class="pobr sel">'+cols+'</div>';
}"""

# ---------------------------------------------------------------- renderPlayoffs
RP_OLD = """  var games=(b.games||[]).slice().sort(function(x,y){
    return String(x.gameDate||'').localeCompare(String(y.gameDate||''));});
  var out=poCoverage();
  out+=hmSec("Today\u2019s playoff games",
    games.length+' game'+(games.length===1?'':'s')+' \u00b7 every canonical game gets a record',
    games.length?('<div class="pogrid">'+games.map(poGameCard).join('')+'</div>')
      :'<div class="poempty">No playoff game is scheduled for this slate date.</div>');"""

RP_NEW = """  /* ONE PLACE DECIDES WHETHER THE WHY BLOCKS START OPEN, and it is read by
     poWhy below, so it must be set before the cards are built. */
  PO_WIDE=(window.innerWidth||1200)>=768;
  var games=(b.games||[]).slice().sort(function(x,y){
    return String(x.gameDate||'').localeCompare(String(y.gameDate||''));});
  /* A COUNT OF GAMES, NOT A RECOMMENDATION. PICK-or-LEAN is the definition
     the legend prints; this only counts how many games have one. */
  var nAct=games.filter(function(g){
    if(poDead(g))return false;
    var mk=g.markets||{};
    return PO_MARKET_ORDER.some(function(k){return PO_ACTIONABLE[String(mk[k])];});
  }).length;
  var out=poCoverage()+poLegend();
  out+=hmSec("Today\u2019s playoff games",
    games.length+' game'+(games.length===1?'':'s')+' \u00b7 every canonical game gets a record \u00b7 '
      +(nAct?(nAct+' with a market at PICK or LEAN')
            :'none with a market at PICK or LEAN'),
    games.length?('<div class="pogrid">'+games.map(poGameCard).join('')+'</div>')
      :'<div class="poempty">No playoff game is scheduled for this slate date.</div>');"""

BRSEC_OLD = """  out+=hmSec('Live bracket \u2014 actual results',
    'reconstructed from the canonical schedule; uses no browser storage',
    poBracket());"""

BRSEC_NEW = """  out+=hmSec('Live bracket \u2014 actual results',
    'reconstructed from the canonical schedule \u00b7 uses no browser storage \u00b7 '
      +'round tabs on a narrow screen, four columns on a wide one',
    poBracket());"""

# ---------------------------------------------------------------- matchup anchor
MX_OLD = """    return '<div class="card"><div class="card-h"><span>'+teamLogo(tm.away)+' '+esc(tm.away)+' @ '+esc(tm.home)+' '+teamLogo(tm.home)+'</span>"""
MX_NEW = """    return '<div class="card" id="mxg-'+g.gamePk+'"><div class="card-h"><span>'+teamLogo(tm.away)+' '+esc(tm.away)+' @ '+esc(tm.home)+' '+teamLogo(tm.home)+'</span>"""

EDITS = [
    ("playoff UX css", CSS_ANCHOR, CSS_NEW),
    ("chips become buttons + reason panel + legend + links", CHIPS_OLD, CHIPS_NEW),
    ("why collapses behind a counted summary", WHY_OLD, WHY_NEW),
    ("card reading order", CARD_OLD, CARD_NEW),
    ("who advances, on its own line", SER_OLD, SER_NEW),
    ("bracket round tabs", BR_OLD, BR_NEW),
    ("legend + actionable count in renderPlayoffs", RP_OLD, RP_NEW),
    ("bracket section subtitle", BRSEC_OLD, BRSEC_NEW),
    ("an anchor on each matchup card", MX_OLD, MX_NEW),
]


# A PATCH THAT CAN BE APPLIED TWICE WILL BE. Most of these anchors vanish
# once they are replaced, so a second run fails closed on its own -- but the
# CSS edit APPENDS to its anchor, so the anchor survives and a second run
# would add a second copy of the stylesheet. Unique is not the same as
# idempotent; this is the guard, and it is checked before anything is read.
ALREADY = "function poTip(btn){"


def patch(text: str, path: str) -> str:
    if ALREADY in text:
        FAIL.append("%s: already carries this release (%r present) -- refusing, "
                    "because the css edit is additive and would duplicate"
                    % (path, ALREADY))
        return text
    for label, old, new in EDITS:
        n = text.count(old)
        if n != 1:
            FAIL.append("%s / %s: anchor found %d time(s), expected 1" % (path, label, n))
            continue
        text = text.replace(old, new, 1)
    return text


def main() -> int:
    out = {}
    for fn in FILES:
        p = pathlib.Path(fn)
        if not p.exists():
            FAIL.append("%s: missing" % fn)
            continue
        s = p.read_text(encoding="utf-8")
        out[fn] = (s, patch(s, fn))
    if FAIL:
        print("ANCHOR FAILURES -- nothing written:")
        for f in FAIL:
            print("  - " + f)
        return 1
    for fn, (before, after) in out.items():
        pathlib.Path(fn).write_text(after, encoding="utf-8")
        print("  patched %-16s %d -> %d bytes" % (fn, len(before), len(after)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
