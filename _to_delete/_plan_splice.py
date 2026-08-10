import re, sys

banner = (
"var TL=D.ticketsLocked,SP=D.slatePlan||{};var lockBan='';"
"function _hm(s){return esc(String(s||'').slice(11,16));}"
"function _ex(){return (SP.excluded?' <span style=\"font-weight:600\">'+SP.excluded+' game(s) at '+esc((SP.excludedAt||[]).join(', '))+' are NOT in this ticket \\u2014 their lineups post after the lock.</span>':'');}"
"if(TL){"
"lockBan='<div class=\"note\" style=\"margin:0 0 10px;padding:10px 12px;background:#dcfce7;color:#166534;border-radius:8px;font-weight:700\">\\ud83d\\udd12 LOCKED '+_hm(TL.at)+' ET \\u2014 READY TO BET. '+esc(TL.trigger||'')+'. Main slate: '+(SP.games||'?')+' games, first pitch '+_hm(SP.firstPitch)+'. These legs are frozen for the rest of the day.'+_ex()+'</div>';"
"}else if(SP.lockAt){"
"lockBan='<div class=\"note\" style=\"margin:0 0 10px;padding:10px 12px;background:#fef3c7;color:#92400e;border-radius:8px;font-weight:700\">\\u23f3 NOT LOCKED \\u2014 locks '+_hm(SP.lockAt)+' ET (15 min before the '+_hm(SP.firstPitch)+' first pitch), or sooner once all lineups post. '+(SP.official||0)+'/'+(SP.games||'?')+' main-slate lineups in. Legs can still change until then.'+_ex()+'</div>';"
"}else{"
"lockBan='<div class=\"note\" style=\"margin:0 0 10px;padding:10px 12px;background:#fef3c7;color:#92400e;border-radius:8px;font-weight:700\">\\u26a0 NOT LOCKED YET \\u2014 waiting on the slate. Wait for the green \\ud83d\\udd12 before betting.</div>';"
"}"
"$('parlay').innerHTML=lockBan+sugg+mlpHtml()+lateHtml()+hpHtml()+form;")

pat = re.compile(r"var TL=D\.ticketsLocked;var lockBan='';.*?\+hpHtml\(\)\+form;", re.S)

for fn in ('current.html', 'index.html', 'preview.html'):
    h = open(fn, encoding='utf-8').read()
    if 'D.slatePlan' in h:
        print(fn, 'already patched'); continue
    if not pat.search(h):
        print(fn, 'BANNER BLOCK NOT FOUND'); sys.exit(1)
    open(fn, 'w', encoding='utf-8').write(pat.sub(lambda m: banner, h, count=1))
    print(fn, 'single-ticket banner installed')
