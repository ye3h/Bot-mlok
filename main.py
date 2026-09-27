import os, sys, json, time, random, threading, requests, re
from datetime import datetime as dt, timedelta, timezone
from flask import Flask, jsonify, render_template_string

API = "https://qjwbfkpudysxqtkeouwu.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqd2Jma3B1ZHlzeHF0a2VvdXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDEyNDksImV4cCI6MjA5NTMxNzI0OX0.rs4NXx8bMPQ3k8Zgf_F3efeDPuAsxPlqS0bZ3cFE9dI"

FISH_INTERVAL_SECONDS = int(os.environ.get("FISH_INTERVAL_SECONDS", "660"))
MAIN_INTERVAL_HOURS   = int(os.environ.get("MAIN_INTERVAL_HOURS", "20"))
MAIN_INTERVAL_SECONDS = MAIN_INTERVAL_HOURS * 3600
PHASE_DURATION_SEC    = int(os.environ.get("PHASE_DURATION_SEC", "300"))

MAIN_ENABLED = os.environ.get("MAIN_ENABLED", "1") == "1"
FISH_ENABLED = os.environ.get("FISH_ENABLED", "1") == "1"

MIN_HP_PCT       = 0.3
BUY_ROCKET_COUNT = int(os.environ.get("BUY_ROCKET_COUNT", "30"))
BOSS_ATTACKS     = int(os.environ.get("BOSS_ATTACKS", "5"))
DONATE_AMOUNT    = int(os.environ.get("DONATE_AMOUNT", "10000"))
CV = "fish-market-v20260626-force-update-1"

USER_AGENTS = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1",
]

PAUSE_FISH = threading.Event()

def load_accounts():
    accounts = []
    for i in range(1, 31):
        e = os.environ.get("ACC" + str(i) + "_EMAIL", "").strip()
        p = os.environ.get("ACC" + str(i) + "_PASS", "").strip()
        if e and p:
            accounts.append({"email": e, "password": p})
    return accounts

ACCOUNTS = load_accounts()

LOCK = threading.Lock()
STATS = {
    "started_at": time.time(),
    "login": 0, "login_fail": 0,
    "daily": 0, "quest_ok": 0, "free": 0, "bought": 0,
    "attacked": 0, "damage": 0, "donated": 0,
    "collected": 0, "sold": 0,
    "fish_cycles": 0, "main_cycles": 0,
    "last_fish": None, "last_main": None, "last_run": None,
    "errors": 0,
    "account_stats": {},
}

LOG_LINES = []
LOG_LOCK = threading.Lock()

def log(msg, tag=""):
    ts = dt.now().strftime("%H:%M:%S")
    p = "[" + ts + "]"
    if tag:
        p += "[" + tag[:8] + "]"
    line = p + " " + msg
    with LOG_LOCK:
        print(line)
        sys.stdout.flush()
        LOG_LINES.append(line)
        if len(LOG_LINES) > 500:
            LOG_LINES.pop(0)

def bump(k, n=1):
    with LOCK:
        STATS[k] = STATS.get(k, 0) + n

def acc_bump(email, k, n=1):
    with LOCK:
        if email not in STATS["account_stats"]:
            STATS["account_stats"][email] = {
                "gems": 0, "coins": 0, "fish": 0,
                "damage": 0, "donated": 0,
            }
        STATS["account_stats"][email][k] = STATS["account_stats"][email].get(k, 0) + n

def riyadh_date():
    return (dt.now(timezone.utc) + timedelta(hours=3)).strftime("%Y-%m-%d")

class Acc:
    def __init__(self, cfg, idx):
        self.email = cfg["email"]
        self.pw = cfg["password"]
        self.short = self.email.split("@")[0][-8:]
        self.ua = random.choice(USER_AGENTS)
        self.token = None
        self.refresh = None
        self.uid = None
        self.expires = 0
        self.s = requests.Session()

    def head(self, body=False):
        h = {
            "apikey": KEY,
            "Accept": "application/json",
            "Accept-Language": "ar-SA,ar;q=0.9,en-US;q=0.8",
            "User-Agent": self.ua,
            "Origin": "https://www.molok-alqarasna.com",
            "Referer": "https://www.molok-alqarasna.com/",
        }
        if body:
            h["Content-Type"] = "application/json"
        if self.token:
            h["Authorization"] = "Bearer " + self.token
        return h

    def login(self):
        for attempt in range(4):
            try:
                time.sleep(random.uniform(0.3, 0.9))
                r = self.s.post(
                    API + "/auth/v1/token?grant_type=password",
                    headers={"apikey": KEY, "Content-Type": "application/json", "User-Agent": self.ua},
                    json={"email": self.email, "password": self.pw},
                    timeout=30,
                )
                if r.status_code == 200:
                    d = r.json()
                    self.token = d["access_token"]
                    self.refresh = d.get("refresh_token")
                    self.uid = d["user"]["id"]
                    self.expires = time.time() + d.get("expires_in", 3600) - 300
                    return True
                if r.status_code == 429:
                    time.sleep((attempt + 1) * 20)
                    continue
                if attempt < 3:
                    time.sleep(3)
                    continue
                log("login " + str(r.status_code), self.short)
                return False
            except Exception as e:
                log("err: " + str(e)[:50], self.short)
                time.sleep(5)
        return False

    def ensure(self):
        if self.token and time.time() < self.expires:
            return True
        if self.refresh:
            try:
                r = self.s.post(
                    API + "/auth/v1/token?grant_type=refresh_token",
                    headers={"apikey": KEY, "Content-Type": "application/json"},
                    json={"refresh_token": self.refresh},
                    timeout=30,
                )
                if r.status_code == 200:
                    d = r.json()
                    self.token = d["access_token"]
                    self.refresh = d.get("refresh_token", self.refresh)
                    self.expires = time.time() + d.get("expires_in", 3600) - 300
                    return True
            except:
                pass
        return self.login()

    def rpc(self, name, body=None):
        self.ensure()
        try:
            r = self.s.post(
                API + "/rest/v1/rpc/" + name,
                headers=self.head(True),
                json=body or {},
                timeout=30,
            )
            return r.status_code, r.text
        except Exception as e:
            return 0, str(e)

    def get(self, path):
        self.ensure()
        try:
            r = self.s.get(API + "/rest/v1/" + path, headers=self.head(), timeout=30)
            return r.status_code, r.text
        except Exception as e:
            return 0, str(e)

    def claim_daily(self):
        st, tx = self.rpc("claim_daily_login_pirate", {})
        if st == 200:
            log("daily login reward", self.short)
            bump("daily")
            return True
        return False

    def do_quests(self):
        st, tx = self.get("daily_quests?select=*&active=eq.true")
        if st != 200:
            return
        try:
            meta = {q["id"]: q for q in json.loads(tx)}
        except:
            return
        tk = riyadh_date()
        st, tx = self.get("quest_progress?select=*&user_id=eq." + self.uid + "&day_key=eq." + tk)
        if st != 200:
            return
        try:
            prog = json.loads(tx)
        except:
            return
        for p in prog:
            if p.get("claimed"):
                continue
            qid = p.get("quest_id")
            q = meta.get(qid, {})
            if (p.get("progress") or 0) < (q.get("goal_count") or 0):
                continue
            st, tx = self.rpc("claim_daily_quest", {"_quest_id": qid})
            if st == 200:
                title = str(q.get("title", "?"))[:18]
                try:
                    j = json.loads(tx)
                    g = j.get("gems", 0)
                    c = j.get("coins", 0)
                    log("quest " + title + " +" + str(g) + "g +" + str(c) + "c", self.short)
                    acc_bump(self.email, "gems", g)
                    acc_bump(self.email, "coins", c)
                except:
                    log("quest " + title, self.short)
                bump("quest_ok")
            time.sleep(random.uniform(0.5, 1.0))

    def claim_free_rockets(self):
        st, tx = self.rpc("claim_daily_dragon_rockets", {})
        if st == 200:
            log("free rockets", self.short)
            bump("free")

    def buy_rockets(self, total=None):
        if total is None:
            total = BUY_ROCKET_COUNT
        bought = 0
        for _ in range(10):
            st, tx = self.rpc("buy_with_coins", {
                "_item_id": "rocket_large",
                "_item_type": "weapon",
                "_coins_cost": 90000,
                "_meta": None,
                "_count": 10,
            })
            if st in (200, 204):
                bought += 10
                log("buy +10 (" + str(bought) + ")", self.short)
            elif "rocket_daily_limit" in tx:
                try:
                    rem = int(tx.split("rocket_daily_limit:")[1].split(":")[0])
                except:
                    rem = 0
                if rem > 0:
                    st2, _ = self.rpc("buy_with_coins", {
                        "_item_id": "rocket_large",
                        "_item_type": "weapon",
                        "_coins_cost": 90000,
                        "_meta": None,
                        "_count": rem,
                    })
                    if st2 in (200, 204):
                        bought += rem
                break
            else:
                break
            time.sleep(1.8)
        if bought:
            log("bought " + str(bought) + " rockets", self.short)
            bump("bought", bought)

    def top_ship(self):
        st, tx = self.get(
            "ships_owned?select=id,catalog_code,hp,max_hp&user_id=eq." + self.uid +
            "&destroyed_at=is.null&order=hp.desc&limit=1"
        )
        if st != 200:
            return None
        try:
            arr = json.loads(tx)
            return arr[0] if arr else None
        except:
            return None

    def attack_boss(self, times=None):
        if times is None:
            times = BOSS_ATTACKS
        st, tx = self.rpc("get_active_boss", {})
        if st != 200:
            return
        st, tx = self.rpc("boss_attack_status", {})
        remaining = times
        if st == 200:
            try:
                j = json.loads(tx)
                remaining = min(times, j.get("remaining", times))
            except:
                pass
        if remaining <= 0:
            return
        ship = self.top_ship()
        if not ship:
            return
        if (ship.get("hp") or 0) / (ship.get("max_hp") or 1) < MIN_HP_PCT:
            return
        ship_id = ship["id"]
        hits = 0
        dmg_total = 0
        for i in range(remaining):
            st, tx = self.get("ships_owned?select=hp,max_hp&id=eq." + ship_id)
            try:
                cur = json.loads(tx)[0]
                if (cur.get("hp") or 0) / (cur.get("max_hp") or 1) < MIN_HP_PCT:
                    break
            except:
                pass
            st, tx = self.rpc("attack_boss_with", {"p_weapon": "rocket_large"})
            if st == 200:
                hits += 1
                try:
                    j = json.loads(tx)
                    dmg_total += j.get("damage", 0)
                except:
                    pass
            else:
                break
            time.sleep(random.uniform(1.5, 2.5))
        if hits:
            log("boss " + str(hits) + " hits dmg=" + str(dmg_total), self.short)
            bump("attacked", hits)
            bump("damage", dmg_total)
            acc_bump(self.email, "damage", dmg_total)

    def donate_tribe(self):
        st, tx = self.get("profiles?id=eq." + self.uid + "&select=tribe_id,coins")
        if st != 200:
            return
        try:
            p = json.loads(tx)[0]
            tid = p.get("tribe_id")
            coins = p.get("coins") or 0
        except:
            return
        if not tid:
            log("no tribe", self.short)
            return
        if coins < DONATE_AMOUNT:
            log("low coins: " + "{:,}".format(coins), self.short)
            return
        st, tx = self.rpc("donate_to_tribe", {"_tribe_id": tid, "_amount": DONATE_AMOUNT})
        if st in (200, 204):
            log("donate " + str(DONATE_AMOUNT) + " -> " + tid[:8], self.short)
            bump("donated")
            acc_bump(self.email, "donated", DONATE_AMOUNT)

    def fish_cycle(self):
        st, tx = self.get(
            "ships_owned?select=id,catalog_code,at_sea,hp,max_hp,preferred_fish_id"
            "&user_id=eq." + self.uid + "&in_storage=eq.false"
        )
        if st != 200:
            return 0, 0, 0
        try:
            ships = json.loads(tx)
        except:
            return 0, 0, 0
        at_sea = [s for s in ships if s.get("at_sea")]
        collected = 0
        total_fish = 0
        for s in at_sea:
            fish = s.get("preferred_fish_id") or "poseidon"
            st, tx = self.rpc("collect_fishing_reward", {
                "_ship_id": s["id"],
                "_requested_fish_id": fish,
                "_client_progress": 5000,
            })
            if st == 200:
                collected += 1
                try:
                    arr = json.loads(tx)
                    if arr:
                        qty = arr[0].get("fish_qty", 0)
                        total_fish += qty
                        fid = arr[0].get("fish_id", "?")
                        log("collect " + str(s.get("catalog_code")) + " " + str(qty) + "x" + fid, self.short)
                except:
                    pass
            self.rpc("set_ship_at_sea", {"_ship_id": s["id"], "_at_sea": False})
            time.sleep(random.uniform(0.3, 0.7))

        st, tx = self.rpc("get_fish_stock_summary", {})
        sold = 0
        if st == 200:
            try:
                stock = json.loads(tx)
            except:
                stock = []
            for item in stock:
                fid = item.get("fish_id")
                qty = item.get("qty", 0)
                if not fid or qty <= 0:
                    continue
                st2, _ = self.rpc("sell_fish_by_qty", {
                    "_fish_id": fid,
                    "_qty": qty,
                    "_client_version": CV,
                })
                if st2 in (200, 204):
                    sold += qty
                    log("sell " + str(qty) + "x" + fid, self.short)
                time.sleep(random.uniform(0.3, 0.7))

        st, tx = self.get(
            "ships_owned?select=id,catalog_code,at_sea,hp,max_hp"
            "&user_id=eq." + self.uid + "&in_storage=eq.false"
        )
        sent = 0
        if st == 200:
            try:
                ships2 = json.loads(tx)
            except:
                ships2 = []
            for s in ships2:
                if s.get("at_sea"):
                    continue
                hp = s.get("hp") or 0
                mx = s.get("max_hp") or 1
                if hp / mx < MIN_HP_PCT:
                    continue
                st2, _ = self.rpc("set_ship_at_sea", {"_ship_id": s["id"], "_at_sea": True})
                if st2 in (200, 204):
                    sent += 1
                time.sleep(random.uniform(0.3, 0.7))
        bump("collected", collected)
        bump("sold", sold)
        if total_fish:
            acc_bump(self.email, "fish", total_fish)
        return collected, sold, sent

def fish_worker(cfg, idx):
    time.sleep(idx * 0.3)
    acc = Acc(cfg, idx)
    if not acc.login():
        bump("login_fail")
        return
    c, s, sent = acc.fish_cycle()
    bump("fish_cycles")
    log("cycle collect=" + str(c) + " sold=" + str(s) + " sent=" + str(sent), acc.short)

def worker_boss_rockets(cfg, idx):
    time.sleep(idx * 0.5)
    acc = Acc(cfg, idx)
    if not acc.login():
        bump("login_fail")
        return
    bump("login")
    acc.claim_free_rockets()
    time.sleep(0.5)
    acc.buy_rockets(30)
    time.sleep(0.5)
    acc.attack_boss(5)

def worker_daily_quests(cfg, idx):
    time.sleep(idx * 0.5)
    acc = Acc(cfg, idx)
    if not acc.login():
        bump("login_fail")
        return
    bump("login")
    acc.claim_daily()
    time.sleep(0.5)
    acc.do_quests()

def worker_donate(cfg, idx):
    time.sleep(idx * 0.5)
    acc = Acc(cfg, idx)
    if not acc.login():
        bump("login_fail")
        return
    bump("login")
    acc.donate_tribe()

def run_parallel(worker, name, stagger=0.5):
    log("=" * 40)
    log(name)
    log("=" * 40)
    threads = []
    for i, cfg in enumerate(ACCOUNTS):
        t = threading.Thread(target=worker, args=(cfg, i))
        t.start()
        threads.append(t)
        time.sleep(stagger)
    for t in threads:
        t.join()

def run_phase(worker, name):
    log(name + " - start")
    start = time.time()
    run_parallel(worker, name)
    elapsed = time.time() - start
    remaining = PHASE_DURATION_SEC - elapsed
    if remaining > 0:
        log(name + " done in " + str(int(elapsed)) + "s - waiting " + str(int(remaining)) + "s")
        time.sleep(remaining)
    else:
        log(name + " done in " + str(int(elapsed)) + "s (exceeded)")
    log(name + " complete")

def run_fish_cycle():
    if PAUSE_FISH.is_set():
        log("fish paused - skip")
        return
    run_parallel(fish_worker, "FISH CYCLE", stagger=0.3)
    with LOCK:
        STATS["last_fish"] = time.time()

def run_main_cycle():
    PAUSE_FISH.set()
    total_start = time.time()
    try:
        log("=" * 50)
        log("PAUSED FISH - starting MAIN")
        log("=" * 50)
        run_phase(worker_boss_rockets, "PHASE 1: rockets + boss")
        run_phase(worker_daily_quests, "PHASE 2: daily + quests")
        run_phase(worker_donate, "PHASE 3: donate tribe")
        with LOCK:
            STATS["last_run"] = time.time()
        bump("main_cycles")
    except Exception as e:
        log("main err: " + str(e)[:150])
        bump("errors")
    finally:
        PAUSE_FISH.clear()
        total = int(time.time() - total_start)
        log("=" * 50)
        log("RESUMED FISH - main took " + str(total // 60) + "m " + str(total % 60) + "s")
        log("=" * 50)

def fish_loop_thread():
    time.sleep(15)
    while True:
        if PAUSE_FISH.is_set():
            log("fish paused - waiting...")
            while PAUSE_FISH.is_set():
                time.sleep(5)
        if FISH_ENABLED:
            try:
                run_fish_cycle()
            except Exception as e:
                log("fish err: " + str(e)[:150])
                bump("errors")
        log("next fish in " + str(FISH_INTERVAL_SECONDS) + "s")
        end = time.time() + FISH_INTERVAL_SECONDS
        while time.time() < end:
            if PAUSE_FISH.is_set():
                break
            time.sleep(5)

def scheduler_thread():
    time.sleep(5)
    while True:
        try:
            if MAIN_ENABLED:
                run_main_cycle()
        except Exception as e:
            log("scheduler err: " + str(e)[:150])
            bump("errors")
        log("next main in " + str(MAIN_INTERVAL_HOURS) + "h")
        end = time.time() + MAIN_INTERVAL_SECONDS
        while time.time() < end:
            time.sleep(30)

app = Flask(__name__)

@app.route("/")
def index():
    uptime = int(time.time() - STATS["started_at"])
    h = uptime // 3600
    m = (uptime % 3600) // 60
    def ago(t):
        return int(time.time() - t) if t else "-"
    fish_status = "PAUSED" if PAUSE_FISH.is_set() else "RUNNING"
    html = """
    <!DOCTYPE html><html lang="ar" dir="rtl"><head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>CIPHER UNIFIED v3</title><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,sans-serif;background:#0a0e1a;color:#e0e0e0;padding:20px}
    h1{color:#fbbf24;margin-bottom:20px;font-size:24px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px}
    .card{background:#111827;border:1px solid #1f2937;border-radius:10px;padding:16px}
    .card .label{font-size:12px;color:#9ca3af;margin-bottom:6px}
    .card .value{font-size:22px;font-weight:bold;color:#fbbf24}
    .log{background:#000;border-radius:8px;padding:14px;font-family:monospace;font-size:11px;max-height:500px;overflow-y:auto}
    .log div{padding:2px 0;border-bottom:1px solid #111}
    .green{color:#4ade80}.red{color:#f87171}.yellow{color:#fbbf24}
    </style></head><body>
    <h1>CIPHER UNIFIED v3</h1>
    <p style="color:#9ca3af;margin-bottom:20px;">
      Accounts: {{ acc_count }} | Uptime: {{ h }}h {{ m }}m<br>
      Fish: every {{ fish_int }}s | Main: every {{ main_int }}h<br>
      Fish Status: <b class="yellow">{{ fish_status }}</b>
    </p>
    <div class="grid">
      <div class="card"><div class="label">Fish Cycles</div><div class="value">{{ fish_cycles }}</div></div>
      <div class="card"><div class="label">Collected</div><div class="value">{{ collected }}</div></div>
      <div class="card"><div class="label">Fish Sold</div><div class="value">{{ sold }}</div></div>
      <div class="card"><div class="label">Main Cycles</div><div class="value">{{ main_cycles }}</div></div>
      <div class="card"><div class="label">Daily</div><div class="value">{{ daily }}</div></div>
      <div class="card"><div class="label">Quests</div><div class="value">{{ quest_ok }}</div></div>
      <div class="card"><div class="label">Free Rockets</div><div class="value">{{ free }}</div></div>
      <div class="card"><div class="label">Bought</div><div class="value">{{ bought }}</div></div>
      <div class="card"><div class="label">Attacks</div><div class="value">{{ attacked }}</div></div>
      <div class="card"><div class="label">Damage</div><div class="value">{{ damage }}</div></div>
      <div class="card"><div class="label">Donated</div><div class="value">{{ donated }}</div></div>
      <div class="card"><div class="label">Login OK</div><div class="value green">{{ login }}</div></div>
      <div class="card"><div class="label">Login Fail</div><div class="value red">{{ login_fail }}</div></div>
      <div class="card"><div class="label">Errors</div><div class="value red">{{ errors }}</div></div>
    </div>
    <p style="color:#9ca3af;margin-bottom:10px;">
      Last run: {{ last_run }}s | Last main: {{ last_main }}s | Last fish: {{ last_fish }}s
    </p>
    <h2 style="color:#fbbf24;margin:20px 0 10px;font-size:18px;">Live Log</h2>
    <div class="log">{% for line in logs %}<div>{{ line }}</div>{% endfor %}</div>
    </body></html>
    """
    return render_template_string(
        html,
        acc_count=len(ACCOUNTS),
        h=h, m=m,
        fish_int=FISH_INTERVAL_SECONDS,
        main_int=MAIN_INTERVAL_HOURS,
        fish_status=fish_status,
        fish_cycles=STATS["fish_cycles"],
        main_cycles=STATS["main_cycles"],
        collected=STATS["collected"],
        sold="{:,}".format(STATS["sold"]),
        daily=STATS["daily"],
        quest_ok=STATS["quest_ok"],
        free=STATS["free"],
        bought=STATS["bought"],
        attacked=STATS["attacked"],
        damage="{:,}".format(STATS["damage"]),
        donated=STATS["donated"],
        login=STATS["login"],
        login_fail=STATS["login_fail"],
        errors=STATS["errors"],
        last_run=ago(STATS["last_run"]),
        last_main=ago(STATS["last_main"]),
        last_fish=ago(STATS["last_fish"]),
        logs=LOG_LINES[-150:],
    )

@app.route("/health")
@app.route("/healthz")
def health():
    return jsonify({"ok": True, "uptime": int(time.time() - STATS["started_at"])})

@app.route("/api/status")
def api_status():
    return jsonify({
        "accounts": len(ACCOUNTS),
        "fish_interval": FISH_INTERVAL_SECONDS,
        "main_interval_hours": MAIN_INTERVAL_HOURS,
        "phase_duration": PHASE_DURATION_SEC,
        "fish_paused": PAUSE_FISH.is_set(),
        "stats": {k: v for k, v in STATS.items() if k != "account_stats"},
        "account_stats": STATS["account_stats"],
    })

@app.route("/trigger", methods=["POST", "GET"])
def trigger():
    threading.Thread(target=run_main_cycle, daemon=True).start()
    return jsonify({"ok": True, "msg": "main triggered"})

def start_all():
    if not ACCOUNTS:
        log("no accounts configured", "INIT")
        return
    log("start " + str(len(ACCOUNTS)) + " accounts", "INIT")
    log("fish: every " + str(FISH_INTERVAL_SECONDS) + "s", "INIT")
    log("main: every " + str(MAIN_INTERVAL_HOURS) + "h", "INIT")
    threading.Thread(target=fish_loop_thread, daemon=True).start()
    threading.Thread(target=scheduler_thread, daemon=True).start()

start_all()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False)
