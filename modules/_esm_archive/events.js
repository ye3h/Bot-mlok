'use strict';

import { EVENT_CHANCE, EVENT_LIFE, $ } from './config.js';

let activeEvent = null;
let onEventChange = null;

export function initEvents(callback) {
  onEventChange = callback;
}

export function getActiveEvent() { return activeEvent; }

export function rollEvent(showMessage, log) {
  if (activeEvent && Date.now() < activeEvent.until) return;
  activeEvent = null;

  if (Math.random() < EVENT_CHANCE) {
    const ids = Object.keys(FISH);
    const id = ids[Math.floor(Math.random() * ids.length)];
    const boom = Math.random() < 0.6;

    activeEvent = {
      fish: id,
      mult: boom ? 1.8 : 0.5,
      boom,
      until: Date.now() + EVENT_LIFE
    };

    showMessage((boom ? '🔥 موسم ' : '📉 كساد ') + FISH[id].name);
    log((boom ? '🔥 ارتفع سعر ' : '📉 انخفض سعر ') + FISH[id].name + ' مؤقتاً');
  }

  renderEvent();
  if (onEventChange) onEventChange(activeEvent);
}

export function renderEvent() {
  const b = $('eventBanner');
  if (!b) return;

  if (activeEvent && Date.now() < activeEvent.until) {
    b.textContent = (activeEvent.boom ? '🔥 موسم ' : '📉 كساد ') +
      FISH[activeEvent.fish].name + ' × ' + activeEvent.mult;
    b.classList.add('show');
  } else {
    activeEvent = null;
    b.classList.remove('show');
  }
}

export function isEventActive() {
  return activeEvent && Date.now() < activeEvent.until;
}
