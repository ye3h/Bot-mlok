'use strict';

import { $, RARITY_COLORS } from './config.js';
import { makeBtn, itemImage } from './ui.js';

let state = null;
let shopTab = 'ships';
let previewTimer = null;
let previewBackId = null;
let callbacks = {};

export function initShop(gameState, cbs) {
  state = gameState;
  callbacks = cbs;
}

export function getShopTab() { return shopTab; }
export function setShopTab(tab) { shopTab = tab; }

export function getPreviewBackId() { return previewBackId; }

export function syncShopTabs() {
  document.querySelectorAll('.tab').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === shopTab);
  });
}

export function renderShop(SHIPS, BACKGROUNDS, SHIP_BY_ID, ITEM_BY_ID, levelOf) {
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
      html += '<div class="sub">⏱ ' + item.trip_seconds + ' ث رحلة · 🎣 ' +
        item.catch_seconds + ' ث لكل صيدة · 🐟 ' + item.fish.length + ' أنواع</div>';
    }

    const price = owned
      ? '✓ مملوك'
      : (locked ? '🔒 يتطلب المستوى ' + item.req_level : '💰 ' + item.price_coins.toLocaleString());

    html += '<div class="pr">' + price + '</div>';

    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML = html;
    card.appendChild(info);

    const acts = document.createElement('div');
    acts.className = 'acts';

    if (!owned) {
      acts.appendChild(makeBtn(locked ? 'مقفل' : 'شراء', 'btn gold',
        () => buyItem(item.id, ITEM_BY_ID, levelOf), locked));
    } else if (!equipped) {
      acts.appendChild(makeBtn('تركيب', 'btn', () => equipItem(item.id, ITEM_BY_ID)));
    } else {
      acts.appendChild(makeBtn('مُركّب ✓', 'btn', null, true));
    }

    if (item.cat === 'backgrounds' && !equipped) {
      acts.appendChild(makeBtn('معاينة', 'btn alt', () => previewBackground(item.id, ITEM_BY_ID)));
    }

    card.appendChild(acts);
    list.appendChild(card);
  });
}

function buyItem(id, ITEM_BY_ID, levelOf) {
  const item = ITEM_BY_ID[id];
  if (!item || state.owned.includes(id)) return;

  if (levelOf(state.xp) < (item.req_level || 0)) {
    callbacks.showMessage('🔒 تحتاج المستوى ' + item.req_level);
    return;
  }

  if (state.coins < item.price_coins) {
    callbacks.showMessage('💰 الذهب غير كافٍ');
    return;
  }

  state.coins -= item.price_coins;
  state.owned.push(id);
  callbacks.save();
  callbacks.render();
  renderShop(callbacks.SHIPS, callbacks.BACKGROUNDS, callbacks.SHIP_BY_ID, ITEM_BY_ID, levelOf);
  callbacks.beep(780, 0.12);
  callbacks.showMessage('✅ تم شراء ' + item.name);
  callbacks.log('🛒 اشتريت ' + item.name);
  callbacks.checkAchievements();
}

function equipItem(id, ITEM_BY_ID) {
  const item = ITEM_BY_ID[id];
  if (!item || !state.owned.includes(id)) return;

  if (callbacks.getTripState() !== 'idle') {
    callbacks.showMessage('⚠️ لا يمكن التغيير أثناء الرحلة');
    return;
  }

  state.equipped[item.cat] = id;
  callbacks.save();
  callbacks.applyEquipped();
  renderShop(callbacks.SHIPS, callbacks.BACKGROUNDS, callbacks.SHIP_BY_ID, ITEM_BY_ID, callbacks.levelOf);
  callbacks.showMessage('⚓ تم تركيب ' + item.name);
}

export function getBgStyle(id, ITEM_BY_ID, GRADIENT_BG) {
  const item = ITEM_BY_ID[id];
  if (item && item.img) {
    return "url('" + item.img + "') center/cover no-repeat," + GRADIENT_BG;
  }
  return GRADIENT_BG;
}

export function applyBackground(id, ITEM_BY_ID, GRADIENT_BG) {
  const scene = $('scene');
  if (scene) scene.style.background = getBgStyle(id, ITEM_BY_ID, GRADIENT_BG);
}

export function previewBackground(id, ITEM_BY_ID) {
  const item = ITEM_BY_ID[id];
  if (!item) return;

  if (previewTimer) clearTimeout(previewTimer);
  previewBackId = id;
  applyBackground(id, ITEM_BY_ID, callbacks.GRADIENT_BG);
  callbacks.showMessage('👁 معاينة ' + item.name + ' — 5 ثوانٍ');

  previewTimer = setTimeout(() => {
    previewBackId = null;
    callbacks.applyEquipped();
  }, 5000);
}

export function applyShip(SHIPS, SHIP_BY_ID) {
  const boat = $('boat');
  if (!boat) return;

  const ship = SHIP_BY_ID[state.equipped.ships] || SHIPS[0];
  boat.innerHTML = '';

  const img = document.createElement('img');
  img.src = ship.img;
  img.alt = ship.name;
  img.onerror = function () {
    boat.textContent = ship.icon || '⛵';
  };
  boat.appendChild(img);
}

export function applyEquipped(ITEM_BY_ID, GRADIENT_BG, SHIPS, SHIP_BY_ID) {
  if (previewBackId) return;
  applyBackground(state.equipped.backgrounds, ITEM_BY_ID, GRADIENT_BG);
  applyShip(SHIPS, SHIP_BY_ID);
}
