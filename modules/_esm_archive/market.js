'use strict';

import { MARKET, GOLD_MULT, hook } from './config.js';

let state = null;
let activeEvent = null;

export function initMarket(gameState) {
  state = gameState;
  ensureMarket();
}

export function setActiveEvent(ev) { activeEvent = ev; }
export function getActiveEvent() { return activeEvent; }

export function ensureMarket() {
  Object.keys(FISH).forEach(id => {
    const m = state.market[id];
    if (!m || typeof m.mult !== 'number') {
      state.market[id] = { mult: 1, soldSinceTick: 0 };
    }
  });
}

export function baseOf(k) { return k.startsWith('g_') ? k.slice(2) : k; }
export function isGolden(k) { return k.startsWith('g_'); }

export function eventMult(id) {
  return activeEvent && Date.now() < activeEvent.until && activeEvent.fish === id
    ? activeEvent.mult : 1;
}

export function unitPrice(k) {
  const id = baseOf(k);
  let p = FISH[id].base * state.market[id].mult * eventMult(id);
  if (isGolden(k)) p *= GOLD_MULT;
  return Math.round(p);
}

export function sellRaw(k, n) {
  const id = baseOf(k);
  const m = state.market[id];
  let got = 0;

  for (let i = 0; i < n; i++) {
    got += unitPrice(k);
    if (!isGolden(k)) {
      m.mult = Math.max(MARKET.MIN_MULT, m.mult * (1 - MARKET.SELL_DROP));
      m.soldSinceTick++;
    }
  }

  state.inventory[k] -= n;
  if (state.inventory[k] <= 0) delete state.inventory[k];
  state.coins += got;
  state.stats.sold += n;
  state.stats.earned += got;
  hook('onSale', k, n, got);
  return got;
}

export function startMarketTicker(onTick) {
  setInterval(function () {
    ensureMarket();
    Object.keys(FISH).forEach(id => {
      const m = state.market[id];
      if (m.soldSinceTick === 0) {
        m.mult = Math.min(MARKET.MAX_MULT, m.mult * (1 + MARKET.RECOVER));
      }
      m.soldSinceTick = 0;
    });
    if (onTick) onTick();
  }, MARKET.TICK_MS);
}
