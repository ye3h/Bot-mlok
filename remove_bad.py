import os

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
bad = os.path.join(DATA, 'progression.js ')

if os.path.exists(bad):
    os.remove(bad)
    print('deleted bad file')
else:
    print('bad file not found')

print('data folder now contains:', os.listdir(DATA))
