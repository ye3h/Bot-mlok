/* ═══════════════════════════════════════════════════════════════
   fish.js — كل الأسماك (الاسم، السعر، الندرة، الصورة، المستوى)
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.FISH_DEFS = {
  // ─── المستوى 1 ───
  sardines:      { name:'سردين',           icon:'🐟', price:1.75,  level:1, rarity:'common' },
  shrimp:        { name:'روبيان',          icon:'🦐', price:5,     level:1, rarity:'common' },
  sturgeon:      { name:'سمك حفش',         icon:'🐟', price:3,     level:1, rarity:'common' },
  oyster:        { name:'محار',            icon:'🦪', price:2,     level:1, rarity:'common' },
  hamour:        { name:'هامور',           icon:'🐟', price:6,     level:1, rarity:'common' },
  flatfish:      { name:'سمك مفلطح',       icon:'🐟', price:3.2,   level:1, rarity:'common' },
  // ─── المستوى 2 ───
  salmon:        { name:'سلمون',           icon:'🐟', price:4,     level:2, rarity:'uncommon' },
  kingfish:      { name:'كنعد',            icon:'🐟', price:3.5,   level:2, rarity:'uncommon' },
  carp:          { name:'شبوط',            icon:'🐟', price:2.5,   level:2, rarity:'uncommon' },
  cod:           { name:'سمك القد',        icon:'🐟', price:5,     level:2, rarity:'uncommon' },
  mackerel:      { name:'ماكريل',          icon:'🐟', price:4,     level:2, rarity:'uncommon' },
  // ─── المستوى 3 ───
  shark:         { name:'قرش',             icon:'🦈', price:17.5,  level:3, rarity:'rare' },
  squid:         { name:'حبار',            icon:'🦑', price:12,    level:3, rarity:'rare' },
  tuna:          { name:'تونة',            icon:'🐟', price:2.75,  level:3, rarity:'rare' },
  silver:        { name:'سلور',            icon:'🐟', price:2.35,  level:3, rarity:'rare' },
  shour:         { name:'سمك شعور',        icon:'🐟', price:3.05,  level:3, rarity:'rare' },
  lobster:       { name:'كركند',           icon:'🦞', price:5.95,  level:3, rarity:'rare' },
  crab:          { name:'كابوريا',         icon:'🦀', price:3.06,  level:3, rarity:'rare' },
  // ─── المستوى 4 ───
  sawfish:       { name:'أبو منشار',       icon:'🦈', price:5,     level:4, rarity:'epic' },
  wildfish:      { name:'سمك متوحش',       icon:'🐟', price:5,     level:4, rarity:'epic' },
  longnose:      { name:'سمك طويل الأنف',  icon:'🐟', price:5,     level:4, rarity:'epic' },
  predatoreel:   { name:'الثعبان المفترس', icon:'🐍', price:5,     level:4, rarity:'epic' },
  seaSnake:      { name:'الأفعى السمكية',  icon:'🐍', price:3.75,  level:4, rarity:'epic' },
  starfish:      { name:'نجم البحر',       icon:'⭐', price:2.7,   level:4, rarity:'epic' },
  jellyfish:     { name:'قنديل',           icon:'🪼', price:4.1,   level:4, rarity:'epic' },
  seaDevil:      { name:'شيطان البحر',     icon:'🐟', price:7.7,   level:4, rarity:'epic' },
  // ─── المستوى 5 ───
  molamola:      { name:'شمس المحيط',      icon:'🐟', price:9.7,   level:5, rarity:'legendary' },
  leapingTuna:   { name:'التونة الوثابة',  icon:'🐟', price:9.5,   level:5, rarity:'legendary' },
  deepmonster:   { name:'وحش أعماق المحيط', icon:'👹', price:12.45, level:5, rarity:'legendary' },
  seahorse:      { name:'فرس النبي',       icon:'🐡', price:4.5,   level:5, rarity:'legendary' },
  chinesewhale:  { name:'الحوت الصيني',    icon:'🐋', price:25,    level:5, rarity:'legendary' },
  krill:         { name:'كريل',            icon:'🦐', price:3.5,   level:5, rarity:'legendary' },
  japaneseSpiderCrab: { name:'العنكبوت الياباني', icon:'🦀', price:10, level:5, rarity:'legendary' },
  piranha:       { name:'بيرانا',          icon:'🐟', price:7,     level:5, rarity:'legendary' },
  flowerhorn:    { name:'زهرة القرن',      icon:'🐟', price:8,     level:5, rarity:'legendary' },
  mosesSole:     { name:'سمك موسى',        icon:'🐟', price:5,     level:5, rarity:'legendary' },
  marlin:        { name:'مارلين',          icon:'🐟', price:11,    level:5, rarity:'legendary' },
  killerWhale:   { name:'الحوت القاتل',    icon:'🐋', price:17,    level:5, rarity:'legendary' },
  dolphin:       { name:'دولفين',          icon:'🐬', price:13,    level:5, rarity:'legendary' },
  abalone:       { name:'بطلينوس',         icon:'🐚', price:5,     level:5, rarity:'legendary' },
  seahorseRare:  { name:'فرس البحر',       icon:'🐡', price:9,     level:5, rarity:'legendary' },
  octopus:       { name:'أخطبوط',          icon:'🐙', price:6,     level:5, rarity:'legendary' },
  seaUrchin:     { name:'قنفذ البحر',      icon:'🦔', price:5,     level:5, rarity:'legendary' },
  humpbackWhale: { name:'حوت',             icon:'🐋', price:18,    level:5, rarity:'legendary' },
  dugong:        { name:'الأطوم',          icon:'🐋', price:8,     level:5, rarity:'legendary' },
  dragonFish:    { name:'سمكة التنين',     icon:'🐟', price:5,     level:5, rarity:'legendary' },
  mexicanFish:   { name:'السمك المكسيكي',  icon:'🐟', price:3.5,   level:5, rarity:'legendary' },
  arowana:       { name:'أروانا',          icon:'🐟', price:6,     level:5, rarity:'legendary' },
  giantMackerel: { name:'المكاريل',        icon:'🐟', price:4,     level:5, rarity:'legendary' }
};

console.log('[Data/Fish] ' + Object.keys(FISH_DEFS).length + ' سمكة مسجلة');
