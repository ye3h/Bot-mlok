/* ═══════════════════════════════════════════════════════════════
   monster.js — وحش القبيلة
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.MONSTER_DEFS = {
  thunder: { name:'وحش الصاعقة', icon:'👹', maxHp:280000 },
  dragon:  { name:'التنين',       icon:'🐉', maxHp:400000 }
};

window.renderMonster = function() {
  var body = document.getElementById('monsterBody');
  if (!body) return;
  var m = STATE.monster;
  var def = MONSTER_DEFS[m.kind] || MONSTER_DEFS.thunder;
  var pct = Math.max(0, m.hp / m.maxHp * 100);
  var weapons = STATE.inventory.weapons || {};
  var avail = Object.keys(weapons).filter(function(k) { return weapons[k] > 0; });
  var html = '<div style="background:linear-gradient(180deg,#3a0f0f,#1a0505);border:2px solid var(--danger);border-radius:16px;padding:16px;margin-bottom:14px;text-align:center">' +
    '<div style="font-size:80px">' + def.icon + '</div>' +
    '<div style="font-family:\'Lalezar\';font-size:22px;color:var(--danger);margin-top:8px">' + def.name + '</div>' +
    '<div style="height:14px;background:#000;border:1.5px solid var(--danger);border-radius:8px;overflow:hidden;margin:10px 0">' +
    '<div style="height:100%;background:linear-gradient(90deg,#ff2d2d,#ff7a1f);width:' + pct + '%"></div></div>' +
    '<div style="color:var(--muted);font-size:12px">' + m.hp.toLocaleString() + ' / ' + m.maxHp.toLocaleString() + ' HP</div></div>';
  if (m.defeated) {
    html += '<div class="empty">🏆 تم هزيمة الوحش!<br>عد غداً</div>' +
      '<button class="gold-btn" style="width:100%;margin-top:14px" onclick="claimMonsterGift()">استلام الجائزة 🎁</button>';
  } else if (!avail.length) {
    html += '<div class="empty">لا تملك أسلحة<br>اشترِ من السوق 🚀</div>';
  } else {
    html += '<div style="text-align:center;color:var(--muted);margin-bottom:12px">اختر سلاحاً</div>';
    html += avail.map(function(k) {
      var w = WEAPON_DEFS[k];
      return '<div class="list-item" onclick="attackMonster(\'' + k + '\')">' +
        '<div class="emoji">' + w.icon + '</div>' +
        '<div class="list-item-info"><div class="list-item-name">' + w.name + '</div>' +
        '<div class="list-item-desc">ضرر: ' + w.damage.toLocaleString() + ' · متوفر: ' + weapons[k] + '</div></div></div>';
    }).join('');
  }
  body.innerHTML = html;
};

window.attackMonster = function(key) {
  var w = WEAPON_DEFS[key];
  if (!STATE.inventory.weapons[key] || STATE.inventory.weapons[key] <= 0) { UI.toast('غير متوفر'); return; }
  var m = STATE.monster;
  if (m.defeated) { UI.toast('الوحش مهزوم'); return; }
  STATE.inventory.weapons[key]--;
  var dmg = Math.min(w.damage, m.hp);
  m.hp -= dmg;
  STATE.pvpDamage += dmg;
  UI.toast('ضربت الوحش بـ ' + dmg.toLocaleString() + ' 💥');
  if (m.hp <= 0) { m.defeated = true; m.hp = 0; UI.toast('🏆 هزمت الوحش!', 3000); }
  updateHud(); renderMonster(); Store.save();
};

window.claimMonsterGift = function() {
  if (!STATE.monster.defeated) { UI.toast('الوحش لم يُهزم بعد'); return; }
  var reward = 50000 + Math.floor(Math.random() * 200000);
  STATE.coins += reward;
  STATE.totalEarned += reward;
  var gemRoll = Math.random();
  var gemText = '';
  if (gemRoll < 0.3) { STATE.balance += 1; gemText = ' + 💎1'; }
  UI.toast('🎁 +' + reward.toLocaleString() + ' ذهب' + gemText);
  STATE.monster = { kind: STATE.monster.kind === 'thunder' ? 'dragon' : 'thunder', hp: 280000, maxHp: 280000, defeated: false };
  updateHud(); renderMonster(); Store.save();
};

console.log('[System/Monster] جاهز');
