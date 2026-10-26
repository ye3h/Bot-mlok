import os

HERE = os.path.dirname(os.path.abspath(__file__))

# إذا كان السكربت داخل alpha_v2 (يوجد index.html بجانبه) نستخدم HERE
# وإلا نبحث عن مجلد alpha_v2 بجانبه
if os.path.exists(os.path.join(HERE, 'index.html')):
    ROOT = HERE
else:
    ROOT = os.path.join(HERE, 'alpha_v2')

OUT = os.path.join(HERE, 'alpha_v2_files.txt')

lines = []
stats = {'files': 0, 'folders': 0, 'bytes': 0}


def human(n):
    for unit in ['B', 'KB', 'MB', 'GB']:
        if n < 1024:
            return '%.1f %s' % (n, unit)
        n /= 1024.0
    return '%.1f TB' % n


def walk(path, prefix=''):
    try:
        names = os.listdir(path)
    except OSError as e:
        lines.append(prefix + '[تعذر القراءة: %s]' % e)
        return

    # المجلدات أولاً ثم الملفات، كل مجموعة أبجدياً
    names.sort(key=lambda s: (not os.path.isdir(os.path.join(path, s)), s.lower()))

    for i, name in enumerate(names):
        full = os.path.join(path, name)
        last = (i == len(names) - 1)
        branch = '└── ' if last else '├── '
        child_prefix = prefix + ('    ' if last else '│   ')

        if os.path.isdir(full):
            stats['folders'] += 1
            lines.append(prefix + branch + name + '/')
            walk(full, child_prefix)
        else:
            stats['files'] += 1
            try:
                size = os.path.getsize(full)
            except OSError:
                size = 0
            stats['bytes'] += size
            lines.append(prefix + branch + name + '  (' + human(size) + ')')


if not os.path.isdir(ROOT):
    print('المجلد غير موجود:', ROOT)
else:
    lines.append(os.path.basename(ROOT) + '/')
    walk(ROOT)
    lines.append('')
    lines.append('المجلدات: %d' % stats['folders'])
    lines.append('الملفات: %d' % stats['files'])
    lines.append('الحجم الكلي: ' + human(stats['bytes']))

    text = '\n'.join(lines)
    print(text)

    try:
        with open(OUT, 'w', encoding='utf-8') as f:
            f.write(text)
        print('\nتم الحفظ في: ' + OUT)
    except OSError as e:
        print('تعذر الحفظ: %s' % e)
