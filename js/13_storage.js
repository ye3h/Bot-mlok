'use strict';
/* ════════════ المخزن الشخصي وسفن الأسطول (v5.3.0) ════════════ */

var _storageTab = 'crews';

// تسجيل الموديول ليكون متوافقاً مع سوق السفن وباقي الأزرار
if (typeof ModuleRegistry !== 'undefined') {
  ModuleRegistry.register({
    id: 'ship_storage',
    name: 'مخزن السفن والمخزن',
    version: '5.3.0',
    init: function(ctx) {
      this.ctx = ctx;
    },
    open: function() {
      if (typeof openPersonalStorage === 'function') {
        openPersonalStorage();
      }
    }
  });
}

// ═══ دوال مساعدة (fallback) ═══
if (typeof window.baseOf !== 'function') {
  window.baseOf = function (k) { return String(k).indexOf('g_') === 0 ? String(k).slice(2) : String(k); };
}
if (typeof window.isGolden !== 'function') {
  window.isGolden = function (k) { return String(k).indexOf('g_') === 0; };
}
if (typeof window.invEntries !== 'function') {
  window.invEntries = function () {
    return Object.keys(state.inventory || {}).filter(function (k) {
      return state.inventory[k] > 0 && (typeof FISH !== 'undefined') && FISH[window.baseOf(k)];
    });
  };
}
if (typeof window.unitPrice !== 'function') {
  window.unitPrice = function (k) {
    var id = window.baseOf(k);
    var f = FISH[id];
    if (!f) return 1;
    var p = f.base;
    if (state.market && state.market[id] && typeof state.market[id].mult === 'number') {
      p *= state.market[id].mult;
    }
    if (window.isGolden(k)) p *= (typeof GOLD_MULT !== 'undefined' ? GOLD_MULT : 3);
    return Math.max(1, Math.round(p));
  };
}
if (typeof window.sellItem !== 'function') {
  window.sellItem = function (k, qty) {
    var n = Math.min(qty, state.inventory[k] || 0);
    if (n <= 0) return;
    var id = window.baseOf(k);
    var isGold = window.isGolden(k);
    var got = 0;
    for (var i = 0; i < n; i++) {
      got += window.unitPrice(k);
      if (!isGold && state.market && state.market[id]) {
        var m = state.market[id];
        m.mult = Math.max(0.8, m.mult * (1 - 0.02));
        m.soldSinceTick = (m.soldSinceTick || 0) + 1;
      }
    }
    state.inventory[k] -= n;
    if (state.inventory[k] <= 0) delete state.inventory[k];
    state.coins += got;
    state.stats.sold += n;
    state.stats.earned += got;
    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
    if (typeof renderStorage === 'function') renderStorage();
  };
}
if (typeof window.sellAll !== 'function') {
  window.sellAll = function () {
    var keys = window.invEntries();
    if (!keys.length) return;
    var totalGot = 0, totalN = 0;
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      var q = state.inventory[key];
      for (var j = 0; j < q; j++) totalGot += window.unitPrice(key);
      delete state.inventory[key];
      totalN += q;
    }
    state.coins += totalGot;
    state.stats.sold += totalN;
    state.stats.earned += totalGot;
    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
    if (typeof renderStorage === 'function') renderStorage();
  };
}

// ═══ الأقسام ═══
var ST_SECTIONS = [
  { id: 'crews',       label: 'طواقم',  emoji: '👨‍✈️' },
  { id: 'weapons',     label: 'أسلحة',  emoji: '🚀' },
  { id: 'shields',     label: 'دروع',   emoji: '🛡️' },
  { id: 'antis',       label: 'مضادات', emoji: '🧪' },
  { id: 'backgrounds', label: 'خلفيات', emoji: '🎨' }
];

// ═══ جلب عناصر كل قسم ═══
function stGetCrews() {
  var ws = window.ModuleRegistry && window.ModuleRegistry.get('weapons_shop');
  if (!ws || !ws.CREWS) return [];
  var out = [];
  for (var i = 0; i < ws.CREWS.length; i++) {
    var c = ws.CREWS[i];
    var q = (state.crews && state.crews[c.id]) || 0;
    if (q > 0) out.push({ id: c.id, name: c.name, emoji: c.emoji || '⚓', qty: q, desc: c.desc || '' });
  }
  return out;
}

function stGetWeapons() {
  var ws = window.ModuleRegistry && window.ModuleRegistry.get('weapons_shop');
  if (!ws || !ws.WEAPONS) return [];
  var out = [];
  for (var i = 0; i < ws.WEAPONS.length; i++) {
    var w = ws.WEAPONS[i];
    var q = (state.inventory && state.inventory[w.id]) || 0;
    if (q > 0) out.push({ id: w.id, name: w.name, emoji: w.emoji || '🚀', qty: q, desc: w.desc || '' });
  }
  return out;
}

function stGetShields() {
  var sh = window.ModuleRegistry && window.ModuleRegistry.get('shop');
  if (!sh || !sh.PROTECTION) return [];
  var out = [];
  for (var i = 0; i < sh.PROTECTION.length; i++) {
    var p = sh.PROTECTION[i];
    if (p.store !== 'shields') continue;
    var q = (state.shields && state.shields[p.id]) || 0;
    if (q > 0) out.push({ id: p.id, name: p.name, emoji: p.emoji || '🛡️', qty: q, desc: p.desc || '' });
  }
  return out;
}

function stGetAntis() {
  var sh = window.ModuleRegistry && window.ModuleRegistry.get('shop');
  if (!sh || !sh.PROTECTION) return [];
  var out = [];
  for (var i = 0; i < sh.PROTECTION.length; i++) {
    var p = sh.PROTECTION[i];
    if (p.store !== 'antis') continue;
    var q = (state.antis && state.antis[p.id]) || 0;
    if (q > 0) out.push({ id: p.id, name: p.name, emoji: p.emoji || '🧪', qty: q, desc: p.desc || '' });
  }
  return out;
}

function stGetBackgrounds() {
  if (typeof BACKGROUNDS === 'undefined') return [];
  var out = [];
  for (var i = 0; i < BACKGROUNDS.length; i++) {
    var b = BACKGROUNDS[i];
    if (state.owned.indexOf(b.id) < 0) continue;
    out.push({
      id: b.id, name: b.name, emoji: b.icon || '🎨',
      qty: 1, desc: b.rarity || '', img: b.img,
      equipped: state.equipped.backgrounds === b.id
    });
  }
  return out;
}

function stGetItems(sectionId) {
  switch (sectionId) {
    case 'crews':       return stGetCrews();
    case 'weapons':     return stGetWeapons();
    case 'shields':     return stGetShields();
    case 'antis':       return stGetAntis();
    case 'backgrounds': return stGetBackgrounds();
    default:            return [];
  }
}

function stEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
  });
}

// ═══ بناء الشاشة مرة وحدة ═══
function stBuildShell() {
  var sec = document.getElementById('screen-storage');
  if (!sec) {
    sec = document.createElement('section');
    sec.className = 'screen';
    sec.id = 'screen-storage';
    var app = document.getElementById('app');
    if (app) app.appendChild(sec);
  }
  if (document.getElementById('stBody')) return sec;

  var tabsHtml = '';
  for (var i = 0; i < ST_SECTIONS.length; i++) {
    var s = ST_SECTIONS[i];
    tabsHtml += '<button class="tab' + (i === 0 ? ' active' : '') + '" data-st-tab="' + s.id + '">' +
                s.emoji + ' ' + s.label + '</button>';
  }

  sec.innerHTML =
    '<div class="sh"><span class="st">🎒 المخزن</span>' +
    '<button class="close-btn" data-st-close>✕</button></div>' +
    '<div class="tabs" id="stTabs">' + tabsHtml + '</div>' +
    '<div class="sb" id="stBody"></div>';

  sec.addEventListener('click', function (e) {
    var closeBtn = e.target.closest ? e.target.closest('[data-st-close]') : null;
    if (closeBtn) {
      e.preventDefault();
      e.stopPropagation();
      closePersonalStorage();
      return;
    }
    var tabBtn = e.target.closest ? e.target.closest('[data-st-tab]') : null;
    if (tabBtn) {
      _storageTab = tabBtn.getAttribute('data-st-tab');
      renderStorage();
    }
  });

  return sec;
}

// ═══ الرسم ═══
function renderStorage() {
  var sec = stBuildShell();
  if (!sec) return;

  var tabs = sec.querySelectorAll('#stTabs .tab');
  for (var j = 0; j < tabs.length; j++) {
    tabs[j].classList.toggle('active', tabs[j].getAttribute('data-st-tab') === _storageTab);
  }

  var body = document.getElementById('stBody');
  if (!body) return;
  renderStorageItems(body, stGetItems(_storageTab), _storageTab);
}

function renderStorageItems(body, items, sectionId) {
  var secName = '';
  for (var i = 0; i < ST_SECTIONS.length; i++) {
    if (ST_SECTIONS[i].id === sectionId) { secName = ST_SECTIONS[i].label; break; }
  }

  var totalCount = 0;
  for (var k = 0; k < items.length; k++) totalCount += items[k].qty || 1;

  var h = '<div class="hero" style="text-align:center">' +
          '<div class="muted">' + secName + '</div>' +
          '<div class="big">' + totalCount + ' <span style="font-size:14px;opacity:.7">قطعة</span></div>' +
          '<div class="muted" style="margin-top:4px">' + items.length + ' نوع</div>' +
          '</div>';

  if (!items.length) {
    h += '<div class="card"><div class="info muted" style="text-align:center;padding:24px">' +
         '📦 لا يوجد شيء هنا — اشترِ من المتجر</div></div>';
    body.innerHTML = h;
    return;
  }

  for (var i2 = 0; i2 < items.length; i2++) {
    var it = items[i2];
    var icon = it.img
      ? '<img src="' + stEsc(it.img) + '" alt="" style="max-width:100%;max-height:100%;object-fit:contain" ' +
        'onerror="this.style.display=\'none\';var s=document.createElement(\'span\');s.style.fontSize=\'28px\';s.textContent=this.dataset.fb;this.parentNode.appendChild(s);" ' +
        'data-fb="' + stEsc(it.emoji || '📦') + '">'
      : '<span style="font-size:28px">' + stEsc(it.emoji || '📦') + '</span>';

    h += '<div style="display:flex;gap:12px;padding:12px;margin-bottom:8px;border-radius:14px;' +
         'background:linear-gradient(180deg,rgba(20,35,60,.85),rgba(12,22,42,.9));' +
         'border:1.5px solid rgba(252,191,73,.2);align-items:center">' +
         '<div style="width:56px;height:56px;flex-shrink:0;border-radius:12px;' +
         'background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.08);' +
         'display:flex;align-items:center;justify-content:center;overflow:hidden">' + icon + '</div>' +
         '<div style="flex:1;min-width:0">' +
         '<div style="font-weight:900;font-size:14px;color:#fff">' + stEsc(it.name) + '</div>' +
         (it.desc ? '<div style="font-size:11px;color:#94a3b8;margin-top:2px;line-height:1.4">' + stEsc(it.desc) + '</div>' : '') +
         (it.equipped ? '<div style="font-size:10px;color:#86efac;font-weight:800;margin-top:4px">✓ مُركّب حالياً</div>' : '') +
         '</div>' +
         '<div style="font-size:16px;font-weight:900;color:#fbbf24;padding:6px 10px;' +
         'background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.35);border-radius:10px">' +
         '×' + (it.qty || 1) + '</div>' +
         '</div>';
  }

  body.innerHTML = h;
}

// ═══ الفتح والإغلاق ═══
function openPersonalStorage() {
  var sec = stBuildShell();
  if (!sec) return;
  if (typeof openScreen === 'function') {
    openScreen('storage');
  } else {
    document.querySelectorAll('.screen.open').forEach(function (s) {
      if (s !== sec) s.classList.remove('open');
    });
    sec.classList.add('open');
  }
  renderStorage();
}

function closePersonalStorage() {
  if (typeof closeScreen === 'function') {
    closeScreen();
  } else {
    var sec = document.getElementById('screen-storage');
    if (sec) sec.classList.remove('open');
  }
}

// ═══ ربط زر "مخزن" ═══
(function () {
  var lastOpen = 0;
  function handle(e) {
    var btn = e.target && e.target.closest ? e.target.closest('.nav-btn[data-screen="storage"]') : null;
    if (!btn) return;
    var now = Date.now();
    if (now - lastOpen < 300) return;
    lastOpen = now;
    e.preventDefault();
    e.stopPropagation();
    openPersonalStorage();
  }
  document.addEventListener('pointerdown', handle, true);
  document.addEventListener('click', handle, true);
})();
