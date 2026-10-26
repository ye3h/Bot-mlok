/* modules/tribe.js — القبيلة (v2.1.0) - محسّن وبتصميم فخم */
ModuleRegistry.register({
  id: 'tribe',
  name: 'القبيلة',
  version: '2.1.0',
  dependencies: [],

  MAX_MEMBERS: 30,
  JOIN_LEVEL: 1,

  TABS: [
    { id: 'members',  label: 'الأعضاء', emoji: '👥' },
    { id: 'chat',     label: 'الدردشة', emoji: '💬' },
    { id: 'treasury', label: 'الخزنة',  emoji: '💰' },
    { id: 'develop',  label: 'التطوير', emoji: '🏰' },
    { id: 'shop',     label: 'سوق السفن', emoji: '🛒' },
    { id: 'quests',   label: 'مهام',   emoji: '🎯' },
    { id: 'log',      label: 'السجل',  emoji: '📜' }
  ],

  TRIBE_SHIPS: [
    { code: 'tribe-lightning', name: '⚡ سفينة البرق', cost: 60,  emoji: '⚡', desc: 'الأسرع في الصيد (18 ثانية)' },
    { code: 'tribe-tornado',   name: '🌀 سفينة الإعصار', cost: 90,  emoji: '🌀', desc: 'دروع ثقيلة لا تُخترق (Armor 200)' },
    { code: 'tribe-fire',      name: '🔥 سفينة النار', cost: 150, emoji: '🔥', desc: 'أقوى هجوم ضد الوحوش (Attack 320)' }
  ],

  QUESTS: [
    { id: 'donate_1k',    icon: '💰', title: 'تبرّع صغير',     desc: 'تبرّع 1,000 للخزنة',   target: 1000,   reward: { coins: 2000 } },
    { id: 'donate_10k',   icon: '💎', title: 'تبرّع كبير',     desc: 'تبرّع 10,000 للخزنة',  target: 10000,  reward: { gems: 5 } },
    { id: 'catch_20',     icon: '🐟', title: 'صياد القبيلة',   desc: 'اصطد 20 سمكة',        target: 20,     reward: { coins: 1500 } },
    { id: 'trips_3',      icon: '⚓', title: 'إبحار',          desc: 'أكمل 3 رحلات',        target: 3,      reward: { gems: 3 } },
    { id: 'boss_5',       icon: '💀', title: 'ضربة للوحش',    desc: 'اضرب الوحش 5 مرات',   target: 5,      reward: { coins: 3000 } }
  ],

  TRIBE_BOTS: [
    { id: 'tribe_pirates', name: 'قراصنة الأعماق', emoji: '🏴‍☠️', img: 'assets/tribes/tribe-emblem-1.png', level: 5, motto: 'لا نهاب شيئاً', color: '#dc2626', bio: 'قبيلة القراصنة الأقدم في المملكة.' },
    { id: 'tribe_kraken',  name: 'حماة الكراكن', emoji: '🦑', img: 'assets/tribes/tribe-emblem-2.png', level: 8, motto: 'أسياد الأعماق', color: '#7c3aed', bio: 'نصطاد الكراكن فقط. مجموعة نخبة.' },
    { id: 'tribe_moon',    name: 'حلف القمر', emoji: '🌙', img: 'assets/tribes/tribe-emblem-3.png', level: 6, motto: 'نحرس البحار ليلاً', color: '#0284c7', bio: 'قبيلة هادئة، تركيز على المهام.' },
    { id: 'tribe_dragon',  name: 'فرسان التنين', emoji: '🐉', img: 'assets/tribes/tribe-emblem-4.png', level: 10, motto: 'بلا خوف', color: '#ea580c', bio: 'أقوى قبيلة. شروط صعبة ومكافآت ضخمة.' },
    { id: 'tribe_wave',    name: 'أبناء الموجة', emoji: '🌊', img: 'assets/tribes/tribe-emblem-5.png', level: 4, motto: 'معاً أقوى', color: '#0891b2', bio: 'قبيلة للمبتدئين. نرحّب بالجميع.' },
    { id: 'tribe_gold',    name: 'تجّار الذهب', emoji: '💰', img: 'assets/tribes/tribe-emblem-6.png', level: 7, motto: 'الذهب يشتري كل شي', color: '#ca8a04', bio: 'قبيلة تجارية.' }
  ],

  BOT_NAMES: ['علي', 'محمد', 'أحمد', 'خالد', 'سعد', 'فهد', 'نورة', 'سارة', 'ريم', 'هند', 'عبدالله', 'عمر', 'يوسف', 'فاطمة', 'مريم', 'ليان', 'راكان', 'تركي', 'نواف', 'بندر'],
  BOT_CHAT: ['هلا شباب 👋', 'وش الأخبار؟', 'اليوم صيد وفير 🐟', 'من يبي ينضم لرحلة؟', 'مبروك على المستوى الجديد 🎉', 'الخزنة تحتاج تبرعات 💰', 'أنا في الأرينا الآن 🔥', 'وش رايكم نضرب الوحش؟ 💀', 'حظ أوفر المرة الجاية', 'الله يعطيكم العافية'],

  RANKS: {
    leader:  { name: 'القائد',  emoji: '👑', color: '#fbbf24' },
    officer: { name: 'نائب',    emoji: '⚔️', color: '#38bdf8' },
    member:  { name: 'عضو',     emoji: '⚓', color: '#94a3b8' }
  },

  TRIBE_LEVELS: {
    1:  { cost: 0,        maxMembers: 15, goldBonus: 0,    title: 'قبيلة ناشئة' },
    2:  { cost: 100000,   maxMembers: 18, goldBonus: 0.02, title: 'قبيلة صاعدة' },
    3:  { cost: 250000,   maxMembers: 21, goldBonus: 0.05, title: 'قبيلة قوية' },
    4:  { cost: 500000,   maxMembers: 24, goldBonus: 0.08, title: 'قبيلة عريقة' },
    5:  { cost: 1000000,  maxMembers: 27, goldBonus: 0.10, title: 'قبيلة ملكية' },
    6:  { cost: 2000000,  maxMembers: 30, goldBonus: 0.12, title: 'قبيلة أسطورية' },
    7:  { cost: 4000000,  maxMembers: 35, goldBonus: 0.15, title: 'قبيلة جبارة' },
    8:  { cost: 8000000,  maxMembers: 40, goldBonus: 0.18, title: 'قبيلة إمبراطورية' },
    9:  { cost: 15000000, maxMembers: 45, goldBonus: 0.20, title: 'قبيلة ملوك' },
    10: { cost: 30000000, maxMembers: 50, goldBonus: 0.25, title: 'قبيلة أسطورية نهائية' }
  },

  DAILY_SALARY: 500,
  SALARY_MIN_DONATION: 10000,
  SALARY_COOLDOWN_MS: 86400000,
  CONTRIBUTION_OFFICER: 500,
  CONTRIBUTION_VETERAN: 100,

  ctx: null,
  _root: null,
  _tab: 'members',

  init: function (ctx) {
    var self = this;
    this.ctx = ctx;
    this.ensureState();
    this.injectCSS();
    this.build();
    this.rebindNav();
    setInterval(function () { self.checkQuestReset(); }, 60000);
    setInterval(function () { self.tickChat(); }, 15000);
  },

  ensureState: function () {
    var self = this;
    var st = this.ctx.state;
    if (!st.tribe) {
      st.tribe = { joined: null, donations: 0, quests: {}, questDate: '', chat: [] };
    }
    if (!st.tribeList) {
      st.tribeList = this.TRIBE_BOTS.map(function (t) {
        return {
          id: t.id, name: t.name, emoji: t.emoji, level: t.level,
          motto: t.motto, color: t.color, bio: t.bio,
          members: self.generateMembers(5 + Math.floor(Math.random() * 10)),
          treasury: 100000 + Math.floor(Math.random() * 1000000),
          gems: 200 + Math.floor(Math.random() * 800)
        };
      });
    }
    if (typeof saveState === 'function') saveState();
  },

  generateMembers: function (count) {
    var out = [];
    var names = this.BOT_NAMES.slice();
    for (var i = 0; i < count && i < names.length; i++) {
      var idx = Math.floor(Math.random() * names.length);
      var nm = names.splice(idx, 1)[0];
      out.push({
        id: 'm_' + i + '_' + Math.random().toString(36).slice(2, 6),
        name: nm,
        emoji: this.randomEmoji(),
        rank: i === 0 ? 'leader' : (i < 2 ? 'officer' : 'member'),
        level: 10 + Math.floor(Math.random() * 80)
      });
    }
    return out;
  },

  randomEmoji: function () {
    var arr = ['🧑‍✈️','👨‍✈️','👩‍✈️','🏴‍☠️','⚓','🎣','⚔️','🛡️','🦈','🐋','🐉','👑'];
    return arr[Math.floor(Math.random() * arr.length)];
  },

  rebindNav: function () {
    var self = this;
    var oldBtn = document.querySelector('.nav-btn[data-screen="tribe"]');
    if (!oldBtn) return;
    var newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    newBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      self.open();
    });
  },

  myTribe: function () {
    var st = this.ctx.state;
    if (!st.tribe.joined) return null;
    for (var i = 0; i < st.tribeList.length; i++) {
      if (st.tribeList[i].id === st.tribe.joined.tribeId) return st.tribeList[i];
    }
    return null;
  },

  myRank: function () {
    var t = this.myTribe();
    if (!t) return null;
    for (var i = 0; i < t.members.length; i++) {
      if (t.members[i].id === 'me') return t.members[i].rank;
    }
    return 'member';
  },

  joinTribe: function (tribeId) {
    var st = this.ctx.state;
    if (st.tribe.joined) { if (typeof showMessage === 'function') showMessage('أنت في قبيلة بالفعل'); return; }
    var t = null;
    for (var i = 0; i < st.tribeList.length; i++) if (st.tribeList[i].id === tribeId) t = st.tribeList[i];
    if (!t) return;
    
    st.tribe.joined = { tribeId: tribeId, joinedAt: Date.now(), contribution: 0, lastSalaryAt: 0 };
    st.tribe.chat = [];
    
    t.members.push({
      id: 'me',
      name: (st.name || 'القبطان'),
      emoji: '🧑‍✈️',
      rank: 'member',
      level: (typeof levelOf === 'function') ? levelOf(st.xp || 0) : 1
    });
    
    this.addLog('🎉 انضم ' + (st.name || 'القبطان') + ' للقبيلة', t);
    this.addSystemChat('أهلاً بك في ' + t.name + '! 👋');
    
    if (typeof saveState === 'function') saveState();
    if (typeof showMessage === 'function') showMessage('✅ انضممت إلى ' + t.name);
    if (typeof beep === 'function') beep(880, 0.15);
    this._tab = 'chat';
    this.render();
  },

  leaveTribe: function () {
    var st = this.ctx.state;
    if (!st.tribe.joined) return;
    if (!confirm('مغادرة القبيلة؟ سيتم سحب جميع سفن القبيلة منك.')) return;
    var t = this.myTribe();
    if (t) {
      for (var i = 0; i < t.members.length; i++) {
        if (t.members[i].id === 'me') { t.members.splice(i, 1); break; }
      }
      this.addLog('👋 غادر ' + (st.name || 'القبطان') + ' القبيلة', t);
    }
    
    if (st.ships) {
      for (var j = st.ships.length - 1; j >= 0; j--) {
        if (st.ships[j].isTribeShip && st.ships[j].tribeId === t.id) {
          st.ships.splice(j, 1);
        }
      }
    }
    
    st.tribe.joined = null;
    st.tribe.donations = 0;
    st.tribe.chat = [];
    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
    if (typeof showMessage === 'function') showMessage('وداعاً 👋 (تم سحب سفن القبيلة)');
    this.render();
  },

  donate: function (amount, currency) {
    var st = this.ctx.state;
    var t = this.myTribe();
    if (!t) return;
    if (currency === 'gems') {
      if ((st.gems || 0) < amount) { if (typeof showMessage === 'function') showMessage('💎 جواهر غير كافية'); return; }
      st.gems -= amount;
      t.gems = (t.gems || 0) + amount;
    } else {
      if ((st.coins || 0) < amount) { if (typeof showMessage === 'function') showMessage('💰 الذهب غير كافي'); return; }
      st.coins -= amount;
      t.treasury += amount;
    }
    st.tribe.donations += (currency === 'gems' ? amount * 100 : amount);
    var contribAdd = (currency === 'gems') ? amount : Math.floor(amount / 100);
    if (st.tribe.joined) st.tribe.joined.contribution = (st.tribe.joined.contribution || 0) + contribAdd;
    this.addLog('💎 تبرّع ' + (st.name || 'القبطان') + ' بـ ' + amount.toLocaleString(), t);
    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
    if (typeof beep === 'function') beep(780, 0.1);
    if (typeof showMessage === 'function') showMessage('✅ تبرعت بنجاح');
    this.render();
  },

  buyShip: function(shipCode) {
    var st = this.ctx.state;
    var t = this.myTribe();
    if (!t) return;
    
    var role = this.myRank();
    if (role !== 'leader' && role !== 'officer') {
      if (typeof showMessage === 'function') showMessage('👑 القادة والنواب فقط يشترون السفن');
      return;
    }

    var shipDef = null;
    for (var i = 0; i < this.TRIBE_SHIPS.length; i++) {
      if (this.TRIBE_SHIPS[i].code === shipCode) shipDef = this.TRIBE_SHIPS[i];
    }
    if (!shipDef) return;

    if (st.ships) {
      for (var k = 0; k < st.ships.length; k++) {
        if (st.ships[k].isTribeShip && st.ships[k].code === shipCode) {
          if (typeof showMessage === 'function') showMessage('✅ تملك ' + shipDef.name + ' مسبقاً');
          return;
        }
      }
    }

    if ((t.gems || 0) < shipDef.cost) {
      if (typeof showMessage === 'function') showMessage('💎 خزنة القبيلة لا تكفي (' + shipDef.cost + ' 💎)');
      return;
    }

    t.gems -= shipDef.cost;
    var def = window.SHIP_BY_CODE[shipCode];
    if (!def) return;
    
    var instance = {
      id: 'tribe_' + Date.now(),
      code: shipCode,
      templateId: 0,
      hp: def.hp,
      maxHp: def.hp,
      stars: 1,
      maxStars: 1,
      inStorage: false,
      acquiredAt: Date.now(),
      isTribeShip: true,
      tribeId: t.id,
      level: 1
    };
    
    if (!st.ships) st.ships = [];
    st.ships.push(instance);
    
    this.addLog('🛒 القبيلة اشترت ' + shipDef.name + ' للعضو ' + st.name, t);
    if (typeof window.rpcShips === 'function') window.rpcShips('sync_legacy');
    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
    if (typeof showMessage === 'function') showMessage('✅ تم شراء السفينة وإضافتها لأسطولك');
    this.render();
  },

  upgradeShip: function(shipId) {
    var st = this.ctx.state;
    var t = this.myTribe();
    if (!t) return;
    
    var role = this.myRank();
    if (role !== 'leader' && role !== 'officer') {
      if (typeof showMessage === 'function') showMessage('👑 القادة والنواب فقط يطورون السفن');
      return;
    }

    var ship = null;
    for (var i = 0; i < st.ships.length; i++) {
      if (st.ships[i].id === shipId) ship = st.ships[i];
    }
    if (!ship || !ship.isTribeShip) return;
    
    var curLvl = ship.level || 1;
    if (curLvl >= 5) { if (typeof showMessage === 'function') showMessage('وصلت الحد الأقصى'); return; }
    
    var costs = { 1: 50, 2: 100, 3: 200, 4: 400 };
    var cost = costs[curLvl];
    
    if ((t.gems || 0) < cost) {
      if (typeof showMessage === 'function') showMessage('💎 خزنة القبيلة لا تكفي (' + cost + ' 💎)');
      return;
    }
    
    t.gems -= cost;
    ship.level = curLvl + 1;
    
    var def = window.SHIP_BY_CODE[ship.code];
    if (def) {
      ship.maxHp = def.hp + (ship.level - 1) * 10000;
      ship.hp = ship.maxHp;
    }
    
    if (typeof window.rpcShips === 'function') window.rpcShips('sync_legacy');
    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
    if (typeof showMessage === 'function') showMessage('⭐ السفينة وصلت للمستوى ' + ship.level);
    this.render();
  },

  getTribeLevel: function () { var t = this.myTribe(); return t ? (t.level || 1) : 1; },
  getTribeLevelInfo: function () { return this.TRIBE_LEVELS[this.getTribeLevel()] || this.TRIBE_LEVELS[1]; },
  getMaxMembers: function () { return this.getTribeLevelInfo().maxMembers; },
  getGoldBonus: function () { return this.getTribeLevelInfo().goldBonus || 0; },
  applyGoldBonus: function (b) { var g = this.getGoldBonus(); return g ? Math.floor(b * g) : 0; },

  upgradeTribe: function () {
    var st = this.ctx.state;
    var t = this.myTribe();
    if (!t) return;
    var role = this.myRank();
    if (role !== 'leader' && role !== 'officer') { if (typeof showMessage === 'function') showMessage('👑 القادة والنواب فقط'); return; }
    var curLvl = t.level || 1;
    if (curLvl >= 10) { if (typeof showMessage === 'function') showMessage('🏆 الحد الأقصى'); return; }
    var nextInfo = this.TRIBE_LEVELS[curLvl + 1];
    if (!nextInfo) return;
    if ((t.treasury || 0) < nextInfo.cost) { if (typeof showMessage === 'function') showMessage('💰 الخزنة تحتاج ' + this.fmt(nextInfo.cost)); return; }
    t.treasury -= nextInfo.cost;
    t.level = curLvl + 1;
    this.addLog('🏰 ترقّت القبيلة للمستوى ' + t.level, t);
    this.addSystemChat('🏰 القبيلة وصلت للمستوى ' + t.level + '!');
    if (typeof saveState === 'function') saveState();
    if (typeof showMessage === 'function') showMessage('🎉 ' + nextInfo.title);
    if (typeof beep === 'function') beep(1200, 0.2);
    this.render();
  },

  claimSalary: function () {
    var st = this.ctx.state;
    var t = this.myTribe();
    if (!t) return;
    var joined = st.tribe.joined;
    var lastAt = joined.lastSalaryAt || 0;
    if (Date.now() - lastAt < this.SALARY_COOLDOWN_MS) {
      var left = this.SALARY_COOLDOWN_MS - (Date.now() - lastAt);
      if (typeof showMessage === 'function') showMessage('⏳ بعد ' + Math.floor(left / 3600000) + 'س');
      return;
    }
    if ((st.tribe.donations || 0) < this.SALARY_MIN_DONATION) { if (typeof showMessage === 'function') showMessage('🎁 تحتاج تبرع ' + this.fmt(this.SALARY_MIN_DONATION)); return; }
    if ((t.treasury || 0) < this.DAILY_SALARY) { if (typeof showMessage === 'function') showMessage('💸 الخزنة فاضية'); return; }
    t.treasury -= this.DAILY_SALARY;
    st.coins = (st.coins || 0) + this.DAILY_SALARY;
    joined.lastSalaryAt = Date.now();
    this.addLog('💵 ' + (st.name || 'القبطان') + ' استلم الراتب', t);
    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
    if (typeof showMessage === 'function') showMessage('💰 +' + this.DAILY_SALARY);
    if (typeof beep === 'function') beep(880, 0.15);
    this.render();
  },

  renderDevelop: function (t) {
    var st = this.ctx.state;
    var lvl = t.level || 1;
    var info = this.TRIBE_LEVELS[lvl] || this.TRIBE_LEVELS[1];
    var next = this.TRIBE_LEVELS[lvl + 1] || null;
    var myRole = this.myRank();
    var canUpgrade = (myRole === 'leader' || myRole === 'officer');
    var h = '';

    h += '<div class="tr-section">';
    h += '<h3>🏰 مستوى القبيلة <span class="cnt">Lv ' + lvl + ' / 10</span></h3>';
    h += '<div style="text-align:center;padding:14px 8px;background:linear-gradient(180deg,rgba(252,191,73,.1),transparent);border-radius:12px;margin-bottom:10px">';
    h += '<div style="font-size:20px;font-weight:900;color:#fcd34d">' + info.title + '</div>';
    h += '<div style="font-size:11px;color:#94a3b8;margin-top:6px">👥 ' + info.maxMembers + ' عضو · 💰 +' + Math.round(info.goldBonus * 100) + '% ذهب</div>';
    h += '</div>';
    if (next) {
      h += '<div class="tr-item" style="flex-direction:column;align-items:stretch;gap:8px;padding:14px">';
      h += '<div style="font-size:14px;font-weight:900;color:#fef3c7">' + next.title + '</div>';
      h += '<div style="font-size:11px;color:#94a3b8">👥 ' + next.maxMembers + ' عضو · 💰 +' + Math.round(next.goldBonus * 100) + '% ذهب</div>';
      h += '<div style="display:flex;justify-content:space-between;padding:8px;background:rgba(0,0,0,.3);border-radius:10px;align-items:center">';
      h += '<span style="font-size:11px;color:#94a3b8">التكلفة:</span>';
      h += '<b style="font-size:13px;color:#fcd34d">💰 ' + this.fmt(next.cost) + '</b>';
      h += '</div>';
      var canAfford = (t.treasury || 0) >= next.cost;
      var disabled = !canUpgrade || !canAfford;
      h += '<button class="tr-btn gold" data-tr="upgrade-tribe" ' + (disabled ? 'disabled' : '') + ' style="padding:11px;font-size:13px;width:100%">';
      if (!canUpgrade) h += '👑 القادة والنواب فقط';
      else if (!canAfford) h += '💸 تحتاج ' + this.fmt(next.cost);
      else h += '⬆️ ترقية القبيلة';
      h += '</button></div>';
    } else {
      h += '<div style="text-align:center;padding:14px;color:#fcd34d;font-weight:900">🏆 الحد الأقصى</div>';
    }
    h += '</div>';

    var joined = st.tribe.joined || {};
    var lastSalary = joined.lastSalaryAt || 0;
    var timeLeft = this.SALARY_COOLDOWN_MS - (Date.now() - lastSalary);
    var canClaim = timeLeft <= 0;
    var donatedEnough = (st.tribe.donations || 0) >= this.SALARY_MIN_DONATION;
    var treasuryHas = (t.treasury || 0) >= this.DAILY_SALARY;

    h += '<div class="tr-section">';
    h += '<h3>💵 الراتب اليومي <span class="cnt">+' + this.DAILY_SALARY + ' 💰</span></h3>';
    h += '<div style="font-size:11px;color:#94a3b8;margin-bottom:8px;text-align:center">تحتاج تبرع ' + this.fmt(this.SALARY_MIN_DONATION) + ' أولاً</div>';
    var donPct = Math.min(100, ((st.tribe.donations || 0) / this.SALARY_MIN_DONATION) * 100);
    h += '<div style="margin-bottom:10px">';
    h += '<div style="display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;margin-bottom:3px"><span>تبرعاتك:</span><span>' + this.fmt(st.tribe.donations || 0) + ' / ' + this.fmt(this.SALARY_MIN_DONATION) + '</span></div>';
    h += '<div class="tr-q-bar"><div class="tr-q-fill' + (donatedEnough ? ' done' : '') + '" style="width:' + donPct + '%"></div></div>';
    h += '</div>';
    var btnDisabled = !canClaim || !donatedEnough || !treasuryHas;
    var btnLabel = '';
    if (!donatedEnough) btnLabel = '🎁 تبرّع أولاً';
    else if (!treasuryHas) btnLabel = '💸 الخزنة فاضية';
    else if (!canClaim) btnLabel = '⏳ بعد ' + Math.floor(timeLeft / 3600000) + 'س';
    else btnLabel = '💰 استلم الراتب';
    h += '<button class="tr-btn ' + (btnDisabled ? 'gray' : 'gold') + '" data-tr="claim-salary" ' + (btnDisabled ? 'disabled' : '') + ' style="width:100%;padding:11px">' + btnLabel + '</button>';
    h += '</div>';

    var contrib = joined.contribution || 0;
    var cT = this.CONTRIBUTION_VETERAN;
    var cO = this.CONTRIBUTION_OFFICER;
    var rankLabel = '';
    var rankProgress = 0;
    if (contrib >= cO) { rankLabel = '⭐ نائب'; rankProgress = 100; }
    else if (contrib >= cT) { rankLabel = '⚔️ عضو نشط'; rankProgress = Math.min(100, ((contrib - cT) / (cO - cT)) * 100); }
    else { rankLabel = '⚓ عضو جديد'; rankProgress = Math.min(100, (contrib / cT) * 100); }

    h += '<div class="tr-section">';
    h += '<h3>⭐ نقاط المساهمة <span class="cnt">' + contrib + '</span></h3>';
    h += '<div style="text-align:center;padding:10px;background:rgba(0,0,0,.3);border-radius:10px;margin-bottom:10px">';
    h += '<div style="font-size:13px;font-weight:900;color:#fcd34d">' + rankLabel + '</div>';
    h += '<div style="font-size:10px;color:#94a3b8;margin-top:4px">كل 100 ذهب = 1 نقطة</div>';
    h += '</div>';
    h += '<div class="tr-q-bar"><div class="tr-q-fill' + (rankProgress >= 100 ? ' done' : '') + '" style="width:' + rankProgress + '%"></div></div>';
    h += '</div>';

    h += '<div class="tr-section">';
    h += '<h3>📊 إحصائيات</h3>';
    h += '<div class="tr-setrow"><div style="flex:1"><div class="lbl">المستوى</div></div><b style="color:#fcd34d">' + lvl + ' / 10</b></div>';
    h += '<div class="tr-setrow"><div style="flex:1"><div class="lbl">الأعضاء</div></div><b style="color:#fcd34d">' + ((t.members || []).length) + ' / ' + info.maxMembers + '</b></div>';
    h += '<div class="tr-setrow"><div style="flex:1"><div class="lbl">بونص الذهب</div></div><b style="color:#86efac">+' + Math.round(info.goldBonus * 100) + '%</b></div>';
    h += '<div class="tr-setrow"><div style="flex:1"><div class="lbl">رتبتك</div></div><b style="color:#fcd34d">' + ((this.RANKS[myRole] || this.RANKS.member).name) + '</b></div>';
    h += '</div>';

    return h;
  },

  addLog: function (text, t) {
    if (!t) return;
    if (!t.log) t.log = [];
    t.log.unshift({ text: text, at: Date.now() });
    if (t.log.length > 100) t.log.length = 100;
  },

  addSystemChat: function (text) {
    var st = this.ctx.state;
    if (!st.tribe.chat) st.tribe.chat = [];
    st.tribe.chat.push({ from: 'system', text: text, at: Date.now() });
    if (typeof saveState === 'function') saveState();
  },

  sendChat: function () {
    var st = this.ctx.state;
    var inp = document.getElementById('tr-chat-input');
    if (!inp) return;
    var text = inp.value.trim();
    if (!text) return;
    
    if (!st.tribe.chat) st.tribe.chat = [];
    st.tribe.chat.push({ from: 'me', text: text, at: Date.now() });
    inp.value = '';
    if (typeof saveState === 'function') saveState();
    
    this.renderChatBody();
    this.scrollChat();
  },

  tickChat: function () {
    if (!this._root || !this._root.classList.contains('open')) return;
    if (this._tab !== 'chat') return;
    var st = this.ctx.state;
    if (!st.tribe.joined) return;
    
    if (Math.random() < 0.4) {
      var t = this.myTribe();
      if (!t || !t.members.length) return;
      var bot = t.members[Math.floor(Math.random() * t.members.length)];
      if (bot.id === 'me') return;
      var msg = this.BOT_CHAT[Math.floor(Math.random() * this.BOT_CHAT.length)];
      
      if (!st.tribe.chat) st.tribe.chat = [];
      st.tribe.chat.push({ from: 'bot', name: bot.name, emoji: bot.emoji, text: msg, at: Date.now() });
      if (typeof saveState === 'function') saveState();
      this.renderChatBody();
      this.scrollChat();
    }
  },

  checkQuestReset: function () {
    var st = this.ctx.state;
    var today = this.todayKey();
    if (st.tribe.questDate !== today) {
      st.tribe.questDate = today;
      st.tribe.quests = {};
      st.tribe.questStart = {
        caught: st.stats.caught || 0,
        trips: st.stats.trips || 0,
        bossCount: (st.boss && st.boss.bossCount) || 0
      };
      if (typeof saveState === 'function') saveState();
    }
  },

  todayKey: function () {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  },

  questProgress: function (q) {
    var st = this.ctx.state;
    var start = st.tribe.questStart || { caught:0, trips:0, bossCount:0 };
    switch (q.id) {
      case 'donate_1k':  return Math.min(q.target, st.tribe.donations || 0);
      case 'donate_10k': return Math.min(q.target, st.tribe.donations || 0);
      case 'catch_20':   return Math.min(q.target, (st.stats.caught || 0) - start.caught);
      case 'trips_3':    return Math.min(q.target, (st.stats.trips || 0) - start.trips);
      case 'boss_5':     return Math.min(q.target, ((st.boss && st.boss.bossCount) || 0) - start.bossCount);
    }
    return 0;
  },

  claimQuest: function (id) {
    var st = this.ctx.state;
    var q = null;
    for (var i = 0; i < this.QUESTS.length; i++) if (this.QUESTS[i].id === id) q = this.QUESTS[i];
    if (!q) return;
    if (st.tribe.quests[id]) { if (typeof showMessage === 'function') showMessage('استلمت مسبقاً'); return; }
    if (this.questProgress(q) < q.target) { if (typeof showMessage === 'function') showMessage('لم تكتمل بعد'); return; }
    st.tribe.quests[id] = true;
    if (q.reward.coins) st.coins = (st.coins || 0) + q.reward.coins;
    if (q.reward.gems)  st.gems  = (st.gems  || 0) + q.reward.gems;
    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
    if (typeof beep === 'function') beep(980, 0.12);
    var msg = [];
    if (q.reward.coins) msg.push('+' + q.reward.coins + ' 💰');
    if (q.reward.gems)  msg.push('+' + q.reward.gems + ' 💎');
    if (typeof showMessage === 'function') showMessage('🎁 ' + msg.join(' · '));
    this.render();
  },

  injectCSS: function () {
    if (document.getElementById('_tr_css')) return;
    var c = [
      '.tr-wrap{position:fixed;inset:0;z-index:224;display:none;flex-direction:column;direction:rtl;color:#fff;font-family:inherit;background:radial-gradient(ellipse at 50% 0%,#151c2e 0%,#080c16 55%,#000 100%);height:100%}',
      '.tr-wrap.open{display:flex}',
      '.tr-top{display:flex;align-items:center;gap:10px;padding:12px 14px 10px;flex-shrink:0;background:rgba(10,15,25,.8);border-bottom:1px solid rgba(252,191,73,.2)}',
      '.tr-back{width:40px;height:40px;border-radius:12px;border:1.5px solid rgba(252,191,73,.6);background:linear-gradient(135deg,rgba(30,25,50,.9),rgba(15,10,25,.9));color:#fcd34d;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,.4)}',
      '.tr-title{flex:1;text-align:center;font-weight:900;font-size:18px;color:#fcd34d;text-shadow:0 2px 8px rgba(0,0,0,.8);letter-spacing:0.5px}',
      
      '.tr-tabs{display:flex;gap:6px;overflow-x:auto;padding:10px 12px;flex-shrink:0;scrollbar-width:none;background:rgba(5,8,15,.6)}',
      '.tr-tabs::-webkit-scrollbar{display:none}',
      '.tr-tab{flex:1;min-width:64px;padding:9px 6px;border-radius:12px;border:1.5px solid rgba(252,191,73,.25);background:linear-gradient(180deg,rgba(15,25,45,.8),rgba(10,15,30,.8));color:#cbd5e1;font-size:11px;font-weight:800;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;box-shadow:0 2px 6px rgba(0,0,0,.3);transition:all .2s}',
      '.tr-tab.on{border-color:#fcd34d;background:linear-gradient(180deg,rgba(252,191,73,.3),rgba(180,83,9,.2));color:#fef3c7;box-shadow:0 0 14px rgba(252,191,73,.4);transform:translateY(-1px)}',
      '.tr-tab .em{font-size:16px;line-height:1}',
      
      '.tr-body{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px;display:flex;flex-direction:column;gap:12px}',
      
      '.tr-section{padding:14px;border-radius:16px;background:linear-gradient(180deg,rgba(18,28,50,.85),rgba(10,16,30,.85));border:1px solid rgba(252,191,73,.25);box-shadow:0 6px 16px rgba(0,0,0,.4)}',
      '.tr-section h3{margin:0 0 10px;font-size:14px;font-weight:900;color:#fcd34d;display:flex;align-items:center;justify-content:space-between;gap:6px;text-shadow:0 1px 3px rgba(0,0,0,.5)}',
      '.tr-section h3 .cnt{font-size:10px;color:#94a3b8;font-weight:800;background:rgba(0,0,0,.4);padding:2px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.05)}',
      
      '.tr-empty{text-align:center;padding:40px 12px;color:#94a3b8;font-size:13px;display:flex;flex-direction:column;align-items:center}',
      '.tr-empty .big{font-size:52px;line-height:1;opacity:.5;margin-bottom:10px}',
      
      '.tr-card{padding:16px;border-radius:18px;background:linear-gradient(180deg,rgba(22,35,60,.95),rgba(10,16,30,.95));border:1.5px solid rgba(252,191,73,.45);display:flex;gap:14px;align-items:center;box-shadow:0 8px 20px rgba(0,0,0,.5)}',
      '.tr-card .logo{width:64px;height:64px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:32px;flex-shrink:0;border:2px solid;box-shadow:0 4px 10px rgba(0,0,0,.4)}',
      '.tr-card .info{flex:1;min-width:0}',
      '.tr-card .nm{font-size:17px;font-weight:900;color:#fef3c7}',
      '.tr-card .meta{font-size:11px;color:#94a3b8;margin-top:4px;display:flex;gap:10px;flex-wrap:wrap}',
      '.tr-card .lvl{color:#fbbf24;font-weight:800}',
      
      '.tr-item{padding:14px;border-radius:16px;background:linear-gradient(180deg,rgba(14,24,42,.9),rgba(8,14,26,.9));border:1px solid rgba(255,255,255,.1);display:flex;gap:14px;align-items:center;box-shadow:0 4px 12px rgba(0,0,0,.3);transition:transform .15s}',
      '.tr-item:hover{border-color:rgba(252,191,73,.35)}',
      '.tr-item .logo{width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;border:2px solid}',
      '.tr-item .info{flex:1;min-width:0}',
      '.tr-item .nm{font-size:15px;font-weight:900;color:#fff}',
      '.tr-item .motto{font-size:11px;color:#94a3b8;font-style:italic;margin-top:3px}',
      '.tr-item .stats{font-size:11px;color:#cbd5e1;margin-top:6px;display:flex;gap:10px}',
      '.tr-item .stats b{color:#fcd34d}',
      
      '.tr-btn{padding:9px 16px;border-radius:12px;border:1.5px solid;font-size:12px;font-weight:900;cursor:pointer;white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,.3);transition:transform .15s,filter .15s}',
      '.tr-btn:active{transform:scale(.95)}',
      '.tr-btn.gold{border-color:#fcd34d;background:linear-gradient(180deg,#fcd34d,#d97706);color:#1c1917;text-shadow:0 1px 0 rgba(255,255,255,.3)}',
      '.tr-btn.red{border-color:#f87171;background:linear-gradient(180deg,#fecaca,#dc2626);color:#fff}',
      '.tr-btn.blue{border-color:#7dd3fc;background:linear-gradient(180deg,#38bdf8,#0284c7);color:#fff}',
      
      '.tr-mrow{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:14px;background:rgba(12,22,38,.7);border:1px solid rgba(255,255,255,.06);margin-bottom:8px}',
      '.tr-mrow.me{border-color:rgba(252,191,73,.6);background:linear-gradient(135deg,rgba(252,191,73,.12),rgba(12,22,38,.7))}',
      '.tr-av{width:42px;height:42px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#2a4a75,#0b1d33);border:2px solid rgba(252,191,73,.6);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;box-shadow:0 3px 8px rgba(0,0,0,.4)}',
      '.tr-minfo{flex:1;min-width:0}',
      '.tr-mname{font-size:14px;font-weight:900;color:#fef3c7}',
      '.tr-mmeta{font-size:11px;color:#94a3b8;margin-top:2px}',
      '.tr-rank{padding:3px 10px;border-radius:8px;font-size:11px;font-weight:900;box-shadow:0 2px 5px rgba(0,0,0,.3)}',
      
      '.tr-q{padding:12px 14px;border-radius:14px;background:rgba(12,22,38,.7);border:1px solid rgba(255,255,255,.08);margin-bottom:10px;box-shadow:0 4px 10px rgba(0,0,0,.2)}',
      '.tr-q.complete{border-color:rgba(34,197,94,.6);background:linear-gradient(180deg,rgba(34,197,94,.12),rgba(12,22,38,.7))}',
      '.tr-q.claimed{border-color:rgba(252,191,73,.4);background:linear-gradient(180deg,rgba(252,191,73,.08),rgba(12,22,38,.7));opacity:.75}',
      '.tr-q-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}',
      '.tr-q-ico{width:38px;height:38px;border-radius:12px;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;border:1px solid rgba(255,255,255,.1)}',
      '.tr-q-txt{flex:1}',
      '.tr-q-title{font-size:14px;font-weight:900;color:#fff}',
      '.tr-q-desc{font-size:11px;color:#94a3b8;margin-top:2px}',
      '.tr-q-rew{font-size:11px;font-weight:900;color:#fcd34d;padding:3px 10px;border-radius:8px;background:rgba(252,191,73,.15);border:1px solid rgba(252,191,73,.35)}',
      '.tr-q-bar{height:8px;border-radius:4px;background:rgba(0,0,0,.6);overflow:hidden;margin-bottom:8px;border:1px solid rgba(255,255,255,.05)}',
      '.tr-q-fill{height:100%;transition:width .3s;background:linear-gradient(90deg,#38bdf8,#0ea5e9)}',
      '.tr-q-fill.done{background:linear-gradient(90deg,#22c55e,#16a34a)}',
      '.tr-q-foot{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#94a3b8}',
      
      '.tr-log{padding:10px 12px;border-radius:12px;background:rgba(12,22,38,.6);border:1px solid rgba(255,255,255,.05);margin-bottom:6px;font-size:13px;color:#cbd5e1}',
      '.tr-log .time{font-size:10px;color:#64748b;margin-top:4px}',

      /* الشات */
      '.tr-chat-wrap{display:flex;flex-direction:column;flex:1;min-height:0;margin:-12px}',
      '.tr-chat-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px}',
      '.tr-chat-msg{max-width:80%;padding:10px 14px;border-radius:16px;font-size:13px;line-height:1.4;position:relative;box-shadow:0 3px 10px rgba(0,0,0,.3)}',
      '.tr-chat-msg.me{align-self:flex-start;background:linear-gradient(135deg,#1fb5a8,#0f8a86);color:#fff;border-bottom-left-radius:4px}',
      '.tr-chat-msg.bot{align-self:flex-end;background:linear-gradient(135deg,#1c3254,#14253f);color:#f3ead2;border-bottom-right-radius:4px;border:1px solid rgba(255,255,255,.08)}',
      '.tr-chat-msg.system{align-self:center;background:rgba(252,191,73,.12);border:1px dashed rgba(252,191,73,.6);color:#fcd34d;font-size:11px;padding:6px 14px;border-radius:12px;text-align:center;max-width:90%}',
      '.tr-chat-name{font-size:10px;opacity:.8;margin-bottom:3px;font-weight:900;display:flex;align-items:center;gap:4px;color:#fcd34d}',
      '.tr-chat-inputrow{flex-shrink:0;padding:12px 14px calc(12px + env(safe-area-inset-bottom,0px));border-top:1px solid rgba(252,191,73,.2);display:flex;gap:10px;background:rgba(8,12,22,.95);box-shadow:0 -4px 16px rgba(0,0,0,.5)}',
      '.tr-chat-inputrow input{flex:1;padding:11px 16px;border-radius:24px;border:1px solid rgba(252,191,73,.3);background:#0a1d33;color:#fff;font-size:13px;outline:none;box-shadow:inset 0 2px 5px rgba(0,0,0,.5)}',
      '.tr-chat-inputrow button{width:42px;height:42px;border-radius:50%;border:none;background:linear-gradient(180deg,#fcd34d,#d97706);color:#1a0f04;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,.4)}'
    ].join('');
    var s = document.createElement('style');
    s.id = '_tr_css';
    s.textContent = c;
    document.head.appendChild(s);
  },

  build: function () {
    var self = this;
    var old = document.getElementById('tr-root');
    if (old) old.remove();
    var root = document.createElement('div');
    root.id = 'tr-root';
    root.className = 'tr-wrap';
    root.innerHTML = '<div id="tr-inner" style="display:flex;flex-direction:column;flex:1;height:100%"></div>';
    document.body.appendChild(root);
    this._root = root;

    root.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-tr]') : null;
      if (!t || t.disabled) return;
      var act = t.getAttribute('data-tr');
      var v = t.getAttribute('data-v') || '';
      if (act === 'close') { self.close(); return; }
      if (act === 'tab') { self._tab = v; self.render(); return; }
      if (act === 'join') { self.joinTribe(v); return; }
      if (act === 'leave') { self.leaveTribe(); return; }
      if (act === 'donate') {
        var parts = v.split('|');
        self.donate(parseInt(parts[0], 10), parts[1]);
        return;
      }
      if (act === 'claim') { self.claimQuest(v); return; }
      if (act === 'send-chat') { self.sendChat(); return; }
      if (act === 'buy-ship') { self.buyShip(v); return; }
      if (act === 'upgrade-ship') { self.upgradeShip(v); return; }
    });

    root.addEventListener('keydown', function (e) {
      if (e.target && e.target.id === 'tr-chat-input' && e.key === 'Enter') {
        e.preventDefault();
        self.sendChat();
      }
    });
  },

  open: function () {
    this.ensureState();
    this.checkQuestReset();
    this.render();
    if (this._root) this._root.classList.add('open');
  },

  close: function () {
    if (this._root) this._root.classList.remove('open');
  },

  render: function () {
    var inner = document.getElementById('tr-inner');
    if (!inner || !this.ctx) return;
    var t = this.myTribe();

    var h = '';
    h += '<div class="tr-top">';
    h +=   '<button class="tr-back" data-tr="close">←</button>';
    h +=   '<div class="tr-title">🏴 القبيلة</div>';
    h +=   '<div style="width:40px"></div>';
    h += '</div>';

    if (!t) {
      h += '<div class="tr-body">' + this.renderNoTribe() + '</div>';
    } else {
      h += '<div class="tr-tabs">';
      for (var i = 0; i < this.TABS.length; i++) {
        var tb = this.TABS[i];
        var on = this._tab === tb.id;
        h += '<button class="tr-tab' + (on ? ' on' : '') + '" data-tr="tab" data-v="' + tb.id + '">';
        h +=   '<span class="em">' + tb.emoji + '</span><span>' + tb.label + '</span>';
        h += '</button>';
      }
      h += '</div>';

      var bodyStyle = this._tab === 'chat' ? 'padding:0;overflow:hidden;' : '';
      h += '<div class="tr-body" style="' + bodyStyle + '">';
      
      if (this._tab === 'members')  h += this.renderMembers(t);
      else if (this._tab === 'chat')     h += this.renderChat(t);
      else if (this._tab === 'treasury') h += this.renderTreasury(t);
      else if (this._tab === 'develop')  h += this.renderDevelop(t);
      else if (this._tab === 'shop')     h += this.renderShop(t);
      else if (this._tab === 'quests')   h += this.renderQuests(t);
      else if (this._tab === 'log')      h += this.renderLog(t);
      
      h += '</div>';
    }

    inner.innerHTML = h;
    if (this._tab === 'chat') this.scrollChat();
  },

  renderNoTribe: function () {
    var st = this.ctx.state;
    var h = '';
    h += '<div class="tr-empty" style="padding:20px 12px">';
    h +=   '<div class="big">🏴</div>';
    h +=   '<div style="font-size:16px;font-weight:900;color:#fcd34d;margin-bottom:6px">ما عندك قبيلة</div>';
    h +=   '<div style="font-size:12px;color:#94a3b8">اختر قبيلة من القائمة وانضم لها</div>';
    h += '</div>';

    h += '<div class="tr-section">';
    h +=   '<h3>🏴 القبائل المتاحة <span class="cnt">' + st.tribeList.length + '</span></h3>';
    for (var i = 0; i < st.tribeList.length; i++) {
      var t = st.tribeList[i];
      var members = (t.members || []).length;
      h += '<div class="tr-item">';
      h +=   '<div class="logo" style="background:' + this.hex(t.color, .15) + ';border-color:' + t.color + '">' + (t.img ? '<img src="' + t.img + '" style="width:100%;height:100%;object-fit:contain">' : t.emoji) + '</div>';
      h +=   '<div class="info">';
      h +=     '<div class="nm">' + this.esc(t.name) + '</div>';
      h +=     '<div class="motto">"' + this.esc(t.motto) + '"</div>';
      h +=     '<div class="stats">';
      h +=       '<span>Lv <b>' + t.level + '</b></span>';
      h +=       '<span>👥 <b>' + members + '/' + this.getMaxMembers() + '</b></span>';
      h +=       '<span>💰 <b>' + this.fmt(t.treasury) + '</b></span>';
      h +=     '</div>';
      h +=   '</div>';
      h +=   '<button class="tr-btn gold" data-tr="join" data-v="' + t.id + '"' + (members >= this.getMaxMembers() ? ' disabled' : '') + '>انضم</button>';
      h += '</div>';
    }
    h += '</div>';
    return h;
  },

  renderChat: function (t) {
    var h = '';
    h += '<div class="tr-chat-wrap">';
    h +=   '<div class="tr-chat-msgs" id="tr-chat-msgs">';
    h +=     this.getChatHTML();
    h +=   '</div>';
    h +=   '<div class="tr-chat-inputrow">';
    h +=     '<input id="tr-chat-input" type="text" placeholder="اكتب رسالة للقبيلة..." maxlength="200">';
    h +=     '<button data-tr="send-chat">➤</button>';
    h +=   '</div>';
    h += '</div>';
    return h;
  },

  getChatHTML: function () {
    var st = this.ctx.state;
    var msgs = st.tribe.chat || [];
    if (!msgs.length) {
      return '<div style="text-align:center;color:#94a3b8;font-size:12px;padding:30px">لا رسائل بعد. ابدأ المحادثة!</div>';
    }
    var h = '';
    for (var i = 0; i < msgs.length; i++) {
      var m = msgs[i];
      if (m.from === 'system') {
        h += '<div class="tr-chat-msg system">' + this.esc(m.text) + '</div>';
      } else if (m.from === 'me') {
        h += '<div class="tr-chat-msg me">' + this.esc(m.text) + '</div>';
      } else {
        h += '<div class="tr-chat-msg bot">';
        h +=   '<div class="tr-chat-name">' + m.emoji + ' ' + this.esc(m.name) + '</div>';
        h +=   this.esc(m.text);
        h += '</div>';
      }
    }
    return h;
  },

  renderChatBody: function () {
    var el = document.getElementById('tr-chat-msgs');
    if (el) el.innerHTML = this.getChatHTML();
  },

  scrollChat: function () {
    var el = document.getElementById('tr-chat-msgs');
    if (el) el.scrollTop = el.scrollHeight;
  },

  renderMembers: function (t) {
    var members = t.members.slice().sort(function (a, b) {
      var order = { leader: 0, officer: 1, member: 2 };
      return (order[a.rank] || 9) - (order[b.rank] || 9);
    });

    var h = '';
    h += '<div class="tr-card" style="border-color:' + t.color + '">';
    h +=   '<div class="logo" style="background:' + this.hex(t.color, .15) + ';border-color:' + t.color + '">' + (t.img ? '<img src="' + t.img + '" style="width:100%;height:100%;object-fit:contain">' : t.emoji) + '</div>';
    h +=   '<div class="info">';
    h +=     '<div class="nm">' + this.esc(t.name) + '</div>';
    h +=     '<div class="meta">';
    h +=       '<span class="lvl">⭐ Lv ' + t.level + '</span>';
    h +=       '<span>👥 ' + t.members.length + '/' + this.getMaxMembers() + '</span>';
    h +=     '</div>';
    h +=     '<div style="font-size:11px;color:#94a3b8;font-style:italic;margin-top:4px">"' + this.esc(t.motto) + '"</div>';
    h +=   '</div>';
    h += '</div>';

    h += '<div class="tr-section">';
    h +=   '<h3>👥 الأعضاء <span class="cnt">' + members.length + '</span></h3>';
    for (var i = 0; i < members.length; i++) {
      var m = members[i];
      var r = this.RANKS[m.rank] || this.RANKS.member;
      var isMe = m.id === 'me';
      h += '<div class="tr-mrow' + (isMe ? ' me' : '') + '">';
      h +=   '<div class="tr-av">' + this.esc(m.emoji) + '</div>';
      h +=   '<div class="tr-minfo">';
      h +=     '<div class="tr-mname">' + this.esc(m.name) + (isMe ? ' (أنت)' : '') + '</div>';
      h +=     '<div class="tr-mmeta">Lv ' + m.level + '</div>';
      h +=   '</div>';
      h +=   '<span class="tr-rank" style="color:' + r.color + ';background:' + this.hex(r.color, .15) + ';border:1px solid ' + this.hex(r.color, .4) + '">' + r.emoji + ' ' + r.name + '</span>';
      h += '</div>';
    }
    h += '</div>';
    return h;
  },

  renderTreasury: function (t) {
    var st = this.ctx.state;
    var h = '';
    h += '<div class="tr-section">';
    h +=   '<h3>💰 خزنة القبيلة</h3>';
    h +=   '<div style="text-align:center;padding:14px 8px;background:linear-gradient(180deg,rgba(252,191,73,.1),transparent);border-radius:12px;margin-bottom:10px">';
    h +=     '<div style="font-size:11px;color:#94a3b8">الذهب المتوفر</div>';
    h +=     '<div style="font-size:28px;font-weight:900;color:#fcd34d;margin-top:4px">💰 ' + this.fmt(t.treasury) + '</div>';
    h +=     '<div style="font-size:11px;color:#94a3b8;margin-top:8px">الجواهر المتوفرة</div>';
    h +=     '<div style="font-size:24px;font-weight:900;color:#a78bfa;margin-top:2px">💎 ' + this.fmt(t.gems || 0) + '</div>';
    h +=     '<div style="font-size:11px;color:#94a3b8;margin-top:4px">تبرّعاتك: ' + this.fmt(st.tribe.donations || 0) + '</div>';
    h +=   '</div>';
    h +=   '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">';
    h +=     '<button class="tr-btn gold" data-tr="donate" data-v="1000|coins">💰 1K ذهب</button>';
    h +=     '<button class="tr-btn gold" data-tr="donate" data-v="10000|coins">💰 10K ذهب</button>';
    h +=     '<button class="tr-btn blue" data-tr="donate" data-v="50|gems">💎 50 جوهرة</button>';
    h +=     '<button class="tr-btn blue" data-tr="donate" data-v="200|gems">💎 200 جوهرة</button>';
    h +=   '</div>';
    h +=   '<div style="font-size:10px;color:#94a3b8;margin-top:8px;text-align:center">التبرعات تزيد رصيد الخزنة المشترك</div>';
    h += '</div>';
    return h;
  },

  renderShop: function (t) {
    var st = this.ctx.state;
    var h = '';
    h += '<div class="tr-section">';
    h +=   '<h3>🛒 سوق سفن القبيلة</h3>';
    h +=   '<div style="font-size:11px;color:#94a3b8;margin-bottom:10px">💎 الخزنة: ' + this.fmt(t.gems || 0) + ' · نسخة واحدة من كل نوع (3 أنواع متاحة)</div>';

    for (var i = 0; i < this.TRIBE_SHIPS.length; i++) {
      var ship = this.TRIBE_SHIPS[i];
      var owned = null;
      if (st.ships) {
        for (var j = 0; j < st.ships.length; j++) {
          if (st.ships[j].isTribeShip && st.ships[j].code === ship.code) owned = st.ships[j];
        }
      }

      h += '<div class="tr-item" style="align-items:flex-start;flex-direction:column;gap:8px;padding:14px">';
      h +=   '<div style="display:flex;width:100%;align-items:center;gap:12px">';
      h +=     '<div class="logo" style="border-color:#fcd34d;background:rgba(252,191,73,.1)">' + ship.emoji + '</div>';
      h +=     '<div class="info">';
      h +=       '<div class="nm">' + ship.name + '</div>';
      h +=       '<div class="motto">' + ship.desc + '</div>';
      h +=     '</div>';
      h +=   '</div>';

      if (!owned) {
        h += '<button class="tr-btn blue" data-tr="buy-ship" data-v="' + ship.code + '" style="width:100%;margin-top:6px">شراء بـ ' + ship.cost + ' 💎</button>';
      } else {
        h += '<div style="width:100%;padding:10px;border-radius:10px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.1)">';
        h +=   '<div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px">';
        h +=     '<span>مستوى السفينة:</span>';
        h +=     '<b style="color:#fcd34d">Lv ' + (owned.level || 1) + ' / 5</b>';
        h +=   '</div>';
        if ((owned.level || 1) < 5) {
          var upgCosts = { 1: 50, 2: 100, 3: 200, 4: 400 };
          var upgCost = upgCosts[owned.level || 1];
          h += '<button class="tr-btn gold" data-tr="upgrade-ship" data-v="' + owned.id + '" style="width:100%">ترقية بـ ' + upgCost + ' 💎</button>';
        }
        h += '</div>';
      }
      h += '</div>';
    }

    h += '</div>';
    return h;
  },

  renderQuests: function (t) {
    var st = this.ctx.state;
    var h = '';
    h += '<div class="tr-section">';
    h +=   '<h3>🎯 مهام القبيلة اليومية</h3>';
    for (var i = 0; i < this.QUESTS.length; i++) {
      var q = this.QUESTS[i];
      var progress = this.questProgress(q);
      var complete = progress >= q.target;
      var claimed = !!st.tribe.quests[q.id];
      var pct = Math.min(100, (progress / q.target) * 100);
      var cls = claimed ? 'claimed' : (complete ? 'complete' : '');

      h += '<div class="tr-q ' + cls + '">';
      h +=   '<div class="tr-q-head">';
      h +=     '<div class="tr-q-ico">' + q.icon + '</div>';
      h +=     '<div class="tr-q-txt">';
      h +=       '<div class="tr-q-title">' + q.title + '</div>';
      h +=       '<div class="tr-q-desc">' + q.desc + '</div>';
      h +=     '</div>';
      h +=     '<div class="tr-q-rew">' + (q.reward.coins ? '+' + q.reward.coins + ' 💰' : '+' + q.reward.gems + ' 💎') + '</div>';
      h +=   '</div>';
      h +=   '<div class="tr-q-bar"><div class="tr-q-fill' + (complete ? ' done' : '') + '" style="width:' + pct + '%"></div></div>';
      h +=   '<div class="tr-q-foot">';
      h +=     '<span>' + progress.toLocaleString() + ' / ' + q.target.toLocaleString() + '</span>';
      if (claimed) {
        h += '<span style="color:#86efac;font-weight:900">✓ مُستلم</span>';
      } else if (complete) {
        h += '<button class="tr-btn gold" data-tr="claim" data-v="' + q.id + '" style="padding:5px 12px;font-size:11px">🎁 استلم</button>';
      } else {
        h += '<span style="color:#94a3b8">قيد التقدم</span>';
      }
      h +=   '</div>';
      h += '</div>';
    }
    h += '</div>';
    return h;
  },

  renderLog: function (t) {
    var h = '';
    h += '<div class="tr-section">';
    h +=   '<h3>📜 سجل الأحداث <span class="cnt">' + ((t.log || []).length) + '</span></h3>';
    if (!t.log || !t.log.length) {
      h += '<div class="tr-empty" style="padding:24px"><div class="big">📜</div>لا أحداث بعد</div>';
    } else {
      for (var i = 0; i < t.log.length; i++) {
        var e = t.log[i];
        h += '<div class="tr-log">' + this.esc(e.text) + '<div class="time">' + this.fmtTime(e.at) + '</div></div>';
      }
    }
    h += '</div>';
    return h;
  },

  hex: function (h, a) {
    if (!h || h.length !== 7 || h[0] !== '#') return 'rgba(255,255,255,' + (a || .5) + ')';
    var r = parseInt(h.slice(1,3), 16);
    var g = parseInt(h.slice(3,5), 16);
    var b = parseInt(h.slice(5,7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + (a || .5) + ')';
  },

  fmt: function (n) {
    n = n || 0;
    if (n >= 1e9) return (n/1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
    return n.toLocaleString();
  },

  fmtTime: function (ms) {
    var diff = Date.now() - ms;
    if (diff < 60000) return 'الآن';
    if (diff < 3600000) return Math.floor(diff/60000) + 'د';
    if (diff < 86400000) return Math.floor(diff/3600000) + 'س';
    if (diff < 604800000) return Math.floor(diff/86400000) + ' يوم';
    var d = new Date(ms);
    return d.getDate() + '/' + (d.getMonth()+1);
  },

  esc: function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c];
    });
  }
});
