// modules/hub.js - تنظيم الواجهة: مخزن السمك المكتشف، سوق السمك، نقل الإحصاء والمهام (ES5)
ModuleRegistry.register({
  id: 'hub',
  name: 'تنظيم الواجهة',
  version: '1.0.0',
  dependencies: [],

  RARITY_ORDER: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
  discovered: {},
  ctx: null,

  init: function (ctx) {
    var self = this;
    this.ctx = ctx;

    if (!document.getElementById('hub-css')) {
      var css = document.createElement('style');
      css.id = 'hub-css';
      css.textContent = this.CSS_TEXT();
      document.head.appendChild(css);
    }

    // شاشة سوق السمك: بيع + مخزن السمك المكتشف
    var mk = document.createElement('section');
    mk.className = 'screen';
    mk.id = 'screen-fishmarket';
    mk.innerHTML =
      '<div class="sh"><span class="st">🏪 سوق السمك</span><button class="close-btn" data-close>✕</button></div>' +
      '<div class="sb">' +
        '<button class="hb-big" data-go="storage">🛒 بيع السمك<small>بيع الأسماك من مخزنك</small></button>' +
        '<button class="hb-big" data-go="fishbook">📖 مخزن السمك المكتشف<small>الأسماك التي اصطدتها والناقصة</small></button>' +
        '<button class="hb-big" data-act="sellall">💰 بيع الكل<small>بيع كل ما في المخزن بالسعر الحالي</small></button>' +
      '</div>';
    document.getElementById('app').appendChild(mk);

    // شاشة المخزن المكتشف
    var bk = document.createElement('section');
    bk.className = 'screen';
    bk.id = 'screen-fishbook';
    bk.innerHTML =
      '<div class="sh"><span class="st">📖 مخزن السمك المكتشف</span><button class="close-btn" data-close>✕</button></div>' +
      '<div class="sb"></div>';
    document.getElementById('app').appendChild(bk);

    mk.querySelector('[data-close]').onclick = function () { ctx.ui.closeScreen(); };
    bk.querySelector('[data-close]').onclick = function () { ctx.ui.closeScreen(); };

    mk.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-go],[data-act]') : null;
      if (!t) return;
      if (t.getAttribute('data-go')) ctx.ui.showScreen(t.getAttribute('data-go'));
      if (t.getAttribute('data-act') === 'sellall' && typeof sellAll === 'function') sellAll();
    });

    // تنفيذ تعديلات الواجهة بعد أن تُبنى كل الوحدات والأزرار
    setTimeout(function () {
      self.cleanNav();
      self.patchMarket();
      self.patchAchv();
      self.patchProfile();
      self.patchIcons();
    }, 0);
  },

  // ─── الحفظ والتحميل ───
  load: function (saved) {
    var p = (saved && saved.hub) || {};
    this.discovered = (p.discovered && typeof p.discovered === 'object') ? p.discovered : {};
    // أي سمكة موجودة في المخزن الآن تُعتبر مكتشفة (للتوافق مع الحفظ القديم)
    var inv = (this.ctx && this.ctx.state && this.ctx.state.inventory) || {};
    for (var k in inv) {
      if (inv.hasOwnProperty(k)) this.discovered[k.replace(/^g_/, '')] = true;
    }
  },

  save: function (st) {
    st.hub = { discovered: this.discovered };
  },

  // ─── الأحداث ───
  onCatch: function (ctx, fishId) {
    var id = String(fishId).replace(/^g_/, '');
    if (typeof FISH !== 'undefined' && FISH[id] && !this.discovered[id]) {
      this.discovered[id] = true;
      ctx.save();
      ctx.ui.toast('📖 سمكة جديدة: ' + FISH[id].name);
    }
  },

  onScreenOpen: function (ctx, name) {
    if (name === 'fishbook') this.renderBook();
  },

  // ─── مخزن السمك المكتشف ───
  sortedIds: function () {
    var out = [], r, id;
    for (r = 0; r < this.RARITY_ORDER.length; r++) {
      for (id in FISH) {
        if (FISH.hasOwnProperty(id) && FISH[id].rarity === this.RARITY_ORDER[r]) out.push(id);
      }
    }
    return out;
  },

  renderBook: function () {
    var sec = document.getElementById('screen-fishbook');
    if (!sec) return;
    var st = this.ctx.state, ids = this.sortedIds(), found = 0, i, id, ok, qty;
    for (i = 0; i < ids.length; i++) if (this.discovered[ids[i]]) found++;

    var h = '<div class="hero"><div class="muted">الأسماك المكتشفة</div>' +
            '<div class="big">' + found + ' / ' + ids.length + '</div></div>';
    h += '<div class="hb-grid">';
    for (i = 0; i < ids.length; i++) {
      id = ids[i];
      ok = !!this.discovered[id];
      qty = (st.inventory[id] || 0) + (st.inventory['g_' + id] || 0);
      h += '<div class="hb-card' + (ok ? '' : ' hb-locked') + '">' +
           '<img src="' + fishImg(id) + '" alt="">' +
           (ok
             ? '<div class="hb-name">' + FISH[id].name + '</div><div class="hb-pr">💰 ' + FISH[id].base + '</div>'
             : '<div class="hb-off">غير مكتشفة</div>') +
           '<div class="hb-sub">×' + qty + '</div></div>';
    }
    h += '</div>';
    sec.querySelector('.sb').innerHTML = h;
  },

  // ─── إزالة الأزرار المنقولة من الشريط السفلي ───
  cleanNav: function () {
    var nav = document.getElementById('bottombar');
    if (!nav) return;
    var sel = ['storage', 'stats', 'crew', 'quests'], i, b;
    for (i = 0; i < sel.length; i++) {
      b = nav.querySelector('[data-screen="' + sel[i] + '"]') || document.getElementById('nav-' + sel[i]);
      if (b && b.parentNode) b.parentNode.removeChild(b);
    }
    nav.style.gridTemplateColumns = 'repeat(' + Math.max(1, nav.children.length) + ',minmax(0,1fr))';
  },

  // ─── سوق السمك: الضغط عليه يفتح صفحة البيع بدل المخزن مباشرة ───
  patchMarket: function () {
    var self = this;
    var old = document.querySelector('.map-item[data-key="fishMarket"]');
    if (!old) return;
    var el = old.cloneNode(true);          // نسخة بدون المستمعات القديمة
    old.parentNode.replaceChild(el, old);
    el.addEventListener('click', function () {
      if (typeof editMode !== 'undefined' && editMode) return;
      self.ctx.ui.showScreen('fishmarket');
    });
  },

  // ─── الإنجازات: تبويب يفتح المهام اليومية ───
  patchAchv: function () {
    var self = this;
    var sec = document.getElementById('screen-achv');
    if (!sec) return;
    var sb = sec.querySelector('.sb');
    if (!sb) return;
    var bar = document.createElement('div');
    bar.className = 'tabs';
    bar.innerHTML =
      '<button class="tab active">🏅 إنجازات</button>' +
      '<button class="tab" data-q="1">📜 مهام يومية</button>';
    sec.insertBefore(bar, sb);
    bar.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-q]') : null;
      if (!t) return;
      self.ctx.ui.closeScreen();
      self.ctx.ui.showScreen('quests');
    });
  },

  // ─── الملف الشخصي: أزرار الإحصاء والمكافأة والمكتشف ───
  patchProfile: function () {
    var self = this;
    var sec = document.getElementById('screen-profile');
    if (!sec) return;
    var sb = sec.querySelector('.sb');
    if (!sb) return;
    var row = document.createElement('div');
    row.className = 'hb-row';
    row.innerHTML =
      '<button class="hb-mini" data-s="stats">📊 إحصاء</button>' +
      '<button class="hb-mini" data-s="daily">🎁 يومي</button>' +
      '<button class="hb-mini" data-s="fishbook">📖 المكتشف</button>';
    sec.insertBefore(row, sb);
    row.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-s]') : null;
      if (t) self.ctx.ui.showScreen(t.getAttribute('data-s'));
    });
  },

  // ─── أيقونة الإنجازات في العمود الجانبي ───
  patchIcons: function () {
    var b = document.querySelector('#lbColumn [data-act="achv"] .lb-ico');
    if (b) b.textContent = '🏅';
  },

  CSS_TEXT: function () {
    return [
      '.hb-big{display:block;width:100%;margin-bottom:10px;padding:16px;border-radius:16px;border:1px solid var(--gold);background:var(--glass);color:#fff;font-family:inherit;font-size:16px;font-weight:800;text-align:start}',
      '.hb-big small{display:block;font-size:11px;font-weight:400;color:rgba(255,255,255,.6);margin-top:4px}',
      '.hb-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '.hb-card{background:var(--glass);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:10px;text-align:center}',
      '.hb-card img{width:72px;height:60px;object-fit:contain}',
      '.hb-locked img{filter:brightness(0);opacity:.55}',
      '.hb-name{font-weight:800;font-size:13px;margin-top:4px}',
      '.hb-pr{color:var(--gold);font-weight:800;font-size:12px}',
      '.hb-off{font-size:11px;color:#ff8a80;margin-top:4px}',
      '.hb-sub{font-size:11px;color:rgba(255,255,255,.6);margin-top:2px}',
      '.hb-row{display:flex;gap:8px;margin-bottom:12px}',
      '.hb-mini{flex:1;padding:12px 6px;border-radius:14px;border:1px solid var(--gold);background:linear-gradient(180deg,#FFE9A8,#C9962A);color:#3a2506;font-weight:800;font-family:inherit;font-size:12px}'
    ].join('\n');
  }
});
