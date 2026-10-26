# _add_kraken_fish.py — 3 مراحل: تعديل الملفات + الصور + الأسماء
import os, shutil, time, math
import photos
from PIL import Image

BASE = '/private/var/mobile/Containers/Shared/AppGroup/01D55252-016B-4D8D-9B07-20CEFC4DCBE0/Pythonista3/Documents/alpha_v2'

def bak(p):
    if os.path.exists(p):
        shutil.copy2(p, p + '.bak_' + str(int(time.time())))

# ═══════════════════════════════════════════════════════
# [1/3] تعديل data/fish.js
# ═══════════════════════════════════════════════════════
print('=' * 55)
print('[1/3] data/fish.js')
print('=' * 55)

p1 = os.path.join(BASE, 'data', 'fish.js')
with open(p1, 'r', encoding='utf-8') as f:
    c1 = f.read()

old1 = "  // \u2500\u2500\u2500 LEGENDARY (1) \u2500\u2500\u2500"
new1 = """  // \u2500\u2500\u2500 KRAKEN EXCLUSIVE (4) \u2500\u2500\u2500
  kraken_spawn:  { name:'\u0646\u0633\u0644 \u0627\u0644\u0643\u0631\u0627\u0643\u0646',    base:40,  rarity:'epic',    emoji:'\U0001f419', img:'assets/fish/kraken_spawn.webp' },
  ink_wraith:    { name:'\u0637\u064a\u0641 \u0627\u0644\u062d\u0628\u0631',     base:46,  rarity:'epic',    emoji:'\U0001f47b', img:'assets/fish/ink_wraith.webp' },
  abyss_watcher: { name:'\u0645\u0631\u0627\u0642\u0628 \u0627\u0644\u0647\u0627\u0648\u064a\u0629', base:52,  rarity:'epic',    emoji:'\U0001f441\ufe0f', img:'assets/fish/abyss_watcher.webp' },
  void_serpent:  { name:'\u062b\u0639\u0628\u0627\u0646 \u0627\u0644\u0641\u0631\u0627\u063a',    base:62,  rarity:'mythic',  emoji:'\U0001f30c', img:'assets/fish/void_serpent.webp' },

  // \u2500\u2500\u2500 LEGENDARY (1) \u2500\u2500\u2500"""

if old1 in c1:
    bak(p1)
    c1 = c1.replace(old1, new1, 1)
    with open(p1, 'w', encoding='utf-8') as f:
        f.write(c1)
    print('  OK fish.js')
else:
    print('  FAIL fish.js')

# ═══════════════════════════════════════════════════════
# [2/3] تعديل data/ships.js + fish_market.js
# ═══════════════════════════════════════════════════════
print()
print('=' * 55)
print('[2/3] ships.js + fish_market.js')
print('=' * 55)

p2 = os.path.join(BASE, 'data', 'ships.js')
with open(p2, 'r', encoding='utf-8') as f:
    c2 = f.read()
old2 = "fishPool:['kraken','leviathan','poseidon','megalodon']"
new2 = "fishPool:['kraken_spawn','ink_wraith','abyss_watcher','void_serpent']"
if old2 in c2:
    bak(p2)
    c2 = c2.replace(old2, new2, 1)
    with open(p2, 'w', encoding='utf-8') as f:
        f.write(c2)
    print('  OK ships.js')
else:
    print('  SKIP ships.js (\u0645\u0639\u062f\u0644 \u0633\u0627\u0628\u0642\u0627\u064b)')

p3 = os.path.join(BASE, 'modules', 'fish_market.js')
with open(p3, 'r', encoding='utf-8') as f:
    c3 = f.read()
old3 = "'royal_amethyst','diamond_manta','silver_arowana',\n    'black_dragon'"
new3 = "'royal_amethyst','diamond_manta','silver_arowana',\n    'kraken_spawn','ink_wraith','abyss_watcher','void_serpent',\n    'black_dragon'"
if old3 in c3:
    bak(p3)
    c3 = c3.replace(old3, new3, 1)
    with open(p3, 'w', encoding='utf-8') as f:
        f.write(c3)
    print('  OK fish_market.js')
else:
    print('  SKIP fish_market.js (\u0645\u0639\u062f\u0644 \u0633\u0627\u0628\u0642\u0627\u064b)')

# ═══════════════════════════════════════════════════════
# [3/3] اختيار الصور + شيل الخلفية + تغيير الأسماء
# ═══════════════════════════════════════════════════════
print()
print('=' * 55)
print('[3/3] الصور الأربع')
print('=' * 55)
print()
print('اختر 4 صور بالترتيب:')
print('  1) \U0001f419 \u0646\u0633\u0644 \u0627\u0644\u0643\u0631\u0627\u0643\u0646 (kraken_spawn)')
print('  2) \U0001f47b \u0637\u064a\u0641 \u0627\u0644\u062d\u0628\u0631 (ink_wraith)')
print('  3) \U0001f441\ufe0f \u0645\u0631\u0627\u0642\u0628 \u0627\u0644\u0647\u0627\u0648\u064a\u0629 (abyss_watcher)')
print('  4) \U0001f30c \u062b\u0639\u0628\u0627\u0646 \u0627\u0644\u0641\u0631\u0627\u063a (void_serpent)')
print()

FISH_DIR = os.path.join(BASE, 'assets', 'fish')
os.makedirs(FISH_DIR, exist_ok=True)

NAMES = ['kraken_spawn', 'ink_wraith', 'abyss_watcher', 'void_serpent']
SIZE = 512
TOL = 40

def corner_color(im):
    w, h = im.size
    px = im.load()
    pts = [(2, 2), (w-3, 2), (2, h-3), (w-3, h-3)]
    rs = gs = bs = 0
    for (x, y) in pts:
        r, g, b, a = px[x, y][:4]
        rs += r; gs += g; bs += b
    return (rs/4.0, gs/4.0, bs/4.0)

def strip_and_save(im, out_path):
    # اقص مربع مركزي
    w, h = im.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    im = im.crop((left, top, left + side, top + side))
    im = im.resize((SIZE, SIZE), Image.LANCZOS)

    # شيل الخلفية
    bg = corner_color(im)
    px = im.load()
    for y in range(SIZE):
        for x in range(SIZE):
            r, g, b, a = px[x, y]
            if a == 0: continue
            dr = r - bg[0]; dg = g - bg[1]; db = b - bg[2]
            if math.sqrt(dr*dr + dg*dg + db*db) < TOL:
                px[x, y] = (r, g, b, 0)

    # احفظ كـ PNG (يشتغل مع .webp في الـimg src — بعض المتصفحات تقبل)
    im.save(out_path, 'PNG', optimize=True)
    # احفظ نسخة webp لو مدعوم
    try:
        webp_path = out_path.replace('.png', '.webp')
        im.save(webp_path, 'WEBP', quality=88, method=6)
        return out_path, webp_path
    except:
        return out_path, None

picked = photos.pick_image(multi=True)
if not picked:
    print('  \u26a0\ufe0f ما اخترت صور')
else:
    if not isinstance(picked, list):
        picked = [picked]
    picked = [im for im in picked if im is not None]

    print()
    print('  عدد الصور اللي اخترتها: ' + str(len(picked)))
    print()

    for i, im in enumerate(picked):
        if i >= 4:
            print('  \u26a0\ufe0f \u062a\u062c\u0627\u0648\u0632\u062a 4 \u0635\u0648\u0631 \u2014 \u0623\u062a\u062c\u0627\u0647\u0644 \u0627\u0644\u0628\u0627\u0642\u064a')
            break

        if im.mode != 'RGBA':
            im = im.convert('RGBA')

        name = NAMES[i]
        png_path = os.path.join(FISH_DIR, name + '.png')

        t0 = time.time()
        try:
            png, webp = strip_and_save(im, png_path)
            ms = int((time.time() - t0) * 1000)
            print('  \u2705 ' + name + '  (' + str(ms) + 'ms)  \u2192  ' +
                  ('PNG' + (' + WEBP' if webp else '')))
        except Exception as e:
            print('  \u274c ' + name + ' \u2014 ' + str(e))

    # حدث fish.js: بدل .webp بـ .png (لأن الحفظ PNG + WEBP)
    print()
    print('  \u062a\u062d\u062f\u064a\u062b fish.js \u0628\u0627\u0644\u0627\u0645\u062a\u062f\u0627\u062f \u0627\u0644\u0635\u062d\u064a\u062d...')
    with open(p1, 'r', encoding='utf-8') as f:
        c1 = f.read()

    for name in NAMES:
        png_exists = os.path.exists(os.path.join(FISH_DIR, name + '.png'))
        webp_exists = os.path.exists(os.path.join(FISH_DIR, name + '.webp'))
        if png_exists and not webp_exists:
            # نحول .webp إلى .png في fish.js
            old_path = "assets/fish/" + name + ".webp"
            new_path = "assets/fish/" + name + ".png"
            if old_path in c1:
                c1 = c1.replace(old_path, new_path)
                print('    ' + name + ': .webp \u2192 .png')
        elif webp_exists:
            print('    ' + name + ': .webp \u2713')

    with open(p1, 'w', encoding='utf-8') as f:
        f.write(c1)

print()
print('=' * 55)
print('\u2705 \u062e\u0644\u0635')
print('=' * 55)
print()
print('\u0627\u0641\u062a\u062d Safari \u0645\u0646 \u062c\u062f\u064a\u062f:')
print('  \u2022 \u0633\u0648\u0642 \u0627\u0644\u0633\u0645\u0643 \u2192 \u0627\u0644\u0645\u0643\u062a\u0634\u0641 \u2192 \u0645\u0641\u0631\u0648\u0636 4 \u0623\u0633\u0645\u0627\u0643 \u062c\u062f\u064a\u062f\u0629 \u0631\u0645\u0627\u062f\u064a\u0629')
print('  \u2022 \u0633\u0648\u0642 \u0627\u0644\u0633\u0641\u0646 \u2192 \u0627\u0644\u0643\u0631\u0627\u0643\u0646 \u2192 \u0645\u0641\u0631\u0648\u0636 \u064a\u0639\u0631\u0636 \u0627\u0644\u0623\u0633\u0645\u0627\u0643 \u0627\u0644\u0623\u0631\u0628\u0639')
