# _strip_bg_photos.py — قص وإزالة خلفية الصور تلقائياً من مكتبة Photos (نسخة مطورة)
import os
import math
import time
import photos
from PIL import Image

BASE = '/private/var/mobile/Containers/Shared/AppGroup/01D55252-016B-4D8D-9B07-20CEFC4DCBE0/Pythonista3/Documents/alpha_v2'
TARGET = os.path.join(BASE, 'assets', 'k1k', 'k1k')
OUT_SIZE = 512
TOLERANCE = 45  # تحسين طفیف لدقة عزل الخلفية

def corner_color(im):
    w, h = im.size
    px = im.load()
    # أخذ عينات أوسع من الأركان والحواف لضمان دقة لون الخلفية
    pts = [(2, 2), (w-3, 2), (2, h-3), (w-3, h-3), (w//2, 2), (w//2, h-3)]
    rs = gs = bs = 0
    for (x, y) in pts:
        r, g, b, a = px[x, y][:4]
        rs += r; gs += g; bs += b
    n = len(pts)
    return (rs/n, gs/n, bs/n)

def strip_one(im):
    w, h = im.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    # قص مربع متساوي الأبعاد من المنتصف
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
    print('📸 أداة قص وإزالة خلفية الصور الذكية')
    print('=' * 55)

    # اختيار الصور من مكتبة الصور دفعة واحدة
    imgs = photos.pick_image(multi=True)
    if not imgs:
        print('⚠️ لم يتم اختيار أي صور — تم إلغاء العملية.')
        return
    if not isinstance(imgs, list):
        imgs = [imgs]

    print(f'✅ تم اختيار {len(imgs)} صورة.')
    
    # طلب بادئة التسمية مرة واحدة فقط لتجنب إدخال رقم لكل صورة
    prefix = input('أدخل اسم مميز للملفات (اضغط Enter للافتراضي "item"): ').strip()
    if not prefix:
        prefix = 'item'

    print('\nجاري المعالجة والقص وإزالة الخلفية...\n')
    
    timestamp = int(time.time())
    success_count = 0

    for idx, im in enumerate(imgs, start=1):
        if im is None: continue
        if im.mode != 'RGBA':
            im = im.convert('RGBA')

        t0 = time.time()
        try:
            result = strip_one(im)
            filename = f"{prefix}_{timestamp}_{idx}.png"
            dst = os.path.join(TARGET, filename)
            result.save(dst, 'PNG', optimize=True)
            
            ms = int((time.time() - t0) * 1000)
            print(f'  [{idx}/{len(imgs)}] ✅ تم حفظ: {filename} ({ms}ms)')
            success_count += 1
        except Exception as e:
            print(f'  [{idx}/{len(imgs)}] ❌ خطأ أثناء معالجة الصورة: {e}')

    print()
    print('=' * 55)
    print(f'🎉 تم الانتهاء بنجاح! تم معالجة {success_count} من {len(imgs)} صورة.')
    print(f'📁 المجلد النهائي: {TARGET}')
    print('=' * 55)

if __name__ == '__main__':
    main()
