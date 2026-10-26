'use strict';

import { hook } from './config.js';

let activeScreen = null;
let callbacks = {};

export function initNavigation(cbs) {
  callbacks = cbs;
}

export function getActiveScreen() { return activeScreen; }

export function setActiveNav(name) {
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.screen === name);
  });
}

export function closeScreen() {
  document.querySelectorAll('.screen.open').forEach(s => {
    s.classList.remove('open');
  });
  activeScreen = null;
  setActiveNav('home');
}

export function refreshScreen(name) {
  if (name === 'shop') {
    callbacks.syncShopTabs();
    callbacks.renderShop();
  }
  if (name === 'storage') callbacks.renderStorage();
  if (name === 'daily') callbacks.renderDaily();
  if (name === 'achv') callbacks.renderAchv();
  if (name === 'stats') callbacks.renderStats();
}

export function openScreen(name) {
  if (activeScreen === name) {
    closeScreen();
    return;
  }

  closeScreen();
  if (name === 'home') return;

  const el = document.getElementById('screen-' + name);
  if (!el) return;

  el.classList.add('open');
  activeScreen = name;
  setActiveNav(name);
  refreshScreen(name);
  hook('onScreenOpen', name);
}

export function bindNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => openScreen(btn.dataset.screen));
  });

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', closeScreen);
  });

  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      callbacks.setShopTab(btn.dataset.tab);
      callbacks.syncShopTabs();
      callbacks.renderShop();
    });
  });
}
