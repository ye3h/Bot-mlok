// modules/fleet.js - قوارب الصيد: نفس القوارب، بحد أقصى 3 مفعّلة، والشراء المكرر يزيد العدد (ES5)
ModuleRegistry.register({
  id: 'fleet',
  name: 'قوارب الصيد',
  version: '2.1.0',
  dependencies: ['store'],

  MAX_ACTIVE: 3,
  TICK_MS: 50,
  MIN_PX: 110,
  SPEED: 0.25,
  PARK: { x: 0.86, ys: [0.46, 0.58, 0.70] },
  SEA:  { xs: [0.40, 0.70, 0.52], ys: [0.30, 0.40, 0.62] },

  FLEET: [
    { id: 'fl_boat1', cat: 'fleet', icon: '⛵', img: 'assets/ships/level_01/ship-lvl-1.webp', name: 'قارب صيد 1',
      price_coins: 20000, req_level: 5, desc: 'قارب صيد خفيف وسريع', fishing_seconds: 8, fish: ['c_001', 'c_002', 'c_003'] },
    { id: 'fl_boat2', cat: 'fleet', icon: '⛵', img: 'assets/ships/level_02/ship-lvl-1.webp', name: 'قارب صيد 2',
      price_coins: 80000, req_level: 15, desc: 'قارب متوسط بصيد أفضل', fishing_seconds: 6, fish: ['u_001', 'u_002', 'u_003'] },
    { id: 'fl_boat3', cat: 'fleet', icon: '⛵', img: 'assets/ships/level_03/ship-lvl-1.webp', name: 'قارب صيد 3',
      price_gems: 100, req_level: 30, desc: 'قارب قوي يصطاد الأسماك النادرة', fishing_seconds: 4, fish: ['r_001', 'r_002', 'r_003'] }
  ],

  byId: {}, trips: {}, els: {}, pending: {}, active: [], ctx: null, selected: null,

  init: function (ctx) {
    var self = this, i;
    this.ctx = ctx;
    var store = ModuleRegistry.get('store');
    if (!store) return;

    for (i = 0; i < this.FLEET.length; i++) {
      this.byId[this.FLEET[i].id] = this.FLEET[i];
      store.CATALOG.push(this.FLEET[i]);
      store.byId[this.FLEET[i].id] = this.FLEET[i];
    }
    var hasTab = false;
    for (i = 0; i < store.TABS.length; i++) if (store.TABS[i].key === 'fleet') hasTab = true;
    if (!hasTab) store.TABS.push({ key: 'fleet', label: 'قوارب' });

    // أزرار التفعيل داخل تبويب القوارب
    var origRender = store.render;
    store.render = function () {
      origRender.apply(this, arguments);
      if (store.tab !== 'fleet') return;
      var cards = document.getElementById('stList').querySelectorAll('.card');
      for (var k = 0; k < cards.length; k++) {
        var btn = cards[k].querySelector('[data-act],[disabled]');
        var id = btn ? btn.getAttribute('data-id') : null;
        if (!id || !self.byId[id] || self.ctx.state.owned.indexOf(id) < 0) continue;
        var isOn = self.active.indexOf(id) >= 0;
        cards[k].querySelector('.acts').innerHTML +=
          '<button class="btn ' + (isOn ? '' : 'gold') + '" data-fl="' + id + '">' +
          (isOn ? 'إلغاء' : 'تفعيل') + '</button>';
      }
    };

    document.getElementById('stList').addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-fl]') : null;
      if (!t) return;
      self.toggle(t.getAttribute('data-fl'));
      store.render();
    });

    if (!document.getElementById('fl-css')) {
      var css = document.createElement('style');
      css.id = 'fl-css';
      css.textContent = this.CSS_TEXT();
      document.head.appendChild(css);
    }

    // الضغط على مكان فارغ من البحر يحرك القارب المختار إليه
    var scene = document.getElementById('scene');
    scene.addEventListener('pointerdown', function (e) {
      if (!self.selected || e.target.closest('.fl-ship, .map-item, #boat, #baBar')) return;
      var r = scene.getBoundingClientRect();
      var t = self.trips[self.selected];
      if (!t || t.st === 'harbor') return;
      t.tx = (e.clientX - r.left) / r.width;
      t.ty = (e.clientY - r.top) / r.height;
      t.manual = true;
    });

    setInterval(function () { self.tick(); }, this.TICK_MS);
  },

  toggle: function (id) {
    var idx = this.active.indexOf(id);
    if (idx >= 0) {
      this.active.splice(idx, 1);
      this.removeEl(id);
      delete this.trips[id];
      if (this.selected === id) this.selected = null;
      this.ctx.ui.toast('⚓ أُلغي تفعيل ' + this.byId[id].name);
    } else {
      if (this.active.length >= this.MAX_ACTIVE) {
        this.ctx.ui.toast('⚠️ لا يمكن تفعيل أكثر من ' + this.MAX_ACTIVE + ' قوارب');
        return;
      }
      this.active.push(id);
      this.ctx.ui.toast('✅ تم تفعيل ' + this.byId[id].name);
    }
    this.ctx.save();
  },

  removeEl: function (id) {
    if (this.els[id] && this.els[id].parentNode) this.els[id].parentNode.removeChild(this.els[id]);
    delete this.els[id];
  },

  load: function (saved) {
    var f = (saved && saved.fleet) || {};
    this.pending = f.trips || {};
    var act = f.active instanceof Array ? f.active : [];
    this.active = [];
    for (var i = 0; i < act.length && this.active.length < this.MAX_ACTIVE; i++) {
      if (this.byId[act[i]] && this.active.indexOf(act[i]) < 0) this.active.push(act[i]);
    }
  },

  save: function (st) {
    var out = {}, id;
    for (id in this.trips) {
      if (!this.trips.hasOwnProperty(id)) continue;
      var t = this.trips[id];
      if (t.catches.length || t.st === 'fishing' || t.st === 'returning') out[id] = { st: t.st, catches: t.catches.slice(0) };
    }
    for (id in this.pending) if (this.pending.hasOwnProperty(id) && !out[id]) out[id] = this.pending[id];
    st.fleet = { trips: out, active: this.active.slice(0) };
  },

  activeFleet: function () {
    var owned = this.ctx.state.owned, out = [], i;
    for (i = 0; i < this.active.length; i++) {
      if (owned.indexOf(this.active[i]) >= 0 && out.length < this.MAX_ACTIVE) out.push(this.active[i]);
    }
    return out;
  },

  ensureEl: function (id) {
    if (this.els[id]) return this.els[id];
    var self = this, def = this.byId[id];
    var d = document.createElement('div');
    d.className = 'fl-ship';
    d.id = 'fl_' + id;
    d.innerHTML = '<img src="' + def.img + '" alt="" onerror="this.outerHTML=\'' + def.icon + '\'">' +
                  '<div class="fl-lbl"></div>';
    d.addEventListener('click', function (e) { e.stopPropagation(); self.onTap(id); });
    document.getElementById('scene').appendChild(d);
    this.els[id] = d;
    return d;
  },

  onTap: function (id) {
    var t = this.trips[id];
    if (!t) return;
    this.selected = id;
    if (t.st === 'harbor') {
      t.st = 'fishing'; t.manual = false;
      t.endsAt = Date.now() + 20000;
      this.ctx.ui.toast('⛵ ' + this.byId[id].name + ' تبحر للصيد');
    } else if (t.st === 'fishing') {
      t.st = 'returning'; t.manual = false;
      this.ctx.ui.toast('↩ ' + this.byId[id].name + ' ترجع للميناء');
    }
    this.ctx.save();
  },

  deliver: function (id, t) {
    var st = this.ctx.state, n = t.catches.length, i, c;
    for (i = 0; i < n; i++) {
      c = t.catches[i];
      st.inventory[c] = (st.inventory[c] || 0) + 1;
      st.stats.caught++;
    }
    if (n) st.stats.trips++;
    t.catches = [];
    if (n) {
      ModuleRegistry.callHook('onTripEnd');
      this.ctx.ui.toast('🐟 ' + this.byId[id].name + ' رجع بـ ' + n + ' سمكة');
    }
    this.ctx.save();
    if (typeof render === 'function') render();
  },

  tick: function () {
    if (!this.ctx) return;
    var scene = document.getElementById('scene');
    if (!scene) return;
    var W = scene.clientWidth, H = scene.clientHeight;
    var dt = this.TICK_MS / 1000, now = Date.now();
    var ids = this.activeFleet(), i, id, t, def, pos, saved, f, el, label;

    for (id in this.els) {
      if (this.els.hasOwnProperty(id) && ids.indexOf(id) < 0) this.removeEl(id);
    }

    for (i = 0; i < ids.length; i++) {
      id = ids[i]; def = this.byId[id];
      this.ensureEl(id);
      t = this.trips[id];
      if (!t) {
        pos = { x: this.PARK.x, y: this.PARK.ys[i] };
        saved = this.pending[id];
        t = this.trips[id] = {
          st: saved ? 'returning' : 'harbor',
          x: pos.x, y: pos.y, tx: pos.x, ty: pos.y,
          endsAt: 0, manual: false,
          catches: (saved && saved.catches) ? saved.catches.slice(0) : []
        };
        if (saved) delete this.pending[id];
      }

      if (t.st === 'fishing') {
        if (now >= t.endsAt) t.st = 'returning';
        else if (Math.random() < dt / def.fishing_seconds) {
          f = def.fish[Math.floor(Math.random() * def.fish.length)];
          t.catches.push(f);
          ModuleRegistry.callHook('onCatch', f);
        }
      }

      if (!t.manual) {
        pos = (t.st === 'fishing') ? { x: this.SEA.xs[i], y: this.SEA.ys[i] } : { x: this.PARK.x, y: this.PARK.ys[i] };
        t.tx = pos.x; t.ty = pos.y;
      }

      if (t.st === 'returning' && !t.manual && Math.abs(t.x - t.tx) < 0.01 && Math.abs(t.y - t.ty) < 0.01) {
        this.deliver(id, t);
        t.st = 'harbor';
      }

      var dx = t.tx - t.x, dy = (t.ty - t.y) * H / W, dist = Math.sqrt(dx * dx + dy * dy);
      var step = this.SPEED * dt;
      if (dist > 0.001) {
        var m = Math.min(step, dist);
        t.x += dx / dist * m;
        t.y += (t.ty - t.y) / dist * m;
      }
    }

    this.separate(ids, W, H);

    for (i = 0; i < ids.length; i++) {
      id = ids[i]; t = this.trips[id]; el = this.els[id];
      label = this.byId[id].name;
      if (t.st === 'fishing') label += ' · ' + Math.max(0, Math.ceil((t.endsAt - now) / 1000)) + 'ث';
      else if (t.st === 'returning') label += ' · عودة';
      if (t.catches.length) label += ' · ' + t.catches.length + '🐟';
      if (this.selected === id) label = '▶ ' + label;
      el.style.left = (t.x * 100) + '%';
      el.style.top = (t.y * 100) + '%';
      el.querySelector('.fl-lbl').textContent = label;
    }
  },

  separate: function (ids, W, H) {
    var i, j, a, b, dx, dy, d, push, ux, uy;
    for (i = 0; i < ids.length; i++) {
      for (j = i + 1; j < ids.length; j++) {
        a = this.trips[ids[i]]; b = this.trips[ids[j]];
        dx = (a.x - b.x) * W; dy = (a.y - b.y) * H;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < this.MIN_PX) {
          if (d < 0.001) { dx = 1; dy = 0; d = 1; }
          push = (this.MIN_PX - d) / 2; ux = dx / d; uy = dy / d;
          a.x += ux * push / W; a.y += uy * push / H;
          b.x -= ux * push / W; b.y -= uy * push / H;
        }
      }
    }
    for (i = 0; i < ids.length; i++) {
      a = this.trips[ids[i]];
      a.x = Math.max(0.05, Math.min(0.95, a.x));
      a.y = Math.max(0.12, Math.min(0.88, a.y));
    }
  },

  CSS_TEXT: function () {
    return [
      '.fl-ship{position:absolute;width:90px;transform:translate(-50%,-50%);z-index:4;cursor:pointer;touch-action:none;text-align:center}',
      '.fl-ship img{width:90px;height:66px;object-fit:contain;display:block;filter:drop-shadow(0 6px 8px rgba(0,0,0,.6))}',
      '.fl-lbl{display:inline-block;margin-top:2px;padding:1px 6px;border-radius:8px;background:rgba(0,0,0,.6);color:var(--gold);font-size:10px;font-weight:800;white-space:nowrap}'
    ].join('\n');
  }
});
