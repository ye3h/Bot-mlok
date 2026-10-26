'use strict';
/* ════════════ المهام — Hub يجمع 4 أقسام (v3.1.0) ════════════ */

var _achvSub = 'hub';

function renderAchv() {
  var list = $('achvList');
  if (!list) return;

  if (_achvSub === 'hub') { renderAchvHub(list); return; }
  if (_achvSub === 'achievements') { renderAchvAchievements(list); return; }
  if (_achvSub === 'quests') { renderAchvQuests(list); return; }
  _achvSub = 'hub';
  renderAchvHub(list);
}

function _achvBackBtn() {
  return '<button data-achv-back="1" style="background:rgba(0,0,0,.4);' +
    'border:1.5px solid rgba(252,191,73,.4);color:#fef3c7;padding:8px 14px;' +
    'border-radius:10px;font-family:inherit;font-weight:800;font-size:12px;' +
    'cursor:pointer;margin-bottom:12px">← رجوع</button>';
}

function _achvBindBack(list) {
  var b = list.querySelector('[data-achv-back]');
  if (b) b.addEventListener('click', function () { _achvSub = 'hub'; renderAchv(); });
}

// ═══ Hub الرئيسي ═══
function renderAchvHub(list) {
  var done = ACHIEVEMENTS.filter(function (a) { return state.achv[a.id]; }).length;
  var d = state.dragon || { level: 1, stage: 1, dp: 0, pearls: 0 };
  var bossData = state.boss || { bossCount: 0 };

  var dq = window.ModuleRegistry && window.ModuleRegistry.get('daily_quests');
  var questsLine = 'قريباً';
  if (dq) {
    questsLine = dq.claimedCount() + '/' + dq.QUESTS.length + ' مُستلم';
  }

  var h = '';

  h += '<div class="hero" style="padding:14px;text-align:center;background:' +
       'linear-gradient(180deg,rgba(252,191,73,.15),rgba(180,83,9,.08));' +
       'border:1.5px solid rgba(252,191,73,.4)">';
  h += '<div style="font-size:32px;line-height:1">🏆</div>';
  h += '<div style="font-size:18px;font-weight:900;color:#fbbf24;margin-top:6px">مركز المهام</div>';
  h += '<div style="font-size:11px;color:#94a3b8;margin-top:4px">' +
       'إنجازات: ' + done + '/' + ACHIEVEMENTS.length + ' · ' +
       'تنين: L' + d.level + ' · ' +
       'وحوش: ' + bossData.bossCount +
       '</div>';
  h += '</div>';

  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px">';

  h += _achvCard('quests', '🎯', 'مهام يومية', questsLine,
    'linear-gradient(135deg,rgba(56,189,248,.2),rgba(2,132,199,.1))',
    'rgba(56,189,248,.5)');

  var dragonStatus = d.born ? ('L' + d.level + ' · 🦪' + d.pearls) : (d.hasEgg ? 'بيضة تنمو' : 'لم تبدأ');
  h += _achvCard('dragon', '🐉', 'تنيني', dragonStatus,
    'linear-gradient(135deg,rgba(239,68,68,.2),rgba(127,29,29,.1))',
    'rgba(239,68,68,.5)');

  var bossStatus = bossData.bossCount > 0 ? (bossData.bossCount + ' وحش') : 'لم تقاتل';
  h += _achvCard('boss', '💀', 'الوحش', bossStatus,
    'linear-gradient(135deg,rgba(168,85,247,.2),rgba(76,29,149,.1))',
    'rgba(168,85,247,.5)');

  var ar = state.arena || { score: 0, wins: 0 };
  var arStatus = ar.score > 0 ? ('⭐ ' + ar.score + ' · 🏆 ' + ar.wins) : 'لم تدخل بعد';
  h += _achvCard('arena', '🏟️', 'الأرينا', arStatus,
    'linear-gradient(135deg,rgba(251,146,60,.2),rgba(120,50,10,.1))',
    'rgba(251,146,60,.5)');

  h += _achvCard('achievements', '🏅', 'إنجازات', done + '/' + ACHIEVEMENTS.length,
    'linear-gradient(135deg,rgba(251,191,36,.2),rgba(180,83,9,.1))',
    'rgba(251,191,36,.5)');

  h += '</div>';

  list.innerHTML = h;

  list.querySelectorAll('[data-hub]').forEach(function (el) {
    el.addEventListener('click', function () {
      var act = el.getAttribute('data-hub');
      if (act === 'quests')       { _achvSub = 'quests'; renderAchv(); }
      if (act === 'achievements') { _achvSub = 'achievements'; renderAchv(); }
      if (act === 'dragon') {
        if (typeof beep === 'function') beep(660, 0.08);
        var d2 = window.ModuleRegistry && window.ModuleRegistry.get('dragons');
        if (d2 && typeof d2.open === 'function') d2.open();
      }
      if (act === 'boss') {
        if (typeof beep === 'function') beep(660, 0.08);
        var b = window.ModuleRegistry && window.ModuleRegistry.get('boss');
        if (b && typeof b.open === 'function') b.open();
      }
      if (act === 'arena') {
        if (typeof beep === 'function') beep(660, 0.08);
        var ar = window.ModuleRegistry && window.ModuleRegistry.get('arena');
        if (ar && typeof ar.open === 'function') ar.open();
      }

    });
  });
}

function _achvCard(act, icon, title, sub, bg, border) {
  return '<div data-hub="' + act + '" style="padding:16px 12px;border-radius:16px;' +
    'background:' + bg + ';border:1.5px solid ' + border + ';cursor:pointer;' +
    'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
    'text-align:center;min-height:130px;transition:transform .12s">' +
    '<div style="font-size:44px;line-height:1;filter:drop-shadow(0 4px 8px rgba(0,0,0,.5))">' + icon + '</div>' +
    '<div style="font-size:14px;font-weight:900;color:#fff;margin-top:8px">' + title + '</div>' +
    '<div style="font-size:10px;color:#cbd5e1;margin-top:3px;font-weight:700">' + sub + '</div>' +
    '</div>';
}

// ═══ قسم الإنجازات ═══
function renderAchvAchievements(list) {
  var done = ACHIEVEMENTS.filter(function (a) { return state.achv[a.id]; }).length;
  var h = '';
  h += _achvBackBtn();
  h += '<div class="hero" style="padding:14px;text-align:center">' +
       '<div class="muted">المنجز</div>' +
       '<div class="big" style="font-size:26px">' + done + ' / ' + ACHIEVEMENTS.length + '</div>' +
       '</div>';

  h += '<div style="display:grid;grid-template-columns:1fr;gap:8px">';
  ACHIEVEMENTS.forEach(function (a) {
    var ok = !!state.achv[a.id];
    h += '<div style="display:flex;gap:12px;padding:12px;border-radius:14px;' +
         'background:linear-gradient(180deg,rgba(20,35,60,.85),rgba(12,22,42,.9));' +
         'border:1.5px solid ' + (ok ? 'rgba(252,191,73,.5)' : 'rgba(100,116,139,.3)') + ';' +
         'align-items:center;' + (ok ? '' : 'opacity:.65') + '">';
    h += '<div style="width:48px;height:48px;flex-shrink:0;border-radius:12px;' +
         'background:' + (ok ? 'rgba(252,191,73,.15)' : 'rgba(0,0,0,.35)') + ';' +
         'display:flex;align-items:center;justify-content:center;font-size:24px">' +
         (ok ? '🏆' : '🔒') + '</div>';
    h += '<div style="flex:1;min-width:0">';
    h += '<div style="font-weight:900;font-size:13px;color:#fff">' + a.name + '</div>';
    h += '<div style="font-size:11px;color:#94a3b8;margin-top:2px">' + a.desc + '</div>';
    h += '<div style="font-size:11px;color:' + (ok ? '#86efac' : '#fbbf24') + ';' +
         'font-weight:800;margin-top:4px">' + (ok ? '✓ مكتمل' : '💎 ' + a.gems) + '</div>';
    h += '</div></div>';
  });
  h += '</div>';

  list.innerHTML = h;
  _achvBindBack(list);
}

// ═══ قسم المهام اليومية ═══
function renderAchvQuests(list) {
  var dq = window.ModuleRegistry && window.ModuleRegistry.get('daily_quests');
  if (!dq) {
    list.innerHTML = _achvBackBtn() +
      '<div class="hero" style="text-align:center;padding:40px 20px">' +
      '<div class="muted">موديول المهام غير محمّل</div></div>';
    _achvBindBack(list);
    return;
  }

  dq.ensureState();

  var claimed = dq.claimedCount();
  var total = dq.QUESTS.length;

  var h = '';
  h += _achvBackBtn();

  // Header
  h += '<div style="padding:14px;border-radius:14px;' +
       'background:linear-gradient(180deg,rgba(56,189,248,.15),rgba(2,132,199,.08));' +
       'border:1.5px solid rgba(56,189,248,.45);margin-bottom:12px;' +
       'display:flex;justify-content:space-between;align-items:center">';
  h += '<div style="display:flex;align-items:center;gap:10px">' +
       '<span style="font-size:28px">🎯</span>' +
       '<div><div style="font-size:14px;font-weight:900;9color:#bae6fd">المهام اليومية</div>' +
       '<div style="font-size:10px;color:#94a3b8">تتجدد بعد ' + dq.timeToReset() + '</div></div></div>';
  h += '<div style="font-size:22px;font-weight:900;color:#fbbf24">' + claimed +
       '<span style="color:#94a3b8;margin:0 3px;font-size:14px">/</span>' +
       '<span style="color:#bae6fd;font-size:18px">' + total + '</span></div>';
  h += '</div>';

  // Quests list
  h += '<div style="display:grid;grid-template-columns:1fr;gap:10px">';
  for (var i = 0; i < dq.QUESTS.length; i++) {
    h += _questCard(dq, dq.QUESTS[i]);
  }
  h += '</div>';

  list.innerHTML = h;
  _achvBindBack(list);

  // bind claim buttons
  list.querySelectorAll('[data-claim]').forEach(function (el) {
    el.addEventListener('click', function () {
      var id = el.getAttribute('data-claim');
      var res = dq.claim(id);
      if (res.ok) {
        if (typeof showMessage === 'function') showMessage('✅ ' + res.reward);
      } else {
        var msgs = {
          already_claimed: 'استلمت بالفعل',
          not_complete: 'لم تكتمل بعد',
          not_found: 'خطأ'
        };
        if (typeof showMessage === 'function') showMessage('❌ ' + (msgs[res.error] || 'خطأ'));
      }
      renderAchv();
    });
  });
}

function _questCard(dq, q) {
  var progress = dq.getProgress(q);
  var pct = Math.min(100, (progress / q.target) * 100);
  var complete = dq.isComplete(q);
  var claimed = dq.isClaimed(q);

  var border = claimed ? 'rgba(76,175,80,.5)' : (complete ? 'rgba(251,191,36,.6)' : 'rgba(100,116,139,.3)');
  var bg = claimed
    ? 'linear-gradient(180deg,rgba(27,94,32,.2),rgba(15,25,45,.9))'
    : (complete ? 'linear-gradient(180deg,rgba(180,83,,.2),rgba(15,25,45,.9))' : 'linear-gradient(180deg,rgba(20,35,60,.85),rgba(12,22,42,.9))');

  var h = '';
  h += '<div style="padding:12px;border-radius:14px;background:' + bg + ';' +
       'border:1.5px solid ' + border + '">';

  h += '<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">';
  h += '<div style="width:44px;height:44px;flex-shrink:0;border-radius:12px;' +
       'background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:22px">' +
       q.icon + '</div>';
  h += '<div style="flex:1;min-width:0">';
  h += '<div style="font-weight:900;font-size:13px;color:#fff">' + q.title + '</div>';
  h += '<div style="font-size:11px;color:#94a3b8;margin-top:2px">' + q.desc + '</div>';
  h += '</div>';
  h += '<div style="font-size:11px;font-weight:900;color:' + (claimed ? '#86efac' : '#fbbf24') + '">' +
       (q.reward.coins ? ('+' + q.reward.coins + ' 💰') : ('+' + q.reward.gems + ' 💎')) + '</div>';
  h += '</div>';

  // Progress bar
  h += '<div style="display:flex;justify-content:space-between;font-size:10px;color:#cbd5e1;margin-bottom:4px">';
  h += '<span>التقدم</span><span>' + progress + ' / ' + q.target + '</span>';
  h += '</div>';
  h += '<div style="height:8px;border-radius:4px;background:rgba(0,0,0,.5);overflow:hidden;margin-bottom:10px">';
  var barColor = claimed ? 'linear-gradient(90deg,#4ade80,#16a34a)' : (complete ? 'linear-gradient(90deg,#fbbf24,#d97706)' : 'linear-gradient(90deg,#38bdf8,#0ea5e9)');
  h += '<div style="height:100%;width:' + pct + '%;background:' + barColor + ';transition:width .3s"></div>';
  h += '</div>';

  // Button
  if (claimed) {
    h += '<button disabled style="width:100%;padding:9px;border-radius:10px;border:1.5px solid #4ade80;' +
         'background:rgba(76,175,80,.15);color:#86efac;font-weight:900;font-size:12px;opacity:.7">' +
         '✓ تم الاستلام</button>';
  } else if (complete) {
    h += '<button data-claim="' + q.id + '" style="width:100%;padding:9px;border-radius:10px;border:1.5px solid #fbbf24;' +
         'background:linear-gradient(180deg,#fcd34d,#d97706);color:#1c1917;font-weight:900;font-size:12px;cursor:pointer">' +
         '🎁 استلم المكافأة</button>';
  } else {
    h += '<button disabled style="width:100%;padding:9px;border-radius:10px;border:1.5px solid rgba(100,116,139,.4);' +
         'background:rgba(0,0,0,.3);color:#64748b;font-weight:800;font-size:12px">' +
         'لم تكتمل بعد</button>';
  }

  h += '</div>';
  return h;
}
