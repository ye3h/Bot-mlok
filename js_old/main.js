/* ═══════════════════════════════════════════════════════════════
   main.js — نقطة البداية (v2.1)
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.onerror = function(msg, url, line) {
  var t = document.getElementById('toast');
  if (t) {
    t.textContent = '❌ ' + msg + ' @ ' + line;
    t.style.background = '#a0281c';
    t.style.color = '#fff';
    t.style.opacity = '1';
    t.style.display = 'block';
    t.style.pointerEvents = 'auto';
  }
  console.error('[FATAL]', msg, url, line);
};


window.UI = {
  toast: function(msg, ms) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(function() { t.classList.remove('show'); }, ms || 2200);
  },
  showModal: function(opts) {
    var title = opts.title || '';
    var sub = opts.sub || '';
    var extraHTML = opts.extraHTML || '';
    var buttons = opts.buttons || [{ label: 'موافق', primary: true }];
    var liveUpdate = opts.liveUpdate;
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalSub').textContent = sub;
    document.getElementById('modalExtra').innerHTML = extraHTML;
    document.getElementById('modalBtns').innerHTML = buttons.map(function(b, i) {
      return '<button class="' + (b.primary ? 'gold-btn' : 'ghost-btn') + '" data-i="' + i + '">' + b.label + '</button>';
    }).join('');
    document.querySelectorAll('#modalBtns button').forEach(function(el, i) {
      el.onclick = function() {
        var r = buttons[i].action ? buttons[i].action() : undefined;
        if (r !== false) UI.hideModal();
      };
    });
    document.getElementById('overlay').classList.add('show');
    clearInterval(window._liveT);
    if (liveUpdate) {
      window._liveT = setInterval(function() {
        if (!document.getElementById('overlay').classList.contains('show')) { clearInterval(window._liveT); return; }
        liveUpdate();
      }, 800);
    }
  },
  hideModal: function() {
    document.getElementById('overlay').classList.remove('show');
    clearInterval(window._liveT);
  },
  confirm: function(title, sub, fn) {
    UI.showModal({
      title: title, sub: sub,
      buttons: [
        { label: 'نعم', primary: true, action: fn },
        { label: 'إلغاء' }
      ]
    });
  }
};

window.updateHud = function() {
  var cc = document.getElementById('coinCounter'); if (cc) cc.textContent = STATE.coins.toLocaleString('en-US');
  var bc = document.getElementById('balanceCounter'); if (bc) bc.textContent = STATE.balance.toLocaleString('en-US');
  var lc = document.getElementById('levelCounter'); if (lc) lc.textContent = STATE.level;
  var totalFish = 0;
  Object.keys(STATE.inventory.fish).forEach(function(k) { totalFish += STATE.inventory.fish[k] || 0; });
  var fc = document.getElementById('fishCounter'); if (fc) fc.textContent = totalFish.toLocaleString('en-US');
  var hp = document.getElementById('hudProfile');
  if (hp) hp.textContent = STATE.username ? STATE.username.charAt(0) : '🏴‍☠️';
  var slots = document.getElementById('hudSlots');
  if (slots) {
    slots.innerHTML = STATE.boats.slice(0, 4).map(function(b) {
      var def = SHIP_DEFS[b.type];
      var inner = (window.ASSET_LOADER && ASSET_LOADER.exists('ships', b.type))
        ? '<img src="' + ASSET_LOADER.src('ships', b.type) + '">'
        : '<span style="font-size:20px">' + def.icon + '</span>';
      return '<div class="hud-slot">' + inner + (b.fishing ? '<span class="dot"></span>' : '') + '</div>';
    }).join('');
  }
};

var _screenStack = [];
window.openScreen = function(id) {
  var cur = document.querySelector('.screen.visible');
  if (cur && cur.id !== id) _screenStack.push(cur.id);
  window.show(id);
};
window.goBack = function() { window.show(_screenStack.pop() || 'ocean'); };
window.show = function(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.toggle('visible', s.id === id); });
  if (id === 'ocean') Ocean.start(); else Ocean.stop();
  if (id === 'inventoryScreen' && typeof renderInventory === 'function') renderInventory();
  if (id === 'warehouseScreen' && typeof renderWarehouse === 'function') renderWarehouse();
  if (id === 'fleetScreen' && typeof renderFleet === 'function') renderFleet();
  if (id === 'marketScreen' && typeof renderMarket === 'function') renderMarket();
  if (id === 'rivalsScreen' && typeof renderRivalsScreen === 'function') renderRivalsScreen();
  if (id === 'monsterScreen' && typeof renderMonster === 'function') renderMonster();
  if (id === 'tribeScreen' && typeof renderTribe === 'function') renderTribe();
  if (id === 'rankingScreen' && typeof renderRanking === 'function') renderRanking();
  if (id === 'dailyScreen' && typeof renderDaily === 'function') renderDaily();
  if (id === 'settingsScreen' && typeof renderSettings === 'function') renderSettings();
};

window.showBoatMenu = function(i) {
  var b = STATE.boats[i];
  if (!b) return;
  var def = SHIP_DEFS[b.type];
  var cap = Fleet.getCapacity(b);
  if (b.fishing) {
    UI.showModal({
      title: def.name,
      sub: '🎣 يصطاد الآن\n' + Fleet.progress(b) + ' / ' + cap,
      buttons: [
        { label: 'إيقاف وتفريغ', primary: true, action: function() { Fleet.dock(b); return false; } },
        { label: 'إغلاق' }
      ],
      liveUpdate: function() {
        var sub = document.getElementById('modalSub');
        if (sub) {
          var pct = Math.floor(Fleet.progress(b) / cap * 100);
          sub.textContent = '🎣 يصطاد الآن (' + pct + '%)\n' + Fleet.progress(b) + ' / ' + cap;
        }
      }
    });
  } else {
    UI.showModal({
      title: def.name,
      sub: '⏸️ في الرصيف\nالسعة: ' + cap + ' · المستوى ' + b.upgradeLevel,
      buttons: [
        { label: 'اذهب للصيد', primary: true, action: function() { Fleet.start(b); return false; } },
        { label: 'ترقية', action: function() { showUpgradeMenu(i); return false; } },
        { label: 'إغلاق' }
      ]
    });
  }
};

window.showUpgradeMenu = function(i) {
  var b = STATE.boats[i];
  var lvl = b.upgradeLevel;
  var maxLvl = SHIP_DEFS[b.type].maxUpgradeLevel || 3;
  if (lvl >= maxLvl) { UI.toast('وصلت لأقصى مستوى'); return; }
  var cost = 8000 * lvl;
  UI.showModal({
    title: 'ترقية السفينة',
    sub: 'المستوى ' + lvl + ' ← ' + (lvl + 1) + '\nالسعة: ' + Fleet.getCapacity(b, lvl) + ' ← ' + Fleet.getCapacity(b, lvl + 1),
    buttons: [
      { label: 'ترقية (' + cost.toLocaleString() + ' 💰)', primary: true, action: function() {
        if (STATE.coins < cost) { UI.toast('رصيد غير كافٍ'); return false; }
        STATE.coins -= cost; b.upgradeLevel = lvl + 1;
        UI.toast('تمت الترقية ✅'); updateHud(); Store.save();
      }},
      { label: 'إلغاء' }
    ]
  });
};

window.renderInventory = function() {
  var grid = document.getElementById('invGrid');
  if (!grid) return;
  var tabs = document.querySelectorAll('#inventoryScreen .chip');
  var currentTab = 'crew';
  tabs.forEach(function(t) { if (t.classList.contains('active')) currentTab = t.dataset.tab; });
  var defs = { crew: CREW_DEFS, weapons: WEAPON_DEFS, shields: SHIELD_DEFS };
  var def = defs[currentTab] || CREW_DEFS;
  var inv = STATE.inventory[currentTab] || {};
  var html = '';
  Object.keys(def).forEach(function(k) {
    var q = inv[k] || 0;
    if (q <= 0) return;
    var d = def[k];
    html += '<div class="grid-item" onclick="showItemInfo(\'' + currentTab + '\',\'' + k + '\')">' +
      '<span class="emoji">' + d.icon + '</span>' +
      '<div class="grid-item-qty">' + q + '</div>' +
      '<div class="grid-item-name">' + d.name + '</div></div>';
  });
  grid.innerHTML = html || '<div class="empty">لا يوجد شيء هنا بعد</div>';
};

window.setInvTab = function(t) {
  document.querySelectorAll('#inventoryScreen .chip').forEach(function(el) {
    el.classList.toggle('active', el.dataset.tab === t);
  });
  renderInventory();
};

window.showItemInfo = function(cat, key) {
  var defs = { crew: CREW_DEFS, weapons: WEAPON_DEFS, shields: SHIELD_DEFS };
  var d = defs[cat][key];
  if (!d) return;
  UI.showModal({ title: d.name, sub: (d.desc || '') + '\nالكمية: ' + (STATE.inventory[cat][key] || 0) });
};

window.addEventListener('load', function() {
  console.log('[Main] بدء اللعبة v2.1');
  var loaded = Store.load();
  Ocean.init();
  setTimeout(function() {
    var s = document.getElementById('splash');
    if (s) { s.classList.add('hide'); setTimeout(function() { s.remove(); }, 600); }
    Ocean.start();
    if (loaded) {
      if (!STATE.boats.length) STATE.boats = [Fleet.newBoat('basic')];
      Fleet.resumeAll();
      updateHud();
      UI.toast('أهلاً بعودتك ' + STATE.username + ' 🏴‍☠️', 2500);
    } else {
      document.getElementById('tutorial').classList.add('show');
    }
  }, 500);
  setInterval(Store.save, 10000);
  window.addEventListener('pagehide', Store.save);
  document.addEventListener('visibilitychange', function() { if (document.hidden) Store.save(); });
});

window.startGame = function() {
  var name = (document.getElementById('tutName').value || '').trim();
  if (!name) { UI.toast('اكتب اسمك أولاً'); return; }
  STATE.username = name;
  STATE.boats = [Fleet.newBoat('basic')];
  document.getElementById('tutorial').classList.remove('show');
  updateHud(); Store.save();
  UI.toast('أهلاً ' + name + ' 🏴‍☠️');
};

history.pushState({ k: 1 }, '');
window.addEventListener('popstate', function() {
  if (document.getElementById('overlay').classList.contains('show')) UI.hideModal();
  else { var cur = document.querySelector('.screen.visible'); if (cur && cur.id !== 'ocean') goBack(); }
  history.pushState({ k: 1 }, '');
});
