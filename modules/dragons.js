// modules/dragons.js — التنين (v4.0.0)
// 3 تبويبات: 🐉 التنين | ⚔️ العتاد | ⚒️ الفورج
ModuleRegistry.register({
  id: 'dragons',
  name: 'التنين',
  version: '4.0.0',
  dependencies: ['boss', 'dragon_equipment'],

  MAX_LEVEL: 150,
  MAX_STAGE: 15,

  STAGES: [
    { stage: 1,  name: 'بيضة',              emoji: '🥚', img: 'assets/dragons/dragon-stage-1.webp', img: 'assets/dragons/dragon-egg-v2.png', dpRequired: 0 },
    { stage: 2,  name: 'فقس',               emoji: '🐣', img: 'assets/dragons/dragon-stage-2.webp', img: 'assets/dragons/dragon-stage-2.webp', dpRequired: 50000 },
    { stage: 3,  name: 'تنين صغير',         emoji: '🐲', img: 'assets/dragons/dragon-stage-3.webp', img: 'assets/dragons/dragon-stage-3.webp', dpRequired: 150000 },
    { stage: 4,  name: 'ناشئ',              emoji: '🐲', img: 'assets/dragons/dragon-stage-4.webp', img: 'assets/dragons/dragon-stage-4.webp', dpRequired: 350000 },
    { stage: 5,  name: 'محارب',             emoji: '🐉', img: 'assets/dragons/dragon-stage-5.webp', img: 'assets/dragons/dragon-stage-5.webp', dpRequired: 650000 },
    { stage: 6,  name: 'نخبة',              emoji: '🐉', img: 'assets/dragons/dragon-stage-6.webp', img: 'assets/dragons/dragon-stage-6.webp', dpRequired: 1000000 },
    { stage: 7,  name: 'ملكي',              emoji: '🐉', img: 'assets/dragons/dragon-stage-7.webp', img: 'assets/dragons/dragon-stage-7.webp', dpRequired: 1400000 },
    { stage: 8,  name: 'أسطوري',            emoji: '🐲', img: 'assets/dragons/dragon-stage-8.webp', img: 'assets/dragons/dragon-stage-8.webp', dpRequired: 1900000 },
    { stage: 9,  name: 'كوني',              emoji: '🐲', img: 'assets/dragons/dragon-stage-9.webp', img: 'assets/dragons/dragon-stage-9.webp', dpRequired: 2600000 },
    { stage: 10, name: 'خرافي',             emoji: '🐉', img: 'assets/dragons/dragon-stage-10.webp', img: 'assets/dragons/dragon-stage-10.webp', dpRequired: 3600000 },
    { stage: 11, name: 'تنين النار الذهبي', emoji: '🔥', img: 'assets/dragons/dragon-stage-11.webp', img: 'assets/dragons/dragon-stage-11.webp', dpRequired: 5100000 },
    { stage: 12, name: 'ملك التنانين',      emoji: '👑', img: 'assets/dragons/dragon-stage-12.webp', img: 'assets/dragons/dragon-stage-12.webp', dpRequired: 7600000 },
    { stage: 13, name: 'تنين الروح',        emoji: '💠', img: 'assets/dragons/dragon-stage-13.webp', img: 'assets/dragons/dragon-stage-13.webp', dpRequired: 11600000 },
    { stage: 14, name: 'تنين الكون',        emoji: '🌌', img: 'assets/dragons/dragon-stage-14.webp', img: 'assets/dragons/dragon-stage-14.webp', dpRequired: 18600000 },
    { stage: 15, name: 'سيد التنانين',      emoji: '🐲👑', img: 'assets/dragons/dragon-stage-15.webp', img: 'assets/dragons/dragon-stage-15.webp', dpRequired: 30600000 }
  ],

  ELEMENTS: {
    fire:  { name: 'نار',  emoji: '🔥', color: '#FF6B4A' },
    water: { name: 'ماء',  emoji: '💧', color: '#4FC3F7' },
    light: { name: 'رعد',  emoji: '⚡', color: '#BA68C8' },
    dark:  { name: 'ظل',   emoji: '🌑', color: '#7986CB' }
  },

  PEARL_COSTS: [
    50, 100, 200, 350, 550, 800, 1200, 1700, 2400, 3200,
    4200, 5500, 7200, 9500, 12500, 16500, 22000, 30000,
    40000, 52000, 68000, 90000, 120000, 160000, 210000,
    280000, 380000, 500000, 660000, 880000, 1200000
  ],

  ctx: null,
  _screen: null,
  _tab: 'dragon',

  init: function (ctx) {
    this.ctx = ctx;
    var st = ctx.state;
    if (!st.dragon) {
      st.dragon = {
        born: false, hasEgg: false, stage: 1, level: 1,
        dp: 0, pearls: 0, element: 'fire', name: 'تنيني',
        bornAt: 0, totalBossDamage: 0, pvpWins: 0, pvpLosses: 0
      };
    }
    this.buildScreen();
  },

  buildScreen: function () {
    var self = this;
    var sec = document.createElement('section');
    sec.className = 'screen';
    sec.id = 'screen-dragon';
    sec.innerHTML =
      '<div class="sh"><span class="st">🐉 تنيني</span>' +
      '<button class="close-btn" data-close>✕</button></div>' +
      '<div class="tabs" id="dgTabs">' +
        '<button class="tab active" data-dg-tab="dragon">🐉 التنين</button>' +
        '<button class="tab" data-dg-tab="equip">⚔️ العتاد</button>' +
        '<button class="tab" data-dg-tab="forge">⚒️ الفورج</button>' +
      '</div>' +
      '<div class="sb" id="dragonBody"></div>';
    document.getElementById('app').appendChild(sec);
    this._screen = sec;

    sec.querySelector('[data-close]').onclick = function () { self.ctx.ui.closeScreen(); };

    document.getElementById('dgTabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-dg-tab]');
      if (!b) return;
      self._tab = b.getAttribute('data-dg-tab');
      self.render();
    });

    sec.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]');
      if (!t) return;
      var a = t.getAttribute('data-act');
      if (a === 'buy_egg') self.buyEgg();
      else if (a === 'hatch') self.hatch();
      else if (a === 'upgrade') self.upgradePearl();
      else if (a === 'rename') self.rename();
      else if (a === 'claim_rockets') self.claimRockets();
      else if (a === 'open_boss') ModuleRegistry.get('boss').open();
      else if (a === 'open_forge') {
        var fg = ModuleRegistry.get('dragon_forge');
        if (fg && typeof fg.open === 'function') fg.open();
      }
    });
  },

  open: function () {
    this._tab = 'dragon';
    this.ctx.ui.showScreen('dragon');
    this.render();
  },

  stageInfo: function () {
    var s = this.ctx.state.dragon.stage;
    return this.STAGES[Math.min(s - 1, this.STAGES.length - 1)] || this.STAGES[0];
  },

  nextStageInfo: function () {
    return this.STAGES[this.ctx.state.dragon.stage] || null;
  },

  crewBonusHours: function () {
    return Math.floor(this.ctx.state.dragon.level / 10) * 3;
  },

  totalCrewHours: function () {
    return 24 + this.crewBonusHours();
  },

  pearlCostForLevel: function (level) {
    if (level >= this.MAX_LEVEL) return 0;
    return this.PEARL_COSTS[Math.min(level - 1, this.PEARL_COSTS.length - 1)];
  },

  damageRequiredForUpgrade: function () {
    return 500000 + (this.ctx.state.dragon.level - 1) * 400000;
  },

  canUpgrade: function () {
    var d = this.ctx.state.dragon;
    if (d.level >= this.MAX_LEVEL) return false;
    return d.dp >= this.damageRequiredForUpgrade() && d.pearls >= this.pearlCostForLevel(d.level);
  },

  render: function () {
    var body = document.getElementById('dragonBody');
    if (!body) return;

    var sec = document.getElementById('screen-dragon');
    if (sec) {
      sec.querySelectorAll('#dgTabs .tab').forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-dg-tab') === this._tab);
      }.bind(this));
    }

    if (this._tab === 'equip')  { body.innerHTML = this._renderEquip(); return; }
    if (this._tab === 'forge')  { body.innerHTML = this._renderForge(); return; }

    var d = this.ctx.state.dragon;
    if (!d.hasEgg && !d.born)       body.innerHTML = this.renderWelcome();
    else if (d.hasEgg && !d.born)   body.innerHTML = this.renderEgg();
    else                             body.innerHTML = this.renderDragon();
  },

  renderWelcome: function () {
    return '<div style="text-align:center;padding:40px 16px">' +
      '<div style="width:180px;height:180px;margin:0 auto;display:flex;align-items:center;justify-content:center"><img src="assets/dragons/dragon-egg-v2.png" style="max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 0 30px rgba(255,215,106,.6))"></div>' +
      '<div style="font-size:22px;font-weight:900;color:#FFD76A;margin:20px 0 8px">لم تنبت بيضتك بعد</div>' +
      '<div class="muted" style="margin-bottom:24px;line-height:1.7">' +
      'اقضِ على الوحش لتجمع <b>نقاط التنين</b>، واجمع <b>اللؤلؤ</b>، ثم اضغط الزر لتنمو بيضتك' +
      '</div>' +
      '<button class="btn gold wide" data-act="buy_egg">🐣 ابدأ رحلة التنين</button></div>';
  },

  renderEgg: function () {
    var d = this.ctx.state.dragon;
    var needed = this.STAGES[1].dpRequired;
    var pct = Math.min(100, (d.dp / needed) * 100);
    return '<div style="text-align:center;padding:30px 16px">' +
      '<div style="width:180px;height:180px;margin:0 auto;display:flex;align-items:center;justify-content:center"><img src="assets/dragons/dragon-egg-v2.png" style="max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 0 30px rgba(255,215,106,.6))"></div>' +
      '<div style="font-size:22px;font-weight:900;color:#FFD76A;margin:20px 0 8px">البيضة تنمو</div>' +
      '<div class="muted" style="margin-bottom:18px">اقضِ على الوحش لتجمع DP</div>' +
      '<div class="hero"><div style="display:flex;justify-content:space-between;font-weight:800;font-size:12px;margin-bottom:6px">' +
      '<span>⚔️ نقاط التنين</span><span>' + d.dp.toLocaleString() + ' / ' + needed.toLocaleString() + '</span></div>' +
      '<div style="height:12px;border-radius:6px;background:rgba(0,0,0,.5);overflow:hidden">' +
      '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#FFB300,#FFD76A)"></div></div></div>' +
      '<button class="btn gold wide" data-act="open_boss" style="margin-top:14px">🐲 اذهب للوحش</button>' +
      (d.dp >= needed ? '<button class="btn gold wide" data-act="hatch" style="margin-top:10px">🐣 افتح البيضة</button>' : '') +
      '</div>';
  },

  renderDragon: function () {
    var d = this.ctx.state.dragon;
    var s = this.stageInfo();
    var next = this.nextStageInfo();
    var el = this.ELEMENTS[d.element] || this.ELEMENTS.fire;

    var dpInStage = d.dp - s.dpRequired;
    var dpNeeded = next ? (next.dpRequired - s.dpRequired) : 1;
    var stagePct = next ? Math.min(100, (dpInStage / dpNeeded) * 100) : 100;

    var damageNeeded = this.damageRequiredForUpgrade();
    var damageMissing = Math.max(0, damageNeeded - d.dp);
    var damageOk = damageMissing === 0;

    var pearlCost = this.pearlCostForLevel(d.level);
    var pearlMissing = Math.max(0, pearlCost - d.pearls);
    var pearlOk = pearlMissing === 0;

    var canUpgrade = damageOk && pearlOk;
    var maxLevel = d.level >= this.MAX_LEVEL;

    var h = '';

    // Hero — التنين
    h += '<div class="hero" style="text-align:center;padding:20px 14px">' +
         '<div class="muted">' + el.emoji + ' ' + el.name + '</div>' +
         '<span style=\"display:block;position:relative;width:120px;height:120px;margin:0 auto\">' + (s.img ? '<img decoding=\"async\" src=\"' + s.img + '\" draggable=\"false\" style=\"width:100%;height:100%;object-fit:contain;pointer-events:none;filter:drop-shadow(0 0 20px ' + el.color + '80)\">' : '<span style=\"font-size:80px\">' + s.emoji + '</span>') + '</span>' +
         '<div style="font-size:20px;font-weight:900;color:#FFD76A">' + this._esc(d.name) + '</div>' +
         '<div class="muted" style="margin-top:4px">' + s.name + ' · الشكل ' + d.stage + ' / ' + this.MAX_STAGE + '</div>' +
         '<div style="margin-top:6px;font-size:14px;font-weight:800;color:#FFE9A8">⭐ مستوى ' + d.level + ' / ' + this.MAX_LEVEL + '</div>' +
         '</div>';

    // شريط DP للمرحلة
    if (next) {
      h += '<div class="hero">' +
           '<div style="display:flex;justify-content:space-between;font-weight:800;font-size:12px;margin-bottom:6px">' +
           '<span>⚔️ نقاط التنين</span><span>' + d.dp.toLocaleString() + ' / ' + next.dpRequired.toLocaleString() + '</span></div>' +
           '<div style="height:10px;border-radius:5px;background:rgba(0,0,0,.5);overflow:hidden">' +
           '<div style="height:100%;width:' + stagePct + '%;background:linear-gradient(90deg,#FFB300,#FF6B4A)"></div></div>' +
           '<div class="muted" style="margin-top:6px;text-align:center">' +
           'للمرحلة التالية: ' + next.name + ' — يحتاج ' + (next.dpRequired - d.dp).toLocaleString() + ' DP</div></div>';
    }

    // إحصائيات
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">' +
         '<div class="hero" style="margin:0;padding:12px"><div class="muted">💥 إجمالي الضرر</div>' +
         '<div style="font-size:18px;font-weight:900;color:#FFD76A">' + (d.totalBossDamage || 0).toLocaleString() + '</div></div>' +
         '<div class="hero" style="margin:0;padding:12px"><div class="muted">🦪 اللؤلؤ</div>' +
         '<div style="font-size:18px;font-weight:900;color:#4FC3F7">' + d.pearls.toLocaleString() + '</div></div>' +
         '</div>';

    // لوحة الترقية
    h += '<div class="hero">' +
         '<div style="font-weight:900;color:#FFD76A;margin-bottom:8px">🦪 الترقية إلى المستوى ' + (d.level + 1) + '</div>' +
         '<div style="font-size:12px;line-height:1.9;color:rgba(255,255,255,.85)">' +
         '<div>⚔️ الضرر المطلوب: ' + damageNeeded.toLocaleString() + '</div>' +
         '<div>📊 ضررك الحالي: ' + d.dp.toLocaleString() + '</div>' +
         '<div style="color:' + (damageOk ? '#4CAF50' : '#EF5350') + ';font-weight:800">' +
         (damageOk ? '✅ تم تحقيق شرط الضرر' : '❌ تحتاج ' + damageMissing.toLocaleString() + ' ضرر إضافي') + '</div>' +
         '<div style="margin-top:6px">🦪 اللؤلؤ المطلوب: ' + pearlCost.toLocaleString() + '</div>' +
         '<div>🦪 لؤلؤك: ' + d.pearls.toLocaleString() + '</div>' +
         '<div style="color:' + (pearlOk ? '#4CAF50' : '#EF5350') + ';font-weight:800">' +
         (pearlOk ? '✅ تم تحقيق شرط اللؤلؤ' : '❌ تحتاج ' + pearlMissing.toLocaleString() + ' لؤلؤ إضافي') + '</div>' +
         '</div>' +
         '<button class="btn gold wide" data-act="upgrade" ' + (canUpgrade && !maxLevel ? '' : 'disabled') + ' style="margin-top:12px">' +
         (maxLevel ? '🏆 المستوى الأقصى' : (canUpgrade ? '⬆️ ترقية الآن' : '🔒 لم تكتمل الشروط')) +
         '</button></div>';

    // مميزات
    h += '<div class="hero">' +
         '<div style="font-weight:900;color:#FFD76A;margin-bottom:8px">🐉 مميزات التنين</div>' +
         '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
         '<div style="background:rgba(0,188,212,.1);border:1px solid rgba(0,188,212,.4);border-radius:12px;padding:10px;text-align:center">' +
         '<div class="muted" style="font-size:10px">⏱ مكافأة الطاقم</div>' +
         '<div style="font-size:20px;font-weight:900;color:#4DD0E1">+' + this.crewBonusHours() + ' ساعة</div>' +
         '<div class="muted" style="font-size:10px;margin-top:2px">كل 10 مستويات = +3 ساعات</div></div>' +
         '<div style="background:rgba(255,215,106,.1);border:1px solid rgba(255,215,106,.4);border-radius:12px;padding:10px;text-align:center">' +
         '<div class="muted" style="font-size:10px">🧑‍✈️ المدة الكاملة</div>' +
         '<div style="font-size:20px;font-weight:900;color:#FFD76A">' + this.totalCrewHours() + ' ساعة</div>' +
         '<div class="muted" style="font-size:10px;margin-top:2px">24 + ' + this.crewBonusHours() + '</div></div>' +
         '</div></div>';

    // أزرار سريعة
    h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px">' +
         '<button class="btn" data-act="open_boss" style="flex-direction:column;padding:14px 6px">' +
         '<span style="font-size:22px">🐲</span><span style="font-size:11px;margin-top:4px">الوحش</span></button>' +
         '<button class="btn" data-act="rename" style="flex-direction:column;padding:14px 6px">' +
         '<span style="font-size:22px">✏️</span><span style="font-size:11px;margin-top:4px">تسمية</span></button>' +
         '<button class="btn" data-act="claim_rockets" style="flex-direction:column;padding:14px 6px">' +
         '<span style="font-size:22px">🚀</span><span style="font-size:11px;margin-top:4px">صواريخ</span></button>' +
         '</div>';

    return h;
  },

  // ═══════ التبويب 2: العتاد ═══════
  _renderEquip: function () {
    var eq = window.ModuleRegistry && window.ModuleRegistry.get('dragon_equipment');
    if (!eq) return '<div class="hero" style="text-align:center;padding:40px">' +
      '<div class="muted">موديول العتاد غير محمّل</div></div>';

    var items = this.ctx.state.dragonEquip || [];
    var bonus = eq.getTotalBonus ? eq.getTotalBonus() : { attack:0, defense:0, crit:0 };

    var h = '';

    // Hero — إجمالي البونص
    h += '<div class="hero" style="text-align:center">' +
         '<div class="muted">⚔️ إجمالي بونص العتاد</div>' +
         '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px">' +
         '<div><div style="font-size:24px;font-weight:900;color:#FF6B4A">+' + bonus.attack + '%</div>' +
         '<div class="muted" style="font-size:10px">هجوم</div></div>' +
         '<div><div style="font-size:24px;font-weight:900;color:#4FC3F7">+' + bonus.defense + '%</div>' +
         '<div class="muted" style="font-size:10px">دفاع</div></div>' +
         '<div><div style="font-size:24px;font-weight:900;color:#BA68C8">+' + bonus.crit + '%</div>' +
         '<div class="muted" style="font-size:10px">قاضية</div></div>' +
         '</div></div>';

    // زر الفورج
    h += '<button class="btn gold wide" data-act="open_forge" style="margin-bottom:14px">⚒️ افتح الفورج</button>';

    // القطع المجهزة
    var equipped = items.filter(function (it) { return it.equipped; });

    h += '<div style="font-weight:900;font-size:14px;color:#fef3c7;margin-bottom:10px">القطع المجهزة (' + equipped.length + ' / 3)</div>';

    if (!equipped.length) {
      h += '<div class="hero" style="text-align:center;padding:24px">' +
           '<div class="muted">لا توجد قطع مجهزة — اذهب للفورج</div></div>';
    } else {
      h += '<div style="display:grid;grid-template-columns:1fr;gap:8px">';
      for (var i = 0; i < equipped.length; i++) {
        h += this._equipCard(equipped[i], eq);
      }
      h += '</div>';
    }

    // إحصائية إجمالي القطع
    h += '<div class="hero" style="margin-top:14px;text-align:center;padding:12px">' +
         '<div class="muted">🎒 إجمالي القطع المملوكة</div>' +
         '<div style="font-size:22px;font-weight:900;color:#FFD76A">' + items.length + '</div></div>';

    return h;
  },

  _equipCard: function (it, eq) {
    var rarities = {
      common: { name:'عادي', color:'#e7e5e4', emoji:'⚪' },
      rare: { name:'نادر', color:'#bae6fd', emoji:'🔵' },
      epic: { name:'ملحمي', color:'#e9d5ff', emoji:'🟣' },
      legendary: { name:'أسطوري', color:'#fef3c7', emoji:'🟡' },
      divine: { name:'خرافي', color:'#fecdd3', emoji:'🔴' },
      fatak: { name:'فتّاك', color:'#fee2e2', emoji:'☠️' }
    };
    var r = rarities[it.rarity] || rarities.common;
    var slot = eq.SLOTS[it.slot] || { name: it.slot, emoji: '❔' };

    return '<div style="display:flex;gap:12px;padding:12px;border-radius:14px;' +
      'background:linear-gradient(180deg,rgba(20,35,60,.85),rgba(12,22,42,.9));' +
      'border:1.5px solid ' + r.color + '40;align-items:center">' +
      '<div style="width:48px;height:48px;flex-shrink:0;border-radius:12px;' +
      'background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.1);' +
      'display:flex;align-items:center;justify-content:center;font-size:24px">' +
      (slot.emoji || '⚔️') + '</div>' +
      '<div style="flex:1;min-width:0">' +
      '<div style="font-weight:900;font-size:13px;color:' + r.color + '">' +
      r.emoji + ' ' + r.name + ' · ' + slot.name + '</div>' +
      '<div class="muted" style="font-size:11px;margin-top:2px">' +
      '+' + (eq.getRarity(it.rarity).bonus || 0) + '% ' + slot.statName + '</div></div></div>';
  },

  // ═══════ التبويب 3: الفورج ═══════
  _renderForge: function () {
    return '<div style="text-align:center;padding:30px 16px">' +
      '<div style="font-size:80px;line-height:1;margin-bottom:16px">⚒️</div>' +
      '<div style="font-size:22px;font-weight:900;color:#fbbf24;margin-bottom:10px">فورج التنين</div>' +
      '<div class="muted" style="margin-bottom:24px;line-height:1.7">' +
      'اصهر القطع، رقّيها، واشترِ من المتجر' +
      '</div>' +
      '<button class="btn gold wide" data-act="open_forge">⚒️ افتح الفورج</button></div>';
  },

  _esc: function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  buyEgg: function () {
    var st = this.ctx.state;
    st.dragon.hasEgg = true;
    if (typeof saveState === 'function') saveState();
    this.ctx.ui.toast('🥚 البيضة بدأت تنمو — اقضِ على الوحش لتجمع DP');
    this.render();
  },

  hatch: function () {
    var st = this.ctx.state;
    var d = st.dragon;
    if (d.dp < this.STAGES[1].dpRequired) {
      this.ctx.ui.toast('⛔ تحتاج ' + this.STAGES[1].dpRequired.toLocaleString() + ' DP للفقس');
      return;
    }
    var elems = ['fire', 'water', 'light', 'dark'];
    d.born = true;
    d.hasEgg = false;
    d.stage = 2;
    d.element = elems[Math.floor(Math.random() * elems.length)];
    d.bornAt = Date.now();
    if (typeof saveState === 'function') saveState();
    this.ctx.ui.toast('🐉 فقس التنين! عنصره: ' + (this.ELEMENTS[d.element] || {}).name);
    if (typeof beep === 'function') beep(1200, 0.3);
    this.render();
  },

  upgradePearl: function () {
    var st = this.ctx.state;
    var d = st.dragon;
    if (!this.canUpgrade()) { this.ctx.ui.toast('❌ لم تكتمل الشروط'); return; }
    var cost = this.pearlCostForLevel(d.level);
    d.pearls -= cost;
    d.level += 1;
    if (d.stage < this.MAX_STAGE) {
      var next = this.STAGES[d.stage];
      if (next && d.dp >= next.dpRequired) {
        d.stage += 1;
        if (typeof showMessage === 'function') showMessage('🎉 تطور التنين — ' + this.STAGES[d.stage - 1].name);
        if (typeof beep === 'function') beep(1400, 0.3);
      }
    }
    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
    this.ctx.ui.toast('⬆️ ارتفع للمستوى ' + d.level);
    this.render();
  },

  rename: function () {
    var st = this.ctx.state;
    var n = prompt('اسم التنين:', st.dragon.name);
    if (!n || !n.trim()) return;
    st.dragon.name = n.trim().slice(0, 14);
    if (typeof saveState === 'function') saveState();
    this.render();
  },

  claimRockets: function () {
    var st = this.ctx.state;
    var d = st.dragon;
    if (d.level < 3) { this.ctx.ui.toast('🔒 تحتاج مستوى 3'); return; }
    var today = new Date().toISOString().slice(0, 10);
    if (d.lastRocketsClaim === today) { this.ctx.ui.toast('⏰ استلمت اليوم'); return; }
    var count = 3;
    st.inventory.rocket_small = (st.inventory.rocket_small || 0) + count;
    d.lastRocketsClaim = today;
    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
    this.ctx.ui.toast('🚀 استلمت ' + count + ' صواريخ صغيرة!');
  }
});
