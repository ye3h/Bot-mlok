import os, sys, json, time, random, threading, requests
from datetime import datetime as dt, timedelta
from flask import Flask, jsonify, render_template_string

API = "https://qjwbfkpudysxqtkeouwu.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqd2Jma3B1ZHlzeHF0a2VvdXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDEyNDksImV4cCI6MjA5NTMxNzI0OX0.rs4NXx8bMPQ3k8Zgf_F3efeDPuAsxPlqS0bZ3cFE9dI"
CV = "fish-market-v20260626-force-update-1"

def load_accounts():
    accounts = []
    j = os.environ.get("ACCOUNTS_JSON", "").strip()
    if j:
        try:
            arr = json.loads(j)
            accounts = [a for a in arr if a.get("email") and a.get("password")]
            print("[CONFIG] Loaded " + str(len(accounts)) + " accounts from ACCOUNTS_JSON")
            return accounts
        except Exception as e:
            print("[CONFIG] ACCOUNTS_JSON parse error: " + str(e))
    for i in range(1, 21):
        e = os.environ.get("ACC" + str(i) + "_EMAIL", "").strip()
        p = os.environ.get("ACC" + str(i) + "_PASS", "").strip()
        if e and p:
            accounts.append({"email": e, "password": p})
    print("[CONFIG] Loaded " + str(len(accounts)) + " accounts from ACC*_EMAIL/PASS")
    return accounts

ACCOUNTS = load_accounts()

MAIN_INTERVAL = int(os.environ.get("MAIN_INTERVAL_HOURS", "6")) * 3600
FISH_INTERVAL = int(os.environ.get("FISH_INTERVAL_SECONDS", "300"))
STAGGER = 3
MIN_HP_PCT = 0.3
BUY_ROCKET_COUNT = int(os.environ.get("BUY_ROCKET_COUNT", "30"))
BOSS_ATTACKS = int(os.environ.get("BOSS_ATTACKS", "5"))
DONATE_AMOUNT = int(os.environ.get("DONATE_AMOUNT", "10000"))

UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1"

LOCK = threading.Lock()
STATS = {
    "started_at": time.time(),
    "login": 0, "login_fail": 0,
    "daily": 0, "quest_ok": 0, "free": 0, "bought": 0,
    "attacked": 0, "damage": 0, "donated": 0,
    "collected": 0, "sold": 0,
    "fish_cycles": 0, "main_cycles": 0,
    "last_fish": None, "last_main": None,
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
        if len(LOG_LINES) > 200:
            LOG_LINES.pop(0)

def bump(k, n=1):
    with LOCK:
        STATS[k] = STATS.get(k, 0) + n

def acc_bump(email, k, n=1):
    with LOCK:
        if email not in STATS["account_stats"]:
            STATS["account_stats"][email] = {"gems": 0, "coins": 0, "fish": 0, "damage": 0, "errors": 0}
        STATS["account_stats"][email][k] = STATS["account_stats"][email].get(k, 0) + n

def riyadh_date():
    return (dt.utcnow() + timedelta(hours=3)).strftime("%Y-%m-%d")

class Acc:
    def __init__(self, cfg, idx):
        self.email = cfg["email"]
        self.pw = cfg["password"]
        self.short = self.email.split("@")[0][-8:]
        self.token = None
        self.refresh = None
        self.uid = None
        self.expires = 0
        self.s = requests.Session()

    def head(self, body=False):
        h = {
            "apikey": KEY,
            "Accept": "application/json",
            "User-Agent": UA,
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
                r = self.s.post(
                    API + "/auth/v1/token?grant_type=password",
                    headers={"apikey": KEY, "Content-Type": "application/json", "User-Agent": UA},
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
                    wait = (attempt + 1) * 20
                    log("rate limit " + str(wait) + "s", self.short)
                    time.sleep(wait)
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

    def buy_rockets(self):
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

    def attack_boss(self):
        st, tx = self.rpc("get_active_boss", {})
        if st != 200:
            return
        st, tx = self.rpc("boss_attack_status", {})
        remaining = BOSS_ATTACKS
        if st == 200:
            try:
                j = json.loads(tx)
                remaining = min(BOSS_ATTACKS, j.get("remaining", BOSS_ATTACKS))
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
                    dmg = j.get("damage", 0)
                    dmg_total += dmg
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
        if not tid or coins < DONATE_AMOUNT:
            return
        st, tx = self.rpc("donate_to_tribe", {"_tribe_id": tid, "_amount": DONATE_AMOUNT})
        if st in (200, 204):
            log("donate " + str(DONATE_AMOUNT), self.short)
            bump("donated")

    def collect_all(self):
        st, tx = self.get(
            "ships_owned?select=id,catalog_code,at_sea,preferred_fish_id&user_id=eq." +
            self.uid + "&in_storage=eq.false&at_sea=eq.true"
        )
        if st != 200:
            return 0
        try:
            ships = json.loads(tx)
        except:
            return 0
        collected = 0
        total_fish = 0
        for s in ships:
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
            time.sleep(random.uniform(0.4, 0.9))
        bump("collected", collected)
        if total_fish:
            acc_bump(self.email, "fish", total_fish)
        return collected

    def sell_fish(self):
        st, tx = self.rpc("get_fish_stock_summary", {})
        if st != 200:
            return 0
        try:
            stock = json.loads(tx)
        except:
            return 0
        sold = 0
        for it in (stock or []):
            fid = it.get("fish_id")
            qty = it.get("qty", 0)
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
            time.sleep(random.uniform(0.4, 0.9))
        bump("sold", sold)
        return sold

    def send_ships_to_sea(self):
        st, tx = self.get(
            "ships_owned?select=id,catalog_code,hp,max_hp,destroyed_at&user_id=eq." +
            self.uid + "&in_storage=eq.true"
        )
        if st != 200:
            return 0
        try:
            ships = json.loads(tx)
        except:
            return 0
        sent = 0
        for s in ships:
            if s.get("destroyed_at"):
                continue
            hp = s.get("hp") or 0
            mx = s.get("max_hp") or 1
            if hp / mx < MIN_HP_PCT:
                continue
            st2, _ = self.rpc("set_ship_at_sea", {"_ship_id": s["id"], "_at_sea": True})
            if st2 in (200, 204):
                sent += 1
            time.sleep(random.uniform(0.4, 0.8))
        if sent:
            log("send " + str(sent) + " ships to sea", self.short)
        return sent

MAIN_LOG = {}

def main_worker(cfg, idx):
    time.sleep(idx * STAGGER)
    acc = Acc(cfg, idx)
    if not acc.login():
        bump("login_fail")
        return
    bump("login")
    log("main start", acc.short)
    key = acc.email + ":daily"
    if MAIN_LOG.get(key) != riyadh_date():
        acc.claim_daily()
        MAIN_LOG[key] = riyadh_date()
    time.sleep(1)
    acc.do_quests()
    time.sleep(1)
    acc.claim_free_rockets()
    time.sleep(1)
    acc.buy_rockets()
    time.sleep(1)
    acc.attack_boss()
    time.sleep(1)
    acc.donate_tribe()
    log("main end", acc.short)

def fish_worker(cfg, idx):
    time.sleep(idx * 1.5)
    acc = Acc(cfg, idx)
    if not acc.login():
        bump("login_fail")
        return
    c = acc.collect_all()
    s = acc.sell_fish()
    acc.send_ships_to_sea()
    bump("fish_cycles")
    log("fish collect=" + str(c) + " sold=" + str(s), acc.short)

def run_main_cycle():
    log("=" * 40)
    log("MAIN CYCLE")
    log("=" * 40)
    threads = []
    for i, cfg in enumerate(ACCOUNTS):
        t = threading.Thread(target=main_worker, args=(cfg, i))
        t.start()
        threads.append(t)
        time.sleep(0.5)
    for t in threads:
        t.join()
    bump("main_cycles")
    with LOCK:
        STATS["last_main"] = time.time()

def run_fish_cycle():
    log("=" * 40)
    log("FISH CYCLE")
    log("=" * 40)
    threads = []
    for i, cfg in enumerate(ACCOUNTS):
        t = threading.Thread(target=fish_worker, args=(cfg, i))
        t.start()
        threads.append(t)
        time.sleep(0.3)
    for t in threads:
        t.join()
    with LOCK:
        STATS["last_fish"] = time.time()

def main_thread():
    run_main_cycle()
    while True:
        log("next main in " + str(MAIN_INTERVAL // 3600) + "h")
        time.sleep(MAIN_INTERVAL)
        run_main_cycle()

def fish_thread():
    while True:
        run_fish_cycle()
        log("next fish in " + str(FISH_INTERVAL) + "s")
        time.sleep(FISH_INTERVAL)

app = Flask(__name__)

@app.route("/")
def index():
    uptime = int(time.time() - STATS["started_at"])
    h = uptime // 3600
    m = (uptime % 3600) // 60
    last_fish = STATS["last_fish"]
    last_main = STATS["last_main"]
    fish_ago = int(time.time() - last_fish) if last_fish else "-"
    main_ago = int((time.time() - last_main) // 60) if last_main else "-"
    html = """
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>CIPHER CLOUD</title>
    <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, sans-serif; background: #0a0e1a; color: #e0e0e0; padding: 20px; }
    h1 { color: #fbbf24; margin-bottom: 20px; font-size: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 16px; }
    .card .label { font-size: 12px; color: #9ca3af; margin-bottom: 6px; }
    .card .value { font-size: 22px; font-weight: bold; color: #fbbf24; }
    .log { background: #000; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 11px; max-height: 500px; overflow-y: auto; }
    .log div { padding: 2px 0; border-bottom: 1px solid #111; }
    .green { color: #4ade80; }
    .red { color: #f87171; }
    </style>
    </head>
    <body>
    <h1>CIPHER CLOUD v1.0</h1>
    <p style="color:#9ca3af;margin-bottom:20px;">Accounts: {{ acc_count }} | Uptime: {{ h }}h {{ m }}m</p>
    <div class="grid">
      <div class="card"><div class="label">Main Cycles</div><div class="value">{{ main_cycles }}</div></div>
      <div class="card"><div class="label">Fish Cycles</div><div class="value">{{ fish_cycles }}</div></div>
      <div class="card"><div class="label">Collected</div><div class="value">{{ collected }}</div></div>
      <div class="card"><div class="label">Fish Sold</div><div class="value">{{ sold }}</div></div>
      <div class="card"><div class="label">Daily</div><div class="value">{{ daily }}</div></div>
      <div class="card"><div class="label">Quests</div><div class="value">{{ quest_ok }}</div></div>
      <div class="card"><div class="label">Rockets</div><div class="value">{{ bought }}</div></div>
      <div class="card"><div class="label">Attacks</div><div class="value">{{ attacked }}</div></div>
      <div class="card"><div class="label">Damage</div><div class="value">{{ damage }}</div></div>
      <div class="card"><div class="label">Donated</div><div class="value">{{ donated }}</div></div>
      <div class="card"><div class="label">Login OK</div><div class="value green">{{ login }}</div></div>
      <div class="card"><div class="label">Login Fail</div><div class="value red">{{ login_fail }}</div></div>
    </div>
    <p style="color:#9ca3af;margin-bottom:10px;">Last fish: {{ fish_ago }}s ago | Last main: {{ main_ago }}m ago</p>
    <h2 style="color:#fbbf24;margin:20px 0 10px;font-size:18px;">Live Log</h2>
    <div class="log">{% for line in logs %}<div>{{ line }}</div>{% endfor %}</div>
    </body>
    </html>
    """
    return render_template_string(
        html,
        acc_count=len(ACCOUNTS),
        h=h, m=m,
        main_cycles=STATS["main_cycles"],
        fish_cycles=STATS["fish_cycles"],
        collected=STATS["collected"],
        sold="{:,}".format(STATS["sold"]),
        daily=STATS["daily"],
        quest_ok=STATS["quest_ok"],
        bought=STATS["bought"],
        attacked=STATS["attacked"],
        damage="{:,}".format(STATS["damage"]),
        donated=STATS["donated"],
        login=STATS["login"],
        login_fail=STATS["login_fail"],
        fish_ago=fish_ago,
        main_ago=main_ago,
        logs=LOG_LINES[-100:],
    )

@app.route("/health")
@app.route("/healthz")
def health():
    return jsonify({"ok": True, "uptime": int(time.time() - STATS["started_at"])})

@app.route("/api/status")
def api_status():
    return jsonify({
        "accounts": len(ACCOUNTS),
        "stats": {k: v for k, v in STATS.items() if k != "account_stats"},
        "account_stats": STATS["account_stats"],
    })

def start_bots():
    if not ACCOUNTS:
        log("no accounts configured", "INIT")
        return
    log("start " + str(len(ACCOUNTS)) + " accounts", "INIT")
    log("main interval: " + str(MAIN_INTERVAL // 3600) + "h", "INIT")
    log("fish interval: " + str(FISH_INTERVAL) + "s", "INIT")
    t1 = threading.Thread(target=main_thread, daemon=True)
    t1.start()
    t2 = threading.Thread(target=fish_thread, daemon=True)
    t2.start()

start_bots()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False)
