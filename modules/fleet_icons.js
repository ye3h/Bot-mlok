// modules/fleet_icons.js - أيقونات الأسطول أعلى الشاشة (ES5)
ModuleRegistry.register({
  id: 'fleet_icons',
  name: 'أيقونات الأسطول',
  version: '1.0.1',
  dependencies: ['fleet'],

  // المسافة من أعلى الشاشة (بالكامل) ومن اليمين
  TOP: 62,
  RIGHT: 12,
  SLOTS: [
    { type: 'fl_boat1', icon: '⛵', label: 'قارب صيد 1' },
    { type: 'fl_boat2', icon: '⛵', label: 'قارب صيد 2' },
    { type: 'fl_boat3', icon: '⛵', label: 'قارب صيد 3' }
  ],

  ctx: null,
  wrap: null,

  init: function (ctx) {
    var self = this;
    this.ctx = ctx;

    // CSS_TEXT انتقل إلى css/main.css (v6) — لا نكرر

    var wrap = document.createElement('div');
    wrap.id = 'fiRow';
    var h = '';
    for (var i = 0; i < this.SLOTS.length; i++) {
      h += '<div class="fi-slot" data-type="' + this.SLOTS[i].type + '" title="' + this.SLOTS[i].label + '">' +
           '<span class="fi-ico">' + this.SLOTS[i].icon + '</span>' +
           '<span class="fi-cnt"></span></div>';
    }
    wrap.innerHTML = h;
    document.getElementById('app').appendChild(wrap);
    this.wrap = wrap;

    this.update();
    setInterval(function () { self.update(); }, 500);
  },

  // عدد القوارب المملوكة من نوع معين (من module الأسطول أو من الحفظ)
  countOf: function (type) {
    var f = ModuleRegistry.get('fleet');
    if (f && f.counts) return f.counts[type] || 0;
    var st = this.ctx && this.ctx.state;
    if (st && st.fleet && st.fleet.counts) return st.fleet.counts[type] || 0;
    return 0;
  },

  update: function () {
    if (!this.wrap) return;
    var slots = this.wrap.querySelectorAll('.fi-slot');
    for (var i = 0; i < slots.length; i++) {
      var type = slots[i].getAttribute('data-type');
      var n = this.countOf(type);
      slots[i].className = 'fi-slot' + (n > 0 ? ' on' : '');
      slots[i].querySelector('.fi-cnt').textContent = n > 1 ? '×' + n : '';
    }
  },

  // CSS_TEXT حُذفت — موجودة في css/main.css
});
