// modules/leaderboard.js — لوحة الترتيب (ES5)
// نسخة v2.0.0 — لا تبني #lbColumn ولا تعدّله
ModuleRegistry.register({
  id: 'leaderboard',
  name: 'الترتيب',
  version: '2.0.0',
  dependencies: [],

  TABS: [
    { key: 'season',  label: 'موسم',    icon: '🏆' },
    { key: 'events',  label: 'فعاليات', icon: '🎉' },
    { key: 'xp',      label: 'XP',      icon: '⭐' },
    { key: 'gems',    label: 'جواهر',   icon: '💎' },
    { key: 'coins',   label: 'ذهب',     icon: '🪙' },
    { key: 'catch',   label: 'صيد',     icon: '🐟' },
    { key: 'market',  label: 'سوق',     icon: '💰' },
    { key: 'tribes',  label: 'قبائل',   icon: '🏴' }
  ],

  BOTS: [
    { name: 'بوت 1', level: 12,  xp: 4200,   gems: 40,  coins: 90000,   catch: 610,   market: 22000,  tribe: 'الصقور' },
    { name: 'بوت 2', level: 25,  xp: 15800,  gems: 120, coins: 340000,  catch: 2150,  market: 96000,  tribe: 'الأمواج' },
    { name: 'بوت 3', level: 41,  xp: 52000,  gems: 210, coins: 880000,  catch: 5400,  market: 310000, tribe: 'الصقور' },
    { name: 'بوت 4', level: 8,   xp: 1900,   gems: 15,  coins: 26000,   catch: 240,   market: 7000,   tribe: '' },
    { name: 'بوت 5', level: 66,  xp: 190000, gems: 480, coins: 2400000, catch: 17000, market: 880000, tribe: 'الأمواج' }
  ],

  ctx: null,
  tab: 'xp',
  query: '',

  init: function (ctx) {
    var self = this;
    this.ctx = ctx;

    // لا نبني #lbColumn — lucky_box يتولى ذلك
    // فقط ننشئ شاشة الترتيب
    var sec = document.getElementById('screen-leaderboard');
    if (!sec) {
      sec = document.createElement('section');
      sec.className = 'screen';
      sec.id = 'screen-leaderboard';
      sec.innerHTML =
        '<div class="sh"><span class="st">🏆 الترتيب</span><button class="close-btn" data-close>✕</button></div>' +
        '<div class="sb">' +
          '<div class="lbd-tabs" id="lbdTabs"></div>' +
          '<div class="lbd-search">' +
            '<input id="lbdQuery" type="text" placeholder="اسم القبطان..." maxlength="14">' +
            '<button class="btn gold" data-act="search">بحث</button>' +
          '</div>' +
          '<div id="lbdList"></div>' +
        '</div>';
      document.getElementById('app').appendChild(sec);

      sec.querySelector('[data-close]').onclick = function () { ctx.ui.closeScreen(); };

      document.getElementById('lbdTabs').addEventListener('click', function (e) {
        var t = e.target.closest ? e.target.closest('[data-tab]') : null;
        if (!t) return;
        self.tab = t.getAttribute('data-tab');
        self.render();
      });

      sec.querySelector('[data-act="search"]').onclick = function () {
        self.query = lbdClean(document.getElementById('lbdQuery').value);
        self.render();
      };
    }
  },

  onScreenOpen: function (ctx, name) {
    if (name === 'leaderboard') this.render();
  },

  fetchBoard: function () {
    var st = this.ctx.state, me = lbdStats(st);
    me.name = st.name;
    me.isMe = true;
    var all = [me], i;
    for (i = 0; i < this.BOTS.length; i++) {
      var b = this.BOTS[i];
      all.push({
        name: b.name, level: b.level, xp: b.xp, gems: b.gems,
        coins: b.coins, catch: b.catch, market: b.market, tribe: b.tribe, isMe: false
      });
    }
    return all;
  },

  render: function () {
    var sec = document.getElementById('screen-leaderboard');
    if (!sec) return;
    var st = this.ctx.state, self = this, i;

    var tabsEl = document.getElementById('lbdTabs');
    if (tabsEl) {
      tabsEl.innerHTML = this.TABS.map(function (t) {
        return '<button class="lbd-tab' + (t.key === self.tab ? ' active' : '') + '" data-tab="' + t.key + '">' +
               '<span>' + t.icon + '</span><span>' + t.label + '</span></button>';
      }).join('');
    }

    var isTribe = this.tab === 'tribes';
    var field = (this.tab === 'season' || this.tab === 'events') ? 'xp'
              : isTribe ? 'level'
              : this.tab;
    var list = this.fetchBoard();

    list.sort(function (a, b) { return (b[field] || 0) - (a[field] || 0); });

    if (this.query) {
      list = list.filter(function (r) { return r.name.indexOf(self.query) >= 0; });
    }

    var h = '';
    if (!list.length) h = '<div class="card"><div class="info muted">لا توجد نتائج</div></div>';

    for (i = 0; i < list.length && i < 50; i++) {
      var r = list[i];
      var value = isTribe ? lbdEsc(r.tribe || '—') : (r[field] || 0).toLocaleString();
      h += '<div class="card' + (r.isMe ? ' ach-done' : '') + '">' +
           '<div class="thumb lbd-rank">' + (i + 1) + '</div>' +
           '<div class="info"><div class="nm">' + lbdEsc(r.name) + (r.isMe ? ' (أنت)' : '') + '</div>' +
           '<div class="sub">مستوى ' + r.level + (r.tribe ? ' · ' + lbdEsc(r.tribe) : '') + '</div></div>' +
           '<div class="pr">' + value + '</div></div>';
    }
    var listEl = document.getElementById('lbdList');
    if (listEl) listEl.innerHTML = h;
  },

  CSS_TEXT: function () {
    return [
      '.lbd-tabs{display:flex;gap:6px;overflow-x:auto;padding:4px 0 10px;margin-bottom:8px}',
      '.lbd-tab{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:56px;padding:8px 6px;border-radius:12px;border:1px solid rgba(255,255,255,.15);background:var(--glass);color:#fff;font-family:inherit;font-size:11px;font-weight:700}',
      '.lbd-tab.active{border-color:var(--gold);box-shadow:0 0 12px rgba(255,215,106,.35);background:linear-gradient(180deg,#FFE9A8,#C9962A);color:#3a2506}',
      '.lbd-search{display:flex;gap:8px;margin-bottom:12px}',
      '.lbd-search input{flex:1;min-width:0;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--glass);color:#fff;font-family:inherit;font-size:14px}',
      '.lbd-rank{font-weight:800;color:var(--gold);font-size:18px;min-width:36px}'
    ].join('\n');
  }
});

function lbdStats(st) {
  return {
    level: (typeof levelOf === 'function' ? levelOf(st.xp) : 1),
    xp: st.xp || 0,
    gems: st.gems || 0,
    coins: st.coins || 0,
    catch: (st.stats && st.stats.caught) || 0,
    market: (st.stats && st.stats.earned) || 0,
    tribe: ''
  };
}

function lbdClean(s) {
  return String(s == null ? '' : s).replace(/^\s+|\s+$/g, '').slice(0, 14);
}

function lbdEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
