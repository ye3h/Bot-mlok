'use strict';

import { $ } from './config.js';

let state = null;
let callbacks = {};
let ACHIEVEMENTS = [];

export function initAchievements(gameState, cbs, achievementsList) {
  state = gameState;
  callbacks = cbs;
  ACHIEVEMENTS = achievementsList;
}

export function checkAchievements() {
  ACHIEVEMENTS.forEach(a => {
    if (state.achv[a.id] || !a.test(state)) return;

    state.achv[a.id] = true;
    state.gems += a.gems;
    callbacks.save();
    callbacks.render();

    callbacks.showMessage('🏆 إنجاز: ' + a.name + ' +' + a.gems + ' 💎');
    callbacks.log('🏆 ' + a.name + ' — ' + a.desc);
    callbacks.beep(1040, 0.2);
  });
}

export function renderAchv() {
  const list = $('achvList');
  list.innerHTML = '';

  const done = ACHIEVEMENTS.filter(a => state.achv[a.id]).length;

  const hero = document.createElement('div');
  hero.className = 'hero';
  hero.innerHTML = '<div class="muted">المنجز</div><div class="big">' +
    done + ' / ' + ACHIEVEMENTS.length + '</div>';
  list.appendChild(hero);

  ACHIEVEMENTS.forEach(a => {
    const ok = !!state.achv[a.id];
    const card = document.createElement('div');
    card.className = 'card' + (ok ? ' ach-done' : ' locked');
    card.style.setProperty('--rc', ok ? '#FFD76A' : '#555');
    card.innerHTML =
      '<div class="thumb" style="font-size:26px">' + (ok ? '🏆' : '🔒') + '</div>' +
      '<div class="info"><div class="nm">' + a.name + '</div>' +
      '<div class="sub">' + a.desc + '</div>' +
      '<div class="pr">' + (ok ? '✓ مكتمل' : '💎 ' + a.gems) + '</div></div>';
    list.appendChild(card);
  });
}
