'use strict';

import { $ } from './config.js';

let state = null;
let callbacks = {};

export function initDaily(gameState, cbs) {
  state = gameState;
  callbacks = cbs;
}

function todayKey(d) {
  d = d || new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

export function canClaimDaily() {
  return state.daily.last !== todayKey();
}

function nextStreak() {
  return state.daily.last === yesterdayKey()
    ? (state.daily.streak || 0) + 1
    : 1;
}

function dailyCoins(streak) {
  return 200 + Math.min(streak, 30) * 50;
}

function timeToMidnight() {
  const n = new Date();
  const m = new Date(n);
  m.setHours(24, 0, 0, 0);
  const ms = m - n;
  return Math.floor(ms / 3600000) + ' س ' +
    Math.floor((ms % 3600000) / 60000) + ' د';
}

export function claimDaily() {
  if (!canClaimDaily()) return;

  const s = nextStreak();
  const coins = dailyCoins(s);
  let gems = 0;

  state.coins += coins;
  if (s % 7 === 0) {
    gems = 10;
    state.gems += gems;
  }

  state.daily = { last: todayKey(), streak: s };
  callbacks.save();
  callbacks.render();
  renderDaily();

  callbacks.fly('+' + coins + ' 💰', $('giftBtn'));
  callbacks.beep(990, 0.15);
  callbacks.showMessage('🎁 اليوم ' + s + ' — +' + coins + (gems ? ' و 10 💎' : ''));
  callbacks.hook('onDaily');
  callbacks.checkAchievements();
}

export function renderDaily() {
  const can = canClaimDaily();
  const streak = state.daily.streak || 0;

  $('dailyHero').innerHTML =
    '<div class="muted">سلسلة الأيام</div>' +
    '<div class="big">🔥 ' + streak + ' يوم</div>' +
    '<div class="muted" style="margin-top:6px">المكافأة القادمة: ' +
    dailyCoins(can ? nextStreak() : streak + 1).toLocaleString() + ' 💰</div>';

  const btn = $('claimBtn');
  btn.disabled = !can;
  btn.textContent = can ? '🎁 استلم المكافأة' : '✓ استلمت مكافأة اليوم';
  $('dailyInfo').textContent = can
    ? 'مكافآتك جاهزة الآن'
    : 'تتجدد بعد ' + timeToMidnight();
}
