'use strict';
/* ════════════ الرسم (v2.1.0) ════════════
   - الاسم والمستوى يُحدَّثان أولاً قبل أي شيء قد يفشل
   - شريط تقدم الرحلة يستخدم tripProgress() من 11_trip.js
   - عداد الأسماك في الشريط يُدار من 29_ui.js (لا يُكتب هنا)
   ═════════════════════════════════════════════════ */

function render() {
  if (typeof state === 'undefined' || !state) return;

  // أولاً: البيانات الأساسية
  setText('pname', state.name || 'القبطان');
  var lv = levelOf(state.xp);
  setText('lvlTxt', 'مستوى ' + lv + ' / ' + MAX_LEVEL);
  var lf = $('lvlFill');
  if (lf) lf.style.width = levelProgress(state.xp) + '%';
  setText('coins', Number(state.coins || 0).toLocaleString());
  setText('gems', state.gems || 0);

  // ثانياً: حالة الرحلة
  var boat = $('boat'), progress = $('progress');
  var busy = currentTripState !== TS.IDLE;
  if (boat) boat.classList.toggle('sailing', busy);
  if (progress) progress.classList.toggle('visible', !!state.trip);

  if (state.trip) {
    var pct = (typeof tripProgress === 'function') ? tripProgress() * 100 : 0;
    var fill = $('progressFill');
    if (fill) fill.style.width = pct + '%';
    setText('progressText', Math.floor(pct) + '%   🐟 ' + (state.trip.catches || []).length);
  }

  // ثالثاً: عناصر أخرى
  var gb = $('giftBtn');
  if (gb && typeof canClaimDaily === 'function') gb.classList.toggle('ping', canClaimDaily());
  if (typeof renderEvent === 'function') renderEvent();
}

function showMessage(text) {
  var el = $('message');
  if (!el) return;
  el.textContent = text;
  el.classList.add('visible');
  if (_msgTimer) clearTimeout(_msgTimer);
  _msgTimer = setTimeout(function () { el.classList.remove('visible'); }, 2800);
}

function log(text) {
  var logEl = $('log');
  if (!logEl) return;
  logEl.classList.add('visible');
  var line = document.createElement('div');
  line.className = 'line';
  var time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  line.textContent = time + ' — ' + text;
  logEl.insertBefore(line, logEl.firstChild);
  while (logEl.children.length > 20) logEl.removeChild(logEl.lastChild);
}

function makeBtn(text, cls, onClick, disabled) {
  var b = document.createElement('button');
  b.textContent = text;
  b.className = cls || 'btn';
  b.disabled = !!disabled;
  if (onClick) b.onclick = onClick;
  return b;
}

function itemImage(item, w, h) {
  var img = document.createElement('img');
  img.src = item.img;
  img.alt = item.name;
  img.style.width = w + 'px';
  img.style.height = h + 'px';
  img.onerror = function () {
    var s = document.createElement('span');
    s.textContent = item.icon || '🖼';
    s.style.fontSize = '28px';
    img.replaceWith(s);
  };
  return img;
}

function emptyCard(text) {
  var d = document.createElement('div');
  d.className = 'card';
  d.innerHTML = '<div class="info muted">' + text + '</div>';
  return d;
}
