# serve.py — يلقى منفذ فاضي تلقائياً، ويوقف السيرفر صح
import os
import socket
import threading
import http.server
import socketserver
import time
import ui

# ═══ تحديد مجلد اللعبة ═══
HERE = os.path.dirname(os.path.abspath(__file__))
if os.path.exists(os.path.join(HERE, 'index.html')):
    GAME_DIR = HERE
else:
    GAME_DIR = os.path.join(HERE, 'alpha_v2')

INDEX = os.path.join(GAME_DIR, 'index.html')
if not os.path.exists(INDEX):
    raise SystemExit(f'❌ ما فيه index.html في: {GAME_DIR}')

# ═══ إيجاد منفذ فاضي تلقائياً ═══
def find_free_port(start=8765, end=8900):
    for port in range(start, end):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            continue
    raise SystemExit(f'❌ ما لقيت منفذ فاضي بين {start} و {end}')

PORT = find_free_port()

# ═══ Handler ═══
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=GAME_DIR, **kwargs)
    
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()
    
    def log_message(self, fmt, *args):
        print(f'[{self.client_address[0]}] {fmt % args}')

# ═══ شغّل السيرفر ═══
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(('', PORT), Handler)
threading.Thread(target=httpd.serve_forever, daemon=True).start()
time.sleep(0.5)

print(f'✅ {GAME_DIR}')
print(f'🌐 http://localhost:{PORT}/index.html')

# ═══ افتح WebView ═══
wv = ui.WebView()
wv.load_url(f'http://localhost:{PORT}/index.html')
wv.present('fullscreen')

# ═══ نظّف بعد ما يقفل WebView ═══
httpd.shutdown()
httpd.server_close()
print('⛔ السيرفر توقف')
