/* js/30_username.js — التحقق من اسم المستخدم والبايو (v1.0.0)
   - مستقل تماماً: ما يلمس state ولا localStorage
   - الـ @ اختيارية، ولا تُحسب ضمن الطول (4 إلى 16)
   - فحص التكرار جاهز: يستدعي window.USERNAME_API عند توفره (السيرفر لاحقاً)
*/
(function () {
  'use strict';

  var MIN_LEN = 4;
  var MAX_LEN = 16;
  var BIO_MAX = 150;

  // أحرف إنجليزية وأرقام و - _ . فقط
  var ALLOWED = /^[A-Za-z0-9._-]+$/;

  // روابط ونطاقات شائعة ممنوعة في البايو
  var LINK_PATTERNS = [
    /https?:\/\//i,
    /www\./i,
    /\b[a-z0-9-]+\.(com|net|org|io|me|app|dev|co|info|xyz|ly|gg|tv|sa|ae|ps|eg|tk|ml|ga|cf|gq|to|us|uk|de|fr|ru|cn|jp|in|br|ly)\b/i,
    /\b[a-z0-9-]+\.(com|net|org|io|me|app|dev|co|info|xyz)\//i,
    /t\.me\//i,
    /wa\.me\//i,
    /bit\.ly/i
  ];

  /* ═══════════ اسم المستخدم ═══════════ */

  // يحذف الـ @ من البداية ويقص المسافات
  function stripAt(raw) {
    var s = String(raw == null ? '' : raw).trim();
    if (s.charAt(0) === '@') s = s.slice(1);
    return s;
  }

  // يتحقق من الاسم ويرجع { ok, value, error }
  function validateUsername(raw) {
    var s = stripAt(raw);
    if (s.length < MIN_LEN) return { ok: false, value: s, error: 'الاسم لازم يكون ' + MIN_LEN + ' أحرف على الأقل' };
    if (s.length > MAX_LEN) return { ok: false, value: s, error: 'الاسم ما يتجاوز ' + MAX_LEN + ' حرف' };
    if (!ALLOWED.test(s)) return { ok: false, value: s, error: 'مسموح فقط: أحرف إنجليزية، أرقام، - _ .' };
    if (/\.\./.test(s)) return { ok: false, value: s, error: 'ما يصير نقطتين متتاليتين' };
    if (/^[._-]|[._-]$/.test(s)) return { ok: false, value: s, error: 'ما يبدأ أو ينتهي برمز' };
    return { ok: true, value: s, error: '' };
  }

  // يضيف @ عند العرض فقط
  function formatUsername(name) {
    var s = stripAt(name);
    return s ? '@' + s : '';
  }

  // فحص التكرار: محلياً يرجع true، ولما يتوفر السيرفر يستدعي window.USERNAME_API
  // شكل المتوقع من السيرفر: { check(name) -> Promise<boolean> }
  function checkUsernameAvailable(name) {
    var api = window.USERNAME_API;
    var clean = stripAt(name).toLowerCase();
    if (!api || typeof api.check !== 'function') {
      return Promise.resolve({ available: true, source: 'local' });
    }
    return Promise.resolve()
      .then(function () { return api.check(clean); })
      .then(function (free) { return { available: !!free, source: 'server' }; })
      .catch(function () { return { available: false, source: 'error', error: 'تعذّر التحقق، حاول مرة ثانية' }; });
  }

  /* ═══════════ البايو ═══════════ */

  // يرجع { ok, value, error } ويرفض الروابط ويتجاوز الحد
  function validateBio(raw) {
    var s = String(raw == null ? '' : raw).replace(/\s+$/, '');
    s = s.replace(/^\s+/, '');
    if (s.length > BIO_MAX) return { ok: false, value: s, error: 'البايو ما يتجاوز ' + BIO_MAX + ' حرف' };
    for (var i = 0; i < LINK_PATTERNS.length; i++) {
      if (LINK_PATTERNS[i].test(s)) {
        return { ok: false, value: s, error: 'الروابط ممنوعة في البايو، احذفها عشان تقدر تحفظ' };
      }
    }
    return { ok: true, value: s, error: '' };
  }

  // عداد الحروف للعرض: "42/150"
  function bioCounter(raw) {
    var n = String(raw == null ? '' : raw).length;
    return n + '/' + BIO_MAX;
  }

  window.UsernameUtil = {
    MIN_LEN: MIN_LEN,
    MAX_LEN: MAX_LEN,
    BIO_MAX: BIO_MAX,
    validateUsername: validateUsername,
    formatUsername: formatUsername,
    checkUsernameAvailable: checkUsernameAvailable,
    validateBio: validateBio,
    bioCounter: bioCounter
  };
})();
