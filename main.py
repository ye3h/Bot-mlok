# ═══════════════════════════════════════════════════════════════
# CIPHER-GM MULTI-ACCOUNT BOT v5.0 — SYNCHRONIZED
# كل 5 دقائق → كل الحسابات تشتغل مع بعض
# ═══════════════════════════════════════════════════════════════

import os
import requests
import time
import sys
import threading
import random
import hashlib
import uuid
from datetime import datetime as dt, timezone
from flask import Flask

# ═══════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════
API  = "https://qjwbfkpudysxqtkeouwu.supabase.co"
ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqd2Jma3B1ZHlzeHF0a2VvdXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDEyNDksImV4cCI6MjA5NTMxNzI0OX0.rs4NXx8bMPQ3k8Zgf_F3efeDPuAsxPlqS0bZ3cFE9dI"

# قراءة الحسابات
ACCOUNTS_CONFIG = []
for i in range(1, 13):
    email = os.environ.get(f"ACC{i}_EMAIL")
    password = os.environ.get(f"ACC{i}_PASS")
    if email and password:
        ACCOUNTS_CONFIG.append({"email": email, "password": password})

# ⏰ إعدادات متزامنة
MASTER_LOOP     = 300      # كل 5 دقائق — الدورة الرئيسية
SHIP_THRESHOLD  = 95
STOCK_SELL_PCT  = 90
PRICE_SELL_PCT  = 85
RATE_LIMIT_WAIT = 60
DEFAULT_FISH    = "poseidon"
MAX_PARALLEL    = 5       # عدد الحسابات اللي تشتغل مع بعض

# ═══════════════════════════════════════════════════════════════
# 🎭 STEALTH
# ═══════════════════════════════════════════════════════════════
USER_AGENTS = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6.1 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/25.4 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
]
CLIENT_INFO = ["supabase-js-web/2.106.1", "supabase-js-web/2.105.4", "supabase-js-web/2.104.0"]
ORIGIN  = "https://www.molok-alqarasna.com"
REFERER = "https://www.molok-alqarasna.com/"

def gen_device_id():
    return hashlib.sha256(f"{uuid.uuid4()}-{time.time()}-{random.random()}".encode()).hexdigest()

def gen_hdid():
    return hashlib.md5(f"{uuid.uuid4()}-{random.random()}".encode()).hexdigest()

def human_delay(action="read"):
    delays = {"read": (0.3, 1.2), "click": (0.5, 2.0), "think": (1.5, 4.0)}
    lo, hi = delays.get(action, (0.5, 1.5))
    time.sleep(random.uniform(lo, hi))

def build_headers(token=None, ua=None, client=None, device_id=None, hdid=None):
    if ua is None: ua = random.choice(USER_AGENTS)
    if client is None: client = random.choice(CLIENT_INFO)
    if device_id is None: device_id = gen_device_id()
    if hdid is None: hdid = gen_hdid()
    h = {
        "apikey": ANON, "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7",
        "User-Agent": ua, "Origin": ORIGIN, "Referer": REFERER,
        "X-Client-Info": client, "X-Supabase-Api-Version": "2024-01-01",
        "X-Device-Id": device_id, "X-Hamor-Hdid": hdid,
        "Cache-Control": "no-cache", "Pragma": "no-cache", "DNT": "1",
        "Sec-Fetch-Dest": "empty", "Sec-Fetch-Mode": "cors", "Sec-Fetch-Site": "same-site",
    }
    if token: h["Authorization"] = "Bearer " + token
    return h

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

# ═══════════════════════════════════════════════════════════════
# ACCOUNT CLASS
# ═══════════════════════════════════════════════════════════════
class Account:
    def __init__(self, email, password, pref=None):
        self.email = email
        self.password = password
        self.pref = pref or DEFAULT_FISH
        self.token = self.refresh = self.uid = None
        self.short = email[:6]
        self.stats = {"collected": 0, "sold": 0, "coins": 0, "cycles": 0, "errors": 0}
        self.paused_until = 0
        self.ua = random.choice(USER_AGENTS)
        self.client = random.choice(CLIENT_INFO)
        self.device_id = gen_device_id()
        self.hdid = gen_hdid()
        self.session = requests.Session()
        self.lock = threading.Lock()

    def login(self):
        human_delay("read")
        try:
            r = self.session.post(API + "/auth/v1/token?grant_type=password",
                headers=build_headers(ua=self.ua, client=self.client, device_id=self.device_id, hdid=self.hdid),
                json={"email": self.email, "password": self.password}, timeout=30)
            if r.status_code == 429:
                log(f"Rate Limit — {RATE_LIMIT_WAIT}ث", "⏸️", self.short)
                self.paused_until = time.time() + RATE_LIMIT_WAIT
                return False
            if r.status_code != 200:
                log(f"فشل: {r.text[:60]}", "❌", self.short)
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
        if time.time() < self.paused_until: return False
        human_delay("read")
        try:
            r = self.session.post(API + "/auth/v1/token?grant_type=refresh_token",
                headers=build_headers(ua=self.ua, client=self.client, device_id=self.device_id, hdid=self.hdid),
                json={"refresh_token": self.refresh}, timeout=30)
            if r.status_code == 429:
                self.paused_until = time.time() + RATE_LIMIT_WAIT
                return False
            if r.status_code == 200:
                d = r.json()
                self.token = d["access_token"]
                self.refresh = d["refresh_token"]
                return True
        except: pass
        return self.login()

    def H(self):
        return build_headers(token=self.token, ua=self.ua, client=self.client, device_id=self.device_id, hdid=self.hdid)

    def _request(self, method, url, action="read", **kwargs):
        if time.time() < self.paused_until: return None
        human_delay(action)
        try:
            r = self.session.request(method, url, headers=self.H(), timeout=30, **kwargs)
            if r.status_code == 429:
                self.paused_until = time.time() + RATE_LIMIT_WAIT
                return None
            if r.status_code >= 500:
                time.sleep(random.uniform(2, 5)); return None
            return r
        except: return None

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

    # ═══════════════════════════════════════════════════════════
    # 🔥 الدورة الموحدة
    # ═══════════════════════════════════════════════════════════
    def run_cycle(self):
        if time.time() < self.paused_until:
            wait = int(self.paused_until - time.time())
            log(f"متوقف {wait}ث", "⏸️", self.short)
            return
        
        self.stats["cycles"] += 1
        log(f"──── دورة #{self.stats['cycles']} ────", "🔁", self.short)

        if not self.refresh_token():
            return

        # 1) فحص المخزن
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

        # 2) فحص السفن
        ships = self.get_ships()
        log(f"السفن: {len(ships)}", "⛵", self.short)

        ready = []
        for s in ships:
            pct = self.ship_pct(s)
            status = "🌊" if s["at_sea"] else "⚓"
            log(f"  {s['catalog_code']} — {pct:.1f}% {status}", "", self.short)
            if s["at_sea"] and pct >= SHIP_THRESHOLD:
                ready.append(s)

        # 3) جمع + إرجاع
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

        # 4) المخزن بعد
        spct = self.stock_pct()
        log(f"المخزن (بعد): {spct:.1f}%", "📦", self.short)

        # 5) البيع الذكي
        stock = self.get_stock()
        prices = self.get_prices()
        for item in stock:
            fid = item.get("fish_id")
            qty = item.get("qty", 0)
            if qty <= 0 or fid not in prices: continue
            p = prices[fid]
            pp = p["current_price"] / p["max_price"] * 100 if p["max_price"] > 0 else 0
            if spct >= 98 or spct >= STOCK_SELL_PCT or pp >= PRICE_SELL_PCT:
                reason = "🔴" if spct >= 98 else ("🟠" if spct >= 90 else "💰")
                log(f"  {reason} بيع {qty} × {fid} ({pp:.0f}%)", "", self.short)
                earned = self.sell(fid, qty)
                if earned > 0:
                    self.stats["sold"] += qty
                    self.stats["coins"] += earned
                    log(f"     +{earned:,} ذهب", "✨", self.short)
                human_delay("click")

        # 6) إرسال السفن الفاضية
        final_spct = self.stock_pct()
        ships = self.get_ships()
        for s in ships:
            if s["at_sea"]: continue
            if s["hp"] <= s["max_hp"] * 0.3: continue
            if final_spct >= 90:
                log(f"  ⏸️ {s['catalog_code']} — المخزن ممتلئ", "⏸️", self.short)
                continue
            if self.send_ship(s["id"]):
                log(f"  🚀 {s['catalog_code']}", "", self.short)
                human_delay("click")

        log(f"📊 جمع:{self.stats['collected']} بيع:{self.stats['sold']} ذهب:{self.stats['coins']:,}", "", self.short)


# ═══════════════════════════════════════════════════════════════
# GLOBAL STATE
# ═══════════════════════════════════════════════════════════════
ACCOUNTS_OBJ = []
ACCOUNTS_LOCK = threading.Lock()


def init_accounts():
    """ينشئ كل الحسابات مرة وحدة عند البداية"""
    log("🔧 تحضير الحسابات...", "")
    for i, cfg in enumerate(ACCOUNTS_CONFIG):
        acc = Account(cfg["email"], cfg["password"])
        with ACCOUNTS_LOCK:
            ACCOUNTS_OBJ.append(acc)
        time.sleep(0.5)
    
    # تسجيل دخول متوازي
    log(f"🔐 تسجيل دخول {len(ACCOUNTS_OBJ)} حساب...", "")
    threads = []
    for acc in ACCOUNTS_OBJ:
        t = threading.Thread(target=acc.login, daemon=True)
        t.start()
        threads.append(t)
        time.sleep(0.8)  # تأخير بسيط بين تسجيل دخول
    
    # انتظر 30 ثانية كحد أقصى
    for t in threads:
        t.join(timeout=30)
    
    logged = sum(1 for acc in ACCOUNTS_OBJ if acc.token)
    log(f"✅ {logged}/{len(ACCOUNTS_OBJ)} حساب جاهز", "")


def run_all_accounts_parallel():
    """يشغل دورة كل الحسابات بالتوازي"""
    log("", "")
    log("═" * 55, "")
    log(f"🚀 بدء دورة جماعية — {len(ACCOUNTS_OBJ)} حساب", "🔥")
    log("═" * 55, "")
    
    start_time = time.time()
    threads = []
    
    for acc in ACCOUNTS_OBJ:
        t = threading.Thread(target=acc.run_cycle, daemon=True)
        t.start()
        threads.append(t)
        time.sleep(0.5)  # تأخير بسيط بين بدء كل حساب
    
    # انتظر الجميع
    for t in threads:
        t.join(timeout=180)  # 3 دقائق كحد أقصى
    
    duration = time.time() - start_time
    
    # ملخص
    total_coins = sum(a.stats["coins"] for a in ACCOUNTS_OBJ)
    total_collected = sum(a.stats["collected"] for a in ACCOUNTS_OBJ)
    total_sold = sum(a.stats["sold"] for a in ACCOUNTS_OBJ)
    
    log("═" * 55, "")
    log(f"✅ انتهت الدورة الجماعية في {duration:.1f}ث", "🎉")
    log(f"📊 الإجمالي: جمع={total_collected} بيع={total_sold} ذهب={total_coins:,}", "💰")
    log("═" * 55, "")


# ═══════════════════════════════════════════════════════════════
# MASTER LOOP — القائد
# ═══════════════════════════════════════════════════════════════
def master_loop():
    """القائد الرئيسي — يطلق دورة جماعية كل 5 دقائق"""
    time.sleep(5)  # تأخير ابتدائي
    
    # تهيئة الحسابات
    init_accounts()
    
    # انتظر 10 ثواني بعد التهيئة
    time.sleep(10)
    
    cycle_count = 0
    
    while True:
        try:
            cycle_count += 1
            loop_start = time.time()
            
            log("", "")
            log("╔" + "═" * 53 + "╗", "")
            log(f"║  🎯 الدورة الجماعية #{cycle_count} — " + dt.now().strftime("%H:%M:%S") + " " * 23 + "║", "")
            log("╚" + "═" * 53 + "╝", "")
            
            # شغل كل الحسابات بالتوازي
            run_all_accounts_parallel()
            
            # احسب الوقت المتبقي
            elapsed = time.time() - loop_start
            wait = MASTER_LOOP - elapsed
            
            if wait < 30:
                wait = 30  # على الأقل 30 ثانية
            
            log(f"⏳ انتظار {wait:.0f}ث ({wait/60:.1f}د) للدورة القادمة...", "")
            
            # ⏰ أضف راحة متزامنة
            time.sleep(wait)
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            log(f"❌ خطأ رئيسي: {e}", "")
            time.sleep(60)


# ═══════════════════════════════════════════════════════════════
# FLASK — Health & Dashboard
# ═══════════════════════════════════════════════════════════════
app = Flask(__name__)

@app.route("/")
def home():
    return f"CIPHER-GM BOT v5.0 SYNCHRONIZED: {len(ACCOUNTS_OBJ)} accounts running ✅", 200

@app.route("/api/healthz")
def health():
    return {
        "status": "ok",
        "version": "5.0",
        "accounts": len(ACCOUNTS_OBJ),
        "mode": "synchronized",
        "interval": MASTER_LOOP
    }, 200


# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("═" * 60)
    print("⚓ CIPHER-GM BOT v5.0 — SYNCHRONIZED MODE")
    print(f"📊 عدد الحسابات: {len(ACCOUNTS_CONFIG)}")
    print(f"⏰ دورة جماعية كل: {MASTER_LOOP}ث ({MASTER_LOOP//60} دقائق)")
    print(f"🔥 كل الحسابات تشتغل مع بعض")
    print("═" * 60)

    if not ACCOUNTS_CONFIG:
        print("❌ ما فيه حسابات")
        sys.exit(1)

    # شغل Master Loop في thread
    threading.Thread(target=master_loop, daemon=True).start()

    # شغل Flask
    port = int(os.environ.get("PORT", 8080))
    print(f"🌐 Flask على المنفذ {port}")
    app.run(host="0.0.0.0", port=port, use_reloader=False)
