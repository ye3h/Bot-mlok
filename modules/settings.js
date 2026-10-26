// modules/settings.js — الإعدادات الكاملة (v2.0.0)
// ملاحظة: الموديول لا يستخدم أسماء hooks محجوزة (save / load) حتى ما يتعارض مع ModuleRegistry
ModuleRegistry.register({
  id: 'settings',
  name: 'الإعدادات',
  version: '2.0.0',
  dependencies: [],

  KEY: 'pirate_settings_v2',
  VERSION: '2.0.0',
  DEFAULTS: {
    sound: true,
    sfxVolume: 50,
    vibration: true,
    toasts: true,
    bgVideo: true,
    lowFx: false,
    reduceMotion: false,
    showFps: false,
    migrated: false
  },

  ctx: null,
  cfg: null,
  _ac: null,
  _boundEl: null,
  _fpsEl: null,
  _fpsRaf: 0,
  _rawToast: null,

  /* ═══════════════ INIT ═══════════════ */
  init: function (ctx) {
    this.ctx = ctx;
    this.cfg = this.readCfg();
    this.injectCSS();
    this.migrate();
    this.installAudio();
    this.installToast();
    this.installVibrate();
    this.apply();
    window.GameSettings = this;
  },

  onScreenOpen: function (ctx, name) {
    if (name === 'settings') this.build();
  },

  open: function () {
    if (typeof openScreen === 'function') openScreen('settings');
    this.build();
  },

  /* ═══════════════ التخزين ═══════════════ */
  defaults: function () {
    var o = {}, k;
    for (k in this.DEFAULTS) if (this.DEFAULTS.hasOwnProperty(k)) o[k] = this.DEFAULTS[k];
    o.migrated = true;
    return o;
  },

  readCfg: function () {
    var out = {}, k;
    for (k in this.DEFAULTS) if (this.DEFAULTS.hasOwnProperty(k)) out[k] = this.DEFAULTS[k];
    try {
      var saved = JSON.parse(localStorage.getItem(this.KEY) || '{}') || {};
      for (k in out) {
        if (saved.hasOwnProperty(k) && typeof saved[k] === typeof out[k]) out[k] = saved[k];
      }
    } catch (e) {}
    out.sfxVolume = Math.max(0, Math.min(100, Math.round(out.sfxVolume)));
    return out;
  },

  persist: function () {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.cfg)); } catch (e) {}
    try { localStorage.setItem(SOUND_KEY, this.cfg.sound ? 'on' : 'off'); } catch (e) {}
  },

  // ترحيل من النظام القديم (state.soundOn ومفتاح SOUND_KEY)
  migrate: function () {
    if (this.cfg.migrated) return;
    var st = this.ctx && this.ctx.state;
    if (st && st.soundOn === false) this.cfg.sound = false;
    try { if (localStorage.getItem(SOUND_KEY) === 'off') this.cfg.sound = false; } catch (e) {}
    this.cfg.migrated = true;
    this.persist();
  },

  set: function (key, val, quiet) {
    this.cfg[key] = val;
    this.persist();
    this.apply();
    if (!quiet) this.build();
  },

  /* ═══════════════ تطبيق الإعدادات على اللعبة ═══════════════ */
  systemReduce: function () {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  },

  apply: function () {
    var c = this.cfg, body = document.body;
    body.classList.toggle('fx-low', !!c.lowFx);
    body.classList.toggle('no-bgvideo', !c.bgVideo);
    body.classList.toggle('reduce-motion', !!c.reduceMotion || this.systemReduce());

    var vid = document.getElementById('bg-video');
    if (vid) {
      if (c.bgVideo) {
        var p = vid.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        vid.pause();
      }
    }

    window.soundOn = !!c.sound;
    this.fpsToggle(c.showFps);
  },

  /* ═══════════════ الصوت ═══════════════ */
  // يستبدل beep بنسخة تحترم الصوت ومستوى المؤثرات
  installAudio: function () {
    var self = this;
    window.beep = function (freq, dur) {
      if (!self.cfg.sound) return;
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        if (!self._ac) self._ac = new AC();
        var ac = self._ac;
        if (ac.state === 'suspended' && ac.resume) ac.resume();

        var t0 = ac.currentTime, d = dur || 0.1;
        var peak = 0.05 * (self.cfg.sfxVolume / 50);
        var o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine';
        o.frequency.value = freq || 440;
        g.gain.setValueAtTime(peak, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
        o.connect(g);
        g.connect(ac.destination);
        o.start(t0);
        o.stop(t0 + d);
      } catch (e) {}
    };
  },

  /* ═══════════════ الإشعارات والاهتزاز ═══════════════ */
  installToast: function () {
    var self = this, orig = window.showMessage;
    if (typeof orig !== 'function') return;
    this._rawToast = orig;
    window.showMessage = function () {
      if (!self.cfg.toasts) return;
      return orig.apply(this, arguments);
    };
  },

  installVibrate: function () {
    var self = this;
    window.gameVibrate = function (ms) { self.vibrate(ms); };
  },

  vibrate: function (ms) {
    if (!this.cfg.vibration) return;
    try { if (navigator.vibrate) navigator.vibrate(ms || 15); } catch (e) {}
  },

  toast: function (m) {
    if (this._rawToast) this._rawToast(m);
    else if (typeof showMessage === 'function') showMessage(m);
  },

  /* ═══════════════ عداد FPS ═══════════════ */
  fpsToggle: function (on) {
    var self = this;
    if (on && !this._fpsEl) {
      var el = document.createElement('div');
      el.id = 'st-fps';
      el.style.cssText = 'position:fixed;top:4px;right:4px;z-index:99998;background:rgba(0,0,0,.6);color:#0f0;font:11px monospace;padding:2px 6px;border-radius:6px;pointer-events:none;direction:ltr';
      document.body.appendChild(el);
      this._fpsEl = el;
      var frames = 0, last = performance.now();
      var loop = function (now) {
        frames++;
        if (now - last >= 500) {
          el.textContent = Math.round(frames * 1000 / (now - last)) + ' FPS';
          frames = 0;
          last = now;
        }
        self._fpsRaf = requestAnimationFrame(loop);
      };
      this._fpsRaf = requestAnimationFrame(loop);
    } else if (!on && this._fpsEl) {
      cancelAnimationFrame(this._fpsRaf);
      this._fpsEl.parentNode.removeChild(this._fpsEl);
      this._fpsEl = null;
    }
  },

  /* ═══════════════ أدوات مساعدة ═══════════════ */
  esc: function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  },

  cleanName: function (s) {
    return String(s == null ? '' : s).replace(/[<>"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 14);
  },

  usageKB: function () {
    var n = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        n += (k.length + (localStorage.getItem(k) || '').length) * 2;
      }
    } catch (e) {}
    return (n / 1024).toFixed(1);
  },

  readSave: function () {
    try { return localStorage.getItem(SAVE_KEY) || ''; } catch (e) { return ''; }
  },

  copy: function (txt) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt); } catch (e) {}
  },

  /* ═══════════════ CSS ═══════════════ */
  injectCSS: function () {
    if (document.getElementById('_st_css')) return;
    var c = [
      '.st-sec{margin-bottom:14px}',
      '.st-title{font-size:13px;font-weight:900;color:#FFD76A;margin:0 4px 8px}',
      '.st-card{background:linear-gradient(180deg,rgba(30,45,75,.85),rgba(15,25,45,.9));border:1.5px solid rgba(252,191,73,.25);border-radius:14px;padding:4px 12px 12px}',
      '.st-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)}',
      '.st-row:last-child{border-bottom:0}',
      '.st-txt{flex:1;min-width:0}',
      '.st-lbl{font-size:13px;font-weight:800;color:#fff}',
      '.st-sub{font-size:10px;color:#94a3b8;margin-top:2px;line-height:1.4}',
      '.st-ctl{flex-shrink:0;display:flex;align-items:center;gap:6px}',
      '.st-sw{width:50px;height:28px;border-radius:14px;border:1.5px solid rgba(255,255,255,.2);background:#334155;position:relative;padding:0;cursor:pointer;transition:background .2s}',
      '.st-sw.on{background:linear-gradient(180deg,#86efac,#16a34a);border-color:#86efac}',
      '.st-knob{position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 2px 4px rgba(0,0,0,.4)}',
      '.st-sw.on .st-knob{transform:translateX(22px)}',
      '.st-range{width:130px;accent-color:#FFD76A}',
      '.st-val{font-size:11px;color:#FFD76A;min-width:28px;text-align:center;font-weight:800}',
      '.st-input,.st-area{width:100%;background:rgba(10,20,35,.8);color:#fff;border:1.5px solid rgba(252,191,73,.3);border-radius:10px;padding:9px 10px;font-family:inherit;font-size:13px;margin-top:8px;box-sizing:border-box}',
      '.st-area{min-height:64px;direction:ltr;font-size:11px;font-family:ui-monospace,Menlo,monospace}',
      '.st-btns{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}',
      '.st-btn{padding:9px 12px;border-radius:10px;border:1.5px solid #FFD76A;background:linear-gradient(180deg,#FFE9A8,#C9962A);color:#3a2506;font-family:inherit;font-weight:800;font-size:12px;cursor:pointer}',
      '.st-btn.red{border-color:#f87171;background:linear-gradient(180deg,#fecaca,#dc2626);color:#fff}',
      '.st-btn.ghost{border-color:rgba(255,255,255,.3);background:rgba(0,0,0,.35);color:#e2e8f0}',
      '.st-info{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px}',
      '.st-kv{background:rgba(0,0,0,.3);border-radius:10px;padding:8px;text-align:center}',
      '.st-kv b{display:block;color:#FFD76A;font-size:12px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.st-kv span{font-size:10px;color:#94a3b8}',
      'body.no-bgvideo #bg-video{display:none!important}',
      'body.fx-low #bg-video,body.fx-low .light-rays{display:none!important}',
      'body.fx-low .star-border::before{animation:none!important}',
      'body.reduce-motion *,body.reduce-motion *::before,body.reduce-motion *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}'
    ].join('');
    var s = document.createElement('style');
    s.id = '_st_css';
    s.textContent = c;
    document.head.appendChild(s);
  },

  /* ═══════════════ بناء الواجهة ═══════════════ */
  sw: function (key) {
    var on = !!this.cfg[key];
    return '<button class="st-sw' + (on ? ' on' : '') + '" data-sw="' + key + '" aria-pressed="' + on + '"><span class="st-knob"></span></button>';
  },

  row: function (label, sub, control) {
    return '<div class="st-row"><div class="st-txt"><div class="st-lbl">' + label + '</div>' +
      (sub ? '<div class="st-sub">' + sub + '</div>' : '') +
      '</div><div class="st-ctl">' + control + '</div></div>';
  },

  sec: function (title, body) {
    return '<div class="st-sec"><div class="st-title">' + title + '</div><div class="st-card">' + body + '</div></div>';
  },

  kv: function (k, v) {
    return '<div class="st-kv"><span>' + k + '</span><b>' + this.esc(v) + '</b></div>';
  },

  build: function () {
    var body = document.getElementById('settingsBody');
    if (!body || !this.ctx) return;
    var c = this.cfg, st = this.ctx.state;
    var lvl = (typeof levelOf === 'function') ? levelOf(st.xp || 0) : '-';

    var h = '';

    h += this.sec('🔊 الصوت والإشعارات',
      this.row('تشغيل الصوت', 'مؤثرات الصيد والأزرار', this.sw('sound')) +
      this.row('مستوى المؤثرات', '', '<input type="range" class="st-range" min="0" max="100" step="5" value="' + c.sfxVolume + '" data-range="sfxVolume"><span class="st-val" id="st-vol">' + c.sfxVolume + '</span>') +
      this.row('الاهتزاز', 'يعمل على الأجهزة اللي تدعمه', this.sw('vibration')) +
      this.row('الرسائل المنبثقة', 'إشعارات الصيد والمكافآت أعلى الشاشة', this.sw('toasts'))
    );

    h += this.sec('⚡ الأداء والعرض',
      this.row('الفيديو الخلفي', 'يوقف خلفية الفيديو لتوفير البطارية', this.sw('bgVideo')) +
      this.row('وضع توفير الموارد', 'يخفي الأشعة والتأثيرات المتحركة', this.sw('lowFx')) +
      this.row('تقليل الحركة', 'يوقف الانتقالات والحركات الزائدة', this.sw('reduceMotion')) +
      this.row('عداد الإطارات FPS', 'يعرض سرعة الرسم أعلى الشاشة', this.sw('showFps'))
    );

    h += this.sec('👤 الحساب',
      '<div style="font-size:11px;color:#94a3b8;margin-top:6px">اسم القبطان (1 - 14 حرف)</div>' +
      '<input id="st-name" class="st-input" maxlength="14" value="' + this.esc(st.name || '') + '" placeholder="اسم القبطان">' +
      '<div class="st-btns"><button class="st-btn" data-act="name">💾 حفظ الاسم</button></div>'
    );

    h += this.sec('💾 النسخ الاحتياطي',
      '<div style="font-size:11px;color:#94a3b8;margin-top:6px;line-height:1.6">صدّر حفظك واحتفظ به، أو استورده على جهاز آخر.</div>' +
      '<div class="st-btns"><button class="st-btn" data-act="export">📤 تصدير الحفظ</button></div>' +
      '<textarea id="st-export" class="st-area" readonly placeholder="اضغط تصدير، والنص ينسخ تلقائياً"></textarea>' +
      '<textarea id="st-import" class="st-area" placeholder="الصق نص الحفظ هنا"></textarea>' +
      '<div class="st-btns"><button class="st-btn" data-act="import">📥 استيراد الحفظ</button></div>'
    );

    h += this.sec('📋 معلومات',
      '<div class="st-info">' +
        this.kv('الإصدار', this.VERSION) +
        this.kv('القبطان', st.name || '-') +
        this.kv('المستوى', lvl) +
        this.kv('حجم الحفظ', this.usageKB() + ' KB') +
        this.kv('الشاشة', window.innerWidth + '×' + window.innerHeight) +
        this.kv('المنصة', navigator.platform || '-') +
      '</div>'
    );

    h += this.sec('⚠️ منطقة الخطر',
      '<div style="font-size:11px;color:#94a3b8;margin-top:6px;line-height:1.6">حذف التقدم يمسح الذهب والسفن والإنجازات. الإعدادات تبقى.</div>' +
      '<div class="st-btns"><button class="st-btn red" data-act="reset">🗑️ حذف التقدم</button>' +
      '<button class="st-btn ghost" data-act="resetcfg">↺ إرجاع الإعدادات</button></div>'
    );

    body.innerHTML = h;
    this.bind();
  },

  /* ═══════════════ الأحداث (مرة واحدة على العنصر الثابت) ═══════════════ */
  bind: function () {
    var self = this;
    var body = document.getElementById('settingsBody');
    if (!body || body === this._boundEl) return;
    this._boundEl = body;

    body.addEventListener('click', function (e) {
      var sw = e.target.closest ? e.target.closest('[data-sw]') : null;
      if (sw) {
        var k = sw.getAttribute('data-sw');
        self.set(k, !self.cfg[k]);
        return;
      }
      var a = e.target.closest ? e.target.closest('[data-act]') : null;
      if (a) self.action(a.getAttribute('data-act'));
    });

    body.addEventListener('input', function (e) {
      var key = e.target.getAttribute && e.target.getAttribute('data-range');
      if (!key) return;
      var v = parseInt(e.target.value, 10) || 0;
      var lbl = document.getElementById('st-vol');
      if (lbl) lbl.textContent = v;
      self.set(key, v, true);
    });
  },

  /* ═══════════════ الإجراءات ═══════════════ */
  action: function (act) {
    var st = this.ctx.state;

    if (act === 'name') {
      var inp = document.getElementById('st-name');
      var v = this.cleanName(inp ? inp.value : '');
      if (!v) { this.toast('⚠️ الاسم لازم يكون بين 1 و 14 حرف'); return; }
      st.name = v;
      this.ctx.save();
      if (typeof render === 'function') render();
      this.toast('✅ تم حفظ الاسم');
      this.build();
      return;
    }

    if (act === 'export') {
      if (typeof saveState === 'function') saveState();
      var raw = this.readSave();
      var out = document.getElementById('st-export');
      if (out) out.value = raw;
      this.copy(raw);
      this.toast('📤 تم تجهيز الحفظ');
      return;
    }

    if (act === 'import') {
      var ta = document.getElementById('st-import');
      var txt = ta ? ta.value.trim() : '';
      var obj = null;
      try { obj = JSON.parse(txt); } catch (e) { obj = null; }
      if (!obj || typeof obj !== 'object' || (typeof obj.coins !== 'number' && typeof obj.xp !== 'number')) {
        this.toast('❌ النص غير صالح');
        return;
      }
      if (!confirm('استيراد هذا الحفظ يستبدل تقدمك الحالي. متأكد؟')) return;
      try { localStorage.setItem(SAVE_KEY, txt); } catch (e) { this.toast('❌ تعذّر الحفظ'); return; }
      location.reload();
      return;
    }

    if (act === 'reset') {
      var word = prompt('اكتب كلمة "حذف" للتأكيد. هذا يمسح الذهب والسفن والإنجازات نهائياً:');
      if (word !== 'حذف') { this.toast('تم الإلغاء'); return; }
      try {
        localStorage.removeItem(SAVE_KEY);
        localStorage.removeItem(LAYOUT_KEY);
      } catch (e) {}
      location.reload();
      return;
    }

    if (act === 'resetcfg') {
      if (!confirm('إرجاع كل الإعدادات للوضع الافتراضي؟')) return;
      this.cfg = this.defaults();
      this.persist();
      this.apply();
      this.build();
      this.toast('↺ رجعت الإعدادات');
    }
  }
});
