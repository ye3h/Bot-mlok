// modules/arena.js — الأرينا الأسبوعية (v1.0.0)
// شاشة رئيسية + قتال 1v1 + ترتيب أسبوعي محلي
ModuleRegistry.register({
  id: 'arena',
  name: 'الأرينا',
  version: '1.0.0',
  dependencies: ['dragons'],

  MAX_FREE_ATTACKS: 5,
  ATTACK_COST_GEMS: 50,
  MIN_DRAGON_STAGE: 3,
  RESET_MS: 24 * 3600 * 1000,

  BOTS: [
    { name: 'حبار الفضاء',   emoji: '🦑', offset: 0 },
    { name: 'قرش الظلام',    emoji: '🦈', offset: 1 },
    { name: 'تنين الثلج',    emoji: '❄️', offset: -1 },
    { name: 'ملك التنين',    emoji: '👑', offset: 2 },
    { name: 'شبح البحر',     emoji: '👻', offset: 0 },
    { name: 'أبو لهب',       emoji: '🔥', offset: -1 },
    { name: 'ماري القرش',    emoji: '🐋', offset: 1 },
    { name: 'وحش الموجة',    emoji: '🌊', offset: 0 }
  ],

  BOTS_LEADER: [
    { name: 'قرصان الليل',    emoji: '🏴‍☠️', score: 245, wins: 32 },
    { name: 'كابتن رعد',      emoji: '⚡',   score: 198, wins: 26 },
    { name: 'ملك المرجان',    emoji: '🪸',   score: 176, wins: 23 },
    { name: 'سيد الأعماق',    emoji: '🔱',   score: 154, wins: 20 },
    { name: 'أفعى البحر',     emoji: '🐍',   score: 122, wins: 16 },
    { name: 'ظل الموجة',      emoji: '🌑',   score: 98,  wins: 13 },
    { name: 'تنين الفجر',     emoji: '🌅',   score: 64,  wins: 8 },
    { name: 'بحار ضائع',      emoji: '⚓',   score: 41,  wins: 5 }
  ],

  ctx: null,
  _arenaRoot: null,
  _battleRoot: null,
  _btn: null,
  _enemy: null,
  _player: null,
  _locked: false,
  _finished: false,
  _dmgId: 0,

  init: function (ctx) {
    var self = this;
    this.ctx = ctx;
    this.ensureState();
    this.injectCSS();
    this.buildArena();
    this.buildBattle();
    setInterval(function () { self.maybeReset(); }, 60000);
  },

  ensureState: function () {
    var st = this.ctx.state;
    if (!st.arena) st.arena = {};
    var a = st.arena;
    var ws = this.weekStart();
    if (a.weekStart !== ws) {
      a.weekStart = ws;
      a.score = 0;
      a.wins = 0;
      a.losses = 0;
    }
    if (typeof a.score !== 'number') a.score = 0;
    if (typeof a.wins !== 'number') a.wins = 0;
    if (typeof a.losses !== 'number') a.losses = 0;
    if (typeof a.attacksUsed !== 'number') a.attacksUsed = 0;
    if (typeof a.attacksResetAt !== 'number') a.attacksResetAt = 0;
    if (typeof saveState === 'function') saveState();
  },

  weekStart: function () {
    var d = new Date();
    var day = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - day);
    d.setUTCHours(0,0,0,0);
    return d.toISOString().slice(0,10);
  },

  maybeReset: function () {
    this.ensureState();
    var a = this.ctx.state.arena;
    if (a.attacksResetAt && Date.now() >= a.attacksResetAt) {
      a.attacksUsed = 0;
      a.attacksResetAt = Date.now() + this.RESET_MS;
      if (typeof saveState === 'function') saveState();
    }
  },

  // ═══════ RPC-like local ═══════
  attackStatus: function () {
    this.maybeReset();
    var a = this.ctx.state.arena;
    return {
      free_left: Math.max(0, this.MAX_FREE_ATTACKS - a.attacksUsed),
      next_cost: this.ATTACK_COST_GEMS,
      reset_at: a.attacksResetAt
    };
  },

  attackRequest: function () {
    this.maybeReset();
    var a = this.ctx.state.arena;
    if (a.attacksUsed < this.MAX_FREE_ATTACKS) {
      a.attacksUsed += 1;
      if (!a.attacksResetAt) a.attacksResetAt = Date.now() + this.RESET_MS;
      if (typeof saveState === 'function') saveState();
      return { ok: true, used: a.attacksUsed };
    }
    var st = this.ctx.state;
    if ((st.gems || 0) < this.ATTACK_COST_GEMS) {
      return { ok: false, reason: 'need_gems', cost: this.ATTACK_COST_GEMS, have: st.gems || 0 };
    }
    st.gems -= this.ATTACK_COST_GEMS;
    if (typeof saveState === 'function') saveState();
    return { ok: true, paid: this.ATTACK_COST_GEMS };
  },

  awardScore: function (score, won) {
    var a = this.ctx.state.arena;
    if (won) {
      a.score += score;
      a.wins += 1;
    } else {
      a.losses += 1;
    }
    var d = this.ctx.state.dragon;
    if (d) {
      if (won) d.pvpWins = (d.pvpWins || 0) + 1;
      else d.pvpLosses = (d.pvpLosses || 0) + 1;
    }
    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
    return { ok: true };
  },

  // ═══════ CSS ═══════
  injectCSS: function () {
    if (document.getElementById('_arena_css')) return;
    var c = [
      // الشاشة الرئيسية
      '.ar-wrap{position:fixed;inset:0;z-index:225;display:none;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px 10px 110px;direction:rtl;color:#fff;font-family:inherit;background:radial-gradient(ellipse at 50% 0%,#1a0a2e 0%,#0a0618 55%,#000 100%)}',
      '.ar-wrap.open{display:block}',
      '.ar-top{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;flex-shrink:0}',
      '.ar-pill{padding:5px 11px;border-radius:20px;background:rgba(20,15,35,.85);border:1px solid rgba(168,85,247,.5);color:#e9d5ff;font-size:12px;font-weight:800}',
      '.ar-close{width:34px;height:34px;border-radius:50%;border:1.5px solid rgba(168,85,247,.5);background:rgba(20,15,35,.85);color:#e9d5ff;font-size:16px;cursor:pointer;font-family:inherit}',
      '.ar-head{text-align:center;margin-bottom:10px}',
      '.ar-title{display:inline-block;padding:8px 20px;border-radius:24px;background:linear-gradient(90deg,rgba(120,20,180,.4),rgba(20,140,180,.4));border:1px solid rgba(168,85,247,.6);color:#f3e8ff;font-weight:900;font-size:17px}',
      '.ar-sub{font-size:11px;color:#c4b5fd;margin-top:3px}',
      '.ar-btn{display:block;width:100%;padding:16px;border-radius:18px;border:2px solid rgba(255,200,100,.7);background:linear-gradient(180deg,#ff8a00 0%,#ff2d00 100%);color:#fff;font-weight:900;font-size:17px;cursor:pointer;font-family:inherit;box-shadow:0 0 30px rgba(255,80,0,.5);margin-bottom:12px;text-shadow:0 1px 2px rgba(0,0,0,.5)}',
      '.ar-btn:active{transform:scale(.97)}',
      '.ar-btn:disabled{opacity:.4;cursor:default;filter:grayscale(.6)}',
      '.ar-locked{padding:12px;border-radius:14px;background:linear-gradient(180deg,rgba(120,40,20,.5),rgba(60,10,5,.5));border:1.5px solid rgba(251,146,60,.6);color:#fef3c7;text-align:center;font-weight:900;margin-bottom:12px}',
      '.ar-section{padding:11px 12px;border-radius:14px;background:rgba(20,15,35,.7);border:1px solid rgba(168,85,247,.3);margin-bottom:10px}',
      '.ar-section h3{margin:0 0 8px;font-size:13px;font-weight:900;color:#e9d5ff;text-align:center}',
      '.ar-row{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;background:rgba(0,0,0,.3);margin-bottom:4px;font-size:12px}',
      '.ar-row.me{background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.5)}',
      '.ar-rank{width:24px;text-align:center;font-weight:900;color:#a78bfa}',
      '.ar-rank.gold{color:#fcd34d;font-size:16px}',
      '.ar-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.ar-score{font-weight:900;color:#fcd34d;font-variant-numeric:tabular-nums}',
      '.ar-emoji{font-size:18px}',
      '.ar-meta{font-size:10px;color:#94a3b8;margin-top:2px;text-align:center}',
      '.ar-rew{display:flex;justify-content:space-between;padding:5px 8px;font-size:11px;background:rgba(0,0,0,.25);border-radius:6px;margin-bottom:3px}',
      '.ar-rew .rk{color:#fcd34d;font-weight:900}',

      // القتال
      '.arb-wrap{position:fixed;inset:0;z-index:230;display:none;flex-direction:column;overflow:hidden;direction:rtl;color:#fff;font-family:inherit;background:radial-gradient(ellipse at 50% 30%,#2a0f1f 0%,#0a0618 55%,#000 100%)}',
      '.arb-wrap.open{display:flex}',
      '.arb-top{display:flex;gap:6px;padding:8px 8px 0;flex-shrink:0;align-items:stretch}',
      '.arb-hpcard{flex:1;min-width:0;padding:6px 8px;border-radius:10px;background:rgba(20,15,35,.9);border:1.5px solid rgba(168,85,247,.5)}',
      '.arb-hpcard .nmrow{display:flex;align-items:center;gap:6px;margin-bottom:4px}',
      '.arb-hpcard .avatar{width:30px;height:30px;border-radius:7px;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;border:1px solid rgba(255,255,255,.1)}',
      '.arb-hpcard .nm{flex:1;min-width:0;font-size:11px;font-weight:900;color:#fef3c7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.arb-hpcard .lv{font-size:9px;padding:1px 5px;border-radius:5px;background:rgba(251,191,36,.2);border:1px solid rgba(251,191,36,.5);color:#fcd34d;font-weight:900}',
      '.arb-hpcard .pw{font-size:9px;color:#bae6fd;font-weight:800;margin-bottom:3px}',
      '.arb-hpbar{height:9px;border-radius:5px;background:rgba(0,0,0,.7);overflow:hidden;border:1px solid rgba(120,80,20,.5);position:relative}',
      '.arb-hpfill{height:100%;transition:width .35s;box-shadow:inset 0 -2px 0 rgba(0,0,0,.4)}',
      '.arb-hpfill.good{background:linear-gradient(90deg,#22c55e,#16a34a)}',
      '.arb-hpfill.bad{background:linear-gradient(90deg,#ef4444,#f97316)}',
      '.arb-hpcard .hptxt{font-size:9px;font-weight:900;text-align:center;margin-top:3px;color:#fecdd3}',
      '.arb-vs{align-self:center;font-size:15px;font-weight:900;color:#fcd34d;padding:0 4px;text-shadow:0 2px 4px rgba(0,0,0,.9)}',
      '.arb-arena{position:relative;flex:1;margin:6px;border-radius:14px;overflow:hidden;border:1.5px solid rgba(168,85,247,.35);background:radial-gradient(ellipse at 50% 60%,#1a1030 0%,#0a0820 55%,#050310 100%)}',
      '.arb-dragon{position:absolute;top:35%;width:38%;aspect-ratio:1/1;transition:transform .2s}',
      '.arb-dragon.player{left:4%}',
      '.arb-dragon.enemy{right:4%}',
      '.arb-dragon .emo{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:90px;filter:drop-shadow(0 8px 14px rgba(0,0,0,.7))}',
      '.arb-dragon.player .emo{animation:arb-hov 2.6s ease-in-out infinite}',
      '.arb-dragon.enemy .emo{animation:arb-hov 2.4s ease-in-out infinite}',
      '.arb-dragon.shake{animation:arb-shake .22s}',
      '.arb-flame{position:absolute;top:48%;width:48%;height:70px;pointer-events:none}',
      '.arb-flame.right{left:38%;animation:arb-flameR .7s ease-out forwards}',
      '.arb-flame.left{right:38%;animation:arb-flameL .7s ease-out forwards}',
      '.arb-flame .inner{position:absolute;inset:0;border-radius:50%;background:linear-gradient(90deg,rgba(255,253,231,.95) 0%,#ffd24a 15%,#ff8a00 45%,#ff2d00 75%,rgba(255,45,0,0) 100%);filter:blur(2px) drop-shadow(0 0 18px #ff5500);clip-path:polygon(0% 45%,0% 55%,100% 90%,100% 10%)}',
      '.arb-flame.left .inner{background:linear-gradient(270deg,rgba(255,253,231,.95) 0%,#ffd24a 15%,#ff8a00 45%,#ff2d00 75%,rgba(255,45,0,0) 100%);clip-path:polygon(100% 45%,100% 55%,0% 90%,0% 10%)}',
      '.arb-dmg{position:absolute;font-weight:900;font-size:22px;color:#ff3b3b;text-shadow:0 0 6px #000,0 2px 4px rgba(0,0,0,.9);pointer-events:none;animation:arb-flt .9s ease-out forwards}',
      '.arb-bottom{padding:10px 12px 14px;flex-shrink:0;background:linear-gradient(180deg,transparent,rgba(0,0,0,.7))}',
      '.arb-btn{display:block;width:100%;padding:16px;border-radius:18px;border:2px solid rgba(255,200,100,.7);background:linear-gradient(180deg,#ff8a00 0%,#ff2d00 100%);color:#fff;font-weight:900;font-size:17px;cursor:pointer;font-family:inherit;box-shadow:0 0 30px rgba(255,80,0,.6);text-shadow:0 1px 2px rgba(0,0,0,.5)}',
      '.arb-btn:disabled{opacity:.5;cursor:default}',
      '.arb-btn:active:not(:disabled){transform:scale(.97)}',
      '.arb-result{position:fixed;inset:0;z-index:235;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.75);padding:16px}',
      '.arb-result.open{display:flex}',
      '.arb-card{max-width:300px;width:100%;border-radius:22px;overflow:hidden;border:4px solid #fbbf24;background:linear-gradient(180deg,#3a2412,#1a0e08);box-shadow:0 0 60px rgba(251,191,36,.6)}',
      '.arb-card.lose{border-color:#6b7280;box-shadow:0 0 40px rgba(0,0,0,.7)}',
      '.arb-card .title{padding:10px;text-align:center;font-size:20px;font-weight:900;letter-spacing:2px;background:linear-gradient(180deg,#fbbf24,#b45309);color:#1a0e08}',
      '.arb-card.lose .title{background:linear-gradient(180deg,#475569,#1f2937);color:#fff}',
      '.arb-card .body{padding:20px;text-align:center}',
      '.arb-card .big{font-size:70px;line-height:1;margin-bottom:6px}',
      '.arb-card .points{font-size:32px;font-weight:900;color:#fcd34d}',
      '.arb-card .points-lbl{font-size:11px;color:#fde68a;margin-top:4px}',
      '.arb-card .btns{display:flex;gap:8px;margin-top:16px}',
      '.arb-card .btns button{flex:1;padding:12px;border-radius:12px;border:0;font-family:inherit;font-weight:900;font-size:14px;cursor:pointer}',
      '.arb-card .btn-again{background:linear-gradient(180deg,#fcd34d,#d97706);color:#1a0e08;border:2px solid #fef3c7!important}',
      '.arb-card .btn-exit{background:rgba(0,0,0,.5);color:#fff;border:1px solid rgba(255,255,255,.3)!important}',

      // زر عائم
      '.ar-fab{position:fixed;left:10px;bottom:180px;z-index:26;width:60px;height:60px;border-radius:16px;border:1.5px solid rgba(252,191,73,.65);background:radial-gradient(120% 100% at 30% 0%,rgba(255,240,200,.3),transparent 55%),linear-gradient(160deg,#c4b5fd,#7c3aed);color:#fff;font-family:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.5),0 0 16px rgba(168,85,247,.4);overflow:hidden;padding:0}',
      '.ar-fab:active{transform:scale(.92)}',
      '.ar-fab .ico{font-size:26px;line-height:1}',
      '.ar-fab .lbl{font-size:9px;font-weight:900;text-shadow:0 1px 0 rgba(0,0,0,.4)}',

      '@keyframes arb-hov{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}',
      '@keyframes arb-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}',
      '@keyframes arb-flt{0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(-60px);opacity:0}}',
      '@keyframes arb-flameR{0%{transform:scaleX(0) scaleY(.6);opacity:0;transform-origin:left}15%{opacity:1}70%{transform:scaleX(1) scaleY(1.05);opacity:1}100%{transform:scaleX(1.05) scaleY(.9);opacity:0}}',
      '@keyframes arb-flameL{0%{transform:scaleX(0) scaleY(.6);opacity:0;transform-origin:right}15%{opacity:1}70%{transform:scaleX(1) scaleY(1.05);opacity:1}100%{transform:scaleX(1.05) scaleY(.9);opacity:0}}'
    ].join('');
    var s = document.createElement('style');
    s.id = '_arena_css';
    s.textContent = c;
    document.head.appendChild(s);
  },

  // ═══════ Arena screen ═══════
  buildArena: function () {
    var self = this;
    var old = document.getElementById('arena-root');
    if (old) old.remove();
    var root = document.createElement('div');
    root.id = 'arena-root';
    root.className = 'ar-wrap';
    root.innerHTML = '<div id="arena-body"></div>';
    document.body.appendChild(root);
    this._arenaRoot = root;

    root.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-ar]') : null;
      if (!t) return;
      var act = t.getAttribute('data-ar');
      if (act === 'close') { self.close(); return; }
      if (act === 'enter') { self.startBattle(); return; }
    });
  },

  open: function () {
    this.ensureState();
    this.renderArena();
    if (this._arenaRoot) this._arenaRoot.classList.add('open');
  },

  close: function () {
    if (this._arenaRoot) this._arenaRoot.classList.remove('open');
  },

  renderArena: function () {
    var st = this.ctx.state;
    var a = st.arena;
    var d = st.dragon || {};
    var stage = d.stage || 1;

    // نهاية الأسبوع
    var now = new Date();
    var nextMon = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    var day = (nextMon.getUTCDay() + 6) % 7;
    nextMon.setUTCDate(nextMon.getUTCDate() - day + 7);
    var leftMs = nextMon.getTime() - now.getTime();
    var daysLeft = Math.floor(leftMs / 86400000);
    var hoursLeft = Math.floor((leftMs % 86400000) / 3600000);

    var stat = this.attackStatus();

    // Leaderboard محلي
    var me = { name: (st.name || 'القبطان') + ' (أنت)', emoji: '🧑‍✈️', score: a.score, wins: a.wins, isMe: true };
    var board = [me].concat(this.BOTS_LEADER.map(function (b) {
      return { name: b.name, emoji: b.emoji, score: b.score, wins: b.wins, isMe: false };
    }));
    board.sort(function (x, y) { return y.score - x.score; });

    var h = '';
    h += '<div class="ar-top">';
    h +=   '<button class="ar-close" data-ar="close">←</button>';
    h +=   '<div class="ar-pill">⏰ ' + daysLeft + 'ي ' + hoursLeft + 'س</div>';
    h += '</div>';

    h += '<div class="ar-head">';
    h +=   '<div class="ar-title">🏟️ الأرينا الأسبوعية</div>';
    h +=   '<div class="ar-sub">ضرب اللاعبين = نقاط أرينا</div>';
    h += '</div>';

    // زر دخول / قفل
    if (stage < this.MIN_DRAGON_STAGE) {
      h += '<div class="ar-locked">🥚 لازم تفقّس البيضة أولاً<div class="ar-meta">ادخل الأرينا من مستوى تنين ٣ وفوق</div></div>';
    } else {
      h += '<button class="ar-btn" data-ar="enter">🔥 ادخل المعركة</button>';
    }

    // إحصائياتي
    h += '<div class="ar-section">';
    h +=   '<h3>📊 إحصائياتك</h3>';
    h +=   '<div class="ar-row"><span class="ar-rank">⭐</span><span class="ar-name">النقاط</span><span class="ar-score">' + a.score.toLocaleString() + '</span></div>';
    h +=   '<div class="ar-row"><span class="ar-rank">🏆</span><span class="ar-name">انتصارات</span><span class="ar-score">' + a.wins + '</span></div>';
    h +=   '<div class="ar-row"><span class="ar-rank">💀</span><span class="ar-name">هزائم</span><span class="ar-score">' + a.losses + '</span></div>';
    h +=   '<div class="ar-row"><span class="ar-rank">🎯</span><span class="ar-name">هجمات اليوم</span><span class="ar-score">' + stat.free_left + '/' + this.MAX_FREE_ATTACKS + '</span></div>';
    h += '</div>';

    // Leaderboard
    h += '<div class="ar-section">';
    h +=   '<h3>🏅 الترتيب الأسبوعي</h3>';
    for (var i = 0; i < board.length; i++) {
      var r = board[i];
      var rk = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
      var cls = 'ar-row' + (r.isMe ? ' me' : '');
      h += '<div class="' + cls + '">';
      h +=   '<span class="ar-rank' + (i < 3 ? ' gold' : '') + '">' + rk + '</span>';
      h +=   '<span class="ar-emoji">' + r.emoji + '</span>';
      h +=   '<span class="ar-name">' + this.esc(r.name) + '</span>';
      h +=   '<span class="ar-score">' + r.score + '</span>';
      h += '</div>';
    }
    h += '</div>';

    // الجوائز
    h += '<div class="ar-section">';
    h +=   '<h3>🎁 جوائز نهاية الأسبوع</h3>';
    h +=   '<div class="ar-rew"><span class="rk">🥇 #1</span><span>قطعة أسطورية + 100,000 🪙</span></div>';
    h +=   '<div class="ar-rew"><span class="rk">🥈 #2-3</span><span>قطعة ملحمية + 50,000 🪙</span></div>';
    h +=   '<div class="ar-rew"><span class="rk">🥉 #4-10</span><span>قطعة نادرة + 20,000 🪙</span></div>';
    h +=   '<div class="ar-rew"><span class="rk">#11-25</span><span>قطعة عادية + 5,000 🪙</span></div>';
    h += '</div>';

    var body = document.getElementById('arena-body');
    if (body) body.innerHTML = h;
  },

  esc: function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c];
    });
  },

  // ═══════ Battle screen ═══════
  buildBattle: function () {
    var self = this;
    var old = document.getElementById('arena-battle');
    if (old) old.remove();
    var root = document.createElement('div');
    root.id = 'arena-battle';
    root.className = 'arb-wrap';
    root.innerHTML = '<div id="arb-body"></div>';
    document.body.appendChild(root);
    this._battleRoot = root;
  },

  startBattle: function () {
    if (this._locked) return;
    var stat = this.attackStatus();
    if (stat.free_left <= 0) {
      var st = this.ctx.state;
      if ((st.gems || 0) < this.ATTACK_COST_GEMS) {
        if (typeof showMessage === 'function') showMessage('💎 تحتاج ' + this.ATTACK_COST_GEMS + ' جوهرة');
        return;
      }
      if (!confirm('نفدت هجماتك المجانية. شراء هجمة بـ ' + this.ATTACK_COST_GEMS + ' 💎؟')) return;
    }
    var req = this.attackRequest();
    if (!req.ok) {
      var m = req.reason === 'need_gems' ? '💎 جواهر غير كافية (' + (req.have || 0) + '/' + (req.cost || 0) + ')' : '❌ تعذرت الهجمة';
      if (typeof showMessage === 'function') showMessage(m);
      return;
    }

    this._locked = false;
    this._finished = false;
    this.chooseEnemy();
    this.preparePlayer();
    this.renderBattle();
    if (this._battleRoot) this._battleRoot.classList.add('open');
  },

  chooseEnemy: function () {
    var stage = (this.ctx.state.dragon && this.ctx.state.dragon.stage) || 3;
    var bot = this.BOTS[Math.floor(Math.random() * this.BOTS.length)];
    var eStage = Math.max(this.MIN_DRAGON_STAGE, stage + bot.offset);
    var mhp = 350 + eStage * 110;
    this._enemy = {
      name: bot.name,
      emoji: bot.emoji,
      stage: eStage,
      power: 80 + eStage * 28,
      maxHp: mhp,
      hp: mhp
    };
  },

  preparePlayer: function () {
    var st = this.ctx.state;
    var d = st.dragon || {};
    var stage = d.stage || 3;
    var mhp = 350 + stage * 110;
    var power = 80 + stage * 28;

    // بونص عتاد التنين
    var eq = window.ModuleRegistry && window.ModuleRegistry.get('dragon_equipment');
    if (eq && typeof eq.getTotalBonus === 'function') {
      var b = eq.getTotalBonus();
      power = Math.round(power * (1 + (b.attack || 0) / 100));
    }

    this._player = {
      name: d.name || 'تنيني',
      emoji: this.stageEmoji(stage),
      stage: stage,
      power: power,
      maxHp: mhp,
      hp: mhp
    };
  },

  stageEmoji: function (s) {
    var d = window.ModuleRegistry && window.ModuleRegistry.get('dragons');
    if (d && d.STAGES && d.STAGES[s - 1]) return d.STAGES[s - 1].emoji || '🐉';
    return '🐉';
  },

  renderBattle: function () {
    var p = this._player, e = this._enemy;
    if (!p || !e) return;
    var pp = Math.max(0, (p.hp / p.maxHp) * 100);
    var ep = Math.max(0, (e.hp / e.maxHp) * 100);

    var h = '';
    h += '<div class="arb-top">';
    h +=   '<div class="arb-hpcard">';
    h +=     '<div class="nmrow"><div class="avatar">' + p.emoji + '</div>';
    h +=     '<div class="nm">' + this.esc(p.name) + '</div>';
    h +=     '<span class="lv">Lv' + p.stage + '</span></div>';
    h +=     '<div class="pw">⚔️ القوة: ' + p.power + '</div>';
    h +=     '<div class="arb-hpbar"><div class="arb-hpfill ' + (pp > 40 ? 'good' : 'bad') + '" id="arb-pfill" style="width:' + pp + '%"></div></div>';
    h +=     '<div class="hptxt" id="arb-ptxt">❤️ ' + p.hp + '/' + p.maxHp + '</div>';
    h +=   '</div>';
    h +=   '<div class="arb-vs">VS</div>';
    h +=   '<div class="arb-hpcard">';
    h +=     '<div class="nmrow"><div class="avatar">' + e.emoji + '</div>';
    h +=     '<div class="nm">' + this.esc(e.name) + '</div>';
    h +=     '<span class="lv">Lv' + e.stage + '</span></div>';
    h +=     '<div class="pw">⚔️ القوة: ' + e.power + '</div>';
    h +=     '<div class="arb-hpbar"><div class="arb-hpfill ' + (ep > 40 ? 'good' : 'bad') + '" id="arb-efill" style="width:' + ep + '%"></div></div>';
    h +=     '<div class="hptxt" id="arb-etxt">❤️ ' + e.hp + '/' + e.maxHp + '</div>';
    h +=   '</div>';
    h += '</div>';

    h += '<div class="arb-arena" id="arb-arena">';
    h +=   '<div class="arb-dragon player" id="arb-pdragon"><div class="emo">' + p.emoji + '</div></div>';
    h +=   '<div class="arb-dragon enemy" id="arb-edragon"><div class="emo">' + e.emoji + '</div></div>';
    h += '</div>';

    h += '<div class="arb-bottom">';
    h +=   '<button class="arb-btn" id="arb-attack">🔥 اضرب</button>';
    h += '</div>';

    h += '<div class="arb-result" id="arb-result"><div class="arb-card" id="arb-card"></div></div>';

    var body = document.getElementById('arb-body');
    if (body) body.innerHTML = h;

    var self = this;
    var btn = document.getElementById('arb-attack');
    if (btn) btn.addEventListener('click', function () { self.playerAttack(); });
  },

  updateHpBars: function () {
    var p = this._player, e = this._enemy;
    if (!p || !e) return;
    var pp = Math.max(0, (p.hp / p.maxHp) * 100);
    var ep = Math.max(0, (e.hp / e.maxHp) * 100);
    var pf = document.getElementById('arb-pfill');
    var ef = document.getElementById('arb-efill');
    var pt = document.getElementById('arb-ptxt');
    var et = document.getElementById('arb-etxt');
    if (pf) { pf.style.width = pp + '%'; pf.className = 'arb-hpfill ' + (pp > 40 ? 'good' : 'bad'); }
    if (ef) { ef.style.width = ep + '%'; ef.className = 'arb-hpfill ' + (ep > 40 ? 'good' : 'bad'); }
    if (pt) pt.textContent = '❤️ ' + Math.max(0, p.hp) + '/' + p.maxHp;
    if (et) et.textContent = '❤️ ' + Math.max(0, e.hp) + '/' + e.maxHp;
  },

  playerAttack: function () {
    if (this._locked || this._finished) return;
    var p = this._player, e = this._enemy;
    if (!p || !e) return;
    if (e.hp <= 0 || p.hp <= 0) return;

    this._locked = true;
    var self = this;

    var crit = Math.random() < 0.18;
    var dmg = Math.round(p.power * (0.85 + Math.random() * 0.4) * (crit ? 2 : 1));

    this.spawnFlame('right');
    var btn = document.getElementById('arb-attack');
    if (btn) btn.disabled = true;

    setTimeout(function () {
      e.hp = Math.max(0, e.hp - dmg);
      self.showDamage(e.hp > 0 ? 'enemy' : 'enemy', dmg);
      self.shake('arb-edragon');
      self.updateHpBars();

      if (e.hp <= 0) {
        setTimeout(function () { self.finish(true); }, 600);
        return;
      }
      setTimeout(function () { self.enemyTurn(); }, 800);
    }, 400);
  },

  enemyTurn: function () {
    if (this._finished) return;
    var p = this._player, e = this._enemy;
    if (!p || !e) return;

    var self = this;
    var crit = Math.random() < 0.12;
    var dmg = Math.round(e.power * 0.75 * (0.85 + Math.random() * 0.4) * (crit ? 2 : 1));

    this.spawnFlame('left');
    setTimeout(function () {
      p.hp = Math.max(0, p.hp - dmg);
      self.showDamage('player', dmg);
      self.shake('arb-pdragon');
      self.updateHpBars();

      if (p.hp <= 0) {
        setTimeout(function () { self.finish(false); }, 600);
        return;
      }
      self._locked = false;
      var btn = document.getElementById('arb-attack');
      if (btn) btn.disabled = false;
    }, 400);
  },

  spawnFlame: function (side) {
    var arena = document.getElementById('arb-arena');
    if (!arena) return;
    var f = document.createElement('div');
    f.className = 'arb-flame ' + side;
    f.innerHTML = '<div class="inner"></div>';
    arena.appendChild(f);
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 750);
  },

  showDamage: function (side, dmg) {
    var arena = document.getElementById('arb-arena');
    if (!arena) return;
    var target = side === 'enemy' ? document.getElementById('arb-edragon') : document.getElementById('arb-pdragon');
    if (!target) return;
    var tRect = target.getBoundingClientRect();
    var aRect = arena.getBoundingClientRect();
    var x = tRect.left - aRect.left + tRect.width / 2;
    var y = tRect.top - aRect.top + tRect.height / 3;
    var d = document.createElement('div');
    d.className = 'arb-dmg';
    d.textContent = '-' + dmg;
    d.style.left = x + 'px';
    d.style.top = y + 'px';
    d.style.transform = 'translateX(-50%)';
    arena.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 950);
  },

  shake: function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.add('shake');
    setTimeout(function () { el.classList.remove('shake'); }, 250);
  },

  finish: function (won) {
    if (this._finished) return;
    this._finished = true;
    this._locked = true;

    var score = won ? (5 + Math.floor(Math.random() * 6)) : 0;
    this.awardScore(score, won);

    var card = document.getElementById('arb-card');
    var result = document.getElementById('arb-result');
    if (!card || !result) return;

    var self = this;
    if (won) {
      card.className = 'arb-card';
      card.innerHTML =
        '<div class="title">🏆 لقد فزت</div>' +
        '<div class="body">' +
          '<div class="big">🏆</div>' +
          '<div class="points">+' + score + '</div>' +
          '<div class="points-lbl">نقاط أرينا</div>' +
          '<div class="btns">' +
            '<button class="btn-again" id="arb-again">⚔️ معركة جديدة</button>' +
            '<button class="btn-exit" id="arb-exit">خروج</button>' +
          '</div>' +
        '</div>';
    } else {
      card.className = 'arb-card lose';
      card.innerHTML =
        '<div class="title">💀 خسرت</div>' +
        '<div class="body">' +
          '<div class="big" style="opacity:.7">☠️</div>' +
          '<div style="color:#cbd5e1;margin-top:8px">حاول مرة ثانية!</div>' +
          '<div class="btns">' +
            '<button class="btn-again" id="arb-again">⚔️ معركة جديدة</button>' +
            '<button class="btn-exit" id="arb-exit">خروج</button>' +
          '</div>' +
        '</div>';
    }
    result.classList.add('open');

    var again = document.getElementById('arb-again');
    if (again) again.addEventListener('click', function () { self.newBattle(); });
    var exit = document.getElementById('arb-exit');
    if (exit) exit.addEventListener('click', function () { self.closeBattle(); self.renderArena(); });
  },

  newBattle: function () {
    var result = document.getElementById('arb-result');
    if (result) result.classList.remove('open');
    if (this._battleRoot) this._battleRoot.classList.remove('open');
    if (this._arenaRoot) this._arenaRoot.classList.add('open');
    this.renderArena();
  },

  closeBattle: function () {
    if (this._battleRoot) this._battleRoot.classList.remove('open');
    var result = document.getElementById('arb-result');
    if (result) result.classList.remove('open');
    this._finished = true;
    this._locked = false;
  }
});
