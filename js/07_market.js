'use strict';
/* ════════════ السوق والأسعار الديناميكية (v2.0) ════════════ */

var MARKET = {
  MIN_MULT: 0.8,
  MAX_MULT: 1.2,
  SELL_DROP: 0.02,
  RECOVER: 0.03,
  TICK_MS: 300000,
  HISTORY_LEN: 12,
  FORECAST_LEN: 5,
  DRIFT: 0.04
};

function ensureMarket() {
  if (!state.market) state.market = {};
  Object.keys(FISH).forEach(function (id) {
    var m = state.market[id];
    if (!m || typeof m.mult !== 'number') {
      state.market[id] = {
        mult: 1,
        soldSinceTick: 0,
        history: [1],
        forecast: [1, 1, 1, 1, 1],
        lastTick: Date.now()
      };
    } else {
      if (!Array.isArray(m.history) || m.history.length === 0) m.history = [m.mult];
      if (!Array.isArray(m.forecast) || m.forecast.length === 0) m.forecast = [m.mult, m.mult, m.mult, m.mult, m.mult];
      if (typeof m.lastTick !== 'number') m.lastTick = Date.now();
      if (typeof m.soldSinceTick !== 'number') m.soldSinceTick = 0;
    }
  });
}

function baseOf(k) { return k.startsWith('g_') ? k.slice(2) : k; }
function isGolden(k) { return k.startsWith('g_'); }

function eventMult(id) {
  return activeEvent && Date.now() < activeEvent.until && activeEvent.fish === id ? activeEvent.mult : 1;
}

function unitPrice(k) {
  var id = baseOf(k);
  var p = FISH[id].base * state.market[id].mult * eventMult(id);
  if (isGolden(k)) p *= GOLD_MULT;
  return Math.max(1, Math.round(p));
}

function fishCurrentPrice(id) {
  var m = state.market[id];
  if (!m) return FISH[id] ? FISH[id].base : 1;
  return Math.max(1, Math.round(FISH[id].base * m.mult));
}

function fishPriceRange(id) {
  var f = FISH[id];
  if (!f) return { min: 1, max: 1 };
  return {
    min: Math.max(1, Math.round(f.base * MARKET.MIN_MULT)),
    max: Math.max(1, Math.round(f.base * MARKET.MAX_MULT))
  };
}

function fishTrend(id) {
  var m = state.market[id];
  if (!m || !m.history || m.history.length < 2) return 0;
  var prev = m.history[1];
  return prev ? ((m.mult - prev) / prev) * 100 : 0;
}

function fishPriceLabel(id) {
  var p = fishCurrentPrice(id);
  var trend = fishTrend(id);
  if (trend > 0.5) return { arrow: '▲', color: '#4ade80', text: '+' + trend.toFixed(1) + '%' };
  if (trend < -0.5) return { arrow: '▼', color: '#ef4444', text: trend.toFixed(1) + '%' };
  return { arrow: '—', color: '#94a3b8', text: '0%' };
}

function marketTick() {
  ensureMarket();
  var now = Date.now();
  Object.keys(FISH).forEach(function (id) {
    var m = state.market[id];
    var elapsed = now - m.lastTick;
    if (elapsed < MARKET.TICK_MS) return;

    if (m.soldSinceTick > 0) {
      m.mult = Math.max(MARKET.MIN_MULT, m.mult * (1 - MARKET.SELL_DROP));
    } else {
      m.mult = Math.min(MARKET.MAX_MULT, m.mult * (1 + MARKET.RECOVER));
    }

    var drift = (Math.random() - 0.5) * MARKET.DRIFT;
    m.mult = Math.max(MARKET.MIN_MULT, Math.min(MARKET.MAX_MULT, m.mult + drift));

    m.history.unshift(m.mult);
    if (m.history.length > MARKET.HISTORY_LEN) m.history.length = MARKET.HISTORY_LEN;

    var fc = [];
    var cur = m.mult;
    for (var i = 0; i < MARKET.FORECAST_LEN; i++) {
      cur = Math.max(MARKET.MIN_MULT, Math.min(MARKET.MAX_MULT, cur + (Math.random() - 0.5) * 0.03));
      fc.push(cur);
    }
    m.forecast = fc;

    m.lastTick = now;
    m.soldSinceTick = 0;
  });
  saveState();
}

function sellRaw(k, n) {
  var id = baseOf(k);
  var m = state.market[id];
  var got = 0;
  for (var i = 0; i < n; i++) {
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

function finishSale(n, got) {
  saveState();
  render();
  if (typeof renderStorage === 'function') renderStorage();
  if (typeof fly === 'function') fly('+' + got.toLocaleString() + ' 💰', $('coins'));
  if (typeof beep === 'function') beep(660, 0.08);
  showMessage('💰 بعت ' + n + ' بـ ' + got.toLocaleString());
  if (typeof checkAchievements === 'function') checkAchievements();
}

function sellItem(k, qty) {
  var n = Math.min(qty, state.inventory[k] || 0);
  if (n <= 0) return;
  finishSale(n, sellRaw(k, n));
}

function sellAll() {
  var keys = invEntries();
  if (!keys.length) return;
  var got = 0, n = 0;
  keys.forEach(function (k) {
    var q = state.inventory[k];
    got += sellRaw(k, q);
    n += q;
  });
  finishSale(n, got);
}

// تشغيل السوق
ensureMarket();
setInterval(function () {
  marketTick();
  if (typeof render === 'function') render();
  if (activeScreen === 'storage' && typeof renderStorage === 'function') renderStorage();
  if (activeScreen === 'fishmarket') {
    var fm = window.ModuleRegistry && window.ModuleRegistry.get('fish_market');
    if (fm && fm._isOpen) fm.render();
  }
}, MARKET.TICK_MS);
