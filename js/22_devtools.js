'use strict';
/* ════════════ أدوات التطوير ════════════ */
function setupDevTools() {
  if (!DEV_MODE) return;
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:200px;left:6px;z-index:50;display:flex;flex-direction:column;gap:6px;';
  const tools = [
    ['🔄', 'إعادة تعيين الحفظ', () => {
      if (confirm('حذف كل التقدم؟')) { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(LAYOUT_KEY); location.reload(); }
    }],
    ['⏩', 'إنهاء الرحلة', () => { if (state.trip) state.trip.endsAt = Date.now(); }],
    ['🐟', 'إضافة 5 أسماك', () => {
      for (let i = 0; i < 5; i++) {
        const k = pickFishFor(currentShip());
        state.inventory[k] = (state.inventory[k] || 0) + 1;
      }
      saveState(); renderStorage();
    }],
  ];
  tools.forEach(([icon, title, fn]) => {
    const b = document.createElement('button');
    b.textContent = icon;
    b.title = title;
    b.style.cssText = 'width:36px;height:36px;border-radius:50%;border:2px solid #FFD76A;background:rgba(0,0,0,.6);color:#fff;font-size:16px;padding:0;';
    b.onclick = fn;
    bar.appendChild(b);
  });
  $('app').appendChild(bar);
}

