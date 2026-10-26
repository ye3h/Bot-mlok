/* ═══════════════════════════════════════════════════════════════
   rivals.js — المنافسون المحليون + نظام السرقة
   يستخدم: CONFIG, STATE, UI, Store, Fleet
   ═══════════════════════════════════════════════════════════════ */
'use strict';

// ═══════════════════════════════════════════════════════════════
// 1. قائمة المنافسين (10 منافسين بتدرّج حقيقي)
// ═══════════════════════════════════════════════════════════════
window.RIVALS = [
  { id:'rival_1',  name:'أبو سيف',       level:8,  ships:['basic','advanced'],              coins:6000,    avatar:'🦈', guard:0.05, favFish:'hamour' },
  { id:'rival_2',  name:'بحّار النوخذة', level:14, ships:['advanced','trawler'],            coins:18000,   avatar:'⚓', guard:0.08, favFish:'shour' },
  { id:'rival_3',  name:'عقيد الموج',    level:19, ships:['trawler','speedBoat'],           coins:42000,   avatar:'🦅', guard:0.10, favFish:'shrimp' },
  { id:'rival_4',  name:'ليلى الجزر',    level:24, ships:['speedBoat','sailboat'],          coins:90000,   avatar:'🧜', guard:0.12, favFish:'octopus' },
  { id:'rival_5',  name:'جاك المرجان',   level:30, ships:['sailboat','schooner','basic'],   coins:160000,  avatar:'🏴‍☠️', guard:0.15, favFish:'lobster' },
  { id:'rival_6',  name:'سيد الخليج',    level:38, ships:['schooner','xship','advanced'],   coins:310000,  avatar:'🐋', guard:0.18, favFish:'chinesewhale' },
  { id:'rival_7',  name:'سندباد الأعماق',level:45, ships:['xship','ambush','trawler'],      coins:520000,  avatar:'🌊', guard:0.20, favFish:'marlin' },
  { id:'rival_8',  name:'ملكة اللؤلؤ',   level:52, ships:['ambush','bigFishingBoat','speedBoat'], coins:880000, avatar:'💎', guard:0.24, favFish:'octopus' },
  { id:'rival_9',  name:'حارس الفجر',    level:61, ships:['bigFishingBoat','yacht','sailboat'], coins:1400000, avatar:'🌅', guard:0.28, favFish:'tuna' },
  { id:'rival_10', name:'ملك الأساطير',  level:70, ships:['yacht','bigFishingBoat','schooner'], coins:2600000, avatar:'👑', guard:0.32, favFish:'shark' }
];

// فهرس سريع حسب id
window.RIVAL_BY_ID = {};
RIVALS.forEach(function(r) { RIVAL_BY_ID[r.id] = r; });

// ═══════════════════════════════════════════════════════════════
// 2. مبالغ السرقة (حسب المستوى، مع سقف)
// ═══════════════════════════════════════════════════════════════
window.rivalStolenAmount = function(rival, pct) {
  var maxFromRival = Math.floor(rival.coins * pct);
  var hardCap = 5000 + rival.level * 300;
  return Math.min(maxFromRival, hardCap);
};

// ═══════════════════════════════════════════════════════════════
// 3. تحديث ذهب المنافسين تلقائياً (محاكاة "حياة")
// ═══════════════════════════════════════════════════════════════
window.RivalSim = {
  lastTick: 0,
  TICK_MS: 60 * 1000, // كل دقيقة نحدّث الأرقام

  // كل منافس يكسب نسبة من رصيده حسب مستواه
  earnRate: function(rival) {
    return 0.0005 + rival.level * 0.00002; // ~0.05% إلى 0.19% لكل دقيقة
  },

  tick: function() {
    var now = Date.now();
    if (now - this.lastTick < this.TICK_MS) return;
    this.lastTick = now;
    RIVALS.forEach(function(r) {
      var gain = Math.floor(r.coins * RivalSim.earnRate(r));
      r.coins += gain;
    });
    // حفظ
    if (typeof Store !== 'undefined') {
      try {
        var data = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY) || '{}');
        data.rivals = RIVALS.map(function(r) { return { id:r.id, coins:r.coins }; });
        localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(data));
      } catch(e) {}
    }
  },

  // استرجاع أرقام المنافسين عند فتح اللعبة
  restore: function() {
    try {
      var data = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY) || '{}');
      if (data.rivals && Array.isArray(data.rivals)) {
        data.rivals.forEach(function(saved) {
          if (RIVAL_BY_ID[saved.id]) RIVAL_BY_ID[saved.id].coins = saved.coins;
        });
      }
    } catch(e) {}
  }
};

// ═══════════════════════════════════════════════════════════════
// 4. نظام السرقة (رحلة الحرامي)
// ═══════════════════════════════════════════════════════════════
window.Theft = {
  DURATION_MS: 4 * 60 * 1000, // 4 دقائق
  MIN_STEAL_PCT: 0.01,
  MAX_STEAL_PCT: 0.03,

  // حفظ الرحلات النشطة في localStorage
  _saveActive: function() {
    if (typeof Store === 'undefined') return;
    try {
      var data = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY) || '{}');
      data.activeThefts = (STATE.activeThefts || []).map(function(t) {
        return {
          rivalId: t.rivalId,
          startedAt: t.startedAt,
          durationMs: t.durationMs,
          caught: t.caught,
          amount: t.amount
        };
      });
      localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(data));
    } catch(e) {}
  },

  _loadActive: function() {
    try {
      var data = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY) || '{}');
      if (data.activeThefts && Array.isArray(data.activeThefts)) {
        STATE.activeThefts = data.activeThefts;
      } else {
        STATE.activeThefts = [];
      }
    } catch(e) {
      STATE.activeThefts = [];
    }
  },

  // بدء الرحلة
  start: function(rivalId) {
    var rival = RIVAL_BY_ID[rivalId];
    if (!rival) { UI.toast('منافس غير موجود'); return false; }

    // لازم عنده حرامي
    if (!STATE.inventory.crew || !STATE.inventory.crew.thief || STATE.inventory.crew.thief <= 0) {
      UI.toast('تحتاج لص لتنفيذ السرقة');
      return false;
    }

    // لازم سفينة فاضية (غير مشغولة)
    var availableBoat = STATE.boats.find(function(b) { return !b.fishing; });
    if (!availableBoat) {
      UI.toast('كل سفنك مشغولة، انتظر حتى تنتهي');
      return false;
    }

    // خصم اللص
    STATE.inventory.crew.thief--;

    // حساب النتيجة مسبقاً (تُحسم عند العودة)
    var caught = Math.random() < rival.guard;
    var pct = Theft.MIN_STEAL_PCT + Math.random() * (Theft.MAX_STEAL_PCT - Theft.MIN_STEAL_PCT);
    var amount = caught ? 0 : rivalStolenAmount(rival, pct);

    var trip = {
      id: 'theft_' + Date.now(),
      rivalId: rivalId,
      rivalName: rival.name,
      startedAt: Date.now(),
      durationMs: Theft.DURATION_MS,
      caught: caught,
      amount: amount,
      boatId: availableBoat.id,
      status: 'active'
    };

    STATE.activeThefts.push(trip);
    Theft._saveActive();

    UI.toast('🥷 أرسلت الحرامي إلى ' + rival.name + ' — سيصل بعد 4 دقائق', 3500);
    if (typeof updateHud === 'function') updateHud();
    if (typeof Store !== 'undefined') Store.save();
    return true;
  },

  // كم بقي من الوقت
  remaining: function(trip) {
    var elapsed = Date.now() - trip.startedAt;
    return Math.max(0, trip.durationMs - elapsed);
  },

  // هل انتهت الرحلة؟
  isComplete: function(trip) {
    return Theft.remaining(trip) <= 0;
  },

  // إكمال الرحلة (تحصيل النتيجة)
  collect: function(tripId) {
    if (!STATE.activeThefts) return;
    var idx = STATE.activeThefts.findIndex(function(t) { return t.id === tripId; });
    if (idx === -1) return;
    var trip = STATE.activeThefts[idx];
    if (!Theft.isComplete(trip)) {
      UI.toast('لم تُكمل الرحلة بعد — المتبقي: ' + Math.ceil(Theft.remaining(trip) / 1000) + 'ث');
      return;
    }

    var rival = RIVAL_BY_ID[trip.rivalId];
    var msg = '';
    if (trip.caught) {
      msg = '🚨 اكتشف ' + trip.rivalName + ' الحرامي وهرب!';
    } else if (trip.amount > 0 && rival) {
      STATE.coins += trip.amount;
      rival.coins = Math.max(0, rival.coins - trip.amount);
      STATE.totalEarned += trip.amount;
      STATE.successfulSteals = (STATE.successfulSteals || 0) + 1;
      msg = '🥷 نجحت! +' + trip.amount.toLocaleString() + ' ذهب من ' + trip.rivalName;
    } else {
      msg = 'لم تحصل على شيء';
    }

    STATE.activeThefts.splice(idx, 1);
    Theft._saveActive();
    UI.toast(msg, 3500);
    if (typeof updateHud === 'function') updateHud();
    if (typeof Store !== 'undefined') Store.save();
    if (typeof renderRivalsScreen === 'function') renderRivalsScreen();
    return { caught: trip.caught, amount: trip.amount, rivalName: trip.rivalName };
  },

  // إلغاء رحلة (بدون غنيمة)
  cancel: function(tripId) {
    if (!STATE.activeThefts) return;
    var idx = STATE.activeThefts.findIndex(function(t) { return t.id === tripId; });
    if (idx === -1) return;
    STATE.activeThefts.splice(idx, 1);
    Theft._saveActive();
    UI.toast('تم إلغاء الرحلة');
    if (typeof renderRivalsScreen === 'function') renderRivalsScreen();
    if (typeof Store !== 'undefined') Store.save();
  },

  // تنظيف الرحلات المنتهية + تحصيلها تلقائياً (عند فتح اللعبة مثلاً)
  autoCollectExpired: function() {
    if (!STATE.activeThefts || !STATE.activeThefts.length) return;
    var complete = STATE.activeThefts.filter(Theft.isComplete);
    complete.forEach(function(t) { Theft.collect(t.id); });
  }
};

// ═══════════════════════════════════════════════════════════════
// 5. دالة الترتيب (تُستخدم في leaderboard.js)
// ═══════════════════════════════════════════════════════════════
window.getRivalLeaderboard = function() {
  return RIVALS.map(function(r) {
    return {
      id: r.id,
      name: r.name,
      avatar: r.avatar,
      coins: r.coins,
      level: r.level,
      isMe: false
    };
  }).concat([{
    id: 'me',
    name: STATE.username || 'أنا',
    avatar: '🏴‍☠️',
    coins: STATE.totalEarned || 0,
    level: STATE.level || 1,
    isMe: true
  }]).sort(function(a, b) { return b.coins - a.coins; });
};

// ═══════════════════════════════════════════════════════════════
// 6. واجهة شاشة المنافسين
// ═══════════════════════════════════════════════════════════════
window.renderRivalsScreen = function() {
  var body = document.getElementById('rivalsBody');
  if (!body) return;

  Theft._loadActive();

  var html = '';

  // الرحلات النشطة أول شي
  if (STATE.activeThefts && STATE.activeThefts.length) {
    html += '<div style="margin-bottom:16px;padding:12px;background:rgba(255,90,90,.15);border:1.5px solid var(--danger);border-radius:14px">';
    html += '<div style="color:var(--danger);font-weight:bold;margin-bottom:8px">🥷 رحلات السرقة النشطة</div>';
    STATE.activeThefts.forEach(function(t) {
      var left = Math.ceil(Theft.remaining(t) / 1000);
      var mins = Math.floor(left / 60);
      var secs = left % 60;
      html += '<div class="list-item" style="cursor:default">' +
        '<div class="emoji">🥷</div>' +
        '<div class="list-item-info">' +
          '<div class="list-item-name">' + t.rivalName + '</div>' +
          '<div class="list-item-desc">المتبقي: ' + mins + ':' + (secs < 10 ? '0' : '') + secs + '</div>' +
        '</div>' +
        '<button class="ghost-btn" style="font-size:12px;padding:6px 10px" onclick="Theft.cancel(\\'' + t.id + '\\')">إلغاء</button>' +
      '</div>';
    });
    html += '</div>';
  }

  // قائمة المنافسين
  html += '<div style="color:var(--gold-2);font-weight:bold;margin-bottom:8px;font-size:15px">🎯 اختر منافساً للسرقة</div>';

  var hasThief = STATE.inventory.crew && STATE.inventory.crew.thief > 0;
  var hasFreeBoat = STATE.boats.some(function(b) { return !b.fishing; });

  RIVALS.forEach(function(r) {
    var shipIcons = r.ships.map(function(s) {
      var def = SHIP_DEFS[s];
      return def ? def.icon : '❓';
    }).join(' ');

    var guardPct = Math.round(r.guard * 100);
    var guardLabel = guardPct < 10 ? 'حماية ضعيفة' :
                     guardPct < 20 ? 'حماية متوسطة' :
                     guardPct < 30 ? 'حماية قوية' : 'حماية أسطورية';

    var canSteal = hasThief && hasFreeBoat;
    var style = canSteal ? '' : 'opacity:.5;';

    html += '<div class="list-item" style="' + style + '" ' +
      (canSteal ? 'onclick="confirmSteal(\\'' + r.id + '\\')"' : '') + '>' +
      '<div class="emoji" style="font-size:32px">' + r.avatar + '</div>' +
      '<div class="list-item-info">' +
        '<div class="list-item-name">' + r.name + ' · مستوى ' + r.level + '</div>' +
        '<div class="list-item-desc">' + shipIcons + '</div>' +
        '<div class="list-item-desc" style="color:#ff8a7a">' + guardLabel + ' (' + guardPct + '%)</div>' +
        '<div class="list-item-price">' + r.coins.toLocaleString() + ' 💰</div>' +
      '</div>' +
    '</div>';
  });

  if (!hasThief) {
    html += '<div style="text-align:center;color:var(--muted);font-size:13px;margin-top:14px;padding:12px;background:rgba(255,255,255,.05);border-radius:12px">' +
      '💡 تحتاج لصّاً (🥷) من السوق لتنفيذ السرقة' +
    '</div>';
  } else if (!hasFreeBoat) {
    html += '<div style="text-align:center;color:var(--muted);font-size:13px;margin-top:14px;padding:12px;background:rgba(255,255,255,.05);border-radius:12px">' +
      '💡 كل سفنك مشغولة — انتظر حتى تنتهي رحلة صيد' +
    '</div>';
  }

  body.innerHTML = html;
};

// ═══════════════════════════════════════════════════════════════
// 7. تأكيد السرقة + بدء الرحلة
// ═══════════════════════════════════════════════════════════════
window.confirmSteal = function(rivalId) {
  var rival = RIVAL_BY_ID[rivalId];
  if (!rival) return;

  var guardPct = Math.round(rival.guard * 100);
  var potentialMax = Math.min(Math.floor(rival.coins * 0.03), 5000 + rival.level * 300);

  UI.showModal({
    title: '🥷 سرقة ' + rival.name,
    sub: 'الحماية: ' + guardPct + '%\\n' +
         'الحد الأقصى للسرقة: ~' + potentialMax.toLocaleString() + ' 💰\\n' +
         'المدة: 4 دقائق\\n\\n' +
         'سيُخصم لص واحد من مخزونك',
    buttons: [
      { label: 'إرسال الحرامي', primary: true, action: function() {
        Theft.start(rivalId);
        renderRivalsScreen();
      }},
      { label: 'إلغاء' }
    ]
  });
};

// ═══════════════════════════════════════════════════════════════
// 8. التهيئة عند فتح اللعبة
// ═══════════════════════════════════════════════════════════════
window.addEventListener('load', function() {
  RivalSim.restore();
  RivalSim.lastTick = Date.now();
  setInterval(function() { RivalSim.tick(); }, 30 * 1000);
  setTimeout(function() { Theft.autoCollectExpired(); }, 1500);
});

console.log('[Rivals] جاهز — ' + RIVALS.length + ' منافس مسجل');
