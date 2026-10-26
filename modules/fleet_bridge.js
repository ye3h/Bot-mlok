// modules/fleet_bridge.js (ES5) v2.0.0
ModuleRegistry.register({
  id: 'fleet_bridge',
  name: 'ربط الأسطول',
  version: '2.0.0',
  dependencies: [],

  // سعر البيع من المخزن: نسبة من سعر السفينة. null = غير محدد بعد
  SELL_RATIO: null,

  ctx: null,
  fleet: null,

  init: function (ctx) {
    this.ctx = ctx;
    this.fleet = window.fleet || null;   // أُنشئ في index.html
  },

  ready: function () {
    return !!this.fleet;
  },

  data: function () {
    return this.fleet ? this.fleet.getState() : { storageCapacity: 0, ships: [] };
  },

  hasShip: function (id) {
    return this.data().ships.some(function (s) { return s.id === id; });
  },

  storageCount: function () {
    return this.data().ships.filter(function (s) {
      return s.location.type === 'storage';
    }).length;
  },

  hasStorageRoom: function () {
    var d = this.data();
    return this.storageCount() < d.storageCapacity;
  },

  // أول خانة فارغة في المخزن، أو -1
  freeStorageSlot: function () {
    var d = this.data(), used = {}, i;
    d.ships.forEach(function (s) {
      if (s.location.type === 'storage') used[s.location.slot] = true;
    });
    for (i = 0; i < d.storageCapacity; i++) {
      if (!used[i]) return i;
    }
    return -1;
  },

  // يُضيف سفينة مشتراة أو مؤجرة إلى المخزن
  addToStorage: function (s, rented) {
    var slot = this.freeStorageSlot();
    if (slot < 0) return false;
    return this.fleet.addShip({
      id: s.id,
      name: s.name,
      image: s.img,
      type: 'ship',
      upgrades: {},
      sellable: !rented,
      rented: !!rented
    }, { type: 'storage', slot: slot });
  },

  // يحذف السفينة من الأسطول نهائياً (يستخدم عند انتهاء الإيجار)
  removeShip: function (id) {
    if (!this.fleet || typeof this.fleet.removeShip !== 'function') return false;
    return this.fleet.removeShip(id);
  },

  // السفن البحرية بالترتيب حسب الخانة، تقرأها الرحلة لاحقاً
  seaShips: function () {
    return this.data().ships
      .filter(function (s) { return s.location.type === 'fleet'; })
      .sort(function (a, b) { return a.location.slot - b.location.slot; });
  },

  // البيع من المخزن: يعتمد على SELL_RATIO، وإن لم يُحدَّد يرفض العملية
  sell: function (ship) {
    var def = null, i, st = this.ctx.state;
    for (i = 0; i < SHIPS.length; i++) {
      if (SHIPS[i].id === ship.id) { def = SHIPS[i]; break; }
    }
    if (!def || this.SELL_RATIO === null) {
      this.ctx.ui.toast('⚠️ سعر البيع لم يُحدد بعد');
      return false;
    }
    st.coins += Math.round(def.price_coins * this.SELL_RATIO);
    this.ctx.save();
    return true;
  }
});
