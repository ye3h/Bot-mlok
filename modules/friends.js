// modules/friends.js — نظام الأصدقاء (v3.0.0)
// v3.0.0: ⋯ menu + بحث + فلتر + عداد + نص شخصي + شات منفصل في chat.js
ModuleRegistry.register({
  id: 'friends',
  name: 'الأصدقاء',
  version: '3.0.0',
  dependencies: [],

  MAX_FRIENDS: 50,

  TABS: [
    { id: 'friends',  label: 'أصدقائي',  emoji: '👥' },
    { id: 'requests', label: 'الطلبات',  emoji: '📬' },
    { id: 'search',   label: 'بحث',     emoji: '🔍' },
    { id: 'blocked',  label: 'محظورون',  emoji: '🚫' },
    { id: 'settings', label: 'إعدادات',  emoji: '⚙️' }
  ],

  LOCATIONS: [
    'في سفينة شراعية',
    'في الأرينا',
    'يصطاد في الأعماق',
    'في رحلة طويلة',
    'في قبيلة الصقور',
    'عند سوق السمك'
  ],

  BOTS: [
    { id: 'bot_01', name: 'قرصان الليل',  emoji: '🏴‍☠️', level: 42, bio: 'صياد محترف · محب للكراكن' },
    { id: 'bot_02', name: 'كابتن رعد',    emoji: '⚡',   level: 38, bio: 'سرعة البرق في البحر' },
    { id: 'bot_03', name: 'ملك المرجان',  emoji: '🪸',   level: 51, bio: 'إذا تبي تنضم للقبيلة كلمني' },
    { id: 'bot_04', name: 'سيد الأعماق',  emoji: '🔱',   level: 60, bio: 'أصطاد الأسطوري فقط' },
    { id: 'bot_05', name: 'أفعى البحر',   emoji: '🐍',   level: 27, bio: 'جديد في المملكة' },
    { id: 'bot_06', name: 'ظل الموجة',    emoji: '🌑',   level: 33, bio: '' },
    { id: 'bot_07', name: 'تنين الفجر',   emoji: '🌅',   level: 45, bio: 'عاشق التنانين 🐉' },
    { id: 'bot_08', name: 'بحار ضائع',    emoji: '⚓',   level: 18, bio: 'أتعلم الصيد' },
    { id: 'bot_09', name: 'شيطان الحبر',  emoji: '🐙',   level: 55, bio: 'كراكن فقط 🦑' },
    { id: 'bot_10', name: 'ملك الكراكن',  emoji: '🦑',   level: 68, bio: 'أسطورة الأعماق' }
  ],

  BOT_REPLIES: [
    'هلا والله 👋', 'كيف حالك يا قبطان؟', 'وش أخبار الصيد اليوم؟',
    'تعال نلعب مع بعض', 'أنا في الأرينا الحين 🔥',
    'اصطدت سمكة أسطورية أمس 🐟', 'وش رايك نروح للأعماق؟',
    'مبروك على المستوى الجديد 🎉', 'الله يعينك على الوحش 💀',
    'التنين حقك صار قوي؟ 🐉', 'بعت كل السمك أمس 💰',
    'سوق السمك اليوم غالي', 'تعرف وين نلاقي الكراكن؟',
    'إذا تبي تنضم للقبيلة كلمني', 'حظ أوفر المرة الجاية'
  ],

  ctx: null,
  _root: null,
  _tab: 'friends',
  _menuFor: null,
  _searchQuery: '',
  _friendSearch: '',
  _filter: 'all',
  _searchResults: [],
  _botTimer: null,

  init: function (ctx) {
    var self = this;
    this.ctx = ctx;
    this.ensureState();
    this.injectCSS();
    this.build();
    this.seedInitialFriends();
    this.rebindNav();
    this.updateBadge();
    this._botTimer = setInterval(function () { self.tickBots(); }, 45000);
  },

  ensureState: function () {
    var st = this.ctx.state;
    if (!st.friends) {
      st.friends = { list: [], incoming: [], outgoing: [], blocked: [], messages: {}, settings: {} };
    }
    var f = st.friends;
    if (!Array.isArray(f.list)) f.list = [];
    if (!Array.isArray(f.incoming)) f.incoming = [];
    if (!Array.isArray(f.outgoing)) f.outgoing = [];
    if (!Array.isArray(f.blocked)) f.blocked = [];
    if (!f.messages || typeof f.messages !== 'object') f.messages = {};
    if (!f.settings || typeof f.settings !== 'object') f.settings = {};
    if (typeof f.settings.requestsClosed !== 'boolean') f.settings.requestsClosed = false;
    if (!f.settings.whoCanMessage) f.settings.whoCanMessage = 'friends';
    if (typeof f.settings.readReceipts !== 'boolean') f.settings.readReceipts = true;
    if (typeof f.settings.statusMessage !== 'string') f.settings.statusMessage = '';
  },

  seedInitialFriends: function () {
    var f = this.ctx.state.friends;
    if (f.__seeded) return;
    f.__seeded = true;
    var seed = [this.BOTS[0], this.BOTS[2], this.BOTS[5]];
    for (var i = 0; i < seed.length; i++) {
      var b = seed[i];
      if (!this.hasFriend(b.id)) {
        f.list.push({ id: b.id, name: b.name, emoji: b.emoji, level: b.level, bio: b.bio, addedAt: Date.now() - (i + 1) * 3600000 });
        f.messages[b.id] = [{ from: 'them', text: 'هلا! أنا ' + b.name + ' — تشرفنا 🤝', at: Date.now() - (i + 1) * 3500000, read: true }];
      }
    }
    var ib = this.BOTS[3];
    f.incoming.push({ id: ib.id, name: ib.name, emoji: ib.emoji, level: ib.level, bio: ib.bio, requestedAt: Date.now() - 15 * 60000 });
    if (typeof saveState === 'function') saveState();
  },

  rebindNav: function () {
    var self = this;
    ['friends', 'chat'].forEach(function (screen) {
      var oldBtn = document.querySelector('.nav-btn[data-screen="' + screen + '"]');
      if (!oldBtn) return;
      var newBtn = oldBtn.cloneNode(true);
      oldBtn.parentNode.replaceChild(newBtn, oldBtn);
      newBtn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        if (screen === 'friends') self.open();
        else {
          var ch = window.ModuleRegistry && window.ModuleRegistry.get('chat');
          if (ch && ch.openList) ch.openList();
        }
      });
    });
  },

  updateBadge: function () {
    var f = this.ctx.state.friends;
    var incoming = f.incoming.length;
    var unread = this.countUnread();
    var total = incoming + unread;

    var fb = document.getElementById('friendsBadge');
    if (fb) {
      if (incoming > 0) { fb.style.display = ''; fb.textContent = incoming > 99 ? '99+' : String(incoming); }
      else fb.style.display = 'none';
    }
    var cb = document.getElementById('chatBadge');
    if (cb) {
      if (unread > 0) { cb.style.display = ''; cb.textContent = unread > 99 ? '99+' : String(unread); }
      else cb.style.display = 'none';
    }
  },

  countUnread: function () {
    var f = this.ctx.state.friends;
    var n = 0;
    for (var fid in f.messages) {
      if (!f.messages.hasOwnProperty(fid)) continue;
      var msgs = f.messages[fid];
      for (var i = 0; i < msgs.length; i++) if (msgs[i].from === 'them' && !msgs[i].read) n++;
    }
    return n;
  },

  // ═══════ CSS ═══════
  injectCSS: function () {
    if (document.getElementById('_fr_css')) return;
    var c = [
      '.fr-wrap{position:fixed;inset:0;z-index:222;display:none;flex-direction:column;direction:rtl;color:#fff;font-family:inherit;background:radial-gradient(ellipse at 50% 0%,#0c3a5e 0%,#041e33 55%,#020a14 100%)}',
      '.fr-wrap.open{display:flex}',

      '.fr-top{display:flex;align-items:center;gap:8px;padding:10px 12px 8px;flex-shrink:0}',
      '.fr-back{width:38px;height:38px;border-radius:12px;border:1.5px solid rgba(252,191,73,.6);background:rgba(20,15,35,.7);color:#fcd34d;font-size:18px;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center}',
      '.fr-back:active{transform:scale(.92)}',
      '.fr-title{flex:1;text-align:center;font-weight:900;font-size:17px;color:#fcd34d;text-shadow:0 2px 6px rgba(0,0,0,.6)}',
      '.fr-chatbtn{position:relative;width:38px;height:38px;border-radius:12px;border:1.5px solid rgba(252,191,73,.6);background:rgba(20,15,35,.7);color:#fcd34d;font-size:18px;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center}',
      '.fr-chatbtn:active{transform:scale(.92)}',
      '.fr-chatbtn .badge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:linear-gradient(180deg,#e53935,#8f1212);border:1.5px solid rgba(255,243,200,.95);color:#fff;font-size:10px;font-weight:900;display:flex;align-items:center;justify-content:center;line-height:1}',

      '.fr-tabs{display:flex;gap:5px;overflow-x:auto;padding:0 10px 10px;flex-shrink:0}',
      '.fr-tab{flex:1;min-width:64px;padding:8px 6px;border-radius:12px;border:1.5px solid rgba(252,191,73,.28);background:rgba(15,25,45,.7);color:#cbd5e1;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;position:relative}',
      '.fr-tab.on{border-color:#fcd34d;background:linear-gradient(180deg,rgba(252,191,73,.25),rgba(180,83,9,.15));color:#fef3c7;box-shadow:0 0 12px rgba(252,191,73,.35)}',
      '.fr-tab .em{font-size:16px;line-height:1}',
      '.fr-tab .cnt{position:absolute;top:-5px;right:-5px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:#dc2626;color:#fff;font-size:9px;font-weight:900;display:flex;align-items:center;justify-content:center;line-height:1;border:1px solid rgba(255,255,255,.3)}',

      '.fr-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 10px 110px}',
      '.fr-section{padding:11px 12px;border-radius:14px;background:rgba(15,25,45,.72);border:1px solid rgba(252,191,73,.22);margin-bottom:10px}',
      '.fr-section h3{margin:0 0 8px;font-size:13px;font-weight:900;color:#fcd34d;display:flex;align-items:center;justify-content:space-between;gap:6px}',
      '.fr-section h3 .cnt{font-size:10px;color:#94a3b8;font-weight:800;background:rgba(0,0,0,.3);padding:2px 7px;border-radius:8px}',
      '.fr-empty{text-align:center;padding:30px 12px;color:#94a3b8;font-size:13px}',
      '.fr-empty .big{font-size:44px;line-height:1;opacity:.55;margin-bottom:8px}',

      '.fr-search{display:flex;gap:6px;margin-bottom:8px}',
      '.fr-search input{flex:1;min-width:0;padding:9px 11px;border-radius:11px;border:1.5px solid rgba(252,191,73,.25);background:rgba(10,20,35,.8);color:#fff;font-family:inherit;font-size:12px}',
      '.fr-search input::placeholder{color:#64748b}',
      '.fr-chips{display:flex;gap:5px;margin-bottom:10px;overflow-x:auto}',
      '.fr-chip{padding:5px 12px;border-radius:10px;border:1.5px solid rgba(255,255,255,.15);background:rgba(20,30,50,.6);color:#cbd5e1;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}',
      '.fr-chip.on{border-color:#fcd34d;background:rgba(252,191,73,.2);color:#fef3c7}',

      '.fr-prow{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:12px;background:rgba(10,20,35,.6);border:1px solid rgba(255,255,255,.06);margin-bottom:6px;position:relative}',
      '.fr-prow.unread{border-color:rgba(252,191,73,.6);background:linear-gradient(180deg,rgba(252,191,73,.08),rgba(20,15,35,.6))}',
      '.fr-av{width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#2a4a75,#0b1d33);border:2px solid rgba(252,191,73,.5);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;position:relative}',
      '.fr-av .dot{position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;border-radius:50%;border:2px solid #0a1425;background:#6b7280}',
      '.fr-av .dot.on{background:#22c55e;box-shadow:0 0 6px rgba(34,197,94,.7)}',
      '.fr-av .dot.game{background:#38bdf8;box-shadow:0 0 6px rgba(56,189,248,.7)}',
      '.fr-av .dot.away{background:#f59e0b}',
      '.fr-info{flex:1;min-width:0}',
      '.fr-name{font-size:13px;font-weight:900;color:#fef3c7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.fr-meta{font-size:10px;color:#94a3b8;margin-top:2px;display:flex;gap:8px;align-items:center}',
      '.fr-meta .lv{color:#a78bfa;font-weight:800}',
      '.fr-meta .loc{color:#7dd3fc;font-weight:700}',
      '.fr-preview{font-size:10px;color:#cbd5e1;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}',
      '.fr-preview.unread{color:#fcd34d}',
      '.fr-bio{font-size:10px;color:#94a3b8;font-style:italic;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.fr-actions{display:flex;gap:4px;flex-shrink:0;align-items:center}',
      '.fr-btn{padding:6px 10px;border-radius:9px;border:1.5px solid rgba(255,255,255,.2);background:rgba(30,42,65,.9);color:#e2e8f0;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}',
      '.fr-btn:active{transform:scale(.94)}',
      '.fr-btn.gold{border-color:#fbbf24;background:linear-gradient(180deg,#fcd34d,#d97706);color:#1c1917}',
      '.fr-btn.green{border-color:#86efac;background:linear-gradient(180deg,#bbf7d0,#16a34a);color:#052e16}',
      '.fr-btn.red{border-color:#f87171;background:linear-gradient(180deg,#fecaca,#dc2626);color:#fff}',
      '.fr-btn.blue{border-color:#7dd3fc;background:linear-gradient(180deg,#bae6fd,#0284c7);color:#0c1e2e}',
      '.fr-btn.dots{width:36px;height:36px;padding:0;font-size:18px;line-height:1;border-radius:50%;background:rgba(30,42,65,.9);border-color:rgba(252,191,73,.4);color:#fcd34d}',
      '.fr-badge{font-size:9px;padding:2px 6px;border-radius:6px;font-weight:900}',
      '.fr-badge.in{background:rgba(220,38,38,.25);border:1px solid rgba(248,113,113,.6);color:#fecaca}',
      '.fr-badge.out{background:rgba(56,189,248,.2);border:1px solid rgba(56,189,248,.5);color:#bae6fd}',
      '.fr-badge.ok{background:rgba(34,197,94,.2);border:1px solid rgba(34,197,94,.5);color:#bbf7d0}',

      '.fr-setrow{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:rgba(10,20,35,.5);margin-bottom:6px}',
      '.fr-setrow .lbl{flex:1;font-size:12px;font-weight:800;color:#e2e8f0}',
      '.fr-setrow .sub{font-size:10px;color:#94a3b8;margin-top:2px;font-weight:600}',
      '.fr-switch{position:relative;width:48px;height:26px;border-radius:13px;background:rgba(71,85,105,.7);border:1.5px solid rgba(255,255,255,.15);cursor:pointer;transition:background .2s;flex-shrink:0}',
      '.fr-switch.on{background:linear-gradient(180deg,#22c55e,#16a34a);border-color:#86efac}',
      '.fr-switch .knob{position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 2px 4px rgba(0,0,0,.4)}',
      '.fr-switch.on .knob{transform:translateX(-22px)}',
      '.fr-select{padding:6px 10px;border-radius:9px;border:1.5px solid rgba(252,191,73,.4);background:rgba(15,25,45,.9);color:#fef3c7;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer}',
      '.fr-status-box{padding:10px 12px;border-radius:12px;background:rgba(10,20,35,.5);border:1.5px dashed rgba(252,191,73,.3);font-size:12px;color:#cbd5e1;margin-bottom:6px;cursor:pointer;text-align:center;font-style:italic}',
      '.fr-status-box:active{background:rgba(252,191,73,.08)}',
      '.fr-status-box.filled{border-style:solid;color:#fef3c7}',

      // menu modal
      '.fr-menu-wrap{position:fixed;inset:0;z-index:240;display:none;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.75);padding:16px}',
      '.fr-menu-wrap.open{display:flex}',
      '.fr-menu{width:100%;max-width:340px;border-radius:20px;background:linear-gradient(180deg,#152844,#0a1a2e);border:1.5px solid rgba(252,191,73,.4);padding:12px;box-shadow:0 20px 60px rgba(0,0,0,.8)}',
      '.fr-menu-head{display:flex;align-items:center;gap:10px;padding:6px 6px 12px;border-bottom:1px solid rgba(252,191,73,.15);margin-bottom:8px}',
      '.fr-menu-head .av{width:46px;height:46px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#2a4a75,#0b1d33);border:2px solid rgba(252,191,73,.5);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0}',
      '.fr-menu-head .nm{font-size:14px;font-weight:900;color:#fef3c7}',
      '.fr-menu-head .lv{font-size:11px;color:#a78bfa;margin-top:2px}',
      '.fr-menu-item{display:flex;align-items:center;gap:10px;padding:12px 10px;border-radius:12px;background:rgba(15,25,45,.7);margin-bottom:6px;cursor:pointer;font-size:13px;font-weight:800;color:#e2e8f0;font-family:inherit;border:1px solid rgba(255,255,255,.05);width:100%;text-align:right}',
      '.fr-menu-item:active{background:rgba(252,191,73,.12)}',
      '.fr-menu-item.danger{color:#fecaca;border-color:rgba(248,113,113,.3)}',
      '.fr-menu-item.danger:active{background:rgba(220,38,38,.15)}',
      '.fr-menu-item .ic{font-size:18px;width:24px;text-align:center}',
      '.fr-menu-cancel{padding:12px;border-radius:12px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.15);color:#cbd5e1;font-family:inherit;font-weight:800;font-size:13px;cursor:pointer;width:100%;margin-top:4px}'
    ].join('');
    var s = document.createElement('style');
    s.id = '_fr_css';
    s.textContent = c;
    document.head.appendChild(s);
  },

  // ═══════ BUILD ═══════
  build: function () {
    var self = this;
    var old = document.getElementById('fr-root');
    if (old) old.remove();
    var root = document.createElement('div');
    root.id = 'fr-root';
    root.className = 'fr-wrap';
    root.innerHTML = '<div id="fr-inner"></div><div class="fr-menu-wrap" id="fr-menu-wrap"></div>';
    document.body.appendChild(root);
    this._root = root;

    root.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-fr]') : null;
      if (!t || t.disabled) return;
      var act = t.getAttribute('data-fr');
      var v = t.getAttribute('data-v') || '';
      if (act === 'close')       { self.close(); return; }
      if (act === 'tab')         { self._tab = v; self._friendSearch = ''; self.render(); return; }
      if (act === 'open-chats')  { self.openChats(); return; }
      if (act === 'open-chat')   { self.openChatRoom(v); return; }
      if (act === 'menu')        { self.openMenu(v); return; }
      if (act === 'menu-close')  { self.closeMenu(); return; }
      if (act === 'm-chat')      { self.closeMenu(); self.openChatRoom(v); return; }
      if (act === 'm-block')     { self.closeMenu(); self.blockUser(v); return; }
      if (act === 'm-report')    { self.closeMenu(); self.reportUser(v); return; }
      if (act === 'm-remove')    { self.closeMenu(); self.removeFriend(v); return; }
      if (act === 'accept')      { self.acceptRequest(v); return; }
      if (act === 'reject')      { self.rejectRequest(v); return; }
      if (act === 'cancel-out')  { self.cancelOutgoing(v); return; }
      if (act === 'send-request'){ self.sendRequest(v); return; }
      if (act === 'do-search')   { self.doSearch(); return; }
      if (act === 'toggle-requests') { self.toggleRequests(); return; }
      if (act === 'toggle-read') { self.toggleRead(); return; }
      if (act === 'accept-all')  { self.acceptAll(); return; }
      if (act === 'reject-all')  { self.rejectAll(); return; }
      if (act === 'unblock')     { self.unblockUser(v); return; }
      if (act === 'set-status')  { self.editStatus(); return; }
      if (act === 'chip')        { self._filter = v; self.render(); return; }
    });

    root.addEventListener('input', function (e) {
      if (!e.target) return;
      if (e.target.id === 'fr-search-input') self._searchQuery = e.target.value;
      if (e.target.id === 'fr-friend-filter') { self._friendSearch = e.target.value; self.render(); }
    });
    root.addEventListener('keydown', function (e) {
      if (e.target && e.target.id === 'fr-search-input' && e.key === 'Enter') self.doSearch();
    });
    root.addEventListener('change', function (e) {
      if (e.target && e.target.getAttribute && e.target.getAttribute('data-fr') === 'set-msg') {
        self.setWhoCanMessage(e.target.value);
      }
    });
  },

  open: function (tab) {
    this.ensureState();
    if (tab) this._tab = tab;
    this.render();
    if (this._root) this._root.classList.add('open');
    this.updateBadge();
  },

  close: function () {
    if (this._root) this._root.classList.remove('open');
  },

  openChats: function () {
    var ch = window.ModuleRegistry && window.ModuleRegistry.get('chat');
    if (ch && ch.openList) ch.openList();
  },

  openChatRoom: function (friendId) {
    var ch = window.ModuleRegistry && window.ModuleRegistry.get('chat');
    if (ch && ch.openRoom) ch.openRoom(friendId);
  },

  // ═══════ MENU ═══════
  openMenu: function (friendId) {
    var person = this.findPerson(friendId);
    if (!person) return;
    this._menuFor = friendId;
    var wrap = document.getElementById('fr-menu-wrap');
    if (!wrap) return;
    var h = '';
    h += '<div class="fr-menu">';
    h +=   '<div class="fr-menu-head">';
    h +=     '<div class="av">' + this.esc(person.emoji || '🧑‍✈️') + '</div>';
    h +=     '<div style="flex:1;min-width:0"><div class="nm">' + this.esc(person.name) + '</div><div class="lv">Lv' + (person.level || '?') + '</div></div>';
    h +=   '</div>';
    h +=   '<button class="fr-menu-item" data-fr="m-chat" data-v="' + friendId + '"><span class="ic">💬</span><span>فتح المحادثة</span></button>';
    h +=   '<button class="fr-menu-item danger" data-fr="m-block" data-v="' + friendId + '"><span class="ic">🚫</span><span>حظر اللاعب</span></button>';
    h +=   '<button class="fr-menu-item danger" data-fr="m-report" data-v="' + friendId + '"><span class="ic">⚠️</span><span>إبلاغ</span></button>';
    h +=   '<button class="fr-menu-item danger" data-fr="m-remove" data-v="' + friendId + '"><span class="ic">✕</span><span>حذف الصديق</span></button>';
    h +=   '<button class="fr-menu-cancel" data-fr="menu-close">إلغاء</button>';
    h += '</div>';
    wrap.innerHTML = h;
    wrap.classList.add('open');
  },

  closeMenu: function () {
    var wrap = document.getElementById('fr-menu-wrap');
    if (wrap) { wrap.classList.remove('open'); wrap.innerHTML = ''; }
    this._menuFor = null;
  },

  findPerson: function (id) {
    var f = this.ctx.state.friends;
    for (var i = 0; i < f.list.length; i++) if (f.list[i].id === id) return f.list[i];
    for (var j = 0; j < f.incoming.length; j++) if (f.incoming[j].id === id) return f.incoming[j];
    for (var k = 0; k < f.outgoing.length; k++) if (f.outgoing[k].id === id) return f.outgoing[k];
    for (var b = 0; b < f.blocked.length; b++) if (f.blocked[b].id === id) return f.blocked[b];
    return this.findBot(id);
  },

  // ═══════ TICK BOTS ═══════
  tickBots: function () {
    if (this._root && !this._root.classList.contains('open')) return;
    var f = this.ctx.state.friends;
    if (!f.list.length) return;
    if (Math.random() > 0.25) return;
    var friend = f.list[Math.floor(Math.random() * f.list.length)];
    var reply = this.BOT_REPLIES[Math.floor(Math.random() * this.BOT_REPLIES.length)];
    this.incomingMessage(friend.id, reply);
    if (typeof showMessage === 'function') showMessage('💬 رسالة من ' + friend.name);
  },

  incomingMessage: function (fromId, text) {
    var f = this.ctx.state.friends;
    if (!f.messages[fromId]) f.messages[fromId] = [];
    f.messages[fromId].push({ from: 'them', text: text, at: Date.now(), read: false });
    if (typeof saveState === 'function') saveState();
    this.updateBadge();
    var ch = window.ModuleRegistry && window.ModuleRegistry.get('chat');
    if (ch && ch.onIncoming) ch.onIncoming(fromId);
  },

  // ═══════ HELPERS ═══════
  hasFriend: function (id) {
    var f = this.ctx.state.friends;
    for (var i = 0; i < f.list.length; i++) if (f.list[i].id === id) return true;
    return false;
  },
  isBlocked: function (id) {
    var f = this.ctx.state.friends;
    for (var i = 0; i < f.blocked.length; i++) if (f.blocked[i].id === id) return true;
    return false;
  },
  isIncoming: function (id) {
    var f = this.ctx.state.friends;
    for (var i = 0; i < f.incoming.length; i++) if (f.incoming[i].id === id) return true;
    return false;
  },
  isOutgoing: function (id) {
    var f = this.ctx.state.friends;
    for (var i = 0; i < f.outgoing.length; i++) if (f.outgoing[i].id === id) return true;
    return false;
  },
  findBot: function (id) {
    for (var i = 0; i < this.BOTS.length; i++) if (this.BOTS[i].id === id) return this.BOTS[i];
    return null;
  },

  botStatus: function (botId) {
    var bucket = Math.floor(Date.now() / (10 * 60 * 1000));
    var hash = 0;
    for (var i = 0; i < botId.length; i++) hash = (hash * 31 + botId.charCodeAt(i)) & 0x7fffffff;
    var r = (hash + bucket) % 10;
    if (r < 4) return 'online';
    if (r < 6) return 'game';
    if (r < 8) return 'away';
    return 'offline';
  },

  botLocation: function (botId) {
    var bucket = Math.floor(Date.now() / (10 * 60 * 1000));
    var hash = 0;
    for (var i = 0; i < botId.length; i++) hash = (hash * 31 + botId.charCodeAt(i)) & 0x7fffffff;
    return this.LOCATIONS[(hash + bucket) % this.LOCATIONS.length];
  },

  statusLabel: function (s, botId) {
    if (s === 'online') return 'متصل';
    if (s === 'game') return this.botLocation(botId);
    if (s === 'away') return 'بعيد';
    return 'غير متصل';
  },

  statusRank: function (s) {
    if (s === 'online') return 0;
    if (s === 'game') return 1;
    if (s === 'away') return 2;
    return 3;
  },

  // ═══════ ACTIONS ═══════
  sendRequest: function (botId) {
    var bot = this.findBot(botId);
    if (!bot) return;
    if (this.hasFriend(botId) || this.isOutgoing(botId) || this.isBlocked(botId)) return;
    var f = this.ctx.state.friends;
    if (f.settings.requestsClosed) { if (typeof showMessage === 'function') showMessage('🔒 أوقفت استقبال الطلبات'); return; }
    if (f.list.length >= this.MAX_FRIENDS) { if (typeof showMessage === 'function') showMessage('وصلت الحد الأقصى ' + this.MAX_FRIENDS); return; }
    f.outgoing.push({ id: bot.id, name: bot.name, emoji: bot.emoji, level: bot.level, requestedAt: Date.now() });
    if (typeof saveState === 'function') saveState();
    if (typeof showMessage === 'function') showMessage('📤 أرسلت طلب إلى ' + bot.name);
    if (typeof beep === 'function') beep(660, 0.08);
    this.render();
    var self = this;
    setTimeout(function () {
      var still = false;
      for (var i = 0; i < self.ctx.state.friends.outgoing.length; i++) if (self.ctx.state.friends.outgoing[i].id === bot.id) still = true;
      if (still) self.acceptOutgoing(bot.id);
    }, 8000 + Math.random() * 8000);
  },

  acceptOutgoing: function (botId) {
    var f = this.ctx.state.friends;
    for (var i = f.outgoing.length - 1; i >= 0; i--) {
      if (f.outgoing[i].id === botId) {
        var entry = f.outgoing[i];
        f.outgoing.splice(i, 1);
        f.list.push({ id: entry.id, name: entry.name, emoji: entry.emoji, level: entry.level, addedAt: Date.now() });
        if (!f.messages[entry.id]) f.messages[entry.id] = [];
        f.messages[entry.id].push({ from: 'them', text: 'تم قبول طلبك! أهلاً بك 🤝', at: Date.now(), read: false });
        if (typeof saveState === 'function') saveState();
        if (typeof showMessage === 'function') showMessage('✅ ' + entry.name + ' قبل طلبك');
        if (typeof beep === 'function') beep(880, 0.12);
        this.updateBadge();
        if (this._root && this._root.classList.contains('open')) this.render();
        break;
      }
    }
  },

  acceptRequest: function (id) {
    var f = this.ctx.state.friends;
    for (var i = 0; i < f.incoming.length; i++) {
      if (f.incoming[i].id === id) {
        var req = f.incoming[i];
        f.incoming.splice(i, 1);
        f.list.push({ id: req.id, name: req.name, emoji: req.emoji, level: req.level, addedAt: Date.now() });
        if (!f.messages[req.id]) f.messages[req.id] = [];
        f.messages[req.id].push({ from: 'them', text: 'شكراً على القبول! 🎉', at: Date.now(), read: true });
        if (typeof showMessage === 'function') showMessage('✅ تم قبول ' + req.name);
        if (typeof beep === 'function') beep(880, 0.1);
        break;
      }
    }
    if (typeof saveState === 'function') saveState();
    this.updateBadge();
    this.render();
  },

  rejectRequest: function (id) {
    var f = this.ctx.state.friends;
    for (var i = 0; i < f.incoming.length; i++) if (f.incoming[i].id === id) { f.incoming.splice(i, 1); break; }
    if (typeof saveState === 'function') saveState();
    this.updateBadge();
    this.render();
  },

  acceptAll: function () {
    var f = this.ctx.state.friends;
    if (!f.incoming.length) return;
    if (!confirm('قبول جميع الطلبات (' + f.incoming.length + ')؟')) return;
    var n = f.incoming.length;
    while (f.incoming.length) {
      var r = f.incoming.shift();
      f.list.push({ id: r.id, name: r.name, emoji: r.emoji, level: r.level, addedAt: Date.now() });
      if (!f.messages[r.id]) f.messages[r.id] = [];
    }
    if (typeof saveState === 'function') saveState();
    if (typeof showMessage === 'function') showMessage('✅ قبلت ' + n + ' طلب');
    this.updateBadge();
    this.render();
  },

  rejectAll: function () {
    var f = this.ctx.state.friends;
    if (!f.incoming.length) return;
    if (!confirm('رفض جميع الطلبات (' + f.incoming.length + ')؟')) return;
    var n = f.incoming.length;
    f.incoming = [];
    if (typeof saveState === 'function') saveState();
    if (typeof showMessage === 'function') showMessage('رفضت ' + n + ' طلب');
    this.updateBadge();
    this.render();
  },

  cancelOutgoing: function (id) {
    var f = this.ctx.state.friends;
    for (var i = 0; i < f.outgoing.length; i++) if (f.outgoing[i].id === id) { f.outgoing.splice(i, 1); break; }
    if (typeof saveState === 'function') saveState();
    this.render();
  },

  removeFriend: function (id) {
    if (!confirm('إزالة هذا الصديق؟')) return;
    var f = this.ctx.state.friends;
    for (var i = 0; i < f.list.length; i++) if (f.list[i].id === id) { f.list.splice(i, 1); break; }
    if (typeof saveState === 'function') saveState();
    if (typeof showMessage === 'function') showMessage('تمت الإزالة');
    this.updateBadge();
    this.render();
  },

  blockUser: function (id) {
    if (!confirm('حظر هذا اللاعب؟ سيُلغى أي صداقة بينكما.')) return;
    var f = this.ctx.state.friends;
    var person = null;
    for (var i = 0; i < f.list.length; i++) if (f.list[i].id === id) { person = f.list[i]; f.list.splice(i, 1); break; }
    for (var j = 0; j < f.incoming.length; j++) if (f.incoming[j].id === id) { person = person || f.incoming[j]; f.incoming.splice(j, 1); break; }
    for (var k = 0; k < f.outgoing.length; k++) if (f.outgoing[k].id === id) { person = person || f.outgoing[k]; f.outgoing.splice(k, 1); break; }
    if (!person) person = this.findBot(id);
    if (person) f.blocked.push({ id: person.id, name: person.name, emoji: person.emoji, level: person.level, blockedAt: Date.now() });
    if (typeof saveState === 'function') saveState();
    if (typeof showMessage === 'function') showMessage('🚫 تم الحظر');
    this.updateBadge();
    this.render();
  },

  unblockUser: function (id) {
    var f = this.ctx.state.friends;
    for (var i = 0; i < f.blocked.length; i++) if (f.blocked[i].id === id) { f.blocked.splice(i, 1); break; }
    if (typeof saveState === 'function') saveState();
    if (typeof showMessage === 'function') showMessage('✅ رُفع الحظر');
    this.render();
  },

  reportUser: function (id) {
    var person = this.findPerson(id);
    if (!person) return;
    if (!confirm('إبلاغ عن ' + person.name + '؟\nسيتم إرسال بلاغ للإدارة.')) return;
    if (typeof showMessage === 'function') showMessage('⚠️ تم إرسال البلاغ — شكراً لك');
    if (typeof beep === 'function') beep(440, 0.15);
  },

  doSearch: function () {
    var q = (this._searchQuery || '').trim().toLowerCase();
    if (!q) { this._searchResults = []; this.render(); return; }
    var f = this.ctx.state.friends;
    var out = [];
    for (var i = 0; i < this.BOTS.length; i++) {
      var b = this.BOTS[i];
      if (b.name.toLowerCase().indexOf(q) < 0 && b.id.toLowerCase().indexOf(q) < 0) continue;
      var skip = false;
      for (var j = 0; j < f.blocked.length; j++) if (f.blocked[j].id === b.id) { skip = true; break; }
      if (skip) continue;
      out.push(b);
    }
    this._searchResults = out;
    this.render();
  },

  toggleRequests: function () {
    var f = this.ctx.state.friends;
    f.settings.requestsClosed = !f.settings.requestsClosed;
    if (typeof saveState === 'function') saveState();
    if (typeof showMessage === 'function') showMessage(f.settings.requestsClosed ? '🔒 أوقفت استقبال الطلبات' : '✅ مفعّل استقبال الطلبات');
    this.render();
  },

  setWhoCanMessage: function (v) {
    var f = this.ctx.state.friends;
    f.settings.whoCanMessage = v || 'friends';
    if (typeof saveState === 'function') saveState();
    this.render();
  },

  toggleRead: function () {
    var f = this.ctx.state.friends;
    f.settings.readReceipts = !f.settings.readReceipts;
    if (typeof saveState === 'function') saveState();
    this.render();
  },

  editStatus: function () {
    var f = this.ctx.state.friends;
    var cur = f.settings.statusMessage || '';
    var n = prompt('النص الشخصي (يظهر للأصدقاء):', cur);
    if (n === null) return;
    f.settings.statusMessage = n.slice(0, 60);
    if (typeof saveState === 'function') saveState();
    this.render();
    if (typeof showMessage === 'function') showMessage('✅ تم حفظ النص');
  },

  // ═══════ RENDER ═══════
  render: function () {
    var inner = document.getElementById('fr-inner');
    if (!inner || !this.ctx) return;
    var f = this.ctx.state.friends;
    var incoming = f.incoming.length;
    var unread = this.countUnread();

    var h = '';
    h += '<div class="fr-top">';
    h +=   '<button class="fr-back" data-fr="close">←</button>';
    h +=   '<div class="fr-title">👥 الأصدقاء</div>';
    h +=   '<div style="width:38px"></div>';
    h += '</div>';

    h += '<div class="fr-tabs">';
    for (var i = 0; i < this.TABS.length; i++) {
      var t = this.TABS[i];
      var on = this._tab === t.id;
      var cnt = 0;
      if (t.id === 'requests') cnt = incoming;
      h += '<button class="fr-tab' + (on ? ' on' : '') + '" data-fr="tab" data-v="' + t.id + '">';
      h +=   '<span class="em">' + t.emoji + '</span><span>' + t.label + '</span>';
      if (cnt > 0) h += '<span class="cnt">' + cnt + '</span>';
      h += '</button>';
    }
    h += '</div>';

    h += '<div class="fr-body">';
    if (this._tab === 'friends')       h += this.renderFriendsTab();
    else if (this._tab === 'requests') h += this.renderRequestsTab();
    else if (this._tab === 'search')   h += this.renderSearchTab();
    else if (this._tab === 'blocked')  h += this.renderBlockedTab();
    else if (this._tab === 'settings') h += this.renderSettingsTab();
    h += '</div>';

    inner.innerHTML = h;
  },

  renderFriendsTab: function () {
    var f = this.ctx.state.friends;
    var total = f.list.length;
    var q = (this._friendSearch || '').toLowerCase();

    // filter
    var filtered = f.list.filter(function (p) {
      if (q && p.name.toLowerCase().indexOf(q) < 0) return false;
      return true;
    });

    var self = this;
    if (this._filter === 'online') {
      filtered = filtered.filter(function (p) {
        var s = self.botStatus(p.id);
        return s === 'online' || s === 'game';
      });
    }

    filtered = filtered.slice().sort(function (a, b) {
      var sa = self.statusRank(self.botStatus(a.id));
      var sb = self.statusRank(self.botStatus(b.id));
      if (sa !== sb) return sa - sb;
      return b.addedAt - a.addedAt;
    });

    var h = '';
    // كرت "أنا"
    var st = this.ctx.state;
    var meStatus = (f.settings.statusMessage || '').trim();
    var meLevel = (typeof levelOf === 'function') ? levelOf(st.xp || 0) : 1;
    h += '<div class="fr-section" style="background:linear-gradient(180deg,rgba(252,191,73,.1),rgba(15,25,45,.8));border-color:rgba(252,191,73,.5)">';
    h +=   '<div style="display:flex;align-items:center;gap:10px">';
    h +=     '<div class="fr-av" style="border-color:#fcd34d;box-shadow:0 0 12px rgba(252,191,73,.5)">🧑‍✈️<span class="dot on"></span></div>';
    h +=     '<div class="fr-info">';
    h +=       '<div class="fr-name">' + this.esc(st.name || 'القبطان') + ' <span style="color:#94a3b8;font-size:10px">(أنت)</span></div>';
    h +=       '<div class="fr-meta"><span class="lv">Lv' + meLevel + '</span><span style="color:#86efac;font-weight:800">🟢 متصل الآن</span></div>';
    h +=       '<div class="fr-bio" style="color:' + (meStatus ? '#fcd34d' : '#64748b') + ';margin-top:3px">' + (meStatus ? this.esc(meStatus) : 'اضغط لتعديل النص الشخصي') + '</div>';
    h +=     '</div>';
    h +=     '<button class="fr-btn gold" data-fr="set-status" title="تعديل">✏️</button>';
    h +=   '</div>';
    h += '</div>';

    h += '<div class="fr-section">';
    h +=   '<h3>👥 أصدقائي <span class="cnt">' + total + ' / ' + this.MAX_FRIENDS + '</span></h3>';

    if (!f.list.length) {
      h += '<div class="fr-empty" style="padding:24px 12px"><div class="big">👥</div>ما عندك أصدقاء بعد<br><br>روح تبويب <b>بحث</b> وأضف قباطنة</div>';
    } else {
      h += '<div class="fr-search"><input id="fr-friend-filter" type="text" placeholder="ابحث في أصدقائك..." value="' + this.esc(this._friendSearch) + '" maxlength="30"></div>';
      h += '<div class="fr-chips">';
      h +=   '<button class="fr-chip' + (this._filter === 'all' ? ' on' : '') + '" data-fr="chip" data-v="all">الكل (' + total + ')</button>';
      var onlineCount = 0;
      for (var ci = 0; ci < f.list.length; ci++) { var cs = this.botStatus(f.list[ci].id); if (cs === 'online' || cs === 'game') onlineCount++; }
      h +=   '<button class="fr-chip' + (this._filter === 'online' ? ' on' : '') + '" data-fr="chip" data-v="online">متصل (' + onlineCount + ')</button>';
      h += '</div>';

      if (!filtered.length) {
        h += '<div class="fr-empty" style="padding:20px 12px">لا نتائج مطابقة</div>';
      } else {
        for (var i = 0; i < filtered.length; i++) {
          h += this.personRow(filtered[i], 'friend');
        }
      }
    }
    h += '</div>';
    return h;
  },

  renderRequestsTab: function () {
    var f = this.ctx.state.friends;
    var h = '';
    if (f.incoming.length) {
      h += '<div class="fr-section">';
      h +=   '<h3>📥 طلبات واردة <span class="cnt">' + f.incoming.length + '</span></h3>';
      h +=   '<div style="display:flex;gap:6px;margin-bottom:8px">';
      h +=     '<button class="fr-btn green" data-fr="accept-all" style="flex:1">قبول الكل</button>';
      h +=     '<button class="fr-btn red" data-fr="reject-all" style="flex:1">رفض الكل</button>';
      h +=   '</div>';
      for (var i = 0; i < f.incoming.length; i++) h += this.personRow(f.incoming[i], 'incoming');
      h += '</div>';
    }
    if (f.outgoing.length) {
      h += '<div class="fr-section">';
      h +=   '<h3>📤 طلبات مُرسلة <span class="cnt">' + f.outgoing.length + '</span></h3>';
      for (var j = 0; j < f.outgoing.length; j++) h += this.personRow(f.outgoing[j], 'outgoing');
      h += '</div>';
    }
    if (!f.incoming.length && !f.outgoing.length) {
      h += '<div class="fr-empty"><div class="big">📬</div>لا توجد طلبات حالياً</div>';
    }
    return h;
  },

  renderSearchTab: function () {
    var h = '';
    h += '<div class="fr-section">';
    h +=   '<h3>🔍 ابحث عن قباطنة</h3>';
    h +=   '<div class="fr-search">';
    h +=     '<input id="fr-search-input" type="text" placeholder="اسم القبطان..." value="' + this.esc(this._searchQuery) + '" maxlength="30">';
    h +=     '<button class="fr-btn gold" data-fr="do-search">بحث</button>';
    h +=   '</div>';
    if (this._searchResults && this._searchResults.length) {
      for (var i = 0; i < this._searchResults.length; i++) h += this.personRow(this._searchResults[i], 'search');
    } else if (this._searchQuery) {
      h += '<div class="fr-empty" style="padding:20px">لا نتائج مطابقة</div>';
    } else {
      h += '<div class="fr-empty" style="padding:20px 12px"><div class="big">🔍</div>اكتب اسم للبحث</div>';
    }
    h += '</div>';
    return h;
  },

  renderBlockedTab: function () {
    var f = this.ctx.state.friends;
    var h = '';
    if (!f.blocked.length) {
      h += '<div class="fr-empty"><div class="big">🚫</div>قائمة المحظورين فاضية</div>';
    } else {
      h += '<div class="fr-section">';
      h +=   '<h3>🚫 المحظورون <span class="cnt">' + f.blocked.length + '</span></h3>';
      for (var i = 0; i < f.blocked.length; i++) h += this.personRow(f.blocked[i], 'blocked');
      h += '</div>';
    }
    return h;
  },

  renderSettingsTab: function () {
    var f = this.ctx.state.friends;
    var s = f.settings;
    var h = '';
    h += '<div class="fr-section">';
    h +=   '<h3>💬 النص الشخصي</h3>';
    h +=   '<div class="fr-status-box' + (s.statusMessage ? ' filled' : '') + '" data-fr="set-status">';
    h +=     s.statusMessage ? this.esc(s.statusMessage) : 'اضغط لكتابة نص يظهر لأصدقائك...';
    h +=   '</div>';
    h += '</div>';

    h += '<div class="fr-section">';
    h +=   '<h3>⚙️ إعدادات الصداقة</h3>';
    h +=   '<div class="fr-setrow">';
    h +=     '<div style="flex:1"><div class="lbl">إيقاف استقبال الطلبات</div><div class="sub">لن يستطيع أحد إرسال طلب صداقة لك</div></div>';
    h +=     '<div class="fr-switch' + (s.requestsClosed ? ' on' : '') + '" data-fr="toggle-requests"><div class="knob"></div></div>';
    h +=   '</div>';
    h += '</div>';

    h += '<div class="fr-section">';
    h +=   '<h3>💌 الرسائل</h3>';
    h +=   '<div class="fr-setrow">';
    h +=     '<div style="flex:1"><div class="lbl">من يستطيع مراسلتي</div><div class="sub">تحكّم في الرسائل الخاصة</div></div>';
    h +=     '<select class="fr-select" data-fr="set-msg">';
    h +=       '<option value="all"' + (s.whoCanMessage === 'all' ? ' selected' : '') + '>الجميع</option>';
    h +=       '<option value="friends"' + (s.whoCanMessage === 'friends' ? ' selected' : '') + '>الأصدقاء فقط</option>';
    h +=       '<option value="none"' + (s.whoCanMessage === 'none' ? ' selected' : '') + '>لا أحد</option>';
    h +=     '</select>';
    h +=   '</div>';
    h +=   '<div class="fr-setrow">';
    h +=     '<div style="flex:1"><div class="lbl">إشارات القراءة</div><div class="sub">عرض علامة "تم القراءة"</div></div>';
    h +=     '<div class="fr-switch' + (s.readReceipts ? ' on' : '') + '" data-fr="toggle-read"><div class="knob"></div></div>';
    h +=   '</div>';
    h += '</div>';

    h += '<div class="fr-section">';
    h +=   '<h3>i️ معلومات</h3>';
    h +=   '<div style="font-size:11px;color:#94a3b8;line-height:1.8;text-align:center;padding:6px">';
    h +=     'نظام الأصدقاء v3.0.0<br>أصدقاء: ' + f.list.length + '/' + this.MAX_FRIENDS + ' · طلبات: ' + f.incoming.length + ' · محظورون: ' + f.blocked.length;
    h +=   '</div>';
    h += '</div>';
    return h;
  },

  personRow: function (p, kind) {
    if (!p) return '';
    var status = this.botStatus(p.id);
    var f = this.ctx.state.friends;
    var unreadCount = 0;
    if (kind === 'friend') {
      var msgs = f.messages[p.id] || [];
      for (var i = 0; i < msgs.length; i++) if (msgs[i].from === 'them' && !msgs[i].read) unreadCount++;
    }
    var last = '';
    if (kind === 'friend') {
      var arr = f.messages[p.id] || [];
      if (arr.length) { var lm = arr[arr.length - 1]; last = (lm.from === 'me' ? 'أنا: ' : '') + lm.text; }
    }

    var dotCls = status === 'online' ? 'on' : (status === 'game' ? 'game' : (status === 'away' ? 'away' : ''));
    var statusTxt = this.statusLabel(status, p.id);

    var h = '';
    var rowAttr = (kind === 'friend') ? (' data-fr="open-chat" data-v="' + p.id + '"') : '';
    h += '<div class="fr-prow' + (unreadCount > 0 ? ' unread' : '') + '"' + rowAttr + '>';
    h +=   '<div class="fr-av">' + this.esc(p.emoji || '🧑‍✈️') + '<span class="dot ' + dotCls + '"></span></div>';
    h +=   '<div class="fr-info">';
    h +=     '<div class="fr-name">' + this.esc(p.name) + '</div>';
    h +=     '<div class="fr-meta"><span class="lv">Lv' + (p.level || '?') + '</span>';
    if (status === 'game') h += '<span class="loc">' + this.esc(statusTxt) + '</span>';
    else h += '<span>' + this.esc(statusTxt) + '</span>';
    h +=     '</div>';
    if (last && kind === 'friend') {
      h += '<div class="fr-preview' + (unreadCount > 0 ? ' unread' : '') + '">' + this.esc(last) + (unreadCount > 0 ? ' · ' + unreadCount + ' جديد' : '') + '</div>';
    } else if (p.bio && kind !== 'friend') {
      h += '<div class="fr-bio">' + this.esc(p.bio) + '</div>';
    } else if (p.bio && kind === 'friend') {
      h += '<div class="fr-bio">' + this.esc(p.bio) + '</div>';
    }
    h +=   '</div>';

    h +=   '<div class="fr-actions">';
    if (kind === 'friend') {
      h += '<button class="fr-btn dots" data-fr="menu" data-v="' + p.id + '">⋯</button>';
    } else if (kind === 'incoming') {
      h += '<button class="fr-btn green" data-fr="accept" data-v="' + p.id + '">قبول</button>';
      h += '<button class="fr-btn red" data-fr="reject" data-v="' + p.id + '">رفض</button>';
    } else if (kind === 'outgoing') {
      h += '<button class="fr-btn" data-fr="cancel-out" data-v="' + p.id + '">إلغاء</button>';
    } else if (kind === 'search') {
      if (this.hasFriend(p.id)) h += '<span class="fr-badge ok">صديق ✓</span>';
      else if (this.isIncoming(p.id)) h += '<span class="fr-badge in">طلب وارد</span>';
      else if (this.isOutgoing(p.id)) h += '<span class="fr-badge out">مُرسل</span>';
      else h += '<button class="fr-btn gold" data-fr="send-request" data-v="' + p.id + '">+ صديق</button>';
    } else if (kind === 'blocked') {
      h += '<button class="fr-btn green" data-fr="unblock" data-v="' + p.id + '">رفع الحظر</button>';
    }
    h +=   '</div>';
    h += '</div>';
    return h;
  },

  esc: function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c];
    });
  }
});
