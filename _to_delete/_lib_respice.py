import sys
block = open('_libblock_v2.txt', encoding='utf-8').read()
sm = "var LIB_TAB='safe';"
em = "  $('library').innerHTML=bar+body;\n}"
for fn in ('current.html', 'index.html', 'preview.html'):
    h = open(fn, encoding='utf-8').read()
    if 'libTicketSummary' in h:
        print(fn, 'already current'); continue
    a = h.find(sm); b = h.find(em)
    if a < 0 or b < 0 or b < a:
        print(fn, 'MARKERS MISSING', a, b); sys.exit(1)
    open(fn, 'w', encoding='utf-8').write(h[:a] + block + h[b + len(em):])
    print(fn, 'library re-spliced')
