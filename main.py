# ═══════════════════════════════════════════════════════════════
# CIPHER-GM MULTI-ACCOUNT BOT v4.0 — Smart Sell Edition
# 12 حساب + بيع إجباري عند امتلاء المخزن
# ═══════════════════════════════════════════════════════════════

import os
import requests
import time
import sys
import threading
import random
from datetime import datetime as dt, timezone
from flask import Flask

# ═══════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════
API  = "https://qjwbfkpudysxqtkeouwu.supabase.co"
ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqd2Jma3B1ZHlzeHF0a2VvdXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDEyNDksImV4cCI6MjA5NTMxNzI0OX0.rs4NXx8bMPQ3k8Zgf_F3efeDPuAsxPlqS0bZ3cFE9dI"

# قراءة الحسابات من Environment Variables
ACCOUNTS = []
for i in range(1, 13):
    email = os.environ.get(f"ACC{i}_EMAIL")
    password = os.environ.get(f"ACC{i}_PASS")
    pref = os.environ.get(f"ACC{i}_PREF", "poseidon")
    if email and password:
        ACCOUNTS.append({"email": email, "password": password, "pref": pref})

# إعدادات التشغيل
LOOP_SECONDS   = 420   # 7 دقائق
SHIP_THRESHOLD = 95    # يجمع لما 95%
STOCK_SELL_PCT = 90    # يبيع لما المخزن 90%
PRICE_SELL_PCT = 85    # يبيع لما السعر 85% من القمة
STAGGER_SEC    = 8     # تأخير بين الحسابات
RATE_LIMIT_WAIT = 60   # انتظار بعد 429

# ═══════════════════════════════════════════════════════════════
# SHIP DATABASE
# ═══════════════════════════════════════════════════════════════
SHIP_SEC = {
    "ship-lvl-1": 60,   "ship-lvl-2": 90,   "ship-lvl-3": 120,
    "ship-lvl-5": 600,  "ship-lvl-7": 1200, "ship-lvl-10": 1800,
    "ship-lvl-12": 2400, "ship-lvl-19": 3000, "ship-lvl-25": 2520,
    "ship-lvl-28": 3120, "ship-lvl-29": 3420, "ship-lvl-30": 3600,
    "royal-whale": 3000, "upgrade-sub": 3000,
}

# ═══════════════════════════════════════════════════════════════
# LOGGING
# ═══════════════════════════════════════════════════════════════
def log(msg, tag="", acc=""):
    ts = dt.now().strftime("%H:%M:%S")
    prefix = f"[{ts}]"
    if acc:
        prefix += f"[{acc[:6]}]"
    if tag:
        prefix += f" {tag}"
    print(f"{prefix} {msg}")
    sys.stdout.flush()

# ═══════════════════════════════════════════════════════════════
# TIME PARSER
# ═══════════════════════════════════════════════════════════════
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

def human_delay(action="read"):
    """تأخير عشوائي يحاكي سلوك الإنسان"""
    delays = {
        "read":   (0.3, 1.2),
        "click":  (0.5, 2.0),
        "think":  (1.5, 4.0),
        "wait":   (3.0, 8.0),
    }
    lo, hi = delays.get(action, (0.5, 1.5))
    time.sleep(random.uniform(lo, hi))

# ═══════════════════════════════════════════════════════════════
# ACCOUNT CLASS
# ═══════════════════════════════════════════════════════════════
class Account:
    def __init__(self, email, password, pref):
        self.email = email
        self.password = password
        self.pref = pref
        self.token = None
        self.refresh = None
        self.uid = None
        self.short = email[:6]
        self.stats = {"collected": 0, "sold": 0, "coins": 0, "cycles": 0, "errors": 0}
        self.paused_until = 0

    def login(self):
        human_delay("read")
        try:
            r = requests.post(
                API + "/auth/v1/token?grant_type=password",
                headers={"apikey": ANON, "Content-Type": "application/json"},
                json={"email": self.email, "password": self.password},
                timeout=30
            )
            if r.status_code == 429:
                log(f"Rate Limit — انتظار {RATE_LIMIT_WAIT}ث", "⏸️", self.short)
                self.paused_until = time.time() + RATE_LIMIT_WAIT
                return False
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
        if time.time() < self.paused_until:
            return False
        human_delay("read")
        try:
            r = requests.post(
                API + "/auth/v1/token?grant_type=refresh_token",
                headers={"apikey": ANON, "Content-Type": "application/json"},
                json={"refresh_token": self.refresh},
                timeout=30
            )
            if r.status_code == 429:
                self.paused_until = time.time() + RATE_LIMIT_WAIT
                return False
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

    def _request(self, method, url, action="read", **kwargs):
        if time.time() < self.paused_until:
            return None
        human_delay(action)
        try:
            r = requests.request(method, url, headers=self.H(), timeout=30, **kwargs)
            if r.status_code == 429:
                log("Rate Limit", "⏸️", self.short)
                self.paused_until = time.time() + RATE_LIMIT_WAIT
                return None
            if r.status_code >= 500:
                time.sleep(random.uniform(2, 5))
                return None
            return r
        except:
            return None

    def get_ships(self):
        url = (API + "/rest/v1/ships_owned?select=id,catalog_code,at_sea,fishing_started_at,hp,max_hp"
               f"&user_id=eq.{self.uid}&in_storage=eq.false")
        r = self._request("GET", url, "read")
        return r.json() if r and r.status_code == 200 else []

    def get_stock(self):
        r = self._request("POST", API + "/rest/v1/rpc/get_fish_stock_summary", "read", json={})
        return r.json() if r and r.status_code == 200 else []

    def get_capacity(self):
        r = self._request("POST", API + "/rest/v1/rpc/user_market_capacity", "read", json={"_uid": self.uid})
        try: return int(r.text) if r else 0
        except: return 0

    def get_prices(self):
        r = self._request("GET", API + "/rest/v1/fish_market_prices?select=fish_id,current_price,max_price", "read")
        return {p["fish_id"]: p for p in r.json()} if r and r.status_code == 200 else {}

    def collect(self, ship_id):
        r = self._request("POST", API + "/rest/v1/rpc/collect_fishing_reward", "click",
            json={"_ship_id": ship_id, "_requested_fish_id": self.pref, "_client_progress": 5000})
        return r is not None and r.status_code == 200

    def return_ship(self, ship_id):
        self._request("POST", API + "/rest/v1/rpc/set_ship_at_sea", "click",
            json={"_ship_id": ship_id, "_at_sea": False})

    def send_ship(self, ship_id):
        r = self._request("POST", API + "/rest/v1/rpc/set_ship_at_sea", "click",
            json={"_ship_id": ship_id, "_at_sea": True})
        return r is not None and r.status_code == 200

    def sell(self, fish_id, qty):
        r = self._request("POST", API + "/rest/v1/rpc/sell_fish_by_qty", "click",
            json={"_fish_id": fish_id, "_qty": qty, "_client_version": "fish-market-v20260626-force-update-1"})
        if r and r.status_code == 200:
            try: return int(r.text)
            except: return 0
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
        if time.time() < self.paused_until:
            wait = int(self.paused_until - time.time())
            log(f"متوقف {wait}ث", "⏸️", self.short)
            return

        self.stats["cycles"] += 1
        log(f"──── دورة #{self.stats['cycles']} ────", "🔁", self.short)

        if not self.refresh_token():
            return

        # ═══════════════════════════════════════════════════════
        # 1) فحص المخزن أولاً — قبل أي جمع
        # ═══════════════════════════════════════════════════════
        spct_before = self.stock_pct()
        log(f"المخزن (قبل): {spct_before:.1f}%", "📦", self.short)

        if spct_before >= 90:
            log("🔴 المخزن ممتلئ — بيع إجباري", "⚠️", self.short)
            stock = self.get_stock()
            for item in stock:
                fid = item.get("fish_id")
                qty = item.get("qty", 0)
                if qty <= 0: continue
                log(f"  💰 بيع {qty} × {fid}", "", self.short)
                earned = self.sell(fid, qty)
                if earned > 0:
                    self.stats["sold"] += qty
                    self.stats["coins"] += earned
                    log(f"     +{earned:,} ذهب", "✨", self.short)
                human_delay("click")
            time.sleep(3)

        # ═══════════════════════════════════════════════════════
        # 2) فحص السفن
        # ═══════════════════════════════════════════════════════
        ships = self.get_ships()
        log(f"السفن: {len(ships)}", "⛵", self.short)

        ready = []
        for s in ships:
            pct = self.ship_pct(s)
            status = "🌊" if s["at_sea"] else "⚓"
            log(f"  {s['catalog_code']} — {pct:.1f}% {status}", "", self.short)
            if s["at_sea"] and pct >= SHIP_THRESHOLD:
                ready.append(s)

        # ═══════════════════════════════════════════════════════
        # 3) جمع الصيد (لو المخزن يسمح)
        # ═══════════════════════════════════════════════════════
        if ready:
            spct_now = self.stock_pct()
            if spct_now >= 95:
                log(f"⚠️ المخزن {spct_now:.1f}% — تخطي الجمع", "🚫", self.short)
                for s in ready:
                    self.return_ship(s["id"])
                    human_delay("click")
            else:
                log(f"جمع من {len(ready)} سفينة", "🎣", self.short)
                for s in ready:
                    if self.collect(s["id"]):
                        log(f"  ✅ {s['catalog_code']}", "", self.short)
                        self.stats["collected"] += 1
                        human_delay("think")
                    else:
                        log(f"  ❌ فشل الجمع", "⚠️", self.short)
                    self.return_ship(s["id"])
                    human_delay("click")

        # ═══════════════════════════════════════════════════════
        # 4) فحص المخزن بعد الجمع
        # ═══════════════════════════════════════════════════════
        spct = self.stock_pct()
        log(f"المخزن (بعد): {spct:.1f}%", "📦", self.short)

        stock = self.get_stock()
        prices = self.get_prices()

        # ═══════════════════════════════════════════════════════
        # 5) البيع الذكي
        # ═══════════════════════════════════════════════════════
        for item in stock:
            fid = item.get("fish_id")
            qty = item.get("qty", 0)
            if qty <= 0 or fid not in prices: continue
            p = prices[fid]
            pp = p["current_price"] / p["max_price"] * 100 if p["max_price"] > 0 else 0

            should_sell = (
                spct >= 98 or
                spct >= STOCK_SELL_PCT or
                pp >= PRICE_SELL_PCT
            )

            if should_sell:
                reason = "🔴 امتلاء" if spct >= 98 else ("🟠 ممتلئ" if spct >= 90 else "💰 سعر")
                log(f"  {reason} بيع {qty} × {fid} ({pp:.0f}%)", "", self.short)
                earned = self.sell(fid, qty)
                if earned > 0:
                    self.stats["sold"] += qty
                    self.stats["coins"] += earned
                    log(f"     +{earned:,} ذهب", "✨", self.short)
                else:
                    log(f"     ❌ فشل البيع", "⚠️", self.short)
                human_delay("click")

        # ═══════════════════════════════════════════════════════
        # 6) إرسال السفن (لو المخزن يسمح)
        # ═══════════════════════════════════════════════════════
        final_spct = self.stock_pct()
        ships = self.get_ships()

        for s in ships:
            if s["at_sea"]:
                continue
            if s["hp"] <= s["max_hp"] * 0.3:
                continue
            if final_spct >= 90:
                log(f"  ⏸️ {s['catalog_code']} — المخزن ممتلئ", "⏸️", self.short)
                continue
            if self.send_ship(s["id"]):
                log(f"  🚀 {s['catalog_code']}", "", self.short)
                human_delay("click")

        log(f"📊 جمع:{self.stats['collected']} بيع:{self.stats['sold']} ذهب:{self.stats['coins']:,}", "", self.short)

# ═══════════════════════════════════════════════════════════════
# WORKER
# ═══════════════════════════════════════════════════════════════
def worker(acc_config, index):
    initial_delay = index * STAGGER_SEC + random.randint(0, 5)
    log(f"الحساب #{index+1} يبدأ بعد {initial_delay}ث", "⏳", acc_config["email"][:6])
    time.sleep(initial_delay)

    acc = Account(acc_config["email"], acc_config["password"], acc_config["pref"])
    if not acc.login():
        log(f"فشل الحساب #{index+1}", "⚠️", acc.short)
        return

    while True:
        try:
            acc.cycle()
            jitter = random.randint(-45, 45)
            wait = LOOP_SECONDS + jitter
            log(f"انتظار {wait}ث", "⏳", acc.short)
            time.sleep(wait)
        except KeyboardInterrupt:
            break
        except Exception as e:
            acc.stats["errors"] += 1
            log(f"خطأ: {e}", "❌", acc.short)
            time.sleep(60)

# ═══════════════════════════════════════════════════════════════
# FLASK — Health Endpoint
# ═══════════════════════════════════════════════════════════════
app = Flask(__name__)

@app.route("/")
def home():
    return f"CIPHER-GM BOT v4.0: {len(ACCOUNTS)} accounts running ✅", 200

@app.route("/api/healthz")
def health():
    return {"status": "ok", "accounts": len(ACCOUNTS), "version": "4.0"}, 200

# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("═" * 60)
    print("⚓ CIPHER-GM MULTI-ACCOUNT BOT v4.0 — SMART SELL")
    print(f"📊 عدد الحسابات: {len(ACCOUNTS)}")
    print(f"⏱️  دورة كل: {LOOP_SECONDS}ث")
    print(f"📏 تأخير: {STAGGER_SEC}ث")
    print("═" * 60)

    if not ACCOUNTS:
        print("❌ ما فيه حسابات — تأكد من ACC1_EMAIL ... ACC12_EMAIL")
        sys.exit(1)

    for i, cfg in enumerate(ACCOUNTS):
        t = threading.Thread(target=worker, args=(cfg, i), daemon=True)
        t.start()

    threading.Thread(
        target=lambda: app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)), use_reloader=False),
        daemon=True
    ).start()
    print(f"🌐 Flask على المنفذ {os.environ.get('PORT', '8080')}")

    while True:
        time.sleep(60)
