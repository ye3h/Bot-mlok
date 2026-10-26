/* ═══════════════════════════════════════════════════════════════
   data/fish.js — الأسماك (نسخة مُنقّحة: بدون تكرار)
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.FISH = {
  // ─── COMMON ───
  herring:     { name:'رنجة',           base:2,   rarity:'common', emoji:'🐟', img:'assets/fish/herring.webp' },
  anchovy:     { name:'أنشوجة',          base:2,   rarity:'common', emoji:'🐟', img:'assets/fish/anchovy.webp' },
  sardine:     { name:'سردين',           base:2,   rarity:'common', emoji:'🐟', img:'assets/fish/sardine.webp' },
  smelt:       { name:'سميلت',           base:3,   rarity:'common', emoji:'🐟', img:'assets/fish/smelt.webp' },
  minnow:      { name:'مينو',            base:3,   rarity:'common', emoji:'🐟', img:'assets/fish/minnow.webp' },
  shrimp:      { name:'جمبري',           base:3,   rarity:'common', emoji:'🦐', img:'assets/fish/shrimp.webp' },
  crab_small:  { name:'كابوريا',         base:3,   rarity:'common', emoji:'🦀', img:'assets/fish/crab_small.webp' },
  bass:        { name:'قاروص',           base:4,   rarity:'common', emoji:'🐟', img:'assets/fish/bass.webp' },
  cod:         { name:'قد',              base:4,   rarity:'common', emoji:'🐟', img:'assets/fish/cod.webp' },
  snapper:     { name:'نهّاش',           base:4,   rarity:'common', emoji:'🐟', img:'assets/fish/snapper.webp' },
  trout:       { name:'تراوت',           base:5,   rarity:'common', emoji:'🐟', img:'assets/fish/trout.webp' },
  squid:       { name:'حبار',            base:5,   rarity:'common', emoji:'🦑', img:'assets/fish/squid.webp' },
  lobster:     { name:'لوبستر',          base:5,   rarity:'common', emoji:'🦞', img:'assets/fish/lobster.webp' },
  eel:         { name:'أنقليس',          base:6,   rarity:'common', emoji:'🐟', img:'assets/fish/eel.webp' },
  koi:         { name:'كوي',             base:3,   rarity:'common', emoji:'🐟', img:'assets/fish/koi.webp' },
  salmon:      { name:'سلمون',           base:3,   rarity:'common', emoji:'🐟', img:'assets/fish/salmon.webp' },
  mullet:      { name:'بوري',            base:20,  rarity:'common', emoji:'🐟', img:'assets/fish/mullet.webp' },
  mackerel:    { name:'ماكريل',          base:30,  rarity:'common', emoji:'🐟', img:'assets/fish/mackerel.webp' },

  // ─── UNCOMMON ───
  grouper:     { name:'هامور',           base:7,   rarity:'uncommon', emoji:'🐠', img:'assets/fish/grouper.webp' },
  carp:        { name:'كارب',            base:8,   rarity:'uncommon', emoji:'🐠', img:'assets/fish/carp.webp' },
  marlin:      { name:'مارلين',          base:9,   rarity:'uncommon', emoji:'🐠', img:'assets/fish/marlin.webp' },
  swordfish:   { name:'أبو سيف',         base:8,   rarity:'uncommon', emoji:'🐠', img:'assets/fish/swordfish.webp' },
  barracuda:   { name:'براكودا',         base:10,  rarity:'uncommon', emoji:'🐠', img:'assets/fish/barracuda.webp' },
  stingray:    { name:'راي لاسع',        base:9,   rarity:'uncommon', emoji:'🐠', img:'assets/fish/stingray.webp' },
  arowana:     { name:'أروانا',          base:7,   rarity:'uncommon', emoji:'🐠', img:'assets/fish/arowana.webp' },
  pearl:       { name:'لؤلؤة',           base:5,   rarity:'uncommon', emoji:'🦪', img:'assets/fish/pearl.webp' },
  // مؤقتاً: phoenix.webp غير موجود، نستخدم صورة التونة لحين إضافته
  phoenix:     { name:'عنقاء النار',     base:11,  rarity:'uncommon', emoji:'🔥', img:'assets/fish/tuna.webp' },
  tang_blue:   { name:'تانغ أزرق',       base:10,  rarity:'uncommon', emoji:'🐠', img:'assets/fish/tang_blue.webp' },
  tuna:        { name:'تونة',            base:4,   rarity:'uncommon', emoji:'🐠', img:'assets/fish/tuna.webp' },
  shark:       { name:'قرش',             base:10,  rarity:'uncommon', emoji:'🦈', img:'assets/fish/shark.webp' },
  sailfish:    { name:'سمكة شراعية',     base:10,  rarity:'uncommon', emoji:'🐠', img:'assets/fish/sailfish.webp' },
  flounder:    { name:'فلوندر',          base:10,  rarity:'uncommon', emoji:'🐠', img:'assets/fish/flounder.webp' },
  octopus:     { name:'أخطبوط',          base:200, rarity:'uncommon', emoji:'🐙', img:'assets/fish/octopus.webp' },

  // ─── RARE ───
  manta:       { name:'مانتا',           base:11,  rarity:'rare', emoji:'🐡', img:'assets/fish/manta.webp' },
  whale:       { name:'حوت',             base:11,  rarity:'rare', emoji:'🐋', img:'assets/fish/whale.webp' },
  orca:        { name:'أوركا',           base:11,  rarity:'rare', emoji:'🐋', img:'assets/fish/orca.webp' },
  leviathan:   { name:'لوياثان',         base:12,  rarity:'rare', emoji:'🐋', img:'assets/fish/leviathan.webp' },
  kraken:      { name:'كراكن',           base:14,  rarity:'rare', emoji:'🦑', img:'assets/fish/kraken.webp' },
  black_pearl: { name:'لؤلؤة سوداء',     base:13,  rarity:'rare', emoji:'🖤', img:'assets/fish/black_pearl.webp' },
  goldfish:    { name:'سمكة ذهبية',      base:12,  rarity:'rare', emoji:'🐠', img:'assets/fish/goldfish.webp' },
  hammerhead:  { name:'قرش المطرقة',     base:11,  rarity:'rare', emoji:'🦈', img:'assets/fish/hammerhead.webp' },
  megalodon:   { name:'ميغالودون',       base:12,  rarity:'rare', emoji:'🦈', img:'assets/fish/megalodon.webp' },
  abyss_titan: { name:'تيتان الأعماق',   base:17,  rarity:'rare', emoji:'☠️', img:'assets/fish/abyss_titan.webp' },
  sea_dragon:  { name:'تنين البحر',      base:16,  rarity:'rare', emoji:'🐉', img:'assets/fish/sea_dragon.webp' },

  // ─── EPIC ───
  poseidon:          { name:'بوسايدون',        base:17, rarity:'epic', emoji:'🔱', img:'assets/fish/poseidon.webp' },
  coral_phantom:     { name:'شبح المرجان',     base:30, rarity:'epic', emoji:'🪸', img:'assets/fish/coral_phantom.webp' },
  golden_koi:        { name:'كوي ذهبي',        base:18, rarity:'epic', emoji:'🪙', img:'assets/fish/golden_koi.webp' },
  imperial_moonfish: { name:'قمرية الإمبراطور', base:45, rarity:'epic', emoji:'🌙', img:'assets/fish/imperial_moonfish.webp' },
  royal_amethyst:    { name:'جمشت ملكي',       base:40, rarity:'epic', emoji:'💎', img:'assets/fish/royal_amethyst.webp' },
  diamond_manta:     { name:'مانتا الألماس',    base:50, rarity:'epic', emoji:'💠', img:'assets/fish/diamond_manta.webp' },
  silver_arowana:    { name:'أروانا فضية',     base:34, rarity:'epic', emoji:'🥈', img:'assets/fish/silver_arowana.webp' },

  // ─── KRAKEN EXCLUSIVE (مرة واحدة فقط) ───
  kraken_spawn:  { name:'نسل الكراكن',     base:40, rarity:'epic',   emoji:'🐙', img:'assets/fish/kraken_spawn.png' },
  ink_wraith:    { name:'طيف الحبر',      base:46, rarity:'epic',   emoji:'👻', img:'assets/fish/ink_wraith.png' },
  abyss_watcher: { name:'مراقب الهاوية',  base:52, rarity:'epic',   emoji:'👁️', img:'assets/fish/abyss_watcher.png' },
  void_serpent:  { name:'ثعبان الفراغ',   base:62, rarity:'mythic', emoji:'🌌', img:'assets/fish/void_serpent.png' },

  // ─── خاص ───
  great_white_shark: { name:'القرش الأبيض', base:15000, rarity:'legendary', emoji:'🦈', img:'assets/fish/great_white_shark.webp' },

  // ─── LEGENDARY ───
  black_dragon:      { name:'التنين الأسود',   base:140, rarity:'legendary', emoji:'🐲', img:'assets/fish/black_dragon.webp' }
};

window.FISH_BY_ID = FISH;

window.getFish = function(id) {
  return FISH[id] || null;
};

try { console.log('[Data/Fish] ' + Object.keys(FISH).length + ' سمكة'); } catch(e){}
