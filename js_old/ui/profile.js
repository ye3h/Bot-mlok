/* ═══════════════════════════════════════════════════════════════
   profile.js — واجهة الملف الشخصي
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.ProfileUI = {
  render: function() {
    var rank = ProfileUI.getRank();
    return '<div class="list-item">' +
      '<div class="emoji">' + rank.icon + '</div>' +
      '<div class="list-item-info">' +
        '<div class="list-item-name">' + STATE.username + '</div>' +
        '<div class="list-item-desc">' + rank.name + ' · المستوى ' + STATE.level + '</div>' +
      '</div></div>';
  },
  getRank: function() {
    var r = RANK_DEFS.rookie;
    Object.keys(RANK_DEFS).forEach(function(k) {
      if (STATE.level >= RANK_DEFS[k].minLevel) r = RANK_DEFS[k];
    });
    return r;
  }
};

console.log('[UI/Profile] جاهز');
