'use strict';

import { $, RARITY_COLORS, RARITY_NAMES, fishImg } from './config.js';
import { makeBtn, itemImage, emptyCard } from './ui.js';

let state = null;
let sortMode = 'price';
let unitPriceFn = null;
let baseOfFn = null;
let isGoldenFn = null;
let sellItemFn = null;
let sellAllFn = null;

export function initStorage(gameState, callbacks) {
  state = gameState;
  unitPriceFn = callbacks.unitPrice;
  baseOfFn = callbacks.baseOf;
  isGoldenFn = callbacks.isGolden;
  sellItemFn = callbacks.sellItem;
  sellAllFn = callbacks.sellAll;
}

export function setSortMode(mode) {
  sortMode = mode;
}

export function invEntries(FISH) {
  return Object.keys(state.inventory).filter(k => {
    return state.inventory[k] > 0 && FISH[baseOfFn(k)];
  });
}

export function renderStorage(FISH) {
  const keys = invEntries(FISH);
  let total = 0;
  keys.forEach(k => {
    total += unitPriceFn(k) * state.inventory[k];
  });

  const invValueEl = $('invValue');
  if (invValueEl) invValueEl.textContent = total.toLocaleString();

  const list = $('invList');
  list.innerHTML = '';

  if (!keys.length) {
    list.appendChild(emptyCard('المخزن فارغ — أبحر لتصطاد الأسماك.'));
    return;
  }

  const rank = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };

  keys.sort((a, b) => {
    const A = FISH[baseOfFn(a)];
    const B = FISH[baseOfFn(b)];
    if (sortMode === 'qty') return state.inventory[b] - state.inventory[a];
    if (sortMode === 'rarity') return rank[B.rarity] - rank[A.rarity];
    return unitPriceFn(b) * state.inventory[b] - unitPriceFn(a) * state.inventory[a];
  });

  keys.forEach(k => {
    const id = baseOfFn(k);
    const f = FISH[id];
    const qty = state.inventory[k];

    const card = document.createElement('div');
    card.className = 'card';
    card.style.setProperty('--rc', isGoldenFn(k) ? '#FFD76A' : RARITY_COLORS[f.rarity]);

    const th = document.createElement('div');
    th.className = 'thumb';
    th.appendChild(itemImage({ img: fishImg(id), name: f.name, icon: f.emoji }, 56, 46));
    card.appendChild(th);

    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML =
      '<div class="nm">' + f.name + ' × ' + qty +
      (isGoldenFn(k) ? '<span class="tag">ذهبية ✨</span>' : '') + '</div>' +
      '<div class="sub" style="color:' + RARITY_COLORS[f.rarity] + '">● ' + RARITY_NAMES[f.rarity] + '</div>' +
      '<div class="pr">💰 ' + unitPriceFn(k).toLocaleString() + ' للقطعة</div>';
    card.appendChild(info);

    const acts = document.createElement('div');
    acts.className = 'acts';
    acts.appendChild(makeBtn('بيع 1', 'btn', () => sellItemFn(k, 1)));
    acts.appendChild(makeBtn('بيع الكل', 'btn alt', () => sellItemFn(k, qty)));
    card.appendChild(acts);

    list.appendChild(card);
  });
}
