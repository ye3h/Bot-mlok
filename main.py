import os
import requests
import time
import sys
import threading
from datetime import datetime as dt, timezone
from flask import Flask

API  = "https://qjwbfkpudysxqtkeouwu.supabase.co"
ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqd2Jma3B1ZHlzeHF0a2VvdXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDEyNDksImV4cCI6MjA5NTMxNzI0OX0.rs4NXx8bMPQ3k8Zgf_F3efeDPuAsxPlqS0bZ3cFE9dI"

ACCOUNTS = []
for i in range(1, 6):
    email = os.environ.get(f"ACC{i}_EMAIL")
    password = os.environ.get(f"ACC{i}_PASS")
    if email and password:
        ACCOUNTS.append({"email": email, "password": password, "pref": "poseidon"})

LOOP_SECONDS   = 300
SHIP_THRESHOLD = 95
STOCK_SELL_PCT = 90
PRICE_SELL_PCT = 85

SHIP_SEC = {
    "ship-lvl-1": 60, "ship-lvl-2": 90, "ship-lvl-3": 120,
    "ship-lvl-5": 600, "ship-lvl-7": 1200, "ship-lvl-10": 1800,
    "ship-lvl-12": 2400, "ship-lvl-19": 3000, "ship-lvl-25": 2520,
    "ship-lvl-28": 3120, "ship-lvl-29": 3420, "ship-lvl-30": 3600,
    "royal-whale": 3000, "upgrade-sub": 3000,
}

def log(msg, tag="", acc=""):
    ts = dt.now().strftime("%H:%M:%S")
    prefix = f"[{ts}]"
    if acc: prefix += f"[{acc[:6]}]"
    if tag: prefix += f" {tag}"
    print(f"{prefix} {msg}")
    sys.stdout.flush()

def parse_iso(s):
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
    except:
        return None

class Account:
    def __init__(self, email, password, pref):
        self.email = email
        self.password = password
        self.pref = pref
        self.token = None
        self.refresh = None
        self.uid = None
        self.short = email[:6]
        self.stats = {"collected": 0, "sold": 0, "coins": 0, "cycles": 0}

    def login(self):
        try:
            r = requests.post(API + "/auth/v1/token?grant_type=password",
                headers={"apikey": ANON, "Content-Type": "application/json"},
                json={"email": self.email, "password": self.password}, timeout=30)
            if r.status_code != 200:
                log(f"فشل الدخول: {r.text[:60]}", "❌", self.short)
                return False
            d = r.json()
            self.token = d["access_token"]
            self.refresh = d["refresh_token"]
            self.uid = d["user"]["id"]
            log(f"دخلت: {self.uid[:8]}...", "✅", self.short)
            return True
        except Exception as e:
            log(f"خطأ: {e}", "❌", self.short)
            return False

    def refresh_token(self):
        try:
            r = requests.post(API + "/auth/v1/token?grant_type=refresh_token",
                headers={"apikey": ANON, "Content-Type": "application/json"},
                json={"refresh_token": self.refresh}, timeout=30)
            if r.status_code == 200:
                d = r.json()
                self.token = d["access_token"]
                self.refresh = d["refresh_token"]
                return True
        except:
            pass
        return self.login()

    def H(self):
        return {"apikey": ANON, "Authorization": "Bearer " + self.token, "Content-Type": "application/json"}

    def get_ships(self):
        try:
            url = (API + "/rest/v1/ships_owned?select=id,catalog_code,at_sea,fishing_started_at,hp,max_hp"
                   f"&user_id=eq.{self.uid}&in_storage=eq.false")
            r = requests.get(url, headers=self.H(), timeout=30)
            return r.json() if r.status_code == 200 else []
        except:
            return []

    def get_stock(self):
        try:
            r = requests.post(API + "/rest/v1/rpc/get_fish_stock_summary", headers=self.H(), json={}, timeout=30)
            return r.json() if r.status_code == 200 else []
        except:
            return []

    def get_capacity(self):
        try:
            r = requests.post(API + "/rest/v1/rpc/user_market_capacity", headers=self.H(), json={"_uid": self.uid}, timeout=30)
            return int(r.text)
        except:
            return 0

    def get_prices(self):
        try:
            r = requests.get(API + "/rest/v1/fish_market_prices?select=fish_id,current_price,max_price", headers=self.H(), timeout=30)
            return {p["fish_id"]: p for p in r.json()} if r.status_code == 200 else {}
        except:
            return {}

    def collect(self, ship_id):
        try:
            r = requests.post(API + "/rest/v1/rpc/collect_fishing_reward", headers=self.H(),
                json={"_ship_id": ship_id, "_requested_fish_id": self.pref, "_client_progress": 5000}, timeout=30)
            return r.status_code == 200
        except:
            return False

    def return_ship(self, ship_id):
        try:
            requests.post(API + "/rest/v1/rpc/set_ship_at_sea", headers=self.H(),
                json={"_ship_id": ship_id, "_at_sea": False}, timeout=30)
        except:
            pass

    def send_ship(self, ship_id):
        try:
            r = requests.post(API + "/rest/v1/rpc/set_ship_at_sea", headers=self.H(),
                json={"_ship_id": ship_id, "_at_sea": True}, timeout=30)
            return r.status_code == 200
        except:
            return False

    def sell(self, fish_id, qty):
        try:
            r = requests.post(API + "/rest/v1/rpc/sell_fish_by_qty", headers=self.H(),
                json={"_fish_id": fish_id, "_qty": qty, "_client_version": "fish-market-v20260626-force-update-1"}, timeout=30)
            if r.status_code == 200:
                try: return int(r.text)
                except: return 0
            return 0
        except:
            return 0

    def ship_pct(self, ship):
        if not ship.get("at_sea") or not ship.get("fishing_started_at"): return 0
        started = parse_iso(ship["fishing_started_at"])
        if not started: return 0
        total = SHIP_SEC.get(ship["catalog_code"], 3000)
        elapsed = (dt.now(timezone.utc) - started).total_seconds()
        return min(100.0, max(0.0, elapsed / total * 100))

    def stock_pct(self):
        cap = self.get_capacity()
        if cap <= 0: return 0
        stock = self.get_stock()
        total = sum(x.get("qty", 0) for x in stock if x.get("qty", 0) > 0)
        return min(100.0, total / cap * 100)

    def cycle(self):
        self.stats["cycles"] += 1
        log(f"──── دورة #{self.stats['cycles']} ────", "🔁", self.short)
        self.refresh_token()
        ships = self.get_ships()
        log(f"السفن: {len(ships)}", "⛵", self.short)
        ready = []
        for s in ships:
            pct = self.ship_pct(s)
            status = "🌊" if s["at_sea"] else "⚓"
            log(f"  {s['catalog_code']} — {pct:.1f}% {status}", "", self.short)
            if s["at_sea"] and pct >= SHIP_THRESHOLD:
                ready.append(s)
        if ready:
            log(f"جمع من {len(ready)} سفينة", "🎣", self.short)
            for s in ready:
                if self.collect(s["id"]):
                    log(f"  ✅ {s['catalog_code']}", "", self.short)
                    self.stats["collected"] += 1
                    time.sleep(2)
                self.return_ship(s["id"])
                time.sleep(1)
        spct = self.stock_pct()
        log(f"المخزن: {spct:.1f}%", "📦", self.short)
        stock = self.get_stock()
        prices = self.get_prices()
        should_sell = spct >= STOCK_SELL_PCT
        for item in stock:
            fid = item.get("fish_id")
            qty = item.get("qty", 0)
            if qty <= 0 or fid not in prices: continue
            p = prices[fid]
            pp = p["current_price"] / p["max_price"] * 100 if p["max_price"] > 0 else 0
            if should_sell or pp >= PRICE_SELL_PCT:
                log(f"  💰 بيع {qty} × {fid} ({pp:.0f}%)", "", self.short)
                earned = self.sell(fid, qty)
                if earned > 0:
                    self.stats["sold"] += qty
                    self.stats["coins"] += earned
                time.sleep(2)
        ships = self.get_ships()
        for s in ships:
            if not s["at_sea"] and s["hp"] > s["max_hp"] * 0.3:
                if self.send_ship(s["id"]):
                    log(f"  🚀 {s['catalog_code']}", "", self.short)
                    time.sleep(2)
        log(f"📊 جمع:{self.stats['collected']} بيع:{self.stats['sold']} ذهب:{self.stats['coins']:,}", "", self.short)

def worker(acc_config, index):
    time.sleep(index * 3)
    acc = Account(acc_config["email"], acc_config["password"], acc_config["pref"])
    if not acc.login(): return
    while True:
        try:
            acc.cycle()
            time.sleep(LOOP_SECONDS)
        except KeyboardInterrupt:
            break
        except Exception as e:
            log(f"خطأ: {e}", "❌", acc.short)
            time.sleep(60)

app = Flask(__name__)

@app.route("/")
def home():
    return f"CIPHER-GM BOT: {len(ACCOUNTS)} accounts running ✅", 200

@app.route("/api/healthz")
def health():
    return {"status": "ok", "accounts": len(ACCOUNTS)}, 200

if __name__ == "__main__":
    print("═" * 50)
    print("⚓ CIPHER-GM MULTI-ACCOUNT BOT v3.0")
    print(f"📊 عدد الحسابات: {len(ACCOUNTS)}")
    print("═" * 50)
    if not ACCOUNTS:
        print("❌ ما فيه حسابات في Environment Variables")
        sys.exit(1)
    for i, cfg in enumerate(ACCOUNTS):
        t = threading.Thread(target=worker, args=(cfg, i), daemon=True)
        t.start()
        print(f"✅ بدأ الحساب {i+1}: {cfg['email'][:6]}...")
    threading.Thread(
        target=lambda: app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080))),
        daemon=True
    ).start()
    print("🌐 Flask يعمل على المنفذ " + os.environ.get("PORT", "8080"))
    while True:
        time.sleep(60)
  
