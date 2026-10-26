/* ═══════════════════════════════════════════════════════════════
   ships.js — كل السفن (الاسم، المستوى، الصورة، الأسماك)
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.SHIP_DEFS = {
  // ─── المستوى 1 ───
  basic:          { name:'قارب',              level:1, capacity:100,   w:60,  color:'#8a5a2b', icon:'🛶', price:0,          fishTypes:['sardines','flatfish'],        img:'assets/ships/level_01/ship_1.png' },
  advanced:       { name:'لنش',               level:1, capacity:300,   w:80,  color:'#6b4a2b', icon:'🚤', price:900,        fishTypes:['sardines','oyster'],          img:'assets/ships/level_01/ship_2.png' },
  trawler:        { name:'مركب',              level:1, capacity:1000,  w:110, color:'#a03a2a', icon:'🛥️', price:2700,       fishTypes:['shrimp','flatfish'],          img:'assets/ships/level_01/ship_3.png' },
  // ─── المستوى 2 ───
  speedBoat:      { name:'مركب سريع',         level:2, capacity:1200,  w:90,  color:'#2a8ac0', icon:'🚤', price:9000,       fishTypes:['tuna','kingfish'],            img:'assets/ships/level_02/ship_1.png' },
  sailboat:       { name:'مركب شراعي',        level:2, capacity:1800,  w:100, color:'#e0d8c0', icon:'⛵', price:34000,      fishTypes:['oyster','hamour'],            img:'assets/ships/level_02/ship_2.png' },
  schooner:       { name:'سفينة شراعية',      level:2, capacity:2400,  w:120, color:'#c8a060', icon:'⛵', price:48000,      fishTypes:['salmon','hamour'],            img:'assets/ships/level_02/ship_3.png' },
  // ─── المستوى 3 ───
  xship:          { name:'سفينة صيد',         level:3, capacity:3600,  w:130, color:'#3a6b8a', icon:'🚢', price:58000,      fishTypes:['shrimp','sturgeon'],          img:'assets/ships/level_03/ship_1.png' },
  ambush:         { name:'مركب كمين',         level:3, capacity:3800,  w:110, color:'#3a2a5a', icon:'🚤', price:260000,     fishTypes:['lobster','salmon','tuna','crab'], img:'assets/ships/level_03/ship_2.png' },
  bigFishingBoat: { name:'سفينة صيد كبيرة',   level:3, capacity:4500,  w:150, color:'#a0a0a0', icon:'🚢', price:250000,     fishTypes:['salmon','lobster'],           img:'assets/ships/level_03/ship_3.png' },
  // ─── المستوى 4 ───
  yacht:          { name:'يخت',               level:4, capacity:5400,  w:120, color:'#e0e0e0', icon:'🛥️', price:520000,    fishTypes:['silver','shour','salmon'],    img:'assets/ships/level_04/ship_1.png' },
  advancedVessel: { name:'مركب متقدم',        level:4, capacity:10800, w:130, color:'#4a6a8a', icon:'🚢', price:1000000,   fishTypes:['seaSnake','tuna'],            img:'assets/ships/level_04/ship_2.png' },
  iceBoat:        { name:'مركب ثلجي',         level:4, capacity:12800, w:120, color:'#a0d0e0', icon:'🚤', price:2500000,   fishTypes:['carp','cod'],                 img:'assets/ships/level_04/ship_3.png' },
  // ─── المستوى 5 ───
  dredger:        { name:'حفارة',             level:5, capacity:10800, w:130, color:'#6a5a3a', icon:'🚢', price:4000000,   fishTypes:['squid','cod','starfish'],     img:'assets/ships/level_05/ship_1.png' },
  navalExpo:      { name:'معرض البحرية',      level:5, capacity:27000, w:130, color:'#2a4a6a', icon:'🚢', price:10000000,  fishTypes:['shark','cod','carp'],         img:'assets/ships/level_05/ship_2.png' },
  researchCenter: { name:'مركز أبحاث السفن',  level:5, capacity:21600, w:130, color:'#3a6a5a', icon:'🚢', price:60000000,  fishTypes:['jellyfish','cod','seaDevil'], img:'assets/ships/level_05/ship_3.png' },
  submarine:      { name:'غواصة',             level:5, capacity:35000, w:140, color:'#2a4a6a', icon:'🛸', price:80000000,  fishTypes:['krill','sawfish','wildfish'], img:'assets/ships/level_05/ship_4.png', upgradable:true, maxUpgradeLevel:6 }
};

console.log('[Data/Ships] ' + Object.keys(SHIP_DEFS).length + ' سفينة مسجلة');
