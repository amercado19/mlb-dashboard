import sys
old = "$('parlay').innerHTML=sugg+mlpHtml()+hpHtml()+form;"
new = ("var lockBan='';"
 "if(D.ticketsLocked){lockBan='<div class=\"note\" style=\"margin:0 0 10px;padding:9px 12px;background:#dcfce7;color:#166534;border-radius:8px;font-weight:700\">\\ud83d\\udd12 LOCKED \\u2014 READY TO BET. Lineups confirmed at '+esc(String(D.ticketsLocked.at||'').replace('T',' ').slice(0,16))+' ET. These legs are frozen for the rest of the day \\u2014 later refreshes will not change them. (A late scratch voids that leg at your book; the rest of the ticket stands.)</div>';}"
 "else{lockBan='<div class=\"note\" style=\"margin:0 0 10px;padding:9px 12px;background:#fef3c7;color:#92400e;border-radius:8px;font-weight:700\">\\u26a0 NOT LOCKED YET \\u2014 lineups still projected. Legs can change on the next refresh. Wait for the green \\ud83d\\udd12 before betting.</div>';}"
 "$('parlay').innerHTML=lockBan+sugg+mlpHtml()+hpHtml()+form;")
for fn in ('current.html', 'index.html', 'preview.html'):
    h = open(fn, encoding='utf-8').read()
    c = h.count(old)
    if 'ticketsLocked' in h:
        print(fn, 'already patched'); continue
    if c != 1:
        print(fn, 'MARKER COUNT', c); sys.exit(1)
    open(fn, 'w', encoding='utf-8').write(h.replace(old, new))
    print(fn, 'banner added')
