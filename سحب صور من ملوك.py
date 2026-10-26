# _copy_from_kingdom.py — شغّله مرة وحدة
import os, shutil, glob

KG    = '/private/var/mobile/Containers/Shared/AppGroup/01D55252-016B-4D8D-9B07-20CEFC4DCBE0/Pythonista3/Documents/kingdom_game'
ALPHA = '/private/var/mobile/Containers/Shared/AppGroup/01D55252-016B-4D8D-9B07-20CEFC4DCBE0/Pythonista3/Documents/alpha_v2'

# ═══════════════════════════════════════════════════════
#  ملفات محددة بالاسم (JS/CSS/JSON/إلخ)
# ═══════════════════════════════════════════════════════
FILES = [
    # nav icons
    ('site/assets/nav-icon-settings-DtT5y51M.webp',  'assets/nav/settings.webp'),
    ('site/assets/nav-icon-chat-BUUBBOKs.webp',      'assets/nav/chat.webp'),
    ('site/assets/nav-icon-shop-Wr0N76np.webp',      'assets/nav/shop.webp'),
    ('site/assets/nav-icon-inventory-D66Fo-zf.webp', 'assets/nav/inventory.webp'),
    ('site/assets/nav-icon-friends-BIhvMBB5.webp',   'assets/nav/friends.webp'),
    ('site/assets/nav-icon-arena-Dsktrz9V.webp',     'assets/nav/arena.webp'),
    ('site/assets/nav-icon-tribe-CawiMLsF.webp',     'assets/nav/tribe.webp'),
]

# ═══════════════════════════════════════════════════════
#  أنماط glob (كل الملفات المطابقة)
# ═══════════════════════════════════════════════════════
GLOBS = [
    ('site/assets/shipyard-*.webp',        'assets/markets/shipyard/'),
    ('site/assets/fishmarket-*.webp',      'assets/markets/fishmarket/'),
]

def copy_file(src, dst):
    if not os.path.exists(src):
        return ('miss', src)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)
    return ('ok', dst)

def main():
    print('═' * 55)
    print('📦 نسخ من kingdom_game → alpha_v2')
    print('═' * 55)

    ok = miss = 0

    # ملفات مباشرة
    print('\n[1] ملفات بالاسم:')
    for rel_src, rel_dst in FILES:
        src = os.path.join(KG, rel_src)
        dst = os.path.join(ALPHA, rel_dst)
        status, path = copy_file(src, dst)
        if status == 'ok':
            print('  ✅ ' + rel_dst)
            ok += 1
        else:
            print('  ❌ مفقود: ' + rel_src)
            miss += 1

    # glob patterns
    print('\n[2] أنماط glob:')
    for pattern, rel_dstdir in GLOBS:
        full = os.path.join(KG, pattern)
        matches = glob.glob(full)
        if not matches:
            print('  ❌ لا نتائج: ' + pattern)
            miss += 1
            continue
        dst_dir = os.path.join(ALPHA, rel_dstdir)
        os.makedirs(dst_dir, exist_ok=True)
        for m in matches:
            name = os.path.basename(m)
            shutil.copy2(m, os.path.join(dst_dir, name))
        print('  ✅ ' + str(len(matches)) + ' ملف → ' + rel_dstdir)
        ok += len(matches)

    print('\n' + '═' * 55)
    print('✅ نجح: ' + str(ok) + '  ·  ❌ فشل: ' + str(miss))
    print('═' * 55)

main()
