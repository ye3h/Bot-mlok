import os, ui

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, 'ship_source.webp.webp')
DST = os.path.join(BASE, 'assets', 'ships', 'level_31', 'ship-lvl-31.webp')

src_img = ui.Image.named(SRC)
if src_img is None:
    src_img = ui.Image.open(SRC)

w, h = src_img.size
print('source size:', w, h)

os.makedirs(os.path.dirname(DST), exist_ok=True)

with ui.ImageContext(256, 256) as ctx:
    src_img.draw(0, 0, 256, 256)
    out = ctx.get_image()

with open(DST, 'wb') as f:
    f.write(out.to_png())

print('saved:', DST)
