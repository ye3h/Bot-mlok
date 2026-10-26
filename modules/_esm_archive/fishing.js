'use strict';

import { TS, GOLD_CHANCE, GOLD_MULT, hook } from './config.js';

let state = null;
let currentTripState = TS.IDLE;
let shownCatch = 0;
let callbacks = {};

export function initFishing(gameState, cbs) {
  state = gameState;
  callbacks = cbs;
}

export function getTripState() { return currentTripState; }
export function setTripState(s) { currentTripState = s; }
export function getShownCatch() { return shownCatch; }
export function setShownCatch(n) { shownCatch = n; }

export function currentShip(SHIPS, SHIP_BY_ID) {
  return SHIP_BY_ID[state.equipped.ships] || SHIPS[0];
}

export function shipTripSec(ship) { return ship.trip_seconds || 60; }
export function shipCatchSec(ship) { return ship.catch_seconds || 13; }

export function shipSpeed(ship) {
  return 1 + (13 - shipCatchSec(ship)) * 0.05;
}

export function pickFishFor(ship) {
  return ship.fish[Math.floor(Math.random() * ship.fish.length)];
}

export function xpFor(id, FISH, ship) {
  const lvl = ship ? (ship.req_level || 1) : 1;
  let divisor = 8;
  if (lvl < 10) divisor = 3;
  else if (lvl < 25) divisor = 5;
  return Math.max(1, Math.round(FISH[id].base / divisor));
}

export function tripCount(t) {
  const now = Math.min(Date.now(), t.endsAt);
  return Math.max(0, Math.floor((now - t.startedAt) / 1000 / t.catchSec));
}

export function startTrip(SHIPS, SHIP_BY_ID, layout, setTarget, showMessage, log, beep) {
  if (callbacks.isEditMode() || state.trip || currentTripState !== TS.IDLE) return;

  if (window.fleet && window.fleet.hasShip(currentShip(SHIPS, SHIP_BY_ID).id)) {
    showMessage('⚓ الأساسية في الأسطول، اصطد منها من "سفينتي"');
    return;
  }

  const ship = currentShip(SHIPS, SHIP_BY_ID);
  const now = Date.now();

  state.trip = {
    startedAt: now,
    endsAt: now + shipTripSec(ship) * 1000,
    shipId: ship.id,
    fish: pickFishFor(ship),
    catchSec: shipCatchSec(ship),
    catches: []
  };

  shownCatch = 0;
  currentTripState = TS.FISHING;
  setTarget(layout.sea.x, layout.sea.y);
  callbacks.save();
  callbacks.render();

  showMessage('🌊 القارب في البحر — يصطاد ' + FISH[state.trip.fish].name);
  log('⛵ بدأت الرحلة بـ ' + ship.name + ' · نوع الصيد: ' + FISH[state.trip.fish].name);
  beep(440, 0.1);
  hook('onTripStart');
}

export function startReturn(setTarget, layout, showMessage, log, render) {
  if (currentTripState !== TS.FISHING) return;

  if (state.trip) {
    state.trip.endsAt = Math.min(state.trip.endsAt, Date.now());
    callbacks.save();
  }

  currentTripState = TS.RETURNING;
  setTarget(layout.harbor.x, layout.harbor.y);
  showMessage('🏠 يعود للميناء...');
  log('🏠 يعود للميناء');
  render();
}

export function endTrip(FISH, XP_THRESH, MAX_LEVEL, showMessage, log, fly, beep, checkAchievements) {
  currentTripState = TS.IDLE;
  const t = state.trip;
  if (!t) return;

  const total = tripCount(t);
  const catches = [];
  for (let i = 0; i < total; i++) {
    catches.push(Math.random() < GOLD_CHANCE ? 'g_' + t.fish : t.fish);
  }

  let xpGain = 0;
  let legendaryCount = 0;
  let goldenCount = 0;

  catches.forEach(k => {
    state.inventory[k] = (state.inventory[k] || 0) + 1;
    const id = k.startsWith('g_') ? k.slice(2) : k;
    state.stats.caught++;
    if (k.startsWith('g_')) { state.stats.golden++; goldenCount++; }
    if (FISH[id].rarity === 'legendary') { state.stats.legendary++; legendaryCount++; }
    xpGain += xpFor(id, FISH, currentShip()) * (k.startsWith('g_') ? GOLD_MULT : 1);
    hook('onCatch', id);
  });

  state.stats.trips++;

  const before = levelOf(state.xp, XP_THRESH, MAX_LEVEL);
  state.xp += xpGain;
  const after = levelOf(state.xp, XP_THRESH, MAX_LEVEL);

  state.trip = null;
  callbacks.save();
  callbacks.render();
  callbacks.renderStorage();

  if (after > before) {
    const bonus = after * 100;
    state.coins += bonus;
    callbacks.save();
    showMessage('🎉 وصلت للمستوى ' + after + '! +' + bonus + ' 💰');
    log('🎉 مستوى جديد: ' + after);
    fly('+' + bonus + ' 💰', $('coins'));
    hook('onLevelUp', after);
  } else if (catches.length) {
    showMessage('🎣 ' + catches.length + ' سمكة في المخزن');
  } else {
    showMessage('😔 لم تصطد شيئاً هذه المرة');
  }

  if (catches.length) {
    log('🏠 رجعت بـ ' + summarizeCatches(catches, FISH).join(' و'));
  } else {
    log('🏠 رجعت فارغ اليدين');
  }

  if (goldenCount) log('✨ صيد ذهبي × ' + goldenCount);
  if (legendaryCount) log('🌟 صيد أسطوري × ' + legendaryCount);

  hook('onTripEnd');
  checkAchievements();
}

export function summarizeCatches(catches, FISH) {
  const normal = {};
  const gold = {};
  const order = [];

  catches.forEach(k => {
    const id = k.startsWith('g_') ? k.slice(2) : k;
    if (!normal[id] && !gold[id]) order.push(id);
    if (k.startsWith('g_')) gold[id] = (gold[id] || 0) + 1;
    else normal[id] = (normal[id] || 0) + 1;
  });

  return order.map(id => {
    let s = '';
    if (normal[id]) s += normal[id] + ' ' + FISH[id].name;
    if (gold[id]) s += (s ? ' + ' : '') + gold[id] + ' ✨' + FISH[id].name;
    return s;
  });
}

export function levelOf(xp, XP_THRESH, MAX_LEVEL) {
  let lv = 1;
  while (lv < MAX_LEVEL && xp >= XP_THRESH[lv + 1]) lv++;
  return lv;
}

export function levelProgress(xp, XP_THRESH, MAX_LEVEL) {
  const lv = levelOf(xp, XP_THRESH, MAX_LEVEL);
  if (lv >= MAX_LEVEL) return 100;
  const lo = XP_THRESH[lv];
  const hi = XP_THRESH[lv + 1];
  return Math.floor((xp - lo) / (hi - lo) * 100);
}
