// modules/dragon_equipment.js — عتاد التنين: 3 خانات × 6 ندرات (v1.0.0)
ModuleRegistry.register({
  id: 'dragon_equipment',
  name: 'عتاد التنين',
  version: '1.0.0',
  dependencies: [],

  SLOTS: {
    weapon:   { name: 'سلاح',  emoji: '⚔️', stat: 'attack', statName: 'هجوم' },
    armor:    { name: 'درع',   emoji: '🛡️', stat: 'defense', statName: 'دفاع' },
    talisman: { name: 'تميمة', emoji: '📿', stat: 'crit',   statName: 'قاضية' }
  },

  RARITIES: [
    { id: 'common',    name: 'عادي',   bonus: 5,  coinPrice: 150000, gemPrice: 0 },
    { id: 'rare',      name: 'نادر',   bonus: 15, coinPrice: 600000, gemPrice: 1500 },
    { id: 'epic',      name: 'ملحمي',  bonus: 25, coinPrice: 0,      gemPrice: 4000 },
    { id: 'legendary', name: 'أسطوري', bonus: 35, coinPrice: 0,      gemPrice: 9000 },
    { id: 'divine',    name: 'خرافي',  bonus: 50, coinPrice: 0,      gemPrice: 18000 },
    { id: 'fatak',     name: 'فتّاك',  bonus: 75, coinPrice: 0,      gemPrice: 0 }
  ],

  UPGRADE_COSTS: { common: 1500, rare: 6000, epic: 15000, legendary: 35000, divine: null, fatak: null },
  SMELT_COST: 1000,
  EXPIRY_DAYS: 7,

  ctx: null,

  init: function (ctx) {
    this.ctx = ctx;
    var st = ctx.state;
    if (!st.dragonEquip) st.dragonEquip = [];
    this.expireOld();
  },

  getRarity: function (id) {
    for (var i = 0; i < this.RARITIES.length; i++) if (this.RARITIES[i].id === id) return this.RARITIES[i];
    return null;
  },

  expireOld: function () {
    var st = this.ctx.state;
    var now = Date.now();
    var before = st.dragonEquip.length;
    st.dragonEquip = st.dragonEquip.filter(function (it) {
      return !it.expires_at || it.expires_at > now;
    });
    if (st.dragonEquip.length !== before) {
      if (typeof saveState === 'function') saveState();
    }
  },

  // ═══════ بونص كلي من كل القطع المجهزة ═══════
  getTotalBonus: function () {
    var st = this.ctx.state;
    var bonus = { attack: 0, defense: 0, crit: 0 };
    for (var i = 0; i < st.dragonEquip.length; i++) {
      var it = st.dragonEquip[i];
      if (!it.equipped) continue;
      var r = this.getRarity(it.rarity);
      if (!r) continue;
      var slot = this.SLOTS[it.slot];
      if (!slot) continue;
      bonus[slot.stat] = (bonus[slot.stat] || 0) + r.bonus;
    }
    return bonus;
  },

  // ═══════ شراء من المتجر ═══════
  buy: function (slot, rarity, currency) {
    var st = this.ctx.state;
    var r = this.getRarity(rarity);
    if (!r || !this.SLOTS[slot]) return { ok: false, error: 'bad_item' };
    if (rarity === 'fatak') return { ok: false, error: 'fatak_not_sellable' };

    var price = currency === 'coins' ? r.coinPrice : r.gemPrice;
    if (!price) return { ok: false, error: 'not_sellable' };
    if (currency === 'coins') {
      if (st.coins < price) return { ok: false, error: 'no_coins' };
      st.coins -= price;
    } else {
      if (st.gems < price) return { ok: false, error: 'no_gems' };
      st.gems -= price;
    }

    var item = {
      id: 'de_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      slot: slot,
      rarity: rarity,
      name: r.name + ' ' + this.SLOTS[slot].name,
      equipped: false,
      smelted: false,
      acquired_at: Date.now(),
      expires_at: Date.now() + this.EXPIRY_DAYS * 24 * 3600 * 1000
    };
    st.dragonEquip.push(item);
    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
    return { ok: true, item: item };
  },

  // ═══════ تجهيز / إلغاء ═══════
  equip: function (item_id) {
    var st = this.ctx.state;
    var item = null;
    for (var i = 0; i < st.dragonEquip.length; i++) if (st.dragonEquip[i].id === item_id) item = st.dragonEquip[i];
    if (!item) return { ok: false, error: 'not_found' };
    if (item.smelted) return { ok: false, error: 'smelted' };

    // إزالة أي قطعة مجهزة في نفس الخانة
    for (var j = 0; j < st.dragonEquip.length; j++) {
      if (st.dragonEquip[j].slot === item.slot && st.dragonEquip[j].equipped) {
        st.dragonEquip[j].equipped = false;
      }
    }
    item.equipped = !item.equipped;
    if (item.equipped && !item.expires_at) {
      item.expires_at = Date.now() + this.EXPIRY_DAYS * 24 * 3600 * 1000;
    }
    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
    return { ok: true, equipped: item.equipped };
  },

  // ═══════ ترقية ═══════
  upgrade: function (item_id) {
    var st = this.ctx.state;
    var item = null;
    for (var i = 0; i < st.dragonEquip.length; i++) if (st.dragonEquip[i].id === item_id) item = st.dragonEquip[i];
    if (!item) return { ok: false, error: 'not_found' };

    var cur = this.getRarity(item.rarity);
    if (!cur) return { ok: false, error: 'bad_rarity' };
    var cost = this.UPGRADE_COSTS[cur.id];
    if (!cost) return { ok: false, error: 'max_rarity' };
    if (st.gems < cost) return { ok: false, error: 'no_gems', needed: cost };

    st.gems -= cost;
    var idx = this.RARITIES.indexOf(cur);
    var next = this.RARITIES[idx + 1];
    if (!next) return { ok: false, error: 'no_next' };
    item.rarity = next.id;
    item.name = next.name + ' ' + this.SLOTS[item.slot].name;
    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
    return { ok: true, item: item, rarity: next.id };
  },

  // ═══════ صهر قطعتين ═══════
  smelt: function (a_id, b_id) {
    var st = this.ctx.state;
    var a = null, b = null;
    for (var i = 0; i < st.dragonEquip.length; i++) {
      if (st.dragonEquip[i].id === a_id) a = st.dragonEquip[i];
      if (st.dragonEquip[i].id === b_id) b = st.dragonEquip[i];
    }
    if (!a || !b || a === b) return { ok: false, error: 'bad_items' };
    if (a.slot !== b.slot) return { ok: false, error: 'different_slot' };
    if (a.rarity === 'fatak' || b.rarity === 'fatak') return { ok: false, error: 'fatak_smelts' };
    if (a.equipped || b.equipped) return { ok: false, error: 'equipped' };
    if (a.smelted || b.smelted) return { ok: false, error: 'already_smelted' };
    if (st.gems < this.SMELT_COST) return { ok: false, error: 'no_gems', needed: this.SMELT_COST };

    st.gems -= this.SMELT_COST;

    var sameRarity = a.rarity === b.rarity;
    var roll = Math.random();
    var outcome = '';
    var newRarityId = a.rarity;

    if (sameRarity) {
      if (roll < 0.40) outcome = 'upgrade';
      else if (roll < 0.85) outcome = 'stable';
      else outcome = 'downgrade';
    } else {
      if (roll < 0.20) outcome = 'upgrade';
      else if (roll < 0.75) outcome = 'stable';
      else outcome = 'downgrade';
    }

    // رتبة الأساس = الأعلى
    var ra = this.RARITIES.findIndex(function (r) { return r.id === a.rarity; });
    var rb = this.RARITIES.findIndex(function (r) { return r.id === b.rarity; });
    var baseIdx = Math.max(ra, rb);

    if (outcome === 'upgrade') baseIdx = Math.min(this.RARITIES.length - 1, baseIdx + 1);
    else if (outcome === 'downgrade') baseIdx = Math.max(0, baseIdx - 1);

    newRarityId = this.RARITIES[baseIdx].id;

    // احذف A، عدّل B
    st.dragonEquip = st.dragonEquip.filter(function (it) { return it.id !== a_id; });
    var bItem = st.dragonEquip.filter(function (it) { return it.id === b_id; })[0];
    if (bItem) {
      bItem.rarity = newRarityId;
      bItem.name = this.getRarity(newRarityId).name + ' ' + this.SLOTS[bItem.slot].name;
      bItem.smelted = true;
      bItem.equipped = false;
    }

    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
    return { ok: true, outcome: outcome, rarity: newRarityId };
  }
});
