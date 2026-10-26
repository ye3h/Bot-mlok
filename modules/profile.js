// modules/profile.js — البروفايل (v2.1.0)
ModuleRegistry.register({
  id: 'profile',
  name: 'البروفايل',
  version: '2.1.0',
  dependencies: [],

  ctx: null,
  _editing: false,
  MAX_FILE_BYTES: 15 * 1024 * 1024,
  AVATAR_PX: 128,

  init: function (ctx) {
    this.ctx = ctx;
    this.injectCSS();
    this.bindPlayerBox();
  },

  bindPlayerBox: function () {
    var self = this;
    var pBox = document.getElementById('playerBox');
    if (pBox) pBox.onclick = function () { self.open(); };
  },

  open: function () {
    if (typeof openScreen === 'function') openScreen('profile');
    this.render();
  },

  onScreenOpen: function (ctx, name) {
    if (name === 'profile') this.render();
  },

  /* ═══════════ العرض ═══════════ */
  render: function () {
    var body = document.getElementById('profileBody');
    if (!body || !this.ctx) return;
    var st = this.ctx.state;
    var U = window.UsernameUtil;
    var lvl = typeof levelOf === 'function' ? levelOf(st.xp) : 1;
    var s = st.stats || {};

    var tribeName = 'بدون قبيلة';
    var t = window.ModuleRegistry.get('tribe');
    if (t && t.myTribe && t.myTribe()) tribeName = t.myTribe().name;

    var avatarHtml = st.avatar
      ? '<img src="' + st.avatar + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">'
      : '🧑‍✈️';
    var uname = st.username
      ? (U ? U.formatUsername(st.username) : '@' + st.username)
      : 'لا يوجد اسم مستخدم';

    var h = '';
    h += '<div class="hero pf-hero">';
    h +=   '<div class="pf-avatar">' + avatarHtml + '</div>';
    h +=   '<div class="pf-name">' + this.esc(st.name || 'القبطان') + '</div>';
    h +=   '<div class="pf-user">' + this.esc(uname) + '</div>';
    h +=   '<div class="pf-lvl">المستوى ' + lvl + '</div>';
    h +=   '<div class="pf-bio">' + (st.bio ? this.esc(st.bio) : '<span class="pf-muted">لا يوجد بايو</span>') + '</div>';
    h +=   '<button class="btn gold pf-edit" data-pf="edit">✏️ تعديل البروفايل</button>';
    h += '</div>';

    h += '<div class="card pf-row"><div class="info"><div class="nm">🏴 القبيلة</div></div><div class="pf-val">' + this.esc(tribeName) + '</div></div>';

    h += '<div class="pf-title">📊 الإحصائيات</div>';
    h += '<div class="stat-grid">';
    h += this.stat(s.caught || 0, 'سمكة مصطادة');
    h += this.stat(s.trips || 0, 'رحلة');
    h += this.stat(s.sold || 0, 'سمكة مباعة');
    h += this.stat(s.earned || 0, 'ذهب من البيع');
    h += this.stat((st.boss && st.boss.bossCount) || 0, 'وحش مقتول');
    h += this.stat((st.arena && st.arena.wins) || 0, 'انتصار أرينا');
    h += '</div>';

    body.innerHTML = h;
    this.bindBody(body);
  },

  stat: function (v, k) {
    return '<div class="stat"><div class="v">' + Number(v).toLocaleString() + '</div><div class="k">' + k + '</div></div>';
  },

  bindBody: function (body) {
    var self = this;
    if (body._pfBound) return;
    body._pfBound = true;
    body.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-pf]') : null;
      if (b && b.getAttribute('data-pf') === 'edit') self.openEdit();
    });
  },

  /* ═══════════ نافذة التعديل ═══════════ */
  openEdit: function () {
    if (this._editing) return;
    this._editing = true;
    var st = this.ctx.state;

    var wrap = document.createElement('div');
    wrap.id = 'pf-edit';
    wrap.className = 'pf-wrap';
    wrap.innerHTML =
      '<div class="pf-card">' +
        '<div class="pf-head"><span>✏️ تعديل البروفايل</span><button class="pf-x" data-pfe="close">✕</button></div>' +

        '<div class="pf-photo">' +
          '<div class="pf-avatar pf-avatar-lg" id="pfePreview">' + (st.avatar ? '<img src="' + st.avatar + '" alt="">' : '🧑‍✈️') + '</div>' +
          '<button class="pf-btn ghost" data-pfe="pick">📷 اختر صورة</button>' +
          '<input type="file" id="pfeFile" class="pf-file" accept="image/*">' +
          '<button class="pf-btn ghost" data-pfe="removeAvatar">🗑 إزالة</button>' +
        '</div>' +

        '<label class="pf-lbl">اسم القبطان (عربي)</label>' +
        '<input class="pf-in" id="pfeName" maxlength="14" value="' + this.esc(st.name || '') + '">' +

        '<label class="pf-lbl">اسم المستخدم <span class="pf-muted">(4 إلى 16 حرف إنجليزي أو رقم أو - _ .)</span></label>' +
        '<div class="pf-userbox"><span class="pf-at">@</span>' +
          '<input class="pf-in pf-in-user" id="pfeUser" maxlength="17" dir="ltr" value="' + this.esc(st.username || '') + '" placeholder="username">' +
        '</div>' +
        '<div class="pf-err" id="pfeUserErr"></div>' +

        '<label class="pf-lbl">البايو <span class="pf-muted" id="pfeBioCount">' + (st.bio || '').length + '/150</span></label>' +
        '<textarea class="pf-in pf-area" id="pfeBio" maxlength="150" placeholder="اكتب نبذة قصيرة، بدون روابط">' + this.esc(st.bio || '') + '</textarea>' +
        '<div class="pf-err" id="pfeBioErr"></div>' +

        '<div class="pf-btns">' +
          '<button class="pf-btn" data-pfe="cancel">إلغاء</button>' +
          '<button class="pf-btn gold" data-pfe="save">💾 حفظ</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(wrap);
    this.bindEdit(wrap);
  },

  bindEdit: function (wrap) {
    var self = this;
    var pending = { avatar: null, removed: false };

    wrap.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-pfe]') : null;
      if (!b) return;
      var act = b.getAttribute('data-pfe');

      if (act === 'pick') {
        var fi = document.getElementById('pfeFile');
        if (fi) fi.click();
        return;
      }
      if (act === 'close' || act === 'cancel') { self.closeEdit(); return; }
      if (act === 'removeAvatar') {
        pending.removed = true;
        pending.avatar = null;
        document.getElementById('pfePreview').innerHTML = '🧑‍✈️';
        return;
      }
      if (act === 'save') self.saveEdit(pending);
    });

    wrap.querySelector('#pfeBio').addEventListener('input', function () {
      document.getElementById('pfeBioCount').textContent = this.value.length + '/150';
    });

    wrap.querySelector('#pfeFile').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!f) return;
      self.resizeImage(f, self.AVATAR_PX, function (dataUrl) {
        if (!dataUrl) { self.toast('❌ تعذّر قراءة الصورة'); return; }
        pending.avatar = dataUrl;
        pending.removed = false;
        document.getElementById('pfePreview').innerHTML = '<img src="' + dataUrl + '" alt="">';
      });
    });
  },

  // تصغير الصورة إلى مربع بحجم size عبر createObjectURL (بدون تحويل الملف كله إلى نص)
  resizeImage: function (file, size, cb) {
    var self = this;
    if (!file || file.size > this.MAX_FILE_BYTES) {
      this.toast('⚠️ الصورة كبيرة جداً، اختر صورة أصغر');
      cb(null);
      return;
    }

    var url = null;
    try { url = URL.createObjectURL(file); } catch (e) { cb(null); return; }

    var img = new Image();
    img.onload = function () {
      try {
        var m = Math.min(img.naturalWidth, img.naturalHeight);
        var sx = (img.naturalWidth - m) / 2;
        var sy = (img.naturalHeight - m) / 2;

        var c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        var g = c.getContext('2d');
        g.imageSmoothingQuality = 'high';
        g.drawImage(img, sx, sy, m, m, 0, 0, size, size);

        var out = c.toDataURL('image/jpeg', 0.85);

        c.width = 0; c.height = 0;
        URL.revokeObjectURL(url);
        img.src = '';
        cb(out);
      } catch (e) {
        try { URL.revokeObjectURL(url); } catch (x) {}
        cb(null);
      }
    };
    img.onerror = function () {
      try { URL.revokeObjectURL(url); } catch (e) {}
      cb(null);
    };
    img.src = url;
  },

  saveEdit: function (pending) {
    var U = window.UsernameUtil;
    var st = this.ctx.state;
    var self = this;

    var nameRaw = (document.getElementById('pfeName').value || '').replace(/[<>"'`]/g, '').trim().slice(0, 14);
    if (!nameRaw) { this.toast('⚠️ اسم القبطان مطلوب'); return; }

    var userRes = U.validateUsername(document.getElementById('pfeUser').value);
    this.setErr('pfeUserErr', userRes.ok ? '' : userRes.error);
    if (!userRes.ok) return;

    var bioRes = U.validateBio(document.getElementById('pfeBio').value);
    this.setErr('pfeBioErr', bioRes.ok ? '' : bioRes.error);
    if (!bioRes.ok) return;

    var newUser = userRes.value;
    var changedUser = newUser.toLowerCase() !== (st.username || '').toLowerCase();

    var apply = function (available) {
      if (available === false) { self.setErr('pfeUserErr', 'الاسم مستخدم من لاعب آخر'); return; }
      st.name = nameRaw;
      st.username = newUser;
      st.bio = bioRes.value;
      if (pending.removed) st.avatar = '';
      else if (pending.avatar) st.avatar = pending.avatar;

      if (typeof saveState === 'function') saveState();
      if (typeof render === 'function') render();
      self.toast('✅ تم حفظ البروفايل');
      self.closeEdit();
      self.render();
    };

    if (!changedUser) { apply(true); return; }

    U.checkUsernameAvailable(newUser).then(function (r) {
      if (r.source === 'error') { self.setErr('pfeUserErr', r.error); return; }
      apply(r.available);
    });
  },

  closeEdit: function () {
    var w = document.getElementById('pf-edit');
    if (w && w.parentNode) w.parentNode.removeChild(w);
    this._editing = false;
  },

  setErr: function (id, msg) {
    var el = document.getElementById(id);
    if (el) el.textContent = msg || '';
  },

  toast: function (m) {
    if (typeof showMessage === 'function') showMessage(m);
  },

  esc: function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  },

  /* ═══════════ CSS ═══════════ */
  injectCSS: function () {
    if (document.getElementById('_pf_css')) return;
    var c = [
      '.pf-hero{text-align:center;padding:22px 14px;margin-bottom:14px}',
      '.pf-avatar{width:84px;height:84px;margin:0 auto 10px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:40px;background:radial-gradient(circle at 30% 30%,#2a4a75,#0b1d33);border:3px solid var(--gold);box-shadow:0 0 18px var(--gold-glow)}',
      '.pf-avatar-lg{width:96px;height:96px;margin:0}',
      '.pf-avatar img{width:100%;height:100%;object-fit:cover}',
      '.pf-name{font-size:20px;font-weight:900;color:#FFE9A8}',
      '.pf-user{font-size:13px;color:var(--gold);margin-top:3px;direction:ltr}',
      '.pf-lvl{display:inline-block;margin-top:8px;font-size:12px;color:var(--gold);background:rgba(255,215,106,.1);padding:3px 12px;border-radius:10px;border:1px solid var(--line)}',
      '.pf-bio{margin:12px auto 14px;max-width:300px;font-size:12px;line-height:1.7;color:var(--text);word-break:break-word}',
      '.pf-muted{color:var(--muted);font-size:11px}',
      '.pf-edit{min-width:150px}',
      '.pf-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}',
      '.pf-val{color:var(--gold);font-weight:800;font-size:14px}',
      '.pf-title{font-weight:900;color:var(--gold);margin-bottom:10px;font-size:15px}',

      '.pf-wrap{position:fixed;inset:0;z-index:260;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:14px;direction:rtl;font-family:inherit}',
      '.pf-card{width:100%;max-width:360px;max-height:92vh;overflow-y:auto;border-radius:20px;padding:16px;color:#fff;',
      'background:linear-gradient(180deg,rgba(20,36,60,.98),rgba(8,16,30,.99));border:1.5px solid var(--line);box-shadow:0 20px 50px rgba(0,0,0,.8)}',
      '.pf-head{display:flex;justify-content:space-between;align-items:center;font-size:16px;font-weight:900;color:var(--gold);margin-bottom:12px}',
      '.pf-x{width:32px;height:32px;border-radius:50%;border:1px solid var(--line);background:rgba(0,0,0,.4);color:#fff;cursor:pointer}',
      '.pf-photo{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:10px}',
      '.pf-file{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;left:0;top:0}',
      '.pf-lbl{display:block;font-size:12px;font-weight:800;color:var(--gold);margin:10px 2px 5px}',
      '.pf-in{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:12px;border:1.5px solid var(--line);background:rgba(0,0,0,.45);color:#fff;font-family:inherit;font-size:14px}',
      '.pf-in-user{direction:ltr;text-align:left;border-radius:0 12px 12px 0}',
      '.pf-userbox{display:flex;align-items:stretch;direction:ltr}',
      '.pf-at{display:flex;align-items:center;padding:0 12px;border:1.5px solid var(--line);border-right:none;border-radius:12px 0 0 12px;background:rgba(255,215,106,.12);color:var(--gold);font-weight:900}',
      '.pf-area{min-height:78px;resize:none;direction:rtl}',
      '.pf-err{min-height:16px;font-size:11px;color:#fca5a5;margin-top:4px}',
      '.pf-btns{display:flex;gap:8px;margin-top:12px}',
      '.pf-btn{flex:1;padding:11px;border-radius:12px;border:1.5px solid var(--line);background:rgba(0,0,0,.35);color:#fff;font-family:inherit;font-weight:800;font-size:13px;cursor:pointer;text-align:center}',
      '.pf-btn.gold{background:linear-gradient(180deg,#FFE9A8,#C9962A);color:#3a2506;border-color:var(--gold)}',
      '.pf-btn.ghost{flex:0 0 auto;padding:7px 12px;font-size:12px}'
    ].join('');
    var s = document.createElement('style');
    s.id = '_pf_css';
    s.textContent = c;
    document.head.appendChild(s);
  }
});
