'use strict';
/* ════════════ الصيد والخبرة ════════════ */
function currentShip() { return SHIP_BY_ID[state.equipped.ships] || SHIPS[0]; }
function shipSpeed(ship) { return 1 + (12 - ship.fishing_seconds) * 0.05; }
function catchChancePerSecond(ship) { return 1 / ship.fishing_seconds; }

function pickFishFor(ship) {
  const f = ship.fish.slice(0, 3);
  return f[Math.floor(Math.random() * f.length)];
}

function xpFor(id) {
  const ship = currentShip();
  const lvl = ship ? (ship.req_level || 1) : 1;
  let divisor = 8;
  if (lvl < 10) divisor = 3;
  else if (lvl < 25) divisor = 5;
  return Math.max(1, Math.round(FISH[id].base / divisor));
}

/* ════════════ المستويات ════════════ */
function levelOf(xp) {
  let lv = 1;
  while (lv < MAX_LEVEL && xp >= XP_THRESH[lv + 1]) lv++;
  return lv;
}

function levelProgress(xp) {
  const lv = levelOf(xp);
  if (lv >= MAX_LEVEL) return 100;
  const lo = XP_THRESH[lv], hi = XP_THRESH[lv + 1];
  return Math.floor((xp - lo) / (hi - lo) * 100);
}

