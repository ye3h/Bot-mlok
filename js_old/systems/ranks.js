/* ═══════════════════════════════════════════════════════════════
   ranks.js — الرتب والمكافآت
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.RankSystem = {
  getRank: function() {
    var r = RANK_DEFS.rookie;
    Object.keys(RANK_DEFS).forEach(function(k) {
      if (STATE.level >= RANK_DEFS[k].minLevel) r = RANK_DEFS[k];
    });
    return r;
  },
  nextRank: function() {
    var cur = RankSystem.getRank();
    var levels = Object.keys(RANK_DEFS).map(function(k) { return RANK_DEFS[k].minLevel; }).sort(function(a, b) { return a - b; });
    for (var i = 0; i < levels.length; i++) {
      if (levels[i] > STATE.level) {
        for (var k in RANK_DEFS) {
          if (RANK_DEFS[k].minLevel === levels[i]) return RANK_DEFS[k];
        }
      }
    }
    return null;
  },
  check: function() {
    var rank = RankSystem.getRank();
    if (STATE._lastRank !== rank.name) {
      if (STATE._lastRank) {
        UI.toast('🎖️ ترقية إلى ' + rank.name + '!', 3500);
        STATE.coins += 50000;
      }
      STATE._lastRank = rank.name;
      Store.save();
    }
  }
};

window.addEventListener('load', function() {
  setInterval(RankSystem.check, 3000);
});

console.log('[System/Ranks] جاهز');
