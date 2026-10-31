// modules/profile.js — البروفايل (تصميم فاخر واحترافي Luxury Edition v3.0)
ModuleRegistry.register({
  id: 'profile',
  name: 'البروفايل',
  version: '3.0.0',
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

  /* ═══════════ العرض الفاخر (Luxury Render) ═══════════ */
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
      ? '<img src="' + st.avatar + '" alt="">'
      : '<span style="font-size:42px;">🧑‍✈️</span>';
    var uname = st.username
      ? (U ? U.formatUsername(st.username) : '@' + st.username)
      : '@captain';

    var h = '';
    h += '<div class="lux-profile-container">';
    
    // بطاقة الهوية الملكية الفاخرة
    h +=   '<div class="lux-hero-card">';
    h +=     '<div class="lux-avatar-frame"><div class="lux-avatar-inner">' + avatarHtml + '</div></div>';
    h +=     '<div class="lux-captain-name">' + this.esc(st.name || 'القبطان') + '</div>';
    
    h +=     '<div class="lux-user-badge" onclick="navigator.clipboard.writeText(\'' + (st.username || 'captain') + '\'); if(typeof showMessage===\'function\')showMessage(\'📋 تم نسخ المعرف الملكي!\');" title="انقر لنسخ المعرف">';
    h +=       '<span>' + this.esc(uname) + '</span> <span style="font-size:10px; opacity:0.7;">📋</span>';
    h +=     '</div>';

    h +=     '<div class="lux-level-pill">⭐ مستوى القبطان ' + lvl + '</div>';

    // الأوسمة الملكية
    h +=     '<div class="lux-badges-container">';
    h +=       '<span class="lux-badge">⚓ بحار مخضرم</span>';
    if (s.boss && s.boss.bossCount > 0) h += '<span class="lux-badge">🐉 صائد الأساطير</span>';
    if (s.arena && s.arena.wins > 0) h += '<span class="lux-badge">⚔️ بطل الساحة</span>';
    h +=     '</div>';

    h +=     '<div class="lux-bio-box">' + (st.bio ? this.esc(st.bio) : '<span style="opacity:0.5;">لم يكتب القبطان نبذة شخصية بعد...</span>') + '</div>';
    
    h +=     '<button class="lux-edit-btn" data-pf="edit">✏️ تعديل الملف الملكي</button>';
    h +=   '</div>';

    // خانة القبيلة
    h +=   '<div class="lux-tribe-card">';
    h +=     '<div class="lux-tribe-info"><span>🏴 القبيلة الحالية</span></div>';
    h +=     '<div class="lux-tribe-value">' + this.esc(tribeName) + '</div>';
    h +=   '</div>';

    // إحصائيات الأبطال الفاخرة
    h +=   '<div class="lux-section-title">📊 سجل المجد والإنجازات</div>';
    h +=   '<div class="lux-stats-grid">';
    h +=     this.statCard(s.caught || 0, 'سمكة مصطادة', '🐟');
    h +=     this.statCard(s.trips || 0, 'رحلة بحرية', '⛵');
    h +=     this.statCard(s.sold || 0, 'أسماك مباعة', '💰');
    h +=     this.statCard(s.earned || 0, 'ذهب الأرباح', '🪙');
    h +=     this.statCard((st.boss && st.boss.bossCount) || 0, 'وحوش مهزومة', '🐉');
    h +=     this.statCard((st.arena && st.arena.wins) || 0, 'انتصارات الأرينا', '⚔️');
    h +=   '</div>';

    h += '</div>';

    body.innerHTML = h;
    this.bindBody(body);
  },

  statCard: function (v, k, icon) {
    return '<div class="lux-stat-card"><div class="lux-stat-icon">' + icon + '</div><div class="lux-stat-val">' + Number(v).toLocaleString() + '</div><div class="lux-stat-lbl">' + k + '</div></div>';
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

  /* ═══════════ نافذة التعديل الفاخرة (Luxury Modal) ═══════════ */
  openEdit: function () {
    if (this._editing) return;
    this._editing = true;
    var st = this.ctx.state;

    var wrap = document.createElement('div');
    wrap.id = 'pf-edit';
    wrap.className = 'lux-modal-backdrop';
    wrap.innerHTML =
      '<div class="lux-modal-card">' +
        '<div class="lux-modal-header"><span>👑 تعديل الهوية الملكية</span><button class="lux-close-x" data-pfe="close">✕</button></div>' +

        '<div class="lux-edit-photo-section">' +
          '<div class="lux-avatar-frame lux-avatar-lg" id="pfePreview">' + (st.avatar ? '<img src="' + st.avatar + '" alt="">' : '<span style="font-size:48px;">🧑‍✈️</span>') + '</div>' +
          '<div class="lux-photo-btns">' +
            '<button class="lux-btn-action" data-pfe="pick">📷 اختيار صورة</button>' +
            '<button class="lux-btn-action danger" data-pfe="removeAvatar">🗑 إزالة</button>' +
          '</div>' +
          '<input type="file" id="pfeFile" class="lux-hidden-input" accept="image/*">' +
        '</div>' +

        '<div class="lux-form-group">' +
          '<label class="lux-label">اسم القبطان</label>' +
          '<input class="lux-input" id="pfeName" maxlength="14" value="' + this.esc(st.name || '') + '">' +
        '</div>' +

        '<div class="lux-form-group">' +
          '<label class="lux-label">معرف المستخدم (Username)</label>' +
          '<div class="lux-username-box">' +
            '<span class="lux-at-symbol">@</span>' +
            '<input class="lux-input lux-input-user" id="pfeUser" maxlength="17" dir="ltr" value="' + this.esc(st.username || '') + '" placeholder="username">' +
          '</div>' +
          '<div class="lux-error-msg" id="pfeUserErr"></div>' +
        '</div>' +

        '<div class="lux-form-group">' +
          '<label class="lux-label">النبذة الشخصية (Bio) <span style="color:#d4af37;" id="pfeBioCount">' + (st.bio || '').length + '/150</span></label>' +
          '<textarea class="lux-input lux-textarea" id="pfeBio" maxlength="150" placeholder="اكتب نبذة ترهب بها أعداءك في البحار...">' + this.esc(st.bio || '') + '</textarea>' +
          '<div class="lux-error-msg" id="pfeBioErr"></div>' +
        '</div>' +

        '<div class="lux-modal-footer">' +
          '<button class="lux-btn-secondary" data-pfe="cancel">إلغاء</button>' +
          '<button class="lux-btn-primary" data-pfe="save">💾 حفظ التغييرات</button>' +
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
        if (fi) {
          try { fi.click(); } catch (err) { self.toast('⚠️ تعذّر فتح الألبوم'); }
        }
        return;
      }
      if (act === 'close' || act === 'cancel') { self.closeEdit(); return; }
      if (act === 'removeAvatar') {
        pending.removed = true;
        pending.avatar = null;
        document.getElementById('pfePreview').innerHTML = '<span style="font-size:48px;">🧑‍✈️</span>';
        return;
      }
      if (act === 'save') self.saveEdit(pending);
    });

    wrap.querySelector('#pfeBio').addEventListener('input', function () {
      document.getElementById('pfeBioCount').textContent = this.value.length + '/150';
    });

    var userIn = wrap.querySelector('#pfeUser');
    userIn.addEventListener('input', function () {
      var U = window.UsernameUtil;
      if (!U) return;
      var res = U.validateUsername(this.value);
      self.setErr('pfeUserErr', res.ok ? '✅ المعرف صالح' : res.error);
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
        URL.revokeObjectURL(url);
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
      if (available === false) { self.setErr('pfeUserErr', '⚠️ المعرف مستخدم بالفعل'); return; }
      st.name = nameRaw;
      st.username = newUser;
      st.bio = bioRes.value;
      if (pending.removed) st.avatar = '';
      else if (pending.avatar) st.avatar = pending.avatar;

      if (typeof saveState === 'function') saveState();
      if (typeof render === 'function') render();
      self.toast('👑 تم حفظ التعديلات الملكية بنجاح!');
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

  /* ═══════════ التصميم الملكي الفاخر (Luxury CSS) ═══════════ */
  injectCSS: function () {
    if (document.getElementById('_lux_pf_css')) return;
    var c = [
      '.lux-profile-container { padding: 4px; font-family: inherit; direction: rtl; }',
      
      /* بطاقة الهوية */
      '.lux-hero-card { background: linear-gradient(135deg, rgba(15, 28, 48, 0.95), rgba(8, 14, 26, 0.98)); border: 1.5px solid #d4af37; border-radius: 24px; padding: 24px 16px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,215,106,0.3); margin-bottom: 16px; position: relative; overflow: hidden; }',
      
      /* إطار الصورة الشخصية الملكي */
      '.lux-avatar-frame { width: 92px; height: 92px; margin: 0 auto 12px; border-radius: 50%; background: linear-gradient(135deg, #d4af37, #5a4209); padding: 3px; box-shadow: 0 0 20px rgba(212,175,55,0.4); }',
      '.lux-avatar-inner { width: 100%; height: 100%; border-radius: 50%; background: #07101d; display: flex; align-items: center; justify-content: center; overflow: hidden; }',
      '.lux-avatar-inner img { width: 100%; height: 100%; object-fit: cover; }',
      '.lux-avatar-lg { width: 104px; height: 104px; margin: 0 auto 14px; }',

      '.lux-captain-name { font-size: 22px; font-weight: 900; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.8); margin-bottom: 4px; letter-spacing: 0.5px; }',
      
      /* معرف المستخدم */
      '.lux-user-badge { display: inline-flex; align-items: center; gap: 4px; background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.3); padding: 4px 12px; border-radius: 20px; color: #d4af37; font-size: 13px; font-weight: 700; direction: ltr; cursor: pointer; transition: all 0.2s; margin-bottom: 10px; }',
      '.lux-user-badge:hover { background: rgba(212,175,55,0.2); transform: scale(1.03); }',

      /* مستوى القبطان */
      '.lux-level-pill { display: inline-block; background: linear-gradient(90deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05)); border: 1px solid #d4af37; color: #f3e5ab; font-size: 12px; font-weight: 800; padding: 4px 16px; border-radius: 12px; margin-bottom: 12px; }',

      /* الأوسمة */
      '.lux-badges-container { display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }',
      '.lux-badge { background: rgba(255,255,255,0.06); border: 1px solid rgba(212,175,55,0.25); color: #e2d29c; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px; }',

      /* البايو */
      '.lux-bio-box { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px 14px; font-size: 12px; color: #cbd5e1; line-height: 1.6; margin-bottom: 18px; word-break: break-word; }',

      /* زر التعديل الملكي */
      '.lux-edit-btn { background: linear-gradient(180deg, #f7dfa5, #d4af37); color: #1a1102; border: none; font-weight: 900; font-size: 14px; padding: 12px 28px; border-radius: 14px; cursor: pointer; box-shadow: 0 4px 15px rgba(212,175,55,0.4); width: 100%; transition: all 0.2s; }',
      '.lux-edit-btn:active { transform: scale(0.97); }',

      /* بطاقة القبيلة */
      '.lux-tribe-card { background: rgba(15, 28, 48, 0.8); border: 1px solid rgba(212,175,55,0.3); border-radius: 18px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }',
      '.lux-tribe-info { font-weight: 800; color: #fff; font-size: 14px; }',
      '.lux-tribe-value { color: #d4af37; font-weight: 900; font-size: 15px; }',

      /* عنوان القسم */
      '.lux-section-title { font-size: 15px; font-weight: 900; color: #d4af37; margin-bottom: 12px; border-right: 3px solid #d4af37; padding-right: 8px; }',

      /* شبكة الإحصائيات الفاخرة */
      '.lux-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }',
      '.lux-stat-card { background: linear-gradient(135deg, rgba(18, 32, 54, 0.9), rgba(10, 18, 32, 0.95)); border: 1px solid rgba(212,175,55,0.2); border-radius: 16px; padding: 14px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4); transition: transform 0.2s; }',
      '.lux-stat-card:hover { border-color: rgba(212,175,55,0.5); transform: translateY(-2px); }',
      '.lux-stat-icon { font-size: 20px; margin-bottom: 4px; }',
      '.lux-stat-val { font-size: 18px; font-weight: 900; color: #f3e5ab; margin-bottom: 2px; }',
      '.lux-stat-lbl { font-size: 11px; color: #94a3b8; font-weight: 700; }',

      /* نافذة التعديل الملكية (Modal) */
      '.lux-modal-backdrop { position: fixed; inset: 0; z-index: 999; background: rgba(3, 7, 15, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 16px; direction: rtl; font-family: inherit; }',
      '.lux-modal-card { width: 100%; max-width: 380px; max-height: 90vh; overflow-y: auto; background: linear-gradient(180deg, #101d32, #080f1d); border: 2px solid #d4af37; border-radius: 24px; padding: 20px; color: #fff; box-shadow: 0 25px 50px rgba(0,0,0,0.9); }',
      '.lux-modal-header { display: flex; justify-content: space-between; align-items: center; font-size: 16px; font-weight: 900; color: #d4af37; margin-bottom: 16px; border-bottom: 1px solid rgba(212,175,55,0.2); padding-bottom: 10px; }',
      '.lux-close-x { width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(212,175,55,0.3); background: rgba(0,0,0,0.4); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; }',

      '.lux-edit-photo-section { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 16px; }',
      '.lux-photo-btns { display: flex; gap: 8px; }',
      '.lux-btn-action { background: rgba(255,255,255,0.08); border: 1px solid rgba(212,175,55,0.3); color: #fff; padding: 8px 14px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; }',
      '.lux-btn-action.danger { border-color: rgba(239,68,68,0.4); color: #f87171; }',
      '.lux-hidden-input { display: none; }',

      '.lux-form-group { margin-bottom: 14px; }',
      '.lux-label { display: block; font-size: 12px; font-weight: 800; color: #d4af37; margin-bottom: 6px; }',
      '.lux-input { width: 100%; box-sizing: border-box; padding: 11px 14px; border-radius: 12px; border: 1.5px solid rgba(212,175,55,0.3); background: rgba(0,0,0,0.5); color: #fff; font-family: inherit; font-size: 14px; outline: none; transition: border-color 0.2s; }',
      '.lux-input:focus { border-color: #d4af37; box-shadow: 0 0 10px rgba(212,175,55,0.2); }',
      '.lux-username-box { display: flex; align-items: stretch; direction: ltr; }',
      '.lux-at-symbol { display: flex; align-items: center; padding: 0 14px; border: 1.5px solid rgba(212,175,55,0.3); border-right: none; border-radius: 12px 0 0 12px; background: rgba(212,175,55,0.15); color: #d4af37; font-weight: 900; }',
      '.lux-input-user { border-radius: 0 12px 12px 0; text-align: left; }',
      '.lux-textarea { min-height: 80px; resize: none; direction: rtl; }',
      '.lux-error-msg { min-height: 16px; font-size: 11px; color: #fca5a5; margin-top: 4px; }',

      '.lux-modal-footer { display: flex; gap: 10px; margin-top: 20px; }',
      '.lux-btn-secondary { flex: 1; padding: 12px; border-radius: 12px; border: 1.5px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: #fff; font-weight: 800; font-size: 13px; cursor: pointer; text-align: center; }',
      '.lux-btn-primary { flex: 1; padding: 12px; border-radius: 12px; border: none; background: linear-gradient(180deg, #f7dfa5, #d4af37); color: #1a1102; font-weight: 900; font-size: 13px; cursor: pointer; text-align: center; box-shadow: 0 4px 15px rgba(212,175,55,0.4); }'
    ].join('');
    var s = document.createElement('style');
    s.id = '_lux_pf_css';
    s.textContent = c;
    document.head.appendChild(s);
  }
});
