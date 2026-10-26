'use strict';

/* ════════════ الإعدادات ════════════ */
export const SAVE_KEY = 'fishing_save_v1';
export const LAYOUT_KEY = 'fishing_layout_v1';
export const SOUND_KEY = 'fishing_sound_v1';
export const TICK_MS = 50;
export const MAX_LEVEL = 500;
export const GOLD_CHANCE = 0.03;
export const GOLD_MULT = 3;
export const EVENT_EVERY = 60000;
export const EVENT_LIFE = 90000;
export const EVENT_CHANCE = 0.6;
export const DEFAULT_BG = 'bg_storm';
export const DEV_MODE = false;

export const TS = { IDLE: 'idle', FISHING: 'fishing', RETURNING: 'returning' };

export const MARKET = {
  MIN_MULT: 0.5,
  MAX_MULT: 1.8,
  SELL_DROP: 0.02,
  RECOVER: 0.03,
  TICK_MS: 60000
};

export const RARITY_COLORS = {
  common: '#9e9e9e',
  uncommon: '#4CAF50',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FFD700'
};

export const RARITY_NAMES = {
  common: 'شائع',
  uncommon: 'غير شائع',
  rare: 'نادر',
  epic: 'ملحمي',
  legendary: 'أسطوري'
};

export const GRADIENT_BG = 'linear-gradient(180deg,#87CEEB 0%,#4A90D9 40%,#1a4d8f 75%,#0a2540 100%)';

/* ════════════ الخلفيات ════════════ */
export const BACKGROUNDS = [
  { id: 'bg_storm',   cat: 'backgrounds', icon: '⛈', name: 'العاصفة',   img: 'assets/backgrounds/bg_storm.jpg',   price_coins: 0,     rarity: 'common' },
  { id: 'bg_day',     cat: 'backgrounds', icon: '☀️', name: 'النهار',    img: 'assets/backgrounds/bg_day.jpg',     price_coins: 5000,  rarity: 'common' },
  { id: 'bg_sunset',  cat: 'backgrounds', icon: '🌅', name: 'الغروب',    img: 'assets/backgrounds/bg_sunset.jpg',  price_coins: 10000, rarity: 'uncommon' },
  { id: 'bg_night',   cat: 'backgrounds', icon: '🌙', name: 'الليل',     img: 'assets/backgrounds/bg_night.jpg',   price_coins: 20000, rarity: 'rare' },
  { id: 'bg_crystal', cat: 'backgrounds', icon: '💎', name: 'الكريستال', img: 'assets/backgrounds/bg_crystal.png', price_coins: 50000, rarity: 'epic' },
];

/* ════════════ خريطة الموقع الافتراضية ════════════ */
export const DEFAULT_LAYOUT = {
  harbor:     { x: 0.16, y: 0.42 },
  fishMarket: { x: 0.22, y: 0.22 },
  shipMarket: { x: 0.82, y: 0.22 },
  sea:        { x: 0.60, y: 0.42 },
};

/* ════════════ أدوات مساعدة ════════════ */
export const $ = id => document.getElementById(id);
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function setText(id, v) {
  const el = $(id);
  if (el) el.textContent = v;
}

export function fishImg(id) {
  return 'assets/fish/' + id + '.webp';
}

export function hook() {
  if (window.ModuleRegistry) ModuleRegistry.callHook.apply(null, arguments);
}
