# ═══════════════════════════════════════════════════════════════════════════
# 🤖 بوت اللعبة الآلي (v1.1.0) - يشغل اللعبة، يبيع، يصطاد، ويطور
# ═══════════════════════════════════════════════════════════════════════════

import os
import socket
import threading
import http.server
import socketserver
import time
import ui
import json
import console  # ═══ استيراد console بدلاً من objc_util ═══

# منع قفل الشاشة (عشان البوت يشتغل وانت نايم)
console.set_idle_timer_disabled(True) 

HERE = os.path.dirname(os.path.abspath(__file__))
if os.path.exists(os.path.join(HERE, 'index.html')):
    GAME_DIR = HERE
else:
    GAME_DIR = os.path.join(HERE, 'alpha_v2')

INDEX = os.path.join(GAME_DIR, 'index.html')
LOG_FILE = os.path.join(HERE, 'bot_log.txt')

# ═══ إعداد السيرفر المحلي ═══
def find_free_port(start=8765, end=8900):
    for port in range(start, end):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            continue
    raise SystemExit('❌ ما لقيت منفذ فاضي')

PORT = find_free_port()

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=GAME_DIR, **kwargs)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()
    def log_message(self, fmt, *args):
        pass

socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(('', PORT), Handler)
threading.Thread(target=httpd.serve_forever, daemon=True).start()
time.sleep(0.5)

# ═══ كود البوت الذكي (JavaScript) ═══
JS_BOT = """
(function() {
    if (window.__botRunning) return;
    window.__botRunning = true;
    window.botLogs = [];
    
    function log(msg) {
        var time = new Date().toLocaleTimeString('en-US', { hour12: false });
        window.botLogs.push('[' + time + '] ' + msg);
    }
    
    log('Bot started.');
    
    setInterval(function() {
        try {
            var st = window.state;
            if (!st) return;
            
            // 1. بيع كل السمك المتوفر
            if (typeof sellAll === 'function') {
                var keys = Object.keys(st.inventory || {});
                if (keys.length > 0) {
                    sellAll();
                    log('Sold all fish in inventory.');
                }
            }
            
            // 2. إبحار السفن الراسية
            var fleet = window.ModuleRegistry ? window.ModuleRegistry.get('fleet') : null;
            if (fleet && fleet.ships) {
                fleet.ships.forEach(function(ship) {
                    if (ship.st === 'docked') {
                        fleet.toggleTrip(ship);
                        log('Ship ' + ship.def.name + ' set to sail.');
                    }
                });
            }
            
            // 3. التطويرات والشراء
            if (window.shipsUtils && window.rpcShips) {
                var u = window.shipsUtils;
                
                // تطوير مخزن السمك
                var fmLv = st.fishMarket ? st.fishMarket.level : 1;
                var fmCost = u.fishMarketUpgradeCost(fmLv);
                if (fmCost && !fmCost.max && st.coins >= fmCost.cost_coins && !st.fishMarket.upgrading_to) {
                    var res = window.rpcShips('fish_market_start_upgrade');
                    if (!res.error) log('Started Fish Market upgrade to Lv.' + (fmLv+1));
                }
                
                // تطوير سوق السفن
                var smLv = st.market ? st.market.level : 1;
                var smCost = u.marketUpgradeCost(smLv);
                if (smCost && !smCost.max && st.coins >= smCost.cost_coins && !st.market.upgrading_to) {
                    var req = u.fishMarketReqFor(smLv + 1);
                    if (req === 0 || (st.fishMarketLevel || 1) >= req) {
                        var res = window.rpcShips('market_start_upgrade');
                        if (!res.error) log('Started Ship Market upgrade to Lv.' + (smLv+1));
                    }
                }
                
                // شراء السفن
                var ships = window.SHIPS || [];
                for (var i = ships.length - 1; i >= 0; i--) {
                    var ship = ships[i];
                    if (ship.tribeOnly) continue;
                    if (ship.level <= smLv) {
                        var owned = (st.ships || []).some(function(s){ return s.code === ship.code; });
                        if (!owned && st.coins >= ship.price) {
                            if (u.fleetCount() < 3 || u.storageCount() < u.storageCapacity()) {
                                var res = window.rpcShips('buy_ship_by_code', { _code: ship.code, _price_coins: ship.price, _max_hp: ship.hp });
                                if (!res.error) {
                                    log('Bought new ship: ' + ship.name);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            
        } catch(e) {
            log('ERR: ' + e.message);
        }
    }, 5000);
})();
"""

# ═══ ربط البوت مع الواجهة وكتابة الملفات ═══
class BotWebView(ui.WebView):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.log_file = open(LOG_FILE, 'a', encoding='utf-8')
        self.log_file.write("\n--- 🤖 Bot Session Started ---\n")
        self.last_log_count = 0
        self.timer = None
        
    def webview_did_finish_load(self, webview):
        print("Page loaded. Injecting bot...")
        self.eval_js(JS_BOT)
        self.start_polling()
        
    def start_polling(self):
        self.timer = threading.Timer(5.0, self.poll_logs)
        self.timer.start()
        
    def poll_logs(self):
        try:
            logs_json = self.eval_js("JSON.stringify(window.botLogs || [])")
            if logs_json:
                logs = json.loads(logs_json)
                if len(logs) > self.last_log_count:
                    for msg in logs[self.last_log_count:]:
                        print(msg)
                        self.log_file.write(msg + "\n")
                    self.log_file.flush()
                    self.last_log_count = len(logs)
                    
                    # تنظيف المصفوفة
                    if self.last_log_count > 100:
                        self.eval_js("window.botLogs = window.botLogs.slice(-10);")
                        self.last_log_count = 10
        except Exception as e:
            print("Poll error:", e)
        self.start_polling()

# تشغيل WebView
wv = BotWebView()
wv.load_url(f'http://localhost:{PORT}/index.html')
wv.present('fullscreen')

httpd.shutdown()
httpd.server_close()
