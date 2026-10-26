import os, shutil
ROOT = "/private/var/mobile/Containers/Shared/AppGroup/01D55252-016B-4D8D-9B07-20CEFC4DCBE0/Pythonista3/Documents/alpha_v2"
MOD = os.path.join(ROOT, "modules")

# نسخة احتياطية
shutil.copy2(
    os.path.join(MOD, "hub.js"),
    os.path.join(MOD, "_hub_backup.js")
)
print("✅ نسخة احتياطية: modules/_hub_backup.js")

# احذف hub.js من MODULE_LIST لتجاوز المشكلة فوراً
REG = os.path.join(ROOT, "js", "registry.js")
with open(REG, encoding="utf-8") as f:
    reg = f.read()

NEW_LIST = """var MODULE_LIST = [
  'fleet_bridge',
  'fleet',
  'fleet_icons',
  'boat_actions',
  'boat_constant_speed',
  'ship_market',
  'store',
  'leaderboard',
  'lucky_box',
  'profile'
];"""

import re
reg = re.sub(r'var MODULE_LIST = \[[\s\S]*?\];', NEW_LIST, reg)
with open(REG, "w", encoding="utf-8") as f:
    f.write(reg)
print("✅ hub.js محذوف من MODULE_LIST — اللعبة تشتغل بدونه مؤقتاً")
