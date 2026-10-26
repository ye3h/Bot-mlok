// js/26_fishing_physics.js — v5.0.0 (Single Fish Lock + حفظ حالة الصيد)
// الصيد يُحسب من الوقت المنقضي، فالصيد الذي حدث أثناء إغلاق الصفحة يُضاف عند الرجوع.
(function () {
  'use strict';
  var tries = 0;

  function fishImg(id) { return 'assets/fish/' + id + '.webp'; }

  function popFishIcon(scene, ship, fishId, count) {
    var el = document.createElement('div');
    el.style.cssText =
      'position:absolute;pointer-events:none;z-index:10;' +
      'left:' + (ship.x * 100) + '%;top:' + (ship.y * 100) + '%;' +
      'transform:translate(-50%,-120%);' +
      'animation:_fishPop 1.2s ease-out forwards';

    var countLabel = count > 1
      ? '<div style="position:absolute;top:-10px;right:-10px;background:#fbbf24;color:#000;padding:1px 5px;border-radius:6px;font-size:10px;font-weight:900">+' + count + '</div>'
      : '';

    el.innerHTML =
      '<div style="position:relative;width:40px;height:40px">' +
        '<img src="' + fishImg(fishId) + '" ' +
             'style="width:100%;height:100%;object-fit:contain;' +
             'filter:drop-shadow(0 2px 6px rgba(0,0,0,.8))" ' +
             'onerror="this.replaceWith(document.createTextNode(\'🐟\'))">' +
        countLabel +
      '</div>';

    if (!document.getElementById('_fishpop_anim')) {
      var st = document.createElement('style');
      st.id = '_fishpop_anim';
      st.textContent = '@keyframes _fishPop{' +
        '0%{opacity:0;transform:translate(-50%,-100%) scale(.5)}' +
        '20%{opacity:1;transform:translate(-50%,-130%) scale(1.15)}' +
        '80%{opacity:1;transform:translate(-50%,-160%) scale(1)}' +
        '100%{opacity:0;transform:translate(-50%,-200%) scale(.85)}}';
      document.head.appendChild(st);
    }

    scene.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1300);
  }

  function poolOf(def) {
    var p = (def && (def.fish || def.fishPool)) || [];
    return p.length ? p : ['sardine'];
  }

  function patch() {
    if (!window.ModuleRegistry) return false;
    var f = window.ModuleRegistry.get('fleet');
    if (!f) return false;
    if (f.__physMolokSingle) return true;
    f.__physMolokSingle = true;

    var oldBoat = document.getElementById('boat');
    if (oldBoat) oldBoat.style.display = 'none';

    /* ═══ قفل الرحلة: نوع واحد + معدل صيد ثابت من السعة ومدة الرحلة ═══ */
    f.lockTrip = function (s, now) {
      var def = s.def || {};
      var pool = poolOf(def);
      s.tripFishId = pool[Math.floor(Math.random() * pool.length)];
      s.tripStartAt = now;
      s.storageMax = def.storage || def.capacity || 50;
      s.tripDurationSec = def.tripSec || def.fishing_seconds || 60;
      s.catchPerSec = s.storageMax / s.tripDurationSec;
      s.catchCount = 0;
      s.lastIconAt = 0;
      s.iconBuffer = 0;
    };

    /* ═══ حفظ حالة الصيد داخل سجل السفينة (state.ships[].trip) ═══ */
    f.saveShipState = function (s) {
      var all = (this.ctx && this.ctx.state && this.ctx.state.ships) || [];
      var inst = null;
      for (var i = 0; i < all.length; i++) {
        if (all[i].id === s.id) { inst = all[i]; break; }
      }
      if (!inst) return;

      inst.trip = {
        st: s.st,
        x: s.x,
        y: s.y,
        tripStart: s.tripStart || 0,
        tripEnd: s.tripEnd || 0,
        catches: [],
        tripStartAt: s.tripStartAt || 0,
        tripDurationSec: s.tripDurationSec || 0,
        storageMax: s.storageMax || 0,
        catchPerSec: s.catchPerSec || 0,
        catchCount: s.catchCount || 0,
        tripFishId: s.tripFishId || null
      };
      if (typeof saveState === 'function') saveState();
    };

    /* ═══ استعادة الحالة عند إنشاء السفينة (بعد إعادة التحميل) ═══ */
    var origAdd = f.addShip;
    f.addShip = function (inst, idx) {
      origAdd.apply(this, arguments);
      var s = this.ships[this.ships.length - 1];
      if (!s || s.id !== inst.id) return;

      var t = inst.trip || {};
      s.lastIconAt = 0;
      s.iconBuffer = 0;

      if (s.st === 'fishing') {
        if (t.tripStartAt && t.tripFishId) {
          s.tripStartAt = t.tripStartAt;
          s.tripFishId = t.tripFishId;
          s.storageMax = t.storageMax;
          s.tripDurationSec = t.tripDurationSec;
          s.catchPerSec = t.catchPerSec;
          s.catchCount = t.catchCount || 0;
        } else {
          // حفظ قديم بدون بيانات الصيد: نبدأ الرحلة من جديد
          this.lockTrip(s, Date.now());
        }
      } else {
        s.tripFishId = null;
        s.catchCount = 0;
      }
    };

    f.tick = function () {
      var scene = document.getElementById('scene');
      if (!scene) return;
      var W = scene.clientWidth, H = scene.clientHeight;
      if (!W || !H) return;

      var now = Date.now();
      var dt = Math.min(0.1, (now - this.lastTick) / 1000);
      this.lastTick = now;

      for (var i = 0; i < this.ships.length; i++) {
        var s = this.ships[i];

        if (s.st === 'sailing') {
          if (this.moveTo(s, s.tx, s.ty, dt, W, H)) {
            s.st = 'fishing';
            this.lockTrip(s, now);
            this.saveShipState(s);
          }
        }
        else if (s.st === 'fishing') {
          var elapsedSec = (now - (s.tripStartAt || now)) / 1000;
          var tripDur = s.tripDurationSec || 60;
          var maxCatch = s.storageMax || 50;

          // الصيد محسوب من الوقت، فالصيد أثناء الإغلاق لا يضيع
          var expected = Math.min(maxCatch, elapsedSec * (s.catchPerSec || 1));
          var toAdd = expected - (s.catchCount || 0);

          if (toAdd >= 1) {
            var addCount = Math.floor(toAdd);
            s.catchCount += addCount;

            var fishId = s.tripFishId || 'sardine';
            if (window.FishDiscovery) FishDiscovery.register(fishId);

            s.iconBuffer = (s.iconBuffer || 0) + addCount;
            if (now - (s.lastIconAt || 0) > 250) {
              s.lastIconAt = now;
              popFishIcon(scene, s, fishId, s.iconBuffer);
              s.iconBuffer = 0;
            }
          }

          if (s.catchCount >= maxCatch) {
            s.st = 'returning';
            s.tx = this.HARBOR.x;
            s.ty = this.HARBOR.y + ([0, -0.035, 0.035][s.idx] || 0);
            this.saveShipState(s);
            if (typeof showMessage === 'function') showMessage('📦 ' + s.def.name + ' امتلأت — عائدة');
          }
          else if (elapsedSec >= tripDur + 3) {
            s.st = 'returning';
            s.tx = this.HARBOR.x;
            s.ty = this.HARBOR.y + ([0, -0.035, 0.035][s.idx] || 0);
            this.saveShipState(s);
          }
        }
        else if (s.st === 'returning') {
          if (this.moveTo(s, s.tx, s.ty, dt, W, H)) {
            this.finishTrip(s);
            s.st = 'docked';
            s.catchCount = 0;
            s.iconBuffer = 0;
            s.tripFishId = null;
            s.tripStartAt = 0;
            this.saveShipState(s);
          }
        }

        this.updateVisual(s);
      }

      if (this.panelOwner && this.panel && this.panel.style.display !== 'none') {
        this.panel.style.left = (this.panelOwner.x * 100) + '%';
        this.panel.style.top = ((this.panelOwner.y - 0.08) * 100) + '%';
      }
    };

    f.finishTrip = function (ship) {
      var st = this.ctx.state;
      var count = ship.catchCount || 0;
      var fishId = ship.tripFishId || 'sardine';

      if (count > 0) {
        st.inventory[fishId] = (st.inventory[fishId] || 0) + count;
        st.stats.caught += count;
        st.stats.trips++;

        var tr = window.ModuleRegistry && window.ModuleRegistry.get('tribe');
        if (tr && typeof tr.applyGoldBonus === 'function') {
          var bonusCoins = tr.applyGoldBonus(count * 5);
          if (bonusCoins > 0) {
            st.coins = (st.coins || 0) + bonusCoins;
            if (typeof showMessage === 'function') showMessage('🏰 بونص القبيلة +' + bonusCoins.toLocaleString() + ' 💰');
          }
        }

        var before = typeof levelOf === 'function' ? levelOf(st.xp || 0) : 1;
        var xpPer = typeof xpFor === 'function' ? xpFor(fishId) : 1;
        st.xp = (st.xp || 0) + (xpPer * count);
        var after = typeof levelOf === 'function' ? levelOf(st.xp) : 1;

        if (after > before) {
          var bonus = after * 100;
          st.coins = (st.coins || 0) + bonus;
          if (typeof showMessage === 'function') showMessage('🎉 وصلت للمستوى ' + after + '! +' + bonus + ' 💰');
          if (typeof fly === 'function') fly('+' + bonus + ' 💰', typeof $ === 'function' ? $('coins') : null);
        }
      }

      ship.catches = [];
      ship.catchCount = 0;

      if (typeof saveState === 'function') saveState();
      if (typeof render === 'function') render();
      if (typeof showMessage === 'function' && count > 0) {
        var fishName = (typeof FISH !== 'undefined' && FISH[fishId]) ? FISH[fishId].name : 'سمكة';
        showMessage('🎣 ' + ship.def.name + ' رجعت بـ ' + count.toLocaleString() + ' ' + fishName);
      }
    };

    return true;
  }

  if (patch()) return;
  var iv = setInterval(function () {
    if (patch() || ++tries > 200) clearInterval(iv);
  }, 50);
})();
