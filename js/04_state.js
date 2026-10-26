'use strict';
/* ════════════ الحالة والحفظ (v2.1.0) ════════════ */
function freshState() {
  return {
    name: 'القبطان',
    username: '',
    avatar: '',
    bio: '',
    coins: 0,
    gems: 0,
    xp: 0,
    trip: null,

    owned: ['ship_1', DEFAULT_BG],
    equipped: { ships: 'ship_1', backgrounds: DEFAULT_BG },

    market: {},
    inventory: {},
    fishCaught: {},

    ships: [],
    fleetActive: [],
    fleetStates: {},
    storage_capacity: 3,
    marketLevel: 1,
    fishMarketLevel: 1,
    __baseAdded: false,

    shields: {},
    antis: {},
    weapons: {},
    crews: {},

    weaponsBoughtToday: 0,
    weaponsBoughtDate: '',

    stats: { caught: 0, golden: 0, legendary: 0, sold: 0, earned: 0, trips: 0 },
    achv: {},
    daily: { last: null, streak: 0 },

    dragonEquip: []
  };
}

function loadState() {
  var s = {};
  try { s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') || {}; } catch (e) {}
  var st = Object.assign(freshState(), s);

  st.stats = Object.assign(freshState().stats, s.stats || {});
  if (!s.stats && s.totalFish) st.stats.caught = s.totalFish;
  st.daily = Object.assign({ last: null, streak: 0 }, s.daily || {});
  st.achv = s.achv || {};

  // ترحيل بروفايل: حقول قديمة قد تكون غير موجودة أو من نوع خطأ
  st.name = (typeof s.name === 'string' && s.name.trim()) ? s.name.trim().slice(0, 14) : 'القبطان';
  st.username = (typeof s.username === 'string') ? s.username : '';
  st.avatar = (typeof s.avatar === 'string') ? s.avatar : '';
  st.bio = (typeof s.bio === 'string') ? s.bio.slice(0, 150) : '';

  st.equipped = Object.assign({ ships: 'ship_1', backgrounds: DEFAULT_BG }, s.equipped || {});
  if (LEGACY_SHIP[st.equipped.ships]) st.equipped.ships = LEGACY_SHIP[st.equipped.ships];
  if (LEGACY_BG[st.equipped.backgrounds]) st.equipped.backgrounds = LEGACY_BG[st.equipped.backgrounds];
  if (!SHIP_BY_ID[st.equipped.ships]) st.equipped.ships = 'ship_1';
  var bg = ITEM_BY_ID[st.equipped.backgrounds];
  if (!bg || bg.cat !== 'backgrounds') st.equipped.backgrounds = DEFAULT_BG;

  st.owned = (Array.isArray(s.owned) ? s.owned : [])
    .map(function (id) { return LEGACY_SHIP[id] || LEGACY_BG[id] || id; })
    .filter(function (id, i, arr) { return ITEM_BY_ID[id] && arr.indexOf(id) === i; });
  ['ship_1', DEFAULT_BG, st.equipped.ships, st.equipped.backgrounds].forEach(function (id) {
    if (st.owned.indexOf(id) < 0) st.owned.push(id);
  });

  st.inventory = s.inventory || {};
  st.market = s.market || {};

  if (!st.fishCaught || typeof st.fishCaught !== 'object') st.fishCaught = {};

  if (!Array.isArray(st.ships)) st.ships = [];
  if (!Array.isArray(st.fleetActive)) st.fleetActive = [];
  if (!st.fleetStates || typeof st.fleetStates !== 'object') st.fleetStates = {};
  if (typeof st.storage_capacity !== 'number') st.storage_capacity = 3;
  if (typeof st.marketLevel !== 'number') st.marketLevel = 1;
  if (typeof st.fishMarketLevel !== 'number') st.fishMarketLevel = 1;

  if (!st.shields || typeof st.shields !== 'object') st.shields = {};
  if (!st.antis || typeof st.antis !== 'object') st.antis = {};
  if (!st.weapons || typeof st.weapons !== 'object') st.weapons = {};
  if (!st.crews || typeof st.crews !== 'object') st.crews = {};
  if (typeof st.weaponsBoughtToday !== 'number') st.weaponsBoughtToday = 0;
  if (typeof st.weaponsBoughtDate !== 'string') st.weaponsBoughtDate = '';

  if (!Array.isArray(st.dragonEquip)) st.dragonEquip = [];

  if (st.trip && !Array.isArray(st.trip.catches)) st.trip.catches = [];
  if (typeof st.xp !== 'number') st.xp = 0;

  return st;
}

function saveState() {
  try {
    if (window.ModuleRegistry) ModuleRegistry.saveAll(state);
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {}
}

const DEFAULT_LAYOUT = {
  harbor:     { x: 0.16, y: 0.42 },
  fishMarket: { x: 0.22, y: 0.22 },
  shipMarket: { x: 0.82, y: 0.22 },
  sea:        { x: 0.60, y: 0.42 },
};

function loadLayout() {
  const base = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
  try {
    const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) || 'null');
    if (saved) Object.keys(base).forEach(k => {
      const p = saved[k];
      if (p && typeof p.x === 'number' && typeof p.y === 'number' && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1) base[k] = p;
    });
  } catch (e) {}
  return base;
}

function saveLayout() {
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)); } catch (e) {}
}
