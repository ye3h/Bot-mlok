/* js/ship-fleet.js — سفينتي: الأسطول البحري والمخزن (v3.0)
   كل السفن (بما فيها الأساسية) في نظام واحد.
   البحر: حتى 3 سفن نشطة. المخزن: 3 خانات. الحد الكلي للسفن = 3.
   يُستخدم عبر window.fleet، ويعتمد عليه modules/fleet_bridge.js
*/
var ShipFleet = (function () {
  var KEY = 'fishing_fleet_v1';
  var FLEET_SLOTS = 3;             // سفن نشطة في البحر
  var STORAGE_STEPS = [3, 6, 9];
  var SELL_RATIO = 0.5;            // البيع بنصف السعر

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function emptyState() {
    return { ships: [], storageCap: STORAGE_STEPS[0] };
  }

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && Array.isArray(s.ships)) {
        if (typeof s.storageCap !== 'number') s.storageCap = STORAGE_STEPS[0];
        return s;
      }
    } catch (e) {}
    return emptyState();
  }

  function save(st) {
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
  }

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function findDef(id) {
    for (var i = 0; i < SHIPS.length; i++) {
      if (SHIPS[i].id === id) return SHIPS[i];
    }
    return null;
  }

  function init(options) {
    options = options || {};
    var fs = load();
    var say = options.onMessage || function () {};
    var screenEl = document.getElementById(options.screenId || 'fleet-screen');

    // السفينة الأساسية أصبحت جزءاً من الأسطول، فنخفي السفينة القديمة في الخريطة
    var oldBoat = document.getElementById('boat');
    if (oldBoat) oldBoat.style.display = 'none';

    function capacityOf(type) {
      return type === 'fleet' ? FLEET_SLOTS : fs.storageCap;
    }

    function slotTaken(type, slot) {
      for (var i = 0; i < fs.ships.length; i++) {
        var s = fs.ships[i];
        if (s.location.type === type && s.location.slot === slot) return s;
      }
      return null;
    }

    function freeSlot(type) {
      var cap = capacityOf(type);
      for (var k = 0; k < cap; k++) {
        if (!slotTaken(type, k)) return k;
      }
      return -1;
    }

    function findIndex(id) {
      for (var i = 0; i < fs.ships.length; i++) {
        if (fs.ships[i].id === id) return i;
      }
      return -1;
    }

    function countIn(type) {
      var n = 0;
      for (var i = 0; i < fs.ships.length; i++) {
        if (fs.ships[i].location.type === type) n++;
      }
      return n;
    }

    function commit(next) {
      fs = next;
      save(fs);
      draw();
      return true;
    }

    function hasShip(id) { return findIndex(id) >= 0; }
    function hasStorageRoom() { return freeSlot('storage') >= 0; }

    // record: { id, name, image, upgrades, sellable, rented }
    function addShip(record, location) {
      if (!record || !record.id) return false;
      if (hasShip(record.id)) { say('السفينة موجودة بالفعل'); return false; }

      var type = location && location.type === 'fleet' ? 'fleet' : 'storage';
      var slot = freeSlot(type);
      if (slot < 0) {
        say(type === 'fleet' ? 'الأسطول البحري ممتلئ' : 'المخزن ممتلئ');
        return false;
      }

      var next = clone(fs);
      next.ships.push({
        id: record.id,
        name: record.name,
        image: record.image,
        type: 'ship',
        upgrades: record.upgrades || {},
        sellable: record.sellable !== false,
        rented: !!record.rented,
        location: { type: type, slot: slot }
      });
      return commit(next);
    }

    // نقل سفينة بين البحر والمخزن
    function moveShip(id, toType) {
      var i = findIndex(id);
      if (i < 0) return false;
      if (fs.ships[i].location.type === toType) return false;

      var slot = freeSlot(toType);
      if (slot < 0) {
        say(toType === 'fleet' ? 'الأسطول البحري ممتلئ' : 'المخزن ممتلئ');
        return false;
      }

      var next = clone(fs);
      next.ships[i].location = { type: toType, slot: slot };
      return commit(next);
    }

    // تبديل: سفينة من المخزن مع أول سفينة نشطة في البحر
    function swapShips(storageId) {
      var b = findIndex(storageId), a = -1, i;
      if (b < 0 || fs.ships[b].location.type !== 'storage') return false;
      for (i = 0; i < fs.ships.length; i++) {
        if (fs.ships[i].location.type === 'fleet') { a = i; break; }
      }
      if (a < 0) { say('لا توجد سفينة نشطة لتبديلها'); return false; }

      var next = clone(fs);
      var la = next.ships[a].location, lb = next.ships[b].location;
      next.ships[a].location = lb;
      next.ships[b].location = la;
      return commit(next);
    }

    // بيع أي سفينة (نشطة أو في المخزن) بنصف سعرها، ويُضاف المبلغ إلى ذهب اللاعب
    function sellShip(id) {
      var i = findIndex(id), s, def, price, next;
      if (i < 0) return false;
      s = fs.ships[i];
      def = findDef(s.id);
      price = def ? Math.round(def.price_coins * SELL_RATIO) : 0;

      next = clone(fs);
      next.ships.splice(i, 1);
      if (typeof state !== 'undefined' && state) {
        state.coins += price;
        if (typeof saveState === 'function') saveState();
      }
      say('💰 بعت ' + s.name + ' بـ ' + price.toLocaleString());
      return commit(next);
    }

    function removeShip(id) {
      var i = findIndex(id);
      if (i < 0) return false;
      var next = clone(fs);
      next.ships.splice(i, 1);
      return commit(next);
    }

    function upgradeStorage() {
      var idx = STORAGE_STEPS.indexOf(fs.storageCap);
      if (idx < 0 || idx >= STORAGE_STEPS.length - 1) return false;
      var next = clone(fs);
      next.storageCap = STORAGE_STEPS[idx + 1];
      return commit(next);
    }

    // الحالة للقراءة: يحتوي storageCapacity لأن fleet_bridge.js يتوقعه
    function data() {
      var copy = clone(fs);
      copy.storageCapacity = copy.storageCap;
      return copy;
    }

    function getState() { return data(); }
    function ready() { return true; }

    /* ─── الواجهة ─── */
    var BTN = 'border:1px solid #FFD76A;background:#222;color:#fff;border-radius:8px;padding:6px 10px;font-size:12px;font-family:inherit';
    var BTN_DIS = 'border:1px solid #555;background:#1a1a1a;color:#777;border-radius:8px;padding:6px 10px;font-size:12px;font-family:inherit';
    var CARD = 'display:flex;gap:10px;align-items:center;background:rgba(255,255,255,.06);border:1px solid #333;border-radius:14px;padding:10px';

    function btn(act, id, label, disabled, extra) {
      return '<button data-act="' + act + '" data-id="' + esc(id) + '"' + (disabled ? ' disabled' : '') +
             ' style="' + (disabled ? BTN_DIS : BTN) + '"' + (extra || '') + '>' + label + '</button>';
    }

    function imgTag(src) {
      return '<img src="' + esc(src) + '" alt="" style="width:64px;height:52px;object-fit:contain" ' +
             'onerror="this.replaceWith(\'⛵\')">';
    }

    function priceOf(s) {
      var def = findDef(s.id);
      return def ? Math.round(def.price_coins * SELL_RATIO) : 0;
    }

    function fleetCard(s) {
      var full = freeSlot('storage') < 0;
      return '<div style="' + CARD + '">' + imgTag(s.image) +
        '<div style="flex:1"><div style="font-size:14px;font-weight:800">' + esc(s.name) + '</div>' +
        '<div style="font-size:11px;color:#aaa">بيع: 💰 ' + priceOf(s).toLocaleString() + '</div>' +
        (s.rented ? '<div style="font-size:11px;color:#FFD76A">🕒 مؤجرة</div>' : '') + '</div>' +
        '<div style="display:grid;gap:6px">' +
        btn('move', s.id, '📦 للمخزن', full, ' data-to="storage"') +
        btn('sell', s.id, '💰 بيع', false) +
        '</div></div>';
    }

    function storageCard(s) {
      var fleetFull = freeSlot('fleet') < 0;
      var hasActive = countIn('fleet') > 0;
      return '<div style="' + CARD + '">' + imgTag(s.image) +
        '<div style="flex:1"><div style="font-size:14px;font-weight:800">' + esc(s.name) + '</div>' +
        '<div style="font-size:11px;color:#aaa">بيع: 💰 ' + priceOf(s).toLocaleString() + '</div></div>' +
        '<div style="display:grid;gap:6px">' +
        btn('move', s.id, '⚓ للأسطول', fleetFull, ' data-to="fleet"') +
        btn('swap', s.id, '🔁 تبديل', !hasActive) +
        btn('sell', s.id, '💰 بيع', false) +
        '</div></div>';
    }

    function sectionTitle(t) {
      return '<div style="font-size:13px;color:#FFD76A;margin:4px 0 8px;font-weight:800">' + t + '</div>';
    }

    function draw() {
      if (!screenEl) return;
      var h = '', i, anyActive = false, anyStored = false;
      var total = fs.ships.length, active = countIn('fleet'), stored = countIn('storage');

      h += '<div style="padding:14px;color:#fff;font-family:inherit;direction:rtl">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
           '<b style="font-size:18px">⚓ سفينتي</b>' +
           '<button data-act="close" style="border:none;background:none;color:#fff;font-size:22px">✕</button></div>';
      h += '<div style="font-size:12px;color:#aaa;margin-bottom:14px">المملوك: ' + total + '/3 · النشط: ' +
           active + '/' + FLEET_SLOTS + ' · المخزن: ' + stored + '/' + fs.storageCap + '</div>';

      h += sectionTitle('الأسطول النشط');
      h += '<div style="display:grid;gap:10px;margin-bottom:18px">';
      for (i = 0; i < fs.ships.length; i++) {
        if (fs.ships[i].location.type === 'fleet') { h += fleetCard(fs.ships[i]); anyActive = true; }
      }
      if (!anyActive) h += '<div style="text-align:center;color:#aaa;font-size:12px;padding:12px">لا توجد سفن نشطة</div>';
      h += '</div>';

      h += sectionTitle('المخزن (' + stored + '/' + fs.storageCap + ')');
      h += '<div style="display:grid;gap:10px">';
      for (i = 0; i < fs.ships.length; i++) {
        if (fs.ships[i].location.type === 'storage') { h += storageCard(fs.ships[i]); anyStored = true; }
      }
      if (!anyStored) h += '<div style="text-align:center;color:#aaa;font-size:12px;padding:12px">المخزن فارغ</div>';
      h += '</div>';

      h += '</div>';
      screenEl.innerHTML = h;
    }

    function open() {
      if (!screenEl) return;
      screenEl.style.cssText = 'display:block;position:fixed;inset:0;z-index:30;background:#0b1626;overflow:auto';
      draw();
    }

    function close() {
      if (screenEl) screenEl.style.display = 'none';
    }

    if (screenEl) {
      screenEl.addEventListener('click', function (e) {
        var el = e.target.closest ? e.target.closest('[data-act]') : null;
        if (!el || el.disabled) return;
        var act = el.getAttribute('data-act');
        var id = el.getAttribute('data-id');
        if (act === 'close') close();
        else if (act === 'move') moveShip(id, el.getAttribute('data-to'));
        else if (act === 'swap') swapShips(id);
        else if (act === 'sell') sellShip(id);
      });
    }

    return {
      hasShip: hasShip,
      hasStorageRoom: hasStorageRoom,
      addShip: addShip,
      moveShip: moveShip,
      removeShip: removeShip,
      swapShips: swapShips,
      sellShip: sellShip,
      upgradeStorage: upgradeStorage,
      data: data,
      getState: getState,
      ready: ready,
      open: open,
      close: close,
      render: draw
    };
  }

  return { init: init };
})();
