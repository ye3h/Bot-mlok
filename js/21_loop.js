'use strict';
/* ════════════ الحلقة الرئيسية (v2.2.0) ════════════
   - dt من ساعة الجهاز ولا يسمح بالسالب
   - انتهاء الرحلة عبر tripRemainingMs() (وقت موثوق)
   ═════════════════════════════════════════════════ */
setInterval(function () {
  if (typeof lastTick !== 'number') return;
  if (typeof updateBoatPhysics !== 'function') return;
  if (typeof state === 'undefined' || !state) return;
  if (typeof currentTripState === 'undefined') return;

  var nowDev = Date.now();
  var dt = Math.max(0, Math.min(0.1, (nowDev - lastTick) / 1000));
  lastTick = nowDev;

  updateBoatPhysics(dt);

  if (state.trip && currentTripState === TS.FISHING) {
    if (tripRemainingMs() <= 0) {
      if (typeof showMessage === 'function') showMessage('⏰ انتهت الرحلة، عد للميناء');
      if (typeof log === 'function') log('⏰ انتهت الرحلة');
      startReturn();
    } else {
      var ship = SHIP_BY_ID[state.trip.shipId] || currentShip();
      if (Math.random() < dt * catchChancePerSecond(ship)) {
        var id = pickFishFor(ship);
        var key = Math.random() < GOLD_CHANCE ? 'g_' + id : id;
        state.trip.catches.push(key);
        if (typeof catchPop === 'function') catchPop(isGolden(key) ? '✨' + FISH[id].emoji : FISH[id].emoji);
        if (typeof beep === 'function') beep(isGolden(key) ? 1320 : 880, 0.05);
        saveState();
        hook('onCatch', id);
      }
    }
  }

  if (nowDev - lastRender > 250) {
    if (typeof render === 'function') render();
    lastRender = nowDev;
  }
  hook('tick', dt);
}, TICK_MS);

setInterval(function () { if (typeof rollEvent === 'function') rollEvent(); }, EVENT_EVERY);

// فحص انتهاء استئجار الغواصة — كل دقيقة
var _lastRentalCheck = 0;
setInterval(function () {
  var now = Date.now();
  if (now - _lastRentalCheck < 60000) return;
  _lastRentalCheck = now;
  if (typeof window.rpcShips !== 'function') return;
  try {
    var res = window.rpcShips('check_rentals');
    if (res && res.data && res.data.expired > 0) {
      if (typeof showMessage === 'function') {
        showMessage('🛸 انتهى استئجار الغواصة (' + res.data.expired + ')');
      }
      if (typeof render === 'function') render();
    }
  } catch (e) {}
}, 30000);
