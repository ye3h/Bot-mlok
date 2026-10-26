'use strict';
/* ════════════ الرحلة (v2.1.0) ════════════
   - مدة الرحلة = TRIP_DURATION (فاصل الصيد fishing_seconds منفصل ولا يتغير هنا)
   - الزمن المنقضي لا يرجع للخلف (lastSeen)
   - ردع محلي فقط. الحماية الحقيقية تكون على السيرفر
   ═════════════════════════════════════════════ */

// وقت اللعبة: وقت الخادم إن توفّر، وإلا وقت الجهاز
function gameNow() {
  var dash = window.ModuleRegistry && ModuleRegistry.get('dashboard');
  if (dash && typeof dash.verified === 'function' && dash.verified()) {
    return dash.now().getTime();
  }
  return Date.now();
}

function tripDurationMs() {
  return (typeof TRIP_DURATION === 'number' && TRIP_DURATION > 0) ? TRIP_DURATION : 60000;
}

function startTrip() {
  if (editMode || state.trip || currentTripState !== TS.IDLE) return;

  var now = gameNow();
  var dur = tripDurationMs();

  state.trip = {
    startedAt: now,
    lastSeen: now,
    durationMs: dur,
    endsAt: now + dur,              // للتوافق مع الحفظ القديم
    shipId: state.equipped.ships,
    catches: []
  };

  currentTripState = TS.FISHING;
  setTarget(layout.sea.x, layout.sea.y);
  saveState();
  render();
  showMessage('🌊 القارب في البحر — يصطاد...');
  log('⛵ بدأت الرحلة بـ ' + currentShip().name);
  beep(440, 0.1);
  hook('onTripStart');
}

// الزمن المنقضي للرحلة، لا يتناقص أبداً حتى لو رجعت الساعة للخلف
function tripElapsedMs() {
  var t = state.trip;
  if (!t) return 0;
  var now = gameNow();
  if (typeof t.lastSeen !== 'number' || now > t.lastSeen) t.lastSeen = now;
  return Math.max(0, t.lastSeen - t.startedAt);
}

function tripDur() {
  if (!state.trip) return 0;
  return state.trip.durationMs || (state.trip.endsAt - state.trip.startedAt) || tripDurationMs();
}

function tripRemainingMs() {
  if (!state.trip) return 0;
  return Math.max(0, tripDur() - tripElapsedMs());
}

function tripProgress() {
  var dur = tripDur();
  if (!state.trip) return 0;
  if (dur <= 0) return 1;
  return Math.min(1, tripElapsedMs() / dur);
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

  var catches = state.trip.catches || [];
  var xpGain = 0, legendaryCount = 0, goldenCount = 0;

  catches.forEach(function (k) {
    state.inventory[k] = (state.inventory[k] || 0) + 1;
    var id = baseOf(k);
    state.stats.caught++;
    if (isGolden(k)) { state.stats.golden++; goldenCount++; }
    if (FISH[id].rarity === 'legendary') { state.stats.legendary++; legendaryCount++; }
    xpGain += xpFor(id) * (isGolden(k) ? GOLD_MULT : 1);
  });
  state.stats.trips++;

  var before = levelOf(state.xp);
  state.xp += xpGain;
  var after = levelOf(state.xp);
  state.trip = null;
  saveState();
  render();
  renderStorage();

  if (after > before) {
    var bonus = after * 100;
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
  var normal = {}, gold = {}, order = [];
  catches.forEach(function (k) {
    var id = baseOf(k);
    if (!normal[id] && !gold[id]) order.push(id);
    if (isGolden(k)) gold[id] = (gold[id] || 0) + 1;
    else normal[id] = (normal[id] || 0) + 1;
  });
  return order.map(function (id) {
    var s = '';
    if (normal[id]) s += normal[id] + ' ' + FISH[id].name;
    if (gold[id]) s += (s ? ' + ' : '') + gold[id] + ' ✨' + FISH[id].name;
    return s;
  });
}
