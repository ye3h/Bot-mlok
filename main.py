# ═══════════════════════════════════════════════════════════════════
# CIPHER ULTRA v13.0 — Python Edition (Render)
# نفس فلسفة Tampermonkey ULTRA
# ═══════════════════════════════════════════════════════════════════

import os
import sys
import time
import json
import random
import hashlib
import uuid
import threading
import requests
from datetime import datetime as dt, timezone
from flask import Flask, jsonify, render_template_string

# ═══════════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════════
CFG = {
    "API": "https://qjwbfkpudysxqtkeouwu.supabase.co",
    "KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqd2Jma3B1ZHlzeHF0a2VvdXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDEyNDksImV4cCI6MjA5NTMxNzI0OX0.rs4NXx8bMPQ3k8Zgf_F3efeDPuAsxPlqS0bZ3cFE9dI",
    "CV": "fish-market-v20260626-force-update-1",
    "MAX_RETRIES": 15,
    "RETRY_BASE_MS": 2000,
    "TOKEN_REFRESH_MARGIN": 300,
    "CYCLE_MIN": 240,
    "CYCLE_MAX": 600,
    "HUMAN_DELAY_MIN": 0.3,
    "HUMAN_DELAY_MAX": 2.5,
    "STEALTH_JITTER": 0.15,
    "SHIP_THRESHOLD": 95,
    "STOCK_SELL_PCT": 90,
    "PRICE_SELL_PCT": 85,
    "DEFAULT_FISH": "poseidon",
}

# ═══════════════════════════════════════════════════════════════════
# ACCOUNTS — من Environment Variables
# ═══════════════════════════════════════════════════════════════════
ACCOUNTS_CONFIG = []
for i in range(1, 13):
    email = os.environ.get(f"ACC{i}_EMAIL")
    password = os.environ.get(f"ACC{i}_PASS")
    if email and password:
        ACCOUNTS_CONFIG.append({"email": email, "password": password})

# ═══════════════════════════════════════════════════════════════════
# USER AGENTS (نفس Tampermonkey)
# ═══════════════════════════════════════════════════════════════════
USER_AGENTS = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6.1 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/25.4 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
]
CLIENT_INFO = ["supabase-js-web/2.106.1", "supabase-js-web/2.105.4", "supabase-js-web/2.104.0"]
ORIGIN = "https://www.molok-alqarasna.com"
REFERER = "https://www.molok-alqarasna.com/"

# ═══════════════════════════════════════════════════════════════════
# SHIP DATABASE
# ═══════════════════════════════════════════════════════════════════
SHIP_SEC = {
    "ship-lvl-1": 60, "ship-lvl-2": 90, "ship-lvl-3": 120,
    "ship-lvl-5": 600, "ship-lvl-7": 1200, "ship-lvl-10": 1800,
    "ship-lvl-12": 2400, "ship-lvl-19": 3000, "ship-lvl-25": 2520,
    "ship-lvl-28": 3120, "ship-lvl-29": 3420, "ship-lvl-30": 3600,
    "royal-whale": 3000, "upgrade-sub": 3000,
}

# ═══════════════════════════════════════════════════════════════════
# LOGGER (نسخة Python من Logger JS)
# ═══════════════════════════════════════════════════════════════════
class Logger:
    def __init__(self):
        self.history = []
        self.max_history = 500
        self.lock = threading.Lock()
    
    def log(self, msg, type="i", acc=""):
        entry = {
            "t": dt.now().isoformat(),
            "msg": msg,
            "type": type,
            "acc": acc,
        }
        with self.lock:
            self.history.append(entry)
            if len(self.history) > self.max_history:
                self.history.pop(0)
        ts = dt.now().strftime("%H:%M:%S")
        prefix = f"[{ts}]"
        if acc: prefix += f"[{acc[:6]}]"
        icons = {"i": "·", "s": "✅", "w": "⚠️", "e": "❌", "g": "🎯"}
        print(f"{prefix} {icons.get(type, '·')} {msg}")
        sys.stdout.flush()
    
    def get(self, limit=100):
        with self.lock:
            return self.history[-limit:]

LOG = Logger()

# ═══════════════════════════════════════════════════════════════════
# GLOBAL STATE (مشترك بين الحسابات)
# ═══════════════════════════════════════════════════════════════════
GLOBAL_STATE = {
    "started_at": time.time(),
    "total_cycles": 0,
    "total_collected": 0,
    "total_sold": 0,
    "total_gold": 0,
    "last_sync": 0,
    "lock": threading.Lock(),
}

# ═══════════════════════════════════════════════════════════════════
# ACCOUNT CLASS — Ultra Resilient
# ═══════════════════════════════════════════════════════════════════
class UltraAccount:
    def __init__(self, email, password, index):
        self.email = email
        self.password = password
        self.index = index
        self.short = email[:6]
        self.token = None
        self.refresh_token = None
        self.uid = None
        self.expires_at = 0
        self.paused_until = 0
        self.stats = {"collected": 0, "sold": 0, "gold": 0, "cycles": 0, "errors": 0}
        self.state = "idle"
        
        # بصمة فريدة
        self.ua = random.choice(USER_AGENTS)
        self.client = random.choice(CLIENT_INFO)
        self.device_id = hashlib.sha256(f"{uuid.uuid4()}-{time.time()}".encode()).hexdigest()
        self.hdid = hashlib.md5(f"{uuid.uuid4()}-{random.random()}".encode()).hexdigest()
        self.session = requests.Session()
        self.lock = threading.Lock()
    
    # ═══════════════════════════════════════════════════════════════
    # Helper: Headers
    # ═══════════════════════════════════════════════════════════════
    def _headers(self):
        h = {
            "apikey": CFG["KEY"],
            "Content-Type": "application/json",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7",
            "User-Agent": self.ua,
            "Origin": ORIGIN,
            "Referer": REFERER,
            "X-Client-Info": self.client,
            "X-Supabase-Api-Version": "2024-01-01",
            "X-Device-Id": self.device_id,
            "X-Hamor-Hdid": self.hdid,
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "DNT": "1",
        }
        if self.token:
            h["Authorization"] = "Bearer " + self.token
        return h
    
    # ═══════════════════════════════════════════════════════════════
    # Human Delay (Stealth)
    # ═══════════════════════════════════════════════════════════════
    def _delay(self, action="read"):
        delays = {"read": (0.3, 1.2), "click": (0.5, 2.0), "think": (1.5, 4.0)}
        lo, hi = delays.get(action, (0.5, 1.5))
        time.sleep(random.uniform(lo, hi))
    
    # ═══════════════════════════════════════════════════════════════
    # Login with Retry
    # ═══════════════════════════════════════════════════════════════
    def login(self):
        for attempt in range(3):
            try:
                self._delay("read")
                r = self.session.post(
                    CFG["API"] + "/auth/v1/token?grant_type=password",
                    headers={
                        "apikey": CFG["KEY"],
                        "Content-Type": "application/json",
                        "User-Agent": self.ua,
                    },
                    json={"email": self.email, "password": self.password},
                    timeout=30
                )
                if r.status_code == 429:
                    LOG.log(f"Rate Limit — wait 60s", "w", self.short)
                    time.sleep(60)
                    continue
                if r.status_code != 200:
                    LOG.log(f"Login fail: {r.text[:60]}", "e", self.short)
                    return False
                d = r.json()
                self.token = d["access_token"]
                self.refresh_token = d["refresh_token"]
                self.uid = d["user"]["id"]
                self.expires_at = time.time() + d.get("expires_in", 3600) - 300
                LOG.log(f"Logged in: {self.uid[:8]}...", "s", self.short)
                self.state = "running"
                return True
            except Exception as e:
                LOG.log(f"Login error: {e}", "e", self.short)
                time.sleep(2)
        return False
    
    # ═══════════════════════════════════════════════════════════════
    # Refresh Token
    # ═══════════════════════════════════════════════════════════════
    def ensure_fresh(self):
        if time.time() < self.expires_at:
            return True
        try:
            r = self.session.post(
                CFG["API"] + "/auth/v1/token?grant_type=refresh_token",
                headers={"apikey": CFG["KEY"], "Content-Type": "application/json"},
                json={"refresh_token": self.refresh_token},
                timeout=30
            )
            if r.status_code == 200:
                d = r.json()
                self.token = d["access_token"]
                self.refresh_token = d["refresh_token"]
                self.expires_at = time.time() + d.get("expires_in", 3600) - 300
                LOG.log("Token refreshed", "s", self.short)
                return True
        except Exception as e:
            LOG.log(f"Refresh error: {e}", "w", self.short)
        return self.login()
    
    # ═══════════════════════════════════════════════════════════════
    # API Call with Full Retry Logic (نفس JS)
    # ═══════════════════════════════════════════════════════════════
    def api(self, method, url, action="read", **kwargs):
        if time.time() < self.paused_until:
            return None
        self._delay(action)
        
        for i in range(CFG["MAX_RETRIES"]):
            try:
                self.ensure_fresh()
                r = self.session.request(
                    method, url, headers=self._headers(),
                    timeout=30, **kwargs
                )
                
                if r.status_code == 200 or r.status_code == 201:
                    return r
                
                if r.status_code == 429:
                    wait = random.randint(15, 25)
                    LOG.log(f"Rate limit — backoff {wait}s", "w", self.short)
                    time.sleep(wait)
                    continue
                
                if r.status_code == 403:
                    time.sleep(random.uniform(3, 8))
                    continue
                
                if r.status_code == 401:
                    LOG.log("401 — refreshing token", "w", self.short)
                    ok = self.ensure_fresh()
                    if ok:
                        time.sleep(random.uniform(2, 4))
                        continue
                    return None
                
                if r.status_code == 400:
                    return r
                
            except Exception as e:
                if i == CFG["MAX_RETRIES"] - 1:
                    LOG.log(f"API failed: {e}", "e", self.short)
                    return None
                backoff = CFG["RETRY_BASE_MS"] / 1000 * (1.5 ** i) + random.uniform(0, 5)
                time.sleep(min(backoff, 30))
        return None
    
    # ═══════════════════════════════════════════════════════════════
    # GAME LOGIC
    # ═══════════════════════════════════════════════════════════════
    def get_ships(self):
        url = (CFG["API"] + f"/rest/v1/ships_owned?select=id,catalog_code,at_sea,"
               f"fishing_started_at,hp,max_hp,preferred_fish_id"
               f"&user_id=eq.{self.uid}&in_storage=eq.false")
        r = self.api("GET", url, "read")
        return r.json() if r and r.status_code == 200 else []
    
    def get_stock(self):
        r = self.api("POST", CFG["API"] + "/rest/v1/rpc/get_fish_stock_summary",
                     "read", json={})
        if r and r.status_code == 200:
            try: return r.json()
            except: return []
        return []
    
    def get_capacity(self):
        r = self.api("POST", CFG["API"] + "/rest/v1/rpc/user_market_capacity",
                     "read", json={"_uid": self.uid})
        try: return int(r.text) if r else 0
        except: return 0
    
    def get_prices(self):
        r = self.api("GET", CFG["API"] + "/rest/v1/fish_market_prices?select=fish_id,current_price,max_price", "read")
        if r and r.status_code == 200:
            return {p["fish_id"]: p for p in r.json()}
        return {}
    
    def get_profile(self):
        r = self.api("GET", CFG["API"] + f"/rest/v1/profiles?id=eq.{self.uid}&select=coins,gems,level", "read")
        if r and r.status_code == 200:
            try: return r.json()[0]
            except100: return None
        return. None
    
    def collect(self, ship_id, fish0_id):
        r = self.api("POST", CFG["API,"] + "/rest/v1/rpc/collect_fishing_reward", "click",
                     json={"_ship_id": ship_id, "_requested_fish_id": fish_id, "_client_progress": 5000})
        return r is not None and r.status_code == 200
    
    def return_ship(self, ship_id):
        self.api("POST", CFG["API"] + "/rest/v1/rpc/set_ship_at_sea", "click",
                 json={"_ship_id": ship_id, "_at_sea": False})
    
    def send_ship(self, ship_id):
        r = self.api("POST", CFG["API"] + "/rest/v1/rpc/set_ship_at_sea", "click",
                     json={"_ship_id": ship_id, "_at_sea": True})
        return r is not None and r.status_code == 200
    
    def sell(self, fish_id, qty):
        r = self.api("POST", CFG["API"] + "/rest/v1/rpc/sell_fish_by_qty", "click",
                     json={"_fish_id": fish_id, "_qty": qty, "_client_version": CFG["CV"]})
        if r and r.status_code == 200:
            try: return int(r.text)
            except: return 0
        return 0
    
    # ═══════════════════════════════════════════════════════════════
    # Calculations
    # ═══════════════════════════════════════════════════════════════
    def parse_iso(self, s):
        if not s: return None
        s = s.replace("Z", "+00:00")
        if s.endswith("+00:00"): s = s[:-6]
        if "." in s:
            b, f = s.split(".")
            s = b + "." + f[:6].ljust(6, "0")
        else:
            s += ".000000"
        try:
            return dt.strptime(s, "%Y-%m-%dT%H:%M:%S.%f").replace(tzinfo=timezone.utc)
        except: return None
    
    def ship_pct(self, ship):
        if not ship.get("at_sea") or not ship.get("fishing_started_at"):
            return 0
        started = self.parse_iso(ship["fishing_started_at"])
        if not started: return 0
        total = SHIP_SEC.get(ship["catalog_code"], 3000)
        elapsed = (dt.now(timezone.utc) - started).total_seconds()
        return min(100.0, max(0.0, elapsed / total * 100))
    
    def stock_pct(self):
        cap = self.get_capacity()
        if cap <= 0: return 0
        stock = self.get_stock()
        total = sum(x.get("qty", 0) for x in stock if x.get("qty", 0) > 0)
        return min( total / cap * 100)
    
    # ═══════════════════════════════════════════════════════════════
    # CYCLE — Core Logic
    # ═══════════════════════════════════════════════════════════════
    def cycle(self):
        if time.time() < self.paused_until:
            return 0
        
        self.stats["cycles"] += 1
        LOG.log(f"─── cycle #{self.stats['cycles']} ───", "g", self.short)
        
        if not self.ensure_fresh():
            return 0
        
        # 1) فحص المخزن
        spct_before = self.stock_pct()
        LOG.log(f"stock before: {spct_before:.1f}%", "i", self.short)
        
        if spct_before >= 90:
            LOG.log("STOCK FULL — forced sell", "w", self.short)
            stock = self.get_stock()
            for item in stock:
                fid = item.get("fish_id")
                qty = item.get("qty", 0)
                if qty <= 0: continue
                earned = self.sell(fid, qty)
                if earned > 0:
                    self.stats["sold"] += qty
                    self.stats["gold"] += earned
            time.sleep(3)
        
        # 2) فحص السفن
        ships = self.get_ships()
        LOG.log(f"ships: {len(ships)}", "i", self.short)
        
        ready = []
        for s in ships:
            pct = self.ship_pct(s)
            status = "SEA" if s["at_sea"] else "PORT"
            LOG.log(f"  {s['catalog_code']} — {pct:.1f}% {status}", "i", self.short)
            if s["at_sea"] and pct >= CFG["SHIP_THRESHOLD"]:
                ready.append(s)
        
        # 3) جمع
        if ready:
            spct_now = self.stock_pct()
            if spct_now >= 95:
                LOG.log("stock near full — skip collect", "w", self.short)
                for s in ready:
                    self.return_ship(s["id"])
            else:
                LOG.log(f"collect from {len(ready)} ships", "s", self.short)
                for s in ready:
                    fish_id = s.get("preferred_fish_id") or CFG["DEFAULT_FISH"]
                    if self.collect(s["id"], fish_id):
                        LOG.log(f"  ✓ {s['catalog_code']}", "s", self.short)
                        self.stats["collected"] += 1
                    self.return_ship(s["id"])
        
        # 4) بيع
        spct = self.stock_pct()
        LOG.log(f"stock after: {spct:.1f}%", "i", self.short)
        
        stock = self.get_stock()
        prices = self.get_prices()
        for item in stock:
            fid = item.get("fish_id")
            qty = item.get("qty", 0)
            if qty <= 0 or fid not in prices: continue
            p = prices[fid]
            pp = p["current_price"] / p["max_price"] * 100 if p["max_price"] > 0 else 0
            if spct >= 98 or spct >= CFG["STOCK_SELL_PCT"] or pp >= CFG["PRICE_SELL_PCT"]:
                earned = self.sell(fid, qty)
                if earned > 0:
                    self.stats["sold"] += qty
                    self.stats["gold"] += earned
        
        # 5) إرسال السفن
        final_spct = self.stock_pct()
        ships = self.get_ships()
        sent = 0
        for s in ships:
            if s["at_sea"]: continue
            if s["hp"] <= s["max_hp"] * 0.3: continue
            if final_spct >= 90: continue
            if self.send_ship(s["id"]):
                sent += 1
        
        # 6) تحديث البروفايل
        profile = self.get_profile()
        if profile:
            self.stats["gold"] = profile.get("coins", self.stats["gold"])
        
        LOG.log(f"SUM: collect={self.stats['collected']} sold={self.stats['sold']} gold={self.stats['gold']:,}", "g", self.short)
        
        # احسب وقت الانتظار
        wait = random.randint(CFG["CYCLE_MIN"], CFG["CYCLE_MAX"])
        return wait


# ═══════════════════════════════════════════════════════════════════
# WORKER — لكل حساب
# ═══════════════════════════════════════════════════════════════════
def account_worker(config, index):
    initial_delay = index * 8 + random.randint(0, 5)
    LOG.log(f"Account #{index+1} starts in {initial_delay}s", "i", config["email"][:6])
    time.sleep(initial_delay)
    
    acc = UltraAccount(config["email"], config["password"], index)
    if not acc.login():
        LOG.log(f"Account #{index+1} failed", "e", config["email"][:6])
        return
    
    while True:
        try:
            wait = acc.cycle()
            if wait > 0:
                LOG.log(f"wait {wait}s ({wait//60}m)", "i", acc.short)
                time.sleep(wait)
            else:
                time.sleep(120)
            
            # تحديث الإحصائيات العامة
            with GLOBAL_STATE["lock"]:
                GLOBAL_STATE["total_cycles"] += 1
                GLOBAL_STATE["total_collected"] += acc.stats["collected"]
                GLOBAL_STATE["total_sold"] += acc.stats["sold"]
                GLOBAL_STATE["total_gold"] += acc.stats["gold"]
                
        except KeyboardInterrupt:
            break
        except Exception as e:
            acc.stats["errors"] += 1
            LOG.log(f"Worker error: {e}", "e", acc.short)
            time.sleep(60)


# ═══════════════════════════════════════════════════════════════════
# FLASK — Health + Dashboard
# ═══════════════════════════════════════════════════════════════════
app = Flask(__name__)
WORKERS_REF = []  # للوصول من Dashboard


DASHBOARD_HTML = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CIPHER ULTRA v13</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Cairo,system-ui,sans-serif;background:linear-gradient(180deg,#0a0a1a,#0d0d1f);color:#e8e8e8;padding:20px;min-height:100vh}
  h1{text-align:center;font-size:26px;background:linear-gradient(135deg,#ff0050,#ff00ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:20px}
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:20px}
  .stat{background:linear-gradient(145deg,#1a1a2e,#0f0f1e);border:1px solid rgba(255,0,80,.3);border-radius:12px;padding:15px;text-align:center}
  .stat-label{font-size:11px;color:#888;margin-bottom:5px}
  .stat-val{font-size:22px;font-weight:800;color:#ff0050}
  .stat-val.gold{color:#ffd700}
  .stat-val.green{color:#00ff88}
  .stat-val.blue{color:#00d4ff}
  .acc-card{background:linear-gradient(145deg,#1a1a2e,#0f0f1e);border:1px solid rgba(255,0,80,.25);border-radius:12px;padding:14px;margin-bottom:10px}
  .acc-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
  .acc-name{font-weight:800;color:#ff0050;font-size:15px}
  .acc-status{font-size:11px;padding:3px 10px;border-radius:12px;font-weight:700}
  .acc-status.run{background:#00ff88;color:#000}
  .acc-status.idle{background:#666;color:#fff}
  .acc-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;font-size:11px}
  .acc-stat{background:rgba(0,0,0,.3);padding:8px;border-radius:8px;text-align:center}
  .acc-stat-label{color:#888;font-size:9px}
  .acc-stat-val{color:#fff;font-weight:800;margin-top:3px}
  .logs{background:rgba(0,0,0,.5);border-radius:10px;padding:12px;height:300px;overflow-y:auto;font-family:monospace;font-size:11px;line-height:1.5;margin-top:20px;border:1px solid rgba(255,0,80,.2)}
  .log-line{padding:2px 0;display:flex;gap:8px}
  .log-time{color:#555;min-width:60px}
  .log-i .log-msg{color:#00d4ff}
  .log-s .log-msg{color:#00ff88}
  .log-w .log-msg{color:#ffaa00}
  .log-e .log-msg{color:#ff4444}
  .log-g .log-msg{color:#ff0050;font-weight:800}
  .refresh{text-align:center;color:#666;font-size:11px;margin-top:20px}
</style>
</head>
<body>
  <h1>☠️ CIPHER ULTRA v13.0</h1>
  
  <div class="stats" id="stats">
    <div class="stat"><div class="stat-label">ACCOUNTS</div><div class="stat-val" id="s-acc">-</div></div>
    <div class="stat"><div class="stat-label">CYCLES</div><div class="stat-val blue" id="s-cyc">-</div></div>
    <div class="stat"><div class="stat-label">COLLECTED</div><div class="stat-val green" id="s-col">-</div></div>
    <div class="stat"><div class="stat-label">SOLD</div><div class="stat-val" id="s-sol">-</div></div>
    <div class="stat"><div class="stat-label">GOLD</div><div class="stat-val gold" id="s-gld">-</div></div>
    <div class="stat"><div class="stat-label">UPTIME</div><div class="stat-val" id="s-upt">-</div></div>
  </div>

  <div id="accounts"></div>

  <h2 style="font-size:16px;margin:20px 0 10px;color:#ff0050">📋 Live Logs</h2>
  <div class="logs" id="logs"></div>

  <div class="refresh">auto-refresh every 10s</div>

<script>
async function load(){
  try{
    const r = await fetch('/api/status');
    const d = await r.json();
    
    document.getElementById('s-acc').textContent = d.total_accounts;
    document.getElementById('s-cyc').textContent = d.total_cycles;
    document.getElementById('s-col').textContent = d.total_collected;
    document.getElementById('s-sol').textContent = d.total_sold;
    document.getElementById('s-gld').textContent = d.total_gold.toLocaleString();
    document.getElementById('s-upt').textContent = Math.floor(d.uptime/3600) + 'h';
    
    document.getElementById('accounts').innerHTML = d.accounts.map(a => `
      <div class="acc-card">
        <div class="acc-head">
          <div class="acc-name">👤 ${a.short}</div>
          <div class="acc-status ${a.state === 'running' ? 'run' : 'idle'}">${a.state}</div>
        </div>
        <div class="acc-stats">
          <div class="acc-stat"><div class="acc-stat-label">CYCLES</div><div class="acc-stat-val">${a.cycles}</div></div>
          <div class="acc-stat"><div class="acc-stat-label">COLLECTED</div><div class="acc-stat-val">${a.collected}</div></div>
          <div class="acc-stat"><div class="acc-stat-label">SOLD</div><div class="acc-stat-val">${a.sold}</div></div>
          <div class="acc-stat"><div class="acc-stat-label">GOLD</div><div class="acc-stat-val">${a.gold.toLocaleString()}</div></div>
        </div>
      </div>
    `).join('');
    
    const logs = d.logs.map(l => `
      <div class="log-line log-${l.type}">
        <span class="log-time">${new Date(l.t).toLocaleTimeString('en-GB')}</span>
        <span class="log-msg">${l.msg}</span>
      </div>
    `).join('');
    const lBox = document.getElementById('logs');
    lBox.innerHTML = logs;
    lBox.scrollTop = lBox.scrollHeight;
  }catch(e){console.error(e)}
}
 ✅load();
setInterval(load, 10000);
</script>
</body>
</html>"""


@app.route("/")
def dashboard():
    return render_template_string(DASHBOARD_HTML)


@app.route("/api/status")
def api_status():
    accounts = []
    for w in WORKERS_REF:
        if not hasattr(w, "acc"): continue
        a = w.acc
        accounts.append({
            "email": a.email,
            "short": a.short,
            "state": a.state,
            "cycles": a.stats["cycles"],
            "collected": a.stats["collected"],
            "sold": a.stats["sold"],
            "gold": a.stats["gold"],
            "errors": a.stats["errors"],
        })
    
    return jsonify({
        "total_accounts": len(accounts),
        "total_cycles": GLOBAL_STATE["total_cycles"],
        "total_collected": GLOBAL_STATE["total_collected"],
        "total_sold": GLOBAL_STATE["total_sold"],
        "total_gold": GLOBAL_STATE["total_gold"],
        "uptime": time.time() - GLOBAL_STATE["started_at"],
        "accounts": accounts,
        "logs": LOG.get(80),
    })


@app.route("/api/healthz")
def healthz():
    return jsonify({
        "status": "ok",
        "version": "13.0-ULTRA",
        "accounts": len(ACCOUNTS_CONFIG),
        "uptime": time.time() - GLOBAL_STATE["started_at"],
    }), 200


# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("=" * 60)
    print("☠️  CIPHER ULTRA v13.0 — PYTHON EDITION")
    print("=" * 60)
    print(f"📊 Accounts: {len(ACCOUNTS_CONFIG)}")
    print(f"🎭 Stealth: ARMED")
    print(f"🔁 Retry: {CFG['MAX_RETRIES']}x")
    print("=" * 60)
    
    if not ACCOUNTS_CONFIG:
        print("❌ No accounts configured")
        sys.exit(1)
    
    # شغل Workers
    for i, cfg in enumerate(ACCOUNTS_CONFIG):
        t = threading.Thread(target=account_worker, args=(cfg, i), daemon=True)
        t.start()
        time.sleep(0.5)
    
    # شغل Flask
    port = int(os.environ.get("PORT", 8080))
    print(f"🌐 Dashboard: http://0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, use_reloader=False)
