/* ═══════════════════════════════════════════════════════════════
   upgrades.js — الحظ، الحماية، الدروع، السرعة
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.WEAPON_DEFS = {
  rocket_small:  { name:'صاروخ صغير',  icon:'🚀', damage:500,   price:100000,   aoe:false },
  rocket_medium: { name:'صاروخ متوسط', icon:'🚀', damage:2000,  price:400000,   aoe:false },
  rocket_large:  { name:'صاروخ كبير',  icon:'🚀', damage:10000, price:2000000,  aoe:false },
  bomb_atomic:   { name:'قنبلة ذرية',  icon:'💣', damage:70000, price:10000000, aoe:true  },
  lightning:     { name:'البرق',       icon:'⚡', damage:70000, price:10000000, aoe:true  },
  hurricane:     { name:'الإعصار',     icon:'🌀', damage:70000, price:10000000, aoe:true  }
};

window.SHIELD_DEFS = {
  shield_basic: { name:'درع خشبي',   icon:'🛡️', block:200,  price:50000 },
  shield_iron:  { name:'درع حديدي',  icon:'🛡️', block:1500, price:250000 },
  shield_steel: { name:'درع فولاذي', icon:'🛡️', block:8000, price:2000000 }
};

console.log('[Data/Upgrades] أسلحة + دروع مسجلة');
