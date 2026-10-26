// modules/dashboard.js — لوحة المعلومات داخل الإعدادات (v2.2.2)
// - تظهر كبطاقة داخل شاشة الإعدادات (مع زر فتح)
// - الشاشة الكاملة تحتوي زر "خروج" يرجع للإعدادات بأمان
// - وقت موثوق: إزاحة مخزنة تُقرأ فوراً عند الإقلاع، ثم تُحدَّث من الخادم
// - موقع موقّع (توقيع أمان) لمنع التلاعب في localStorage
// - تحديث نصي فقط (بدون إعادة رسم HTML كل ثانية)
ModuleRegistry.register({
  id: 'dashboard',
  name: 'لوحة المعلومات',
  version: '2.2.2',
  dependencies: [],

  LOC_KEY: 'pirate_dash_loc_v3',
  TIME_KEY: 'pirate_dash_time_v3',
  CACHE_MS: 172800000, // يومان
  METHOD: 4,
  TIMEOUT_MS: 7000,
  TIME_APIS: [
    'https://worldtimeapi.org/api/timezone/Etc/UTC',
    'https://timeapi.io/api/Time/current/zone?timeZone=UTC'
  ],
  SECRET: 'pirate-dash-2026-x9',

  DAYS: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  MONTHS: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  PRAYERS: [
    { name: 'الفجر', key: 'Fajr' },
    { name: 'الشروق', key: 'Sunrise' },
    { name: 'الظهر', key: 'Dhuhr' },
    { name: 'العصر', key: 'Asr' },
    { name: 'المغرب', key: 'Maghrib' },
    { name: 'العشاء', key: 'Isha' }
  ],
  WEATHER: {
    0: { icon: '☀️', desc: 'مشمس / صافٍ' },
    1: { icon: '🌤️', desc: 'غالباً صافٍ' },
    2: { icon: '⛅', desc: 'غائم جزئياً' },
    3: { icon: '☁️', desc: 'ملبد بالغيوم' },
    45: { icon: '🌫️', desc: 'ضباب' },
    51: { icon: '🌦️', desc: 'رذاذ خفيف' },
    61: { icon: '🌧️', desc: 'أمطار خفيفة' },
    63: { icon: '🌧️', desc: 'أمطار متوسطة' },
    65: { icon: '🌧️', desc: 'أمطار غزيرة' },
    80: { icon: '🌦️', desc: 'زخات مطرية' },
    95: { icon: '⛈️', desc: 'عواصف رعدية' }
  },

  ctx: null,
  _root: null,
  _tickIv: null,
  _loc: null,
  _timings: null,
  _nextIdx: -1,
  _hijriLoaded: false,
  _serverOffset: 0,
  _timeVerified: false,
  _observer: null,

  /* ═══════════ INIT ═══════════ */
  init: function (ctx) {
    this.ctx = ctx;
    this.injectCSS();
    this.build();
    this.addSettingsEntry();
    // أولاً: الإزاحة المخزنة (متزامنة) حتى لا يتغير مصدر الوقت أثناء الإقلاع
    this.loadCachedOffset();
    // ثانياً: تحديث الإزاحة من الخادم في الخلفية
    this.syncServerTime();
  },

  /* ═══════════ بطاقة داخل الإعدادات ═══════════ */
  addSettingsEntry: function () {
    var self = this;
    var host = document.getElementById('settingsBody');
    if (!host) return;

    var build = function () {
      if (document.getElementById('daSettingsCard')) return;
      var card = document.createElement('div');
      card.id = 'daSettingsCard';
      card.className = 'card';
      card.style.cssText = 'flex-direction:column;align-items:stretch;gap:10px;';
      card.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<span style="font-weight:700">⏰ لوحة المعلومات</span>' +
          '<button id="daOpenBtn" class="btn gold" style="min-width:80px">فتح</button>' +
        '</div>' +
        '<div class="muted" style="font-size:11px">الوقت والتاريخ والطقس ومواقيت الصلاة</div>';
      host.insertBefore(card, host.firstChild);
      var btn = document.getElementById('daOpenBtn');
      if (btn) {
        btn.addEventListener('click', function () { self.open(); });
      }
    };

    build();
    if (typeof MutationObserver !== 'undefined' && !this._observer) {
      this._observer = new MutationObserver(function () {
        if (!document.getElementById('daSettingsCard')) build();
      });
      this._observer.observe(host, { childList: true, subtree: true });
    }
  },

  /* ═══════════ الوقت الموثوق ═══════════ */
  // قراءة متزامنة للإزاحة المخزنة (صالحة لمدة يومين)
  loadCachedOffset: function () {
    try {
      var s = JSON.parse(localStorage.getItem(this.TIME_KEY) || 'null');
      if (s && typeof s.off === 'number' && Date.now() - s.at < this.CACHE_MS) {
        this._serverOffset = s.off;
        this._timeVerified = true;
      }
    } catch (e) {}
  },

  syncServerTime: function () {
    var self = this;
    this.fetchJsonWithFallback(this.TIME_APIS).then(function (res) {
      self._serverOffset = res.offset;
      self._timeVerified = true;
      try {
        localStorage.setItem(self.TIME_KEY, JSON.stringify({ off: self._serverOffset, at: Date.now() }));
      } catch (e) {}
    }).catch(function () {
      // فشل الخادم: نعتمد الإزاحة المخزنة إن كانت ما زالت صالحة (تمت قراءتها في loadCachedOffset)
    });
  },

  fetchJsonWithFallback: function (urls) {
    var self = this;
    return new Promise(function (resolve, reject) {
      var index = 0;
      function tryNext() {
        if (index >= urls.length) { reject(new Error('all time servers failed')); return; }
        var url = urls[index++];
        var t0 = Date.now();
        self.fetchJson(url).then(function (d) {
          var serverMs;
          if (d.utc_datetime) {
            serverMs = new Date(d.utc_datetime).getTime();
          } else if (d.dateTime) {
            // إضافة Z لضمان تفسير الوقت كـ UTC وليس محلي
            var dtStr = d.dateTime.endsWith('Z') ? d.dateTime : (d.dateTime + 'Z');
            serverMs = new Date(dtStr).getTime();
          } else {
            throw new Error('invalid format');
          }
          var rtt = Date.now() - t0;
          resolve({ offset: (serverMs + rtt / 2) - Date.now() });
        }).catch(tryNext);
      }
      tryNext();
    });
  },

  now: function () { return new Date(Date.now() + this._serverOffset); },
  verified: function () { return this._timeVerified; },

  /* ═══════════ CSS ═══════════ */
  injectCSS: function () {
    if (document.getElementById('_dash_css')) return;
    var c = [
      '.da-wrap{position:fixed;inset:0;z-index:226;display:none;flex-direction:column;direction:rtl;color:#fff;font-family:inherit;background:radial-gradient(ellipse at 50% 0%,#141e30 0%,#0b0f19 70%,#000 100%)}',
      '.da-wrap.open{display:flex}',
      '.da-top{display:flex;align-items:center;gap:8px;padding:12px 14px;flex-shrink:0;border-bottom:1px solid rgba(252,191,73,.25);background:rgba(10,15,25,.85)}',
      '.da-back{min-width:38px;height:38px;padding:0 12px;border-radius:12px;border:1.5px solid rgba(252,191,73,.6);background:rgba(20,15,35,.7);color:#fcd34d;font-family:inherit;font-size:14px;font-weight:800;cursor:pointer}',
      '.da-title{flex:1;text-align:center;font-weight:900;font-size:17px;color:#fcd34d}',
      '.da-body{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px 12px 120px;display:flex;flex-direction:column;gap:12px}',
      '.da-card{padding:16px;border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)}',
      '.da-ct{font-size:12px;color:#94a3b8;font-weight:800;letter-spacing:1px;margin-bottom:10px}',
      '.da-clockrow{display:flex;justify-content:space-around;align-items:center;direction:ltr}',
      '.da-clk{font-size:34px;font-weight:200;color:#00d4ff;font-family:"SF Mono",monospace}',
      '.da-ap{font-size:13px;font-weight:600;color:#30d158;margin-left:4px}',
      '.da-c24{text-align:center;font-size:30px;font-weight:700;color:#00d4ff;letter-spacing:2px;font-family:"SF Mono",monospace;direction:ltr}',
      '.da-day{text-align:center;font-size:30px;font-weight:800;color:#ffd60a;margin-bottom:10px}',
      '.da-dr{display:flex;flex-direction:column;gap:4px;padding-top:8px;border-top:1px solid rgba(255,255,255,.06);margin-top:8px}',
      '.da-dl{font-size:11px;color:#94a3b8;font-weight:600}',
      '.da-dline{display:flex;justify-content:space-between;align-items:center;gap:8px}',
      '.da-dw{font-size:16px;font-weight:700}',
      '.da-dn{font-size:13px;font-family:"SF Mono",monospace;direction:ltr;opacity:.8}',
      '.da-loc{text-align:center;font-size:15px;font-weight:700;color:#00d4ff;margin-bottom:10px}',
      '.da-locrow{display:flex;gap:6px}',
      '.da-input{flex:1;min-width:0;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:10px 12px;color:#fff;font-family:inherit;font-size:14px;outline:none}',
      '.da-btn{border:none;border-radius:12px;padding:10px 12px;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;background:#00d4ff;color:#000}',
      '.da-btn.gps{background:#30d158}',
      '.da-wmain{display:flex;justify-content:space-between;align-items:center}',
      '.da-temp{font-size:50px;font-weight:300}',
      '.da-wicon{font-size:56px}',
      '.da-wdesc{font-size:17px;color:#94a3b8;margin-top:2px}',
      '.da-wgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}',
      '.da-wi{background:rgba(0,0,0,.25);padding:10px 4px;border-radius:12px;text-align:center}',
      '.da-wi span{display:block;font-size:10px;color:#94a3b8}',
      '.da-wi b{display:block;font-size:14px;margin-top:2px}',
      '.da-next{text-align:center;padding:14px;border-radius:16px;margin-bottom:12px;background:linear-gradient(180deg,rgba(255,214,10,.12),rgba(255,214,10,.03));border:1px solid rgba(255,214,10,.25)}',
      '.da-nl{font-size:12px;color:#ffd60a;font-weight:600}',
      '.da-nn{font-size:24px;font-weight:800;color:#ffd60a;margin:2px 0}',
      '.da-nt{font-size:14px;color:#94a3b8}',
      '.da-ncd{font-size:15px;color:#00d4ff;font-weight:700;margin-top:6px}',
      '.da-pr{display:flex;justify-content:space-between;align-items:center;padding:11px 13px;border-radius:14px;background:rgba(0,0,0,.2);border:1px solid transparent;margin-bottom:8px}',
      '.da-pr.past{opacity:.45}',
      '.da-pr.next{background:rgba(255,214,10,.1);border-color:rgba(255,214,10,.25)}',
      '.da-pn{font-size:15px;font-weight:700}',
      '.da-ps{font-size:11px;color:#94a3b8}',
      '.da-ps.ok{color:#30d158}',
      '.da-ps.nx{color:#ffd60a}',
      '.da-pt{text-align:left;direction:ltr}',
      '.da-pt b{display:block;font-size:17px;font-family:"SF Mono",monospace}',
      '.da-pt span{font-size:11px;color:#94a3b8}',
      '.da-msg{text-align:center;font-size:13px;color:#94a3b8;padding:14px}',
      '.da-err{text-align:center;font-size:13px;color:#ff453a;padding:10px}'
    ].join('');
    var s = document.createElement('style');
    s.id = '_dash_css';
    s.textContent = c;
    document.head.appendChild(s);
  },

  /* ═══════════ البناء (مرة واحدة) ═══════════ */
  build: function () {
    var self = this;
    var old = document.getElementById('dash-root');
    if (old) old.remove();

    var root = document.createElement('div');
    root.id = 'dash-root';
    root.className = 'da-wrap';
    root.innerHTML =
      '<div class="da-top">' +
        '<button class="da-back" data-da="close">خروج</button>' +
        '<div class="da-title">⏰ لوحة المعلومات</div>' +
        '<div style="width:38px"></div>' +
      '</div>' +
      '<div class="da-body">' +
        '<div class="da-card">' +
          '<div class="da-clockrow">' +
            '<div><span class="da-clk" id="daAr">--:--</span><span class="da-ap" id="daArAp">--</span></div>' +
            '<div><span class="da-clk" id="daEn">--:--</span><span class="da-ap" id="daEnAp">--</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="da-card">' +
          '<div class="da-ct">التوقيت العسكري (24H)</div>' +
          '<div class="da-c24" id="da24">--:--:--</div>' +
        '</div>' +
        '<div class="da-card">' +
          '<div class="da-day" id="daDay">---</div>' +
          '<div class="da-dr"><div class="da-dl">التاريخ الهجري</div>' +
            '<div class="da-dline"><span class="da-dw" id="daHj">جاري التحميل...</span><span class="da-dn" id="daHjN">--/--/----</span></div></div>' +
          '<div class="da-dr"><div class="da-dl">التاريخ الميلادي</div>' +
            '<div class="da-dline"><span class="da-dw" id="daMl">---</span><span class="da-dn" id="daMlN">--/--/----</span></div></div>' +
        '</div>' +
        '<div class="da-card">' +
          '<div class="da-ct">📍 الموقع</div>' +
          '<div class="da-loc" id="daLoc">لم يتم تحديد الموقع</div>' +
          '<div class="da-locrow">' +
            '<input class="da-input" id="daCity" type="text" placeholder="اسم المدينة">' +
            '<button class="da-btn" data-da="apply">تطبيق</button>' +
            '<button class="da-btn gps" data-da="gps">📡 GPS</button>' +
          '</div>' +
        '</div>' +
        '<div class="da-card">' +
          '<div class="da-ct">🌤️ الطقس</div>' +
          '<div id="daWx"><div class="da-msg">حدد الموقع لعرض الطقس</div></div>' +
        '</div>' +
        '<div class="da-card">' +
          '<div class="da-ct">🕌 أوقات الصلاة</div>' +
          '<div id="daNext"></div>' +
          '<div id="daPr"><div class="da-msg">حدد الموقع لعرض المواقيت</div></div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(root);
    this._root = root;

    root.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-da]') : null;
      if (!t) return;
      var act = t.getAttribute('data-da');
      if (act === 'close') self.close();
      else if (act === 'apply') self.applyCity();
      else if (act === 'gps') self.useGps();
    });

    var cityInput = document.getElementById('daCity');
    if (cityInput) {
      cityInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') self.applyCity();
      });
    }
  },

  /* ═══════════ فتح / إغلاق ═══════════ */
  open: function () {
    if (!this._root) return;
    this._root.classList.add('open');
    this.updateClock();
    this.updateCalendar();
    if (!this._tickIv) this._tickIv = setInterval(this.tick.bind(this), 1000);
    if (!this._loc) this.loadSavedLocation();
    if (!this._timeVerified) this.syncServerTime();
  },

  close: function () {
    if (this._root) this._root.classList.remove('open');
    if (this._tickIv) { clearInterval(this._tickIv); this._tickIv = null; }
    var sec = document.getElementById('screen-settings');
    if (sec && !sec.classList.contains('open') && typeof openScreen === 'function') {
      openScreen('settings');
    }
  },

  tick: function () {
    this.updateClock();
    if (this._timings) this.updatePrayerCountdown();
  },

  /* ═══════════ تحديث نصي فقط ═══════════ */
  pad: function (n) { return n < 10 ? '0' + n : '' + n; },

  setText: function (id, v) {
    var el = document.getElementById(id);
    if (el && el.textContent !== v) el.textContent = v;
  },

  updateClock: function () {
    var d = this.now();
    var h = d.getHours();
    var h12 = this.pad(h % 12 || 12) + ':' + this.pad(d.getMinutes());
    this.setText('daAr', h12);
    this.setText('daArAp', h >= 12 ? 'مساءً' : 'صباحاً');
    this.setText('daEn', h12);
    this.setText('daEnAp', h >= 12 ? 'PM' : 'AM');
    this.setText('da24', this.pad(h) + ':' + this.pad(d.getMinutes()) + ':' + this.pad(d.getSeconds()));
  },

  updateCalendar: function () {
    var d = this.now();
    var dd = d.getDate(), m = d.getMonth(), y = d.getFullYear();
    this.setText('daDay', this.DAYS[d.getDay()]);
    this.setText('daMl', dd + ' ' + this.MONTHS[m] + ' ' + y + ' م');
    this.setText('daMlN', this.pad(dd) + '/' + this.pad(m + 1) + '/' + y);
    if (!this._hijriLoaded) this.loadHijri();
  },

  /* ═══════════ الهجري ═══════════ */
  loadHijri: function () {
    var self = this;
    var d = this.now();
    var url = 'https://api.aladhan.com/v1/gToH?date=' +
      this.pad(d.getDate()) + '-' + this.pad(d.getMonth() + 1) + '-' + d.getFullYear();
    this.fetchJson(url).then(function (r) {
      if (!r || !r.data || !r.data.hijri) return;
      var hj = r.data.hijri;
      self._hijriLoaded = true;
      self.setText('daHj', hj.day + ' ' + hj.month.ar + ' ' + hj.year + ' هـ');
      self.setText('daHjN', self.pad(+hj.day) + '/' + self.pad(+hj.month.number) + '/' + hj.year);
    }).catch(function () { self.setText('daHj', 'تعذّر جلب الهجري'); });
  },

  /* ═══════════ الموقع الموقّع ═══════════ */
  sign: function (str) {
    var h = 2166136261;
    var s = str + '|' + this.SECRET;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h.toString(16);
  },

  saveLoc: function (lat, lon, name) {
    this._loc = { lat: lat, lon: lon, name: name };
    var payload = JSON.stringify(this._loc);
    try {
      localStorage.setItem(this.LOC_KEY, JSON.stringify({ d: payload, s: this.sign(payload) }));
    } catch (e) {}
    this.setText('daLoc', '📍 ' + name);
    this.loadWeather();
    this.loadPrayers();
  },

  readLoc: function () {
    try {
      var box = JSON.parse(localStorage.getItem(this.LOC_KEY) || 'null');
      if (!box || box.s !== this.sign(box.d)) return null;
      var d = JSON.parse(box.d);
      if (typeof d.lat !== 'number' || typeof d.lon !== 'number') return null;
      return d;
    } catch (e) { return null; }
  },

  loadSavedLocation: function () {
    var d = this.readLoc();
    if (d) this.saveLoc(d.lat, d.lon, d.name || 'موقعي');
    else this.useGps();
  },

  applyCity: function () {
    var self = this;
    var cityInput = document.getElementById('daCity');
    var q = (cityInput ? cityInput.value : '').trim();
    if (!q) return;
    this.setText('daLoc', 'جاري البحث...');
    var url = 'https://geocoding-api.open-meteo.com/v1/search?name=' +
      encodeURIComponent(q) + '&count=1&language=ar&format=json';
    this.fetchJson(url).then(function (r) {
      if (!r.results || !r.results.length) { self.setText('daLoc', 'المدينة غير موجودة'); return; }
      var x = r.results[0];
      self.saveLoc(x.latitude, x.longitude, x.name + (x.admin1 ? '، ' + x.admin1 : ''));
    }).catch(function () { self.setText('daLoc', 'خطأ في البحث'); });
  },

  useGps: function () {
    var self = this;
    if (!navigator.geolocation) { this.setText('daLoc', 'GPS غير مدعوم'); return; }
    this.setText('daLoc', 'جاري تحديد الموقع...');
    navigator.geolocation.getCurrentPosition(
      function (p) { self.saveLoc(p.coords.latitude, p.coords.longitude, 'موقعك الحالي'); },
      function () { self.setText('daLoc', 'تعذّر الوصول للـ GPS، ابحث يدوياً'); },
      { timeout: 10000, maximumAge: 300000 }
    );
  },

  /* ═══════════ الطقس ═══════════ */
  loadWeather: function () {
    var self = this;
    if (!this._loc) return;
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + this._loc.lat +
      '&longitude=' + this._loc.lon +
      '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m' +
      '&daily=temperature_2m_max,temperature_2m_min&timezone=auto';
    this.fetchJson(url).then(function (r) {
      var c = r.current, dy = r.daily;
      var w = self.WEATHER[c.weather_code] || { icon: '🌡️', desc: 'معتدل' };
      var wxEl = document.getElementById('daWx');
      if (wxEl) {
        wxEl.innerHTML =
          '<div class="da-wmain"><div>' +
            '<div class="da-temp">' + Math.round(c.temperature_2m) + '°C</div>' +
            '<div class="da-wdesc">' + w.desc + '</div></div>' +
            '<div class="da-wicon">' + w.icon + '</div></div>' +
          '<div class="da-wgrid">' +
            '<div class="da-wi"><span>الصغرى</span><b>' + Math.round(dy.temperature_2m_min[0]) + '°</b></div>' +
            '<div class="da-wi"><span>الكبرى</span><b>' + Math.round(dy.temperature_2m_max[0]) + '°</b></div>' +
            '<div class="da-wi"><span>الرطوبة</span><b>' + c.relative_humidity_2m + '%</b></div>' +
            '<div class="da-wi"><span>الرياح</span><b>' + Math.round(c.wind_speed_10m) + ' كم/س</b></div>' +
          '</div>';
      }
    }).catch(function () {
      var wxEl = document.getElementById('daWx');
      if (wxEl) wxEl.innerHTML = '<div class="da-err">تعذّر جلب الطقس</div>';
    });
  },

  /* ═══════════ مواقيت الصلاة ═══════════ */
  loadPrayers: function () {
    var self = this;
    if (!this._loc) return;
    var d = this.now();
    var url = 'https://api.aladhan.com/v1/timings/' +
      this.pad(d.getDate()) + '-' + this.pad(d.getMonth() + 1) + '-' + d.getFullYear() +
      '?latitude=' + this._loc.lat + '&longitude=' + this._loc.lon + '&method=' + this.METHOD;
    this.fetchJson(url).then(function (r) {
      if (!r || !r.data || !r.data.timings) return;
      self._timings = r.data.timings;
      self.renderPrayers();
    }).catch(function () {
      var prEl = document.getElementById('daPr');
      if (prEl) prEl.innerHTML = '<div class="da-err">تعذّر جلب المواقيت</div>';
    });
  },

  toSec: function (hhmm) {
    var p = hhmm.split(':');
    return parseInt(p[0], 10) * 3600 + parseInt(p[1], 10) * 60;
  },

  to12: function (hhmm) {
    var p = hhmm.split(':');
    var h = parseInt(p[0], 10);
    return { t: (h % 12 || 12) + ':' + p[1], ap: h >= 12 ? 'م' : 'ص' };
  },

  nowSec: function () {
    var d = this.now();
    return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  },

  nextIndex: function () {
    var cur = this.nowSec(), self = this, idx = -1, best = Infinity;
    this.PRAYERS.forEach(function (p, i) {
      var diff = self.toSec(self._timings[p.key]) - cur;
      if (diff > 0 && diff < best) { best = diff; idx = i; }
    });
    return idx === -1 ? 0 : idx;
  },

  renderPrayers: function () {
    if (!this._timings) return;
    var self = this;
    var idx = this.nextIndex();
    var cur = this.nowSec();

    var rows = this.PRAYERS.map(function (p, i) {
      var t24 = self._timings[p.key];
      var t = self.to12(t24);
      var cls = '', st = 'قادمة', stc = '';
      if (i === idx) { cls = 'next'; st = 'الصلاة القادمة'; stc = 'nx'; }
      else if (self.toSec(t24) < cur) { cls = 'past'; st = 'مضت'; stc = 'ok'; }
      return '<div class="da-pr ' + cls + '"><div><div class="da-pn">' + p.name +
        '</div><div class="da-ps ' + stc + '">' + st + '</div></div>' +
        '<div class="da-pt"><b>' + t.t + ' <span>' + t.ap + '</span></b><span>' + t24 + '</span></div></div>';
    }).join('');

    var prEl = document.getElementById('daPr');
    if (prEl) prEl.innerHTML = rows;

    this.renderNext(idx);
  },

  renderNext: function (idx) {
    var np = this.PRAYERS[idx];
    var t = this.to12(this._timings[np.key]);
    var nextEl = document.getElementById('daNext');
    if (nextEl) {
      nextEl.innerHTML =
        '<div class="da-next"><div class="da-nl">الصلاة القادمة</div>' +
        '<div class="da-nn">' + np.name + '</div>' +
        '<div class="da-nt">' + t.t + ' ' + t.ap + '</div>' +
        '<div class="da-ncd" id="daCd"></div></div>';
    }
    this._nextIdx = idx;
    this.updatePrayerCountdown();
  },

  updatePrayerCountdown: function () {
    if (!this._timings) return;
    var idx = this.nextIndex();
    if (idx !== this._nextIdx) { this.renderPrayers(); return; }
    var diff = this.toSec(this._timings[this.PRAYERS[idx].key]) - this.nowSec();
    if (diff < 0) diff += 86400;
    var h = Math.floor(diff / 3600), m = Math.floor((diff % 3600) / 60), s = diff % 60;
    var txt = (h ? h + ' ساعة و ' : '') + (m ? m + ' دقيقة و ' : '') + s + ' ثانية';
    this.setText('daCd', '⏳ متبقي ' + txt);
  },

  /* ═══════════ شبكة بمهلة ═══════════ */
  fetchJson: function (url) {
    var self = this;
    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimeout(function () {
        if (!done) { done = true; reject(new Error('timeout')); }
      }, self.TIMEOUT_MS);
      fetch(url).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (j) {
        if (done) return; done = true; clearTimeout(timer); resolve(j);
      }).catch(function (e) {
        if (done) return; done = true; clearTimeout(timer); reject(e);
      });
    });
  }
});
