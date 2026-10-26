/* modules/shop.js — المتجر الموحّد الاحترافي (v4.0.0) */
ModuleRegistry.register({
  id: 'shop',
  name: 'المتجر',
  version: '4.0.0',
  dependencies: ['weapons_shop'],

  TABS: [
    { id: 'protection',  label: 'حماية',   emoji: '🛡️' },
    { id: 'weapons',     label: 'أسلحة',   emoji: '💣' },
    { id: 'crews',       label: 'طواقم',   emoji: '⚓' },
    { id: 'ships',       label: 'سفن',     emoji: '⛵' },
    { id: 'rental',      label: 'استئجار', emoji: '🚢' },
    { id: 'frames',      label: 'إطارات',  emoji: '🖼️' },
    { id: 'backgrounds', label: 'خلفيات',  emoji: '🏞' }
  ],

  PROTECTION: [
    { id: 'shield-4h', name: 'درع 4 ساعات', emoji: '🛡️', currency: 'gems', price: 60,    desc: 'يُضاف للمخزن — فعّله وقت ما تحتاجه', store: 'shields' },
    { id: 'shield-1d', name: 'درع يوم',     emoji: '🛡️', currency: 'gems', price: 280,   desc: 'يُضاف للمخزن — فعّله وقت ما تحتاجه', store: 'shields' },
    { id: 'shield-2d', name: 'درع يومين',   emoji: '🛡️', currency: 'gems', price: 550,   desc: 'يُضاف للمخزن — فعّله وقت ما تحتاجه', store: 'shields' },
    { id: 'anti_rocket',     name: 'مضاد صواريخ',        emoji: '🚀', currency: 'gems', price: 50,    desc: 'صد 60% لأي صاروخ قادم',                store: 'antis' },
    { id: 'anti_nuke',       name: 'مضاد قنبلة ذرية',    emoji: '☢️', currency: 'gems', price: 120,   desc: 'صد 75% للقنبلة الذرية',                store: 'antis' },
    { id: 'anti_ad_bomb',    name: 'مضاد قنبلة إعلانية', emoji: '📺', currency: 'gems', price: 210,   desc: 'صد 70% للقنبلة الإعلانية',             store: 'antis' },
    { id: 'anti_kraken',     name: 'مضاد الكراكن',       emoji: '🐙', currency: 'gems', price: 10000, desc: 'صد 100% لنهب مخزن سمكك',               store: 'antis' },
    { id: 'disabler_kraken', name: 'معطّل مضاد الكراكن', emoji: '⚡', currency: 'gems', price: 10000, desc: 'يعطّل مضاد الكراكن لدى الخصم 10 دقائق', store: 'antis' }
  ],

  SHIP_PACKS: [
    { id: 'phoenix-pack-1', name: 'سفينة عنقاء', emoji: '🦅', packType: 'gems', price: 1500, count: 1, shipCode: 'phoenix',
      desc: 'دم 13,000 · سعة 13,000 · تصيد عنقاء النار', img: 'assets/ships/ship-phoenix-C3TXdfiW.webp', tag: null },
    { id: 'phoenix-pack-3', name: 'حزمة 3 سفن عنقاء', emoji: '🦅', packType: 'gems', price: 3800, count: 3, shipCode: 'phoenix',
      desc: 'ثلاث سفن عنقاء دفعة واحدة · أفضل قيمة', img: 'assets/ships/ship-phoenix-C3TXdfiW.webp', tag: 'أفضل قيمة' },
    { id: 'bd_dragon_t1', name: 'ثلاثية التنين الدموي', emoji: '🐉', packType: 'usd', priceUSD: 100, count: 3, shipCode: 'dragon-t1',
      desc: '3 سفن حمراء · دم 20,000 · تصيد التنين الأسود', img: 'assets/ships/ship-dragon-red-d-5lmhdh.webp', tag: 'جديد' },
    { id: 'bd_dragon_t2', name: 'ثلاثية التنين الفضي', emoji: '🐲', packType: 'usd', priceUSD: 200, count: 3, shipCode: 'dragon-t2',
      desc: '3 سفن فضية · دم 40,000 · تصيد التنين الأسود', img: 'assets/ships/ship-dragon-silver-qnrqb-29.webp', tag: 'أسطوري' },
    { id: 'bd_dragon_t3', name: 'ثلاثية التنين الذهبي', emoji: '👑', packType: 'usd', priceUSD: 300, count: 3, shipCode: 'dragon-t3',
      desc: '3 سفن ذهبية · دم 60,000 · قمّة الأسطول', img: 'assets/ships/ship-dragon-gold-bnkhn9-i.webp', tag: 'خرافي' }
  ],

  FRAMES: [
    { id: 'st_frame_bronze', name: 'إطار برونزي', icon: '🥉', price_coins: 5000,  req_level: 3,  desc: 'إطار فاخر للملف الشخصي' },
    { id: 'st_frame_silver', name: 'إطار فضي',    icon: '🥈', price_coins: 25000, req_level: 10, desc: 'إطار فاخر للملف الشخصي' },
    { id: 'st_frame_gold',   name: 'إطار ذهبي',   icon: '🥇', price_gems: 50,     req_level: 20, desc: 'إطار أسطوري للملف الشخصي' }
  ],

  ctx: null,
  activeTab: 'protection',

  /* ═══════════════ INIT ═══════════════ */
  init: function (ctx) {
    this.ctx = ctx;
    this.ensureState();
    this.injectCSS();
    this.buildUI();
    window.renderShop = this.render.bind(this);
  },

  onScreenOpen: function (ctx, name) {
    if (name === 'shop') this.render();
  },

  ensureState: function () {
    var st = this.ctx.state;
    if (!st.shields || typeof st.shields !== 'object') st.shields = {};
    if (!st.antis || typeof st.antis !== 'object') st.antis = {};
    if (!st.frames || typeof st.frames !== 'object') st.frames = {};
    if (!st.equipped || typeof st.equipped !== 'object') st.equipped = {};
    if (!st.owned || !Array.isArray(st.owned)) st.owned = [];
  },

  /* ═══════════════ CSS ═══════════════ */
  injectCSS: function () {
    if (document.getElementById('_sh_css_expert')) return;
    var c = [
      '.sh-wrap{direction:rtl;font-family:inherit;color:#fff;display:flex;flex-direction:column;height:100%;background:radial-gradient(ellipse at 50% 0%,#151c2e 0%,#080c16 55%,#000 100%)}',
      '.sh-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:rgba(10,15,25,.85);border-bottom:1px solid rgba(252,191,73,.25)}',
      '.sh-title-main{font-size:18px;font-weight:900;color:#fcd34d;text-shadow:0 2px 8px rgba(0,0,0,.8)}',
      
      '.sh-tabs{display:flex;gap:6px;overflow-x:auto;padding:12px;scrollbar-width:none;flex-shrink:0;background:rgba(5,8,15,.7)}',
      '.sh-tabs::-webkit-scrollbar{display:none}',
      '.sh-tab{flex:0 0 auto;padding:9px 14px;border-radius:12px;border:1.5px solid rgba(252,191,73,.25);background:linear-gradient(180deg,rgba(15,25,45,.8),rgba(10,15,30,.8));color:#94a3b8;font-size:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .2s}',
      '.sh-tab.on{border-color:#fcd34d;background:linear-gradient(180deg,rgba(252,191,73,.3),rgba(180,83,9,.2));color:#fef3c7;box-shadow:0 0 14px rgba(252,191,73,.4);transform:translateY(-1px)}',

      '.sh-body{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px;display:flex;flex-direction:column;gap:10px}',
      
      '.sh-list{display:flex;flex-direction:column;gap:10px;padding-bottom:20px}',
      '.sh-card{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;background:linear-gradient(180deg,rgba(18,28,50,.9),rgba(10,16,30,.9));border:1px solid rgba(252,191,73,.2);box-shadow:0 6px 16px rgba(0,0,0,.4);transition:transform .15s}',
      '.sh-card:hover{border-color:rgba(252,191,73,.4)}',
      '.sh-card.is-locked{opacity:.55}',
      
      '.sh-ico{width:54px;height:54px;border-radius:14px;display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:28px;background:radial-gradient(circle at 30% 25%,rgba(255,240,200,.2),rgba(0,0,0,.5));border:1.5px solid rgba(252,191,73,.3);flex-shrink:0}',
      '.sh-body-card{flex:1;min-width:0}',
      '.sh-title{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:14px;font-weight:900;color:#fff}',
      '.sh-tag{font-size:9px;font-weight:900;padding:2px 6px;border-radius:6px;background:#fcd34d;color:#1c1917}',
      '.sh-desc{font-size:11px;color:#94a3b8;margin-top:3px;line-height:1.4}',
      '.sh-stats{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}',
      '.sh-stat{font-size:10px;padding:2px 8px;border-radius:6px;background:rgba(0,0,0,.4);color:#e2e8f0;border:1px solid rgba(255,255,255,.05)}',
      '.sh-stat i{font-style:normal;color:#fcd34d;font-weight:800}',
      
      '.sh-act{flex:0 0 auto}',
      '.sh-btn{min-width:92px;padding:9px 12px;border-radius:12px;border:1.5px solid;font-family:inherit;font-size:12px;font-weight:900;cursor:pointer;white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,.3);transition:transform .15s}',
      '.sh-btn:active:not(:disabled){transform:scale(.95)}',
      '.sh-btn:disabled{background:#1e293b!important;border-color:#334155!important;color:#64748b!important;cursor:default;box-shadow:none!important}',
      
      '.sh-gold{border-color:#fcd34d;background:linear-gradient(180deg,#fcd34d,#d97706);color:#1c1917;text-shadow:0 1px 0 rgba(255,255,255,.3)}',
      '.sh-blue{border-color:#38bdf8;background:linear-gradient(180deg,#38bdf8,#0284c7);color:#fff}',
      '.sh-purple{border-color:#a78bfa;background:linear-gradient(180deg,#a78bfa,#7c3aed);color:#fff}',
      '.sh-green{border-color:#4ade80;background:linear-gradient(180deg,#4ade80,#16a34a);color:#fff}',
      '.sh-ghost{border-color:rgba(255,255,255,.1);background:rgba(0,0,0,.3);color:#94a3b8}',
      '.sh-wide{width:100%;padding:12px;font-size:14px}',

      '.sh-info{font-size:12px;color:#38bdf8;text-align:center;padding:10px;margin-bottom:6px;border-radius:12px;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.3);font-weight:800}',
      '.sh-empty{font-size:13px;color:#94a3b8;text-align:center;padding:40px 10px}',
      '.sh-warn{font-size:12px;color:#f87171;text-align:center;padding:10px;border-radius:12px;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.4);font-weight:800}',
      '.sh-ok{font-size:12px;color:#4ade80;text-align:center;padding:10px;border-radius:12px;background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.4);font-weight:800}',
      '.sh-note{font-size:11px;color:#94a3b8;text-align:center;margin:8px 0}',

      '.sh-hero{padding:16px;border-radius:18px;background:linear-gradient(180deg,rgba(30,10,50,.95),rgba(12,5,25,.98));border:1.5px solid rgba(167,139,250,.5);box-shadow:0 8px 24px rgba(124,58,237,.3);margin-bottom:10px}',
      '.sh-hero-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}',
      '.sh-kicker{font-size:10px;letter-spacing:2px;color:#cbd5e1;font-weight:900}',
      '.sh-hero-title{font-size:20px;font-weight:900;color:#fef3c7;margin-bottom:8px}',
      '.sh-hero-img{height:160px;display:flex;align-items:center;justify-content:center;border-radius:14px;margin-bottom:10px;background:radial-gradient(ellipse at center,rgba(167,139,250,.2),transparent 70%)}',
      '.sh-center{text-align:center}',
      '.sh-kv{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}',
      '.sh-kv-item{padding:10px 6px;border-radius:12px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.08);text-align:center}',
      '.sh-kv-item span{display:block;font-size:10px;color:#94a3b8;font-weight:800}',
      '.sh-kv-item b{display:block;font-size:14px;color:#fef3c7;margin-top:3px}'
    ].join('');
    var s = document.createElement('style');
    s.id = '_sh_css_expert';
    s.textContent = c;
    document.head.appendChild(s);
  },

  /* ═══════════════ بناء واجهة المستخدم ═══════════════ */
  buildUI: function () {
    var scr = document.getElementById('screen-shop');
    if (!scr) return;
    var self = this;

    var tabs = this.TABS.map(function (t) {
      return '<button class="sh-tab" data-shop-tab="' + t.id + '"><span>' + t.emoji + '</span><span>' + t.label + '</span></button>';
    }).join('');

    scr.innerHTML = '<div class="sh-wrap">' +
      '<div class="sh-header"><span class="sh-title-main">🛒 المتجر الموحّد</span><button class="close-btn" data-close>✕</button></div>' +
      '<div class="sh-tabs" id="shopTabs">' + tabs + '</div>' +
      '<div class="sh-body" id="shopBody"></div>' +
    '</div>';

    scr.querySelector('.close-btn').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      self.ctx.ui.closeScreen();
    });

    document.getElementById('shopTabs').addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-shop-tab]') : null;
      if (!b) return;
      self.activeTab = b.getAttribute('data-shop-tab');
      self.render();
    });

    document.getElementById('shopBody').addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-shop]') : null;
      if (!b || b.disabled) return;
      var act = b.getAttribute('data-shop');
      var id = b.getAttribute('data-id');
      var tab = b.getAttribute('data-tab');
      switch (act) {
        case 'pro':     self.buyProtection(id); break;
        case 'wbuy':    self.buyWeapon(tab, id); break;
        case 'pack':    self.buyPack(id); break;
        case 'rent':    self.rentSubmarine(); break;
        case 'frbuy':   self.buyFrame(id); break;
        case 'frequip': self.equipFrame(id); break;
        case 'bgbuy':   self.buyBg(id); break;
        case 'bgequip': self.equipBg(id); break;
      }
    });
  },

  render: function () {
    var tabs = document.querySelectorAll('#shopTabs .sh-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('on', tabs[i].getAttribute('data-shop-tab') === this.activeTab);
    }
    var body = document.getElementById('shopBody');
    if (body) body.innerHTML = this.renderHTML();
  },

  renderHTML: function (tab) {
    if (tab) this.activeTab = tab;
    switch (this.activeTab) {
      case 'protection':  return this.renderProtection();
      case 'weapons':     return this.renderWS('weapons');
      case 'crews':       return this.renderWS('crews');
      case 'ships':       return this.renderShipPacks();
      case 'rental':      return this.renderRental();
      case 'frames':      return this.renderFrames();
      case 'backgrounds': return this.renderBackgrounds();
    }
    return '';
  },

  /* ═══════════════ القوالب المشتركة ═══════════════ */
  imgOrEmoji: function (src, emoji, style) {
    return '<img src="' + src + '" alt="" style="' + style + '" ' +
      'onerror="this.style.display=\'none\';var s=document.createElement(\'span\');s.textContent=this.dataset.fb;this.parentNode.appendChild(s);" ' +
      'data-fb="' + emoji + '">';
  },

  list: function (cards) {
    return '<div class="sh-list">' + cards.join('') + '</div>';
  },

  empty: function (msg) {
    return '<div class="sh-empty">' + msg + '</div>';
  },

  card: function (o) {
    var ico = o.img
      ? this.imgOrEmoji(o.img, o.icon || '📦', 'width:46px;height:46px;object-fit:contain')
      : (o.icon || '📦');
    var stats = (o.stats || []).map(function (s) {
      return '<span class="sh-stat"><i>' + s[0] + '</i> ' + s[1] + '</span>';
    }).join('');
    return '<div class="sh-card' + (o.locked ? ' is-locked' : '') + '">' +
      '<div class="sh-ico">' + ico + '</div>' +
      '<div class="sh-body-card">' +
        '<div class="sh-title">' + o.title + (o.tag ? '<span class="sh-tag">' + o.tag + '</span>' : '') + '</div>' +
        (o.desc ? '<div class="sh-desc">' + o.desc + '</div>' : '') +
        (stats ? '<div class="sh-stats">' + stats + '</div>' : '') +
      '</div>' +
      '<div class="sh-act">' + this.btn(o.btn) + '</div>' +
    '</div>';
  },

  btn: function (b) {
    if (!b) return '';
    var attrs = (b.act ? ' data-shop="' + b.act + '"' : '') +
      (b.id != null ? ' data-id="' + b.id + '"' : '') +
      (b.tab ? ' data-tab="' + b.tab + '"' : '');
    return '<button class="sh-btn sh-' + (b.tone || 'gold') + '"' + attrs + (b.disabled ? ' disabled' : '') + '>' + b.label + '</button>';
  },

  price: function (cur, amt) {
    return { cur: cur, amt: amt, txt: (cur === 'gems' ? '💎 ' : '💰 ') + Number(amt).toLocaleString() };
  },

  can: function (pr) {
    return (this.ctx.state[pr.cur] || 0) >= pr.amt;
  },

  need: function (pr) {
    if (this.can(pr)) return true;
    this.toast(pr.cur === 'gems' ? '💎 الجواهر غير كافية' : '💰 الذهب غير كافٍ');
    return false;
  },

  pay: function (pr) {
    this.ctx.state[pr.cur] -= pr.amt;
  },

  refresh: function () {
    this.ctx.save();
    this.render();
    if (typeof render === 'function') render();
  },

  findIn: function (arr, id) {
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  },

  /* ═══════════════ الحماية ═══════════════ */
  renderProtection: function () {
    var self = this;
    return this.list(this.PROTECTION.map(function (it) {
      var pr = self.price(it.currency, it.price);
      return self.card({
        icon: it.emoji, title: it.name, desc: it.desc,
        btn: { label: pr.txt, act: 'pro', id: it.id, tone: 'blue', disabled: !self.can(pr) }
      });
    }));
  },

  buyProtection: function (id) {
    var it = this.findIn(this.PROTECTION, id);
    if (!it) return;
    var pr = this.price(it.currency, it.price);
    if (!this.need(pr)) return;
    this.pay(pr);
    var st = this.ctx.state;
    st[it.store][it.id] = (st[it.store][it.id] || 0) + 1;
    this.toast('✅ اشتريت ' + it.name);
    if (typeof beep === 'function') beep(780, 0.1);
    this.refresh();
  },

  /* ═══════════════ الأسلحة والطواقم ═══════════════ */
  renderWS: function (kind) {
    var self = this;
    var ws = ModuleRegistry.get('weapons_shop');
    if (!ws || typeof ws.list !== 'function') return this.empty('موديول الأسلحة غير محمّل');

    var st = this.ctx.state;
    var bought = st.weaponsBoughtToday || 0;
    var capped = kind === 'weapons' && bought >= ws.DAILY_LIMIT;
    var head = kind === 'weapons'
      ? '<div class="sh-info">📅 اشتريت اليوم: ' + bought + ' / ' + ws.DAILY_LIMIT + '</div>'
      : '';

    var cards = ws.list(kind).map(function (it) {
      var pr = it.coins > 0 ? self.price('coins', it.coins) : self.price('gems', it.gems);
      var ownedCrew = kind === 'crews' && it.owned;
      var btn = ownedCrew
        ? { label: '✓ مملوك', tone: 'ghost', disabled: true }
        : { label: pr.txt, act: 'wbuy', id: it.id, tab: kind, tone: 'gold', disabled: !it.affordable || capped };
      return self.card({
        icon: it.icon, title: it.name, desc: it.desc,
        stats: (kind === 'weapons' && it.owned) ? [['لديك', it.owned]] : [],
        btn: btn
      });
    });
    return head + this.list(cards);
  },

  buyWeapon: function (tab, id) {
    var ws = ModuleRegistry.get('weapons_shop');
    if (!ws) { this.toast('❌ موديول الأسلحة غير محمّل'); return; }
    var r = ws.buy(tab, id);
    if (!r.ok) {
      var msgs = {
        not_found: '❌ العنصر غير موجود',
        owned: '✓ مملوك مسبقاً',
        daily_limit: '🚫 وصلت الحد اليومي للأسلحة',
        no_coins: '💰 الذهب غير كافٍ',
        no_gems: '💎 الجواهر غير كافية'
      };
      this.toast(msgs[r.error] || ('❌ ' + r.error));
      return;
    }
    this.toast('✅ اشتريت ' + r.item.name);
    if (typeof beep === 'function') beep(780, 0.1);
    this.refresh();
  },

  /* ═══════════════ السفن (حزم) ═══════════════ */
  renderShipPacks: function () {
    var self = this;
    var cards = this.SHIP_PACKS.map(function (p) {
      var isGem = p.packType === 'gems';
      var pr = isGem ? self.price('gems', p.price) : null;
      return self.card({
        img: p.img, icon: p.emoji, title: p.name, tag: p.tag, desc: p.desc,
        stats: p.count > 1 ? [['عدد', p.count + ' سفن']] : [],
        btn: isGem
          ? { label: pr.txt, act: 'pack', id: p.id, tone: 'purple', disabled: !self.can(pr) }
          : { label: '$' + p.priceUSD, tone: 'ghost', disabled: true }
      });
    });
    return this.list(cards) + '<div class="sh-info">⛵ تبي سفن عادية؟ افتح <b>سوق السفن</b> من الخريطة</div>';
  },

  buyPack: function (id) {
    var p = this.findIn(this.SHIP_PACKS, id);
    if (!p) return;
    if (p.packType !== 'gems') { this.toast('💳 الشراء بالفلوس الحقيقية معطّل'); return; }
    if (typeof window.rpcShips !== 'function' || !window.shipsUtils) { this.toast('❌ نظام السفن غير متاح'); return; }

    var U = window.shipsUtils;
    var free = Math.max(0, 3 - U.fleetCount()) + Math.max(0, U.storageCapacity() - U.storageCount());
    if (free < p.count) { this.toast('🚫 ما فيه مكان كافٍ للحزمة (' + p.count + ' سفن)'); return; }

    var pr = this.price('gems', p.price);
    if (!this.need(pr)) return;

    var bought = 0, lastErr = null;
    for (var k = 0; k < p.count; k++) {
      var res = window.rpcShips('buy_ship_by_code', { _code: p.shipCode, _template_id: 0, _price_coins: 0, _max_hp: 0 });
      if (res.error) { lastErr = res.error.message; break; }
      bought++;
    }
    if (bought === 0) { this.toast('❌ ' + (lastErr || 'فشل الشراء')); return; }

    this.pay(this.price('gems', Math.round(p.price * bought / p.count)));
    this.toast(bought === p.count ? '✅ اشتريت ' + p.name : '⚠️ اشتريت ' + bought + ' من ' + p.count);
    if (typeof beep === 'function') beep(880, 0.15);
    this.refresh();
  },

  /* ═══════════════ الاستئجار ═══════════════ */
  kv: function (k, v) {
    return '<div class="sh-kv-item"><span>' + k + '</span><b>' +
      (typeof v === 'number' ? v.toLocaleString() : v) + '</b></div>';
  },

  renderRental: function () {
    var st = this.ctx.state;
    var def = window.SHIP_BY_CODE && window.SHIP_BY_CODE.submarine;
    if (!def || !window.shipsUtils) return this.empty('الغواصة غير متوفرة');

    var U = window.shipsUtils;
    var myRental = null;
    for (var i = 0; i < (st.ships || []).length; i++) {
      if (st.ships[i].isRental && st.ships[i].code === 'submarine') { myRental = st.ships[i]; break; }
    }
    var fleet = U.fleetCount(), stor = U.storageCount(), cap = U.storageCapacity();
    var hasRoom = fleet < 3 || stor < cap;

    var status;
    if (myRental) {
      var remain = Math.max(0, myRental.expiresAt - Date.now());
      status = '<div class="sh-ok">✓ استئجارك نشط · متبقي ' + Math.floor(remain / 3600000) + 'س ' +
        Math.floor((remain % 3600000) / 60000) + 'د</div>' +
        '<div class="sh-note">لإلغاء الاستئجار، بِع الغواصة من المخزن</div>';
    } else if (!hasRoom) {
      status = '<div class="sh-warn">🚫 الأسطول والمخزن ممتلئان · الأسطول ' + fleet + '/3 · المخزن ' + stor + '/' + cap + '</div>';
    } else {
      status = '<button class="sh-btn sh-purple sh-wide" data-shop="rent">🛸 استئجار الآن — مجاناً</button>';
    }

    return '<div class="sh-hero">' +
      '<div class="sh-hero-top"><span class="sh-kicker">EXCLUSIVE RENTAL</span><span class="sh-tag">خرافي</span></div>' +
      '<div class="sh-hero-title">🛸 استئجار غواصة VIP</div>' +
      '<div class="sh-hero-img">' + this.imgOrEmoji(def.img, '🛸', 'max-height:140px;max-width:88%;object-fit:contain') + '</div>' +
      '<div class="sh-desc sh-center">' + (def.desc || '') + '</div>' +
      '<div class="sh-kv">' +
        this.kv('HP', def.hp) + this.kv('التخزين', def.storage) +
        this.kv('السرعة', def.speed) + this.kv('الصيد', def.tripSec + 'ث') +
      '</div>' +
      '<div class="sh-note">⏱ مدة الاستئجار 24 ساعة · تُحذف تلقائياً بعد انتهائها</div>' +
      status +
    '</div>';
  },

  rentSubmarine: function () {
    var self = this;
    var st = this.ctx.state;
    if (typeof window.rpcShips !== 'function' || !window.shipsUtils) { this.toast('❌ نظام السفن غير متاح'); return; }

    var U = window.shipsUtils;
    if (U.fleetCount() >= 3 && U.storageCount() >= U.storageCapacity()) {
      this.toast('🚫 الأسطول والمخزن ممتلئان — بِع سفينة أولاً');
      return;
    }
    var rentalCount = 0;
    for (var i = 0; i < (st.ships || []).length; i++) {
      if (st.ships[i].isRental && st.ships[i].code === 'submarine') rentalCount++;
    }
    if (rentalCount >= 3) { this.toast('🛸 عندك 3 استئجارات نشطة (الحد الأقصى)'); return; }

    this.ctx.ui.confirm('استئجار الغواصة VIP لمدة 24 ساعة؟ مجاناً — بعد انتهاء المدة تُحذف تلقائياً.', function () {
      var res = window.rpcShips('rent_ship_by_code', { _code: 'submarine', _hours: 24 });
      if (res.error) {
        var em = res.error.message;
        if (em === 'max_rentals') self.toast('🛸 عندك 3 استئجارات نشطة');
        else if (em === 'all_full') self.toast('🚫 الأسطول والمخزن ممتلئان');
        else self.toast('❌ ' + em);
        return;
      }
      self.toast('🛸 تم استئجار الغواصة 24 ساعة!');
      if (typeof beep === 'function') beep(1000, 0.15);
      self.refresh();
    });
  },

  /* ═══════════════ الإطارات ═══════════════ */
  renderFrames: function () {
    var self = this;
    var st = this.ctx.state;
    var lv = typeof levelOf === 'function' ? levelOf(st.xp || 0) : 1;
    var eq = st.equipped.frame || '';

    return this.list(this.FRAMES.map(function (f) {
      var owned = !!st.frames[f.id];
      var equipped = eq === f.id;
      var lvlLock = !owned && lv < f.req_level;
      var btn;
      if (owned) {
        btn = equipped
          ? { label: 'مُركّب ✓', tone: 'ghost', disabled: true }
          : { label: 'تركيب', act: 'frequip', id: f.id, tone: 'green' };
      } else if (lvlLock) {
        btn = { label: '🔒 مستوى ' + f.req_level, tone: 'ghost', disabled: true };
      } else {
        var pr = f.price_coins ? self.price('coins', f.price_coins) : self.price('gems', f.price_gems);
        btn = { label: pr.txt, act: 'frbuy', id: f.id, tone: 'gold', disabled: !self.can(pr) };
      }
      return self.card({
        icon: f.icon, title: f.name, desc: f.desc, locked: lvlLock,
        stats: [['مستوى', f.req_level]], btn: btn
      });
    }));
  },

  buyFrame: function (id) {
    var f = this.findIn(this.FRAMES, id);
    if (!f) return;
    var st = this.ctx.state;
    if (st.frames[f.id]) return;
    var lv = typeof levelOf === 'function' ? levelOf(st.xp || 0) : 1;
    if (lv < f.req_level) { this.toast('🔒 تحتاج المستوى ' + f.req_level); return; }
    var pr = f.price_coins ? this.price('coins', f.price_coins) : this.price('gems', f.price_gems);
    if (!this.need(pr)) return;
    this.pay(pr);
    st.frames[f.id] = true;
    this.toast('✅ اشتريت ' + f.name);
    this.refresh();
  },

  equipFrame: function (id) {
    var st = this.ctx.state;
    if (!st.frames[id]) return;
    st.equipped.frame = id;
    this.toast('🖼️ تم تركيب الإطار');
    this.refresh();
  },

  /* ═══════════════ الخلفيات ═══════════════ */
  renderBackgrounds: function () {
    if (typeof BACKGROUNDS === 'undefined' || !BACKGROUNDS.length) return this.empty('لا توجد خلفيات');
    var self = this;
    var st = this.ctx.state;

    return this.list(BACKGROUNDS.map(function (b) {
      var owned = st.owned.indexOf(b.id) >= 0;
      var eq = st.equipped && st.equipped.backgrounds === b.id;
      var btn;
      if (owned) {
        btn = eq
          ? { label: 'مُركّب ✓', tone: 'ghost', disabled: true }
          : { label: 'تركيب', act: 'bgequip', id: b.id, tone: 'green' };
      } else {
        var pr = self.price('coins', b.price_coins || 0);
        btn = { label: pr.txt, act: 'bgbuy', id: b.id, tone: 'gold', disabled: !self.can(pr) };
      }
      return self.card({ icon: '🏞', title: b.name, desc: 'خلفية مخصصة للملف الشخصي', btn: btn });
    }));
  },

  buyBg: function (id) {
    var st = this.ctx.state;
    if (st.owned.indexOf(id) >= 0) return;
    var bg = this.findIn(BACKGROUNDS, id);
    if (!bg) return;
    var pr = this.price('coins', bg.price_coins || 0);
    if (!this.need(pr)) return;
    this.pay(pr);
    st.owned.push(id);
    this.toast('✅ اشتريت ' + bg.name);
    this.refresh();
  },

  equipBg: function (id) {
    var st = this.ctx.state;
    if (st.owned.indexOf(id) < 0) return;
    if (typeof currentTripState !== 'undefined' && currentTripState !== TS.IDLE) {
      this.toast('⚠️ لا يمكن التغيير أثناء الرحلة');
      return;
    }
    st.equipped.backgrounds = id;
    this.ctx.save();
    if (typeof applyEquipped === 'function') applyEquipped();
    this.toast('🎨 تم تركيب الخلفية');
    this.render();
  },

  toast: function (m) {
    if (typeof showMessage === 'function') showMessage(m);
    else console.log(m);
  }
});
