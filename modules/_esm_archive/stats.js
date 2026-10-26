'use strict';

import { $ } from './config.js';

export function renderStats(state, levelOf, soundOn) {
  const s = state.stats;

  const items = [
    [s.caught.toLocaleString(), 'سمكة مصطادة'],
    [s.trips.toLocaleString(), 'رحلة'],
    [s.sold.toLocaleString(), 'سمكة مباعة'],
    [s.earned.toLocaleString(), 'ذهب من البيع'],
    [s.golden.toLocaleString(), 'صيد ذهبي ✨'],
    [s.legendary.toLocaleString(), 'صيد أسطوري 🌟'],
    [levelOf(state.xp), 'المستوى الحالي'],
    [state.xp.toLocaleString(), 'مجموع الخبرة'],
  ];

  $('statsGrid').innerHTML = items.map(([v, k]) =>
    '<div class="stat"><div class="v">' + v + '</div><div class="k">' + k + '</div></div>'
  ).join('');

  $('soundBtn').textContent = soundOn
    ? '🔊 الصوت: مفعّل'
    : '🔇 الصوت: مُغلق';
}
