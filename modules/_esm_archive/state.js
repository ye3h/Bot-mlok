'use strict';

import { SAVE_KEY, LAYOUT_KEY, DEFAULT_LAYOUT } from './config.js';

/* ════════════ الحالة الأولية ════════════ */
export function freshState() {
  return {
    name: 'القبطان',
    coins: 0,
    gems: 0,
    xp: 0,
    trip: null,
    owned: ['ship_1', 'bg_storm'],
    equipped: { ships: 'ship_1', backgrounds: 'bg_storm' },
    market: {},
    inventory: {},
    stats: { caught: 0, golden: 0, legendary: 0, sold: 0, earned: 0, trips: 0 },
    achv: {},
    daily: { last: null, streak: 0 },
  };
}

/* ════════════ التحميل والحفظ ════════════ */
export function loadState(SHIPS, SHIP_BY_ID, ITEM_BY_ID) {
  let s = {};
  try {
    s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') || {};
  } catch (e) {}

  const st = Object.assign(freshState(), s);
  st.stats = Object.assign(freshState().stats, s.stats || {});
  if (!s.stats && s.totalFish) st.stats.caught = s.totalFish;
  st.daily = Object.assign({ last: null, streak: 0 }, s.daily || {});
  st.achv = s.achv || {};

  st.equipped = Object.assign({ ships: 'ship_1', backgrounds: 'bg_storm' }, s.equipped || {});

  const LEGACY_SHIP = { boat_small: 'ship_1', basic: 'ship_1' };
  const LEGACY_BG = { bg_titan: 'bg_storm' };

  if (LEGACY_SHIP[st.equipped.ships]) st.equipped.ships = LEGACY_SHIP[st.equipped.ships];
  if (LEGACY_BG[st.equipped.backgrounds]) st.equipped.backgrounds = LEGACY_BG[st.equipped.backgrounds];
  if (!SHIP_BY_ID[st.equipped.ships]) st.equipped.ships = 'ship_1';

  const bg = ITEM_BY_ID[st.equipped.backgrounds];
  if (!bg || bg.cat !== 'backgrounds') st.equipped.backgrounds = 'bg_storm';

  st.owned = (Array.isArray(s.owned) ? s.owned : [])
    .map(id => LEGACY_SHIP[id] || LEGACY_BG[id] || id)
    .filter((id, i, arr) => ITEM_BY_ID[id] && arr.indexOf(id) === i);

  ['ship_1', 'bg_storm', st.equipped.ships, st.equipped.backgrounds].forEach(id => {
    if (!st.owned.includes(id)) st.owned.push(id);
  });

  st.inventory = s.inventory || {};
  st.market = s.market || {};
  if (typeof st.xp !== 'number') st.xp = 0;
  if (st.trip && (!Array.isArray(st.trip.catches) || !st.trip.fish)) st.trip = null;

  return st;
}

export function saveState(state) {
  try {
    if (window.ModuleRegistry) ModuleRegistry.saveAll(state);
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {}
}

/* ════════════ تخطيط الخريطة ════════════ */
export function loadLayout() {
  const base = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
  try {
    const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) || 'null');
    if (saved) {
      Object.keys(base).forEach(k => {
        const p = saved[k];
        if (p && typeof p.x === 'number' && typeof p.y === 'number' &&
            p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1) {
          base[k] = p;
        }
      });
    }
  } catch (e) {}
  return base;
}

export function saveLayout(layout) {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  } catch (e) {}
}
