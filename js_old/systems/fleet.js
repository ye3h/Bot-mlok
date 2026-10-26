/* ═══════════════════════════════════════════════════════════════
   fleet.js — الرحلات والصيد
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.Fleet = {
  newBoat: function(type) {
    return { id: STATE.boats.length, type:type, fishing:false, fishCount:0, upgradeLevel:1, startedAt:null, durationMs:null, timer:null };
  },
  getCapacity: function(b, lvl) {
    var base = SHIP_DEFS[b.type].capacity;
    return Math.floor(base * (1 + 0.2 * ((lvl || b.upgradeLevel || 1) - 1)));
  },
  progress: function(b) {
    if (!b.fishing || !b.startedAt || !b.durationMs) return b.fishCount || 0;
    var cap = Fleet.getCapacity(b);
    return Math.min(cap, Math.floor((Date.now() - b.startedAt) / b.durationMs * cap));
  },
  start: function(b) {
    if (b.fishing) return;
    var cap = Fleet.getCapacity(b);
    var dur = 30000 + cap * 15;
    b.fishing = true; b.fishCount = 0; b.startedAt = Date.now(); b.durationMs = dur;
    Fleet.runTimer(b);
    if (typeof UI !== 'undefined') UI.toast('بدأ الصيد 🎣');
    if (typeof updateHud === 'function') updateHud();
    Store.save();
  },
  runTimer: function(b) {
    clearInterval(b.timer);
    var tick = function() {
      b.fishCount = Fleet.progress(b);
      if (b.fishCount >= Fleet.getCapacity(b)) {
        clearInterval(b.timer); b.timer = null;
        if (typeof UI !== 'undefined') UI.toast('🎣 ' + SHIP_DEFS[b.type].name + ' امتلأت!', 2600);
      }
      if (typeof updateHud === 'function') updateHud();
    };
    b.timer = setInterval(tick, 1000);
    tick();
  },
  dock: function(b) {
    clearInterval(b.timer); b.timer = null;
    var caught = Fleet.progress(b);
    if (caught > 0) {
      var types = SHIP_DEFS[b.type].fishTypes || ['sardines'];
      var key = types[Math.floor(Math.random() * types.length)];
      STATE.inventory.fish[key] = (STATE.inventory.fish[key] || 0) + caught;
      STATE.discovered[key] = true;
      if (typeof UI !== 'undefined') UI.toast('حصلت على ' + caught + ' ' + FISH_DEFS[key].name + ' 🎣');
    } else if (typeof UI !== 'undefined') UI.toast('لم تحصل على شيء');
    b.fishing = false; b.fishCount = 0; b.startedAt = null; b.durationMs = null;
    if (typeof updateHud === 'function') updateHud();
    Store.save();
  },
  resumeAll: function() {
    STATE.boats.forEach(function(b) { if (b.fishing && b.startedAt) Fleet.runTimer(b); });
  }
};

console.log('[System/Fleet] جاهز');
