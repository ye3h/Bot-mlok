/* modules/prayer_alert.js — تنبيه أوقات الصلاة (v1.0.0)
   - تنبيه فقط، بدون أي تأثير على اللعب
   - تنبيه واحد لكل صلاة في اليوم (يُحفظ في localStorage)
   - يعتمد على لوحة المعلومات (dashboard) لمواقيت الصلاة والوقت الموثوق
*/
ModuleRegistry.register({
  id: 'prayer_alert',
  name: 'تنبيه الصلاة',
  version: '1.0.0',
  dependencies: ['dashboard'],

  KEY: 'pirate_prayer_alert_v1',
  CHECK_MS: 30000,
  // الصلوات التي نُنبّه عليها (الشروق ليس صلاة للتنبيه)
  ALERT_PRAYERS: [
    { name: 'الفجر',  key: 'Fajr' },
    { name: 'الظهر',  key: 'Dhuhr' },
    { name: 'العصر',  key: 'Asr' },
    { name: 'المغرب', key: 'Maghrib' },
    { name: 'العشاء', key: 'Isha' }
  ],

  ctx: null,
  _iv: null,
  _sent: {},   // { 'YYYY-MM-DD': { Fajr: true, ... } }

  init: function (ctx) {
    this.ctx = ctx;
    this._sent = this.readSent();
    this.prune();
    var self = this;
    this._iv = setInterval(function () { self.check(); }, this.CHECK_MS);
    // فحص فوري بعد الإقلاع بقليل (بعد أن يتحقق الوقت)
    setTimeout(function () { self.check(); }, 5000);
  },

  /* ═══════════ الحفظ ═══════════ */
  readSent: function () {
    try {
      var s = JSON.parse(localStorage.getItem(this.KEY) || 'null');
      return (s && typeof s === 'object') ? s : {};
    } catch (e) { return {}; }
  },

  writeSent: function () {
    try { localStorage.setItem(this.KEY, JSON.stringify(this._sent)); } catch (e) {}
  },

  // نحذف أيام قديمة حتى لا يكبر الحفظ
  prune: function () {
    var keep = {};
    var today = this.dayKey();
    for (var k in this._sent) {
      if (this._sent.hasOwnProperty(k) && k >= today) keep[k] = this._sent[k];
    }
    this._sent = keep;
    this.writeSent();
  },

  dayKey: function (d) {
    d = d || this.now();
    var p = function (n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  },

  /* ═══════════ الوقت ═══════════ */
  dash: function () {
    return window.ModuleRegistry && ModuleRegistry.get('dashboard');
  },

  now: function () {
    var d = this.dash();
    return (d && d.verified && d.verified()) ? d.now() : new Date();
  },

  /* ═══════════ الفحص ═══════════ */
  check: function () {
    var d = this.dash();
    if (!d || !d.verified || !d.verified()) return;   // لا تنبيه إلا بوقت موثوق
    if (!d._timings) return;                           // ما عندنا مواقيت بعد

    var now = this.now();
    var dayKey = this.dayKey(now);
    var cur = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    var self = this;

    if (!this._sent[dayKey]) this._sent[dayKey] = {};

    this.ALERT_PRAYERS.forEach(function (p) {
      var t = d._timings[p.key];
      if (!t) return;
      var sec = d.toSec(t);
      // نُنبّه في أول دقيقتين بعد وقت الصلاة فقط (حتى لا ينبّه بعد ساعات لو فتح اللعبة متأخراً)
      var diff = cur - sec;
      if (diff >= 0 && diff < 120 && !self._sent[dayKey][p.key]) {
        self._sent[dayKey][p.key] = true;
        self.writeSent();
        self.notify(p.name);
      }
    });
  },

  /* ═══════════ الإشعار ═══════════ */
  notify: function (name) {
    var msg = '🕌 حان وقت صلاة ' + name;
    if (typeof showMessage === 'function') showMessage(msg);
    if (typeof log === 'function') log(msg);
    this.chime();
  },

  chime: function () {
    var on = true;
    try {
      var cfg = window.GameSettings && GameSettings.cfg;
      if (cfg && cfg.sound === false) on = false;
      else if (typeof soundOn !== 'undefined' && soundOn === false) on = false;
    } catch (e) {}
    if (!on) return;
    if (typeof beep === 'function') {
      beep(660, 0.15);
      setTimeout(function () { beep(880, 0.2); }, 220);
    }
  }
});
