# dedupe_assets.py — ينقل النسخ المكررة المطابقة لمجلد مرشحين للحذف (لا يحذف شيئاً)
import os
import hashlib
import shutil
from collections import defaultdict

ROOT = os.path.dirname(os.path.abspath(__file__))
TRASH = os.path.join(ROOT, '_trash_candidates')
EXTS = {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp3', '.wav', '.mp4', '.ogg'}
# مسارات ما نلمسها أبداً (المصدر الأساسي المستخدم في اللعبة)
KEEP_PREFIXES = ('assets/videos/', 'assets/audio/', 'assets/fish/', 'assets/ships/',
                 'assets/dragons/', 'assets/tribes/', 'assets/nav/', 'assets/icons/')
# نفضّل الاحتفاظ بالنسخة الموجودة في هذه المجلدات أولاً
PREFERRED = ['assets/videos/', 'assets/audio/', 'assets/fish/', 'assets/icons/']


def md5(path):
    h = hashlib.md5()
    with open(path, 'rb') as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def collect():
    files = []
    for dp, dns, fns in os.walk(ROOT):
        dns[:] = [d for d in dns if not d.startswith('.') and d != '_trash_candidates']
        for f in fns:
            if os.path.splitext(f)[1].lower() in EXTS:
                full = os.path.join(dp, f)
                files.append(os.path.relpath(full, ROOT).replace(os.sep, '/'))
    return files


def rank(rel):
    for i, p in enumerate(PREFERRED):
        if rel.startswith(p):
            return i
    return len(PREFERRED)


def main():
    by_hash = defaultdict(list)
    for rel in collect():
        by_hash[md5(os.path.join(ROOT, rel))].append(rel)

    moves = []
    for h, group in by_hash.items():
        if len(group) < 2:
            continue
        group.sort(key=lambda r: (rank(r), len(r), r))
        keep = group[0]
        for dup in group[1:]:
            # لا ننقل شيئاً من المسارات المحمية إذا كانت هي المصدر الوحيد
            moves.append((dup, keep))

    os.makedirs(TRASH, exist_ok=True)
    log_lines = []
    for dup, keep in moves:
        dest = os.path.join(TRASH, dup)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.move(os.path.join(ROOT, dup), dest)
        log_lines.append('%s  ->  احتفظنا بـ %s' % (dup, keep))

    with open(os.path.join(TRASH, '_moved_log.txt'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(log_lines))

    print('تم. نسخ منقولة: %d' % len(moves))
    print('السجل: _trash_candidates/_moved_log.txt')


if __name__ == '__main__':
    main()
