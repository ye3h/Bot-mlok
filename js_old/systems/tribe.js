/* ═══════════════════════════════════════════════════════════════
   tribe.js — القبيلة (محلية)
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.renderTribe = function() {
  var body = document.getElementById('tribeBody');
  if (!body) return;
  if (!STATE.tribeId) {
    body.innerHTML = '<div class="empty" style="padding:30px 10px">' +
      '<div style="font-size:64px;margin-bottom:14px">🏴‍☠️</div>' +
      '<div style="margin-bottom:20px">لم تنضم إلى أي قبيلة بعد</div>' +
      '<button class="gold-btn" style="width:100%" onclick="createTribe()">إنشاء قبيلة (' + CONFIG.TRIBE_COST.toLocaleString() + ' 💰)</button>' +
      '<div style="margin-top:18px;display:flex;flex-direction:column;gap:8px">' +
      ['قراصنة الشمال', 'أسود البحر', 'وحوش المحيط'].map(function(n) {
        return '<button class="ghost-btn" onclick="joinTribe(\'' + n + '\')">الانضمام لـ ' + n + '</button>';
      }).join('') + '</div></div>';
    return;
  }
  var td = STATE.tribeData;
  body.innerHTML = '<div class="empty" style="padding:20px">' +
    '<div style="font-size:64px">' + td.logo + '</div>' +
    '<div style="font-family:\'Lalezar\';font-size:26px;color:var(--gold-2);margin-bottom:6px">' + td.name + '</div>' +
    '<div style="color:var(--muted);font-size:13px;margin-bottom:20px">الشيخ: ' + td.sheikh + '</div>' +
    '<button class="ghost-btn" style="color:var(--danger);border-color:var(--danger);width:100%" onclick="leaveTribe()">مغادرة القبيلة</button></div>';
};

window.createTribe = function() {
  if (STATE.coins < CONFIG.TRIBE_COST) { UI.toast('تحتاج ' + CONFIG.TRIBE_COST.toLocaleString() + ' ذهب'); return; }
  UI.showModal({
    title: 'اسم القبيلة',
    extraHTML: '<input id="tribeNameInput" class="text-input" placeholder="اكتب اسم القبيلة" maxlength="20">',
    buttons: [
      { label: 'إنشاء', primary: true, action: function() {
        var name = (document.getElementById('tribeNameInput').value || '').trim();
        if (!name) { UI.toast('اكتب اسم'); return false; }
        STATE.coins -= CONFIG.TRIBE_COST;
        STATE.tribeId = 'local_' + Date.now();
        STATE.tribeData = { name: name, logo: '🏴‍☠️', sheikh: STATE.username, level: 1, donation: 0 };
        UI.toast('تم إنشاء القبيلة ✅');
        updateHud(); renderTribe(); Store.save();
      }},
      { label: 'إلغاء' }
    ]
  });
};

window.joinTribe = function(name) {
  STATE.tribeId = 'local_' + Date.now();
  STATE.tribeData = { name: name, logo: '🏴‍☠️', sheikh: 'زعيم محلي', level: 1, donation: 0 };
  UI.toast('انضممت للقبيلة ✅');
  renderTribe(); Store.save();
};

window.leaveTribe = function() {
  UI.confirm('هل تريد المغادرة؟', '', function() {
    STATE.tribeId = null;
    STATE.tribeData = null;
    renderTribe(); Store.save();
    UI.toast('غادرت القبيلة');
  });
};

console.log('[System/Tribe] جاهز');
