'use strict';
/* ════════════ الشاشات والتنقل ════════════ */
function setActiveNav(name) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.screen === name));
}

function closeScreen() {
  document.querySelectorAll('.screen.open').forEach(s => s.classList.remove('open'));
  activeScreen = null;
  setActiveNav('home');
}

function refreshScreen(name) {
  if (name === 'shop') { syncShopTabs(); renderShop(); }
  if (name === 'storage') renderStorage();
  if (name === 'daily') renderDaily();
  if (name === 'achv') renderAchv();
  if (name === 'stats') renderStats();
}

function openScreen(name) {
  if (activeScreen === name) { closeScreen(); return; }
  closeScreen();
  if (name === 'home') return;
  const el = $('screen-' + name);
  if (!el) return;
  el.classList.add('open');
  activeScreen = name;
  setActiveNav(name);
  refreshScreen(name);
  hook('onScreenOpen', name);
}

document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => openScreen(btn.dataset.screen)));
document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', closeScreen));
document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
  shopTab = btn.dataset.tab;
  syncShopTabs();
  renderShop();
}));
function safeBind(id, handler, event) {
  var el = $(id);
  if (el) el[event || 'onclick'] = handler;
}
safeBind('sortSel', function () { sortMode = this.value; renderStorage(); }, 'onchange');
safeBind('sellAllBtn', function () { if (typeof sellAll === 'function') sellAll(); });
safeBind('claimBtn', function () { if (typeof claimDaily === 'function') claimDaily(); });
safeBind('soundBtn', function () {
  soundOn = !soundOn;
  localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off');
  renderStats();
});
safeBind('giftBtn', function () { openScreen('daily'); });
safeBind('playerBox', function () {
  var prof = window.ModuleRegistry && window.ModuleRegistry.get('profile');
  if (prof && typeof prof.open === 'function') prof.open();
});

