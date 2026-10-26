/* ═══════════════════════════════════════════════════════════════
   store.js — الحفظ والترحيل
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.Store = {
  save: function() {
    try {
      localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify({
        username: STATE.username, coins: STATE.coins, balance: STATE.balance,
        level: STATE.level, xp: STATE.xp,
        boats: STATE.boats.map(function(b) {
          return { type:b.type, fishing:b.fishing, fishCount:b.fishCount, upgradeLevel:b.upgradeLevel, startedAt:b.startedAt, durationMs:b.durationMs };
        }),
        inventory: STATE.inventory, discovered: STATE.discovered,
        tribeId: STATE.tribeId, tribeData: STATE.tribeData, daily: STATE.daily,
        monster: STATE.monster, totalEarned: STATE.totalEarned,
        totalFishSold: STATE.totalFishSold, successfulSteals: STATE.successfulSteals,
        pvpDamage: STATE.pvpDamage,
        rivals: (window.RIVALS || []).map(function(r){ return { id:r.id, coins:r.coins }; }),
        activeThefts: STATE.activeThefts || []
      }));
    } catch(e) { console.warn('save failed', e); }
  },

  load: function() {
    let raw = null;
    try { raw = localStorage.getItem(CONFIG.SAVE_KEY); } catch(e) {}
    if (!raw) return false;
    try {
      var d = JSON.parse(raw);
      STATE.username = d.username || 'قبطان';
      STATE.coins = d.coins || 0;
      STATE.balance = d.balance || 0;
      STATE.level = d.level || 1;
      STATE.xp = d.xp || 0;
      STATE.discovered = d.discovered || {};
      STATE.tribeId = d.tribeId || null;
      STATE.tribeData = d.tribeData || null;
      STATE.daily = d.daily || { count:0, lastDate:null };
      STATE.monster = d.monster || { kind:'thunder', hp:280000, maxHp:280000, defeated:false };
      STATE.totalEarned = d.totalEarned || 0;
      STATE.totalFishSold = d.totalFishSold || 0;
      STATE.successfulSteals = d.successfulSteals || 0;
      STATE.pvpDamage = d.pvpDamage || 0;
      STATE.activeThefts = d.activeThefts || [];
      STATE.inventory = d.inventory || { crew:{}, weapons:{}, shields:{}, fish:{} };
      if (!STATE.inventory.crew)    STATE.inventory.crew = {};
      if (!STATE.inventory.weapons) STATE.inventory.weapons = {};
      if (!STATE.inventory.shields) STATE.inventory.shields = {};
      if (!STATE.inventory.fish)    STATE.inventory.fish = {};
      var list = (d.boats && d.boats.length) ? d.boats : [{ type:'basic' }];
      STATE.boats = list.map(function(b, i) {
        return { id:i, type:b.type||'basic', fishing:!!b.fishing, fishCount:b.fishCount||0, upgradeLevel:b.upgradeLevel||1, startedAt:b.startedAt||null, durationMs:b.durationMs||null, timer:null };
      });
      return true;
    } catch(e) { console.warn('load failed', e); return false; }
  },

  reset: function() {
    try { localStorage.removeItem(CONFIG.SAVE_KEY); } catch(e) {}
    location.reload();
  }
};

console.log('[System/Store] جاهز');
