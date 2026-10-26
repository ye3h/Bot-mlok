// modules/ship_storage.js — إدارة مخزن السفن (محدث تلقائياً عبر بايثون)
ModuleRegistry.register({
  id: 'ship_storage',
  name: 'مخزن السفن',
  version: '1.2.0',
  ctx: null,
  _isOpen: false,

  init: function (ctx) {
    var self = this;
    this.ctx = ctx;
    if (!document.getElementById('screen-shipstorage')) {
      var sec = document.createElement('section');
      sec.className = 'screen';
      sec.id = 'screen-shipstorage';
      sec.innerHTML = '<div class="sh"><span class="st">⚓ مخزن السفن</span><button class="close-btn" data-close>✕</button></div><div class="sb" id="shipStorageBody"></div>';
      document.getElementById('app').appendChild(sec);
      sec.querySelector('.close-btn').addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        self._isOpen = false;
        if (typeof closeScreen === 'function') closeScreen();
      });
      document.getElementById('shipStorageBody').addEventListener('click', function (e) {
        self.onClick(e);
      });
    }
  },

  open: function () {
  var f = window.ModuleRegistry && window.ModuleRegistry.get('fleet');
  if (f && typeof f.openStorage === 'function') { f.openStorage(); return; }
  if (typeof this.ctx.ui.toast === 'function') this.ctx.ui.toast('موديول الأسطول غير محمّل');
},
  onClick: function (e) {
    var t = e.target.closest('[data-storage-action]');
    if (!t) return;
    var act = t.getAttribute('data-storage-action');
    if (act === 'upgrade') {
      this.upgradeStorage();
    }
  },

  getStorageLevel: function () {
    var st = this.ctx && this.ctx.state;
    return (st && st.shipStorage && st.shipStorage.level) || 1;
  },

  getUpgradeCost: function (lvl) {
    return { gems: Math.min(500, lvl * 25), coins: lvl * 15000 };
  },

  upgradeStorage: function () {
    var self = this;
    var st = this.ctx && this.ctx.state;
    if (!st) return;
    var lvl = this.getStorageLevel();
    var cost = this.getUpgradeCost(lvl);
    if ((st.gems || 0) < cost.gems) {
      this.ctx.ui.toast('💎 جواهر غير كافية');
      return;
    }
    st.gems -= cost.gems;
    if (!st.shipStorage) st.shipStorage = { level: 1 };
    st.shipStorage.level = lvl + 1;
    this.ctx.save();
    this.ctx.ui.toast('✅ تم ترقية مخزن السفن بنجاح!');
    this.render();
  },

  render: function () {
    var body = document.getElementById('shipStorageBody');
    if (!body || !this.ctx) return;
    var lvl = this.getStorageLevel();
    var cost = this.getUpgradeCost(lvl);
    var h = '<div style="padding:14px">';
    h += '<div style="padding:14px;border-radius:14px;background:linear-gradient(180deg,rgba(30,45,75,.9),rgba(15,25,45,.95));border:1.5px solid rgba(252,191,73,.35);margin-bottom:14px">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
    h += '<div style="font-weight:900;font-size:15px;color:#fef3c7">⚓ مستوى المخزن: L' + lvl + '</div>';
    h += '<button data-storage-action="upgrade" style="padding:8px 12px;border-radius:8px;border:0;background:linear-gradient(180deg,#fcd34d,#d97706);color:#1c1917;font-weight:900;font-size:11px;cursor:pointer">ترقية (' + cost.gems + ' 💎)</button>';
    h += '</div></div></div>';
    body.innerHTML = h;
  }
});
