/* ═══════════════════════════════════════════════════════════════
   ranks.js — الرتب (شرطة، لصوص، حكاية)
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.RANK_DEFS = {
  rookie:    { name:'مبتدئ',      minLevel:1,  icon:'⚓', desc:'مبتدئ في البحار' },
  sailor:    { name:'بحار',       minLevel:3,  icon:'⛵', desc:'بحار متمرس' },
  captain:   { name:'قبطان',      minLevel:6,  icon:'🎖️', desc:'قبطان معروف' },
  commander: { name:'أميرال',     minLevel:10, icon:'⭐', desc:'أميرال الأسطول' },
  pirate:    { name:'قرصان',      minLevel:15, icon:'🏴‍☠️', desc:'قرصان أسطوري' },
  legend:    { name:'أسطورة',     minLevel:20, icon:'👑', desc:'أسطورة البحار' }
};

window.POLICE_DEFS = {
  patrol:    { name:'دورية',      icon:'🚓', chance:0.3, fine:5000 },
  cruiser:   { name:'طراد',       icon:'🚢', chance:0.2, fine:20000 },
  helicopter:{ name:'هليكوبتر',   icon:'🚁', chance:0.1, fine:50000 }
};

console.log('[Data/Ranks] ' + Object.keys(RANK_DEFS).length + ' رتبة مسجلة');
