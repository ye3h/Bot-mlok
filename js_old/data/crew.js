/* ═══════════════════════════════════════════════════════════════
   crew.js — الطواقم والقوالب
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.CREW_DEFS = {
  sailor:  { name:'بحار',       icon:'⛵', desc:'يسرّع الصيد 40% لمدة 24 ساعة', price:3000000, duration:24*3600e3, effect:'speed' },
  murshid: { name:'مرشد سمك',   icon:'🧭', desc:'يخبرك بنوع السمك المصطاد',      price:3000000, duration:24*3600e3, effect:'info'  },
  lucky:   { name:'طاقم الحظ',  icon:'🍀', desc:'يضاعف كمية الصيد',              price:3000000, duration:24*3600e3, effect:'double' },
  police:  { name:'شرطي',       icon:'👮', desc:'يحمي من السرقة',                price:1000000, duration:20*3600e3, effect:'protect' },
  thief:   { name:'لص',         icon:'🥷', desc:'يسرق السفن المحمية',            price:1000000, duration:20*3600e3, effect:'steal' }
};

console.log('[Data/Crew] ' + Object.keys(CREW_DEFS).length + ' طاقم مسجل');
