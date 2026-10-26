import os

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, 'data')
path = os.path.join(DATA, 'progression.js')

code = """// data/progression.js
const XP_THRESH = [0, 0];
for (let L = 2; L <= 500; L++) {
  XP_THRESH[L] = XP_THRESH[L - 1] + Math.round(11.6 * Math.pow(L - 1, 1.6));
}
"""

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print('written:', path)
print('data folder now contains:', os.listdir(DATA))
