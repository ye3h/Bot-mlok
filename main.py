
import os
import sys
import time
import json
import random
import hashlib
import uuid
import threading
import requests
import traceback
from datetime import datetime as dt
from flask import Flask, jsonify

# ═══════════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════════
API = "https://qjwbfkpudysxqtkeouwu.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqd2Jma3B1ZHlzeHF0a2VvdXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDEyNDksImV4cCI6MjA5NTMxNzI0OX0.rs4NXx8bMPQ3k8Zgf_F3efeDPuAsxPlqS0bZ3cFE9dI"
CV = "fish-market-v20260626-force-update-1"

CYCLE_SECONDS = 300
STAGGER = 3

# ═══════════════════════════════════════════════════════════════════
# Load accounts from Environment Variables (ACC1 → ACC12)
# ═══════════════════════════════════════════════════════════════════
ACCOUNTS = []
for i in range(1, 13):
    e = os.environ.get("ACC" + str(i) + "_EMAIL")
    p = os.environ.get("ACC" + str(i) + "_PASS")
    if e and p:
        ACCOUNTS.append({"email": e, "password": p})

USER_AGENTS = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6.1 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/25.4 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
]
CLIENT_INFO = ["supabase-js-web/2.106.1", "supabase-js-web/2.105.4", "supabase-js-web/2.104.0"]

LOG_LOCK = threading.Lock()
GLOBAL_STATS_LOCK = threading.Lock()

GLOBAL = {
    "started_at": time.time(),
    "total_cycles": 0,
    "total_collected": 0,
    "total_sold": 0,
    "total_gold": 0,
    "accounts_ref": [],
    "logs": [],
}


def log(msg, acc="", tag=""):
    ts = dt.now().strftime("%H:%M:%S")
    p = "[" + ts + "]"
    if acc:
        p += "[" + acc[:6] + "]"
    if tag:
        p += " " + tag
    with LOG_LOCK:
        try:
            print(p + " " + msg)
            sys.stdout.flush()
        except Exception:
            pass
        GLOBAL["logs"].append({"t": time.time(), "msg": msg, "acc": acc, "tag": tag})
        if len(GLOBAL["logs"]) > 300:
            GLOBAL["logs"].pop(0)


# ═══════════════════════════════════════════════════════════════════
# ACCOUNT
# ═══════════════════════════════════════════════════════════════════
class Account:
    def __init__(self, email, password, index):
        self.email = email
        self.password = password
        self.index = index
        self.short = email[:6]
        self.token = None
        self.refresh = None
        self.uid = None
        self.expires_at = 0
        self.ua = random.choice(USER_AGENTS)
        self.cli = random.choice(CLIENT_INFO)
        self.dev = hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest()
        self.hdid = hashlib.md5(str(uuid.uuid4()).encode()).hexdigest()
        self.s = requests.Session()
        self.stats = {"collected": 0, "sold": 0, "gold": 0, "cycles": 0, "errors": 0}
        self.login_fails = 0
        self.state = "idle"

    def h(self):
        hh = {
            "apikey": KEY,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Accept-Language": "ar-SA,ar;q=0.9,en-US;q=0.8",
            "User-Agent": self.ua,
            "Origin": "https://www.molok-alqarasna.com",
            "Referer": "https://www.molok-alqarasna.com/",
            "X-Client-Info": self.cli,
            "X-Device-Id": self.dev,
            "X-Hamor-Hdid": self.hdid,
            "Cache-Control": "no-cache",
        }
        if self.token:
            hh["Authorization"] = "Bearer " + self.token
        return hh

    def login(self):
        try:
            time.sleep(random.uniform(0.3, 1.0))
            r = self.s.post(
                API + "/auth/v1/token?grant_type=password",
                headers={"apikey": KEY, "Content-Type": "application/json",
                         "User-Agent": self.ua},
                json={"email": self.email, "password": self.password},
                timeout=30
            )
            if r.status_code != 200:
                self.login_fails += 1
                log("login fail (" + str(self.login_fails) + "): " + r.text[:60],
                    self.short, "ERR")
                return False
            d = r.json()
            self.token = d["access_token"]
            self.refresh = d["refresh_token"]
            self.uid = d["user"]["id"]
            self.expires_at = time.time() + d.get("expires_in", 3600) - 300
            self.login_fails = 0
            self.state = "running"
            log("logged in: " + self.uid[:8], self.short, "OK")
            return True
        except Exception as e:
            self.login_fails += 1
            log("login err: " + str(e)[:60], self.short, "ERR")
            return False

    def ensure(self):
        if time.time() < self.expires_at:
            return True
        try:
            r = self.s.post(
                API + "/auth/v1/token?grant_type=refresh_token",
                headers={"apikey": KEY, "Content-Type": "application/json"},
                json={"refresh_token": self.refresh},
                timeout=30
            )
            if r.status_code == 200:
                d = r.json()
                self.token = d["access_token"]
                self.refresh = d["refresh_token"]
                self.expires_at = time.time() + d.get("expires_in", 3600) - 300
                log("refreshed", self.short, "OK")
                return True
        except Exception:
            pass
        return self.login()

    def api(self, method, url, **kw):
        for i in range(5):
            try:
                self.ensure()
                time.sleep(random.uniform(0.2, 0.8))
                r = self.s.request(method, url, headers=self.h(), timeout=30, **kw)
                if r.status_code in (200, 201, 204):
                    return r
                if r.status_code == 401:
                    self.ensure()
                    continue
                if r.status_code == 429:
                    log("rate limit — 15s", self.short, "WRN")
                    time.sleep(15)
                    continue
                if r.status_code == 400:
                    return r
            except Exception:
                if i == 4:
                    return None
                time.sleep(2)
        return None

    def cycle(self):
        self.stats["cycles"] += 1
        log("─── cycle #" + str(self.stats["cycles"]) + " ───", self.short, "CYC")

        # 1) جمع
        r = self.api("GET", API + "/rest/v1/ships_owned?"
                     "select=id,catalog_code,at_sea,hp,max_hp,preferred_fish_id"
                     "&user_id=eq." + self.uid + "&in_storage=eq.false")
        ships = r.json() if r and r.status_code == 200 else []
        at_sea = [s for s in ships if s.get("at_sea")]
        at_port = [s for s in ships if not s.get("at_sea")]
        log("ships: " + str(len(ships)) + " | sea: " + str(len(at_sea))
            + " | port: " + str(len(at_port)), self.short)

        collected = 0
        for s in at_sea:
            fish = s.get("preferred_fish_id") or "poseidon"
            rr = self.api("POST", API + "/rest/v1/rpc/collect_fishing_reward",
                          json={"_ship_id": s["id"],
                                "_requested_fish_id": fish,
                                "_client_progress": 5000})
            if rr and rr.status_code == 200:
                collected += 1
                log("  ✓ collect " + s["catalog_code"], self.short, "OK")
            self.api("POST", API + "/rest/v1/rpc/set_ship_at_sea",
                     json={"_ship_id": s["id"], "_at_sea": False})
            time.sleep(random.uniform(0.3, 1.0))
        self.stats["collected"] += collected

        # 2) بيع
        r = self.api("POST", API + "/rest/v1/rpc/get_fish_stock_summary", json={})
        stock = r.json() if r and r.status_code == 200 else []
        sold = 0
        for item in stock:
            fid = item.get("fish_id")
            qty = item.get("qty", 0)
            if not fid or qty <= 0:
                continue
            rr = self.api("POST", API + "/rest/v1/rpc/sell_fish_by_qty",
                          json={"_fish_id": fid, "_qty": qty,
                                "_client_version": CV})
            if rr and rr.status_code == 200:
                sold += qty
                log("  ✓ sell " + str(qty) + "x" + fid, self.short, "SELL")
            time.sleep(random.uniform(0.3, 0.8))
        self.stats["sold"] += sold

        # 3) إرسال
        r = self.api("GET", API + "/rest/v1/ships_owned?"
                     "select=id,catalog_code,at_sea,hp,max_hp"
                     "&user_id=eq." + self.uid + "&in_storage=eq.false")
        ships = r.json() if r and r.status_code == 200 else []
        sent = 0
        for s in ships:
            if s.get("at_sea"):
                continue
            if s.get("hp", 0) <= s.get("max_hp", 1) * 0.3:
                log("  skip " + s["catalog_code"] + " (HP)", self.short, "WRN")
                continue
            rr = self.api("POST", API + "/rest/v1/rpc/set_ship_at_sea",
                          json={"_ship_id": s["id"], "_at_sea": True})
            if rr and rr.status_code == 200:
                sent += 1
                log("  → " + s["catalog_code"] + " SEA", self.short)
            time.sleep(random.uniform(0.3, 1.0))

        # 4) الذهب
        r = self.api("GET", API + "/rest/v1/profiles?id=eq."
                     + self.uid + "&select=coins")
        if r and r.status_code == 200:
            try:
                self.stats["gold"] = r.json()[0].get("coins", 0)
            except Exception:
                pass

        log("SUM: collected=" + str(collected) + " sold=" + str(sold)
            + " sent=" + str(sent) + " gold=" + str(self.stats["gold"]),
            self.short, ">>")

        with GLOBAL_STATS_LOCK:
            GLOBAL["total_cycles"] += 1
            GLOBAL["total_collected"] += collected
            GLOBAL["total_sold"] += sold
            GLOBAL["total_gold"] += self.stats["gold"]


# ═══════════════════════════════════════════════════════════════════
# WORKER — لا يتوقف أبداً
# ═══════════════════════════════════════════════════════════════════
def worker(cfg, idx):
    time.sleep(idx * STAGGER)
    acc = Account(cfg["email"], cfg["password"], idx)
    GLOBAL["accounts_ref"].append(acc)

    while True:
        try:
            if not acc.token:
                if not acc.login():
                    log("login failed — retry in 60s", acc.short, "ERR")
                    time.sleep(60)
                    continue

            try:
                acc.cycle()
            except Exception as e:
                acc.stats["errors"] += 1
                log("cycle error: " + str(e)[:100], acc.short, "ERR")
                traceback.print_exc()

            log("wait " + str(CYCLE_SECONDS) + "s", acc.short)
            rem = CYCLE_SECONDS
            while rem > 0:
                time.sleep(min(5, rem))
                rem -= 5

        except KeyboardInterrupt:
            return
        except Exception as e:
            log("worker outer error: " + str(e)[:100], acc.short, "ERR")
            traceback.print_exc()
            time.sleep(60)


# ═══════════════════════════════════════════════════════════════════
# FLASK
# ═══════════════════════════════════════════════════════════════════
app = Flask(__name__)


@app.route("/")
def root():
    return "CIPHER ULTRA v13 - NEVER STOP - " + str(len(ACCOUNTS)) + " accounts", 200


@app.route("/api/healthz")
def healthz():
    return jsonify({
        "status": "ok",
        "version": "13.0-NEVER-STOP",
        "accounts": len(ACCOUNTS),
        "uptime": time.time() - GLOBAL["started_at"],
        "total_cycles": GLOBAL["total_cycles"],
    }), 200


@app.route("/api/status")
def status():
    with GLOBAL_STATS_LOCK:
        accs = []
        for a in GLOBAL["accounts_ref"]:
            accs.append({
                "short": a.short,
                "state": a.state,
                "cycles": a.stats["cycles"],
                "collected": a.stats["collected"],
                "sold": a.stats["sold"],
                "gold": a.stats["gold"],
                "errors": a.stats["errors"],
            })
        return jsonify({
            "total_accounts": len(accs),
            "total_cycles": GLOBAL["total_cycles"],
            "total_collected": GLOBAL["total_collected"],
            "total_sold": GLOBAL["total_sold"],
            "total_gold": GLOBAL["total_gold"],
            "uptime": time.time() - GLOBAL["started_at"],
            "accounts": accs,
            "logs": GLOBAL["logs"][-80:],
        })


if __name__ == "__main__":
    print("=" * 60)
    print("CIPHER ULTRA v13 — NEVER STOP (RENDER)")
    print("=" * 60)
    print("Accounts loaded: " + str(len(ACCOUNTS)))
    print("Cycle: " + str(CYCLE_SECONDS) + "s")
    print("=" * 60)

    if not ACCOUNTS:
        print("WARNING: no accounts in env vars")
        print("Set ACC1_EMAIL ... ACC12_EMAIL and ACC1_PASS ... ACC12_PASS")

    for i, cfg in enumerate(ACCOUNTS):
        t = threading.Thread(target=worker, args=(cfg, i), daemon=True)
        t.start()
        time.sleep(0.3)

    port = int(os.environ.get("PORT", 8080))
    print("Dashboard: http://0.0.0.0:" + str(port))
    app.run(host="0.0.0.0", port=port, use_reloader=False)
