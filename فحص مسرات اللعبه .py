# assets_audit.py — فحص ملفات اللعبة والمسارات (Pythonista)
# يكتب تقرير assets_report.txt داخل مجلد اللعبة، ولا يحذف ولا يعدّل أي ملف
import os
import re
from collections import defaultdict

ROOT = os.path.dirname(os.path.abspath(__file__))
REPORT_NAME = 'assets_report.txt'
REPORT = os.path.join(ROOT, REPORT_NAME)

CATS = [
    ('صور',    {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'}),
    ('أصوات',  {'.mp3', '.wav', '.ogg', '.m4a', '.aac'}),
    ('فيديو',  {'.mp4', '.webm', '.mov'}),
    ('خطوط',   {'.ttf', '.otf', '.woff', '.woff2'}),
    ('أكواد',  {'.js', '.css', '.html', '.json'}),
]
ASSET_CATS = {'صور', 'أصوات', 'فيديو', 'خطوط'}
TEXT_EXT = {'.html', '.js', '.css', '.json'}

# مسارات تبدأ بـ assets/ داخل الأكواد
REF_ASSETS = re.compile(r'''[\w./-]*assets/[^\s"'`()<>,;?#{}$]*''')
# مسارات تبدأ بمجلدات صوت مثل sounds/ أو audio/
REF_DIRS = re.compile(r'''(?<![\w/.-])(?:sounds|audio|music|sfx|sound)/[^\s"'`()<>,;?#{}$]*''')


def fmt_size(n):
    if n < 1024:
        return '%d B' % n
    if n < 1024 * 1024:
        return '%.1f KB' % (n / 1024.0)
    return '%.2f MB' % (n / 1024.0 / 1024.0)


def category(rel):
    ext = os.path.splitext(rel)[1].lower()
    for name, exts in CATS:
        if ext in exts:
            return name
    return 'أخرى'


def walk():
    out = []
    for dp, dns, fns in os.walk(ROOT):
        dns[:] = [d for d in dns if not d.startswith('.')]
        for f in fns:
            if f.startswith('.') or f == REPORT_NAME:
                continue
            full = os.path.join(dp, f)
            rel = os.path.relpath(full, ROOT).replace(os.sep, '/')
            try:
                size = os.path.getsize(full)
            except OSError:
                size = 0
            out.append((rel, size))
    out.sort()
    return out


def norm_ref(s):
    if 'assets/' in s:
        return s[s.index('assets/'):]
    return s


def scan_refs(files):
    refs = defaultdict(set)
    for rel, _ in files:
        if os.path.splitext(rel)[1].lower() not in TEXT_EXT:
            continue
        try:
            with open(os.path.join(ROOT, rel), encoding='utf-8', errors='ignore') as fh:
                txt = fh.read()
        except OSError:
            continue
        for m in REF_ASSETS.finditer(txt):
            refs[norm_ref(m.group(0))].add(rel)
        for m in REF_DIRS.finditer(txt):
            refs[m.group(0)].add(rel)
    return refs


def is_dynamic(p):
    # مسار ينتهي بـ / أو بدون امتداد يعتبر بادئة (مثل 'assets/fish/' + id)
    return p.endswith('/') or '.' not in os.path.basename(p)


def is_ref(rel, refs):
    if rel in refs:
        return True
    for p in refs:
        if p in ('assets/', 'sounds/', 'audio/') or not is_dynamic(p):
            continue
        if rel.startswith(p):
            return True
    return False


def missing_refs(refs, filepaths):
    res = []
    for p, srcs in sorted(refs.items()):
        if is_dynamic(p):
            if p in ('assets/', 'sounds/', 'audio/'):
                continue
            if not any(f.startswith(p) for f in filepaths):
                res.append((p, 'مسار ديناميكي بدون ملفات', srcs))
        elif p not in filepaths:
            res.append((p, 'الملف غير موجود', srcs))
    return res


def unreferenced(files, refs):
    return [(rel, size) for rel, size in files
            if category(rel) in ASSET_CATS and not is_ref(rel, refs)]


def duplicates(files):
    d = defaultdict(list)
    for rel, _ in files:
        if category(rel) in ASSET_CATS:
            d[os.path.basename(rel)].append(rel)
    return dict((k, v) for k, v in d.items() if len(v) > 1)


def build_report(files, refs, filepaths):
    lines = []
    add = lines.append
    line = '=' * 60

    total = sum(s for _, s in files)
    add('تقرير ملفات اللعبة')
    add('مجلد اللعبة: ' + ROOT)
    add('عدد الملفات: %d · الحجم الكلي: %s' % (len(files), fmt_size(total)))
    add('')

    # ملخص حسب النوع
    cats = defaultdict(lambda: [0, 0])
    for rel, size in files:
        c = category(rel)
        cats[c][0] += 1
        cats[c][1] += size
    add(line)
    add('الملخص حسب النوع')
    add(line)
    for name in [c[0] for c in CATS] + ['أخرى']:
        if name in cats:
            add('%-10s %5d ملف   %s' % (name, cats[name][0], fmt_size(cats[name][1])))
    add('')

    # شجرة المجلدات
    folders = defaultdict(lambda: [0, 0])
    for rel, size in files:
        folder = os.path.dirname(rel) or '(الجذر)'
        folders[folder][0] += 1
        folders[folder][1] += size
    add(line)
    add('المجلدات (عدد الملفات والحجم)')
    add(line)
    for folder in sorted(folders):
        depth = 0 if folder == '(الجذر)' else folder.count('/') + 1
        add('%s%s  — %d ملف · %s' % ('   ' * depth, folder, folders[folder][0], fmt_size(folders[folder][1])))
    add('')

    # كل الملفات حسب النوع
    add(line)
    add('كل الملفات حسب النوع')
    add(line)
    for name in [c[0] for c in CATS] + ['أخرى']:
        items = [(r, s) for r, s in files if category(r) == name]
        if not items:
            continue
        add('')
        add('--- %s (%d) ---' % (name, len(items)))
        for rel, size in items:
            add('%-60s %s' % (rel, fmt_size(size)))
    add('')

    # مسارات مكسورة
    miss = missing_refs(refs, filepaths)
    add(line)
    add('مسارات مستخدمة في الكود لكنها غير موجودة: %d' % len(miss))
    add(line)
    for p, why, srcs in miss:
        add('• %s  (%s)' % (p, why))
        add('    يُستخدم في: ' + ', '.join(sorted(srcs)[:3]))
    if not miss:
        add('لا يوجد ✓')
    add('')

    # ملفات غير مستخدمة
    unused = unreferenced(files, refs)
    unused_size = sum(s for _, s in unused)
    add(line)
    add('ملفات صور/أصوات/فيديو/خطوط لا يشير لها الكود: %d · الحجم: %s' % (len(unused), fmt_size(unused_size)))
    add(line)
    add('(قد تكون مستخدمة بطريقة لا يكتشفها الفحص، راجعها قبل الحذف)')
    for rel, size in unused:
        add('• %-60s %s' % (rel, fmt_size(size)))
    if not unused:
        add('لا يوجد ✓')
    add('')

    # أسماء مكررة
    dups = duplicates(files)
    add(line)
    add('ملفات بنفس الاسم في أكثر من مجلد: %d' % len(dups))
    add(line)
    for name in sorted(dups):
        add('• ' + name)
        for p in dups[name]:
            add('    ' + p)
    if not dups:
        add('لا يوجد ✓')

    return '\n'.join(lines)


def main():
    files = walk()
    refs = scan_refs(files)
    filepaths = set(r for r, _ in files)
    text = build_report(files, refs, filepaths)

    with open(REPORT, 'w', encoding='utf-8') as fh:
        fh.write(text)

    miss = missing_refs(refs, filepaths)
    unused = unreferenced(files, refs)
    print('تم الفحص ✓')
    print('الملفات: %d' % len(files))
    print('مسارات مكسورة: %d' % len(miss))
    print('ملفات غير مستخدمة: %d' % len(unused))
    print('التقرير: ' + REPORT)


if __name__ == '__main__':
    main()
