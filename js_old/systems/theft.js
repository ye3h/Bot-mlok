/* ═══════════════════════════════════════════════════════════════
   theft.js — السرقة والحماية
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.Theft = {
  STEAL_TIME_MS: 4 * 60 * 1000,  // 4 دقائق كحد أدنى
  MAX_STEAL: 500,                 // 500 سمكة كحد أقصى لكل سرقة

  canSteal: function(myBoat, targetBoat) {
    if (!myBoat || !targetBoat) return false;
    if (myBoat._stealing) return false;
    if (!targetBoat.fishing) return false;
    return true;
  },

  start: function(myBoat, targetBoat) {
    if (!Theft.canSteal(myBoat, targetBoat)) return false;
    var maxSteal = Math.min(Theft.MAX_STEAL, targetBoat.fishCount || 0);
    if (maxSteal <= 0) return false;
    myBoat._stealing = true;
    myBoat._stealStart = Date.now();
    myBoat._stealMax = maxSteal;
    myBoat._stealTarget = targetBoat.id;
    if (typeof UI !== 'undefined') UI.toast('بدأت السرقة 🥷');
    return true;
  },

  elapsed: function(myBoat) {
    if (!myBoat._stealing) return 0;
    return Date.now() - (myBoat._stealStart || 0);
  },

  canCollect: function(myBoat) {
    return Theft.elapsed(myBoat) >= Theft.STEAL_TIME_MS;
  },

  finish: function(myBoat, targetBoat) {
    if (!myBoat._stealing) return;
    var stolen = 0;
    if (Theft.canCollect(myBoat)) {
      stolen = myBoat._stealMax || 0;
      STATE.inventory.fish.sardines = (STATE.inventory.fish.sardines || 0) + stolen;
      STATE.successfulSteals++;
      if (typeof UI !== 'undefined') UI.toast('+' + stolen + ' سمكة من السرقة 🥷');
    } else {
      if (typeof UI !== 'undefined') UI.toast('لم يكتمل وقت السرقة');
    }
    myBoat._stealing = false;
    myBoat._stealStart = null;
    myBoat._stealMax = 0;
    myBoat._stealTarget = null;
    Store.save();
  }
};

console.log('[System/Theft] جاهز');
