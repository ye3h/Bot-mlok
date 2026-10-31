// modules/ship_storage.js — مخزن السفن (v2.0.0)
// مطابق لواجهة MyShipsModal في molok + تطوير نجوم الغواصة/الحوت
ModuleRegistry.register({
  id: 'ship_storage',
  name: 'مخزن السفن',
  version: '2.0.0',
  dependencies: [],

  ctx: null,

  init: function (ctx) {
    var self = this;
    this.ctx = ctx;

    var el = document.createElement('div');
    el.id = 'ship-storage-modal';
    el.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(6,12,22,.98);display:none;overflow-y:auto;direction:rtl;padding:16px;color:#fff';
    document.body.appendChild(el);

    el.addEventListener('click', function (e) {
      if (e.target === el) { self.close(); return; }
      var t = e.target.closest('[data-ss]');
      if (t && !t.disabled) self.onClick(t);
    });
  },

  open: function () {
    this.refresh();
    var el = document.getElementById('ship-storage-modal');
    if (el) el.style.display = 'block';
  },

  close: function () {
    var el = document.getElementById('ship-storage-modal');
    if (el) el.style.display = 'none';
  },

  onClick: function (t) {
    var act = t.getAttribute('data-ss');
    var id = t.getAttribute('data-id');

    if (act === 'close') { this.close(); return; }
    if (act === 'upgrade-storage') { this.upgradeStorage(); return; }
    if (act === 'upgrade-star') { this.upgradeStar(id); return; }

    if (act === 'activate') {
      var r = window.rpcShips('ship_from_storage', { p_ship_id: id });
      if (r.error) { this.toast(this.msgFor(r.error)); return; }
      this.toast('⚓ تم التفعيل');
      this.refresh();
      return;
    }
    if (act === 'store') {
      var r2 = window.rpcShips('ship_to_storage', { p_ship_id: id });
      if (r2.error) { this.toast(this.msgFor(r2.error)); return; }
      this.toast('📦 تم النقل للمخزن');
      this.refresh();
      return;
    }
    if (act === 'sell') { this.sell(id); return; }
  },

  msgFor: function (err) {
    var m = (err && err.message) || '';
    var map = {
      'ship is at sea': 'السفينة في البحر — أرجعها أولاً',
      'ship on mission': 'السفينة في مهمة سرقة',
      'ship under repair': 'السفينة تحت الإصلاح',
      'storage full': 'المخزن ممتلئ',
      'fleet full': 'الأسطول النشط ممتلئ',
      'cannot_empty_fleet': 'لا يمكن تفريغ الأسطول بالكامل',
      'not enough gems': 'جواهرك غير كافية',
      'max storage': 'وصلت الحد الأقصى',
      'max_stars': '⭐ وصلت الحد الأقصى للنجوم',
      'not_upgradable': 'هذه السفينة غير قابلة للتطوير',
      'already_in_storage': 'في المخزن أصلاً',
      'already_active': 'نشطة أصلاً',
      'not_found': 'غير موجودة',
      'cannot_sell_rental': '🔒 السفن المستأجرة لا يمكن بيعها',
      'ship_at_sea': '⚠️ السفينة في البحر — أرجعها أولاً'
    };
    return map[m] || m || 'خطأ';
  },

  upgradeStorage: function () {
    var self = this;
    var cost = window.STORAGE_UPGRADE_GEMS || 10000;
    this.ctx.ui.confirm('ترقية المخزن بـ ' + cost.toLocaleString() + ' 💎؟', function () {
      var r = window.rpcShips('upgrade_ship_storage');
      if (r.error) { self.toast(self.msgFor(r.error)); return; }
      self.toast('✨ السعة الآن ' + r.data.new_capacity);
      self.refresh();
    });
  },

  upgradeStar: function (id) {
    var self = this;
    var ship = null;
    var ships = this.ctx.state.ships || [];
    for (var i = 0; i < ships.length; i++) {
      if (ships[i].id === id) { ship = ships[i]; break; }
    }
    if (!ship) { this.toast('غير موجودة'); return; }

    var def = window.SHIP_BY_CODE[ship.code];
    if (!def || !def.upgradable) { this.toast('غير قابلة للتطوير'); return; }

    var cur = ship.stars || 1;
    var cost = window.shipsUtils.starUpgradeCost(cur);
    if (cost === null) { this.toast('⭐ الحد الأقصى'); return; }

    this.ctx.ui.confirm(
      'ترقية ' + def.name + ' من ⭐' + cur + ' إلى ⭐' + (cur + 1) + ' بـ ' + cost.toLocaleString() + ' 💎؟',
      function () {
        var r = window.rpcShips('upgrade_ship_star', { _ship_id: id });
        if (r.error) {
          if (r.error.message === 'not enough gems') { self.toast('💎 جواهر غير كافية'); return; }
          if (r.error.message === 'max_stars') { self.toast('⭐ الحد الأقصى'); return; }
          self.toast('❌ ' + r.error.message);
          return;
        }
        self.toast('⭐ تمت الترقية إلى ⭐' + r.data.stars);
        if (typeof beep === 'function') beep(1000, 0.15);
        self.refresh();
      }
    );
  },

  sell: function (id) {
    var st = this.ctx.state;
    var ship = null;
    for (var i = 0; i < st.ships.length; i++) {
      if (st.ships[i].id === id) { ship = st.ships[i]; break; }
    }
    if (!ship) { this.toast('غير موجودة'); return; }

    var def = SHIP_BY_CODE[ship.code];
    if (!def) { this.toast('تعريف مفقود'); return; }

    var refund = Math.floor((def.price || 0) / 2);
    var self = this;

    this.ctx.ui.confirm('بيع ' + def.name + '؟\nسترجع ' + refund.toLocaleString() + ' 💰', function () {
      var r = window.rpcShips('sell_ship', { _ship_id: id, _refund_coins: refund });
      if (r.error) { self.toast(self.msgFor(r.error)); return; }
      self.toast('💰 +' + refund.toLocaleString());
      self.refresh();
    });
  },

  toast: function (m) { this.ctx.ui.toast(m); },

  refresh: function () {
    var el = document.getElementById('ship-storage-modal');
    if (!el || !this.ctx) return;
    var st = this.ctx.state;
    var ships = st.ships || [];
    var active = [], storage = [];
    for (var i = 0; i < ships.length; i++) {
      if (ships[i].inStorage) storage.push(ships[i]);
      else active.push(ships[i]);
    }
    var cap = window.shipsUtils.storageCapacity();
    var gem = st.gems || 0;
    var cost = window.STORAGE_UPGRADE_GEMS || 10000;

    var h = '<div style="max-width:520px;margin:0 auto">';

    // Header
    h += '<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid rgba(251,191,36,.2);margin-bottom:14px">';
    h += '<div>';
    h += '<div style="font-size:10px;letter-spacing:3px;color:#fbbf24">⚓ أسطولك</div>';
    h += '<div style="font-size:20px;font-weight:900;color:#fef3c7">سفينتي</div>';
    h += '<div style="font-size:11px;color:#cbd5e1;margin-top:3px">نشط: ' + active.length + '/3 · مخزن: ' + storage.length + '/' + cap + '</div>';
    h += '</div>';
    h += '<button data-ss="close" style="width:38px;height:38px;border-radius:50%;border:1.5px solid rgba(251,191,36,.4);background:rgba(251,191,36,.1);color:#fef3c7;font-size:18px;cursor:pointer">✕</button>';
    h += '</div>';

    // Active section
    h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">';
    h += '<span style="font-size:16px">⚓</span>';
    h += '<span style="font-weight:800;font-size:14px;color:#fde68a">الأسطول النشط</span>';
    h += '<span style="font-size:10px;padding:2px 6px;border-radius:6px;background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);color:#fbbf24">' + active.length + '/3</span>';
    h += '</div>';

    if (active.length === 0) {
      h += '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:12px">لا توجد سفن نشطة</div>';
    } else {
      for (var ai = 0; ai < active.length; ai++) {
        h += this.shipCard(active[ai], ai + 1, 'active', active.length, storage.length, cap);
      }
    }

    // Storage section
    h += '<div style="display:flex;align-items:center;gap:8px;margin:14px 0 8px">';
    h += '<span style="font-size:16px">📦</span>';
    h += '<span style="font-weight:800;font-size:14px;color:#fde68a">المخزن</span>';
    h += '<span style="font-size:10px;padding:2px 6px;border-radius:6px;background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);color:#fbbf24">' + storage.length + '/' + cap + '</span>';
    h += '</div>';

    // Upgrade storage
    var canUp = cap < 20 && gem >= cost;
    h += '<div style="padding:10px;border-radius:12px;border:1.5px solid rgba(217,70,239,.5);background:linear-gradient(180deg,rgba(88,28,135,.4),rgba(30,20,50,.6));margin-bottom:10px;display:flex;gap:10px;align-items:center">';
    h += '<div style="flex:1">';
    h += '<div style="font-weight:800;font-size:13px;color:#e9d5ff">🔧 ترقية المخزن</div>';
    h += '<div style="font-size:10px;color:#c4b5fd;margin-top:2px">+1 خانة · ' + cap + '/20</div>';
    h += '<div style="font-size:10px;color:#fbbf24;margin-top:2px">💎 ' + gem.toLocaleString() + '</div>';
    h += '</div>';
    h += '<button data-ss="upgrade-storage"' + (canUp ? '' : ' disabled') + ' style="padding:8px 10px;border-radius:10px;border:1.5px solid ' + (canUp ? '#e879f9' : '#475569') + ';background:' + (canUp ? 'linear-gradient(180deg,#e879f9,#7e22ce)' : '#334155') + ';color:' + (canUp ? '#fff' : '#94a3b8') + ';font-weight:800;font-size:11px;cursor:' + (canUp ? 'pointer' : 'default') + ';text-align:center;line-height:1.3">' + (cap >= 20 ? '🏆 الأقصى' : '💎 ' + cost.toLocaleString() + '<br>+1') + '</button>';
    h += '</div>';

    if (storage.length === 0) {
      h += '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:12px">المخزن فارغ</div>';
    } else {
      for (var si = 0; si < storage.length; si++) {
        h += this.shipCard(storage[si], si + 1, 'storage', active.length, storage.length, cap);
      }
    }

    h += '</div>';
    el.innerHTML = h;
  },

  shipCard: function (ship, idx, mode, activeCount, storageCount, cap) {
    var def = SHIP_BY_CODE[ship.code];
    if (!def) def = { name: ship.code, img: '', emoji: '⛵', rarity: 'common', armor: 0, speed: 0, storage: 0, price: 0, upgradable: false };
    var r = shipRarity(def.rarity);

    // احسب الإحصائيات حسب النجوم
    var stats = window.shipStats ? window.shipStats(ship) : null;
    var storageVal = stats ? stats.storage : def.storage;
    var hpVal = stats ? stats.hp : def.hp;
    var imgSrc = window.shipImg ? window.shipImg(ship) : def.img;
    var curStars = ship.stars || 1;
    var maxStars = def.maxStars || 1;

    var h = '<div style="position:relative;display:flex;gap:10px;padding:10px;border-radius:12px;background:' + r.bg + ';border:2px solid ' + r.ring + ';margin-bottom:8px">';
    h += '<div style="position:absolute;top:4px;left:6px;font-size:9px;font-weight:800;color:#fbbf24;background:rgba(0,0,0,.5);padding:1px 5px;border-radius:3px">#' + idx + '</div>';

    h += '<div style="width:66px;height:66px;flex-shrink:0;border-radius:10px;background:linear-gradient(180deg,rgba(120,53,15,.5),rgba(0,0,0,.5));border:1px solid rgba(251,191,36,.3);display:flex;align-items:center;justify-content:center;overflow:hidden">';
    h += '<img src="' + imgSrc + '" alt="" style="max-width:100%;max-height:100%;object-fit:contain" onerror="this.style.display=\'none\';this.parentNode.innerHTML=\'<span style=&quot;font-size:26px&quot;>' + (def.emoji || '⛵') + '</span>\'">';
    h += '</div>';

    h += '<div style="flex:1;min-width:0">';
    h += '<div style="font-weight:800;font-size:12px;color:' + r.color + '">' + def.name;
    if (def.upgradable) {
      h += ' <span style="font-size:10px;color:#fbbf24">';
      for (var s = 1; s <= maxStars; s++) h += (s <= curStars ? '⭐' : '☆');
      h += '</span>';
    }
    h += '</div>';
    h += '<div style="font-size:10px;color:#94a3b8;margin-top:2px">' + ship.code + ' · ' + r.name + '</div>';

    h += '<div style="display:flex;gap:4px;margin-top:5px;flex-wrap:wrap">';
    h += '<span style="font-size:9px;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.4);border:1px solid rgba(251,191,36,.3);color:#fde68a">❤️ ' + (hpVal || 0).toLocaleString() + '</span>';
    h += '<span style="font-size:9px;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.4);border:1px solid rgba(251,191,36,.3);color:#fde68a">🛡️ ' + (def.armor || 0) + '</span>';
    h += '<span style="font-size:9px;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.4);border:1px solid rgba(251,191,36,.3);color:#fde68a">⚡ ' + (def.speed || 0) + '</span>';
    h += '<span style="font-size:9px;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.4);border:1px solid rgba(251,191,36,.3);color:#fde68a">📦 ' + (storageVal || 0).toLocaleString() + '</span>';
    h += '</div>';

    // Buttons row
    h += '<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">';

    // ⭐ Upgrade star button (only for upgradable ships)
    if (def.upgradable) {
      var isMax = curStars >= maxStars;
      var starCost = window.shipsUtils.starUpgradeCost(curStars);
      var canStar = !isMax && starCost !== null && (this.ctx.state.gems || 0) >= starCost;
      var starLabel = isMax ? '⭐ الأقصى' : ('⭐ ' + curStars + '→' + (curStars + 1) + ' · 💎 ' + (starCost || 0).toLocaleString());
      h += '<button data-ss="upgrade-star" data-id="' + ship.id + '"' + (canStar ? '' : ' disabled') + ' style="padding:5px 9px;border-radius:8px;border:1px solid ' + (canStar ? '#c4b5fd' : '#475569') + ';background:' + (canStar ? 'linear-gradient(180deg,#ddd6fe,#7c3aed)' : '#334155') + ';color:' + (canStar ? '#fff' : '#94a3b8') + ';font-weight:800;font-size:10px;cursor:' + (canStar ? 'pointer' : 'default') + '">' + starLabel + '</button>';
    }

    if (mode === 'active') {
      var canStore = activeCount > 1 && storageCount < cap;
      h += '<button data-ss="store" data-id="' + ship.id + '"' + (canStore ? '' : ' disabled') + ' style="padding:5px 9px;border-radius:8px;border:1px solid ' + (canStore ? '#fbbf24' : '#475569') + ';background:' + (canStore ? 'rgba(251,191,36,.15)' : '#334155') + ';color:' + (canStore ? '#fde68a' : '#94a3b8') + ';font-weight:800;font-size:10px;cursor:' + (canStore ? 'pointer' : 'default') + '">📦 للمخزن</button>';
    } else {
      var canAct = activeCount < 3;
      h += '<button data-ss="activate" data-id="' + ship.id + '"' + (canAct ? '' : ' disabled') + ' style="padding:5px 9px;border-radius:8px;border:1px solid ' + (canAct ? '#6ee7b7' : '#475569') + ';background:' + (canAct ? 'linear-gradient(180deg,#6ee7b7,#16a34a)' : '#334155') + ';color:' + (canAct ? '#052e16' : '#94a3b8') + ';font-weight:800;font-size:10px;cursor:' + (canAct ? 'pointer' : 'default') + '">⚓ تفعيل</button>';
      if (ship.isRental) {
        h += '<button disabled style="padding:5px 9px;border-radius:8px;border:1px solid #475569;background:#334155;color:#64748b;font-weight:800;font-size:10px;cursor:default;opacity:.5" title="السفن المستأجرة لا تُباع">🔒 مستأجرة</button>';
      } else {
        h += '<button data-ss="sell" data-id="' + ship.id + '" style="padding:5px 9px;border-radius:8px;border:1px solid #fbbf24;background:linear-gradient(180deg,#fde68a,#d97706);color:#1c1917;font-weight:800;font-size:10px;cursor:pointer">💰 بيع</button>';
      }
    }
    h += '</div>';

    h += '</div>';
    h += '</div>';
    return h;
  }
});
