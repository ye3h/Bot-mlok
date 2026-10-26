// modules/daily_quests.js — المهام اليومية (v1.0.0)
ModuleRegistry.register({
  id: 'daily_quests',
  name: 'المهام اليومية',
  version: '1.0.0',
  dependencies: [],

  ctx: null,

  QUESTS: [
    { id: 'catch_10',   icon: '🐟', title: 'صياد اليوم',    desc: 'اصطد 10 أسماك',         target: 10,  metric: 'caught',  reward: { coins: 500 } },
    { id: 'trips_5',    icon: '🎣', title: 'إبحار متواصل',  desc: 'أكمل 5 رحلات',          target: 5,   metric: 'trips',   reward: { gems: 5 } },
    { id: 'sell_20',    icon: '💰', title: 'تاجر نشيط',     desc: 'بِع 20 سمكة',           target: 20,  metric: 'sold',    reward: { coins: 800 } },
    { id: 'golden_1',   icon: '✨', title: 'الحظ الذهبي',   desc: 'اصطد سمكة ذهبية',       target: 1,   metric: 'golden',  reward: { gems: 10 } },
    { id: 'legendary_1',icon: '🌟', title: 'أسطورة المحيط', desc: 'اصطد سمكة أسطورية',     target: 1,   metric: 'legendary', reward: { gems: 20 } }
  ],

  init: function (ctx) {
    this.ctx = ctx;
    this.ensureState();
  },

  load: function (saved) {
    this.ensureState();
  },

  save: function (st) {
    st.dailyQuests = this.ctx.state.dailyQuests;
  },

  todayKey: function () {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  },

  ensureState: function () {
    var st = this.ctx.state;
    var today = this.todayKey();

    if (!st.dailyQuests || st.dailyQuests.date !== today) {
      st.dailyQuests = {
        date: today,
        startSnapshot: {
          caught: st.stats.caught || 0,
          trips: st.stats.trips || 0,
          sold: st.stats.sold || 0,
          golden: st.stats.golden || 0,
          legendary: st.stats.legendary || 0
        },
        claimed: {}
      };
      if (typeof saveState === 'function') saveState();
    }
  },

  getProgress: function (q) {
    var st = this.ctx.state;
    this.ensureState();
    var start = st.dailyQuests.startSnapshot[q.metric] || 0;
    var now = st.stats[q.metric] || 0;
    return Math.max(0, now - start);
  },

  isComplete: function (q) {
    return this.getProgress(q) >= q.target;
  },

  isClaimed: function (q) {
    return !!this.ctx.state.dailyQuests.claimed[q.id];
  },

  claim: function (id) {
    var st = this.ctx.state;
    this.ensureState();
    var q = null;
    for (var i = 0; i < this.QUESTS.length; i++) {
      if (this.QUESTS[i].id === id) { q = this.QUESTS[i]; break; }
    }
    if (!q) return { ok: false, error: 'not_found' };
    if (st.dailyQuests.claimed[id]) return { ok: false, error: 'already_claimed' };
    if (!this.isComplete(q)) return { ok: false, error: 'not_complete' };

    var got = [];
    if (q.reward.coins) { st.coins = (st.coins || 0) + q.reward.coins; got.push('+' + q.reward.coins + ' 💰'); }
    if (q.reward.gems)  { st.gems = (st.gems || 0) + q.reward.gems;   got.push('+' + q.reward.gems + ' 💎'); }

    st.dailyQuests.claimed[id] = true;
    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
    if (typeof beep === 'function') beep(880, 0.1);

    return { ok: true, reward: got.join(' ') };
  },

  timeToReset: function () {
    var n = new Date();
    var m = new Date(n);
    m.setHours(24, 0, 0, 0);
    var ms = m - n;
    return Math.floor(ms / 3600000) + 'س ' + Math.floor((ms % 3600000) / 60000) + 'د';
  },

  completedCount: function () {
    var n = 0;
    for (var i = 0; i < this.QUESTS.length; i++) {
      if (this.isComplete(this.QUESTS[i])) n++;
    }
    return n;
  },

  claimedCount: function () {
    var st = this.ctx.state;
    if (!st.dailyQuests) return 0;
    var n = 0;
    for (var i = 0; i < this.QUESTS.length; i++) {
      if (st.dailyQuests.claimed[this.QUESTS[i].id]) n++;
    }
    return n;
  }
});
