import sys
old = ("  var hr=((MODEL_DATA.hrProps)||[]).filter(function(x){return x.playerId===pid;})[0]||{};\n"
       "  var hit=((MODEL_DATA.hitProps)||[]).filter(function(x){return x.playerId===pid;})[0]||{};")
new = ("  function _bfRow(k,id){var bf=(MODEL_DATA.boardsFull)||(MODEL_DATA.boards)||{};"
       "return ((bf[k]||[]).filter(function(r){return r.playerId===id;})[0])||null;}\n"
       "  var hr=((MODEL_DATA.hrProps)||[]).filter(function(x){return x.playerId===pid;})[0]||_bfRow('hr',pid)||{};\n"
       "  var hit=((MODEL_DATA.hitProps)||[]).filter(function(x){return x.playerId===pid;})[0]||_bfRow('h1',pid)||{};")
for fn in ('current.html', 'index.html', 'preview.html'):
    h = open(fn, encoding='utf-8').read()
    if '_bfRow' in h:
        print(fn, 'already patched'); continue
    c = h.count(old)
    if c != 1:
        print(fn, 'MARKER COUNT', c); sys.exit(1)
    open(fn, 'w', encoding='utf-8').write(h.replace(old, new))
    print(fn, 'modal fallback installed')
