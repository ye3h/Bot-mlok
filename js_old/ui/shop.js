/* ═══════════════════════════════════════════════════════════════
   shop.js — السوق + المخزن + الأسطول + الترتيب
   ═══════════════════════════════════════════════════════════════ */
'use strict';

var _marketTab = 'boats';
window.setMarketTab = function(t) {
  _marketTab = t;
  document.querySelectorAll('#marketScreen .chip').forEach(function(el) {
    el.classList.toggle('active', el.dataset.tab === t);
  });
  renderMarket();
};

window.renderMarket = function() {
  var body = document.getElementById('marketBody');
  if (!body) return;
  var html = '';
  if (_marketTab === 'boats') {
    Object.keys(SHIP_DEFS).forEach(function(k) {
      var d = SHIP_DEFS[k];
      if (d.price <= 0) return;
      html += '<div class="list-item" onclick="buyBoat(\'' + k + '\')">' +
        '<div class="emoji">' + d.icon + '</div>' +
        '<div class="list-item-info"><div class="list-item-name">' + d.name + '</div>' +
        '<div class="list-item-desc">السعة: ' + d.capacity.toLocaleString() + ' · المستوى ' + d.level + '</div>' +
        '<div class="list-item-price">' + d.price.toLocaleString() + ' 💰</div></div></div>';
    });
  } else if (_marketTab === 'weapons') {
    Object.keys(WEAPON_DEFS).forEach(function(k) {
      var d = WEAPON_DEFS[k];
      html += '<div class="list-item" onclick="buyItem(\'weapons\',\'' + k + '\')">' +
        '<div class="emoji">' + d.icon + '</div>' +
        '<div class="list-item-info"><div class="list-item-name">' + d.name + '</div>' +
        '<div class="list-item-desc">الضرر: ' + d.damage.toLocaleString() + (d.aoe ? ' (جماعي)' : '') + '</div>' +
        '<div class="list-item-price">' + d.price.toLocaleString() + ' 💰</div></div></div>';
    });
  } else if (_marketTab === 'shields') {
    Object.keys(SHIELD_DEFS).forEach(function(k) {
      var d = SHIELD_DEFS[k];
      html += '<div class="list-item" onclick="buyItem(\'shields\',\'' + k + '\')">' +
        '<div class="emoji">' + d.icon + '</div>' +
        '<div class="list-item-info"><div class="list-item-name">' + d.name + '</div>' +
        '<div class="list-item-desc">الصد: ' + d.block.toLocaleString() + '</div>' +
        '<div class="list-item-price">' + d.price.toLocaleString() + ' 💰</div></div></div>';
    });
  } else if (_marketTab === 'crew') {
    Object.keys(CREW_DEFS).forEach(function(k) {
      var d = CREW_DEFS[k];
      html += '<div class="list-item" onclick="buyItem(\'crew\',\'' + k + '\')">' +
        '<div class="emoji">' + d.icon + '</div>' +
        '<div class="list-item-info"><div class="list-item-name">' + d.name + '</div>' +
        '<div class="list-item-desc">' + d.desc + '</div>' +
        '<div class="list-item-price">' + d.price.toLocaleString() + ' 💰</div></div></div>';
    });
  }
  body.innerHTML = html || '<div class="empty">قريباً</div>';
};

window.buyBoat = function(type) {
  var d = SHIP_DEFS[type];
  if (STATE.boats.length >= CONFIG.MAX_BOATS) { UI.toast('الأسطول ممتلئ'); return; }
  if (STATE.coins < d.price) { UI.toast('رصيد غير كافٍ'); return; }
  UI.confirm('تأكيد الشراء', d.name + ' — ' + d.price.toLocaleString() + ' 💰', function() {
    STATE.coins -= d.price;
    STATE.boats.push(Fleet.newBoat(type));
    UI.toast('تم الشراء ✅');
    updateHud(); renderMarket(); Store.save();
  });
};

window.buyItem = function(cat, key) {
  var defs = { weapons: WEAPON_DEFS, shields: SHIELD_DEFS, crew: CREW_DEFS };
  var d = defs[cat][key];
  if (STATE.coins < d.price) { UI.toast('رصيد غير كافٍ'); return; }
  UI.confirm('تأكيد الشراء', d.name + ' — ' + d.price.toLocaleString() + ' 💰', function() {
    STATE.coins -= d.price;
    STATE.inventory[cat][key] = (STATE.inventory[cat][key] || 0) + 1;
    UI.toast('تم الشراء ✅');
    updateHud(); renderMarket(); Store.save();
  });
};

window.renderWarehouse = function() {
  var body = document.getElementById('warehouseBody');
  if (!body) return;
  var rows = '', total = 0;
  Object.keys(FISH_DEFS).forEach(function(k) {
    var q = STATE.inventory.fish[k] || 0;
    if (q <= 0) return;
    var d = FISH_DEFS[k];
    var value = Math.floor(q * d.price);
    total += value;
    rows += '<div class="list-item" onclick="sellFishMenu(\'' + k + '\')">' +
      '<div class="emoji">' + d.icon + '</div>' +
      '<div class="list-item-info"><div class="list-item-name">' + d.name + '</div>' +
      '<div class="list-item-desc">' + q.toLocaleString() + ' قطعة · ' + d.price + '-color ذهب/قطعة</div>' +
      '<div class="list-item-price">' + value.toLocaleString() + ' 💰</div></div></div>';
  });
  body.innerHTML = rows ? rows +
    '<button class="gold-btn" style="width:100%;margin-top:8px" onclick="Market.sellAll()">بيع الكل (' + total.toLocaleString() + ' 💰)</button>'
    : '<div class="empty">📦 المخزن فارغ<br>اذهب للصيد أولاً 🎣</div>';
};

window.sellFishMenu = function(key) {
  var q = STATE.inventory.fish[key] || 0;
  var d = FISH_DEFS[key];
  UI.showModal({
    title: d.name,
    sub: q.toLocaleString() + ' قطعة × ' + d.price + ' = ' + Math.floor(q * d.price).toLocaleString() + ' 💰',
    buttons: [
      { label: 'بيع', primary: true, action: function() { Market.sell(key); } },
      { label: 'إغلاق' }
    ]
  });
};

window.renderFleet = function() {
  var body = document.getElementById('fleetBody');
  if (!body) return;
  body.innerHTML = STATE.boats.map(function(b, i) {
    var def = SHIP_DEFS[b.type];
    var cap = Fleet.getCapacity(b);
    var status = b.fishing ? '🎣 يصطاد (' + Fleet.progress(b).toLocaleString() + '/' + cap.toLocaleString() + ')' : '⏸️ في الرصيف';
    return '<div class="list-item" onclick="showBoatMenu(' + i + ')">' +
      '<div class="emoji">' + def.icon + '</div>' +
      '<div class="list-item-info"><div class="list-item-name">' + def.name + ' · مستوى ' + b.upgradeLevel + '</div>' +
      '<div class="list-item-desc">' + status + ' · السعة: ' + cap.toLocaleString() + '</div></div></div>';
  }).join('') || '<div class="empty">لا تملك سفن بعد</div>';
};

window.renderRanking = function() {
  var body = document.getElementById('rankingBody');
  if (!body) return;
  body.innerHTML = LeaderboardUI.render();
};
