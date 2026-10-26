'use strict';

/* ════════════ إعدادات ════════════ */
const SAVE_KEY = 'fishing_save_v3';
const LAYOUT_KEY = 'fishing_layout_v1';
const SOUND_KEY = 'fishing_sound_v1';
const TRIP_DURATION = 20000;
const TICK_MS = 50;
const MAX_LEVEL = 150;
const GOLD_CHANCE = 0.03;
const GOLD_MULT = 3;
const EVENT_EVERY = 60000;
const EVENT_LIFE = 90000;
const EVENT_CHANCE = 0.6;
const DEFAULT_BG = 'bg_storm';
const DEV_MODE = false;

const TS = { IDLE: 'idle', FISHING: 'fishing', RETURNING: 'returning' };
const RARITY_COLORS = { common: '#9e9e9e', uncommon: '#4CAF50', rare: '#2196F3', epic: '#9C27B0', legendary: '#FFD700' };
const RARITY_NAMES = { common: 'شائع', uncommon: 'غير شائع', rare: 'نادر', epic: 'ملحمي', legendary: 'أسطوري' };
const GRADIENT_BG = 'linear-gradient(180deg,#87CEEB 0%,#4A90D9 40%,#1a4d8f 75%,#0a2540 100%)';
