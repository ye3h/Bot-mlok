// modules/store.js - المتجر الموحّد (ES5) v2.0.0
// كل عنصر يُعرَّف هنا فقط. لا تكرّر العنصر في ملف آخر.
ModuleRegistry.register({
  id: 'store',
  name: 'المتجر',
  version: '2.0.0',
  dependencies: [],

  TABS: [
    { key: 'backgrounds', label: 'خلفيات' },
    { key: 'crew',        label: 'طواقم' },
    { key: 'vip',         label: 'VIP' },
    { key: 'frames',      label: 'إطارات' },
    { key: 'themes',      label: 'ثيمات' },
    { key: 'coins',       label: 'عملات' }
  ],

  // cat: مفتاح من TABS
  // equip: true = يمكن تركيبه، ويُحفظ في state.equipped[cat]
  // soon: true = معروض بلا شراء
  // bundle: قائمة معرّفات تُمنح مع الشراء
  // الطواقم المطابقة لتأثيرات crew_effects.js
  CATALOG: [
    { id: 'st_crew_sailor', cat: 'crew', equip: true, icon: '⚓', img: 'assets/crew/sailor.webp',
      name: 'بحّار', price_coins: 15000, req_level: 5,
      desc: 'يزيد فرص الصيد 15%' },
    { id: 'st_crew_guide', cat: 'crew', equip: true, icon: '🧭', img: 'assets/crew/guide.webp',
      name: 'مرشد', price_coins: 40000, req_level: 12,
      desc: 'يسألك قبل كل رحلة عن نوع السمكة المستهدف' },
    { id: 'st_crew_lucky', cat: 'crew', equip: true, icon: '🍀', img: 'assets/crew/lucky.webp',
      name: 'طاقم الحظ', price_gems: 30, req_level: 8,
      desc: 'يضيف مكافأة ذهب مع كل صيدة' },
    { id: 'st_crew_trader', cat: 'crew', equip: true, icon: '🧑‍💼', img: 'assets/crew/trader.webp',
      name: 'تاجر سمك', price_coins: 90000, req_level: 20,
      desc: 'يرفع أسعار البيع 10%' },
    { id: 'st_crew_police', cat: 'crew', icon: '👮', name: 'شرطي', price_coins: 80000, req_level: 20, soon: true,
      desc: 'يحمي من السرقات (قريباً)' },
    { id: 'st_crew_thief', cat: 'crew', icon: '🥷', name: 'لص', price_coins: 120000, req_level: 25, soon: true,
      desc: 'للسرقات (قريباً)' },
    { id: 'st_crew_group', cat: 'crew', icon: '👥', name: 'مجموعة الطاقم', price_coins: 120000, req_level: 15,
      desc: 'تحتوي على بحّار ومرشد وطاقم الحظ',
      bundle: ['st_crew_sailor', 'st_crew_guide', 'st_crew_lucky'] },

    { id: 'st_vip_yacht',    cat: 'vip', icon: '🛥', name: 'يخت VIP',         price_gems: 200, req_level: 30, desc: 'سفينة VIP (التفعيل مع نظام السفن)' },
    { id: 'st_vip_royal',    cat: 'vip', icon: '👑', name: 'السفينة الملكية', price_gems: 500, req_level: 50, desc: 'أعلى سفينة VIP' },

    { id: 'st_frame_bronze', cat: 'frames', equip: true, icon: '🥉', name: 'إطار برونزي', price_coins: 5000,  req_level: 3,  desc: 'إطار للملف الشخصي' },
    { id: 'st_frame_silver', cat: 'frames', equip: true, icon: '🥈', name: 'إطار فضي',    price_coins: 25000, req_level: 10, desc: 'إطار للملف الشخصي' },
    { id: 'st_frame_gold',   cat: 'frames', equip: true, icon: '🥇', name: 'إطار ذهبي',   price_gems: 50,     req_level: 20, desc: 'إطار للملف الشخصي' },

    { id: 'st_theme_night',  cat: 'themes', equip: true, icon: '🌙', name: 'ثيم الليل', price_coins: 30000, req_level: 10, desc: 'ثيم الواجهة (قريباً)' },
    { id: 'st_theme_gold',   cat: 'themes', equip: true, icon: '✨', name: 'ثيم الذهب', price_gems: 80,     req_level: 15, desc: 'ثيم الواجهة (قريباً)' },

    { id: 'st_coins_small',  cat: 'coins', soon: true, icon: '💰', name: 'حزمة ذهب صغيرة',   desc: 'الدفع غير مفعّل بعد' },
    { id: 'st_gems_small',   cat: 'coins', soon: true, icon: '💎', name: 'حزمة جواهر صغيرة', desc: 'الدفع غير مفعّل بعد' }
  ],

  tab: 'backgrounds',
  ctx: null,
  byId: {},

  init: function (ctx) {
    var self = this, i;
    this.ctx = ctx;

    for (i = 0; i < this.CATALOG.length; i++) this.byId[this.CATALOG[i].id] = this.CATALOG[i];

    // 1) تنظيف الشريط السفلي: إخفاء المنزل واليومي، وربط زر المتجر
    var nav = document.getElementById('bottombar');
    if (nav) {
      ['home', 'daily'].forEach(function (s) {
        var b = nav.querySelector('.nav-btn[data-screen="' + s + '"]');
        if (b) nav.removeChild(b);
      });
      var shopBtn = nav.querySelector('.nav-btn[data-screen="shop"]');
      if (shopBtn) {
        var nb = shopBtn.cloneNode(true);
        nav.replaceChild(nb, shopBtn);
        nb.addEventListener('click', function () { ctx.ui.showScreen('store'); });
      }
    }

    // 2) إزالة تبويب الخلفيات القديم من سوق السفن
    var oldBg = document.querySelector('#screen-shop .tab[data-tab="backgrounds"]');
    if (oldBg && oldBg.parentNode) oldBg.parentNode.removeChild(oldBg);

    // 3) شاشة المتجر
    var sec = document.createElement('section');
    sec.className = 'screen';
    sec.id = 'screen-store';
    sec.innerHTML =
      '<div class="sh"><span class="st">🛒 المتجر</span><button class="close-btn" data-close>✕</button></div>' +
      '<div class="tabs" id="stTabs"></div>' +
      '<div class="sb" id="stList"></div>';
    document.getElementById('app').appendChild(sec);
    sec.querySelector('[data-close]').addEventListener('click', function () { ctx.ui.closeScreen(); });

    document.getElementById('stTabs').addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-tab]') : null;
      if (!t) return;
      self.tab = t.getAttribute('data-tab');
      self.render();
    });

    document.getElementById('stList').addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!t || t.disabled) return;
      var item = self.findItem(t.getAttribute('data-id'));
      if (!item) return;
      if (t.getAttribute('data-act') === 'buy') self.buy(item);
      else self.equip(item);
    });
  },

  // تُستدعى بعد loadState: تعيد عناصر المتجر المحفوظة لأن loadState يحذف المعرّفات غير المعروفة
  load: function (saved) {
    var st = this.ctx.state, s = saved || {};
    var owned = s.owned || [], eq = s.equipped || {};
    var i, cat;

    for (i = 0; i < owned.length; i++) {
      if (this.byId[owned[i]] && st.owned.indexOf(owned[i]) < 0) st.owned.push(owned[i]);
    }
    for (cat in eq) {
      if (eq.hasOwnProperty(cat) && this.byId[eq[cat]] && this.byId[eq[cat]].equip) {
        st.equipped[cat] = eq[cat];
      }
    }
    if (typeof applyEquipped === 'function') applyEquipped();
  },

  onScreenOpen: function (ctx, name) {
    if (name === 'store') this.render();
  },

  findItem: function (id) {
    return ITEM_BY_ID[id] || this.byId[id] || null;
  },

  itemsFor: function (tab) {
    if (tab === 'backgrounds') return BACKGROUNDS;
    var out = [], i;
    for (i = 0; i < this.CATALOG.length; i++) {
      if (this.CATALOG[i].cat === tab) out.push(this.CATALOG[i]);
    }
    return out;
  },

  thumb: function (item) {
    if (!item.img) return item.icon;
    return '<img src="' + item.img + '" alt="" style="width:56px;height:46px;object-fit:contain" ' +
      'onerror="this.replaceWith(document.createTextNode(\'' + item.icon + '\'))">';
  },

  render: function () {
    var self = this, st = this.ctx.state;
    var tabsEl = document.getElementById('stTabs');
    var list = document.getElementById('stList');
    if (!tabsEl || !list) return;

    tabsEl.innerHTML = this.TABS.map(function (t) {
      return '<button class="tab' + (t.key === self.tab ? ' active' : '') + '" data-tab="' + t.key + '">' + t.label + '</button>';
    }).join('');

    var items = this.itemsFor(this.tab);
    var lv = levelOf(st.xp);
    var h = '';

    if (!items.length) h = '<div class="card"><div class="info muted">لا توجد عناصر بعد</div></div>';

    items.forEach(function (item) {
      var owned = st.owned.indexOf(item.id) >= 0;
      var canEquip = !!item.equip || item.cat === 'backgrounds';
      var equipped = st.equipped[item.cat] === item.id;
      var locked = !owned && (item.req_level || 0) > lv;

      var price = [];
      if (item.price_coins) price.push('💰 ' + item.price_coins.toLocaleString());
      if (item.price_gems) price.push('💎 ' + item.price_gems);

      var btn;
      if (item.soon) {
        btn = '<button class="btn" disabled>قريباً</button>';
      } else if (!owned) {
        btn = '<button class="btn gold" data-act="buy" data-id="' + item.id + '"' + (locked ? ' disabled' : '') + '>' +
              (locked ? '🔒 مستوى ' + item.req_level : 'شراء') + '</button>';
      } else if (canEquip) {
        btn = equipped
          ? '<button class="btn" disabled>مُركّب ✓</button>'
          : '<button class="btn" data-act="equip" data-id="' + item.id + '">تركيب</button>';
      } else {
        btn = '<button class="btn" disabled>✓ مملوك</button>';
      }

      h += '<div class="card' + (locked ? ' locked' : '') + '">' +
           '<div class="thumb" style="font-size:30px">' + self.thumb(item) + '</div>' +
           '<div class="info"><div class="nm">' + item.name + '</div>' +
           (item.desc ? '<div class="sub">' + item.desc + '</div>' : '') +
           '<div class="pr">' + price.join(' · ') + '</div></div>' +
           '<div class="acts">' + btn + '</div></div>';
    });

    list.innerHTML = h;
  },

  buy: function (item) {
    var st = this.ctx.state, ui = this.ctx.ui;
    if (st.owned.indexOf(item.id) >= 0) return;
    if (levelOf(st.xp) < (item.req_level || 0)) { ui.toast('🔒 تحتاج المستوى ' + item.req_level); return; }
    if ((item.price_coins || 0) > st.coins) { ui.toast('💰 الذهب غير كافٍ'); return; }
    if ((item.price_gems || 0) > st.gems) { ui.toast('💎 الجواهر غير كافية'); return; }

    st.coins -= item.price_coins || 0;
    st.gems -= item.price_gems || 0;
    st.owned.push(item.id);
    if (item.bundle) {
      item.bundle.forEach(function (id) {
        if (st.owned.indexOf(id) < 0) st.owned.push(id);
      });
    }
    this.done('✅ تم شراء ' + item.name);
  },

  equip: function (item) {
    var st = this.ctx.state;
    if (currentTripState !== TS.IDLE) {
      this.ctx.ui.toast('⚠️ لا يمكن التغيير أثناء الرحلة');
      return;
    }
    if (item.cat === 'backgrounds') {
      equipItem(item.id);
    } else {
      st.equipped[item.cat] = item.id;
      this.ctx.save();
      this.ctx.ui.toast('⚓ تم تركيب ' + item.name);
    }
    this.refresh();
  },

  done: function (msg) {
    this.ctx.save();
    this.ctx.ui.toast(msg);
    this.refresh();
  },

  refresh: function () {
    this.render();
    if (typeof render === 'function') render();
  }
});
