'use strict';

import { $, clamp } from './config.js';

let layout = null;
let editMode = false;
let dragKey = null;
let callbacks = {};

export function initMap(layoutData, cbs) {
  layout = layoutData;
  callbacks = cbs;
}

export function isEditMode() { return editMode; }

export function applyLayout() {
  document.querySelectorAll('.map-item').forEach(el => {
    const p = layout[el.dataset.key];
    if (!p) return;
    el.style.left = (p.x * 100) + '%';
    el.style.top = (p.y * 100) + '%';
  });
}

function onMapTap(key) {
  if (editMode) return;

  if (key === 'shipMarket') {
    const market = window.ModuleRegistry && window.ModuleRegistry.get('ship_market');
    if (market) {
      market.open();
    } else {
      callbacks.setShopTab('ships');
      callbacks.openScreen('shop');
    }
    return;
  }

  if (key === 'fishMarket') {
    callbacks.openScreen('storage');
    return;
  }

  if (key === 'harbor' && callbacks.getTripState() === 'idle') {
    callbacks.showMessage('👆 اضغط القارب لتبدأ الرحلة');
  }
}

export function bindMap() {
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

export function resetLayout(DEFAULT_LAYOUT) {
  layout = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
  applyLayout();
  callbacks.saveLayout(layout);
  callbacks.showMessage('↺ رجعت الأماكن الأصلية');
  callbacks.log('🗺 أُعيد ضبط التخطيط');
}

export function toggleEdit() {
  editMode = !editMode;
  document.body.classList.toggle('edit-on', editMode);

  const t = $('editToggle');
  t.textContent = editMode ? '✅' : '🛠';
  t.classList.toggle('on', editMode);

  if (editMode) {
    if (callbacks.getTripState() !== 'idle') {
      callbacks.showMessage('⚠️ عدّل الأماكن بعد انتهاء الرحلة');
    } else {
      callbacks.showMessage('✏️ اسحب الأماكن ثم اضغط ✅');
    }
    callbacks.hideTarget();
  } else {
    callbacks.saveLayout(layout);
    if (callbacks.getTripState() === 'idle') {
      callbacks.resetBoatToHarbor();
    }
    callbacks.showMessage('💾 تم حفظ أماكن الخريطة');
    callbacks.log('🗺 حُفظ موقع الميناء والأسواق');
  }
}
