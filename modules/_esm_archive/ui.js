'use strict';

import { $, setText } from './config.js';

let _msgTimer = null;
let lastRender = 0;

/* ════════════ الرسائل ════════════ */
export function showMessage(text) {
  const el = $('message');
  if (!el) return;
  el.textContent = text;
  el.classList.add('visible');
  if (_msgTimer) clearTimeout(_msgTimer);
  _msgTimer = setTimeout(() => el.classList.remove('visible'), 2800);
}

/* ════════════ الإشعارات ════════════ */
const notifHistory = [];
const notifQueue = [];
const NOTIF_SHOW_MS = 2500;
const NOTIF_GAP_MS = 250;
let notifBusy = false;

export function log(text) {
  notifHistory.unshift({ text: text, at: Date.now() });
  if (notifHistory.length > 50) notifHistory.pop();
  notifQueue.push(text);
  if (!notifBusy) showNextNotif();
}

function showNextNotif() {
  const host = $('notifs');
  const text = notifQueue.shift();
  if (!host || text === undefined) {
    notifBusy = false;
    return;
  }

  notifBusy = true;
  host.textContent = text;
  host.classList.add('show');

  setTimeout(() => {
    host.classList.remove('show');
    setTimeout(() => {
      notifBusy = false;
      showNextNotif();
    }, NOTIF_GAP_MS);
  }, NOTIF_SHOW_MS);
}

/* ════════════ أدوات DOM ════════════ */
export function makeBtn(text, cls, onClick, disabled) {
  const b = document.createElement('button');
  b.textContent = text;
  b.className = cls || 'btn';
  b.disabled = !!disabled;
  if (onClick) b.onclick = onClick;
  return b;
}

export function itemImage(item, w, h) {
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

export function emptyCard(text) {
  const d = document.createElement('div');
  d.className = 'card';
  d.innerHTML = '<div class="info muted">' + text + '</div>';
  return d;
}

/* ════════════ الرسم الرئيسي ════════════ */
export function render(state, currentTripState, levelOf, levelProgress, MAX_LEVEL, tripCount, canClaimDaily, renderEvent) {
  setText('coins', state.coins.toLocaleString());
  setText('gems', state.gems);
  setText('fishCount', state.stats.caught);
  setText('pname', state.name);

  const lv = levelOf(state.xp);
  setText('lvlTxt', 'مستوى ' + lv + ' / ' + MAX_LEVEL);

  const lf = $('lvlFill');
  if (lf) lf.style.width = levelProgress(state.xp) + '%';

  const boat = $('boat');
  const progress = $('progress');
  const busy = currentTripState !== 'idle';

  if (boat) boat.classList.toggle('sailing', busy);
  if (progress) progress.classList.toggle('visible', !!state.trip);

  if (state.trip) {
    const t = state.trip;
    const total = t.endsAt - t.startedAt;
    const pct = total > 0
      ? Math.min(100, ((Date.now() - t.startedAt) / total) * 100)
      : 100;
    const fill = $('progressFill');
    if (fill) fill.style.width = pct + '%';
    setText('progressText', Math.floor(pct) + '%   🐟 ' + tripCount(t));
  }

  $('giftBtn').classList.toggle('ping', canClaimDaily());
  renderEvent();
}
