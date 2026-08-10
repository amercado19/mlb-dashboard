import re, sys

helpers = (
"function lbFmt(t){return esc(String(t||'').replace('T',' ').slice(0,16));}\n"
"function lateHtml(){\n"
"  var lt=D.lateTickets;if(!lt)return '';\n"
"  var lk=D.ticketsLocked&&D.ticketsLocked.late;\n"
"  function card(t){\n"
"    if(!t||!(t.legs||[]).length)return '';\n"
"    var legs=t.legs.map(function(l){return '<div class=\"prow\"><span class=\"pnm\" style=\"cursor:default\">'+(l.rank||'')+'. '+esc(l.desc||'')+'</span><span class=\"pmetric\">'+Math.round((l.prob||0)*100)+'%</span></div>';}).join('');\n"
"    var hp=(t.combined||{}).hitPct;\n"
"    return '<div class=\"card\"><div class=\"card-h\"><span>\\ud83c\\udf19 '+esc(t.name||'')+'</span><span class=\"t\">'+(hp!=null?'~'+hp+'% hit':'')+(lk?' \\u00b7 \\ud83d\\udd12 locked':' \\u00b7 \\u23f3 may change until late lock')+'</span></div><div class=\"card-b\">'+legs+(t.note?'<div class=\"note\" style=\"margin-top:8px;padding:0\">\\u2699 '+esc(t.note)+'</div>':'')+'</div></div>';\n"
"  }\n"
"  return card(lt.ticket1)+card(lt.mlParlay);\n"
"}\n")

banner = (
"var TL=D.ticketsLocked;var lockBan='';"
"if(TL&&TL.early){"
"lockBan='<div class=\"note\" style=\"margin:0 0 6px;padding:9px 12px;background:#dcfce7;color:#166534;border-radius:8px;font-weight:700\">\\ud83d\\udd12 EARLY-SLATE tickets LOCKED '+lbFmt(TL.early.at)+' ET ('+esc(TL.early.trigger||'')+') \\u2014 READY TO BET. These legs are frozen; a late scratch voids that leg at your book.</div>';"
"if(TL.hasLate){"
"if(TL.late){lockBan+='<div class=\"note\" style=\"margin:0 0 10px;padding:9px 12px;background:#dcfce7;color:#166534;border-radius:8px;font-weight:700\">\\ud83c\\udf19 LATE-SLATE tickets LOCKED '+lbFmt(TL.late.at)+' ET \\u2014 READY TO BET.</div>';}"
"else{var li=TL.lateInfo||{};lockBan+='<div class=\"note\" style=\"margin:0 0 10px;padding:9px 12px;background:#fef3c7;color:#92400e;border-radius:8px;font-weight:700\">\\ud83c\\udf19 LATE slate NOT locked \\u2014 '+(li.official||0)+'/'+(li.n||'?')+' late lineups in (first pitch '+lbFmt(li.earliest)+' ET). The \\ud83c\\udf19 Late tickets below can still change; bet the early tickets now, the late ones after their \\ud83d\\udd12.</div>';}"
"}"
"}else if(TL){"
"var ei=TL.earlyInfo||{};"
"lockBan='<div class=\"note\" style=\"margin:0 0 10px;padding:9px 12px;background:#fef3c7;color:#92400e;border-radius:8px;font-weight:700\">\\u26a0 NOT LOCKED YET \\u2014 '+(ei.official||0)+'/'+(ei.n||'?')+' early lineups in. Legs can change on the next refresh; wait for the green \\ud83d\\udd12 before betting.</div>';"
"}else{"
"lockBan='<div class=\"note\" style=\"margin:0 0 10px;padding:9px 12px;background:#fef3c7;color:#92400e;border-radius:8px;font-weight:700\">\\u26a0 NOT LOCKED YET \\u2014 lineups still projected. Wait for the green \\ud83d\\udd12 before betting.</div>';"
"}"
"$('parlay').innerHTML=lockBan+sugg+mlpHtml()+lateHtml()+hpHtml()+form;")

old_isMLP = "var isMLP=function(p){return /^(Moneyline|ML|\\+1\\.5 run line|F5 ML) Parlay/i.test(p.name||'');};"
new_isMLP = "var isMLP=function(p){return /^(Late )?(Moneyline|ML|\\+1\\.5 run line|F5 ML) Parlay/i.test(p.name||'');};"

pat = re.compile(r"var lockBan='';if\(D\.ticketsLocked\)\{.*?\+hpHtml\(\)\+form;", re.S)

for fn in ('current.html', 'index.html', 'preview.html'):
    h = open(fn, encoding='utf-8').read()
    if 'lateHtml' in h:
        print(fn, 'already patched'); continue
    if not pat.search(h):
        print(fn, 'BANNER BLOCK NOT FOUND'); sys.exit(1)
    h = pat.sub(lambda m: banner, h, count=1)
    # un-escape: re.sub treats backslashes; simpler to verify below
    c = h.count("var MLP_STAKE=10;")
    if c != 1:
        print(fn, 'MLP anchor count', c); sys.exit(1)
    h = h.replace("var MLP_STAKE=10;", helpers + "var MLP_STAKE=10;", 1)
    if h.count(old_isMLP) == 1:
        h = h.replace(old_isMLP, new_isMLP, 1)
    else:
        print(fn, 'WARN isMLP marker count', h.count(old_isMLP))
    open(fn, 'w', encoding='utf-8').write(h)
    print(fn, 'late-phase patched')
