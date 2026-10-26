/* ═══════════════════════════════════════════════════════════════
   daily.js — المكافآت اليومية
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.DAILY_REWARDS = [
  { coins:2000 }, { coins:5000 }, { crew:'lucky' }, { coins:10000 },
  { weapon:'rocket_small' }, { coins:20000 }, { shield:'shield_basic' },
  { coins:50000 }, { crew:'sailor' }, { balance:1 }, { coins:100000 },
  { weapon:'rocket_medium' }, { crew:'murshid' }, { coins:200000 },
  { shield:'shield_iron' }, { weapon:'rocket_large' }, { coins:500000 },
  { crew:'police' }, { balance:3 }, { coins:1000000 },
  { weapon:'lightning' }, { shield:'shield_steel' }, { coins:2000000 },
  { crew:'thief' }, { weapon:'hurricane' }, { balance:5 }, { coins:5000000 },
  { weapon:'bomb_atomic' }, { coins:10000000 }, { balance:10 }
];

function todayKey() {
  return new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);
}

function rewardInfo(r) {
  if (r.coins)   return { icon: '💰', text: r.coins.toLocaleString() + ' 💰' };
  if (r.balance) return { icon: '💎', text: r.balance + ' 💎' };
  if (r.crew)    return { icon: CREW_DEFS[r.crew].icon, text: CREW_DEFS[r.crew].name };
  if (r.weapon)  return { icon: WEAPON_DEFS[r.weapon].icon, text: WEAPON_DEFS[r.weapon].name };
  return { icon: SHIELD_DEFS[r.shield].icon, text: SHIELD_DEFS[r.shield].name };
}

window.renderDaily = function() {
  var body = document.getElementById('dailyBody');
  if (!body) return;
  var d = STATE.daily;
  var claimed = d.lastDate === todayKey();
  var cnt = d.count >= 30 ? 0 : d.count;
  var cards = DAILY_REWARDS.map(function(r, i) {
    var info = rewardInfo(r);
    var done = i < cnt;
    var now = !claimed && i === cnt;
    return '<div class="day-card ' + (done ? 'done' : now ? 'now' : '') + '">' +
      '<div class="dc-day">اليوم ' + (i + 1) + '</div>' +
      '<div class="dc-icon">' + info.icon + '</div>' +
      '<div class="dc-txt">' + (done ? '✓ ' : '') + info.text + '</div></div>';
  }).join('');
  var action = claimed
    ? '<div class="empty">✓ استلمت مكافأة اليوم<br>عُد غداً</div>'
    : '<button class="gold-btn" style="width:100%;padding:16px;font-size:17px" onclick="claimDaily()">استلام مكافأة اليوم ' + (cnt + 1) + '</button>';
  body.innerHTML = '<div style="text-align:center;margin-bottom:20px">' +
    '<div style="font-size:60px">🎁</div>' +
    '<div style="color:var(--muted);font-size:13px">' + cnt + '/30</div></div>' +
    '<div class="days">' + cards + '</div>' + action;
};

window.claimDaily = function() {
  var d = STATE.daily;
  var today = todayKey();
  if (d.lastDate === today) { UI.toast('استلمت بالفعل'); return; }
  if (d.count >= 30) d.count = 0;
  var r = DAILY_REWARDS[d.count];
  if (r.coins)   STATE.coins += r.coins;
  if (r.balance) STATE.balance += r.balance;
  if (r.crew)    STATE.inventory.crew[r.crew] = (STATE.inventory.crew[r.crew] || 0) + 1;
  if (r.weapon)  STATE.inventory.weapons[r.weapon] = (STATE.inventory.weapons[r.weapon] || 0) + 1;
  if (r.shield)  STATE.inventory.shields[r.shield] = (STATE.inventory.shields[r.shield] || 0) + 1;
  d.count++;
  d.lastDate = today;
  UI.toast('🎁 ' + rewardInfo(r).text);
  updateHud(); renderDaily(); Store.save();
};

console.log('[System/Daily] جاهز');
