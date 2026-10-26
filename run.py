import ui
import os

HERE = os.path.dirname(os.path.abspath(__file__))

# إذا كان السكربت داخل مجلد اللعبة نفسه، استخدم HERE. وإلا استخدم alpha_v2
if os.path.exists(os.path.join(HERE, 'index.html')):
    GAME_DIR = HERE
else:
    GAME_DIR = os.path.join(HERE, 'alpha_v2')

index = os.path.join(GAME_DIR, 'index.html')

if not os.path.exists(index):
    raise SystemExit('لم أجد index.html في: ' + GAME_DIR)

print('تشغيل من:', GAME_DIR)

wv = ui.WebView()
wv.load_url('file://' + index)
wv.present('fullscreen')
