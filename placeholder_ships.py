import os, re, ui

BASE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(BASE, 'data', 'ships.js'), encoding='utf-8').read()

paths = set(re.findall(r"img:\s*['\"](assets/ships/[^'\"]+)['\"]", src))

made = skipped = 0
for rel in sorted(paths):
    full = os.path.join(BASE, rel)
    if os.path.exists(full):
        skipped += 1
        continue
    os.makedirs(os.path.dirname(full), exist_ok=True)
    m = re.search(r'ship-lvl-(\d+)', rel)
    label = 'LV ' + (m.group(1) if m else '?')

    with ui.ImageContext(256, 256) as ctx:
        ui.set_color('#1e3a5f')
        ui.fill_rect(0, 0, 256, 256)
        ui.set_color('#8b5a2b')
        ui.fill_rect(40, 150, 176, 50)
        ui.set_color('#FFD76A')
        ui.fill_rect(0, 200, 256, 56)
        ui.draw_string(label, (0, 40, 256, 80),
                       font=('<system-bold>', 40),
                       color='white', alignment=ui.ALIGN_CENTER)
        img = ctx.get_image()

    with open(full, 'wb') as f:
        f.write(img.to_png())
    made += 1

print('created:', made)
print('already existed:', skipped)
