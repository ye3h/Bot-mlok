/* modules/text_size.js — حجم العرض والعمق داخل الإعدادات (v2.0.0)
   - حجم العرض بأسلوب Safari (A- / A+) عبر zoom على body
   - العمق: شدة التعتيم على الأطراف + ضباب خفيف
   - كل شيء داخل بطاقة واحدة في شاشة الإعدادات
   - لا توجد أزرار عائمة، ولا تأثير على الحفظ الأساسي
*/
ModuleRegistry.register({
  id: 'text_size',
  name: 'حجم العرض',
  version: '2.0.0',
  dependencies: [],

  KEY: 'pirate_textsize_v2',
  DEPTH_KEY: 'pirate_depth_v2',
  STEPS: [80, 90, 100, 110, 125, 140],
  DEFAULT_INDEX: 2,
  DEFAULT_DEPTH: 50,
  index: 2,
  depth: 50,
  ctx: null,

  init: function (ctx) {
    this.ctx = ctx;
    this.index = this.readIndex();
    this.depth = this.readDepth();
    this.injectCSS();
    this.apply();
    this.addSettingsCard();
  },

  /* ═══════════ الحفظ ═══════════ */
  readIndex: function () {
    try {
      var v = parseInt(localStorage.getItem(this.KEY), 10);
      if (!isNaN(v) && v >= 0 && v < this.STEPS.length) return v;
    } catch (e) {}
    return this.DEFAULT_INDEX;
  },

  readDepth: function () {
    try {
      var v = parseInt(localStorage.getItem(this.DEPTH_KEY), 10);
      if (!isNaN(v) && v >= 0 && v <= 100) return v;
    } catch (e) {}
    return this.DEFAULT_DEPTH;
  },

  writeIndex: function () {
    try { localStorage.setItem(this.KEY, String(this.index)); } catch (e) {}
  },

  writeDepth: function () {
    try { localStorage.setItem(this.DEPTH_KEY, String(this.depth)); } catch (e) {}
  },

  /* ═══════════ التطبيق ═══════════ */
  apply: function () {
    var z = this.STEPS[this.index] / 100;
    var body = document.body;
    if (body) {
      if (z === 1) {
        body.style.zoom = '';
        body.style.height = '';
      } else {
        body.style.zoom = String(z);
        body.style.height = 'calc(var(--app-height, 100dvh) / ' + z + ')';
      }
    }

    var d = this.depth / 100;
    var root = document.documentElement;
    root.style.setProperty('--vs-vignette', (0.25 + d * 0.6).toFixed(2));
    root.style.setProperty('--vs-haze', (d * 0.25).toFixed(2));

    this.refreshCard();
    window.dispatchEvent(new Event('resize'));
  },

  changeSize: function (delta) {
    var next = this.index + delta;
    if (next < 0 || next >= this.STEPS.length) return;
    this.index = next;
    this.writeIndex();
    this.apply();
  },

  changeDepth: function (value) {
    this.depth = value;
    this.writeDepth();
    this.apply();
  },

  reset: function () {
    this.index = this.DEFAULT_INDEX;
    this.depth = this.DEFAULT_DEPTH;
    this.writeIndex();
    this.writeDepth();
    this.apply();
  },

  refreshCard: function () {
    var lbl = document.getElementById('tsLabel');
    if (lbl) lbl.textContent = this.STEPS[this.index] + '%';
    var minus = document.getElementById('tsMinus');
    var plus = document.getElementById('tsPlus');
    if (minus) minus.disabled = this.index === 0;
    if (plus) plus.disabled = this.index === this.STEPS.length - 1;
    var dv = document.getElementById('tsDepthVal');
    if (dv) dv.textContent = this.depth;
    var dr = document.getElementById('tsDepth');
    if (dr && parseInt(dr.value, 10) !== this.depth) dr.value = this.depth;
  },

  /* ═══════════ CSS ═══════════ */
  injectCSS: function () {
    if (document.getElementById('_ts_css')) return;
    var c = [
      '#scene::after{background:radial-gradient(ellipse at center,transparent 35%,rgba(0,10,20,var(--vs-vignette,0.55)) 100%) !important;}',
      '#scene::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:1;background:linear-gradient(180deg,rgba(180,210,235,var(--vs-haze,0)),transparent 60%);}',
      '.ts-row{display:flex;flex-direction:column;gap:8px;padding:10px 0}',
      '.ts-head{display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:13px}',
      '.ts-val{color:#FFD76A;font-weight:800;font-size:12px}',
      '.ts-aa{display:flex;align-items:center;justify-content:center;gap:10px;direction:ltr}',
      '.ts-aa button{width:64px;height:44px;border-radius:14px;border:1.5px solid rgba(255,215,106,.5);background:linear-gradient(180deg,rgba(38,58,92,.95),rgba(15,27,48,.97));color:#FFE9A8;font-family:inherit;font-weight:800;cursor:pointer;touch-action:manipulation}',
      '.ts-aa button:active{transform:scale(.95)}',
      '.ts-aa button:disabled{opacity:.35;cursor:default}',
      '#tsMinus{font-size:14px}',
      '#tsPlus{font-size:22px}',
      '#tsLabel{min-width:70px;text-align:center;font-size:14px;font-weight:800;color:#FFD76A;user-select:none}',
      '.ts-range{width:100%;accent-color:#FFD76A}'
    ].join('');
    var s = document.createElement('style');
    s.id = '_ts_css';
    s.textContent = c;
    document.head.appendChild(s);
  },

  /* ═══════════ البطاقة داخل الإعدادات ═══════════ */
  addSettingsCard: function () {
    var self = this;
    var host = document.getElementById('settingsBody');
    if (!host) return;

    var build = function () {
      if (document.getElementById('tsSettingsCard')) return;
      var card = document.createElement('div');
      card.id = 'tsSettingsCard';
      card.className = 'card';
      card.style.cssText = 'flex-direction:column;align-items:stretch;gap:4px;';
      card.innerHTML =
        '<div style="font-weight:800;color:#FFD76A;margin-bottom:4px">🔤 العرض والعمق</div>' +
        '<div class="ts-row">' +
          '<div class="ts-head"><span>حجم العرض</span></div>' +
          '<div class="ts-aa">' +
            '<button id="tsMinus" title="تصغير">A</button>' +
            '<span id="tsLabel">100%</span>' +
            '<button id="tsPlus" title="تكبير">A</button>' +
          '</div>' +
        '</div>' +
        '<div class="ts-row">' +
          '<div class="ts-head"><span>العمق</span><span class="ts-val" id="tsDepthVal">' + self.depth + '</span></div>' +
          '<input class="ts-range" id="tsDepth" type="range" min="0" max="100" step="5" value="' + self.depth + '">' +
        '</div>' +
        '<button class="btn alt" id="tsReset" style="margin-top:4px">↺ إرجاع الافتراضي</button>';
      host.insertBefore(card, host.firstChild);

      document.getElementById('tsMinus').addEventListener('click', function () { self.changeSize(-1); });
      document.getElementById('tsPlus').addEventListener('click', function () { self.changeSize(1); });
      document.getElementById('tsDepth').addEventListener('input', function (e) {
        self.changeDepth(parseInt(e.target.value, 10));
      });
      document.getElementById('tsReset').addEventListener('click', function () { self.reset(); });

      self.refreshCard();
    };

    build();
    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(function () {
        if (!document.getElementById('tsSettingsCard')) build();
      }).observe(host, { childList: true, subtree: true });
    }
  }
});
