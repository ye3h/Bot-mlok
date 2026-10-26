/* ═══════════════════════════════════════════════════════════════
   market.js — الأسعار والبيع
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.Market = {
  sell: function(key) {
    var q = STATE.inventory.fish[key] || 0;
    if (q <= 0) return;
    var earned = Math.floor(q * FISH_DEFS[key].price);
    STATE.coins += earned;
    STATE.totalEarned += earned;
    STATE.totalFishSold += q;
    STATE.inventory.fish[key] = 0;
    if (typeof UI !== 'undefined') UI.toast('+' + earned + ' ذهب 💰');
    if (typeof renderWarehouse === 'function') renderWarehouse();
    if (typeof updateHud === 'function') updateHud();
    Store.save();
  },
  sellAll: function() {
    var total = 0, qty = 0;
    Object.keys(FISH_DEFS).forEach(function(k) {
      var q = STATE.inventory.fish[k] || 0;
      total += Math.floor(q * FISH_DEFS[k].price);
      qty += q;
      STATE.inventory.fish[k] = 0;
    });
    if (total <= 0) { if (typeof UI !== 'undefined') UI.toast('لا يوجد سمك'); return; }
    STATE.coins += total; STATE.totalEarned += total; STATE.totalFishSold += qty;
    if (typeof UI !== 'undefined') UI.toast('+' + total + ' ذهب 💰');
    if (typeof renderWarehouse === 'function') renderWarehouse();
    if (typeof updateHud === 'function') updateHud();
    Store.save();
  }
};

console.log('[System/Market] جاهز');
