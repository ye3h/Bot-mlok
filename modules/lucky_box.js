// modules/lucky_box.js — صندوق الحظ + العمود الجانبي (v3.0.0)
// v3.0.0: العمود 3 أزرار (حظ، يومي، مهام) — مطابق molok
ModuleRegistry.register({
  id: 'lucky_box',
  name: 'صندوق الحظ',
  version: '3.0.0',
  dependencies: [],

  COST_GEMS: 20,

  LOOT: [
    { w: 40, coins: 1000,  gems: 0,  label: '1,000 ذهب' },
    { w: 25, coins: 3000,  gems: 0,  label: '3,000 ذهب' },
    { w: 15, coins: 0,     gems: 3,  label: '3 جواهر' },
    { w: 10, coins: 8000,  gems: 0,  label: '8,000 ذهب' },
    { w: 7,  coins: 0,     gems: 8,  label: '8 جواهر' },
    { w: 3,  coins: 30000, gems: 15, label: '30,000 ذهب و15 جوهرة' }
  ],

  data: null,
  ctx: null,

  init: function (ctx) {
    var self = this;
    this.ctx = ctx;
    this.data = { opened: 0 };

    // احذف أي #lbColumn قديم
    var old = document.getElementById('lbColumn');
    if (old && old.parentNode) old.parentNode.removeChild(old);

    // العمود الجانبي — 3 أزرار مطابقة لـ molok
    var col = document.createElement('div');
    col.id = 'lbColumn';
    col.innerHTML =
      '<button class="lb-btn" data-act="box" title="صندوق الحظ">' +
        '<span class="lb-ico">🎁</span>' +
        '<span class="lb-txt">حظ</span>' +
      '</button>' +
      '<button class="lb-btn" data-act="daily" title="المكافأة اليومية">' +
        '<span class="lb-ico">🗝️</span>' +
        '<span class="lb-txt">يومي</span>' +
      '</button>' +
      '<button class="lb-btn" data-act="quests" title="المهام والإنجازات">' +
        '<span class="lb-ico">🏆</span>' +
        '<span class="lb-txt">مهام</span>' +
      '</button>';

    document.getElementById('app').appendChild(col);

    col.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!t) return;
      var act = t.getAttribute('data-act');
      if (act === 'box')    self.confirmOpen();
      if (act === 'daily')  ctx.ui.showScreen('daily');
      if (act === 'quests') ctx.ui.showScreen('achv');
    });
  },

  load: function (saved) {
    var p = (saved && saved.luckyBox) || {};
    this.data = { opened: typeof p.opened === 'number' ? p.opened : 0 };
  },

  save: function (st) {
    st.luckyBox = this.data;
  },

  confirmOpen: function () {
    var self = this;
    var st = this.ctx.state;
    if (st.gems < this.COST_GEMS) {
      this.ctx.ui.toast('💎 تحتاج ' + this.COST_GEMS + ' جوهرة لفتح الصندوق');
      return;
    }
    this.ctx.ui.confirm('فتح صندوق الحظ بـ ' + this.COST_GEMS + ' جوهرة؟', function () {
      self.open();
    });
  },

  pickLoot: function () {
    var total = 0, i, r;
    for (i = 0; i < this.LOOT.length; i++) total += this.LOOT[i].w;
    r = Math.random() * total;
    for (i = 0; i < this.LOOT.length; i++) {
      r -= this.LOOT[i].w;
      if (r < 0) return this.LOOT[i];
    }
    return this.LOOT[this.LOOT.length - 1];
  },

  open: function () {
    var st = this.ctx.state;
    if (st.gems < this.COST_GEMS) return;
    var prize = this.pickLoot();
    st.gems -= this.COST_GEMS;
    st.coins += prize.coins;
    st.gems += prize.gems;
    this.data.opened++;
    this.ctx.save();
    if (typeof render === 'function') render();
    this.ctx.ui.toast('🎁 ربحت: ' + prize.label);
  }
});
