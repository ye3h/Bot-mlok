# -*- coding: utf-8 -*-
"""فحص شامل لمشروع alpha_v2 على Pythonista
يحفظ التقرير في _full_inspection_report.txt داخل نفس المجلد
"""
import os, re, ast, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
REPORT_PATH = os.path.join(ROOT, '_full_inspection_report.txt')
SKIP_FILES = {'_full_inspection_report.txt'}
SKIP_DIRS = {'__pycache__', '.git'}
TEXT_EXTS = {'.py', '.js', '.html', '.htm', '.css', '.json', '.txt', '.md'}

# حروف تدل على ترميز مكسور (mojibake) أو حروف مخفية
BAD_CHARS = re.compile('[\u00c3\u00c2\u00d8\u00d9\u00d0\u00d1\ufffd\u200b\u200c\u200d\ufeff]')
HTML_REF_RE = re.compile(r'''(?:src|href)\s*=\s*["']([^"'#?]+)["']''', re.I)
FILE_MENTION_RE = re.compile(r'[\w\-./]+\.(?:js|html?|json|css|txt)\b')

out = []
def log(s=''):
    out.append(s)

def human(n):
    for unit in ['B', 'KB', 'MB', 'GB']:
        if n < 1024:
            return '%d%s' % (n, unit) if unit == 'B' else '%.1f%s' % (n, unit)
        n /= 1024.0
    return '%.1fGB' % n

def rel(p):
    return os.path.relpath(p, ROOT)

def all_files():
    for dp, dns, fns in os.walk(ROOT):
        dns[:] = [d for d in dns if d not in SKIP_DIRS]
        for f in sorted(fns):
            if f not in SKIP_FILES:
                yield os.path.join(dp, f)

def read_text(path):
    raw = open(path, 'rb').read()
    info = {
        'size': len(raw),
        'bom': raw.startswith(b'\xef\xbb\xbf'),
        'crlf': b'\r\n' in raw,
    }
    try:
        text = raw.decode('utf-8-sig')
        info['utf8'] = True
    except UnicodeDecodeError as e:
        info['utf8'] = False
        info['decode_err'] = str(e)
        text = raw.decode('utf-8', errors='replace')
    return text, info

def check_python(path, text):
    try:
        tree = ast.parse(text, filename=path)
    except SyntaxError as e:
        log('   [خطأ syntax] سطر %s: %s' % (e.lineno, e.msg))
        return
    log('   syntax: OK')
    mods = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for a in node.names:
                mods.add(a.name.split('.')[0])
        elif isinstance(node, ast.ImportFrom) and node.module:
            mods.add(node.module.split('.')[0])
    log('   imports: ' + (', '.join(sorted(mods)) or '-'))

def check_js(text):
    # فحص أولي تقريبي: يحذف التعليقات والنصوص ثم يعد الأقواس
    stripped = re.sub(r'//[^\n]*', '', text)
    stripped = re.sub(r'/\*.*?\*/', '', stripped, flags=re.S)
    stripped = re.sub(r'"(?:\\.|[^"\\\n])*"|\'(?:\\.|[^\'\\\n])*\'|`(?:\\.|[^`\\])*`', '""', stripped, flags=re.S)
    pairs = {'{': '}', '(': ')', '[': ']'}
    closers = {v: k for k, v in pairs.items()}
    stack = []
    for i, ch in enumerate(stripped):
        if ch in pairs:
            stack.append((ch, stripped.count('\n', 0, i) + 1))
        elif ch in closers:
            if not stack or stack[-1][0] != closers[ch]:
                log('   [تحذير JS] قوس غير متوازن قرب سطر %d' % (stripped.count('\n', 0, i) + 1))
                return
            stack.pop()
    if stack:
        log('   [تحذير JS] أقواس مفتوحة بدون إغلاق، أول واحد سطر %d' % stack[0][1])
    else:
        log('   JS brackets: متوازنة (فحص أولي)')

def check_html_refs(path, text):
    base = os.path.dirname(path)
    missing = []
    for ref in HTML_REF_RE.findall(text):
        if ref.startswith(('http://', 'https://', '//', 'data:')):
            continue
        target = os.path.normpath(os.path.join(base, ref))
        if not os.path.exists(target):
            missing.append(ref)
    return missing

# ---------- 1. شجرة الملفات ----------
log('=' * 60)
log('تقرير فحص alpha_v2')
log('الوقت: %s' % datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
log('المسار: %s' % ROOT)
log('=' * 60)

files = list(all_files())
total = 0
log('\n## 1. قائمة الملفات')
for p in files:
    s = os.path.getsize(p)
    total += s
    log('%-60s %s' % (rel(p), human(s)))
log('\nعدد الملفات: %d | الحجم الكلي: %s' % (len(files), human(total)))

# ---------- 2. حجم المجلدات الأولى ----------
log('\n## 2. حجم المجلدات')
dir_sizes = {}
for p in files:
    top = rel(p).split(os.sep)[0] if os.sep in rel(p) else '(جذر المشروع)'
    dir_sizes[top] = dir_sizes.get(top, 0) + os.path.getsize(p)
for name, size in sorted(dir_sizes.items(), key=lambda x: -x[1]):
    log('%-40s %s' % (name, human(size)))

# ---------- 3. فحص كل ملف نصي ----------
log('\n## 3. فحص الملفات النصية')
all_text = {}
for p in files:
    ext = os.path.splitext(p)[1].lower()
    if ext not in TEXT_EXTS:
        continue
    text, info = read_text(p)
    all_text[p] = text
    log('\n--- %s' % rel(p))
    log('   utf8: %s | BOM: %s | CRLF: %s' % (info['utf8'], info['bom'], info['crlf']))
    if not info['utf8']:
        log('   [خطأ ترميز] %s' % info.get('decode_err', ''))
    bad = BAD_CHARS.findall(text)
    if bad:
        log('   [تحذير] حروف مشوهة أو مخفية: %d حرف' % len(bad))
        # أول 3 أسطر فيها الحروف المشوهة
        shown = 0
        for n, line in enumerate(text.splitlines(), 1):
            if BAD_CHARS.search(line):
                log('     سطر %d: %s' % (n, line.strip()[:100]))
                shown += 1
                if shown >= 3:
                    break
    if ext == '.py':
        check_python(p, text)
    elif ext == '.js':
        check_js(text)
    elif ext in ('.html', '.htm'):
        miss = check_html_refs(p, text)
        if miss:
            log('   [ملفات مفقودة مرجعها في HTML]')
            for m in miss:
                log('     - %s' % m)
        else:
            log('   HTML refs: كلها موجودة')

# ---------- 4. ملفات تُستدعى من بايثون وغير موجودة ----------
log('\n## 4. مراجع في ملفات بايثون غير موجودة')
existing_names = {os.path.basename(p) for p in files}
found_missing = False
for p, text in all_text.items():
    if not p.endswith('.py'):
        continue
    for mention in set(FILE_MENTION_RE.findall(text)):
        name = os.path.basename(mention)
        candidates = [os.path.join(os.path.dirname(p), mention),
                      os.path.join(ROOT, mention)]
        if not any(os.path.exists(c) for c in candidates) and name not in existing_names:
            log('%s -> %s' % (rel(p), mention))
            found_missing = True
if not found_missing:
    log('لا يوجد شي مفقود')

# ---------- 5. ملفات النسخ الاحتياطية ----------
log('\n## 5. النسخ الاحتياطية')
backups = [d for d in os.listdir(ROOT) if d.startswith('backup') and os.path.isdir(os.path.join(ROOT, d))]
if backups:
    for b in sorted(backups):
        bpath = os.path.join(ROOT, b)
        size = sum(os.path.getsize(os.path.join(dp, f))
                   for dp, _, fns in os.walk(bpath) for f in fns)
        log('%-45s %s' % (b, human(size)))
else:
    log('لا يوجد')

log('\n' + '=' * 60)
log('انتهى الفحص')

report = '\n'.join(out)
with open(REPORT_PATH, 'w', encoding='utf-8') as f:
    f.write(report)

print(report)
print('\nالتقرير محفوظ في: _full_inspection_report.txt')
