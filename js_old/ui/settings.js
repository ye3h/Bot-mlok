/* ═══════════════════════════════════════════════════════════════
   settings.js — الإعدادات
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.renderSettings = function() {
  var body = document.getElementById('settingsBody');
  if (!body) return;
  var xpNeed = STATE.level * 1000;
  body.innerHTML = '<div class="list-item" onclick="renamePlayer()">' +
    '<div class="emoji">👤</div>' +
    '<div class="list-item-info"><div class="list-item-name">اسم القبطان</div>' +
    '<div class="list-item-desc">' + STATE.username + ' · اضغط للتعديل</div></div></div>' +
    '<div class="list-item" style="cursor:default">' +
    '<div class="emoji">⭐</div>' +
    '<div class="list-item-info"><div class="list-item-name">المستوى ' + STATE.level + '</div>' +
    '<div class="list-item-desc">XP: ' + STATE.xp.toLocaleString() + ' / ' + xpNeed.toLocaleString() + '</div></div></div>' +
    '<div class="list-item" style="cursor:default">' +
    '<div class="emoji">🏴‍☠️</div>' +
    '<div class="list-item-info"><div class="list-item-name">الأسطول</div>' +
    '<div class="list-item-desc">' + STATE.boats.length + ' من ' + CONFIG.MAX_BOATS + ' سفن</div></div></div>' +
    '<div class="list-item" style="cursor:default">' +
    '<div class="emoji">🐟</div>' +
    '<div class="list-item-info"><div class="list-item-name">الأنواع المكتشفة</div>' +
    '<div class="list-item-desc">' + Object.keys(STATE.discovered).length + ' من ' + Object.keys(FISH_DEFS).length + '</div></div></div>' +
    '<button class="gold-btn" style="width:100%;margin-top:14px;background:linear-gradient(180deg,#ff8a7a,#a0281c);border:#ff8a7a;color:#fff" onclick="confirmReset()">إعادة تعيين</button>' +
    '<div style="text-align:center;color:var(--muted);font-size:11px;margin-top:20px">مملكة القراصنة · ' + CONFIG.GAME_VERSION + '</div>';
};

window.renamePlayer = function() {
  UI.showModal({
    title: 'تعديل الاسم',
    extraHTML: '<input id="renameInput" class="text-input" value="' + STATE.username + '" maxlength="16">',
    buttons: [
      { label: 'حفظ', primary: true, action: function() {
        var v = (document.getElementById('renameInput').value || '').trim();
        if (!v) return false;
        STATE.username = v;
        updateHud(); renderSettings(); Store.save();
        UI.toast('تم الحفظ');
      }},
      { label: 'إلغاء' }
    ]
  });
};

window.confirmReset = function() {
  UI.showModal({
    title: '⚠️ تحذير',
    sub: 'سيتم حذف كل تقدمك. اكتب "حذف" للتأكيد',
    extraHTML: '<input id="resetConfirm" class="text-input" placeholder="اكتب: حذف">',
    buttons: [
      { label: 'حذف الكل', primary: true, action: function() {
        var v = (document.getElementById('resetConfirm').value || '').trim();
        if (v !== 'حذف') { UI.toast('اكتب "حذف" بالضبط'); return false; }
        Store.reset();
      }},
      { label: 'إلغاء' }
    ]
  });
};

console.log('[UI/Settings] جاهز');
