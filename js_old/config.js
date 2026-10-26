/* ═══════════════════════════════════════════════════════════════
   config.js — الثوابت العامة
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.CONFIG = {
  SAVE_KEY: 'mpk_v2_save',
  MAX_BOATS: 4,
  TRIBE_COST: 1000000,
  GAME_VERSION: '2.0.0'
};

window.STATE = {
  username: 'قبطان',
  coins: 5000,
  balance: 0,
  level: 1,
  xp: 0,
  boats: [],
  inventory: { crew: {}, weapons: {}, shields: {}, fish: {} },
  discovered: {},
  tribeId: null,
  tribeData: null,
  daily: { count: 0, lastDate: null },
  monster: { kind: 'thunder', hp: 280000, maxHp: 280000, defeated: false },
  totalEarned: 0,
  totalFishSold: 0,
  successfulSteals: 0,
  pvpDamage: 0
};

console.log('[Config] جاهز — v' + CONFIG.GAME_VERSION);
