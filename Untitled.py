import os
base = '/private/var/mobile/Containers/Shared/AppGroup/01D55252-016B-4D8D-9B07-20CEFC4DCBE0/Pythonista3/Documents/kingdom_game'

for sub in ['_seed/_gameplay', '_seed/rpc', '_seed/_clean_acc1']:
    p = os.path.join(base, sub)
    print('═' * 55)
    print(sub, '→', p)
    print('═' * 55)
    if not os.path.isdir(p):
        print('  !! غير موجود')
        continue
    files = sorted(os.listdir(p))
    total = 0
    for f in files:
        fp = os.path.join(p, f)
        if os.path.isfile(fp):
            sz = os.path.getsize(fp)
            total += sz
            print('  %8.1f KB  %s' % (sz/1024, f))
    print('  ---')
    print('  %d ملف، %.1f KB' % (len(files), total/1024))
    print()
