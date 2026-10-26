import os, re
from collections import defaultdict

BASE = os.path.dirname(os.path.abspath(__file__))
seen = defaultdict(list)
pat = re.compile(r'^(?:function|const|let|var)\s+([A-Za-z_$][\w$]*)', re.M)

for root, _, files in os.walk(os.path.join(BASE, 'js')):
    for f in files:
        if not f.endswith('.js') or f.endswith('.bak_191852'):
            continue
        p = os.path.join(root, f)
        for name in pat.findall(open(p, encoding='utf-8').read()):
            seen[name].append(os.path.relpath(p, BASE))

for name, where in sorted(seen.items()):
    if len(where) > 1:
        print(name, '->', ', '.join(where))
