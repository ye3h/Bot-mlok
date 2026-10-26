import os, re, datetime, shutil

BASE = os.path.dirname(os.path.abspath(__file__))
TARGETS = ['data/ships.js', 'data/fish.js', 'js/game.js', 'modules/store.js']
EXTS = ['.webp', '.png', '.jpg', '.jpeg', '.gif']
PATH_RE = re.compile(r"(['\"])(assets/[^'\"]+)\1")

def find_replacement(rel):
    folder, name = os.path.split(rel)
    stem, ext = os.path.splitext(name)
    if not ext:
        return None
    fullfolder = os.path.join(BASE, folder)
    if not os.path.isdir(fullfolder):
        return None
    cands = []
    for f in os.listdir(fullfolder):
        s, e = os.path.splitext(f.lower())
        if e not in EXTS:
            continue
        if s == stem.lower() or s.startswith(stem.lower() + '-'):
            cands.append(f)
    if not cands:
        return None
    def rank(f):
        e = os.path.splitext(f)[1].lower()
        return (0 if e == '.webp' else 1 if e == '.png' else 2, len(f), f)
    cands.sort(key=rank)
    return (folder + '/' + cands[0]).replace(os.sep, '/')

def fix_file(rel, stamp, report):
    full = os.path.join(BASE, rel)
    if not os.path.exists(full):
        report.append('ملف غير موجود: ' + rel)
        return 0
    text = open(full, encoding='utf-8').read()
    counter = [0]

    def sub(m):
        q, p = m.group(1), m.group(2)
        if os.path.exists(os.path.join(BASE, p)):
            return m.group(0)
        new = find_replacement(p)
        if new is None:
            report.append('بدون بديل: ' + p)
            return m.group(0)
        counter[0] += 1
        report.append('تم: ' + p + '  ->  ' + new)
        return q + new + q

    new_text = PATH_RE.sub(sub, text)
    if counter[0]:
        shutil.copy2(full, full + '.bak_' + stamp)
        open(full, 'w', encoding='utf-8').write(new_text)
    return counter[0]

stamp = datetime.datetime.now().strftime('%H%M%S')
report = []
total = 0
for t in TARGETS:
    total += fix_file(t, stamp, report)

fixed = [r for r in report if r.startswith('تم')]
unresolved = [r for r in report if r.startswith('بدون')]
for r in fixed:
    print(r)
print('--- عدد المصلحة:', total)
print('--- بدون بديل:', len(unresolved))
for r in unresolved[:15]:
    print(r)
if len(unresolved) > 15:
    print('... و', len(unresolved) - 15, 'غيرها')
