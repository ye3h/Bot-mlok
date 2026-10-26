'use strict';
/* ════════════ الصوت والتأثيرات ════════════ */
function beep(freq, dur) {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.05, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}

function fly(text, anchor, cls) {
  const app = $('app');
  const el = document.createElement('div');
  el.className = 'fly' + (cls ? ' ' + cls : '');
  el.textContent = text;
  if (anchor) {
    const r = anchor.getBoundingClientRect(), ar = app.getBoundingClientRect();
    el.style.left = (r.left - ar.left + r.width / 2) + 'px';
    el.style.top = (r.top - ar.top) + 'px';
  } else {
    el.style.left = '50%';
    el.style.top = '180px';
  }
  app.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

function catchPop(emoji) {
  const scene = $('scene');
  const el = document.createElement('div');
  el.className = 'fly pop';
  el.textContent = emoji;
  el.style.left = (P.x * scene.clientWidth) + 'px';
  el.style.top = (P.y * scene.clientHeight - 50) + 'px';
  scene.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

