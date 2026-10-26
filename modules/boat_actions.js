// modules/boat_actions.js - أزرار السفينة: تظهر عند الضغط على السفينة فقط (ES5)
ModuleRegistry.register({
  id: 'boat_actions',
  name: 'أزرار السفينة',
  version: '1.3.0',
  dependencies: [],

  // ─── إعدادات قابلة للتعديل ───
  SHOW_MS: 4000,
  OFFSET_Y: 70,
  ICON_SIZE: 44,
  BG_TOLERANCE: 40,

  cache: {},
  ctx: null,
  hideTimer: null,

  init: function (ctx) {
    var self = this;
    this.ctx = ctx;

    if (!document.getElementById('ba-css-style')) {
      var css = document.createElement('style');
      css.id = 'ba-css-style';
      css.textContent = this.CSS_TEXT();
      document.head.appendChild(css);
    }

    var scene = document.getElementById('scene');
    if (!scene) return;

    // 1) شريط الأزرار
    var bar = document.createElement('div');
    bar.id = 'baBar';
    bar.innerHTML =
      '<button class="ba-btn" data-act="sell"><span>💰</span><small>بيع</small></button>' +
      '<button class="ba-btn" data-act="crew"><span>👥</span><small>طاقم</small></button>' +
      '<button class="ba-btn" data-act="type"><span>🧭</span><small id="baTypeTxt">النوع</small></button>' +
      '<button class="ba-btn" data-act="trip"><span>🎣</span><small id="baTripTxt">صيد</small></button>';
    scene.appendChild(bar);

    bar.addEventListener('click', function (e) {
      e.stopPropagation();
      var t = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!t) return;
      self.keepOpen();
      var act = t.getAttribute('data-act');
      if (act === 'sell') ctx.ui.showScreen('storage');
      if (act === 'crew') ctx.ui.showScreen('store');
      if (act === 'type') self.openTypePicker();
      if (act === 'trip') { self.onTripButton(); self.hide(); }
    });

    // 2) استبدال السفينة بنسخة نظيفة بدون مستمعات الملف الأساسي
    var oldBoat = document.getElementById('boat');
    if (oldBoat) {
      var boat = oldBoat.cloneNode(true);
      oldBoat.parentNode.replaceChild(boat, oldBoat);
      boat.addEventListener('click', function (e) {
        e.stopPropagation();
        self.show();
      });
    }

    // 3) الضغط في أي مكان آخر على المشهد يخفي الأزرار
    scene.addEventListener('pointerdown', function (e) {
      if (e.target.closest && (e.target.closest('#baBar') || e.target.closest('#boat'))) return;
      self.hide();
    });

    setInterval(function () { self.refreshButtons(); }, 500);
    this.hide();
  },

  show: function () {
    var bar = document.getElementById('baBar');
    if (!bar) return;
    this.placeAboveBoat();
    bar.classList.add('show');
    this.refreshButtons();
    this.keepOpen();
  },

  hide: function () {
    var bar = document.getElementById('baBar');
    if (bar) bar.classList.remove('show');
    if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
  },

  keepOpen: function () {
    var self = this;
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(function () { self.hide(); }, this.SHOW_MS);
  },

  placeAboveBoat: function () {
    var bar = document.getElementById('baBar');
    var scene = document.getElementById('scene');
    if (!bar || !scene) return;
    var w = scene.clientWidth, h = scene.clientHeight;
    var cx = P.x * w, cy = P.y * h;
    var barW = bar.offsetWidth || 230;
    var left = Math.max(6, Math.min(w - barW - 6, cx - barW / 2));
    var top = Math.max(6, cy - this.OFFSET_Y - 50);
    bar.style.left = left + 'px';
    bar.style.top = top + 'px';
    bar.style.bottom = 'auto';
  },

  refreshButtons: function () {
    var tripTxt = document.getElementById('baTripTxt');
    var typeTxt = document.getElementById('baTypeTxt');
    var fishing = typeof currentTripState !== 'undefined' && currentTripState === TS.FISHING;
    if (tripTxt) tripTxt.textContent = fishing ? 'ارجع' : 'صيد';
    if (typeTxt) {
      var fx = ModuleRegistry.get('crew_effects');
      var t = fx && fx.guideTarget;
      typeTxt.textContent = (t && typeof FISH !== 'undefined' && FISH[t]) ? FISH[t].name : 'النوع';
    }
  },

  onTripButton: function () {
    if (typeof currentTripState === 'undefined') return;
    if (currentTripState === TS.IDLE) startTrip();
    else if (currentTripState === TS.FISHING) startReturn();
  },

  openTypePicker: function () {
    var self = this;
    var ship = currentShip();
    var box = document.createElement('div');
    box.id = 'baPicker';
    var h = '<div class="ba-pick-card"><div class="ba-pick-title">🧭 اختر نوع الصيد</div>';
    for (var i = 0; i < ship.fish.length; i++) {
      var id = ship.fish[i];
      h += '<button class="ba-pick-item" data-fish="' + id + '">' +
           '<img data-src="' + fishImg(id) + '" class="ba-fish-img" alt="">' +
           '<span>' + FISH[id].name + '</span></button>';
    }
    h += '<button class="ba-pick-cancel" data-act="cancel">إلغاء</button></div>';
    box.innerHTML = h;
    document.getElementById('app').appendChild(box);

    var imgs = box.querySelectorAll('img[data-src]');
    for (var j = 0; j < imgs.length; j++) {
      this.loadIcon(imgs[j].getAttribute('data-src'), imgs[j]);
    }

    box.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-fish]') : null;
      if (t) {
        self.chooseFish(t.getAttribute('data-fish'));
        box.parentNode.removeChild(box);
        return;
      }
      if (e.target.closest && e.target.closest('[data-act="cancel"]')) {
        box.parentNode.removeChild(box);
      }
    });
  },

  chooseFish: function (fishId) {
    var fx = ModuleRegistry.get('crew_effects');
    if (fx) {
      fx.guideTarget = fishId;
      this.ctx.save();
    }
    this.ctx.ui.toast('🧭 النوع المختار: ' + FISH[fishId].name);
    this.refreshButtons();
  },

  loadIcon: function (src, imgEl) {
    var self = this;
    if (this.cache[src]) { imgEl.src = this.cache[src]; return; }
    var im = new Image();
    im.onload = function () {
      var c = document.createElement('canvas');
      c.width = self.ICON_SIZE; c.height = self.ICON_SIZE;
      var g = c.getContext('2d');
      g.drawImage(im, 0, 0, self.ICON_SIZE, self.ICON_SIZE);
      try {
        var d = g.getImageData(0, 0, self.ICON_SIZE, self.ICON_SIZE);
        var px = d.data;
        var bg = self.cornerColor(px, self.ICON_SIZE);
        for (var p = 0; p < px.length; p += 4) {
          var dr = px[p] - bg[0], dg = px[p + 1] - bg[1], db = px[p + 2] - bg[2];
          if (Math.sqrt(dr * dr + dg * dg + db * db) < self.BG_TOLERANCE) px[p + 3] = 0;
        }
        g.putImageData(d, 0, 0);
      } catch (e) { /* مصدر محمي: نعرض الصورة الأصلية */ }
      var url = c.toDataURL('image/png');
      self.cache[src] = url;
      imgEl.src = url;
    };
    im.onerror = function () { imgEl.style.display = 'none'; };
    im.src = src;
  },

  cornerColor: function (px, size) {
    var pts = [0, (size - 1) * 4, (size - 1) * size * 4, ((size - 1) * size + size - 1) * 4];
    var r = 0, g = 0, b = 0, i;
    for (i = 0; i < pts.length; i++) {
      r += px[pts[i]]; g += px[pts[i] + 1]; b += px[pts[i] + 2];
    }
    return [r / 4, g / 4, b / 4];
  },

  CSS_TEXT: function () {
    return [
      '#baBar{position:absolute;display:flex;gap:4px;z-index:30;opacity:0;pointer-events:none;transition:opacity .2s}',
      '#baBar.show{opacity:1;pointer-events:auto}',
      '.ba-btn{width:52px;padding:4px 2px;border-radius:10px;border:1.5px solid var(--gold);background:linear-gradient(180deg,#8B5A2B,#5D3A1A);color:#FFE9A8;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:0;box-shadow:0 3px 8px rgba(0,0,0,.45)}',
      '.ba-btn span{font-size:15px;line-height:1.1}',
      '.ba-btn small{font-size:9px;font-weight:800;white-space:nowrap}',
      '.ba-btn:active{transform:scale(.93)}',
      '#baPicker{position:absolute;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:70}',
      '.ba-pick-card{width:86%;max-width:340px;padding:14px;border-radius:18px;background:linear-gradient(180deg,#0e2238,#06182b);border:1.5px solid var(--line)}',
      '.ba-pick-title{text-align:center;color:var(--gold);font-weight:800;font-size:16px;margin-bottom:10px}',
      '.ba-pick-item{width:100%;display:flex;align-items:center;gap:10px;padding:8px;margin-bottom:8px;border-radius:12px;border:1px solid var(--line);background:var(--glass);color:#fff;font-family:inherit;font-size:14px}',
      '.ba-fish-img{width:44px;height:44px;object-fit:contain;flex-shrink:0}',
      '.ba-pick-cancel{width:100%;padding:10px;border-radius:12px;border:none;background:#3a3f4a;color:#fff;font-family:inherit;font-weight:700}'
    ].join('\n');
  }
});
