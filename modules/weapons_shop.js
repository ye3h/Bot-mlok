// modules/weapons_shop.js — الأسلحة والطواقم (v2.2.1)
// - الحد اليومي يعتمد على وقت الخادم الموثوق حصراً
// - حماية صارمة ضد التراجع بالساعة والتلاعب بوقت الجهاز
// - الطواقم متاحة دائماً، والأسلحة تتطلب توقيتاً خادماً موثقاً
ModuleRegistry.register({
  id: 'weapons_shop',
  name: 'متجر الأسلحة والطواقم',
  version: '2.2.1',
  dependencies: [],

  WEAPONS: [
    { id: 'rocket_small',  name: 'صاروخ صغير',    emoji: '🚀', desc: 'ضرر 800 للوحش',           coins: 1500,  gems: 0 },
    { id: 'rocket_medium', name: 'صاروخ متوسط',   emoji: '🎯', desc: 'ضرر 4,000 للوحش',         coins: 15000, gems: 0 },
    { id: 'rocket_large',  name: 'صاروخ كبير',    emoji: '💥', desc: 'ضرر 18,000 للوحش',        coins: 90000, gems: 0 },
    { id: 'nuke',          name: 'قنبلة ذرية',    emoji: '☢️', desc: 'ضرر 70,000 للوحش',        coins: 0,     gems: 100 },
    { id: 'ad_bomb',       name: 'قنبلة إعلانية', emoji: '📺', desc: 'تأثير خاص (قريباً)',      coins: 0,     gems: 180 },
    { id: 'kraken_bomb',   name: 'قنبلة الكراكن', emoji: '🐙', desc: 'نهب مخزن السمك (قريباً)', coins: 0,     gems: 10000 }
  ],

  CREWS: [
    { id: 'guide',         name: 'المرشد',         emoji: '🧭', desc: 'طاقم للمخزن', coins: 600000,  gems: 0 },
    { id: 'sailor',        name: 'البحّار',        emoji: '⚓', desc: 'طاقم للمخزن', coins: 600000,  gems: 0 },
    { id: 'fixer_1',       name: 'مُصلح I',        emoji: '🔧', desc: 'طاقم للمخزن', coins: 200000,  gems: 0 },
    { id: 'fixer_2',       name: 'مُصلح II',       emoji: '🔧', desc: 'طاقم للمخزن', coins: 700000,  gems: 0 },
    { id: 'fixer_3',       name: 'مُصلح III',      emoji: '🔧', desc: 'طاقم للمخزن', coins: 3500000, gems: 0 },
    { id: 'fixer_4',       name: 'مُصلح IV',       emoji: '🔧', desc: 'طاقم للمخزن', coins: 0,       gems: 130 },
    { id: 'luck',          name: 'الحظ',           emoji: '🍀', desc: 'طاقم للمخزن', coins: 0,       gems: 30 },
    { id: 'thief',         name: 'السارق',         emoji: '🥷', desc: 'طاقم للمخزن', coins: 0,       gems: 25 },
    { id: 'trader',        name: 'التاجر',         emoji: '💰', desc: 'طاقم للمخزن', coins: 0,       gems: 30 },
    { id: 'police',        name: 'الشرطي',         emoji: '👮', desc: 'طاقم للمخزن', coins: 0,       gems: 25 },
    { id: 'market_expert', name: 'خبير السوق',     emoji: '📈', desc: 'طاقم للمخزن', coins: 0,       gems: 1000 },
    { id: 'golden_fisher', name: 'الصياد الذهبي',  emoji: '🏅', desc: 'طاقم للمخزن', coins: 0,       gems: 1500 }
  ],

  DAILY_LIMIT: 30,

  init: function (ctx) {
    this.ctx = ctx;
    this.ensureState();
  },

  /* ═══════════ إدارة الوقت والتحقق ═══════════ */

  serverNow: function () {
    var dash = window.ModuleRegistry && ModuleRegistry.get('dashboard');
    if (!dash || typeof dash.verified !== 'function' || !dash.verified()) return null;
    return dash.now();
  },

  dayKey: function (d) {
    return d.toISOString().slice(0, 10);
  },

  /* ═══════════ التحقق من الحالة وأمان التوقيت ═══════════ */

  ensureState: function () {
    var st = this.ctx.state;
    if (!st.inventory || typeof st.inventory !== 'object') st.inventory = {};
    if (!st.crews || typeof st.crews !== 'object') st.crews = {};
    if (typeof st.weaponsBoughtToday !== 'number') st.weaponsBoughtToday = 0;
    if (typeof st.weaponsBoughtDate !== 'string') st.weaponsBoughtDate = '';
    if (typeof st.weaponsLastDay !== 'string') st.weaponsLastDay = '';

    var now = this.serverNow();
    if (!now) return false; // الوقت لم يُوثق بعد من الخادم

    var today = this.dayKey(now);

    // حماية صارمة: منع التراجع لو وقت الخادم رجع للوراء مقارنة بآخر يوم مسجل
    if (st.weaponsLastDay && today < st.weaponsLastDay) {
      return false;
    }

    st.weaponsLastDay = today;
    if (st.weaponsBoughtDate !== today) {
      st.weaponsBoughtDate = today;
      st.weaponsBoughtToday = 0;
    }
    return true;
  },

  find: function (tab, id) {
    var list = tab === 'crews' ? this.CREWS : this.WEAPONS;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  },

  /* ═══════════ عرض القائمة (integration مع shop.js) ═══════════ */

  list: function (kind) {
    var st = this.ctx.state;
    var isCrew = kind === 'crews';
    var timeOk = isCrew ? true : this.ensureState();

    return (isCrew ? this.CREWS : this.WEAPONS).map(function (it) {
      var owned = isCrew ? !!st.crews[it.id] : (st.inventory[it.id] || 0);
      var fundsOk = (st.coins || 0) >= (it.coins || 0) && (st.gems || 0) >= (it.gems || 0);
      return {
        id: it.id,
        name: it.name,
        icon: it.emoji,
        desc: it.desc,
        coins: it.coins || 0,
        gems: it.gems || 0,
        owned: owned,
        affordable: fundsOk && timeOk
      };
    });
  },

  /* ═══════════ تنفيذ الشراء ═══════════ */

  buy: function (tab, id) {
    var it = this.find(tab, id);
    if (!it) return { ok: false, error: 'not_found' };

    var st = this.ctx.state;
    var isCrew = tab === 'crews';

    if (isCrew) {
      if (st.crews[it.id]) return { ok: false, error: 'owned' };
    } else {
      // التحقق من أن وقت الخادم موثوق قبل السماح بشراء الأسلحة
      if (!this.ensureState()) return { ok: false, error: 'time_unverified' };
      if (st.weaponsBoughtToday >= this.DAILY_LIMIT) return { ok: false, error: 'daily_limit' };
    }

    var needCoins = it.coins || 0;
    var needGems = it.gems || 0;

    if (needCoins > 0 && (st.coins || 0) < needCoins) return { ok: false, error: 'no_coins' };
    if (needGems > 0 && (st.gems || 0) < needGems) return { ok: false, error: 'no_gems' };

    // خصم الموارد بعد اجتياز كافة اختبارات الأمان والحدود
    if (needCoins > 0) st.coins -= needCoins;
    if (needGems > 0) st.gems -= needGems;

    if (isCrew) {
      st.crews[it.id] = 1;
    } else {
      st.inventory[it.id] = (st.inventory[it.id] || 0) + 1;
      st.weaponsBoughtToday += 1;
    }

    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
    return { ok: true, item: it };
  }
});
