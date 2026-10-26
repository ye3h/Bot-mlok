# _strip_bg_photos.py — يقرأ الصور من مكتبة Photos
import os, math, time
import photos
from PIL import Image

BASE = '/private/var/mobile/Containers/Shared/AppGroup/01D55252-016B-4D8D-9B07-20CEFC4DCBE0/Pythonista3/Documents/alpha_v2'
TARGET = os.path.join(BASE, 'assets', 'k1k', 'k1k')
OUT_SIZE = 512
TOLERANCE = 40

def corner_color(im):
    w, h = im.size
    px = im.load()
    pts = [(2, 2), (w-3, 2), (2, h-3), (w-3, h-3)]
    rs = gs = bs = 0
    for (x, y) in pts:
        r, g, b, a = px[x, y][:4]
        rs += r; gs += g; bs += b
    return (rs/4.0, gs/4.0, bs/4.0)

def strip_one(im):
    w, h = im.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    im = im.crop((left, top, left + side, top + side))
    im = im.resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS)
    bg = corner_color(im)
    px = im.load()
    for y in range(OUT_SIZE):
        for x in range(OUT_SIZE):
            r, g, b, a = px[x, y]
            if a == 0: continue
            dr = r - bg[0]; dg = g - bg[1]; db = b - bg[2]
            if math.sqrt(dr*dr + dg*dg + db*db) < TOLERANCE:
                px[x, y] = (r, g, b, 0)
    return im

def main():
    os.makedirs(TARGET, exist_ok=True)

    print('=' * 55)
    print('📸 اختر 5 صور من مكتبة الصور')
    print('=' * 55)

    imgs = photos.pick_image(multi=True)
    if not imgs:
        print('⚠️ ما اخترت شي — جرّب مرة ثانية')
        return
    if not isinstance(imgs, list):
        imgs = [imgs]

    # لو اختار أقل من 5، نديله فرصة ياخذ الباقي
    names = []
    i = 0
    for im in imgs:
        if im is None: continue
        if im.mode != 'RGBA':
            im = im.convert('RGBA')
        i += 1
        name = 'k1k-star-' + str(i) + '.png'
        names.append(name)

    # حوّلهم وأعطهم أسماء بالترتيب
    for idx, im in enumerate(imgs):
        if im is None: continue
        if im.mode != 'RGBA':
            im = im.convert('RGBA')

        # خلي المستخدم يحدد رقم كل صورة
        print()
        print('الصورة ' + str(idx+1) + ':')
        num = input('  اختار رقم النجمة (1-5): ').strip()
        if not num.isdigit() or int(num) < 1 or int(num) > 20:
            print('  ⚠️ رقم غلط — تخطّيتها')
            continue

        t0 = time.time()
        result = strip_one(im)
        dst = os.path.join(TARGET, 'k1k-star-' + num + '.png')
        result.save(dst, 'PNG', optimize=True)
        ms = int((time.time() - t0) * 1000)
        print('  ✅ k1k-star-' + num + '.png  (' + str(ms) + 'ms)')

    print()
    print('=' * 55)
    print('✅ خلص — الملفات في: ' + TARGET)
    print('=' * 55)

main()
