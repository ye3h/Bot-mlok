# ═══════════════════════════════════════════════════════════════════════════
# 🧪 محاكي الاقتصاد الحقيقي والفيزياء (v2.0.0)
# يحاكي جمع السمك، البيع، تطوير مخزن السمك، وتطوير سوق السفن خطوة بخطوة
# ═══════════════════════════════════════════════════════════════════════════

import math

# ═══════════════════════════════════════════════════════════════════════════
# ⚙️ 1. إعدادات المحاكاة
# ═══════════════════════════════════════════════════════════════════════════
PLAYER_ACTIVE_SHIPS = 3      # الحد الأقصى للسفن النشطة (3)
DAILY_PLAY_HOURS = 4         # كم ساعة يلعب اللاعب في اليوم؟

# ═══════════════════════════════════════════════════════════════════════════
# 📦 2. بيانات السفن (السعر، وقت الرحلة، الحمولة، متوسط سعر السمكة)
# ═══════════════════════════════════════════════════════════════════════════
SHIPS = [
    {"lv": 1,  "price": 400,           "trip": 60,   "cap": 80,      "avg_fish": 2.00},
    {"lv": 2,  "price": 2500,          "trip": 90,   "cap": 180,     "avg_fish": 2.33},
    {"lv": 3,  "price": 7500,          "trip": 150,  "cap": 600,     "avg_fish": 8.33},
    {"lv": 4,  "price": 11000,         "trip": 210,  "cap": 900,     "avg_fish": 2.66},
    {"lv": 5,  "price": 20000,         "trip": 240,  "cap": 1200,    "avg_fish": 8.33},
    {"lv": 6,  "price": 50000,         "trip": 300,  "cap": 1800,    "avg_fish": 12.33},
    {"lv": 7,  "price": 90000,         "trip": 330,  "cap": 2500,    "avg_fish": 12.66},
    {"lv": 8,  "price": 150000,        "trip": 390,  "cap": 3500,    "avg_fish": 4.00},
    {"lv": 9,  "price": 300000,        "trip": 480,  "cap": 5000,    "avg_fish": 4.33},
    {"lv": 10, "price": 700000,        "trip": 600,  "cap": 7500,    "avg_fish": 4.33},
    {"lv": 11, "price": 2200000,       "trip": 660,  "cap": 9000,    "avg_fish": 4.66},
    {"lv": 12, "price": 5000000,       "trip": 780,  "cap": 13000,   "avg_fish": 70.00}, 
    {"lv": 13, "price": 8000000,       "trip": 840,  "cap": 16000,   "avg_fish": 7.66},
    {"lv": 14, "price": 12000000,      "trip": 960,  "cap": 20000,   "avg_fish": 6.00},
    {"lv": 15, "price": 18000000,      "trip": 1080, "cap": 25000,   "avg_fish": 72.66}, 
    {"lv": 16, "price": 25000000,      "trip": 1140, "cap": 30000,   "avg_fish": 7.33},
    {"lv": 17, "price": 34000000,      "trip": 1260, "cap": 36000,   "avg_fish": 9.66},
    {"lv": 18, "price": 45000000,      "trip": 1380, "cap": 42000,   "avg_fish": 9.00},
    {"lv": 19, "price": 60000000,      "trip": 1500, "cap": 50000,   "avg_fish": 7.66},
    {"lv": 20, "price": 80000000,      "trip": 1620, "cap": 60000,   "avg_fish": 9.66},
    {"lv": 21, "price": 110000000,     "trip": 1800, "cap": 72000,   "avg_fish": 10.66},
    {"lv": 22, "price": 150000000,     "trip": 1980, "cap": 85000,   "avg_fish": 11.00},
    {"lv": 23, "price": 200000000,     "trip": 2100, "cap": 100000,  "avg_fish": 10.00},
    {"lv": 24, "price": 300000000,     "trip": 2340, "cap": 120000,  "avg_fish": 6.00},
    {"lv": 25, "price": 650000000,     "trip": 2520, "cap": 140000,  "avg_fish": 9.66},
    {"lv": 26, "price": 800000000,     "trip": 2700, "cap": 165000,  "avg_fish": 12.66},
    {"lv": 27, "price": 1000000000,    "trip": 2940, "cap": 190000,  "avg_fish": 11.00},
    {"lv": 28, "price": 3640000000,    "trip": 3120, "cap": 220000,  "avg_fish": 14.33},
    {"lv": 29, "price": 9100000000,    "trip": 3420, "cap": 260000,  "avg_fish": 13.66},
    {"lv": 30, "price": 16380000000,   "trip": 3600, "cap": 300000,  "avg_fish": 16.00},
    {"lv": 31, "price": 19500000000,   "trip": 3000, "cap": 350000,  "avg_fish": 32.00},
    {"lv": 32, "price": 19500000000,   "trip": 2700, "cap": 350000,  "avg_fish": 17.00},
    {"lv": 33, "price": 20000000000000,"trip": 3000, "cap": 400000,  "avg_fish": 45.00}
]

# ═══════════════════════════════════════════════════════════════════════════
# 🏪 3. ترقيات سوق السفن (07b_ships_rpc.js)
# ═══════════════════════════════════════════════════════════════════════════
SHIP_MARKET_UPGRADES = {
    2: {"cost": 600, "time": 30}, 3: {"cost": 3750, "time": 30}, 4: {"cost": 11250, "time": 120}, 5: {"cost": 16500, "time": 120},
    6: {"cost": 30000, "time": 900}, 7: {"cost": 75000, "time": 900}, 8: {"cost": 135000, "time": 900}, 9: {"cost": 225000, "time": 3600},
    10: {"cost": 450000, "time": 3600}, 11: {"cost": 1050000, "time": 3600}, 12: {"cost": 3300000, "time": 14400}, 13: {"cost": 7500000, "time": 14400},
    14: {"cost": 12000000, "time": 14400}, 15: {"cost": 18000000, "time": 14400}, 16: {"cost": 27000000, "time": 14400}, 17: {"cost": 37500000, "time": 43200},
    18: {"cost": 51000000, "time": 43200}, 19: {"cost": 67500000, "time": 43200}, 20: {"cost": 90000000, "time": 43200}, 21: {"cost": 120000000, "time": 43200},
    22: {"cost": 165000000, "time": 86400}, 23: {"cost": 225000000, "time": 86400}, 24: {"cost": 300000000, "time": 86400}, 25: {"cost": 450000000, "time": 86400},
    26: {"cost": 975000000, "time": 86400}, 27: {"cost": 1200000000, "time": 259200}, 28: {"cost": 1500000000, "time": 259200}, 29: {"cost": 5460000000, "time": 259200},
    30: {"cost": 13650000000, "time": 259200}, 31: {"cost": 24570000000, "time": 259200}, 32: {"cost": 500000000000, "time": 432000}, 33: {"cost": 5000000000000, "time": 604800}
}

# ═══════════════════════════════════════════════════════════════════════════
# 🐟 4. ترقيات مخزن السمك (07b_ships_rpc.js)
# ═══════════════════════════════════════════════════════════════════════════
FISH_MARKET_UPGRADES = {
    2: {"cost": 300, "time": 90}, 3: {"cost": 1875, "time": 150}, 4: {"cost": 5625, "time": 210}, 5: {"cost": 8250, "time": 270},
    6: {"cost": 15000, "time": 330}, 7: {"cost": 37500, "time": 390}, 8: {"cost": 67500, "time": 450}, 9: {"cost": 112500, "time": 510},
    10: {"cost": 225000, "time": 570}, 11: {"cost": 525000, "time": 630}, 12: {"cost": 1650000, "time": 690}, 13: {"cost": 3750000, "time": 750},
    14: {"cost": 6000000, "time": 810}, 15: {"cost": 9000000, "time": 870}, 16: {"cost": 13500000, "time": 930}, 17: {"cost": 18750000, "time": 990},
    18: {"cost": 25500000, "time": 1050}, 19: {"cost": 33750000, "time": 1110}, 20: {"cost": 45000000, "time": 1170}, 21: {"cost": 60000000, "time": 1230},
    22: {"cost": 82500000, "time": 1290}, 23: {"cost": 112500000, "time": 1350}, 24: {"cost": 150000000, "time": 1410}, 25: {"cost": 225000000, "time": 1470},
    26: {"cost": 487500000, "time": 1530}, 27: {"cost": 600000000, "time": 7200}, 28: {"cost": 750000000, "time": 14400}, 29: {"cost": 2730000000, "time": 28800},
    30: {"cost": 6825000000, "time": 57600}
}

# دالة حساب سعة مخزن السمك (بناءً على كودك FISH_CAP_OVERRIDES)
def get_fish_cap(level):
    overrides = {26:6000000, 27:11000000, 28:17000000, 29:23000000, 30:30000000, 31:36000000, 32:42000000}
    if level in overrides: return overrides[level]
    cap = 10000
    for l in range(2, level + 1):
        cap += 10000 if l <= 10 else (20000 if l <= 20 else 116666)
    return cap

def format_time(seconds):
    if seconds < 60: return f"{int(seconds)} ثانية"
    mins = seconds / 60
    if mins < 60: return f"{int(mins)} دقيقة"
    hours = mins / 60
    if hours < 24: return f"{int(hours)} ساعة و {int(mins % 60)} دقيقة"
    days = hours / 24
    return f"{int(days)} يوم و {int(hours % 24)} ساعة"

def calc_gps(fleet):
    """حساب معدل جمع الذهب في الثانية (Gold Per Second)"""
    gps = 0
    for s in fleet:
        cycle_gold = s["cap"] * s["avg_fish"]
        gps += cycle_gold / s["trip"]
    return gps

def calc_fish_per_sec(fleet):
    """حساب معدل جمع السمك في الثانية"""
    fps = 0
    for s in fleet:
        fps += s["cap"] / s["trip"]
    return fps

# ═══════════════════════════════════════════════════════════════════════════
# 🧠 5. محرك المحاكاة (Event-Driven Simulation)
# ═══════════════════════════════════════════════════════════════════════════
def run_simulation():
    print("="*70)
    print(" 🏴‍☠️ محاكي الفيزياء الدقيق - مملكة القراصنة 🏴‍☠️")
    print("="*70)
    
    gold = 0
    ship_market_lv = 1
    fish_market_lv = 1
    fleet = [SHIPS[0]] # يبدأ بالسفينة 1
    total_time_sec = 0
    
    for target_ship in SHIPS[1:]:
        lv = target_ship["lv"]
        
        # 1️⃣ تطوير مخزن السمك (إذا كان سوق السفن يطلبه، أو إذا امتلأ من الصيد)
        fish_cap = get_fish_cap(fish_market_lv)
        required_fish_lv = 10 if lv == 11 else (14 if lv == 15 else 1)
        
        if fish_market_lv < required_fish_lv:
            m = FISH_MARKET_UPGRADES[required_fish_lv]
            gps = calc_gps(fleet)
            t_afford = max(0, m["cost"] - gold) / gps if gps > 0 else 0
            step_t = max(t_afford, m["time"])
            
            total_time_sec += step_t
            gold += gps * step_t - m["cost"]
            fish_market_lv = required_fish_lv
            print(f"🐟 [فيزياء] ترقية مخزن السمك لـ Lv.{fish_market_lv} (السعة: {get_fish_cap(fish_market_lv):,})")
            print(f"   💰 ذهب: {m['cost']:,} | ⏱️ جمع: {format_time(t_afford)} | ⏳ ترقية: {format_time(m['time'])}")

        # 2️⃣ تطوير سوق السفن (عشان نفتح السفينة الجديدة)
        while ship_market_lv < lv:
            next_lv = ship_market_lv + 1
            m = SHIP_MARKET_UPGRADES[next_lv]
            gps = calc_gps(fleet)
            fps = calc_fish_per_sec(fleet)
            
            t_afford = max(0, m["cost"] - gold) / gps if gps > 0 else 0
            
            # الفيزياء هنا: هل المخزن بيمتلئ أثناء الوقت اللي نجمع فيه؟
            # إذا اللاعب ما باع، المخزن يمتلئ ويوقف الربح. بس نفترض اللاعب ذكي ويبيع.
            # بس إذا السعة أقل من الصيد، لازم يطور.
            if fps * t_afford > get_fish_cap(fish_market_lv):
                print(f"   ⚠️ تحذير: المخزن سيمتلئ أثناء جمع ذهب الترقية! اللاعب سيضطر لبيع السمك.")
            
            step_t = max(t_afford, m["time"])
            total_time_sec += step_t
            gold += gps * step_t - m["cost"]
            ship_market_lv += 1
            
            print(f"🏪 [فيزياء] ترقية سوق السفن لـ Lv.{ship_market_lv}")
            print(f"   💰 ذهب: {m['cost']:,} | ⏱️ جمع: {format_time(t_afford)} | ⏳ ترقية: {format_time(m['time'])}")

        # 3️⃣ شراء السفينة
        gps = calc_gps(fleet)
        t_buy = max(0, target_ship["price"] - gold) / gps if gps > 0 else 0
        total_time_sec += t_buy
        gold += gps * t_buy - target_ship["price"]
        
        # إضافة السفينة للأسطول
        fleet.append(target_ship)
        # ترتيب السفن حسب المكسب (GPS) عشان نطرد الأضعف
        fleet.sort(key=lambda s: (s["cap"] * s["avg_fish"]) / s["trip"], reverse=True)
        
        # إذا الأسطول صار أكبر من 3، نطرد الأضعف للمخزن
        if len(fleet) > PLAYER_ACTIVE_SHIPS:
            kicked = fleet.pop()
            print(f"   🚢 تم نقل سفينة Lv.{kicked['lv']} للمخزن (لأن الأسطول ممتلئ)")
            
        print(f"🚢 شراء سفينة Lv.{lv} ({target_ship['price']:,} ذهب)")
        print(f"   ⏱️ الوقت لجمع الذهب: {format_time(t_buy)}")
        print("-" * 70)

    print("="*70)
    print(f"🏆 إجمالي الوقت للوصول لآخر سفينة: {format_time(total_time_sec)}")
    print(f"📅 أي ما يعادل: {total_time_sec / (DAILY_PLAY_HOURS * 3600):.1f} يوم من اللعب الفعلي.")
    print("="*70)

if __name__ == "__main__":
    run_simulation()
