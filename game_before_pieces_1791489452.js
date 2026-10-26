'use strict';

/* ════════════ إعدادات ════════════ */
const SAVE_KEY = 'fishing_save_v1';
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
const MARKET = { MIN_MULT: 0.5, MAX_MULT: 1.8, SELL_DROP: 0.02, RECOVER: 0.03, TICK_MS: 60000 };
const RARITY_COLORS = { common: '#9e9e9e', uncommon: '#4CAF50', rare: '#2196F3', epic: '#9C27B0', legendary: '#FFD700' };
const RARITY_NAMES = { common: 'شائع', uncommon: 'غير شائع', rare: 'نادر', epic: 'ملحمي', legendary: 'أسطوري' };
const GRADIENT_BG = 'linear-gradient(180deg,#87CEEB 0%,#4A90D9 40%,#1a4d8f 75%,#0a2540 100%)';

/* ════════════ الخلفيات (5 صور موجودة فعلاً) ════════════ */
const BACKGROUNDS = [
  {id:'bg_storm',   cat:'backgrounds', icon:'⛈', name:'العاصفة',   img:'assets/backgrounds/bg_storm.jpg',   price_coins:0,     rarity:'common'},
  {id:'bg_day',     cat:'backgrounds', icon:'☀️', name:'النهار',    img:'assets/backgrounds/bg_day.jpg',     price_coins:5000,  rarity:'common'},
  {id:'bg_sunset',  cat:'backgrounds', icon:'🌅', name:'الغروب',    img:'assets/backgrounds/bg_sunset.jpg',  price_coins:10000, rarity:'uncommon'},
  {id:'bg_night',   cat:'backgrounds', icon:'🌙', name:'الليل',     img:'assets/backgrounds/bg_night.jpg',   price_coins:20000, rarity:'rare'},
  {id:'bg_crystal', cat:'backgrounds', icon:'💎', name:'الكريستال', img:'assets/backgrounds/bg_crystal.png', price_coins:50000, rarity:'epic'},
];

const SHIP_BY_ID = Object.fromEntries(SHIPS.map(s => [s.id, s]));
const ITEM_BY_ID = Object.fromEntries([...SHIPS, ...BACKGROUNDS].map(i => [i.id, i]));
const LEGACY_SHIP = { boat_small: 'ship_1', basic: 'ship_1' };
const LEGACY_BG = { bg_titan: 'bg_storm' };

/* ════════════ الإنجازات ════════════ */
const ACHIEVEMENTS = [
  {id:'first_catch', name:'أول صيد',       desc:'اصطد سمكة واحدة',          gems:5,   test:s => s.stats.caught >= 1},
  {id:'catch_100',   name:'صياد ماهر',     desc:'اصطد 100 سمكة',           gems:20,  test:s => s.stats.caught >= 100},
  {id:'catch_1000',  name:'سيد المحيط',    desc:'اصطد 1000 سمكة',          gems:100, test:s => s.stats.caught >= 1000},
  {id:'first_sale',  name:'تاجر',          desc:'بع أول سمكة',             gems:5,   test:s => s.stats.sold >= 1},
  {id:'rich',        name:'ثري',           desc:'اجمع 50,000 ذهب من البيع', gems:30,  test:s => s.stats.earned >= 50000},
  {id:'golden',      name:'الحظ الذهبي',   desc:'اصطد سمكة ذهبية',         gems:25,  test:s => s.stats.golden >= 1},
  {id:'legend',      name:'صياد الأساطير', desc:'اصطد سمكة أسطورية',       gems:40,  test:s => s.stats.legendary >= 1},
  {id:'fleet',       name:'أسطول صغير',    desc:'امتلك 3 سفن',             gems:20,  test:s => s.owned.filter(id => SHIP_BY_ID[id]).length >= 3},
  {id:'lvl10',       name:'قبطان',         desc:'وصل للمستوى 10',          gems:15,  test:s => levelOf(s.xp) >= 10},
  {id:'lvl70',       name:'أسطورة البحار', desc:'وصل للمستوى 150',         gems:300, test:s => levelOf(s.xp) >= MAX_LEVEL},
];

/* ════════════ الحالة والحفظ ════════════ */
function freshState() {
  return {
    name: 'القبطان', coins: 0, gems: 0, xp: 0, trip: null,
    owned: ['ship_1', DEFAULT_BG],
    equipped: { ships: 'ship_1', backgrounds: DEFAULT_BG },
    market: {}, inventory: {},
    stats: { caught: 0, golden: 0, legendary: 0, sold: 0, earned: 0, trips: 0 },
    achv: {}, daily: { last: null, streak: 0 },
  };
}

function loadState() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') || {}; } catch (e) {}
  const st = Object.assign(freshState(), s);
  st.stats = Object.assign(freshState().stats, s.stats || {});
  if (!s.stats && s.totalFish) st.stats.caught = s.totalFish;
  st.daily = Object.assign({ last: null, streak: 0 }, s.daily || {});
  st.achv = s.achv || {};

  st.equipped = Object.assign({ ships: 'ship_1', backgrounds: DEFAULT_BG }, s.equipped || {});
  if (LEGACY_SHIP[st.equipped.ships]) st.equipped.ships = LEGACY_SHIP[st.equipped.ships];
  if (LEGACY_BG[st.equipped.backgrounds]) st.equipped.backgrounds = LEGACY_BG[st.equipped.backgrounds];
  if (!SHIP_BY_ID[st.equipped.ships]) st.equipped.ships = 'ship_1';
  const bg = ITEM_BY_ID[st.equipped.backgrounds];
  if (!bg || bg.cat !== 'backgrounds') st.equipped.backgrounds = DEFAULT_BG;

  st.owned = (Array.isArray(s.owned) ? s.owned : [])
    .map(id => LEGACY_SHIP[id] || LEGACY_BG[id] || id)
    .filter((id, i, arr) => ITEM_BY_ID[id] && arr.indexOf(id) === i);
  ['ship_1', DEFAULT_BG, st.equipped.ships, st.equipped.backgrounds].forEach(id => {
    if (!st.owned.includes(id)) st.owned.push(id);
  });

  st.inventory = s.inventory || {};
  st.market = s.market || {};
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

/* ════════════ متغيرات التشغيل ════════════ */
let state = loadState();
let layout = loadLayout();
let currentTripState = TS.IDLE;
let shopTab = 'ships';
let sortMode = 'price';
let previewTimer = null, previewBackId = null;
let activeScreen = null;
let _msgTimer = null;
let lastTick = Date.now();
let lastRender = 0;
let editMode = false;
let dragKey = null;
let activeEvent = null;
let soundOn = localStorage.getItem(SOUND_KEY) !== 'off';
let audioCtx = null;

const $ = id => document.getElementById(id);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function setText(id, v) { const el = $(id); if (el) el.textContent = v; }
function fishImg(id) { return 'assets/fish/' + id + '.webp'; }
function hook() {
  if (window.ModuleRegistry) ModuleRegistry.callHook.apply(null, arguments);
}

/* ════════════ الصوت والتأثيرات ════════════ */
function beep(freq, dur) {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.05, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}

function fly(text, anchor, cls) {
  const app = $('app');
  const el = document.createElement('div');
  el.className = 'fly' + (cls ? ' ' + cls : '');
  el.textContent = text;
  if (anchor) {
    const r = anchor.getBoundingClientRect(), ar = app.getBoundingClientRect();
    el.style.left = (r.left - ar.left + r.width / 2) + 'px';
    el.style.top = (r.top - ar.top) + 'px';
  } else {
    el.style.left = '50%';
    el.style.top = '180px';
  }
  app.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

function catchPop(emoji) {
  const scene = $('scene');
  const el = document.createElement('div');
  el.className = 'fly pop';
  el.textContent = emoji;
  el.style.left = (P.x * scene.clientWidth) + 'px';
  el.style.top = (P.y * scene.clientHeight - 50) + 'px';
  scene.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

/* ════════════ السوق والأسعار ════════════ */
function ensureMarket() {
  Object.keys(FISH).forEach(id => {
    const m = state.market[id];
    if (!m || typeof m.mult !== 'number') state.market[id] = { mult: 1, soldSinceTick: 0 };
  });
}

function baseOf(k) { return k.startsWith('g_') ? k.slice(2) : k; }
function isGolden(k) { return k.startsWith('g_'); }

function eventMult(id) {
  return activeEvent && Date.now() < activeEvent.until && activeEvent.fish === id ? activeEvent.mult : 1;
}

function unitPrice(k) {
  const id = baseOf(k);
  let p = FISH[id].base * state.market[id].mult * eventMult(id);
  if (isGolden(k)) p *= GOLD_MULT;
  return Math.round(p);
}

function sellRaw(k, n) {
  const id = baseOf(k), m = state.market[id];
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

function finishSale(n, got) {
  saveState();
  render();
  renderStorage();
  fly('+' + got.toLocaleString() + ' 💰', $('coins'));
  beep(660, 0.08);
  showMessage('💰 بعت ' + n + ' بـ ' + got.toLocaleString());
  checkAchievements();
}

function sellItem(k, qty) {
  const n = Math.min(qty, state.inventory[k] || 0);
  if (n <= 0) return;
  finishSale(n, sellRaw(k, n));
}

function sellAll() {
  const keys = invEntries();
  if (!keys.length) return;
  let got = 0, n = 0;
  keys.forEach(k => { const q = state.inventory[k]; got += sellRaw(k, q); n += q; });
  finishSale(n, got);
}

setInterval(function () {
  ensureMarket();
  Object.keys(FISH).forEach(id => {
    const m = state.market[id];
    if (m.soldSinceTick === 0) m.mult = Math.min(MARKET.MAX_MULT, m.mult * (1 + MARKET.RECOVER));
    m.soldSinceTick = 0;
  });
  saveState();
  if (activeScreen === 'storage') renderStorage();
}, MARKET.TICK_MS);

/* ════════════ الأحداث العشوائية ════════════ */
function rollEvent() {
  if (activeEvent && Date.now() < activeEvent.until) return;
  activeEvent = null;
  if (Math.random() < EVENT_CHANCE) {
    const ids = Object.keys(FISH);
    const id = ids[Math.floor(Math.random() * ids.length)];
    const boom = Math.random() < 0.6;
    activeEvent = { fish: id, mult: boom ? 1.8 : 0.5, boom, until: Date.now() + EVENT_LIFE };
    showMessage((boom ? '🔥 موسم ' : '📉 كساد ') + FISH[id].name);
    log((boom ? '🔥 ارتفع سعر ' : '📉 انخفض سعر ') + FISH[id].name + ' مؤقتاً');
  }
  renderEvent();
}

function renderEvent() {
  const b = $('eventBanner');
  if (activeEvent && Date.now() < activeEvent.until) {
    b.textContent = (activeEvent.boom ? '🔥 موسم ' : '📉 كساد ') + FISH[activeEvent.fish].name + ' × ' + activeEvent.mult;
    b.classList.add('show');
  } else {
    activeEvent = null;
    b.classList.remove('show');
  }
}

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

/* ════════════ الفيزياء والحركة ════════════ */
const P = { x: 0.5, y: 0.5, vx: 0, vy: 0, tx: 0.5, ty: 0.5, hasTarget: false, maxSpeed: 0.35, accel: 4, damping: 2.5, rot: 0, ready: false };

function applyBoatTransform() {
  const scene = $('scene'), boat = $('boat');
  if (!scene || !boat) return;
  boat.style.left = (P.x * scene.clientWidth) + 'px';
  boat.style.top = (P.y * scene.clientHeight) + 'px';
  boat.style.transform = 'translate(-50%,-50%) rotate(' + P.rot.toFixed(2) + 'deg)';
}

function initBoatPosition() {
  P.x = layout.harbor.x; P.y = layout.harbor.y;
  P.tx = P.x; P.ty = P.y;
  P.vx = 0; P.vy = 0;
  P.hasTarget = false;
  P.ready = true;
  applyBoatTransform();
}

function setTarget(nx, ny) {
  P.tx = clamp(nx, 0.05, 0.95);
  P.ty = clamp(ny, 0.12, 0.88);
  P.hasTarget = true;
  const t = $('target'), scene = $('scene');
  if (t && scene) {
    t.style.display = 'block';
    t.style.left = (P.tx * scene.clientWidth) + 'px';
    t.style.top = (P.ty * scene.clientHeight) + 'px';
  }
}

function hideTarget() { const t = $('target'); if (t) t.style.display = 'none'; }

function updateBoatPhysics(dt) {
  if (!P.ready) return;

  if (currentTripState === TS.RETURNING) {
    const dh = Math.hypot(P.x - layout.harbor.x, P.y - layout.harbor.y);
    if (dh < 0.03 && Math.hypot(P.vx, P.vy) < 0.05) {
      P.hasTarget = false;
      hideTarget();
      endTrip();
    }
  }

  const sp = shipSpeed(currentShip());
  if (P.hasTarget) {
    const dx = P.tx - P.x, dy = P.ty - P.y, dist = Math.hypot(dx, dy);
    if (dist < 0.01) {
      P.hasTarget = false;
      hideTarget();
    } else {
      const maxV = P.maxSpeed * sp * Math.min(1, dist * 6);
      const k = Math.min(1, P.accel * dt);
      P.vx += ((dx / dist) * maxV - P.vx) * k;
      P.vy += ((dy / dist) * maxV - P.vy) * k;
    }
  }
  if (!P.hasTarget) {
    const d = Math.exp(-P.damping * dt);
    P.vx *= d; P.vy *= d;
  }

  P.x += P.vx * dt;
  P.y += P.vy * dt;
  if (P.x < 0.05) { P.x = 0.05; P.vx = Math.abs(P.vx) * 0.5; }
  if (P.x > 0.95) { P.x = 0.95; P.vx = -Math.abs(P.vx) * 0.5; }
  if (P.y < 0.12) { P.y = 0.12; P.vy = Math.abs(P.vy) * 0.5; }
  if (P.y > 0.88) { P.y = 0.88; P.vy = -Math.abs(P.vy) * 0.5; }

  const rotTarget = clamp((P.vx / P.maxSpeed) * 15, -15, 15);
  P.rot += (rotTarget - P.rot) * Math.min(1, dt * 8);
  applyBoatTransform();
}

function applyShip() {
  const boat = $('boat');
  if (!boat) return;
  const ship = currentShip();
  boat.innerHTML = '';
  const img = document.createElement('img');
  img.src = ship.img;
  img.alt = ship.name;
  img.onerror = function () { boat.textContent = ship.icon || '⛵'; };
  boat.appendChild(img);
}

/* ════════════ الرحلة ════════════ */
function startTrip() {
  if (editMode || state.trip || currentTripState !== TS.IDLE) return;
  state.trip = { startedAt: Date.now(), endsAt: Date.now() + TRIP_DURATION, shipId: state.equipped.ships, catches: [] };
  currentTripState = TS.FISHING;
  setTarget(layout.sea.x, layout.sea.y);
  saveState();
  render();
  showMessage('🌊 القارب في البحر — يصطاد...');
  log('⛵ بدأت الرحلة بـ ' + currentShip().name);
  beep(440, 0.1);
  hook('onTripStart');
}

function startReturn() {
  if (currentTripState !== TS.FISHING) return;
  currentTripState = TS.RETURNING;
  setTarget(layout.harbor.x, layout.harbor.y);
  showMessage('🏠 يعود للميناء...');
  log('🏠 يعود للميناء');
  render();
}

function endTrip() {
  currentTripState = TS.IDLE;
  if (!state.trip) return;
  const catches = state.trip.catches;
  let xpGain = 0, legendaryCount = 0, goldenCount = 0;

  catches.forEach(k => {
    state.inventory[k] = (state.inventory[k] || 0) + 1;
    const id = baseOf(k);
    state.stats.caught++;
    if (isGolden(k)) { state.stats.golden++; goldenCount++; }
    if (FISH[id].rarity === 'legendary') { state.stats.legendary++; legendaryCount++; }
    xpGain += xpFor(id) * (isGolden(k) ? GOLD_MULT : 1);
  });
  state.stats.trips++;

  const before = levelOf(state.xp);
  state.xp += xpGain;
  const after = levelOf(state.xp);
  state.trip = null;
  saveState();
  render();
  renderStorage();

  if (after > before) {
    const bonus = after * 100;
    state.coins += bonus;
    saveState();
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
    log('🏠 رجعت بـ ' + summarizeCatches(catches).join(' و'));
  } else {
    log('🏠 رجعت فارغ اليدين');
  }
  if (goldenCount) log('✨ صيد ذهبي × ' + goldenCount);
  if (legendaryCount) log('🌟 صيد أسطوري × ' + legendaryCount);

  hook('onTripEnd');
  checkAchievements();
}

/* يجمع النسخ العادية والذهبية تحت نفس السمكة */
function summarizeCatches(catches) {
  const normal = {}, gold = {}, order = [];
  catches.forEach(k => {
    const id = baseOf(k);
    if (!normal[id] && !gold[id]) order.push(id);
    if (isGolden(k)) gold[id] = (gold[id] || 0) + 1;
    else normal[id] = (normal[id] || 0) + 1;
  });
  return order.map(id => {
    let s = '';
    if (normal[id]) s += normal[id] + ' ' + FISH[id].name;
    if (gold[id]) s += (s ? ' + ' : '') + gold[id] + ' ✨' + FISH[id].name;
    return s;
  });
}

/* ════════════ الرسم ════════════ */
function render() {
  setText('coins', state.coins.toLocaleString());
  setText('gems', state.gems);
  setText('fishCount', state.stats.caught);
  setText('pname', state.name);

  const lv = levelOf(state.xp);
  setText('lvlTxt', 'مستوى ' + lv + ' / ' + MAX_LEVEL);
  const lf = $('lvlFill');
  if (lf) lf.style.width = levelProgress(state.xp) + '%';

  const boat = $('boat'), progress = $('progress');
  const busy = currentTripState !== TS.IDLE;
  if (boat) boat.classList.toggle('sailing', busy);
  if (progress) progress.classList.toggle('visible', !!state.trip);

  if (state.trip) {
    const pct = Math.min(100, ((Date.now() - state.trip.startedAt) / TRIP_DURATION) * 100);
    const fill = $('progressFill');
    if (fill) fill.style.width = pct + '%';
    setText('progressText', Math.floor(pct) + '%   🐟 ' + state.trip.catches.length);
  }

  $('giftBtn').classList.toggle('ping', canClaimDaily());
  renderEvent();
}

function showMessage(text) {
  const el = $('message');
  if (!el) return;
  el.textContent = text;
  el.classList.add('visible');
  if (_msgTimer) clearTimeout(_msgTimer);
  _msgTimer = setTimeout(() => el.classList.remove('visible'), 2800);
}

function log(text) {
  const logEl = $('log');
  if (!logEl) return;
  logEl.classList.add('visible');
  const line = document.createElement('div');
  line.className = 'line';
  const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  line.textContent = time + ' — ' + text;
  logEl.insertBefore(line, logEl.firstChild);
  while (logEl.children.length > 20) logEl.removeChild(logEl.lastChild);
}

function makeBtn(text, cls, onClick, disabled) {
  const b = document.createElement('button');
  b.textContent = text;
  b.className = cls || 'btn';
  b.disabled = !!disabled;
  if (onClick) b.onclick = onClick;
  return b;
}

function itemImage(item, w, h) {
  const img = document.createElement('img');
  img.src = item.img;
  img.alt = item.name;
  img.style.width = w + 'px';
  img.style.height = h + 'px';
  img.onerror = function () {
    const s = document.createElement('span');
    s.textContent = item.icon || '🖼';
    s.style.fontSize = '28px';
    img.replaceWith(s);
  };
  return img;
}

function emptyCard(text) {
  const d = document.createElement('div');
  d.className = 'card';
  d.innerHTML = '<div class="info muted">' + text + '</div>';
  return d;
}

/* ════════════ المخزن ════════════ */
function invEntries() {
  return Object.keys(state.inventory).filter(k => state.inventory[k] > 0 && FISH[baseOf(k)]);
}

function renderStorage() {
  const keys = invEntries();
  let total = 0;
  keys.forEach(k => { total += unitPrice(k) * state.inventory[k]; });
  setText('invValue', total.toLocaleString());

  const list = $('invList');
  list.innerHTML = '';
  if (!keys.length) { list.appendChild(emptyCard('المخزن فارغ — أبحر لتصطاد الأسماك.')); return; }

  const rank = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
  keys.sort((a, b) => {
    const A = FISH[baseOf(a)], B = FISH[baseOf(b)];
    if (sortMode === 'qty') return state.inventory[b] - state.inventory[a];
    if (sortMode === 'rarity') return rank[B.rarity] - rank[A.rarity];
    return unitPrice(b) * state.inventory[b] - unitPrice(a) * state.inventory[a];
  });

  keys.forEach(k => {
    const id = baseOf(k), f = FISH[id], qty = state.inventory[k];
    const card = document.createElement('div');
    card.className = 'card';
    card.style.setProperty('--rc', isGolden(k) ? '#FFD76A' : RARITY_COLORS[f.rarity]);

    const th = document.createElement('div');
    th.className = 'thumb';
    th.appendChild(itemImage({ img: fishImg(id), name: f.name, icon: f.emoji }, 56, 46));
    card.appendChild(th);

    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML =
      '<div class="nm">' + f.name + ' × ' + qty + (isGolden(k) ? '<span class="tag">ذهبية ✨</span>' : '') + '</div>' +
      '<div class="sub" style="color:' + RARITY_COLORS[f.rarity] + '">● ' + RARITY_NAMES[f.rarity] + '</div>' +
      '<div class="pr">💰 ' + unitPrice(k).toLocaleString() + ' للقطعة</div>';
    card.appendChild(info);

    const acts = document.createElement('div');
    acts.className = 'acts';
    acts.appendChild(makeBtn('بيع 1', 'btn', () => sellItem(k, 1)));
    acts.appendChild(makeBtn('بيع الكل', 'btn alt', () => sellItem(k, qty)));
    card.appendChild(acts);
    list.appendChild(card);
  });
}

/* ════════════ المتجر ════════════ */
function getItem(id) { return ITEM_BY_ID[id]; }

function syncShopTabs() {
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === shopTab));
}

function renderShop() {
  const list = $('shopList');
  list.innerHTML = '';
  const items = shopTab === 'ships' ? SHIPS : BACKGROUNDS;
  const lvl = levelOf(state.xp);

  items.forEach(item => {
    const owned = state.owned.includes(item.id);
    const equipped = state.equipped[item.cat] === item.id;
    const locked = !owned && (item.req_level || 0) > lvl;

    const card = document.createElement('div');
    card.className = 'card' + (locked ? ' locked' : '');
    if (item.rarity) card.style.setProperty('--rc', RARITY_COLORS[item.rarity]);

    const th = document.createElement('div');
    th.className = 'thumb';
    th.appendChild(itemImage(item, 56, 46));
    card.appendChild(th);

    let html = '<div class="nm">' + item.name + '</div>';
    if (item.cat === 'ships') {
      html += '<div class="sub">⏱ ' + item.fishing_seconds + ' ث لكل صيدة · 🐟 ' +
        item.fish.slice(0, 3).map(id => FISH[id] ? FISH[id].name : id).join('، ') + '</div>';
    }
    const price = owned ? '✓ مملوك' : (locked ? '🔒 يتطلب المستوى ' + item.req_level : '💰 ' + item.price_coins.toLocaleString());
    html += '<div class="pr">' + price + '</div>';
    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML = html;
    card.appendChild(info);

    const acts = document.createElement('div');
    acts.className = 'acts';
    if (!owned) {
      acts.appendChild(makeBtn(locked ? 'مقفل' : 'شراء', 'btn gold', () => buyItem(item.id), locked));
    } else if (!equipped) {
      acts.appendChild(makeBtn('تركيب', 'btn', () => equipItem(item.id)));
    } else {
      acts.appendChild(makeBtn('مُركّب ✓', 'btn', null, true));
    }
    if (item.cat === 'backgrounds' && !equipped) {
      acts.appendChild(makeBtn('معاينة', 'btn alt', () => previewBackground(item.id)));
    }
    card.appendChild(acts);
    list.appendChild(card);
  });
}

function buyItem(id) {
  const item = getItem(id);
  if (!item || state.owned.includes(id)) return;
  if (levelOf(state.xp) < (item.req_level || 0)) { showMessage('🔒 تحتاج المستوى ' + item.req_level); return; }
  if (state.coins < item.price_coins) { showMessage('💰 الذهب غير كافٍ'); return; }
  state.coins -= item.price_coins;
  state.owned.push(id);
  saveState();
  render();
  renderShop();
  beep(780, 0.12);
  showMessage('✅ تم شراء ' + item.name);
  log('🛒 اشتريت ' + item.name);
  checkAchievements();
}

function equipItem(id) {
  const item = getItem(id);
  if (!item || !state.owned.includes(id)) return;
  if (currentTripState !== TS.IDLE) { showMessage('⚠️ لا يمكن التغيير أثناء الرحلة'); return; }
  state.equipped[item.cat] = id;
  saveState();
  applyEquipped();
  renderShop();
  showMessage('⚓ تم تركيب ' + item.name);
}

function getBgStyle(id) {
  const item = getItem(id);
  if (item && item.img) return "url('" + item.img + "') center/cover no-repeat," + GRADIENT_BG;
  return GRADIENT_BG;
}

function applyBackground(id) {
  const scene = $('scene');
  if (scene) scene.style.background = getBgStyle(id);
}

function previewBackground(id) {
  const item = getItem(id);
  if (!item) return;
  if (previewTimer) clearTimeout(previewTimer);
  previewBackId = id;
  applyBackground(id);
  showMessage('👁 معاينة ' + item.name + ' — 5 ثوانٍ');
  previewTimer = setTimeout(() => { previewBackId = null; applyEquipped(); }, 5000);
}

function applyEquipped() {
  if (previewBackId) return;
  applyBackground(state.equipped.backgrounds);
  applyShip();
}

/* ════════════ المكافأة اليومية ════════════ */
function todayKey(d) {
  d = d || new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}
function canClaimDaily() { return state.daily.last !== todayKey(); }
function nextStreak() {
  return state.daily.last === yesterdayKey() ? (state.daily.streak || 0) + 1 : 1;
}
function dailyCoins(streak) { return 200 + Math.min(streak, 30) * 50; }

function timeToMidnight() {
  const n = new Date(), m = new Date(n);
  m.setHours(24, 0, 0, 0);
  const ms = m - n;
  return Math.floor(ms / 3600000) + ' س ' + Math.floor((ms % 3600000) / 60000) + ' د';
}

function claimDaily() {
  if (!canClaimDaily()) return;
  const s = nextStreak();
  const coins = dailyCoins(s);
  let gems = 0;
  state.coins += coins;
  if (s % 7 === 0) { gems = 10; state.gems += gems; }
  state.daily = { last: todayKey(), streak: s };
  saveState();
  render();
  renderDaily();
  fly('+' + coins + ' 💰', $('giftBtn'));
  beep(990, 0.15);
  showMessage('🎁 اليوم ' + s + ' — +' + coins + (gems ? ' و 10 💎' : ''));
  hook('onDaily');
  checkAchievements();
}

function renderDaily() {
  const can = canClaimDaily();
  const streak = state.daily.streak || 0;
  $('dailyHero').innerHTML =
    '<div class="muted">سلسلة الأيام</div>' +
    '<div class="big">🔥 ' + streak + ' يوم</div>' +
    '<div class="muted" style="margin-top:6px">المكافأة القادمة: ' + dailyCoins(can ? nextStreak() : streak + 1).toLocaleString() + ' 💰</div>';
  const btn = $('claimBtn');
  btn.disabled = !can;
  btn.textContent = can ? '🎁 استلم المكافأة' : '✓ استلمت مكافأة اليوم';
  $('dailyInfo').textContent = can ? 'مكافأتك جاهزة الآن' : 'تتجدد بعد ' + timeToMidnight();
}

/* ════════════ الإنجازات ════════════ */
function checkAchievements() {
  ACHIEVEMENTS.forEach(a => {
    if (state.achv[a.id] || !a.test(state)) return;
    state.achv[a.id] = true;
    state.gems += a.gems;
    saveState();
    render();
    showMessage('🏆 إنجاز: ' + a.name + ' +' + a.gems + ' 💎');
    log('🏆 ' + a.name + ' — ' + a.desc);
    beep(1040, 0.2);
  });
}

function renderAchv() {
  const list = $('achvList');
  list.innerHTML = '';
  const done = ACHIEVEMENTS.filter(a => state.achv[a.id]).length;
  const hero = document.createElement('div');
  hero.className = 'hero';
  hero.innerHTML = '<div class="muted">المنجز</div><div class="big">' + done + ' / ' + ACHIEVEMENTS.length + '</div>';
  list.appendChild(hero);
  ACHIEVEMENTS.forEach(a => {
    const ok = !!state.achv[a.id];
    const card = document.createElement('div');
    card.className = 'card' + (ok ? ' ach-done' : ' locked');
    card.style.setProperty('--rc', ok ? '#FFD76A' : '#555');
    card.innerHTML =
      '<div class="thumb" style="font-size:26px">' + (ok ? '🏆' : '🔒') + '</div>' +
      '<div class="info"><div class="nm">' + a.name + '</div><div class="sub">' + a.desc + '</div>' +
      '<div class="pr">' + (ok ? '✓ مكتمل' : '💎 ' + a.gems) + '</div></div>';
    list.appendChild(card);
  });
}

/* ════════════ الإحصاءات ════════════ */
function renderStats() {
  const s = state.stats;
  const items = [
    [s.caught.toLocaleString(), 'سمكة مصطادة'],
    [s.trips.toLocaleString(), 'رحلة'],
    [s.sold.toLocaleString(), 'سمكة مباعة'],
    [s.earned.toLocaleString(), 'ذهب من البيع'],
    [s.golden.toLocaleString(), 'صيد ذهبي ✨'],
    [s.legendary.toLocaleString(), 'صيد أسطوري 🌟'],
    [levelOf(state.xp), 'المستوى الحالي'],
    [state.xp.toLocaleString(), 'مجموع الخبرة'],
  ];
  $('statsGrid').innerHTML = items.map(([v, k]) =>
    '<div class="stat"><div class="v">' + v + '</div><div class="k">' + k + '</div></div>'
  ).join('');
  $('soundBtn').textContent = soundOn ? '🔊 الصوت: مفعّل' : '🔇 الصوت: مُغلق';
}

/* ════════════ الشاشات والتنقل ════════════ */
function setActiveNav(name) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.screen === name));
}

function closeScreen() {
  document.querySelectorAll('.screen.open').forEach(s => s.classList.remove('open'));
  activeScreen = null;
  setActiveNav('home');
}

function refreshScreen(name) {
  if (name === 'shop') { syncShopTabs(); renderShop(); }
  if (name === 'storage') renderStorage();
  if (name === 'daily') renderDaily();
  if (name === 'achv') renderAchv();
  if (name === 'stats') renderStats();
}

function openScreen(name) {
  if (activeScreen === name) { closeScreen(); return; }
  closeScreen();
  if (name === 'home') return;
  const el = $('screen-' + name);
  if (!el) return;
  el.classList.add('open');
  activeScreen = name;
  setActiveNav(name);
  refreshScreen(name);
  hook('onScreenOpen', name);
}

document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => openScreen(btn.dataset.screen)));
document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', closeScreen));
document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
  shopTab = btn.dataset.tab;
  syncShopTabs();
  renderShop();
}));
$('sortSel').onchange = function () { sortMode = this.value; renderStorage(); };
$('sellAllBtn').onclick = sellAll;
$('claimBtn').onclick = claimDaily;
$('soundBtn').onclick = function () {
  soundOn = !soundOn;
  localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off');
  renderStats();
};
$('giftBtn').onclick = () => openScreen('daily');
$('playerBox').onclick = function () {
  const n = prompt('اسم القبطان:', state.name);
  if (n && n.trim()) { state.name = n.trim().slice(0, 14); saveState(); render(); }
};

/* ════════════ الخريطة (أماكن شفافة + وضع تعديل) ════════════ */
function applyLayout() {
  document.querySelectorAll('.map-item').forEach(el => {
    const p = layout[el.dataset.key];
    if (!p) return;
    el.style.left = (p.x * 100) + '%';
    el.style.top = (p.y * 100) + '%';
  });
}

function onMapTap(key) {
  if (editMode) return;
  if (key === 'shipMarket') { shopTab = 'ships'; openScreen('shop'); return; }
  if (key === 'fishMarket') { openScreen('storage'); return; }
  if (key === 'harbor' && currentTripState === TS.IDLE) showMessage('👆 اضغط القارب لتبدأ الرحلة');
}

function bindMap() {
  const scene = $('scene');
  document.querySelectorAll('.map-item').forEach(el => {
    el.addEventListener('click', () => onMapTap(el.dataset.key));
  });
  scene.addEventListener('pointerdown', function (e) {
    const item = e.target.closest('.map-item');
    if (!item || !editMode) return;
    dragKey = item.dataset.key;
    if (item.setPointerCapture) item.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  scene.addEventListener('pointermove', function (e) {
    if (!dragKey) return;
    const r = scene.getBoundingClientRect();
    layout[dragKey] = {
      x: clamp((e.clientX - r.left) / r.width, 0.08, 0.92),
      y: clamp((e.clientY - r.top) / r.height, 0.12, 0.8),
    };
    applyLayout();
  });
  const end = () => { dragKey = null; };
  scene.addEventListener('pointerup', end);
  scene.addEventListener('pointercancel', end);
}

function resetLayout() {
  layout = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
  applyLayout();
  saveLayout();
  showMessage('↺ رجعت الأماكن الأصلية');
  log('🗺 أُعيد ضبط التخطيط');
}

function toggleEdit() {
  editMode = !editMode;
  document.body.classList.toggle('edit-on', editMode);
  const t = $('editToggle');
  t.textContent = editMode ? '✅' : '🛠';
  t.classList.toggle('on', editMode);
  if (editMode) {
    if (currentTripState !== TS.IDLE) showMessage('⚠️ عدّل الأماكن بعد انتهاء الرحلة');
    else showMessage('✏️ اسحب الأماكن ثم اضغط ✅');
    hideTarget();
  } else {
    saveLayout();
    if (currentTripState === TS.IDLE) {
      P.x = layout.harbor.x; P.y = layout.harbor.y;
      P.tx = P.x; P.ty = P.y;
      P.vx = 0; P.vy = 0;
      P.hasTarget = false;
      applyBoatTransform();
    }
    showMessage('💾 تم حفظ أماكن الخريطة');
    log('🗺 حُفظ موقع الميناء والأسواق');
  }
}

/* ════════════ اللمس ════════════ */
$('editToggle').onclick = toggleEdit;
$('editReset').onclick = function () { if (editMode) resetLayout(); };

$('boat').addEventListener('click', function () {
  if (editMode) return;
  if (currentTripState === TS.IDLE) startTrip();
  else if (currentTripState === TS.FISHING) startReturn();
});

$('scene').addEventListener('pointerdown', function (e) {
  if (editMode) return;
  if (e.target.closest('.map-item, #boat')) return;
  if (currentTripState !== TS.IDLE) return;
  const r = $('scene').getBoundingClientRect();
  setTarget((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
});

/* ════════════ الحلقة الرئيسية ════════════ */
setInterval(function () {
  const now = Date.now();
  const dt = Math.min(0.1, (now - lastTick) / 1000);
  lastTick = now;

  updateBoatPhysics(dt);

  if (state.trip && currentTripState === TS.FISHING) {
    if (now >= state.trip.endsAt) {
      showMessage('⏰ انتهت الرحلة، عد للميناء');
      log('⏰ انتهت الرحلة');
      startReturn();
    } else {
      const ship = SHIP_BY_ID[state.trip.shipId] || currentShip();
      if (Math.random() < dt * catchChancePerSecond(ship)) {
        const id = pickFishFor(ship);
        const key = Math.random() < GOLD_CHANCE ? 'g_' + id : id;
        state.trip.catches.push(key);
        catchPop(isGolden(key) ? '✨' + FISH[id].emoji : FISH[id].emoji);
        beep(isGolden(key) ? 1320 : 880, 0.05);
        saveState();
        hook('onCatch', id);
      }
    }
  }

  if (now - lastRender > 250) {
    render();
    lastRender = now;
  }
  hook('tick', dt);
}, TICK_MS);

setInterval(rollEvent, EVENT_EVERY);

/* ════════════ أدوات التطوير ════════════ */
function setupDevTools() {
  if (!DEV_MODE) return;
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:200px;left:6px;z-index:50;display:flex;flex-direction:column;gap:6px;';
  const tools = [
    ['🔄', 'إعادة تعيين الحفظ', () => {
      if (confirm('حذف كل التقدم؟')) { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(LAYOUT_KEY); location.reload(); }
    }],
    ['⏩', 'إنهاء الرحلة', () => { if (state.trip) state.trip.endsAt = Date.now(); }],
    ['🐟', 'إضافة 5 أسماك', () => {
      for (let i = 0; i < 5; i++) {
        const k = pickFishFor(currentShip());
        state.inventory[k] = (state.inventory[k] || 0) + 1;
      }
      saveState(); renderStorage();
    }],
  ];
  tools.forEach(([icon, title, fn]) => {
    const b = document.createElement('button');
    b.textContent = icon;
    b.title = title;
    b.style.cssText = 'width:36px;height:36px;border-radius:50%;border:2px solid #FFD76A;background:rgba(0,0,0,.6);color:#fff;font-size:16px;padding:0;';
    b.onclick = fn;
    bar.appendChild(b);
  });
  $('app').appendChild(bar);
}

/* ════════════ البدء ════════════ */
ensureMarket();
applyLayout();
bindMap();
initBoatPosition();

if (state.trip) {
  if (Date.now() >= state.trip.endsAt) {
    endTrip();
  } else {
    currentTripState = TS.FISHING;
    setTarget(layout.sea.x, layout.sea.y);
    showMessage('🌊 استرجعت رحلتك السابقة');
    log('🔄 استرجعت رحلة جارية');
  }
}

applyEquipped();
rollEvent();
setActiveNav('home');
render();
renderStorage();
checkAchievements();
setupDevTools();
log('🎮 مرحباً ' + state.name + '، اللعبة جاهزة');
hook('onGameStart');

window.addEventListener('beforeunload', saveState);
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'hidden') saveState();
});
