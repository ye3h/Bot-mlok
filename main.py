# CIPHER-GM MULTI-ACCOUNT BOT v4.1

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

API  = "https://qjwbfkpudysxqtkeouwu.supabase.co"
ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqd2Jma3B1ZHlzeHF0a2VvdXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDEyNDksImV4cCI6MjA5NTMxNzI0OX0.rs4NXx8bMPQ3k8Zgf_F3efeDPuAsxPlqS0bZ3cFE9dI"

ACCOUNTS_CONFIG = []
for i in range(1, 13):
    email = os.environ.get("ACC%d_EMAIL" % i)
    password = os.environ.get("ACC%d_PASS" % i)
    if email and password:
        ACCOUNTS_CONFIG.append({"email": email, "password": password})

LOOP_SECONDS    = 300
SHIP_THRESHOLD  = 95
STOCK_SELL_PCT  = 90
PRICE_SELL_PCT  = 85
STAGGER_SEC     = 10
RATE_LIMIT_WAIT = 60
DEFAULT_FISH    = "poseidon"

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
    s = str(uuid.uuid4()) + str(time.time()) + str(random.random())
    return hashlib.sha256(s.encode()).hexdigest()

def gen_hdid():
    s = str(uuid.uuid4()) + str(random.random())
    return hashlib.md5(s.encode()).hexdigest()

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
        "apikey": ANON,
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7",
        "User-Agent": ua,
        "Origin": ORIGIN,
        "Referer": REFERER,
        "X-Client-Info": client,
        "X-Supabase-Api-Version": "2024-01-01",
        "X-Device-Id": device_id,
        "X-Hamor-Hdid": hdid,
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "DNT": "1",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site",
    }
    if token:
        h["Authorization"] = "Bearer " + token
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
    prefix = "[" + ts + "]"
    if acc:
        prefix += "[" + acc[:6] + "]"
    if tag:
        prefix += " " + tag
    print(prefix + " " + msg)
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

    def login(self):
        human_delay("read")
        try:
            r = self.session.post(
                API + "/auth/v1/token?grant_type=password",
                headers=build_headers(ua=self.ua, client=self.client, device_id=self.device_id, hdid=self.hdid),
                json={"email": self.email, "password": self.password},
                timeout=30
            )
            if r.status_code == 429:
                self.paused_until = time.time() + RATE_LIMIT_WAIT
                return False
            if r.status_code != 200:
                log("login failed: " + r.text[:60], "ERR", self.short)
                return False
            d = r.json()
            self.token = d["access_token"]
            self.refresh = d["refresh_token"]
            self.uid = d["user"]["id"]
            log("logged in: " + self.uid[:8] + "...", "OK", self.short)
            return True
        except Exception as e:
            log("error: " + str(e), "ERR", self.short)
            return False

    def refresh_token(self):
        if time.time() < self.paused_until:
            return False
        human_delay("read")
        try:
            r = self.session.post(
                API + "/auth/v1/token?grant_type=refresh_token",
                headers=build_headers(ua=self.ua, client=self.client, device_id=self.device_id, hdid=self.hdid),
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
        return build_headers(token=self.token, ua=self.ua, client=self.client, device_id=self.device_id, hdid=self.hdid)

    def _request(self, method, url, action="read", **kwargs):
        if time.time() < self.paused_until:
            return None
        human_delay(action)
        try:
            r = self.session.request(method, url, headers=self.H(), timeout=30, **kwargs)
            if r.status_code == 429:
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
               + "&user_id=eq." + self.uid + "&in_storage=eq.false")
        r = self._request("GET", url, "read")
        return r.json() if r and r.status_code == 200 else []

    def get_stock(self):
        r = self._request("POST", API + "/rest/v1/rpc/get_fish_stock_summary", "read", json={})
        return r.json() if r and r.status_code == 200 else []

    def get_capacity(self):
        r = self._request("POST", API + "/rest/v1/rpc/user_market_capacity", "read", json={"_uid": self.uid})
        try:
            return int(r.text) if r else 0
        except:
            return 0

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
            try:
                return int(r.text)
            except:
                return 0
        return 0

    def ship_pct(self, ship):
        if not ship.get("at_sea") or not ship.get("fishing_started_at"):
            return 0
        started = parse_iso(ship["fishing_started_at"])
        if not started:
            return 0
        total = SHIP_SEC.get(ship["catalog_code"], 3000)
        elapsed = (dt.now(timezone.utc) - started).total_seconds()
        return min(100.0, max(0.0, elapsed / total * 100))

    def stock_pct(self):
        cap = self.get_capacity()
        if cap <= 0:
            return 0
        stock = self.get_stock()
        total = sum(x.get("qty", 0) for x in stock if x.get("qty", 0) > 0)
        return min(100.0, total / cap * 100)

    def cycle(self):
        if time.time() < self.paused_until:
            return
        self.stats["cycles"] += 1
        log("--- cycle #" + str(self.stats["cycles"]) + " ---", "CYC", self.short)

        if not self.refresh_token():
            return

        spct_before = self.stock_pct()
        log("stock before: " + str(round(spct_before, 1)) + "%", "STK", self.short)

        if spct_before >= 90:
            log("stock FULL - forced sell", "WARN", self.short)
            stock = self.get_stock()
            for item in stock:
                fid = item.get("fish_id")
                qty = item.get("qty", 0)
                if qty <= 0:
                    continue
                log("sell " + str(qty) + " x " + str(fid), "SELL", self.short)
                earned = self.sell(fid, qty)
                if earned > 0:
                    self.stats["sold"] += qty
                    self.stats["coins"] += earned
                human_delay("click")
            time.sleep(3)

        ships = self.get_ships()
        log("ships: " + str(len(ships)), "SHIP", self.short)

        ready = []
        for s in ships:
            pct = self.ship_pct(s)
            status = "SEA" if s["at_sea"] else "PORT"
            log("  " + s["catalog_code"] + " - " + str(round(pct, 1)) + "% " + status, "", self.short)
            if s["at_sea"] and pct >= SHIP_THRESHOLD:
                ready.append(s)

        if ready:
            spct_now = self.stock_pct()
            if spct_now >= 95:
                log("stock near full - skip collect", "WARN", self.short)
                for s in ready:
                    self.return_ship(s["id"])
                    human_delay("click")
            else:
                log("collect from " + str(len(ready)) + " ships", "FISH", self.short)
                for s in ready:
                    if self.collect(s["id"]):
                        log("  ok " + s["catalog_code"], "OK", self.short)
                        self.stats["collected"] += 1
                        human_delay("think")
                    else:
                        log("  fail " + s["catalog_code"], "ERR", self.short)
                    self.return_ship(s["id"])
                    human_delay("click")

        spct = self.stock_pct()
        log("stock after: " + str(round(spct, 1)) + "%", "STK", self.short)

        stock = self.get_stock()
        prices = self.get_prices()
        for item in stock:
            fid = item.get("fish_id")
            qty = item.get("qty", 0)
            if qty <= 0 or fid not in prices:
                continue
            p = prices[fid]
            pp = p["current_price"] / p["max_price"] * 100 if p["max_price"] > 0 else 0
            if spct >= 98 or spct >= STOCK_SELL_PCT or pp >= PRICE_SELL_PCT:
                log("sell " + str(qty) + " x " + str(fid) + " (" + str(round(pp)) + "%)", "SELL", self.short)
                earned = self.sell(fid, qty)
                if earned > 0:
                    self.stats["sold"] += qty
                    self.stats["coins"] += earned
                human_delay("click")

        final_spct = self.stock_pct()
        ships = self.get_ships()
        for s in ships:
            if s["at_sea"]:
                continue
            if s["hp"] <= s["max_hp"] * 0.3:
                continue
            if final_spct >= 90:
                continue
            if self.send_ship(s["id"]):
                log("  send " + s["catalog_code"], "GO", self.short)
                human_delay("click")

        log("collected:" + str(self.stats["collected"]) + " sold:" + str(self.stats["sold"]) + " gold:" + str(self.stats["coins"]), "SUM", self.short)

def worker(acc_config, index):
    initial_delay = index * STAGGER_SEC + random.randint(0, 5)
    time.sleep(initial_delay)
    acc = Account(acc_config["email"], acc_config["password"])
    if not acc.login():
        return
    while True:
        try:
            acc.cycle()
            jitter = random.randint(-30, 30)
            time.sleep(LOOP_SECONDS + jitter)
        except KeyboardInterrupt:
            break
        except Exception as e:
            log("error: " + str(e), "ERR", acc.short)
            time.sleep(60)

app = Flask(__name__)

@app.route("/")
def home():
    return "CIPHER-GM v4.1: " + str(len(ACCOUNTS_CONFIG)) + " accounts", 200

@app.route("/api/healthz")
def health():
    return {"status": "ok", "accounts": len(ACCOUNTS_CONFIG), "version": "4.1"}, 200

if __name__ == "__main__":
    print("=" * 60)
    print("CIPHER-GM BOT v4.1")
    print("Accounts: " + str(len(ACCOUNTS_CONFIG)))
    print("=" * 60)

    if not ACCOUNTS_CONFIG:
        print("no accounts found")
        sys.exit(1)

    for i, cfg in enumerate(ACCOUNTS_CONFIG):
        t = threading.Thread(target=worker, args=(cfg, i), daemon=True)
        t.start()

    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, use_reloader=False)
