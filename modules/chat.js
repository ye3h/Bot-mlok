// modules/chat.js — الشات (v2.1.0)
// v2.1.0: حذف الإيموجي (يكفي كيبورد الجهاز) + ضبط زر الإرسال — ألوان اللعبة، bubble teal، emoji picker، فواصل تاريخ
ModuleRegistry.register({
  id: 'chat',
  name: 'الشات',
  version: '2.2.1',
  dependencies: ['friends'],

  ctx: null,
  _root: null,
  _view: 'list',
  _roomId: null,
  _searchQ: '',

  init: function (ctx) {
    this.ctx = ctx;
    this.injectCSS();
    this.build();
  },

  injectCSS: function () {
    if (document.getElementById('_ch_css')) return;
    var c = [
      // ═ خلفيات أساسية ═
      '.ch-wrap{position:fixed;top:0;left:0;right:0;bottom:0;z-index:228;display:none;flex-direction:column;direction:rtl;color:#f3ead2;font-family:inherit;background:#07182e;overflow:hidden}',
      '.ch-wrap.open{display:flex}',

      // ═ الترويسة ═
      '.ch-top{display:flex;align-items:center;gap:10px;padding:14px 16px;background:#0f2740;border-bottom:1px solid rgba(232,184,74,.15);flex-shrink:0}',
      '.ch-back{width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#e8b84a;font-size:18px;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center}',
      '.ch-back:active{transform:scale(.92)}',
      '.ch-title{flex:1;text-align:center;font-weight:900;font-size:17px;color:#e8b84a;text-shadow:0 2px 6px rgba(0,0,0,.5)}',
      '.ch-spacer{width:38px}',

      // ═ البحث ═
      '.ch-search{padding:10px 14px 8px;flex-shrink:0}',
      '.ch-search input{width:100%;padding:11px 14px;border-radius:21px;border:1px solid rgba(232,184,74,.2);background:#0a1d33;color:#f3ead2;font-family:inherit;font-size:13px;outline:none}',
      '.ch-search input::placeholder{color:#8ea3b8}',

      // ═ القائمة ═
      '.ch-body{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:6px 12px 14px}',
      '.ch-empty{text-align:center;padding:50px 12px;color:#8ea3b8;font-size:13px}',
      '.ch-empty .big{font-size:52px;line-height:1;opacity:.5;margin-bottom:12px}',
      '.ch-row{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:14px;background:#0f2740;border:1px solid rgba(255,255,255,.05);margin-bottom:6px;cursor:pointer;transition:background .12s}',
      '.ch-row:active{background:#143352}',
      '.ch-row.unread{background:linear-gradient(180deg,#143352,#0f2740);border-color:rgba(232,184,74,.35)}',
      '.ch-av{width:52px;height:52px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#24507a,#0b2238);border:2px solid #b8862b;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;position:relative}',
      '.ch-av .dot{position:absolute;bottom:0;left:0;width:14px;height:14px;border-radius:50%;border:2px solid #0f2740;background:#55657a}',
      '.ch-av .dot.on{background:#3ddc84;box-shadow:0 0 8px rgba(61,220,132,.7)}',
      '.ch-av .dot.game{background:#4aa3ff}',
      '.ch-av .dot.away{background:#f59e0b}',
      '.ch-mid{flex:1;min-width:0}',
      '.ch-name{font-size:15px;font-weight:900;color:#f3ead2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.ch-last{font-size:12px;color:#8ea3b8;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}',
      '.ch-last.unread{color:#e8b84a;font-weight:800}',
      '.ch-right{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0}',
      '.ch-time{font-size:11px;color:#8ea3b8;font-weight:700}',
      '.ch-badge{min-width:22px;height:22px;padding:0 7px;border-radius:11px;background:linear-gradient(180deg,#ef4444,#b91c1c);color:#fff;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;line-height:1;border:1px solid rgba(255,255,255,.25)}',

      // ═ ترويسة الغرفة ═
      '.ch-roomtop{display:flex;align-items:center;gap:12px;padding:14px 16px;flex-shrink:0;background:#143352;border-bottom:1px solid rgba(255,255,255,.08)}',
      '.ch-roomav{width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#24507a,#0b2238);border:2px solid #b8862b;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;position:relative}',
      '.ch-roomav .dot{position:absolute;bottom:0;left:0;width:12px;height:12px;border-radius:50%;border:2px solid #143352;background:#55657a}',
      '.ch-roomav .dot.on{background:#3ddc84;box-shadow:0 0 8px rgba(61,220,132,.7)}',
      '.ch-roomav .dot.game{background:#4aa3ff}',
      '.ch-roomav .dot.away{background:#f59e0b}',
      '.ch-roomname{flex:1;font-weight:900;font-size:15px;color:#f3ead2}',
      '.ch-roomstat{font-size:11px;color:#8ea3b8;margin-top:3px;font-weight:700}',
      '.ch-roomstat.on{color:#3ddc84}',
      '.ch-roomstat.game{color:#4aa3ff}',

      // ═ الرسائل ═
      '.ch-msgs{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px 14px 10px;display:flex;flex-direction:column;gap:4px;background:radial-gradient(circle at 50% 0,#0f3558 0,#07182e 70%)}',
      '.ch-date{align-self:center;background:rgba(255,255,255,.07);color:#8ea3b8;font-size:11px;font-weight:800;padding:4px 14px;border-radius:999px;margin:12px 0 6px;letter-spacing:.5px}',
      '.ch-msg{max-width:74%;padding:10px 14px;font-size:14px;line-height:1.55;border-radius:16px;word-wrap:break-word;overflow-wrap:anywhere;position:relative}',
      '.ch-msg.me{align-self:flex-start;background:linear-gradient(135deg,#1fb5a8,#0f8a86);color:#fff;border-bottom-left-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,.25)}',
      '.ch-msg.them{align-self:flex-end;background:#16324f;color:#f3ead2;border-bottom-right-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,.25)}',
      '.ch-msg.system{align-self:center;background:linear-gradient(180deg,rgba(232,184,74,.12),rgba(184,134,43,.08));border:1px dashed rgba(232,184,74,.5);color:#e8b84a;font-size:12px;padding:9px 16px;border-radius:14px;text-align:center;max-width:88%;font-weight:700}',
      '.ch-msg .meta{display:block;font-size:10px;opacity:.75;margin-top:5px;text-align:left;font-weight:700}',
      '.ch-msg.them .meta{text-align:right}',
      '.ch-msg .tick{display:inline-block;margin-inline-start:3px;font-size:10px}',
      '.ch-msg .tick.read{color:#7fffd4}',

      // ═ typing ═
      '.ch-typing{align-self:flex-end;background:#16324f;padding:12px 16px;border-radius:16px;border-bottom-right-radius:4px;display:none;gap:5px;align-items:center;max-width:80px}',
      '.ch-typing.on{display:flex}',
      '.ch-typing .d{width:7px;height:7px;border-radius:50%;background:#8ea3b8;animation:ch-dot 1.2s ease-in-out infinite}',
      '.ch-typing .d:nth-child(2){animation-delay:.2s}',
      '.ch-typing .d:nth-child(3){animation-delay:.4s}',
      '@keyframes ch-dot{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}',

      // ═ شريط الإدخال (RTL: textarea + send يسار) ═
      '.ch-inputwrap{flex-shrink:0;background:#143352;border-top:1px solid rgba(255,255,255,.08)}',
      '.ch-inputrow{display:flex;gap:10px;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));align-items:flex-end}',
      '.ch-inputrow textarea{flex:1;min-width:0;min-height:44px;max-height:110px;padding:11px 16px;border-radius:22px;border:1px solid rgba(255,255,255,.12);background:#0a1d33;color:#f3ead2;font-family:inherit;font-size:14px;resize:none;line-height:1.4;outline:none}',
      '.ch-inputrow textarea::placeholder{color:#64748b}',
      '.ch-send{width:44px;height:44px;border-radius:50%;border:none;background:linear-gradient(180deg,#e8b84a,#b8862b);color:#1a0f04;font-family:inherit;font-weight:900;font-size:18px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,.35);transition:opacity .15s,transform .1s}',
      '.ch-send:active:not(:disabled){transform:scale(.92)}',
      '.ch-send:disabled{opacity:.45;cursor:default}',
      '.ch-send .arrow{transform:scaleX(-1);display:inline-block;font-size:20px}'
    ].join('');
    var s = document.createElement('style');
    s.id = '_ch_css';
    s.textContent = c;
    document.head.appendChild(s);
  },

  build: function () {
    var self = this;
    var old = document.getElementById('ch-root');
    if (old) old.remove();
    var root = document.createElement('div');
    root.id = 'ch-root';
    root.className = 'ch-wrap';
    root.innerHTML = '<div id="ch-inner"></div>';
    document.body.appendChild(root);
    this._root = root;

    root.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-ch]') : null;
      if (!t || t.disabled) return;
      var act = t.getAttribute('data-ch');
      var v = t.getAttribute('data-v') || '';
      if (act === 'close') { self.close(); return; }
      if (act === 'open-room') { self.openRoom(v); return; }
      if (act === 'back-list') { self.backToList(); return; }
      if (act === 'send') { self.doSend(); return; }
    });

    root.addEventListener('input', function (e) {
      if (!e.target) return;
      if (e.target.id === 'ch-search') { self._searchQ = e.target.value; self.renderList(); }
      if (e.target.id === 'ch-input') { self.updateSendBtn(); }
    });

    root.addEventListener('keydown', function (e) {
      if (e.target && e.target.id === 'ch-input' && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        self.doSend();
      }
    });
  },

  openList: function () {
    this._view = 'list';
    this.renderList();
    if (this._root) this._root.classList.add('open');
    var fr = window.ModuleRegistry && window.ModuleRegistry.get('friends');
    if (fr) fr.updateBadge();
  },

  openRoom: function (friendId) {
    this._view = 'room';
    this._roomId = friendId;
    this.markRead(friendId);
    this.renderRoom();
    if (this._root) this._root.classList.add('open');
    var fr = window.ModuleRegistry && window.ModuleRegistry.get('friends');
    if (fr) fr.updateBadge();
  },

  backToList: function () {
    this._view = 'list';
    this._roomId = null;
    this.renderList();
    var fr = window.ModuleRegistry && window.ModuleRegistry.get('friends');
    if (fr) fr.updateBadge();
  },

  close: function () {
    if (this._root) this._root.classList.remove('open');
  },

  onIncoming: function (fromId) {
    if (this._root && this._root.classList.contains('open')) {
      if (this._view === 'room' && this._roomId === fromId) {
        this.markRead(fromId);
        this.renderRoom();
      } else {
        this.renderList();
      }
    }
    var fr = window.ModuleRegistry && window.ModuleRegistry.get('friends');
    if (fr) fr.updateBadge();
  },

  markRead: function (friendId) {
    var f = this.ctx.state.friends;
    if (!f.messages[friendId]) return;
    var msgs = f.messages[friendId];
    for (var i = 0; i < msgs.length; i++) if (msgs[i].from === 'them') msgs[i].read = true;
    if (typeof saveState === 'function') saveState();
  },

  // ═══════════ LIST ═══════════
  renderList: function () {
    var inner = document.getElementById('ch-inner');
    if (!inner) return;
    var st = this.ctx.state;
    var f = st.friends;
    var q = (this._searchQ || '').toLowerCase();

    var convs = [];
    for (var i = 0; i < f.list.length; i++) {
      var p = f.list[i];
      if (q && p.name.toLowerCase().indexOf(q) < 0) continue;
      var msgs = f.messages[p.id] || [];
      var last = msgs.length ? msgs[msgs.length - 1] : null;
      var unread = 0;
      for (var j = 0; j < msgs.length; j++) if (msgs[j].from === 'them' && !msgs[j].read) unread++;
      convs.push({ person: p, last: last, unread: unread, at: last ? last.at : p.addedAt });
    }
    convs.sort(function (a, b) { return b.at - a.at; });

    var h = '';
    h += '<div class="ch-top">';
    h +=   '<button class="ch-back" data-ch="close">←</button>';
    h +=   '<div class="ch-title">💬 الرسائل</div>';
    h +=   '<div class="ch-spacer"></div>';
    h += '</div>';

    h += '<div class="ch-search"><input id="ch-search" type="text" placeholder="🔍 ابحث في المحادثات..." value="' + this.esc(this._searchQ) + '"></div>';

    h += '<div class="ch-body">';
    if (!convs.length) {
      h += '<div class="ch-empty"><div class="big">💬</div>لا محادثات بعد<br><br>أضف أصدقاء وابدأ المراسلة</div>';
    } else {
      for (var k = 0; k < convs.length; k++) h += this.renderConvRow(convs[k]);
    }
    h += '</div>';

    inner.innerHTML = h;
  },

  renderConvRow: function (c) {
    var p = c.person;
    var fr = window.ModuleRegistry && window.ModuleRegistry.get('friends');
    var status = fr ? fr.botStatus(p.id) : 'offline';
    var dotCls = status === 'online' ? 'on' : (status === 'game' ? 'game' : (status === 'away' ? 'away' : ''));
    var lastTxt = c.last ? ((c.last.from === 'me' ? 'أنا: ' : '') + c.last.text) : 'ابدأ المحادثة';
    var timeTxt = c.last ? this.fmtTimeShort(c.last.at) : '';

    var h = '';
    h += '<div class="ch-row' + (c.unread > 0 ? ' unread' : '') + '" data-ch="open-room" data-v="' + p.id + '">';
    h +=   '<div class="ch-av">' + this.esc(p.emoji || '🧑‍✈️') + '<span class="dot ' + dotCls + '"></span></div>';
    h +=   '<div class="ch-mid">';
    h +=     '<div class="ch-name">' + this.esc(p.name) + '</div>';
    h +=     '<div class="ch-last' + (c.unread > 0 ? ' unread' : '') + '">' + this.esc(lastTxt) + '</div>';
    h +=   '</div>';
    h +=   '<div class="ch-right">';
    if (timeTxt) h += '<div class="ch-time">' + timeTxt + '</div>';
    if (c.unread > 0) h += '<div class="ch-badge">' + (c.unread > 99 ? '99+' : c.unread) + '</div>';
    h +=   '</div>';
    h += '</div>';
    return h;
  },

  // ═══════════ ROOM ═══════════
  renderRoom: function () {
    var inner = document.getElementById('ch-inner');
    if (!inner || !this._roomId) return;
    var f = this.ctx.state.friends;
    var p = null;
    for (var i = 0; i < f.list.length; i++) if (f.list[i].id === this._roomId) p = f.list[i];
    if (!p) {
      var fr = window.ModuleRegistry && window.ModuleRegistry.get('friends');
      if (fr) p = fr.findBot(this._roomId);
    }
    if (!p) { this.backToList(); return; }

    var fr2 = window.ModuleRegistry && window.ModuleRegistry.get('friends');
    var status = fr2 ? fr2.botStatus(p.id) : 'offline';
    var statusTxt = fr2 ? fr2.statusLabel(status, p.id) : '';
    var statusCls = status === 'online' ? 'on' : (status === 'game' ? 'game' : '');
    var dotCls = status === 'online' ? 'on' : (status === 'game' ? 'game' : (status === 'away' ? 'away' : ''));

    var h = '';
    h += '<div class="ch-roomtop">';
    h +=   '<button class="ch-back" data-ch="back-list">←</button>';
    h +=   '<div class="ch-roomav">' + this.esc(p.emoji || '🧑‍✈️') + '<span class="dot ' + dotCls + '"></span></div>';
    h +=   '<div style="flex:1;min-width:0">';
    h +=     '<div class="ch-roomname">' + this.esc(p.name) + '</div>';
    h +=     '<div class="ch-roomstat ' + statusCls + '">' + this.esc(statusTxt) + '</div>';
    h +=   '</div>';
    h += '</div>';

    h += '<div class="ch-msgs" id="ch-msgs">';
    var msgs = f.messages[p.id] || [];
    if (!msgs.length) {
      h += '<div class="ch-empty" style="padding:30px 12px"><div class="big">👋</div>ابدأ المحادثة</div>';
    } else {
      var lastDate = '';
      for (var j = 0; j < msgs.length; j++) {
        var m = msgs[j];
        var dk = this.dateLabel(m.at);
        if (dk !== lastDate) {
          h += '<div class="ch-date">' + dk + '</div>';
          lastDate = dk;
        }
        if (m.system) {
          h += '<div class="ch-msg system">' + this.esc(m.text) + '</div>';
        } else {
          var side = m.from === 'me' ? 'me' : 'them';
          var tick = m.from === 'me' ? '<span class="tick' + (m.read ? ' read' : '') + '">' + (m.read ? '✓✓' : '✓') + '</span>' : '';
          h += '<div class="ch-msg ' + side + '">' + this.esc(m.text) + '<span class="meta">' + this.fmtTimeShort(m.at) + tick + '</span></div>';
        }
      }
    }
    h += '<div class="ch-typing" id="ch-typing"><span class="d"></span><span class="d"></span><span class="d"></span></div>';
    h += '</div>';

    // input bar — textarea + send فقط
    h += '<div class="ch-inputwrap">';
    h +=   '<div class="ch-inputrow">';
    h +=     '<textarea id="ch-input" rows="1" placeholder="اكتب رسالة..." maxlength="300"></textarea>';
    h +=     '<button class="ch-send" id="ch-send" data-ch="send" disabled><span class="arrow">➤</span></button>';
    h +=   '</div>';
    h += '</div>';

    inner.innerHTML = h;

    var body = document.getElementById('ch-msgs');
    if (body) body.scrollTop = body.scrollHeight;
  },

  updateSendBtn: function () {
    var inp = document.getElementById('ch-input');
    var btn = document.getElementById('ch-send');
    if (!inp || !btn) return;
    btn.disabled = !(inp.value || '').trim();
  },

  doSend: function () {
    if (!this._roomId) return;
    var inp = document.getElementById('ch-input');
    if (!inp) return;
    var text = (inp.value || '').trim().slice(0, 300);
    if (!text) return;
    inp.value = '';

    var f = this.ctx.state.friends;
    if (!f.messages[this._roomId]) f.messages[this._roomId] = [];
    f.messages[this._roomId].push({ from: 'me', text: text, at: Date.now(), read: false });
    if (typeof saveState === 'function') saveState();
    if (typeof beep === 'function') beep(660, 0.05);
    this.renderRoom();

    var self = this;
    var rid = this._roomId;

    // ═ simulate delivery + typing + reply ═
    setTimeout(function () {
      if (self._roomId !== rid) return;
      var arr = f.messages[rid] || [];
      var last = arr[arr.length - 1];
      if (last && last.from === 'me') last.read = true;
      if (typeof saveState === 'function') saveState();
      if (self._roomId === rid) self.renderRoom();
    }, 1200);

    setTimeout(function () {
      if (self._roomId !== rid) return;
      var t = document.getElementById('ch-typing');
      if (t) t.classList.add('on');
      var body = document.getElementById('ch-msgs');
      if (body) body.scrollTop = body.scrollHeight;
    }, 1500);

    setTimeout(function () {
      if (self._roomId !== rid) return;
      var t = document.getElementById('ch-typing');
      if (t) t.classList.remove('on');
      var fr = window.ModuleRegistry && window.ModuleRegistry.get('friends');
      if (!fr) return;
      var reply = fr.BOT_REPLIES[Math.floor(Math.random() * fr.BOT_REPLIES.length)];
      fr.incomingMessage(rid, reply);
    }, 3200 + Math.random() * 3000);
  },

  dateLabel: function (ms) {
    var d = new Date(ms);
    var now = new Date();
    if (d.toDateString() === now.toDateString()) return 'اليوم';
    var y = new Date(now.getTime() - 86400000);
    if (d.toDateString() === y.toDateString()) return 'أمس';
    return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
  },

  fmtTimeShort: function (ms) {
    var d = new Date(ms);
    var now = new Date();
    var hh = d.getHours(), mm = d.getMinutes();
    var ap = hh < 12 ? 'ص' : 'م';
    var h12 = hh % 12; if (h12 === 0) h12 = 12;
    var t = h12 + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap;
    if (d.toDateString() === now.toDateString()) return t;
    var y = new Date(now.getTime() - 86400000);
    if (d.toDateString() === y.toDateString()) return 'أمس';
    return d.getDate() + '/' + (d.getMonth() + 1);
  },

  esc: function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c];
    });
  }
});
