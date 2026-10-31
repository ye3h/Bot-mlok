// modules/ship_market.js — سوق السفن (v4.0.2 - متوافق ومحدث)
ModuleRegistry.register({
  id: 'ship_market', name: 'سوق السفن', version: '4.0.2', dependencies: [],
  ctx: null, selected: null, _isOpen: false, _lastTick: 0,
  IN_SHOP_ONLY: { 'phoenix':1, 'dragon-t1':1, 'dragon-t2':1, 'dragon-t3':1, 'submarine':1 },
  SHIP_FLAVOR: {
    'ship-lvl-1': 'قارب خشبي بسيط للمبتدئين — يبدأ رحلتك من ميناء صغير.',
    'ship-lvl-2': 'قارب أكبر بمجاديف أطول وشراع متهالك، يتجرأ على المياه الأبعد قليلاً.',
    'ship-lvl-3': 'سفينة شراعية رشيقة تتمايل مع أمواج الساحل.',
    'ship-lvl-4': 'سفينة بمجاديف قوية — أولى خطواتك الحقيقية نحو الأعماق.',
    'ship-lvl-5': 'يخت أبيض أنيق بمحرك هادئ — رمز الطبقة الوسطى.',
    'ship-lvl-6': 'قارب حربي مدرّع — لمواجهة القراصنة في المياه الخطرة.',
    'ship-lvl-7': 'سفينة كمين شبحية تنقضّ على فريستها من حيث لا تراها.',
    'ship-lvl-8': 'حفّارة بحرية ثقيلة تجرف أمواج البحر بلا رحمة.',
    'ship-lvl-9': 'باخرة ضخمة بمداخن بخار ومستودعات واسعة — تنقل صيداً وفيراً.',
    'ship-lvl-10': 'سفينة أبحاث علمية بأجهزة سونار متقدمة — تصطاد ما لا يراه الآخرون.',
    'ship-lvl-11': 'سفينة بفوانيس متوهجة تجذب كائنات الأعماق إليها.',
    'ship-lvl-12': 'سفينة احتفالية مزخرفة بأضواء وأشرعة فاخرة.',
    'ship-lvl-13': 'سفينة سريعة كالصقر — تنقضّ على الفريسة قبل أن تهرب.',
    'ship-lvl-14': 'سفينة أعماق متخصصة بالنزول لقاع المحيط — حيث لا يصل أحد.',
    'ship-lvl-15': 'سفينة تشق العواصف بلا خوف — ملكة الأمواج الهادئة.',
    'ship-lvl-16': 'سفينة شبحية سوداء تثير الرعب في قلوب الأعداء.',
    'ship-lvl-17': 'سفينة محيطية تجوب المياه الزرقاء الواسعة.',
    'ship-lvl-18': 'سفينة لا توقفها الأعاصير ولا الأمواج العاتية.',
    'ship-lvl-19': 'سفينة جبّارة بهيكل فولاذي ضخم — قلعة عائمة.',
    'ship-lvl-20': 'سفينة مظلمة كموجة الليل — تظهر وتختفي في لمح البصر.',
    'ship-lvl-21': 'سفينة فاتحة للأقاليم البحرية النائية.',
    'ship-lvl-22': 'سفينة تتألأل كنجم يهتدي به البحّارة في الظلام.',
    'ship-lvl-23': 'سفينة الأسطورة التي تجوب أعمق الأعماق المظلمة.',
    'ship-lvl-24': 'سفينة نهائية تصل لحدود المحيط البعيد.',
    'ship-lvl-25': 'عرش بحري ملكي للقباطنة الأسطوريين.',
    'ship-lvl-26': 'سفينة الأسد المرعبة بقوة لا تُقهر.',
    'ship-lvl-27': 'سفينة تيتانيوم لا يخترقها شيء.',
    'ship-lvl-28': 'سفينة ملك المحيط بلا منازع.',
    'ship-lvl-29': 'تنين بحري ينفث الرعب في الأمواج العاتية.',
    'ship-lvl-30': 'السفينة النهائية: نهاية كل الأعماق.',
    'submarine': 'غواصة سوداء فاخرة — تغوص حيث لا تصل السفن العادية.',
    'phoenix': 'سفينة العنقاء الحمراء — تصيد عنقاء النار النادرة فقط.',
    'dragon-t1': 'سفينة التنين الدموي — أسطورة حمراء تصيد التنين الأسود.',
    'dragon-t2': 'سفينة التنين الفضي — قوة تفوق التنانين الحمراء.',
    'dragon-t3': 'سفينة التنين الذهبي — قمة التنين، تاج الأباطرة.',
    'royal-whale': 'الحوت الأرجواني — غواصة-حوت ملكية قابلة للترقية بنظام النجوم.',
    'tribe-lightning': 'سفينة البرق — سرعة خارقة لأعضاء القبيلة.',
    'tribe-tornado': 'سفينة الإعصار — درع ثقيل لا يُخترق.',
    'tribe-fire': 'سفينة النار — قوة نارية مدمّرة.'
  },
  init: function (ctx) {
    var self = this; this.ctx = ctx;
    if (window.SHIP_CATALOG && Array.isArray(window.SHIP_CATALOG)) { window.SHIP_CATALOG.sort(function (a, b) { var la = a.level || 0; var lb = b.level || 0; if (la !== lb) return la - lb; var pa = a.price || 0; var pb = b.price || 0; return pa - pb; }); }
    if (!document.getElementById('screen-shipyard')) {
      var sec = document.createElement('section'); sec.className = 'screen'; sec.id = 'screen-shipyard';
      sec.innerHTML = '<div class="sh"><span class="st">⛵ سوق السفن</span><button class="close-btn" data-close>✕</button></div><div class="sb" id="shipyardBody"></div>';
      document.getElementById('app').appendChild(sec);
      sec.querySelector('.close-btn').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); self._isOpen = false; if (typeof closeScreen === 'function') closeScreen(); });
      document.getElementById('shipyardBody').addEventListener('click', function (e) { self.onClick(e); });
    }
    if (window.rpcShips) window.rpcShips('finalize_market_upgrades'); setInterval(function () { self.tick(); }, 1000);
  },
  tick: function () {
    var now = Date.now(); if (now - this._lastTick < 1000) return; this._lastTick = now; var m = this.ctx.state.market; if (!m || !m.upgrade_ends_at) return;
    if (now >= m.upgrade_ends_at) { window.rpcShips('finalize_market_upgrades'); if (this._isOpen) this.render(); }
    else if (this._isOpen) { var el = document.getElementById('smLeftLabel'); if (el) { var secLeft = Math.max(0, Math.ceil((m.upgrade_ends_at - now) / 1000)); el.textContent = shipFmtCountdown(secLeft); } }
  },
  open: function () { this._isOpen = true; if (!this.selected && window.SHIP_CATALOG && SHIP_CATALOG[0]) { this.selected = SHIP_CATALOG[0].code; } if (typeof openScreen === 'function') openScreen('shipyard'); this.render(); },
  onClick: function (e) {
    var t = e.target.closest('[data-sm]'); if (!t) return; var act = t.getAttribute('data-sm');
    if (act === 'pick') { this.selected = t.getAttribute('data-code'); this.render(); return; }
    if (act === 'buy') { e.stopPropagation(); this.buy(t.getAttribute('data-code')); return; }
    if (act === 'start-upgrade') { this.startUpgrade(); return; }
    if (act === 'boost') { this.boostUpgrade(); return; }
    if (act === 'storage') { this.openStorage(); return; }
  },
  openStorage: function () {
    var s = window.ModuleRegistry && window.ModuleRegistry.get('ship_storage');
    if (s && typeof s.open === 'function') { s.open(); return; }
    var f = window.ModuleRegistry && window.ModuleRegistry.get('fleet');
    if (f && typeof f.openStorage === 'function') { f.openStorage(); return; }
    this.ctx.ui.toast('⚠️ موديول المخزن غير محمل');
  },
  buy: function (code) {
    var def = SHIP_BY_CODE[code]; if (!def) return;
    var fleet = window.shipsUtils.fleetCount(); var stor = window.shipsUtils.storageCount(); var cap = window.shipsUtils.storageCapacity();
    if (fleet >= 3 && stor >= cap) { this.ctx.ui.toast('🚫 الأسطول والمخزن ممتليئان'); return; }
    var res = window.rpcShips('buy_ship_by_code', { _code: code, _template_id: 0, _price_coins: def.price, _max_hp: def.hp });
    if (res.error) { if (/market_level_required/.test(res.error.message)) { this.ctx.ui.toast('🔒 يتطلب مستوى السوق ' + def.level); return; } if (res.error.message === 'no_coins') { this.ctx.ui.toast('💰 الذهب غير كافٍ'); return; } this.ctx.ui.toast('❌ ' + res.error.message); return; }
    this.ctx.ui.toast('✅ اشتريت ' + def.name); if (typeof beep === 'function') beep(780, 0.1); this.render();
  },
  startUpgrade: function () {
    var self = this; var m = this.ctx.state.market; var cost = window.rpcShips('market_upgrade_cost', { _level: m.level || 1 }).data;
    if (cost.max) { this.ctx.ui.toast('🏆 وصلت الحد الأقصى'); return; } var mins = Math.ceil((cost.seconds || 0) / 60);
    this.ctx.ui.confirm('ترقية السوق إلى المستوى ' + ((m.level || 1) + 1) + '؟\n' + 'التكلفة: ' + cost.cost_coins.toLocaleString() + ' 💰\nالمدة: ' + mins + ' دقيقة', function () {
      var res = window.rpcShips('market_start_upgrade');
      if (res.error) { var em = res.error.message; if (em === 'no_coins') { self.ctx.ui.toast('💰 الذهب غير كافٍ'); return; } if (em === 'max_level') { self.ctx.ui.toast('وصلت الحد الأقصى'); return; } if (em === 'fish_market_required') { self.ctx.ui.toast('🐟 لازم سوق السمك مستوى ' + res.error.required); return; } if (em === 'upgrade_in_progress') { self.ctx.ui.toast('⏳ ترقية جارية'); return; } self.ctx.ui.toast('❌ ' + em); return; }
      self.ctx.ui.toast('⏳ بدأَت الترقية'); self.render();
    });
  },
  boostUpgrade: function () {
    var self = this; var m = this.ctx.state.market; if (!m.upgrade_ends_at) return; var secLeft = Math.max(0, Math.ceil((m.upgrade_ends_at - Date.now()) / 1000)); var gemsCost = Math.max(1, Math.ceil(secLeft / 60));
    this.ctx.ui.confirm('إنهاء الترقية الآن بـ ' + gemsCost + ' 💎؟', function () {
      var res = window.rpcShips('market_finish_upgrade_with_gems');
      if (res.error) { if (res.error.message === 'no_gems') { self.ctx.ui.toast('💎 جواهر غير كافية'); return; } self.ctx.ui.toast('❌ ' + res.error.message); return; }
      self.ctx.ui.toast('✅ تمت الترقية'); self.render();
    });
  },
  render: function () {
    var body = document.getElementById('shipyardBody'); if (!body || !this.ctx) return; var st = this.ctx.state; var m = st.market || { level:1 };
    var selected = SHIP_BY_CODE[this.selected] || SHIP_CATALOG[0]; var ownedByCode = {};
    for (var i = 0; i < (st.ships || []).length; i++) { var s = st.ships[i]; ownedByCode[s.code] = (ownedByCode[s.code] || 0) + 1; }
    var h = '<div style="padding-bottom:20px">'; h += this._renderHeader(m, st); h += this._renderFeatured(selected, m, ownedByCode[selected.code] || 0); h += this._renderUpgrade(m, st); h += this._renderStorageBtn(st); h += this._renderList(m, ownedByCode, selected.code); h += '</div>'; body.innerHTML = h;
  },
  _renderHeader: function (m, st) {
    var lvl = m.level || 1; var upg = !!m.upgrading_to; var h = '';
    h += '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:14px;background:linear-gradient(180deg,rgba(30,45,75,.9),rgba(15,25,45,.95));border:1.5px solid rgba(252,191,73,.35);margin-bottom:12px;flex-wrap:wrap;box-shadow:0 0 20px rgba(252,191,73,.15)">';
    h += '<div style="font-weight:900;font-size:15px;color:#fef3c7">⛵ سوق السفن</div><span style="font-size:10px;padding:3px 8px;border-radius:6px;background:rgba(252,191,73,.15);border:1px solid rgba(252,191,73,.4);color:#fbbf24;font-weight:800">L' + lvl + '/33</span>';
    if (upg) h += '<span style="font-size:10px;padding:3px 8px;border-radius:6px;background:rgba(56,189,248,.15);border:1px solid rgba(56,189,248,.4);color:#7dd3fc;font-weight:800">→ ' + m.upgrading_to + '</span>';
    h += '<div style="flex:1"></div><div style="font-size:11px;font-weight:800;padding:4px 9px;border-radius:8px;background:rgba(252,191,73,.1);border:1px solid rgba(252,191,73,.3);color:#fef3c7">💰 ' + (st.coins||0).toLocaleString() + '</div><div style="font-size:11px;font-weight:800;padding:4px 9px;border-radius:8px;background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.4);color:#e9d5ff">💎 ' + (st.gems||0).toLocaleString() + '</div></div>';
    return h;
  },
  _renderFeatured: function (s, m, ownedCount) {
    var r = shipRarity(s.rarity); var glowMap = { common: 'rgba(156,163,175,.2)', rare: 'rgba(56,189,248,.35)', epic: 'rgba(168,85,247,.45)', legendary: 'rgba(251,191,36,.55)', mythic: 'rgba(244,63,94,.55)', uncommon: 'rgba(10,185,129,.3)' };
    var glow = glowMap[s.rarity] || glowMap.common; var locked = (m.level || 1) < s.level; var isShiny = s.rarity === 'legendary' || s.rarity === 'mythic'; var h = '';
    h += '<div style="position:relative;padding:14px;border-radius:18px;background:linear-gradient(180deg,rgba(30,45,75,.95),rgba(10,18,35,.98));border:1.5px solid ' + r.ring + ';margin-bottom:12px;overflow:hidden;box-shadow:0 0 28px ' + glow + ', inset 0 1px 0 rgba(255,255,255,.06)">';
    if (isShiny) { h += '<div style="position:absolute;inset:0;pointer-events:none;background:linear-gradient(120deg, transparent 30%, rgba(255,255,255,.08) 50%, transparent 70%);animation:sm-shine 3.5s linear infinite"></div>'; }
    h += '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;position:relative;z-index:1">';
    h += '<div style="flex:1"><div style="font-size:9px;letter-spacing:4px;color:#94a3b8;font-weight:800">FEATURED VESSEL</div><div style="font-size:22px;font-weight:900;color:#fff;margin-top:2px;text-shadow:0 2px 8px rgba(0,0,0,.5)">' + s.name + '</div></div>';
    h += '<span style="font-size:10px;padding:4px 9px;border-radius:6px;background:' + r.bg + ';border:1px solid ' + r.ring + ';color:' + r.color + ';font-weight:900;white-space:nowrap">' + r.name + '</span>';
    if (ownedCount > 0) { h += '<span style="font-size:10px;padding:4px 9px;border-radius:6px;background:rgba(76,175,80,.2);border:1px solid rgba(76,175,80,.5);color:#86efac;font-weight:900;white-space:nowrap">مملوك ×' + ownedCount + '</span>'; }
    h += '</div>';
    h += '<div style="position:relative;height:180px;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at center, ' + glow + ' 0%, transparent 70%);border-radius:14px;margin-bottom:12px;overflow:hidden">';
    h += '<img src="' + s.img + '" alt="" style="max-height:170px;max-width:88%;object-fit:contain;filter:drop-shadow(0 12px 22px rgba(0,0,0,.7));animation:sm-float 3s ease-in-out infinite" onerror="this.style.display=\'none\';this.parentNode.innerHTML=\'<span style=&quot;font-size:90px&quot;>' + s.emoji + '</span>\'"></div>';
    h += '<div style="font-size:12.5px;line-height:1.7;color:#cbd5e1;text-align:center;margin-bottom:12px;font-style:italic;position:relative;z-index:1">' + this._flavorOf(s) + '</div>';
    h += '<div style="padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.35);border:1px solid rgba(56,189,248,.25);margin-bottom:12px;position:relative;z-index:1">';
    h += '<div style="font-size:10px;letter-spacing:2px;color:#7dd3fc;font-weight:900;margin-bottom:7px">🎣 يصطاد</div><div style="display:flex;flex-wrap:wrap;gap:6px">';
    for (var i = 0; i < s.fishPool.length && i < 5; i++) { var fid = s.fishPool[i]; var fish = FISH[fid]; var fname = fish ? fish.name : fid; var femoji = fish ? (fish.emoji || '🐟') : '🐟'; h += '<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:8px;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.3);color:#bae6fd;font-size:11px;font-weight:800">'; h += '<img src="assets/fish/' + fid + '.webp" alt="" style="width:20px;height:20px;object-fit:contain" onerror="this.replaceWith(document.createTextNode(\'' + femoji + '\'))">'; h += '<span>' + fname + '</span></span>'; }
    h += '</div></div>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px;position:relative;z-index:1">';
    h += this._stat('❤️', 'HP', s.hp.toLocaleString()); h += this._stat('📦', 'STORAGE', s.storage.toLocaleString()); h += this._stat('🛡️', 'ARMOR', String(s.armor)); h += this._stat('⚡', 'SPEED', String(s.speed)); h += this._stat('🎣', 'CATCH/TRIP', s.tripSec + 'ث'); h += this._stat('🛠️', 'REPAIR', shipFmtTime(s.repairSec));
    h += '</div>';
    var disabled = locked || s.price === 0; var priceLabel = locked ? ('🔒 يتطلب مستوى ' + s.level) : (s.price > 0 ? ('💰 ' + s.price.toLocaleString()) : '—');
    h += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:rgba(252,191,73,.08);border:1px solid rgba(252,191,73,.35);position:relative;z-index:1">';
    h += '<div style="flex:1"><div style="font-size:9px;letter-spacing:2px;color:#94a3b8;font-weight:800">PRICE</div><div style="font-size:16px;font-weight:900;color:#fbbf24">' + priceLabel + '</div></div>';
    h += '<button data-sm="buy" data-code="' + s.code + '"' + (disabled ? ' disabled' : '') + ' style="padding:11px 22px;border-radius:12px;border:1.5px solid ' + (disabled ? '#475569' : '#fcd34d') + ';background:' + (disabled ? '#334155' : 'linear-gradient(180deg,#fde68a,#d97706)') + ';color:' + (disabled ? '#94a3b8' : '#1c1917') + ';font-weight:900;font-size:13px;cursor:' + (disabled ? 'default' : 'pointer') + ';opacity:' + (disabled ? '.5' : '1') + ';box-shadow:' + (disabled ? 'none' : '0 0 20px rgba(251,191,36,.4)') + '">' + (disabled ? 'مقفل' : 'اشتري الآن') + '</button></div>';
    h += '</div>'; h += '<style>@keyframes sm-shine{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}@keyframes sm-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}</style>'; return h;
  },
  _renderUpgrade: function (m, st) {
    var lvl = m.level || 1; var upg = !!m.upgrading_to; var secLeft = upg ? Math.max(0, Math.ceil((m.upgrade_ends_at - Date.now()) / 1000)) : 0; var boostGems = upg ? Math.max(1, Math.ceil(secLeft / 60)) : 0; var h = '';
    h += '<div style="padding:11px 12px;border-radius:14px;background:linear-gradient(180deg,rgba(30,45,75,.85),rgba(12,20,40,.9));border:1.5px solid rgba(252,191,73,.25);margin-bottom:12px">';
    h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="font-size:18px">🛠️</div><div style="flex:1"><div style="font-weight:900;font-size:13px;color:#fef3c7">ترقية السوق</div><div style="font-size:10px;color:#94a3b8">تفتح سفن أعلى</div></div><span style="font-size:10px;color:#94a3b8">L' + lvl + ' → L' + (lvl + 1) + '</span></div>';
    if (upg) {
      h += '<div style="padding:9px;border-radius:10px;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.3)"><div style="display:flex;justify-content:space-between;font-size:11px;color:#e2e8f0;margin-bottom:7px"><span>⏳ جاري الترقية</span><span id="smLeftLabel">' + shipFmtCountdown(secLeft) + '</span></div>';
      h += '<button data-sm="boost" style="width:100%;padding:9px;border-radius:9px;border:0;background:linear-gradient(180deg,#c4b5fd,#7c3aed);color:#fff;font-weight:900;font-size:12px;cursor:pointer">💎 إنهاء الآن (' + boostGems + ')</button></div>';
    } else {
      var cost = window.rpcShips('market_upgrade_cost', { _level: lvl }).data; var freq = window.shipsUtils.fishMarketReqFor(lvl + 1); var canUp = lvl < 33; var reqOk = freq === 0 || (st.fishMarketLevel || 1) >= freq;
      h += '<div style="display:flex;justify-content:space-between;font-size:11px;color:#e2e8f0;margin-bottom:8px;flex-wrap:wrap;gap:6px"><span>💰 ' + cost.cost_coins.toLocaleString() + '</span><span>⏱ ' + Math.ceil(cost.seconds / 60) + ' د</span>';
      if (freq > 0) h += '<span style="color:' + (reqOk ? '#86efac' : '#fca5a5') + '">🐟 L' + freq + '</span>'; h += '</div>';
      var btnOk = canUp && reqOk; h += '<button data-sm="start-upgrade"' + (btnOk ? '' : ' disabled') + ' style="width:100%;padding:10px;border-radius:10px;border:0;background:' + (btnOk ? 'linear-gradient(180deg,#fcd34d,#d97706)' : '#334155') + ';color:' + (btnOk ? '#1c1917' : '#94a3b8') + ';font-weight:900;font-size:12px;cursor:' + (btnOk ? 'pointer' : 'default') + '">' + (canUp ? (reqOk ? 'ترقية السوق' : 'سوق السمك ناقص') : '🏆 وصلت الحد') + '</button>';
    }
    h += '</div>'; return h;
  },
  _renderStorageBtn: function (st) {
    var fleet = window.shipsUtils.fleetCount(); var stor = window.shipsUtils.storageCount(); var cap = window.shipsUtils.storageCapacity();
    return '<button data-sm="storage" style="width:100%;margin-bottom:14px;padding:11px;border-radius:12px;border:1.5px solid #fbbf24;background:linear-gradient(180deg,rgba(251,191,36,.2),rgba(180,83,9,.15));color:#fef3c7;font-weight:800;font-size:13px;cursor:pointer">📦 مخزن السفن · نشطة ' + fleet + '/3 · مخزن ' + stor + '/' + cap + '</button>';
  },
  _renderList: function (m, ownedByCode, selectedCode) {
    var h = '<div style="display:flex;align-items:center;gap:8px;margin:0 2px 8px"><span style="font-size:14px">⛵</span><span style="font-weight:900;font-size:13px;color:#fde68a">كل السفن</span><div style="flex:1;height:1px;background:linear-gradient(90deg, rgba(252,191,73,.5), transparent)"></div><span style="font-size:10px;color:#94a3b8">' + SHIP_CATALOG.filter(function(s){ return !s.tribeOnly; }).length + ' سفينة</span></div>';
    h += '<div style="display:grid;grid-template-columns:1fr;gap:6px">';
    for (var k = 0; k < SHIP_CATALOG.length; k++) { var s = SHIP_CATALOG[k]; if (s.tribeOnly) continue; if (this.IN_SHOP_ONLY[s.code]) continue; h += this._cardSmall(s, m.level || 1, ownedByCode[s.code] || 0, s.code === selectedCode); }
    h += '</div>'; return h;
  },
  _cardSmall: function (s, marketLvl, owned, isSelected) {
    var r = shipRarity(s.rarity); var locked = marketLvl < s.level; var h = '';
    h += '<div data-sm="pick" data-code="' + s.code + '" style="display:flex;gap:10px;padding:9px;border-radius:12px;background:' + (isSelected ? 'linear-gradient(180deg,rgba(252,191,73,.15),rgba(180,83,9,.08))' : 'linear-gradient(180deg,rgba(20,35,60,.7),rgba(12,22,42,.8))') + ';border:1.5px solid ' + (isSelected ? '#fbbf24' : r.ring) + ';cursor:pointer;transition:transform .1s;align-items:center">';
    h += '<div style="width:60px;height:50px;flex-shrink:0;border-radius:9px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative">';
    h += '<img src="' + s.img + '" alt="" style="max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 3px 6px rgba(0,0,0,.5))" onerror="this.style.display=\'none\';this.parentNode.innerHTML=\'<span style=&quot;font-size:24px&quot;>' + s.emoji + '</span>\'"></div>';
    h += '<div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:5px;margin-bottom:2px"><span style="font-weight:900;font-size:12px;color:' + r.color + ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + s.name + '</span>';
    if (owned > 0) h += '<span style="font-size:9px;padding:1px 5px;border-radius:4px;background:rgba(76,175,80,.25);border:1px solid rgba(76,175,80,.5);color:#86efac;font-weight:800">×' + owned + '</span>';
    h += '</div><div style="font-size:10px;color:#94a3b8;display:flex;gap:8px"><span>مستوى ' + s.level + '</span><span style="color:' + r.color + '">' + r.name + '</span></div></div>';
    h += '<div style="text-align:left;min-width:70px">';
    if (locked) { h += '<div style="font-size:11px;font-weight:900;color:#fca5a5">🔒 L' + s.level + '</div><div style="font-size:9px;color:#94a3b8;margin-top:2px">مقفل</div>'; }
    else if (s.price > 0) { h += '<div style="font-size:11px;font-weight:900;color:#fbbf24">💰 ' + this._fmtPrice(s.price) + '</div><div style="font-size:9px;color:#94a3b8;margin-top:2px">لشراء</div>'; }
    else { h += '<div style="font-size:11px;color:#94a3b8">—</div>'; }
    h += '</div></div>'; return h;
  },
  _stat: function (ico, label, val) { return '<div style="padding:9px 10px;border-radius:10px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.07);text-align:center"><div style="font-size:14px;line-height:1">' + ico + '</div><div style="font-size:8px;letter-spacing:1.5px;color:#94a3b8;margin-top:4px;font-weight:800">' + label + '</div><div style="font-size:13px;font-weight:900;color:#fef3c7;margin-top:2px">' + val + '</div></div>'; },
  _flavorOf: function (s) { if (this.SHIP_FLAVOR[s.code]) return this.SHIP_FLAVOR[s.code]; var names = s.fishPool.slice(0, 3).map(function (id) { return FISH[id] ? FISH[id].name : id; }).join('، '); return 'سفينة بمستوى ' + s.level + ' — تصطاد ' + names + '.'; },
  _fmtPrice: function (n) { if (n >= 1e9) return (n/1e9).toFixed(1) + 'B'; if (n >= 1e6) return (n/1e6).toFixed(1) + 'M'; if (n >= 1e3) return (n/1e3).toFixed(1) + 'K'; return n.toLocaleString(); }
});
