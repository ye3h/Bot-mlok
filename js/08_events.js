'use strict';
/* ════════════ الأحداث (v2.0.0) ════════════
   يستخدم المتغير العام activeEvent المعرّف في 05_runtime.js
   ═══════════════════════════════════════════ */

// إشعارات آمنة: لا تنهار إذا لم تكن الدوال محمّلة بعد
function notify(msg) {
  if (typeof showMessage === 'function') showMessage(msg);
}
function notifyLog(msg) {
  if (typeof log === 'function') log(msg);
}

function rollEvent() {
  if (activeEvent && Date.now() < activeEvent.until) return;
  activeEvent = null;

  if (Math.random() < EVENT_CHANCE) {
    var ids = Object.keys(FISH);
    var id = ids[Math.floor(Math.random() * ids.length)];
    var boom = Math.random() < 0.6;

    activeEvent = {
      fish: id,
      mult: boom ? 1.8 : 0.5,
      boom: boom,
      until: Date.now() + EVENT_LIFE
    };

    notify((boom ? '🔥 موسم ' : '📉 كساد ') + FISH[id].name);
    notifyLog((boom ? '🔥 ارتفع سعر ' : '📉 انخفض سعر ') + FISH[id].name + ' مؤقتاً');
  }

  renderEvent();
}

function renderEvent() {
  var b = document.getElementById('eventBanner');
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

function isEventActive() {
  return !!(activeEvent && Date.now() < activeEvent.until);
}
