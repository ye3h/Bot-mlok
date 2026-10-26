// modules/fleet.js — الأسطول الموحد (v10.1.0)
// بدون ترقيات، بدون خلطات. يعتمد على إحداثيات الأيقونات.
ModuleRegistry.register({
  id: 'fleet',
  name: 'الأسطول',
  version: '10.1.0',
  dependencies: [],

  MAX_FLEET: 3,
  TICK_MS: 50,
  SPEED_PX: 130,
  ARRIVE_PX: 5,

  ctx: null,
  ships: [],
  panel: null,
  panelOwner: null,
  lastTick: 0,

  init: function (ctx) {
    var self = this;
    this.ctx = ctx;
    
    var baseBoat = document.getElementById('boat');
    if (baseBoat) baseBoat.style.display = 'none';

    this.injectCSS();
    this.buildPanel();
    this.buildModal();
    this.sync();
    
    this.lastTick = Date.now();
    setInterval(function () { self.tick(); }, this.TICK_MS);
  },

  // ════════════════ قراءة موقع الأيقونة من الـ HTML ════════════════
  getIconPos: function (key, index, total) {
    var scene = document.getElementById('scene');
    var el = document.querySelector('.map-item[data-key="' + key + '"]');
    if (!el || !scene) return { x: 0.5, y: 0.5 };
    
    var r = el.getBoundingClientRect();
    var s = scene.getBoundingClientRect();
    
    var baseX = (r.left - s.left + r.width / 2) / s.width;
    var baseY = (r.top - s.top + r.height / 2) / s.height;

    if (total > 1) {
      var offsetX = (index - (total - 1) / 2) * 0.06;
      var offsetY = (index % 2 === 0 ? 0.02 : -0.02);
      baseX += offsetX;
      baseY += offsetY;
    }

    return { x: baseX, y: baseY };
  },

  // ════════════════ المزامنة مع الـ State ════════════════
  sync: function () {
    if (!this.ctx || !this.ctx.state) return;
    var stateShips = this.ctx.state.ships || [];
    var activeShips = stateShips.filter(function (s) { return !s.inStorage; });
    var toRender = activeShips.slice(0, this.MAX_FLEET);

    var currentIds = toRender.map(function (s) { return s.id; });
    for (var i = this.ships.length - 1; i >= 0; i--) {
      if (currentIds.indexOf(this.ships[i].id) === -1) {
        if (this.ships[i].el && this.ships[i].el.parentNode) {
          this.ships[i].el.parentNode.removeChild(this.ships[i].el);
        }
        this.ships.splice(i, 1);
      }
    }

    for (var j = 0; j < toRender.length; j++) {
      var inst = toRender[j];
      if (!this.findShipObj(inst.id)) {
        this.addShip(inst, j, toRender.length);
      }
    }
  },

  findShipObj: function (id) {
    for (var i = 0; i < this.ships.length; i++) {
      if (this.ships[i].id === id) return this.ships[i];
    }
    return null;
  },

  findInstance: function (id) {
    var all = (this.ctx && this.ctx.state && this.ctx.state.ships) ? this.ctx.state.ships : [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) return all[i];
    }
    return null;
  },

  addShip: function (inst, idx, totalShips) {
    var def = window.SHIP_BY_CODE && window.SHIP_BY_CODE[inst.code];
    if (!def) return;

    var saved = inst.trip || {};
    var harborPos = this.getIconPos('harbor', idx, totalShips);

    var el = document.createElement('div');
    el.className = 'fl-ship';

    var img = document.createElement('img');
    img.src = def.img || '';
    img.alt = def.name;
    img.onerror = function () {
      img.style.display = 'none';
      el.insertAdjacentHTML('afterbegin', '<span style="font-size:48px">' + (def.emoji || '⛵') + '</span>');
    };
    el.appendChild(img);

    var lbl = document.createElement('div');
    lbl.className = 'fl-lbl';
    lbl.textContent = def.name + ' · Lv.' + (def.level || 1);
    el.appendChild(lbl);

    var bar = document.createElement('div');
    bar.className = 'fl-bar';
    bar.innerHTML = '<i></i>';
    el.appendChild(bar);

    document.getElementById('scene').appendChild(el);

    var ship = {
      id: inst.id,
      code: inst.code,
      def: def,
      idx: idx,
      el: el,
      lblEl: lbl,
      barEl: bar.querySelector('i'),
      st: saved.st || 'docked',
      x: saved.x != null ? saved.x : harborPos.x,
      y: saved.y != null ? saved.y : harborPos.y,
      tx: 0, ty: 0,
      tripStart: saved.tripStart || 0,
      tripEnd: saved.tripEnd || 0,
      catches: saved.catches || []
    };

    if (ship.st === 'docked') {
      ship.x = harborPos.x; ship.y = harborPos.y;
      ship.tx = ship.x; ship.ty = ship.y;
    } else if (ship.st === 'sailing' || ship.st === 'fishing') {
      var seaPos = this.getIconPos('sea', idx, totalShips);
      ship.tx = seaPos.x; ship.ty = seaPos.y;
    } else if (ship.st === 'returning') {
      ship.tx = harborPos.x; ship.ty = harborPos.y;
    }

    var self = this;
    el.addEventListener('click', function (e) {
      e.stopPropagation();
      self.openPanel(ship);
    });

    this.ships.push(ship);
    this.updateVisual(ship);
  },

  // ════════════════ اللوحة (Panel) ════════════════
  buildPanel: function () {
    var self = this;
    var d = document.createElement('div');
    d.className = 'fl-panel';
    d.style.display = 'none';
    document.getElementById('scene').appendChild(d);
    this.panel = d;

    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-fl-act]');
      if (!b) return;
      var act = b.dataset.flAct;
      var ship = self.panelOwner;
      if (!ship) return;
      
      if (act === 'trip') { self.toggleTrip(ship); self.closePanel(); }
      else if (act === 'info') { self.closePanel(); self.openInfo(ship); }
    });

    d.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  },

  openPanel: function (ship) {
    this.panelOwner = ship;
    this.refreshPanel();
  },

  closePanel: function () {
    this.panelOwner = null;
    if (this.panel) this.panel.style.display = 'none';
  },

  refreshPanel: function () {
    var ship = this.panelOwner;
    if (!ship || !this.panel) return;
    
    var isBusy = ship.st === 'fishing' || ship.st === 'sailing';
    var label = ship.st === 'fishing' ? 'ارجع' : (ship.st === 'sailing' ? 'إبحار' : (ship.st === 'returning' ? 'عائدة' : 'أبحر'));
    var ico = isBusy ? '🏠' : '🎣';

    var h = '<div class="fl-btns">';
    h += '<button data-fl-act="trip"><span class="fl-ico-2">' + ico + '</span><small>' + label + '</small></button>';
    h += '<button data-fl-act="info"><span class="fl-ico-2">i️</span><small>تفاصيل</small></button>';
    h += '</div>';

    this.panel.innerHTML = h;
    this.panel.style.left = (ship.x * 100) + '%';
    this.panel.style.top = ((ship.y - 0.08) * 100) + '%';
    this.panel.style.display = 'flex';
  },

  // ════════════════ نوافذ التفاصيل (Modals) ════════════════
  buildModal: function () {
    var m = document.createElement('div');
    m.id = '_fl_modal';
    m.className = 'fl-modal-overlay';
    m.style.display = 'none';
    m.innerHTML = '<div class="fl-modal-content" id="_fl_modal_body"></div>';
    document.body.appendChild(m);

    var self = this;
    m.addEventListener('click', function (e) {
      if (e.target === m) self.closeModal();
    });
  },

  closeModal: function () {
    var m = document.getElementById('_fl_modal');
    if (m) m.style.display = 'none';
  },

  openInfo: function (ship) {
    var body = document.getElementById('_fl_modal_body');
    if (!body) return;

    var statusText = {
      'docked': 'راسي في الميناء ⚓',
      'sailing': 'في طريق الإبحار 🌊',
      'fishing': 'يقوم بالصيد حالياً 🎣',
      'returning': 'عائد إلى الميناء ⛵'
    }[ship.st] || 'غير معروف';

    var h = '<h3>' + (ship.def.emoji || '⛵') + ' ' + ship.def.name + '</h3>';
    
    // معلومات السفينة الأساسية
    h += '<div class="fl-info-row"><span>المستوى:</span> <b>Lv. ' + (ship.def.level || 1) + '</b></div>';
    h += '<div class="fl-info-row"><span>الحالة:</span> <b>' + statusText + '</b></div>';
    h += '<div class="fl-info-row"><span>وقت الرحلة:</span> <b>' + (ship.def.tripSec || 60) + ' ثانية</b></div>';
    h += '<div class="fl-info-row"><span>السمك الحالي:</span> <b>' + ship.catches.length + ' سمكة</b></div>';

    // قائمة السمك المسموح صيده بهذي السفينة
    var allowedFish = ship.def.fish || ship.def.fishPool || [];
    if (allowedFish.length > 0) {
      h += '<div style="margin-top:12px;text-align:right">';
      h += '<div style="font-size:12px;color:#FFD76A;font-weight:800;margin-bottom:6px">🐟 أنواع الصيد المسموحة:</div>';
      h += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
      
      for (var i = 0; i < allowedFish.length; i++) {
        var fishId = allowedFish[i];
        var f = (typeof FISH !== 'undefined' && FISH[fishId]) ? FISH[fishId] : null;
        if (f) {
          h += '<span style="font-size:11px;background:rgba(255,215,106,.1);border:1px solid rgba(255,215,106,.3);padding:4px 8px;border-radius:8px;color:#fff">';
          h += (f.emoji || '🐟') + ' ' + f.name;
          h += '</span>';
        }
      }
      h += '</div></div>';
    }
    
    body.innerHTML = h;
    
    var btn = document.createElement('button');
    btn.className = 'fl-modal-btn';
    btn.textContent = 'إغلاق';
    btn.addEventListener('click', this.closeModal.bind(this));
    body.appendChild(btn);
    
    document.getElementById('_fl_modal').style.display = 'flex';
  },

  // ════════════════ إدارة الرحلة ════════════════
  toggleTrip: function (ship) {
    var totalShips = this.ships.length;
    var self = this;
    
    if (ship.st === 'docked') {
      var seaPos = this.getIconPos('sea', ship.idx, totalShips);
      var now = Date.now();
      ship.st = 'sailing';
      ship.tx = seaPos.x;
      ship.ty = seaPos.y;
      ship.tripStart = now;
      
      // الوقت الحقيقي من بيانات السفينة
      ship.tripEnd = now + (ship.def.tripSec || 60) * 1000; 
      ship.catches = [];
      if (typeof beep === 'function') beep(440, 0.1);
    } else if (ship.st === 'fishing' || ship.st === 'sailing') {
      var harborPos = this.getIconPos('harbor', ship.idx, totalShips);
      ship.st = 'returning';
      ship.tx = harborPos.x;
      ship.ty = harborPos.y;
    }
    
    self.saveShipState(ship);
    self.refreshPanel();
  },

  saveShipState: function (ship) {
    // الحل هنا: استخدام self لضمان الوصول للدالة
    var self = this;
    var inst = self.findInstance(ship.id);
    if (!inst) return;
    
    inst.trip = {
      st: ship.st,
      x: ship.x,
      y: ship.y,
      tripStart: ship.tripStart || 0,
      tripEnd: ship.tripEnd || 0,
      catches: ship.catches || []
    };
    if (typeof saveState === 'function') saveState();
  },

  finishTrip: function (ship) {
    var st = this.ctx.state;
    var cat = ship.catches || [];
    
    for (var i = 0; i < cat.length; i++) {
      var fishId = cat[i];
      st.inventory[fishId] = (st.inventory[fishId] || 0) + 1;
      st.stats.caught++;
      if (typeof FISH !== 'undefined' && FISH[fishId] && FISH[fishId].rarity === 'legendary') st.stats.legendary++;
      if (window.FishDiscovery) FishDiscovery.register(fishId);
    }
    
    if (cat.length) st.stats.trips++;
    
    ship.catches = [];
    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
    
    if (cat.length) {
      if (typeof showMessage === 'function') showMessage('🎣 ' + ship.def.name + ' رجع بـ ' + cat.length + ' سمكة');
      if (typeof beep === 'function') beep(880, 0.15);
    }
  },

  // ════════════════ حلقة التحديث (Tick) ════════════════
  moveTo: function (ship, tx, ty, dt, W, H) {
    var dx = (tx - ship.x) * W;
    var dy = (ty - ship.y) * H;
    var dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist <= this.ARRIVE_PX) {
      ship.x = tx;
      ship.y = ty;
      return true;
    }
    
    var step = Math.min(this.SPEED_PX * dt, dist);
    ship.x += (dx / dist) * step / W;
    ship.y += (dy / dist) * step / H;
    return false;
  },

  tick: function () {
    var self = this;
    var scene = document.getElementById('scene');
    if (!scene) return;
    var W = scene.clientWidth, H = scene.clientHeight;
    if (!W || !H) return;

    var now = Date.now();
    var dt = Math.min(0.1, (now - self.lastTick) / 1000);
    self.lastTick = now;

    for (var i = 0; i < self.ships.length; i++) {
      var s = self.ships[i];

      if (s.st === 'sailing') {
        if (self.moveTo(s, s.tx, s.ty, dt, W, H)) {
          s.st = 'fishing';
          self.saveShipState(s);
        }
      } 
      else if (s.st === 'fishing') {
        // معدل الصيد الأساسي
        if (Math.random() < dt * 0.8) {
          var list = s.def.fish || s.def.fishPool || [];
          var fish = list.length ? list[Math.floor(Math.random() * list.length)] : 'sardine';
          s.catches.push(fish);
          self.spawnFishIcon(s, fish);
        }
        
        if (now >= s.tripEnd) {
          var harborPos = self.getIconPos('harbor', s.idx, self.ships.length);
          s.st = 'returning';
          s.tx = harborPos.x;
          s.ty = harborPos.y;
          self.saveShipState(s);
        }
      } 
      else if (s.st === 'returning') {
        if (self.moveTo(s, s.tx, s.ty, dt, W, H)) {
          s.st = 'docked';
          self.finishTrip(s);
          self.saveShipState(s);
        }
      }

      self.updateVisual(s);
    }

    if (self.panelOwner && self.panel && self.panel.style.display !== 'none') {
      self.panel.style.left = (self.panelOwner.x * 100) + '%';
      self.panel.style.top = ((self.panelOwner.y - 0.08) * 100) + '%';
    }
  },

  spawnFishIcon: function (s, fishId) {
    var scene = document.getElementById('scene');
    if (!scene || typeof FISH === 'undefined' || !FISH[fishId]) return;
    
    var el = document.createElement('div');
    el.style.cssText = 'position:absolute;pointer-events:none;z-index:10;font-size:24px;' +
      'left:' + (s.x * 100) + '%;top:' + (s.y * 100) + '%;' +
      'transform:translate(-50%,-100%);' +
      'animation:_fishPop 1s ease-out forwards';
    el.textContent = FISH[fishId].emoji || '🐟';
    
    if (!document.getElementById('_fishpop_anim')) {
      var st = document.createElement('style');
      st.id = '_fishpop_anim';
      st.textContent = '@keyframes _fishPop{0%{opacity:0;transform:translate(-50%,-100%) scale(.5)}20%{opacity:1;transform:translate(-50%,-130%) scale(1.2)}100%{opacity:0;transform:translate(-50%,-200%) scale(.8)}}';
      document.head.appendChild(st);
    }
    
    scene.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1000);
  },

  updateVisual: function (s) {
    if (!s.el) return;
    s.el.style.left = (s.x * 100) + '%';
    s.el.style.top = (s.y * 100) + '%';

    var label = s.def.name + ' Lv.' + (s.def.level || 1);
    var pct = 0;
    
    if (s.st === 'sailing') {
      pct = 15;
      label += ' · إبحار';
    } else if (s.st === 'fishing') {
      var total = Math.max(1, s.tripEnd - s.tripStart);
      var left = Math.max(0, Math.ceil((s.tripEnd - Date.now()) / 1000));
      pct = Math.min(100, ((Date.now() - s.tripStart) / total) * 100);
      label += ' · ' + left + 'ث · ' + s.catches.length + '🐟';
    } else if (s.st === 'returning') {
      pct = 100;
      label += ' · عودة';
    } else {
      label += ' · ⚓';
    }
    
    if (s.lblEl) s.lblEl.textContent = label;
    if (s.barEl) s.barEl.style.width = pct + '%';
  },

  injectCSS: function () {
    if (document.getElementById('_fleet_v101_css')) return;
    var css = [
      '.fl-ship{position:absolute;transform:translate(-50%,-50%);cursor:pointer;z-index:5;display:flex;flex-direction:column;align-items:center;gap:3px;transition:left .05s linear,top .05s linear;will-change:left,top}',
      '.fl-ship img{width:70px;height:70px;object-fit:contain;filter:drop-shadow(0 6px 10px rgba(0,0,0,.65));pointer-events:none;transition:transform .25s ease-out}',
      '.fl-ship .fl-lbl{font-size:10px;font-weight:800;color:#FFD76A;background:rgba(0,0,0,.75);padding:2px 6px;border-radius:6px;white-space:nowrap;border:1px solid rgba(255,215,106,.35);font-family:inherit}',
      '.fl-ship .fl-bar{width:50px;height:5px;background:rgba(0,0,0,.6);border-radius:3px;overflow:hidden;border:1px solid rgba(255,215,106,.25)}',
      '.fl-ship .fl-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#4ade80,#22c55e);transition:width .2s}',
      
      '.fl-panel{position:absolute;transform:translate(-50%,-100%);z-index:25;background:linear-gradient(180deg,rgba(20,35,60,.98),rgba(10,20,40,.98));border:2px solid rgba(255,215,106,.7);border-radius:14px;padding:8px;min-width:140px;pointer-events:auto;box-shadow:0 10px 30px rgba(0,0,0,.8);display:none}',
      '.fl-panel .fl-btns{display:flex;gap:8px;justify-content:center}',
      '.fl-panel .fl-btns button{width:70px;padding:8px 6px;border-radius:10px;border:1.5px solid rgba(255,215,106,.5);background:linear-gradient(180deg,rgba(255,215,106,.15),rgba(255,215,106,.05));color:#fff;font-family:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px}',
      '.fl-panel .fl-btns button:active{transform:scale(.94)}',
      '.fl-panel .fl-ico-2{font-size:18px;line-height:1}',
      '.fl-panel .fl-btns small{font-size:10px;font-weight:800;color:#FFD76A}',

      '.fl-modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:999;display:flex;align-items:center;justify-content:center;padding:16px}',
      '.fl-modal-content{background:linear-gradient(180deg,#14233c,#0a1428);border:2px solid rgba(255,215,106,.7);border-radius:16px;padding:20px;width:100%;max-width:320px;color:#fff;box-shadow:0 15px 35px rgba(0,0,0,.9);text-align:center;font-family:inherit}',
      '.fl-modal-content h3{margin-top:0;color:#FFD76A;font-size:18px;margin-bottom:12px}',
      '.fl-info-row{display:flex;justify-content:space-between;background:rgba(255,215,106,.08);padding:8px 12px;border-radius:8px;margin-bottom:8px;font-size:13px;border:1px solid rgba(255,215,106,.15)}',
      '.fl-modal-btn{width:100%;padding:12px;margin-top:12px;background:linear-gradient(90deg,#d97706,#b45309);border:none;border-radius:8px;color:#fff;font-weight:900;font-size:14px;cursor:pointer;font-family:inherit;box-shadow:0 4px 10px rgba(0,0,0,.5)}'
    ].join('');
    var s = document.createElement('style');
    s.id = '_fleet_v101_css';
    s.textContent = css;
    document.head.appendChild(s);
  }
});
