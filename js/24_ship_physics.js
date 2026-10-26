/* js/24_ship_physics.js — فيزياء السفن (v3.1.0) */
(function () {
  'use strict';
  var tries = 0;

  function shipSize(def) {
    var s = def.storage || 80;
    if (s < 200)     return 46;
    if (s < 1000)    return 54;
    if (s < 5000)    return 62;
    if (s < 30000)   return 72;
    if (s < 100000)  return 84;
    if (s < 300000)  return 96;
    return 110;
  }

  function offsetFor(idx) { return [0, -0.035, 0.035][idx] || 0; }

  function injectCSS() {
    if (document.getElementById('_fleet_phys_css')) return;
    var s = document.createElement('style');
    s.id = '_fleet_phys_css';
    s.textContent =
      '.fl-ship{position:absolute;transform:translate(-50%,-50%);cursor:pointer;z-index:5;display:flex;flex-direction:column;align-items:center;gap:3px;transition:left .14s linear,top .14s linear;will-change:left,top}' +
      '.fl-ship img{object-fit:contain;filter:drop-shadow(0 6px 10px rgba(0,0,0,.65));transition:transform .25s ease-out;pointer-events:none}' +
      '.fl-ship .fl-lbl{font-size:9px;font-weight:800;color:#FFD76A;background:rgba(0,0,0,.75);padding:2px 6px;border-radius:6px;white-space:nowrap;border:1px solid rgba(255,215,106,.35);font-family:inherit}' +
      '.fl-ship .fl-bar{width:46px;height:4px;background:rgba(0,0,0,.6);border-radius:2px;overflow:hidden;border:1px solid rgba(255,215,106,.25)}' +
      '.fl-ship .fl-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#4ade80,#22c55e);transition:width .2s}' +

      '@keyframes fl-bob{0%,100%{transform:translate(-50%,-50%) rotate(-2deg) translateY(0)}50%{transform:translate(-50%,-50%) rotate(2deg) translateY(-3px)}}' +
      '.fl-ship.docked img{animation:fl-bob 3s ease-in-out infinite}' +
      '@keyframes fl-sail{0%,100%{transform:rotate(6deg)}50%{transform:rotate(12deg)}}' +
      '.fl-ship.sailing img{animation:fl-sail .9s ease-in-out infinite;filter:drop-shadow(0 6px 10px rgba(0,0,0,.65)) drop-shadow(0 0 10px rgba(56,189,248,.5))}' +
      '@keyframes fl-return{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(-12deg)}}' +
      '.fl-ship.returning img{animation:fl-return .9s ease-in-out infinite;filter:drop-shadow(0 6px 10px rgba(0,0,0,.65)) drop-shadow(0 0 10px rgba(252,191,73,.5))}' +
      '@keyframes fl-pulse{0%,100%{transform:rotate(-1deg) scale(1)}50%{transform:rotate(1deg) scale(1.03)}}' +
      '.fl-ship.fishing img{animation:fl-pulse 1.6s ease-in-out infinite;filter:drop-shadow(0 6px 10px rgba(0,0,0,.65)) drop-shadow(0 0 12px rgba(34,197,94,.6))}' +

      '@keyframes fl-wake{0%{opacity:.9;transform:translate(-50%,-50%) scale(.4)}100%{opacity:0;transform:translate(-50%,-50%) scale(2.2)}}' +
      '.fl-wake{position:absolute;width:32px;height:32px;border-radius:50%;background:radial-gradient(circle,rgba(186,230,253,.55) 0%,rgba(56,189,248,.15) 60%,transparent 70%);pointer-events:none;z-index:3;animation:fl-wake 1.4s ease-out forwards}' +

      '@keyframes fl-zone-pulse{0%,100%{opacity:.35;transform:translate(-50%,-50%) scale(1)}50%{opacity:.55;transform:translate(-50%,-50%) scale(1.05)}}' +
      '.fl-zone{position:absolute;border:2px dashed rgba(56,189,248,.5);border-radius:50%;pointer-events:none;z-index:2;animation:fl-zone-pulse 2s ease-in-out infinite;background:radial-gradient(circle,rgba(56,189,248,.08),transparent 70%)}';
    document.head.appendChild(s);
  }

  function patch() {
    if (!window.ModuleRegistry) return false;
    injectCSS();

    var f = window.ModuleRegistry.get('fleet');
    if (!f) return false;
    if (f.__phys31) return true;
    f.__phys31 = true;

    try { delete f.HARBOR; } catch(e){}
    Object.defineProperty(f, 'HARBOR', {
      configurable: true,
      get: function () {
        var h = (typeof layout !== 'undefined' && layout && layout.harbor) ? layout.harbor : { x: 0.16, y: 0.55 };
        return { x: h.x, y: h.y };
      }
    });

    try { delete f.SEA_SPOTS; } catch(e){}
    Object.defineProperty(f, 'SEA_SPOTS', {
      configurable: true,
      get: function () {
        var s = (typeof layout !== 'undefined' && layout && layout.sea) ? layout.sea : { x: 0.6, y: 0.5 };
        return [
          { x: s.x,        y: s.y - 0.04 },
          { x: s.x - 0.05, y: s.y + 0.02 },
          { x: s.x + 0.05, y: s.y + 0.02 }
        ];
      }
    });

    if (f.ships && f.ships.length) {
      var H = f.HARBOR;
      for (var i = 0; i < f.ships.length; i++) {
        var sh = f.ships[i];
        if (sh.st === 'docked') {
          sh.x = H.x;
          sh.y = H.y + offsetFor(sh.idx);
          sh.tx = sh.x;
          sh.ty = sh.y;
        }
      }
    }

    var lastWake = {};
    f.updateVisual = function (s) {
      if (!s.el) return;

      s.el.style.left = (s.x * 100) + '%';
      s.el.style.top = (s.y * 100) + '%';

      // حجم السفينة (مرة وحدة)
      var img = s.el.querySelector('img');
      if (img && !img.dataset.sized) {
        var sz = shipSize(s.def);
        img.style.width = sz + 'px';
        img.style.height = sz + 'px';
        img.dataset.sized = '1';
      }

      // الحالة
      var cls = 'fl-ship';
      if (s.st === 'docked') cls += ' docked';
      else if (s.st === 'sailing') cls += ' sailing';
      else if (s.st === 'fishing') cls += ' fishing';
      else if (s.st === 'returning') cls += ' returning';
      if (s.el.className !== cls) s.el.className = cls;

      // قلب
      if (img) {
        var goingLeft = s.tx < s.x - 0.002;
        var flip = goingLeft ? 'scaleX(-1)' : '';
        if (img.dataset.flip !== flip) {
          img.dataset.flip = flip;
          img.style.transform = flip;
        }
      }

      // wake
      var now = Date.now();
      if (s.st === 'sailing' || s.st === 'returning') {
        if (!lastWake[s.id] || now - lastWake[s.id] > 500) {
          lastWake[s.id] = now;
          spawnWake(s);
        }
      }

      // label جديد: المصطاد/الحمولة
      var label = s.def.name;
      var pct = 0;
      if (s.st === 'sailing') {
        pct = 15;
        label = s.def.name + ' · إبحار';
      } else if (s.st === 'fishing') {
        var filled = (typeof s.catchCount === 'number') ? s.catchCount : (s.catches ? s.catches.length : 0);
        var maxS = s.storageMax || s.def.storage || 50;
        pct = Math.min(100, (filled / maxS) * 100);
        label = s.def.name + ' · ' + filled + '/' + maxS + ' 🐟';
      } else if (s.st === 'returning') {
        pct = 100;
        label = s.def.name + ' · عودة';
      } else {
        label = s.def.name + ' · ⚓';
      }
      if (s.lblEl) s.lblEl.textContent = label;
      if (s.barEl) s.barEl.style.width = pct + '%';
    };

    // ═══ اللوحة تتبع السفينة + تنقلب لو فوق ═══
    var origRefreshPanel = f.refreshPanel;
    f.refreshPanel = function () {
      origRefreshPanel.apply(this, arguments);
      var ship = this.panelOwner;
      if (!ship || !this.panel) return;
      // لو السفينة فوق في الشاشة (< 0.35) → اللوحة تنزل تحتها
      if (ship.y < 0.35) {
        this.panel.style.top = ((ship.y + 0.09) * 100) + '%';
        this.panel.style.transform = 'translate(-50%, 0)';
      } else {
        this.panel.style.top = ((ship.y - 0.08) * 100) + '%';
        this.panel.style.transform = 'translate(-50%, -100%)';
      }
    };

    // تحديث موقع اللوحة مع tick
    var origTick = f.tick;
    f.tick = function () {
      origTick.apply(this, arguments);
      if (this.panelOwner && this.panel && this.panel.style.display !== 'none') {
        var sh = this.panelOwner;
        var topPct, trans;
        if (sh.y < 0.35) {
          topPct = (sh.y + 0.09) * 100;
          trans = 'translate(-50%, 0)';
        } else {
          topPct = (sh.y - 0.08) * 100;
          trans = 'translate(-50%, -100%)';
        }
        this.panel.style.left = (sh.x * 100) + '%';
        this.panel.style.top = topPct + '%';
        this.panel.style.transform = trans;
      }
    };

    function spawnWake(s) {
      var scene = document.getElementById('scene');
      if (!scene) return;
      var w = document.createElement('div');
      w.className = 'fl-wake';
      w.style.left = (s.x * 100) + '%';
      w.style.top = (s.y * 100) + '%';
      scene.appendChild(w);
      setTimeout(function () { if (w.parentNode) w.parentNode.removeChild(w); }, 1400);
    }

    function showZone(spot, def) {
      var scene = document.getElementById('scene');
      if (!scene) return;
      var old = document.getElementById('fl-zone-el');
      if (old) old.remove();
      var el = document.createElement('div');
      el.id = 'fl-zone-el';
      el.className = 'fl-zone';
      var size = 120 + Math.min(200, Math.log10((def.storage || 80) + 1) * 40);
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.left = (spot.x * 100) + '%';
      el.style.top = (spot.y * 100) + '%';
      scene.appendChild(el);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 4000);
    }

    f.toggleTrip = function (ship) {
      if (ship.st === 'docked') {
        var spot = this.SEA_SPOTS[ship.idx] || this.SEA_SPOTS[0];
        ship.st = 'sailing';
        ship.tx = spot.x;
        ship.ty = spot.y;
        ship.tripStart = Date.now();
        ship.tripEnd = 0;
        ship.catches = [];
        ship.storageMax = ship.def.storage || 50;
        showZone(spot, ship.def);
      } else if (ship.st === 'fishing' || ship.st === 'sailing') {
        ship.st = 'returning';
        var H = this.HARBOR;
        ship.tx = H.x;
        ship.ty = H.y + offsetFor(ship.idx);
      }
      this.saveShipState(ship);
      this.refreshPanel();
    };

    if (typeof window.applyLayout === 'function') {
      var origApply = window.applyLayout;
      window.applyLayout = function () {
        origApply.apply(this, arguments);
        if (!f.ships) return;
        var H = f.HARBOR;
        for (var i = 0; i < f.ships.length; i++) {
          var sh = f.ships[i];
          if (sh.st === 'docked') {
            sh.x = H.x;
            sh.y = H.y + offsetFor(sh.idx);
            sh.tx = sh.x;
            sh.ty = sh.y;
            f.updateVisual(sh);
          }
        }
      };
    }

    if (typeof f.sync === 'function') {
      try { f.sync(); } catch (e) {}
    }
    return true;
  }

  injectCSS();
  if (patch()) return;
  var iv = setInterval(function () {
    if (patch() || ++tries > 200) clearInterval(iv);
  }, 50);
})();
