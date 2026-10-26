/* ═══════════════════════════════════════════════════════════════
   police.js — الشرطة والمطاردة
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.Police = {
  // احتمال ظهور الشرطة عند السرقة
  checkPatrol: function() {
    var r = Math.random();
    if (r < POLICE_DEFS.patrol.chance) return POLICE_DEFS.patrol;
    if (r < POLICE_DEFS.patrol.chance + POLICE_DEFS.cruiser.chance) return POLICE_DEFS.cruiser;
    if (r < POLICE_DEFS.patrol.chance + POLICE_DEFS.cruiser.chance + POLICE_DEFS.helicopter.chance) return POLICE_DEFS.helicopter;
    return null;
  },
  // غرامة
  fine: function(amount) {
    var actual = Math.min(amount, STATE.coins);
    STATE.coins -= actual;
    if (typeof UI !== 'undefined') UI.toast('غرامة: -' + actual + ' 💰', 3000);
    if (typeof updateHud === 'function') updateHud();
    Store.save();
    return actual;
  }
};

console.log('[System/Police] جاهز');
