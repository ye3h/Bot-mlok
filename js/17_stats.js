'use strict';
/* ════════════ الإحصاءات (v2.0.0) ════════════ */
function renderStats() {
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
  renderSoundBtn();
}

// يعرض حالة الصوت الحالية على زر الإحصاءات
function renderSoundBtn() {
  const btn = $('soundBtn');
  if (!btn) return;
  const on = (window.GameSettings && GameSettings.cfg) ? !!GameSettings.cfg.sound : !!soundOn;
  btn.textContent = on ? '🔊 الصوت: مفعّل' : '🔇 الصوت: مُغلق';
}

// زر الصوت في الإحصاءات يبدّل نفس الإعداد اللي في شاشة الإعدادات
(function bindSoundBtn() {
  function toggle() {
    if (window.GameSettings && GameSettings.set) {
      GameSettings.set('sound', !GameSettings.cfg.sound);
    } else {
      soundOn = !soundOn;
    }
    renderSoundBtn();
  }
  const btn = document.getElementById('soundBtn');
  if (btn) btn.addEventListener('click', toggle);
})();
