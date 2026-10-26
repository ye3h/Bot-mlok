// modules/boss.js — وحش الأعماق (v5.0.3)
ModuleRegistry.register({
  id: 'boss', name: 'وحش الأعماق', version: '5.0.3', dependencies: [],
  WEAPONS: [
    { id: 'rocket_small',  name: 'صغير',  dmg: 800,    emoji: '🚀', from: '#38bdf8', to: '#0c4a6e', border: '#7dd3fc' },
    { id: 'rocket_medium', name: 'متوسط', dmg: 4000,   emoji: '🎯', from: '#34d399', to: '#065f46', border: '#6ee7b7' },
    { id: 'rocket_large',  name: 'كبير',  dmg: 18000,  emoji: '💥', from: '#fbbf24', to: '#78350f', border: '#fde68a' },
    { id: 'nuke',          name: 'ذرية',  dmg: 70000,  emoji: '☢️', from: '#d946ef', to: '#881337', border: '#f0abfc' }
  ],
  MAX_ATTACKS: 5, REFRESH_GEMS: 200, PEARL_REWARD: 20, AUTO_BASE_MS: 6500, AUTO_MIN_MS: 1800, AUTO_STEP_MS: 350, RESET_MS: 24 * 3600 * 1000, BOSS_LIFE_MS: 6 * 3600 * 1000,
  ctx: null, _root: null, _tickIv: null, _lastAutoAt: 0, _shipIdx: 0,

  init: function (ctx) {
    var self = this; this.ctx = ctx; var st = ctx.state;
    if (!st.boss) st.boss = { active:null, attacksUsed:0, attacksResetAt:0, seasonDamage:0, bossCount:0 };
    if (typeof st.boss.bossCount !== 'number') st.boss.bossCount = 0;
    if (typeof st.boss.seasonDamage !== 'number') st.boss.seasonDamage = 0;
    if (typeof st.boss.attacksUsed !== 'number') st.boss.attacksUsed = 0;
    this.maybeResetAttacks(); this.ensureBoss(); this.injectCSS(); this.build();
    this._tickIv = setInterval(function () { self.tick(); }, 500);
    setInterval(function () { self.maybeResetAttacks(); self.ensureBoss(); }, 10000);
  },
  maybeResetAttacks: function () {
    var b = this.ctx.state.boss; if (!b) return; var now = Date.now();
    if (!b.attacksResetAt || typeof b.attacksResetAt !== 'number') { b.attacksResetAt = now + this.RESET_MS; if (typeof saveState === 'function') saveState(); return; }
    if (now >= b.attacksResetAt) { b.attacksUsed = 0; b.attacksResetAt = now + this.RESET_MS; if (typeof saveState === 'function') saveState(); if (typeof showMessage === 'function') showMessage('🎯 تجدّدت هجماتك (5/5)'); }
  },
  ensureBoss: function () {
    var st = this.ctx.state, b = st.boss; var bc = b.bossCount || 0; var expectedMax = 5000000 + bc * 500000; var now = Date.now();
    if (b.active && b.active.hp_current > 0 && b.active.expires_at > now) { if (b.active.hp_max !== expectedMax) { b.active.hp_max = expectedMax; if (b.active.hp_current > b.active.hp_max) b.active.hp_current = b.active.hp_max; if (typeof saveState === 'function') saveState(); } return; }
    b.active = { id: 'boss_' + (bc + 1), name: this.pickName(), hp_max: expectedMax, hp_current: expectedMax, expires_at: now + this.BOSS_LIFE_MS, created_at: now };
    if (typeof saveState === 'function') saveState();
  },
  pickName: function () { var n = ['وحش الأعماق', 'حبار الفضاء', 'قرش الفناء', 'شبح الهاوية', 'تنين الظلام', 'ملك المستنقع']; return n[Math.floor(Math.random() * n.length)]; },
  attackStatus: function () { this.maybeResetAttacks(); var st = this.ctx.state; var remain = Math.max(0, this.MAX_ATTACKS - (st.boss.attacksUsed || 0)); return { remaining: remain, reset_at: st.boss.attacksResetAt, cost: this.REFRESH_GEMS }; },
  activeShips: function () { var out = []; var s = this.ctx.state.ships || []; for (var i = 0; i < s.length; i++) if (!s[i].inStorage && !s[i].destroyed) out.push(s[i]); return out; },
  injectCSS: function () {
    if (document.getElementById('_boss_v5_css')) return;
    var c = [
      '@keyframes bv5-fly{0%{transform:translate(0,0) rotate(-2deg)}25%{transform:translate(8px,-18px) rotate(3deg)}50%{transform:translate(-4px,-28px) rotate(-3deg)}75%{transform:translate(-10px,-12px) rotate(2deg)}100%{transform:translate(0,0) rotate(-2deg)}}',
      '@keyframes bv5-bob{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-6px) rotate(2deg)}}',
      '@keyframes bv5-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}',
      '@keyframes bv5-rocketL{0%{transform:translate(0,0);opacity:0}8%{opacity:1}100%{transform:translate(-70vw,20px);opacity:1}}',
      '@keyframes bv5-rocketR{0%{transform:translate(0,0);opacity:0}8%{opacity:1}100%{transform:translate(70vw,30px);opacity:1}}',
      '@keyframes bv5-float{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-90px) scale(1.5);opacity:0}}',
      '@keyframes bv5-splash{0%{transform:scale(.4);opacity:0}30%{opacity:1}100%{transform:scale(2.6);opacity:0}}',
      '@keyframes bv5-wave{0%{transform:translateX(0)}100%{transform:translateX(-40px)}}',
      '.bv5-wrap{position:fixed;inset:0;z-index:220;display:none;flex-direction:column;padding:10px 10px 14px;overflow:hidden;direction:rtl;color:#fff;font-family:inherit;background:radial-gradient(ellipse at 50% 0%,#2a0f0f 0%,#0a0608 55%,#000 100%)}',
      '.bv5-wrap.open{display:flex}',
      '.bv5-top{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px;flex-shrink:0}',
      '.bv5-pill{padding:5px 11px;border-radius:20px;background:rgba(30,15,20,.85);border:1px solid rgba(244,63,94,.5);color:#fecdd3;font-size:12px;font-weight:800}',
      '.bv5-close{width:34px;height:34px;border-radius:50%;border:1.5px solid rgba(244,63,94,.5);background:rgba(30,15,20,.85);color:#fecdd3;font-size:16px;cursor:pointer;font-family:inherit}',
      '.bv5-name{display:block;margin:0 auto 4px;padding:5px 14px;border-radius:20px;background:linear-gradient(90deg,rgba(120,20,30,.7),rgba(180,60,30,.5));border:1px solid rgba(252,165,165,.6);color:#fef3c7;font-weight:900;font-size:13px;width:fit-content;max-width:90%;text-align:center}',
      '.bv5-diff{text-align:center;font-size:11px;color:#fca5a5;margin-bottom:6px;flex-shrink:0}',
      '.bv5-hp{background:rgba(30,15,20,.8);border:1px solid rgba(244,63,94,.4);border-radius:12px;padding:7px 11px;margin-bottom:6px;flex-shrink:0}',
      '.bv5-hp .row{display:flex;justify-content:space-between;font-size:11px;font-weight:800;color:#fecdd3;margin-bottom:4px}',
      '.bv5-hp .bar{height:11px;border-radius:6px;background:rgba(0,0,0,.6);overflow:hidden;border:1px solid rgba(244,63,94,.3)}',
      '.bv5-hp .fill{height:100%;background:linear-gradient(90deg,#dc2626,#f97316,#fbbf24);transition:width .4s;box-shadow:0 0 10px rgba(244,63,94,.8)}',
      '.bv5-atk{background:rgba(30,15,20,.8);border:1px solid rgba(251,191,36,.5);border-radius:12px;padding:7px 11px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-shrink:0}',
      '.bv5-atk .lbl{font-size:11px;font-weight:800;color:#fde68a}',
      '.bv5-atk .sub{font-size:10px;color:#fca5a5;margin-inline-start:6px}',
      '.bv5-atk .btn{padding:5px 11px;border-radius:9px;border:1.5px solid #c4b5fd;background:linear-gradient(180deg,#c4b5fd,#7c3aed);color:#1c1917;font-weight:900;font-size:11px;cursor:pointer;font-family:inherit;white-space:nowrap}',
      '.bv5-atk .btn:disabled{opacity:.4;cursor:default}',
      '.bv5-arena{position:relative;flex:1;min-height:240px;border-radius:16px;overflow:hidden;border:2px solid rgba(244,63,94,.35);margin-bottom:6px;background:linear-gradient(180deg,#1a1024 0%,#0a1830 50%,#04101e 100%)}',
      '.bv5-wave{position:absolute;left:0;right:0;height:26px;opacity:.55;background:repeating-linear-gradient(90deg,rgba(56,189,248,.3) 0 12px,transparent 12px 24px);animation:bv5-wave 3s linear infinite}',
      '.bv5-bossarea{position:absolute;left:2%;top:10%;bottom:18%;width:55%;display:flex;align-items:center;justify-content:center}',
      '.bv5-bossemoji{font-size:110px;line-height:1;animation:bv5-fly 3.2s ease-in-out infinite;filter:drop-shadow(0 0 30px rgba(244,63,94,.7))}',
      '.bv5-bossemoji.shake{animation:bv5-shake .22s}',
      '.bv5-shiparea{position:absolute;right:2%;bottom:10%;width:42%;height:55%;display:flex;align-items:flex-end;justify-content:center}',
      '.bv5-shipimg{max-width:100%;max-height:100%;object-fit:contain;transform:scaleX(-1);animation:bv5-bob 2.6s ease-in-out infinite;filter:drop-shadow(0 6px 8px rgba(0,0,0,.7))}',
      '.bv5-shipimg.shake{animation:bv5-shake .22s}',
      '.bv5-shipem{font-size:80px;line-height:1;transform:scaleX(-1);animation:bv5-bob 2.6s ease-in-out infinite;filter:drop-shadow(0 6px 8px rgba(0,0,0,.7))}',
      '.bv5-dmg{position:absolute;font-weight:900;pointer-events:none;text-shadow:0 0 12px rgba(244,63,94,.9);animation:bv5-float 1.4s ease-out forwards}',
      '.bv5-dmg.crit{color:#fcd34d;font-size:22px;text-shadow:0 0 20px rgba(251,191,36,1)}',
      '.bv5-dmg.normal{color:#fecdd3;font-size:18px}',
      '.bv5-rocket{position:absolute;z-index:30;pointer-events:none;display:flex;align-items:center;gap:2px}',
      '.bv5-rocket.l{right:38%;bottom:30%;animation:bv5-rocketL .9s cubic-bezier(.4,.1,.6,1) forwards}',
      '.bv5-rocket.r{left:38%;top:28%;animation:bv5-rocketR .9s cubic-bezier(.4,.1,.6,1) forwards}',
      '.bv5-rocket .trail{height:5px;width:50px;border-radius:3px;filter:blur(2px)}',
      '.bv5-rocket .ico{font-size:30px;line-height:1}',
      '.bv5-splash{position:absolute;border-radius:50%;pointer-events:none;animation:bv5-splash .7s ease-out forwards}',
      '.bv5-shipsrow{display:flex;gap:6px;overflow-x:auto;margin-bottom:6px;padding:2px 0;flex-shrink:0}',
      '.bv5-shipbtn{flex:0 0 auto;width:50px;height:50px;border-radius:10px;border:1.5px solid rgba(251,191,36,.3);background:rgba(20,15,25,.85);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:2px;position:relative;overflow:hidden}',
      '.bv5-shipbtn.on{border-color:#fbbf24;background:rgba(251,191,36,.15);box-shadow:0 0 12px rgba(251,191,36,.5)}',
      '.bv5-shipbtn img{max-width:100%;max-height:100%;object-fit:contain;transform:scaleX(-1)}',
      '.bv5-shipbtn .em{font-size:22px}',
      '.bv5-weapons{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;flex-shrink:0}',
      '.bv5-wbtn{position:relative;padding:7px 4px;border-radius:11px;border:1.5px solid;color:#fff;font-family:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px;box-shadow:0 4px 12px rgba(0,0,0,.5)}',
      '.bv5-wbtn:disabled{opacity:.4;filter:grayscale(.6);cursor:default}',
      '.bv5-wbtn .ico{font-size:22px;line-height:1}',
      '.bv5-wbtn .nm{font-size:10px;font-weight:900}',
      '.bv5-wbtn .dm{font-size:9px;opacity:.9}',
      '.bv5-wbtn .qty{position:absolute;top:-6px;right:-6px;background:#111;border:1.5px solid #fbbf24;color:#fef3c7;border-radius:10px;padding:0 5px;font-size:10px;font-weight:900;line-height:16px}',
      '.bv5-toast{margin-top:6px;text-align:center;font-size:11px;color:#94a3b8;flex-shrink:0;min-height:14px}'
    ].join('');
    var s = document.createElement('style'); s.id = '_boss_v5_css'; s.textContent = c; document.head.appendChild(s);
  },
  build: function () {
    var self = this; var old = document.getElementById('boss-v5-root'); if (old) old.remove();
    var root = document.createElement('div'); root.id = 'boss-v5-root'; root.className = 'bv5-wrap';
    document.body.appendChild(root); this._root = root;
    root.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-bv5]') : null; if (!t) return;
      var act = t.getAttribute('data-bv5');
      if (act === 'close') { self.close(); return; }
      if (act === 'refresh') { self.doRefresh(); return; }
      if (act === 'attack') { self.doAttack(t.getAttribute('data-w')); return; }
      if (act === 'ship') { self.pickShip(parseInt(t.getAttribute('data-i'), 10) || 0); return; }
    });
  },
  open: function () { this.maybeResetAttacks(); this.ensureBoss(); this.render(); this._lastAutoAt = 0; if (this._root) this._root.classList.add('open'); },
  close: function () { if (this._root) this._root.classList.remove('open'); },
  render: function () {
    if (!this._root) return; var st = this.ctx.state; var b = st.boss;
    if (!b.active) this.ensureBoss(); b = st.boss;
    var ships = this.activeShips(); if (this._shipIdx >= ships.length) this._shipIdx = 0;
    var curShip = ships[this._shipIdx]; var curDef = curShip ? (window.SHIP_BY_CODE && window.SHIP_BY_CODE[curShip.code]) : null;
    var hpCur = Math.min(b.active.hp_current, b.active.hp_max); var hpPct = b.active.hp_max > 0 ? (hpCur / b.active.hp_max * 100) : 0;
    var stat = this.attackStatus(); var remainMs = b.active.expires_at - Date.now(); var bc = b.bossCount || 0; var diff = 2000 + bc * 900 + Math.floor((st.xp || 0) / 100);
    var h = '';
    h += '<div class="bv5-top"><button class="bv5-close" data-bv5="close">←</button><div class="bv5-pill">⏰ ' + this.fmtTime(remainMs) + '</div></div>';
    h += '<div class="bv5-name">🐲 ' + this.esc(b.active.name) + '</div>';
    h += '<div class="bv5-diff">⚔️ صعوبة ' + diff + ' · 💀 قُتل ' + bc + ' · 🦪 ' + ((st.dragon && st.dragon.pearls) || 0) + '</div>';
    h += '<div class="bv5-hp"><div class="row"><span>❤️ الوحش</span><span id="bv5-hptext">' + Math.floor(hpCur).toLocaleString() + ' / ' + b.active.hp_max.toLocaleString() + '</span></div><div class="bar"><div class="fill" id="bv5-hpfill" style="width:' + Math.max(0, hpPct) + '%"></div></div></div>';
    h += '<div class="bv5-atk"><div><span class="lbl" id="bv5-atklbl">🎯 الهجمات: ' + stat.remaining + '/' + this.MAX_ATTACKS + '</span><span class="sub" id="bv5-atksub">' + (stat.remaining < this.MAX_ATTACKS && stat.reset_at > Date.now() ? 'يُجدّد بعد ' + this.fmtTime(stat.reset_at - Date.now()) : '') + '</span></div><button class="btn" id="bv5-refreshbtn" data-bv5="refresh"' + (stat.remaining >= this.MAX_ATTACKS ? ' disabled' : '') + '>💎 ' + this.REFRESH_GEMS + ' تجديد</button></div>';
    h += '<div class="bv5-arena" id="bv5-arena">';
    h += '<div class="bv5-wave" style="bottom:0"></div><div class="bv5-wave" style="bottom:22%"></div><div class="bv5-wave" style="bottom:44%"></div>';
    h += '<div class="bv5-bossarea" id="bv5-boss"><div class="bv5-bossemoji">🐲</div></div>';
    h += '<div class="bv5-shiparea" id="bv5-ship">' + (curDef ? '<img class="bv5-shipimg" src="' + curDef.img + '" alt="">' : '<div class="bv5-shipem">⛵</div>') + '</div></div>';
    if (ships.length > 0) {
      h += '<div class="bv5-shipsrow">';
      for (var i = 0; i < ships.length; i++) {
        var s = ships[i]; var d = window.SHIP_BY_CODE && window.SHIP_BY_CODE[s.code]; var on = i === this._shipIdx;
        h += '<button class="bv5-shipbtn' + (on ? ' on' : '') + '" data-bv5="ship" data-i="' + i + '">';
        if (d && d.img) h += '<img src="' + d.img + '" alt="">'; else h += '<span class="em">' + (d && d.emoji ? d.emoji : '⛵') + '</span>';
        h += '</button>';
      }
      h += '</div>';
    }
    h += '<div class="bv5-weapons">';
    for (var w = 0; w < this.WEAPONS.length; w++) {
      var wp = this.WEAPONS[w]; var q = (st.inventory && st.inventory[wp.id]) || 0; var dis = q <= 0 || stat.remaining <= 0 || hpCur <= 0;
      h += '<button class="bv5-wbtn" data-bv5="attack" data-w="' + wp.id + '" ' + (dis ? 'disabled' : '') + ' style="background:linear-gradient(180deg,' + wp.from + ',' + wp.to + ');border-color:' + wp.border + '"><span class="ico">' + wp.emoji + '</span><span class="nm">' + wp.name + '</span><span class="dm">-' + wp.dmg.toLocaleString() + '</span><span class="qty" data-qty-for="' + wp.id + '">×' + q + '</span></button>';
    }
    h += '</div>';
    h += '<div class="bv5-toast" id="bv5-toast">' + (curShip ? '⚓ ' + (curDef ? curDef.name : curShip.code) : '⚠️ لا توجد سفن نشطة') + '</div>';
    this._root.innerHTML = h;
  },
  fmtTime: function (ms) { if (ms <= 0) return 'الآن'; var s = Math.floor(ms / 1000); var hh = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return hh > 0 ? hh + 'س ' + m + 'د' : m + 'د'; },
  esc: function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]; }); },
  tick: function () {
    if (!this._root || !this._root.classList.contains('open')) return; this.maybeResetAttacks();
    var st = this.ctx.state; var b = st.boss; if (!b.active || b.active.hp_current <= 0) { this.render(); return; }
    var bc = b.bossCount || 0; var Q = 1 + bc * 2; var interval = Math.max(this.AUTO_MIN_MS, this.AUTO_BASE_MS - Q * this.AUTO_STEP_MS); var now = Date.now();
    if (now - this._lastAutoAt >= interval) { this._lastAutoAt = now; this.shipAutoAttack(); }
    this.partialUpdate();
  },
  partialUpdate: function () {
    if (!this._root) return; var st = this.ctx.state; var b = st.boss; if (!b.active) return;
    var hpCur = Math.min(b.active.hp_current, b.active.hp_max); var fill = document.getElementById('bv5-hpfill'); if (fill) fill.style.width = Math.max(0, (hpCur / b.active.hp_max) * 100) + '%';
    var hptext = document.getElementById('bv5-hptext'); if (hptext) hptext.textContent = Math.floor(hpCur).toLocaleString() + ' / ' + b.active.hp_max.toLocaleString();
    var stat = this.attackStatus(); var atklbl = document.getElementById('bv5-atklbl'); if (atklbl) atklbl.textContent = '🎯 الهجمات: ' + stat.remaining + '/' + this.MAX_ATTACKS;
    var atksub = document.getElementById('bv5-atksub'); if (atksub) atksub.textContent = (stat.remaining < this.MAX_ATTACKS && stat.reset_at > Date.now()) ? 'يُجدّد بعد ' + this.fmtTime(stat.reset_at - Date.now()) : '';
    var refbtn = document.getElementById('bv5-refreshbtn'); if (refbtn) refbtn.disabled = stat.remaining >= this.MAX_ATTACKS;
    for (var i = 0; i < this.WEAPONS.length; i++) {
      var wp = this.WEAPONS[i]; var q = (st.inventory && st.inventory[wp.id]) || 0; var qel = this._root.querySelector('[data-qty-for="' + wp.id + '"]'); if (qel) qel.textContent = '×' + q;
      var btn = this._root.querySelector('[data-w="' + wp.id + '"]'); if (btn) btn.disabled = (q <= 0 || stat.remaining <= 0 || hpCur <= 0);
    }
  },
  shipAutoAttack: function () {
    var ships = this.activeShips(); if (!ships.length) return; if (this._shipIdx >= ships.length) this._shipIdx = 0;
    var ship = ships[this._shipIdx]; var def = window.SHIP_BY_CODE && window.SHIP_BY_CODE[ship.code]; if (!def) return;
    var base = (def.attack || def.attack_power || 10) * 10; var dmg = Math.round(base * (0.85 + Math.random() * 0.4)); var crit = Math.random() < 0.15; if (crit) dmg = Math.round(dmg * 2);
    this.spawnRocket('l', '🚀'); this.applyDamage(dmg, crit, 'boss');
  },
  doAttack: function (weaponId) {
    this.maybeResetAttacks(); var st = this.ctx.state; var b = st.boss; if (!b.active || b.active.hp_current <= 0) { this.toast('⚠️ لا يوجد وحش'); return; }
    var stat = this.attackStatus(); if (stat.remaining <= 0) { this.toast('⛔ انتهت هجماتك — جدّد'); return; }
    var w = null; for (var i = 0; i < this.WEAPONS.length; i++) if (this.WEAPONS[i].id === weaponId) w = this.WEAPONS[i]; if (!w) return;
    var q = (st.inventory && st.inventory[weaponId]) || 0; if (q <= 0) { this.toast('🚫 ما عندك هذا السلاح'); return; }
    st.inventory[weaponId] = q - 1; if (st.inventory[weaponId] <= 0) delete st.inventory[weaponId];
    st.boss.attacksUsed = (st.boss.attacksUsed || 0) + 1; if (!st.boss.attacksResetAt) st.boss.attacksResetAt = Date.now() + this.RESET_MS;
    var crit = Math.random() < 0.2; var dmg = w.dmg * (crit ? 2 : 1);
    var eq = window.ModuleRegistry && window.ModuleRegistry.get('dragon_equipment'); if (eq && typeof eq.getTotalBonus === 'function') { var bonus = eq.getTotalBonus(); dmg = Math.round(dmg * (1 + (bonus.attack || 0) / 100)); if (Math.random() < (bonus.crit || 0) / 100) crit = true; }
    this.spawnRocket('r', w.emoji); this.applyDamage(dmg, crit, 'boss'); this.partialUpdate();
  },
  applyDamage: function (dmg, crit, side) {
    var st = this.ctx.state; var b = st.boss; if (!b.active) return; b.active.hp_current = Math.max(0, b.active.hp_current - dmg); b.seasonDamage = (b.seasonDamage || 0) + dmg;
    if (st.dragon) st.dragon.dp = (st.dragon.dp || 0) + dmg;
    this.spawnDamage(dmg, crit, side); this.shakeBoss();
    if (b.active.hp_current <= 0) this.killBoss(); if (typeof saveState === 'function') saveState();
  },
  killBoss: function () {
    var st = this.ctx.state; var b = st.boss; b.bossCount = (b.bossCount || 0) + 1; if (st.dragon) st.dragon.pearls = (st.dragon.pearls || 0) + this.PEARL_REWARD;
    b.active = null; this.ensureBoss(); if (typeof showMessage === 'function') showMessage('💀 سقط الوحش! +' + this.PEARL_REWARD + ' 🦪'); if (typeof beep === 'function') beep(1200, 0.3); if (typeof render === 'function') render();
    var self = this; setTimeout(function () { self.render(); }, 400);
  },
  doRefresh: function () {
    var st = this.ctx.state; if ((st.gems || 0) < this.REFRESH_GEMS) { this.toast('💎 جواهر غير كافية'); return; } if (!confirm('تجديد 5 هجمات بـ ' + this.REFRESH_GEMS + ' 💎؟')) return;
    st.gems -= this.REFRESH_GEMS; st.boss.attacksUsed = 0; st.boss.attacksResetAt = Date.now() + this.RESET_MS; if (typeof saveState === 'function') saveState(); if (typeof render === 'function') render(); this.toast('✅ تم التجديد'); this.render();
  },
  pickShip: function (idx) { this._shipIdx = idx; this._lastAutoAt = 0; this.render(); },
  spawnRocket: function (from, emoji) {
    var arena = document.getElementById('bv5-arena'); if (!arena) return; var r = document.createElement('div'); r.className = 'bv5-rocket ' + (from === 'r' ? 'r' : 'l');
    var trailColor = from === 'r' ? 'linear-gradient(to right,rgba(255,80,40,1),transparent)' : 'linear-gradient(to left,rgba(255,200,80,1),transparent)';
    r.innerHTML = '<div class="ico">' + emoji + '</div><div class="trail" style="background:' + trailColor + '"></div>'; arena.appendChild(r); setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 950);
  },
  spawnDamage: function (dmg, crit, side) {
    var arena = document.getElementById('bv5-arena'); if (!arena) return; var target = side === 'boss' ? document.getElementById('bv5-boss') : document.getElementById('bv5-ship'); if (!target) return;
    var rect = target.getBoundingClientRect(); var aRect = arena.getBoundingClientRect(); var x = rect.left - aRect.left + rect.width / 2; var y = rect.top - aRect.top + rect.height / 3;
    var sp = document.createElement('div'); sp.className = 'bv5-splash'; sp.style.left = x + 'px'; sp.style.top = y + 'px'; sp.style.width = '120px'; sp.style.height = '120px'; sp.style.marginLeft = '-60px'; sp.style.marginTop = '-60px'; sp.style.background = 'radial-gradient(circle,rgba(255,240,120,1) 0%,rgba(255,80,20,.8) 35%,transparent 70%)'; arena.appendChild(sp); setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 750);
    var d = document.createElement('div'); d.className = 'bv5-dmg ' + (crit ? 'crit' : 'normal'); d.textContent = (crit ? '💥 ' : '') + '-' + Math.round(dmg).toLocaleString(); d.style.left = x + 'px'; d.style.top = (y - 20) + 'px'; d.style.transform = 'translateX(-50%)'; arena.appendChild(d); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 1450);
  },
  shakeBoss: function () { var el = document.querySelector('#bv5-boss .bv5-bossemoji'); if (!el) return; el.classList.add('shake'); setTimeout(function () { el.classList.remove('shake'); }, 250); },
  toast: function (m) { var el = document.getElementById('bv5-toast'); if (el) el.textContent = m; }
});
