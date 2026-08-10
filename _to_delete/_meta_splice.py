import sys
old = "function renderMeta(){var n=(D.gameCards||[]).length;var upd=D.generatedAt?new Date(D.generatedAt).toLocaleString():'—';$('meta').innerHTML='<span>'+esc(D.date||'')+'</span><span>'+n+' games today</span><span>updated '+esc(upd)+'</span><span>'+esc(D.version||'')+'</span><button class=\"rf\" onclick=\"refresh()\">↻ Refresh</button>';"
new = ("function renderMeta(){var n=(D.gameCards||[]).length;var upd=D.generatedAt?new Date(D.generatedAt).toLocaleString():'—';"
 "var ageM=D.generatedAt?Math.round((Date.now()-new Date(D.generatedAt).getTime())/60000):null;"
 "var ageCol=ageM==null?'var(--muted)':ageM>90?'#b45309':ageM>150?'#b91c1c':'var(--accent)';"
 "var ageChip=ageM==null?'':'<span style=\"font-weight:800;color:'+ageCol+'\" title=\"How old this page\\'s data is. Lineups/SPs posted after this moment are NOT here yet — hit Pull fresh.\">data '+(ageM<60?ageM+'m':Math.floor(ageM/60)+'h'+(ageM%60)+'m')+' old</span>';"
 "var lu=D.lineupsProjected?'<span style=\"font-weight:800;color:#b45309\" title=\"At least one lineup was still unposted at run time — props/tickets used season stats for those teams\">lineups: PROJECTED</span>':'<span style=\"font-weight:800;color:var(--accent)\">lineups: OFFICIAL</span>';"
 "var pull='<a href=\"https://github.com/amercado19/mlb-pipeline/actions/workflows/daily-picks.yml\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border:1.5px solid var(--accent,#0c7a43);border-radius:7px;background:none;color:var(--accent,#0c7a43);font-family:var(--mono);font-weight:700;font-size:11px;cursor:pointer;text-decoration:none\" title=\"Runs the FULL pipeline now — fresh lineups, starting pitchers, odds, weather (~2–3 min). On the GitHub page press the green Run workflow button, wait, then reload this page.\">🔄 Pull fresh lineups</a>';"
 "$('meta').innerHTML='<span>'+esc(D.date||'')+'</span><span>'+n+' games today</span><span>updated '+esc(upd)+'</span>'+ageChip+lu+'<span>'+esc(D.version||'')+'</span>'+pull+'<button class=\"rf\" onclick=\"refresh()\">↻ Refresh</button>';")
for fn in ('current.html', 'index.html', 'preview.html'):
    h = open(fn, encoding='utf-8').read()
    if 'Pull fresh lineups' in h:
        print(fn, 'already patched'); continue
    c = h.count(old)
    if c != 1:
        print(fn, 'MARKER COUNT', c); sys.exit(1)
    open(fn, 'w', encoding='utf-8').write(h.replace(old, new))
    print(fn, 'meta patched')
