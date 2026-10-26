// modules/dragon_forge.js — فورج التنين (v1.0.0)
// 4 تبويبات: صهر | انفنتري | متجر | ترقية
// يفتح كـ overlay — استدعِ ModuleRegistry.get('dragon_forge').open()
ModuleRegistry.register({
  id: 'dragon_forge',
  name: 'فورج التنين',
  version: '1.0.0',
  dependencies: ['dragon_equipment'],

  ctx: null,
  root: null,
  activeTab: 'smelt',
  smeltSlot: 'weapon',
  smeltA: null,
  smeltB: null,
  _flashTimer: null,

  init: function (ctx) {
    this.ctx = ctx;
    this.build();
  },

  build: function () {
    var self = this;
    var el = document.createElement('div');
    el.id = 'dragon-forge';
    el.style.cssText = 'position:fixed;inset:0;z-index:210;background:linear-gradient(180deg,#1a0a1f 0%,#0a0a14 60%,#000 100%);color:#fff;overflow-y:auto;direction:rtl;display:none;padding:16px;padding-bottom:60px;font-family:inherit';
    document.body.appendChild(el);
    this.root = el;

    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-df]');
      if (!b) return;
      self.handle(b.getAttribute('data-df'), b.getAttribute('data-v'));
    });
  },

  open: function () {
    this.activeTab = 'smelt';
    this.smeltA = null;
    this.smeltB = null;
    this.refresh();
    this.root.style.display = 'block';
  },

  close: function () { this.root.style.display = 'none'; },

  handle: function (act, v) {
    if (act === 'close') { this.close(); return; }
    if (act === 'tab')   { this.activeTab = v; this.smeltA = null; this.smeltB = null; this.refresh(); return; }
    if (act === 'slot')  { this.smeltSlot = v; this.smeltA = null; this.smeltB = null; this.refresh(); return; }
    if (act === 'shop-slot') { this._shopSlot = v; this.refresh(); return; }
    if (act === 'pick') {
      if (this.smeltA === v) { this.smeltA = this.smeltB; this.smeltB = null; }
      else if (this.smeltB === v) { this.smeltB = null; }
      else if (!this.smeltA) { this.smeltA = v; }
      else if (!this.smeltB) { this.smeltB = v; }
      else { this.smeltB = v; }
      this.refresh();
      return;
    }
    if (act === 'do-smelt')   { this.doSmelt(); return; }
    if (act === 'do-equip')   { this.doEquip(v); return; }
    if (act === 'do-upgrade') { this.doUpgrade(v); return; }
    if (act === 'do-buy') {
      var parts = v.split('|');
      this.doBuy(parts[0], parts[1], parts[2]);
      return;
    }
  },

  flash: function (msg, ms) {
    var self = this;
    var old = document.getElementById('df-flash');
    if (old) old.remove();
    var d = document.createElement('div');
    d.id = 'df-flash';
    d.textContent = msg;
    d.style.cssText = 'position:fixed;top:40px;left:50%;transform:translateX(-50%);z-index:220;background:rgba(15,25,45,.98);border:1.5px solid #fcd34d;color:#fef3c7;padding:10px 18px;border-radius:14px;font-weight:700;font-size:13px;box-shadow:0 8px 30px rgba(0,0,0,.6)';
    document.body.appendChild(d);
    if (this._flashTimer) clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(function () { d.remove(); }, ms || 2000);
  },

  // ═══════════ RENDER ═══════════
  refresh: function () {
    var self = this;
    var eq = ModuleRegistry.get('dragon_equipment');
    if (!eq) { this.root.innerHTML = '<div style="padding:40px;text-align:center;color:#f87171">dragon_equipment غير محمّل</div>'; return; }
    var st = this.ctx.state;
    var items = st.dragonEquip || [];

    var h = '';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid rgba(251,191,36,.2)">';
    h +=   '<div style="font-size:20px;font-weight:900;color:#fbbf24">⚒️ فورج التنين</div>';
    h +=   '<button data-df="close" style="width:38px;height:38px;border-radius:50%;border:1.5px solid rgba(251,191,36,.4);background:rgba(251,191,36,.1);color:#fef3c7;font-size:18px;cursor:pointer">✕</button>';
    h += '</div>';

    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">';
    h +=   '<div style="background:rgba(20,25,40,.7);border:1px solid rgba(251,191,36,.3);border-radius:12px;padding:8px;text-align:center">';
    h +=     '<div style="font-size:10px;color:#a16207">الذهب</div>';
    h +=     '<div style="font-weight:900;color:#fef3c7;font-variant-numeric:tabular-nums">🪙 ' + (st.coins || 0).toLocaleString() + '</div>';
    h +=   '</div>';
    h +=   '<div style="background:rgba(20,25,40,.7);border:1px solid rgba(168,85,247,.3);border-radius:12px;padding:8px;text-align:center">';
    h +=     '<div style="font-size:10px;color:#a78bfa">الجواهر</div>';
    h +=     '<div style="font-weight:900;color:#e9d5ff;font-variant-numeric:tabular-nums">💎 ' + (st.gems || 0).toLocaleString() + '</div>';
    h +=   '</div>';
    h += '</div>';

    var tabs = [['smelt','🔥 صهر'],['inventory','🎒 الانفنتري'],['shop','🛒 المتجر'],['upgrade','✨ ترقية']];
    h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px;background:rgba(15,20,35,.7);padding:4px;border-radius:12px;border:1px solid rgba(251,191,36,.25)">';
    for (var i = 0; i < tabs.length; i++) {
      var on = this.activeTab === tabs[i][0];
      h += '<button data-df="tab" data-v="' + tabs[i][0] + '" style="padding:8px 4px;border-radius:8px;border:0;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;' +
           (on ? 'background:linear-gradient(180deg,#f59e0b,#c2410c);color:#0c0a09' : 'background:transparent;color:#fcd34d') + '">' + tabs[i][1] + '</button>';
    }
    h += '</div>';

    if (this.activeTab === 'smelt')          h += this.renderSmelt(eq, items);
    else if (this.activeTab === 'inventory') h += this.renderInventory(eq, items);
    else if (this.activeTab === 'shop')      h += this.renderShop(eq);
    else if (this.activeTab === 'upgrade')   h += this.renderUpgrade(eq, items);

    this.root.innerHTML = h;
  },

  renderInventory: function (eq, items) {
    if (!items.length) return '<div style="text-align:center;padding:40px;color:#94a3b8">🎒 لا توجد قطع — اذهب للمتجر</div>';
    var h = '';
    // group by slot+rarity+equipped
    var groups = {};
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var k = (it.equipped ? 'E' : 'U') + '|' + it.slot + '|' + it.rarity;
      if (!groups[k]) groups[k] = { rep: it, ids: [], count: 0 };
      groups[k].ids.push(it.id);
      groups[k].count++;
    }
    var keys = Object.keys(groups);
    for (var g = 0; g < keys.length; g++) {
      var grp = groups[keys[g]];
      var rep = grp.rep;
      var r = this.rarityInfo(eq, rep.rarity);
      h += '<div style="display:flex;align-items:center;gap:10px;padding:10px;margin-bottom:8px;border-radius:14px;' +
           'background:linear-gradient(135deg,' + r.bg + ');border:2px solid ' + r.ring + '">' +
        '<div style="font-size:28px;width:44px;text-align:center">' + r.emoji + '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-weight:800;font-size:13px;color:' + r.color + '">' + r.name + ' · ' + eq.SLOTS[rep.slot].name +
            (grp.count > 1 ? ' <span style="font-size:10px;background:#f59e0b;color:#000;padding:1px 6px;border-radius:8px">×' + grp.count + '</span>' : '') +
          '</div>' +
          '<div style="font-size:10px;color:#cbd5e1;margin-top:2px">+' + r.bonus + '% ' + eq.SLOTS[rep.slot].statName + '</div>' +
        '</div>' +
        (rep.equipped
          ? '<button data-df="do-equip" data-v="' + grp.ids[0] + '" style="padding:8px 12px;border-radius:10px;border:1.5px solid #475569;background:#334155;color:#cbd5e1;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer">↩ إزالة</button>'
          : '<button data-df="do-equip" data-v="' + grp.ids[0] + '" style="padding:8px 12px;border-radius:10px;border:1.5px solid #86efac;background:linear-gradient(180deg,#bbf7d0,#16a34a);color:#052e16;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer">⚔ تجهيز</button>') +
      '</div>';
    }
    return h;
  },

  renderShop: function (eq) {
    var h = '';
    var slots = ['weapon','armor','talisman'];
    var sNames = { weapon: '⚔️ سلاح', armor: '🛡️ درع', talisman: '📿 تميمة' };
    h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px">';
    for (var s = 0; s < slots.length; s++) {
      var on = this._shopSlot === slots[s] || (!this._shopSlot && s === 0);
      if (s === 0 && !this._shopSlot) this._shopSlot = 'weapon';
      h += '<button data-df="shop-slot" data-v="' + slots[s] + '" style="padding:8px 4px;border-radius:10px;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;border:1.5px solid ' +
           (on ? '#fbbf24' : '#334155') + ';background:' + (on ? 'rgba(251,191,36,.15)' : 'rgba(15,20,35,.6)') + ';color:' + (on ? '#fef3c7' : '#94a3b8') + '">' + sNames[slots[s]] + '</button>';
    }
    h += '</div>';

    var slot = this._shopSlot || 'weapon';
    var rows = [
      { rarity: 'common',    currency: 'coins', price: 150000 },
      { rarity: 'rare',      currency: 'coins', price: 600000 },
      { rarity: 'rare',      currency: 'gems',  price: 1500 },
      { rarity: 'epic',      currency: 'gems',  price: 4000 },
      { rarity: 'legendary', currency: 'gems',  price: 9000 },
      { rarity: 'divine',    currency: 'gems',  price: 18000 }
    ];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var r = this.rarityInfo(eq, row.rarity);
      var cur = row.currency === 'gems' ? '💎' : '💰';
      h += '<div style="display:flex;align-items:center;gap:10px;padding:10px;margin-bottom:8px;border-radius:12px;' +
           'background:linear-gradient(135deg,' + r.bg + ');border:1.5px solid ' + r.ring + '">' +
        '<div style="font-size:28px;width:44px;text-align:center">' + r.emoji + '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-weight:800;font-size:13px;color:' + r.color + '">' + r.name + ' ' + eq.SLOTS[slot].name + '</div>' +
          '<div style="font-size:10px;color:#cbd5e1;margin-top:2px">+' + r.bonus + '% ' + eq.SLOTS[slot].statName + '</div>' +
        '</div>' +
        '<button data-df="do-buy" data-v="' + slot + '|' + row.rarity + '|' + row.currency + '" style="padding:8px 12px;border-radius:10px;border:1.5px solid ' +
          (row.currency === 'gems' ? '#c4b5fd' : '#fcd34d') + ';background:' +
          (row.currency === 'gems' ? 'linear-gradient(180deg,#ddd6fe,#7c3aed)' : 'linear-gradient(180deg,#fde68a,#d97706)') +
          ';color:#1c1917;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer">' + cur + ' ' + row.price.toLocaleString() + '</button>' +
      '</div>';
    }
    h += '<div style="text-align:center;color:#fca5a5;font-size:11px;font-weight:800;margin-top:12px">🔥 الفئة الفتاكة (فتّاك) — من صندوق الحظ فقط</div>';
    return h;
  },

  renderUpgrade: function (eq, items) {
    var upgradable = [];
    for (var i = 0; i < items.length; i++) {
      if (eq.UPGRADE_COSTS[items[i].rarity]) upgradable.push(items[i]);
    }
    if (!upgradable.length) return '<div style="text-align:center;padding:40px;color:#94a3b8">لا توجد قطع قابلة للترقية</div>';
    var st = this.ctx.state;
    var h = '';
    for (var j = 0; j < upgradable.length; j++) {
      var it = upgradable[j];
      var r = this.rarityInfo(eq, it.rarity);
      var cost = eq.UPGRADE_COSTS[it.rarity];
      var can = (st.gems || 0) >= cost;
      h += '<div style="display:flex;align-items:center;gap:10px;padding:10px;margin-bottom:8px;border-radius:12px;' +
           'background:linear-gradient(135deg,' + r.bg + ');border:1.5px solid ' + r.ring + '">' +
        '<div style="font-size:26px;width:44px;text-align:center">' + r.emoji + '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-weight:800;font-size:13px;color:' + r.color + '">' + r.name + ' · ' + eq.SLOTS[it.slot].name + '</div>' +
          '<div style="font-size:10px;color:#cbd5e1;margin-top:2px">+' + r.bonus + '% → +' + this.nextBonus(eq, it.rarity) + '%</div>' +
        '</div>' +
        '<button data-df="do-upgrade" data-v="' + it.id + '"' + (can ? '' : ' disabled') + ' style="padding:8px 12px;border-radius:10px;border:1.5px solid ' +
          (can ? '#c4b5fd' : '#475569') + ';background:' + (can ? 'linear-gradient(180deg,#ddd6fe,#7c3aed)' : '#334155') +
          ';color:' + (can ? '#1c1917' : '#94a3b8') + ';font-family:inherit;font-size:11px;font-weight:800;cursor:' + (can ? 'pointer' : 'default') + ';opacity:' + (can ? '1' : '.5') + '">💎 ' + cost.toLocaleString() + '</button>' +
      '</div>';
    }
    return h;
  },

  renderSmelt: function (eq, items) {
    var h = '';
    var sNames = { weapon: '⚔️ سلاح', armor: '🛡️ درع', talisman: '📿 تميمة' };
    var slots = ['weapon','armor','talisman'];
    h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px">';
    for (var s = 0; s < slots.length; s++) {
      var on = this.smeltSlot === slots[s];
      h += '<button data-df="slot" data-v="' + slots[s] + '" style="padding:8px 4px;border-radius:10px;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;border:1.5px solid ' +
           (on ? '#fbbf24' : '#334155') + ';background:' + (on ? 'rgba(251,191,36,.15)' : 'rgba(15,20,35,.6)') + ';color:' + (on ? '#fef3c7' : '#94a3b8') + '">' + sNames[slots[s]] + '</button>';
    }
    h += '</div>';

    var a = null, b = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === this.smeltA) a = items[i];
      if (items[i].id === this.smeltB) b = items[i];
    }

    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">';
    h += this.smeltSlotBox(eq, a);
    h += this.smeltSlotBox(eq, b);
    h += '</div>';

    var same = a && b && a.rarity === b.rarity;
    var pUp = same ? 40 : (a && b ? 20 : 0);
    var pSt = same ? 45 : (a && b ? 55 : 0);
    var pDn = same ? 15 : (a && b ? 25 : 0);

    h += '<div style="background:linear-gradient(180deg,rgba(20,25,40,.9),rgba(10,12,20,.9));border:1px solid rgba(251,191,36,.3);border-radius:14px;padding:12px;margin-bottom:12px">';
    h +=   '<div style="text-align:center;font-size:12px;font-weight:800;color:#fcd34d;margin-bottom:8px">🎲 نظام الحظ</div>';
    h +=   '<div style="display:flex;height:10px;border-radius:6px;overflow:hidden;background:#1f2937">';
    h +=     '<div style="width:' + pUp + '%;background:#10b981"></div>';
    h +=     '<div style="width:' + pSt + '%;background:#f59e0b"></div>';
    h +=     '<div style="width:' + pDn + '%;background:#ef4444"></div>';
    h +=   '</div>';
    h +=   '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;text-align:center;font-size:10px;margin-top:8px">';
    h +=     '<div style="color:#6ee7b7">⬆ ترقية<br><b>' + pUp + '%</b></div>';
    h +=     '<div style="color:#fcd34d">➡ ثبات<br><b>' + pSt + '%</b></div>';
    h +=     '<div style="color:#fca5a5">⬇ تراجع<br><b>' + pDn + '%</b></div>';
    h +=   '</div>';
    h += '</div>';

    var pool = [];
    for (var k = 0; k < items.length; k++) {
      if (items[k].slot === this.smeltSlot && items[k].rarity !== 'fatak' && !items[k].equipped && !items[k].smelted) pool.push(items[k]);
    }

    if (!pool.length) {
      h += '<div style="text-align:center;padding:20px;color:#94a3b8">لا توجد قطع متاحة للصهر من هذا النوع</div>';
    } else {
      h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';
      for (var p = 0; p < pool.length; p++) {
        var it = pool[p];
        var r = this.rarityInfo(eq, it.rarity);
        var picked = it.id === this.smeltA || it.id === this.smeltB;
        h += '<button data-df="pick" data-v="' + it.id + '" style="padding:8px;border-radius:10px;text-align:right;cursor:pointer;font-family:inherit;background:' +
             (picked ? 'rgba(251,191,36,.15)' : 'rgba(15,20,35,.6)') + ';border:1.5px solid ' + (picked ? '#fbbf24' : r.ring) + '">' +
          '<div style="font-size:11px;font-weight:800;color:' + r.color + '">' + r.name + '</div>' +
          '<div style="font-size:10px;color:#94a3b8">+' + r.bonus + '%</div>' +
        '</button>';
      }
      h += '</div>';
    }

    var canSmelt = a && b && (this.ctx.state.gems || 0) >= eq.SMELT_COST;
    h += '<button data-df="do-smelt"' + (canSmelt ? '' : ' disabled') + ' style="width:100%;margin-top:12px;padding:14px;border-radius:14px;border:0;font-family:inherit;font-weight:900;font-size:15px;cursor:' + (canSmelt ? 'pointer' : 'default') + ';' +
         (canSmelt
           ? 'background:linear-gradient(180deg,#fbbf24,#dc2626);color:#fff;box-shadow:0 8px 24px rgba(220,38,38,.4)'
           : 'background:#334155;color:#94a3b8') + '">🔥 صهر — 💎 ' + eq.SMELT_COST.toLocaleString() + '</button>';

    return h;
  },

  smeltSlotBox: function (eq, item) {
    if (!item) {
      return '<div style="height:110px;border-radius:14px;border:2px dashed rgba(251,191,36,.4);background:rgba(15,20,35,.5);display:flex;align-items:center;justify-content:center;color:rgba(251,191,36,.4);font-size:32px">+</div>';
    }
    var r = this.rarityInfo(eq, item.rarity);
    return '<div style="height:110px;border-radius:14px;border:2px solid ' + r.ring + ';background:linear-gradient(135deg,' + r.bg + ');display:flex;flex-direction:column;align-items:center;justify-content:center">' +
      '<div style="font-size:28px">' + r.emoji + '</div>' +
      '<div style="font-size:11px;font-weight:800;color:' + r.color + ';margin-top:4px">' + r.name + '</div>' +
    '</div>';
  },

  rarityInfo: function (eq, id) {
    var map = {
      common:    { name: 'عادي',   bonus: 5,  emoji: '⚪', ring: 'rgba(168,162,158,.6)', color: '#e7e5e4', bg: 'rgba(120,113,108,.3),rgba(28,25,23,.7)' },
      rare:      { name: 'نادر',   bonus: 15, emoji: '🔵', ring: 'rgba(56,189,248,.7)',  color: '#bae6fd', bg: 'rgba(3,105,161,.3),rgba(7,20,40,.7)' },
      epic:      { name: 'ملحمي',  bonus: 25, emoji: '🟣', ring: 'rgba(168,85,247,.8)',  color: '#e9d5ff', bg: 'rgba(107,33,168,.3),rgba(30,10,50,.7)' },
      legendary: { name: 'أسطوري', bonus: 35, emoji: '🟡', ring: 'rgba(251,191,36,.9)',  color: '#fef3c7', bg: 'rgba(180,83,9,.3),rgba(50,20,10,.7)' },
      divine:    { name: 'خرافي',  bonus: 50, emoji: '🔴', ring: 'rgba(244,63,94,1)',    color: '#fecdd3', bg: 'rgba(159,18,57,.4),rgba(40,5,20,.7)' },
      fatak:     { name: 'فتّاك',  bonus: 75, emoji: '☠️', ring: 'rgba(239,68,68,1)',    color: '#fee2e2', bg: 'rgba(127,29,29,.5),rgba(0,0,0,.6)' }
    };
    return map[id] || map.common;
  },

  nextBonus: function (eq, id) {
    var order = ['common','rare','epic','legendary','divine','fatak'];
    var idx = order.indexOf(id);
    if (idx < 0 || idx >= order.length - 1) return 0;
    var map = { rare: 15, epic: 25, legendary: 35, divine: 50, fatak: 75 };
    return map[order[idx + 1]] || 0;
  },

  // ═══════════ ACTIONS ═══════════
  doBuy: function (slot, rarity, currency) {
    var eq = ModuleRegistry.get('dragon_equipment');
    var res = eq.buy(slot, rarity, currency);
    if (!res.ok) {
      var msgs = { no_coins: '💰 الذهب غير كافٍ', no_gems: '💎 الجواهر غير كافية', fatak_not_sellable: 'الفتّاك من صندوق الحظ فقط' };
      this.flash('❌ ' + (msgs[res.error] || res.error));
      return;
    }
    this.flash('✅ اشتريت ' + res.item.name);
    if (typeof beep === 'function') beep(780, 0.1);
    this.refresh();
  },

  doEquip: function (id) {
    var eq = ModuleRegistry.get('dragon_equipment');
    var res = eq.equip(id);
    if (!res.ok) { this.flash('❌ ' + res.error); return; }
    this.flash(res.equipped ? '⚔ تم التجهيز' : '↩ تم إلغاء التجهيز');
    this.refresh();
  },

  doUpgrade: function (id) {
    var eq = ModuleRegistry.get('dragon_equipment');
    var res = eq.upgrade(id);
    if (!res.ok) {
      var msgs = { no_gems: '💎 الجواهر غير كافية', max_rarity: 'وصلت أعلى ندرة' };
      this.flash('❌ ' + (msgs[res.error] || res.error));
      return;
    }
    this.flash('✨ تمت الترقية إلى ' + this.rarityInfo(eq, res.rarity).name);
    if (typeof beep === 'function') beep(880, 0.15);
    this.refresh();
  },

  doSmelt: function () {
    if (!this.smeltA || !this.smeltB) return;
    var eq = ModuleRegistry.get('dragon_equipment');
    var res = eq.smelt(this.smeltA, this.smeltB);
    if (!res.ok) {
      var msgs = { no_gems: '💎 الجواهر غير كافية للصهر', fatak_smelts: 'الفتّاك ما ينصهر', equipped: 'القطع المجهزة ما تنصهر' };
      this.flash('❌ ' + (msgs[res.error] || res.error));
      return;
    }
    var lbl = res.outcome === 'upgrade' ? '🌟 ترقية ناجحة!' :
              res.outcome === 'downgrade' ? '💔 تراجع!' : '✨ بدون تغيير';
    this.flash(lbl + ' — ' + this.rarityInfo(eq, res.rarity).name, 2600);
    if (typeof beep === 'function') beep(res.outcome === 'upgrade' ? 1000 : 400, 0.2);
    this.smeltA = null;
    this.smeltB = null;
    this.refresh();
  }
});
