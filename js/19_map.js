'use strict';
function applyLayout() {
  document.querySelectorAll('.map-item').forEach(function (el) {
    var p = layout[el.dataset.key];
    if (!p) return;
    el.style.left = (p.x * 100) + '%';
    el.style.top = (p.y * 100) + '%';
  });
}

function onMapTap(key) {
  if (editMode) return;

  if (key === 'shipMarket') {
    var sm = window.ModuleRegistry && window.ModuleRegistry.get('ship_market');
    if (sm && typeof sm.open === 'function') { sm.open(); return; }
    shopTab = 'ships'; openScreen('shop'); return;
  }

  if (key === 'fishMarket') {
    var fm = window.ModuleRegistry && window.ModuleRegistry.get('fish_market');
    if (fm && typeof fm.open === 'function') { fm.open(); return; }
    openScreen('storage');
    return;
  }

  if (key === 'harbor' && currentTripState === TS.IDLE) showMessage('👆 اضغط القارب لتبدأ الرحلة');
}

function bindMap() {
  var scene = $('scene');
  document.querySelectorAll('.map-item').forEach(function (el) {
    el.addEventListener('click', function () { onMapTap(el.dataset.key); });
  });
  scene.addEventListener('pointerdown', function (e) {
    var item = e.target.closest('.map-item');
    if (!item || !editMode) return;
    dragKey = item.dataset.key;
    if (item.setPointerCapture) item.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  scene.addEventListener('pointermove', function (e) {
    if (!dragKey) return;
    var r = scene.getBoundingClientRect();
    layout[dragKey] = {
      x: clamp((e.clientX - r.left) / r.width, 0.08, 0.92),
      y: clamp((e.clientY - r.top) / r.height, 0.12, 0.8)
    };
    applyLayout();
  });
  var end = function () { dragKey = null; };
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
  var t = $('editToggle');
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
