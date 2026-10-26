'use strict';
/* ════════════ الخلفيات (5 صور موجودة فعلاً) ════════════ */
const BACKGROUNDS = [
  {id:'bg_storm',   cat:'backgrounds', icon:'⛈', name:'العاصفة',   img:'assets/backgrounds/bg_storm.jpg',   price_coins:0,     rarity:'common'},
  {id:'bg_day',     cat:'backgrounds', icon:'☀️', name:'النهار',    img:'assets/backgrounds/bg_day.jpg',     price_coins:5000,  rarity:'common'},
  {id:'bg_sunset',  cat:'backgrounds', icon:'🌅', name:'الغروب',    img:'assets/backgrounds/bg_sunset.jpg',  price_coins:10000, rarity:'uncommon'},
  {id:'bg_night',   cat:'backgrounds', icon:'🌙', name:'الليل',     img:'assets/backgrounds/bg_night.jpg',   price_coins:20000, rarity:'rare'},
  {id:'bg_crystal', cat:'backgrounds', icon:'💎', name:'الكريستال', img:'assets/backgrounds/bg_crystal.png', price_coins:50000, rarity:'epic'},
];

const SHIP_BY_ID = Object.fromEntries(SHIPS.map(s => [s.id, s]));
const ITEM_BY_ID = Object.fromEntries([...SHIPS, ...BACKGROUNDS].map(i => [i.id, i]));
const LEGACY_SHIP = { boat_small: 'ship_1', basic: 'ship_1' };
const LEGACY_BG = { bg_titan: 'bg_storm' };

