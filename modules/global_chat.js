// modules/global_chat.js — الشات العام (v1.0.0)
ModuleRegistry.register({
  id: 'global_chat', name: 'الشات العام', version: '1.0.0', dependencies: [],
  BOTS: ['قرصان الليل', 'كابتن رعد', 'ملك المرجان', 'سيد الأعماق', 'أفعى البحر'],
  MSGS: ['مين يبي يشتري سمك؟ 🐟', 'أنا في الأرينا الآن 🔥', 'مبروك على التحديث الجديد!', 'الوحش قوي اليوم 💀', 'وش رايكم بالقبيلة الجديدة؟', 'الحمدلله صرت لفل 50 🎉', 'السوق نار اليوم 🔥'],
  ctx: null, _root: null, _timer: null,

  init: function (ctx) {
    this.ctx = ctx;
    this.injectCSS();
    this.build();
    this._timer = setInterval(function() { if (Math.random() < 0.4) this.tickBots(); }.bind(this), 12000);
  },

  injectCSS: function () {
    if (document.getElementById('_gc_css')) return;
    var s = document.createElement('style'); s.id = '_gc_css';
    s.textContent = '.gc-wrap{position:fixed;inset:0;z-index:999;background:#07182e;display:none;flex-direction:column;color:#fff;font-family:inherit;direction:rtl}.gc-wrap.open{display:flex}.gc-top{padding:14px;background:rgba(0,30,47,.85);border-bottom:1px solid rgba(255,255,255,.1);display:flex;justify-content:space-between;align-items:center}.gc-title{font-size:18px;font-weight:900;color:#fbbf24}.gc-close{background:none;border:none;color:#fff;font-size:20px}.gc-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}.gc-msg{display:flex;flex-direction:column;gap:4px;background:rgba(0,0,0,.3);padding:10px;border-radius:12px;border-left:3px solid #fbbf24}.gc-name{font-size:12px;color:#fbbf24;font-weight:bold}.gc-text{font-size:14px}.gc-input{display:flex;padding:12px;background:rgba(0,30,47,.85);border-top:1px solid rgba(255,255,255,.1);gap:8px}.gc-input input{flex:1;padding:10px;border-radius:20px;border:none;background:#001326;color:#fff}.gc-send{padding:10px 20px;border-radius:20px;background:linear-gradient(to bottom,#fbbf24,#b45309);border:2px solid #fde68a;color:#451a03;font-weight:bold}';
    document.head.appendChild(s);
  },

  build: function () {
    var self = this;
    var root = document.getElementById('screen-global_chat');
    if (!root) return;
    root.innerHTML = '<div class="gc-wrap open" style="position:absolute"><div class="gc-top"><div class="gc-title">💬 الشات العام</div><button class="gc-close" id="gc-close">✕</button></div><div class="gc-body" id="gc-body"></div><div class="gc-input"><input id="gc-inp" placeholder="اكتب رسالة للعامة..."><button class="gc-send" id="gc-send">إرسال</button></div></div>';
    this._root = root;
    
    document.getElementById('gc-close').onclick = function() { if(typeof closeScreen==='function') closeScreen(); };
    document.getElementById('gc-send').onclick = function() { self.sendMsg(); };
    document.getElementById('gc-inp').onkeydown = function(e) { if (e.key === 'Enter') self.sendMsg(); };
  },

  open: function() { this._root.classList.add('open'); this.scroll(); },
  sendMsg: function() {
    var inp = document.getElementById('gc-inp');
    if (!inp.value.trim()) return;
    this.addMsg('أنت', inp.value);
    inp.value = '';
  },
  addMsg: function(name, text) {
    var body = document.getElementById('gc-body');
    var div = document.createElement('div'); div.className = 'gc-msg';
    div.innerHTML = '<div class="gc-name">' + name + '</div><div class="gc-text">' + text + '</div>';
    body.appendChild(div); this.scroll();
  },
  scroll: function() { var b = document.getElementById('gc-body'); b.scrollTop = b.scrollHeight; },
  tickBots: function() {
    var bot = this.BOTS[Math.floor(Math.random() * this.BOTS.length)];
    var msg = this.MSGS[Math.floor(Math.random() * this.MSGS.length)];
    this.addMsg(bot, msg);
  }
});