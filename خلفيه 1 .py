# -*- coding: utf-8 -*-
import os
import ui
from PIL import Image

HOME = '/private/var/mobile/Containers/Shared/AppGroup/01D55252-016B-4D8D-9B07-20CEFC4DCBE0/Pythonista3/Documents'
SHIPS_DIR = os.path.join(HOME, 'alpha_v2', 'assets', 'ships')

WHITE = 240
FEATHER = 30
MIN_ALPHA = 12

TARGETS = [
    'ship-vip-submarine.png',
]

def remove_white(img):
    img = img.convert('RGBA')
    w, h = img.size
    px = img.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            m = min(r, g, b)
            if m >= WHITE:
                px[x, y] = (r, g, b, 0)
            elif m >= WHITE - FEATHER:
                t = (WHITE - m) / float(FEATHER)
                na = int(a * t)
                if na < MIN_ALPHA:
                    na = 0
                px[x, y] = (r, g, b, na)
    return img

def trim(img, pad=6):
    bb = img.getbbox()
    if not bb:
        return img
    x1, y1, x2, y2 = bb
    x1 = max(0, x1 - pad)
    y1 = max(0, y1 - pad)
    x2 = min(img.width, x2 + pad)
    y2 = min(img.height, y2 + pad)
    return img.crop((x1, y1, x2, y2))

print('=== Processing ===')
for fname in TARGETS:
    p = os.path.join(SHIPS_DIR, fname)
    if not os.path.isfile(p):
        print('  FAIL: %s' % fname)
        continue

    before = os.path.getsize(p)
    print('  %s (%.1f KB)' % (fname, before/1024))

    # استخدم ui.Image للتأكد من الدعم
    data = open(p, 'rb').read()
    uimg = ui.Image.from_data(data)

    # حوّل PNG أولاً (قد يكون WEBP بامتداد خاطئ)
    tmp = p + '.tmp.png'
    open(tmp, 'wb').write(uimg.to_png())

    img = Image.open(tmp)
    print('    before: %dx%d' % (img.width, img.height))

    img = remove_white(img)
    img = trim(img, pad=8)
    print('    after:  %dx%d' % (img.width, img.height))

    img.save(p, 'PNG', optimize=True)
    print('    saved: %.1f KB' % (os.path.getsize(p)/1024))

    try: os.remove(tmp)
    except: pass

print()
print('=== Done ===')
