// modules/fish_market.js — سوق السمك (v1.2.0 - النسخة المحسّنة والمطوّرة)
ModuleRegistry.register({
  id: 'fish_market',
  name: 'سوق السمك',
  version: '1.2.0',
  dependencies: [],
  ctx: null, 
  _isOpen: false, 
  _lastTick: 0, 
  _tab: 'market', 
  _sellFish: null, 
  _sellQty: 1,
  FREEZE_COST_GEMS: 50, 
  TRADER_COST_GEMS: 200,
  FISH_ORDER: [
    'sardine','anchovy','herring','smelt','minnow','shrimp','crab_small','bass','cod','snapper','trout','squid','lobster','eel','koi','salmon','mullet','mackerel','octopus','flounder','grouper','carp','marlin','swordfish','barracuda','stingray','arowana','pearl','phoenix','tang_blue','tuna','shark','sailfish','manta','whale','orca','leviathan','kraken','black_pearl','goldfish','hammerhead','megalodon','abyss_titan','sea_dragon','poseidon','coral_phantom','golden_koi','imperial_moonfish','royal_amethyst','diamond_manta','silver_arowana','kraken_spawn','ink_wraith','abyss_watcher','void_serpent','black_dragon'
  ],

  init: function (ctx) {
    var self = this; 
    this.ctx = ctx;
    if (!document.getElementById('screen-fishmarket')) {
      var sec = document.createElement('section'); 
      sec.className = 'screen'; 
      sec.id = 'screen-fishmarket';
      sec.innerHTML = '<div class="sh"><span class="st">🐟 سوق السمك</span><button class="close-btn" data-close>✕</button></div><div class="tabs" id="fmTabs"><button class="tab active" data-fm-tab="market">🛒 السوق</button><button class="tab" data-fm-tab="discovery">🔍 المكتشف</button></div><div class="sb" id="fishMarketBody"></div>';
      document.getElementById('app').appendChild(sec);
      sec.querySelector('.close-btn').addEventListener('click', function (e) { 
        e.preventDefault(); 
        e.stopPropagation(); 
        self._isOpen = false; 
        if (typeof closeScreen === 'function') closeScreen(); 
      });
      document.getElementById('fmTabs').addEventListener('click', function (e) { 
        var b = e.target.closest('[data-fm-tab]'); 
        if (!b) return; 
        self._tab = b.getAttribute('data-fm-tab'); 
        self._sellFish = null; 
        self.render(); 
      });
      document.getElementById('fishMarketBody').addEventListener('click', function (e) { 
        self.onClick(e); 
      });
    }
    if (window.rpcShips) { 
      try { 
        window.rpcShips('finalize_market_upgrades'); 
        window.rpcShips('finalize_fish_market_upgrades'); 
      } catch (e) {} 
    }
    setInterval(function () { self.tick(); }, 1000);
  },

  tick: function () {
    var now = Date.now(); 
    if (now - this._lastTick < 1000) return; 
    this._lastTick = now;
    if (!this.ctx || !this.ctx.state) return; 
    var st = this.ctx.state;
    if (!st.fishMarket) { 
      st.fishMarket = { level: 1, upgrading_to: null, upgrade_ends_at: null, upgrade_started_at: null, upgrade_cost_coins: null }; 
      if (typeof st.fishMarketLevel !== 'number') st.fishMarketLevel = 1; 
    }
    var f = st.fishMarket; 
    if (!f || !f.upgrade_ends_at) return;

    // إصلاح العطل السابق بضبط التحقق من الترقية
    if (now >= f.upgrade_ends_at) { 
      if (window.rpcShips) window.rpcShips('finalize_fish_market_upgrades'); 
      if (this._isOpen) this.render(); 
    } else if (this._isOpen && this._tab === 'market') { 
      var el = document.getElementById('fmLeftLabel'); 
      if (el) { 
        var secLeft = Math.max(0, Math.ceil((f.upgrade_ends_at - now) / 1000)); 
        el.textContent = typeof shipFmtCountdown === 'function' ? shipFmtCountdown(secLeft) : (secLeft + 'ث'); 
      } 
    }
  },

  open: function () { 
    this._isOpen = true; 
    this._tab = 'market'; 
    this._sellFish = null; 
    if (typeof marketTick === 'function') marketTick(); 
    if (typeof openScreen === 'function') openScreen('fishmarket'); 
    this.render(); 
  },

  onClick: function (e) {
    var t = e.target.closest('[data-fm]'); 
    if (!t) return; 
    var act = t.getAttribute('data-fm'); 
    var val = t.getAttribute('data-id');

    if (act === 'pick') { this._sellFish = val; this._sellQty = 1; this.render(); return; }
    if (act === 'sell-qty') { this._sellQty = Math.max(1, parseInt(t.getAttribute('data-n'), 10) || 1); this.render(); return; }
    if (act === 'sell-max') { var rec = this.getSellRecord(); this._sellQty = rec ? rec.qty : 1; this.render(); return; }
    if (act === 'sell-confirm') { this.sell(); return; }
    if (act === 'sell-cancel') { this._sellFish = null; this._sellQty = 1; this.render(); return; }
    if (act === 'sell-all') { this.sellAll(); return; }
    if (act === 'start-upgrade'){ this.startUpgrade(); return; }
    if (act === 'boost') { this.boostUpgrade(); return; }
    if (act === 'freeze') { this.buyFreeze(); return; }
    if (act === 'trader') { this.buyTrader(); return; }
  },

  getSellRecord: function () {
    var id = this._sellFish; 
    if (!id) return null; 
    var st = this.ctx.state; 
    var qty = st.inventory[id] || 0; 
    if (qty <= 0) return null;
    var price = typeof fishCurrentPrice === 'function' ? fishCurrentPrice(id) : ((window.FISH && window.FISH[id] && window.FISH[id].base) || 10); 
    var range = typeof fishPriceRange === 'function' ? fishPriceRange(id) : { min: Math.round(price * 0.8), max: Math.round(price * 1.2) }; 
    var trend = typeof fishTrend === 'function' ? fishTrend(id) : 'flat'; 
    var label = typeof fishPriceLabel === 'function' ? fishPriceLabel(id) : { text: 'مستقر', color: '#fbbf24', arrow: '➔' };
    return { id: id, qty: qty, price: price, min: range.min, max: range.max, trend: trend, label: label };
  },

  sell: function () {
    var rec = this.getSellRecord(); 
    if (!rec) return;
    var st = this.ctx.state;
    var n = Math.min(this._sellQty, rec.qty); 
    if (n <= 0) { this.ctx.ui.toast('اختر كمية صالحة'); return; }

    var got = 0;
    var unitP = typeof unitPrice === 'function' ? unitPrice : function(id) { return rec.price; };
    for (var i = 0; i < n; i++) { 
      got += unitP(rec.id); 
      if (st.market && st.market[rec.id]) {
        var m = st.market[rec.id]; 
        var minMult = (window.MARKET && window.MARKET.MIN_MULT) || 0.5;
        var dropRate = (window.MARKET && window.MARKET.SELL_DROP) || 0.01;
        m.mult = Math.max(minMult, m.mult * (1 - dropRate)); 
        m.soldSinceTick = (m.soldSinceTick || 0) + 1; 
      }
    }

    // تطبيق بونص طاقم التاجر أو القبيلة إن وجد
    var tModule = window.ModuleRegistry && window.ModuleRegistry.get('tribe');
    if (tModule && typeof tModule.applyGoldBonus === 'function') {
      got += tModule.applyGoldBonus(got);
    }

    st.inventory[rec.id] -= n; 
    if (st.inventory[rec.id] <= 0) delete st.inventory[rec.id];

    st.coins = (st.coins || 0) + got; 
    st.stats.sold = (st.stats.sold || 0) + n; 
    st.stats.earned = (st.stats.earned || 0) + got;

    if (typeof hook === 'function') hook('onSale', rec.id, n, got); 
    this.ctx.save(); 
    if (typeof render === 'function') render();
    if (typeof beep === 'function') beep(660, 0.08); 
    this.ctx.ui.toast('💰 بعت ' + n + ' سمكة بـ ' + got.toLocaleString() + ' ذهب');
    this._sellFish = null; 
    this._sellQty = 1; 
    this.render();
  },

  sellAll: function () {
    var st = this.ctx.state; 
    var keys = Object.keys(st.inventory).filter(function (k) { return (st.inventory[k] || 0) > 0 && window.FISH && window.FISH[k]; });
    if (!keys.length) { this.ctx.ui.toast('المخزن فاضي'); return; }
    
    var got = 0, n = 0;
    var unitP = typeof unitPrice === 'function' ? unitPrice : function(id) { return (window.FISH[id] && window.FISH[id].base) || 10; };
    
    for (var i = 0; i < keys.length; i++) { 
      var k = keys[i]; 
      var q = st.inventory[k]; 
      for (var j = 0; j < q; j++) { 
        got += unitP(k); 
        if (st.market && st.market[k]) {
          var m = st.market[k]; 
          var minMult = (window.MARKET && window.MARKET.MIN_MULT) || 0.5;
          var dropRate = (window.MARKET && window.MARKET.SELL_DROP) || 0.01;
          m.mult = Math.max(minMult, m.mult * (1 - dropRate)); 
          m.soldSinceTick = (m.soldSinceTick || 0) + 1; 
        }
      } 
      delete st.inventory[k]; 
      n += q; 
    }

    // تطبيق بونص القبيلة
    var tModule = window.ModuleRegistry && window.ModuleRegistry.get('tribe');
    if (tModule && typeof tModule.applyGoldBonus === 'function') {
      got += tModule.applyGoldBonus(got);
    }

    st.coins = (st.coins || 0) + got; 
    st.stats.sold = (st.stats.sold || 0) + n; 
    st.stats.earned = (st.stats.earned || 0) + got; 
    
    if (typeof hook === 'function') hook('onSale', 'all', n, got);
    this.ctx.save(); 
    if (typeof render === 'function') render(); 
    if (typeof beep === 'function') beep(880, 0.12);
    this.ctx.ui.toast('💰 بعت جميع الأسماك (' + n + ') بـ ' + got.toLocaleString() + ' ذهب'); 
    this.render();
  },
    startUpgrade: function () {
    var self = this; 
    var st = this.ctx.state; 
    var f = st.fishMarket || { level: 1 }; 
    var lvl = f.level || 1;
    var costRes = window.rpcShips ? window.rpcShips('fish_market_upgrade_cost', { _level: lvl }) : { data: { cost_coins: lvl * 20000, seconds: lvl * 300 } };
    var cost = costRes.data;

    if (!cost || cost.max) { this.ctx.ui.toast('🏆 وصلت الحد الأقصى'); return; }
    var mins = Math.ceil(cost.seconds / 60);
    this.ctx.ui.confirm('ترقية مخزن السمك إلى المستوى ' + (lvl + 1) + '؟\nالتكلفة: ' + cost.cost_coins.toLocaleString() + ' 💰\nالمدة: ' + mins + ' دقيقة', function () {
      if (window.rpcShips) {
        var res = window.rpcShips('fish_market_start_upgrade');
        if (res.error) { 
          var em = res.error.message; 
          if (em === 'no_coins') { self.ctx.ui.toast('💰 الذهب غير كافٍ'); return; } 
          if (em === 'max_level') { self.ctx.ui.toast('وصلت الحد الأقصى'); return; } 
          if (em === 'upgrade_in_progress') { self.ctx.ui.toast('⏳ ترقية جارية'); return; } 
          self.ctx.ui.toast('❌ ' + em); return; 
        }
      } else {
        if ((st.coins || 0) < cost.cost_coins) { self.ctx.ui.toast('💰 الذهب غير كافٍ'); return; }
        st.coins -= cost.cost_coins;
        f.upgrading_to = lvl + 1;
        f.upgrade_ends_at = Date.now() + cost.seconds * 1000;
        self.ctx.save();
      }
      self.ctx.ui.toast('⏳ بدأت الترقية'); 
      self.render();
    });
  },

  boostUpgrade: function () {
    var self = this; 
    var f = this.ctx.state.fishMarket; 
    if (!f || !f.upgrade_ends_at) return;
    var secLeft = Math.max(0, Math.ceil((f.upgrade_ends_at - Date.now()) / 1000)); 
    var gemsCost = Math.max(1, Math.ceil(secLeft / 60));
    this.ctx.ui.confirm('إنهاء الترقية الآن بـ ' + gemsCost + ' 💎؟', function () {
      if (window.rpcShips) {
        var res = window.rpcShips('fish_market_finish_upgrade_with_gems');
        if (res.error) { 
          if (res.error.message === 'no_gems') { self.ctx.ui.toast('💎 جواهر غير كافية'); return; } 
          self.ctx.ui.toast('❌ ' + res.error.message); return; 
        }
      } else {
        var st = self.ctx.state;
        if ((st.gems || 0) < gemsCost) { self.ctx.ui.toast('💎 جواهر غير كافية'); return; }
        st.gems -= gemsCost;
        f.level = f.upgrading_to || (f.level + 1);
        f.upgrading_to = null;
        f.upgrade_ends_at = null;
        self.ctx.save();
      }
      self.ctx.ui.toast('✅ تمت الترقية بنجاح'); 
      self.render();
    });
  },

  buyFreeze: function () {
    var st = this.ctx.state; 
    if ((st.gems || 0) < this.FREEZE_COST_GEMS) { this.ctx.ui.toast('💎 تحتاج ' + this.FREEZE_COST_GEMS + ' جوهرة'); return; }
    var self = this; 
    this.ctx.ui.confirm('تجميد الأسعار 24 ساعة بـ ' + this.FREEZE_COST_GEMS + ' 💎؟', function () {
      st.gems -= self.FREEZE_COST_GEMS; 
      st.fishMarketFreezeUntil = Date.now() + 24 * 3600 * 1000; 
      self.ctx.save(); 
      if (typeof render === 'function') render(); 
      self.ctx.ui.toast('❄️ الأسعار مجمدة لمدة 24 ساعة'); 
      self.render();
    });
  },

  buyTrader: function () {
    var st = this.ctx.state; 
    if ((st.gems || 0) < this.TRADER_COST_GEMS) { this.ctx.ui.toast('💎 تحتاج ' + this.TRADER_COST_GEMS + ' جوهرة'); return; }
    var self = this; 
    this.ctx.ui.confirm('فتح تاجر إضافي بـ ' + this.TRADER_COST_GEMS + ' 💎؟', function () {
      st.gems -= self.TRADER_COST_GEMS; 
      st.traders = (st.traders || 0) + 1; 
      self.ctx.save(); 
      if (typeof render === 'function') render(); 
      self.ctx.ui.toast('🧑‍💼 تم فتح تاجر إضافي بنجاح'); 
      self.render();
    });
  },

  render: function () {
    var body = document.getElementById('fishMarketBody'); 
    if (!body || !this.ctx) return;
    var sec = document.getElementById('screen-fishmarket'); 
    if (sec) { 
      var tabs = sec.querySelectorAll('#fmTabs .tab'); 
      for (var i = 0; i < tabs.length; i++) { 
        tabs[i].classList.toggle('active', tabs[i].getAttribute('data-fm-tab') === this._tab); 
      } 
    }
    if (this._tab === 'discovery') { body.innerHTML = this._renderDiscovery(); return; }
    var st = this.ctx.state; 
    var f = st.fishMarket || { level: 1 }; 
    var frozen = st.fishMarketFreezeUntil && Date.now() < st.fishMarketFreezeUntil;
    var h = '<div style="padding-bottom:20px">'; 
    h += this._renderHeader(st, f, frozen); 
    h += this._renderCapacity(st); 
    h += this._renderUpgradePanel(f); 
    h += this._renderExtras(frozen); 
    h += this._renderList(st); 
    h += '</div>';
    body.innerHTML = h; 
    if (this._sellFish) this._renderSellModal();
  },

  _renderHeader: function (st, f, frozen) {
    var lvl = f.level || 1; 
    var upg = !!f.upgrading_to; 
    var h = '';
    h += '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:14px;background:linear-gradient(180deg,rgba(30,45,75,.9),rgba(15,25,45,.95));border:1.5px solid rgba(252,191,73,.35);margin-bottom:12px;flex-wrap:wrap;box-shadow:0 0 20px rgba(252,191,73,.15)">';
    h += '<div style="font-weight:900;font-size:15px;color:#fef3c7">🐟 سوق السمك</div>';
    h += '<span style="font-size:10px;padding:3px 8px;border-radius:6px;background:rgba(252,191,73,.15);border:1px solid rgba(252,191,73,.4);color:#fbbf24;font-weight:800">L' + lvl + '/30</span>';
    if (upg) h += '<span style="font-size:10px;padding:3px 8px;border-radius:6px;background:rgba(56,189,248,.15);border:1px solid rgba(56,189,248,.4);color:#7dd3fc;font-weight:800">→ ' + f.upgrading_to + '</span>';
    if (frozen) h += '<span style="font-size:10px;padding:3px 8px;border-radius:6px;background:rgba(96,165,250,.2);border:1px solid rgba(96,165,250,.5);color:#93c5fd;font-weight:800">❄️ مجمد</span>';
    h += '<div style="flex:1"></div><div style="font-size:11px;font-weight:800;padding:4px 9px;border-radius:8px;background:rgba(252,191,73,.1);border:1px solid rgba(252,191,73,.3);color:#fef3c7">💰 ' + (st.coins||0).toLocaleString() + '</div>';
    h += '<div style="font-size:11px;font-weight:800;padding:4px 9px;border-radius:8px;background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.4);color:#e9d5ff">💎 ' + (st.gems||0).toLocaleString() + '</div></div>';
    return h;
  },

  _renderCapacity: function (st) {
    var lvl = (st.fishMarket && st.fishMarket.level) || 1; 
    var cap = (window.shipsUtils && typeof window.shipsUtils.fishMarketCapacity === 'function') ? window.shipsUtils.fishMarketCapacity(lvl) : (lvl * 500); 
    var used = 0;
    Object.keys(st.inventory).forEach(function (k) { if (window.FISH && window.FISH[k]) used += st.inventory[k] || 0; });
    var pct = Math.min(100, (used / cap) * 100); 
    var h = '';
    h += '<div style="padding:10px 12px;border-radius:12px;background:rgba(15,25,45,.7);border:1.5px solid rgba(252,191,73,.25);margin-bottom:12px">';
    h += '<div style="display:flex;justify-content:space-between;font-size:11px;color:#cbd5e1;margin-bottom:5px"><span>📦 سعة السمك</span><span>' + used.toLocaleString() + ' / ' + cap.toLocaleString() + '</span></div>';
    h += '<div style="height:8px;border-radius:4px;background:rgba(0,0,0,.5);overflow:hidden"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#38bdf8,#0ea5e9);transition:width .3s"></div></div></div>';
    return h;
  },

  _renderUpgradePanel: function (f) {
    var lvl = f.level || 1; 
    var upg = !!f.upgrading_to; 
    var secLeft = upg ? Math.max(0, Math.ceil((f.upgrade_ends_at - Date.now()) / 1000)) : 0;
    var boostGems = upg ? Math.max(1, Math.ceil(secLeft / 60)) : 0; 
    var h = '';
    h += '<div style="padding:12px;border-radius:16px;background:linear-gradient(180deg,rgba(30,45,75,.9),rgba(12,20,40,.95));border:1.5px solid rgba(252,191,73,.25);margin-bottom:12px">';
    h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><div style="font-size:22px">🛠️</div><div><div style="font-weight:800;font-size:14px;color:#fef3c7">ترقية مخزن السمك</div><div style="font-size:10px;color:#94a3b8">يفتح سعة أكبر للأسماك</div></div></div>';
    if (upg) {
      h += '<div style="padding:10px;border-radius:10px;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.3)">';
      h += '<div style="display:flex;justify-content:space-between;font-size:12px;color:#e2e8f0;margin-bottom:5px"><span>الترقية الجارية</span><span>' + lvl + ' → ' + f.upgrading_to + '</span></div>';
      h += '<div style="display:flex;justify-content:space-between;font-size:12px;color:#e2e8f0;margin-bottom:8px"><span>الوقت المتبقي</span><span id="fmLeftLabel">' + (typeof shipFmtCountdown === 'function' ? shipFmtCountdown(secLeft) : secLeft + 'ث') + '</span></div>';
      h += '<button data-fm="boost" style="width:100%;padding:10px;border-radius:10px;border:0;background:linear-gradient(180deg,#c4b5fd,#7c3aed);color:#fff;font-weight:900;font-size:13px;cursor:pointer">💎 إنهاء الآن (' + boostGems + ')</button></div>';
    } else {
      var costRes = window.rpcShips ? window.rpcShips('fish_market_upgrade_cost', { _level: lvl }) : { data: { cost_coins: lvl * 20000, seconds: lvl * 300 } };
      var cost = costRes.data;
      if (!cost || cost.max) { 
        h += '<div style="text-align:center;font-size:12px;color:#fbbf24;padding:10px">🏆 وصلت الحد الأقصى</div>'; 
      } else {
        h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;color:#e2e8f0;margin-bottom:8px"><div>المستوى: <b style="color:#fef3c7">' + lvl + '</b></div><div>التالي: <b style="color:#fbbf24">' + (lvl + 1) + '</b></div><div>التكلفة: <b>' + cost.cost_coins.toLocaleString() + ' 💰</b></div><div>المدة: <b>' + Math.ceil(cost.seconds / 60) + ' د</b></div></div>';
        h += '<button data-fm="start-upgrade" style="width:100%;padding:11px;border-radius:10px;border:0;background:linear-gradient(180deg,#fcd34d,#d97706);color:#1c1917;font-weight:900;font-size:13px;cursor:pointer">بدء الترقية</button>';
      }
    }
    h += '</div>'; 
    return h;
  },

  _renderExtras: function (frozen) {
    var h = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">';
    h += '<button data-fm="freeze" style="padding:10px;border-radius:10px;border:1.5px solid #60a5fa;background:linear-gradient(180deg,rgba(96,165,250,.2),rgba(30,64,175,.15));color:#93c5fd;font-weight:800;font-size:11px;cursor:pointer;' + (frozen ? 'opacity:.5;' : '') + '">' + '❄️ ' + (frozen ? 'مجمد' : 'تجميد') + ' (' + this.FREEZE_COST_GEMS + ' 💎)</button>';
    h += '<button data-fm="trader" style="padding:10px;border-radius:10px;border:1.5px solid #a78bfa;background:linear-gradient(180deg,rgba(167,139,250,.2),rgba(76,29,149,.15));color:#ddd6fe;font-weight:800;font-size:11px;cursor:pointer">' + '🧑‍💼 تاجر (' + this.TRADER_COST_GEMS + ' 💎)</button></div>';
    return h;
  },

  _renderList: function (st) {
    var keys = Object.keys(st.inventory).filter(function (k) { return (st.inventory[k] || 0) > 0 && window.FISH && window.FISH[k]; }); 
    var h = '';
    if (keys.length === 0) { 
      h += '<div style="text-align:center;padding:30px;color:#94a3b8;font-size:12px">🐟 المخزن فاضي — أبحر لتصطاد الأسماك</div>'; 
      return h; 
    }
    var total = 0; 
    var getPrice = typeof fishCurrentPrice === 'function' ? fishCurrentPrice : function(id) { return (window.FISH[id] && window.FISH[id].base) || 10; };
    keys.forEach(function (id) { total += getPrice(id) * st.inventory[id]; });

    h += '<div style="padding:10px 12px;border-radius:12px;background:rgba(76,175,80,.08);border:1.5px solid rgba(76,175,80,.35);margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">';
    h += '<div><div style="font-size:10px;color:#86efac;font-weight:800">💰 القيمة الحالية</div><div style="font-size:16px;font-weight:900;color:#fef3c7">' + total.toLocaleString() + ' 💰</div></div>';
    h += '<button data-fm="sell-all" style="padding:9px 14px;border-radius:10px;border:1.5px solid #86efac;background:linear-gradient(180deg,#bbf7d0,#16a34a);color:#052e16;font-weight:900;font-size:11px;cursor:pointer">بيع الكل</button></div>';
    
    keys.sort(function (a, b) { return (getPrice(b) * st.inventory[b]) - (getPrice(a) * st.inventory[a]); });
    h += '<div style="display:grid;grid-template-columns:1fr;gap:8px">'; 
    for (var i = 0; i < keys.length; i++) { h += this._renderFishCard(keys[i], st.inventory[keys[i]]); } 
    h += '</div>'; 
    return h;
  },

  _renderFishCard: function (id, qty) {
    var fish = window.FISH && window.FISH[id]; 
    if (!fish) return ''; 
    var price = typeof fishCurrentPrice === 'function' ? fishCurrentPrice(id) : (fish.base || 10); 
    var range = typeof fishPriceRange === 'function' ? fishPriceRange(id) : { min: Math.round(price * 0.8), max: Math.round(price * 1.2) }; 
    var label = typeof fishPriceLabel === 'function' ? fishPriceLabel(id) : { text: 'مستقر', color: '#fbbf24', arrow: '➔' }; 
    var h = '';
    h += '<div data-fm="pick" data-id="' + id + '" style="display:flex;gap:10px;padding:10px;border-radius:12px;background:linear-gradient(180deg,rgba(20,35,60,.85),rgba(12,22,42,.9));border:1.5px solid rgba(252,191,73,.2);cursor:pointer;align-items:center">';
    h += '<div style="width:56px;height:56px;flex-shrink:0;border-radius:10px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;overflow:hidden">';
    var _imgSrc2 = fish.img || ('assets/fish/' + id + '.webp');
    h += '<img src="' + _imgSrc2 + '" alt="" style="max-width:100%;max-height:100%;object-fit:contain" onerror="this.style.display=\'none\';this.parentNode.innerHTML=\'<span style=&quot;font-size:26px&quot;>' + (fish.emoji || '🐟') + '</span>\'"></div>';
    h += '<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:13px;color:#fff">' + fish.name + ' <span style="font-size:11px;color:#fbbf24">×' + qty + '</span></div>';
    h += '<div style="display:flex;gap:8px;font-size:11px;margin-top:4px;align-items:center;flex-wrap:wrap">';
    h += '<span style="color:#fbbf24;font-weight:900">' + price + ' 💰</span><span style="color:' + label.color + ';font-weight:800">' + label.arrow + ' ' + label.text + '</span></div>';
    h += '<div style="font-size:10px;color:#94a3b8;margin-top:2px">المدى: ' + range.min + ' - ' + range.max + '</div></div>';
    h += '<div style="font-size:10px;color:#fbbf24;font-weight:800;padding:4px 8px;border-radius:6px;background:rgba(252,191,73,.1);border:1px solid rgba(252,191,73,.3)">اضغط</div></div>'; 
    return h;
  },

  _renderDiscovery: function () {
    var total = 0, disc = 0; 
    var remaining = [];
    for (var i = 0; i < this.FISH_ORDER.length; i++) { 
      var id = this.FISH_ORDER[i]; 
      if (!window.FISH || !window.FISH[id]) continue; 
      total++; 
      var row = window.FishDiscovery ? FishDiscovery.getRow(id) : { total_caught: 0, quantity: 0 }; 
      if (row.total_caught > 0) disc++; 
      else remaining.push(window.FISH[id]); 
    }
    var h = '';
    h += '<div style="padding:14px;border-radius:14px;background:linear-gradient(180deg,rgba(56,189,248,.18),rgba(2,132,199,.08));border:1.5px solid rgba(56,189,248,.45);margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">';
    h += '<div style="display:flex;align-items:center;gap:10px"><span style="font-size:28px">🔍</span><div><div style="font-size:14px;font-weight:900;color:#bae6fd">المكتشف</div><div style="font-size:10px;color:#94a3b8">جميع أنواع الأسماك</div></div></div>';
    h += '<div style="font-size:24px;font-weight:900;color:#fbbf24">' + disc + '<span style="color:#94a3b8;margin:0 4px;font-size:16px">/</span><span style="color:#bae6fd;font-size:20px">' + total + '</span></div></div>';
    if (remaining.length > 0) {
      h += '<div style="padding:10px 12px;border-radius:14px;background:linear-gradient(180deg,rgba(190,18,60,.15),rgba(80,10,20,.1));border:1.5px solid rgba(244,63,94,.35);margin-bottom:12px">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div style="display:flex;align-items:center;gap:6px"><span style="font-size:16px">🎯</span><span style="font-size:12px;font-weight:800;color:#fecdd3">باقي عليك</span></div><span style="font-size:11px;font-weight:900;color:#fecdd3">' + remaining.length + ' نوع</span></div>';
      h += '<div style="display:flex;flex-wrap:wrap;gap:4px">'; 
      for (var r = 0; r < remaining.length && r < 25; r++) { 
        h += '<span style="font-size:10px;padding:2px 7px;border-radius:10px;background:rgba(127,29,29,.45);border:1px solid rgba(244,63,94,.35);color:#fecdd3">' + remaining[r].name + '</span>'; 
      } 
      if (remaining.length > 25) { h += '<span style="font-size:10px;padding:2px 7px;color:#94a3b8">+' + (remaining.length - 25) + ' أخرى</span>'; }
      h += '</div></div>';
    }
    h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">';
    for (var j = 0; j < this.FISH_ORDER.length; j++) {
      var fid = this.FISH_ORDER[j]; 
      var fish = window.FISH && window.FISH[fid]; 
      if (!fish) continue; 
      var fRow = window.FishDiscovery ? FishDiscovery.getRow(fid) : { total_caught: 0, quantity: 0 }; 
      var isDisc = fRow.total_caught > 0; 
      var invQty = fRow.quantity || 0; 
      var price = fish.base || 1;
      var imgFilter = isDisc ? '' : 'filter:grayscale(1);opacity:.35'; 
      var border = isDisc ? 'rgba(56,189,248,.5)' : 'rgba(100,116,139,.25)'; 
      var bg = isDisc ? 'linear-gradient(180deg,rgba(30,45,75,.85),rgba(15,25,45,.9))' : 'linear-gradient(180deg,rgba(20,25,40,.7),rgba(10,12,22,.85))';
      
      h += '<div style="padding:8px 4px;border-radius:12px;background:' + bg + ';border:1.5px solid ' + border + ';display:flex;flex-direction:column;align-items:center;text-align:center;min-height:138px">';
      h += '<div style="width:62px;height:62px;display:flex;align-items:center;justify-content:center;margin-bottom:4px">';
      var _imgSrc = fish.img || ('assets/fish/' + fid + '.webp');
      h += '<img src="' + _imgSrc + '" alt="" style="max-width:100%;max-height:100%;object-fit:contain;' + imgFilter + '" onerror="this.replaceWith(document.createTextNode(\'' + (fish.emoji || '🐟') + '\'))"></div>';
      h += '<div style="font-size:9px;font-weight:800;color:' + (isDisc ? '#fff' : '#94a3b8') + ';line-height:1.25;min-height:24px;display:flex;align-items:center;justify-content:center;padding:0 3px">' + fish.name + '</div>';
      h += '<div style="font-size:10px;font-weight:800;color:#fbbf24;display:flex;align-items:center;gap:3px;margin-top:2px"><span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#fbbf24"></span><span>' + price + '</span></div>';
      if (isDisc) { h += '<div style="font-size:12px;font-weight:900;color:#bae6fd;margin-top:3px">' + invQty + '×</div>'; } 
      else { h += '<div style="font-size:9px;font-weight:800;color:#fca5a5;margin-top:3px">غير مكتشفة</div>'; }
      h += '</div>';
    }
    h += '</div>'; 
    return h;
  },

  _renderSellModal: function () {
    var rec = this.getSellRecord(); 
    if (!rec) { this._sellFish = null; return; } 
    var fish = window.FISH && window.FISH[rec.id]; 
    if (!fish) return;
    var total = rec.price * this._sellQty; 
    var container = document.getElementById('fishMarketBody'); 
    if (!container) return;
    var opts = [1, 5, 10, 50, 100]; 
    var h = '';
    h += '<div data-fm="sell-cancel" style="position:fixed;inset:0;z-index:210;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:16px">';
    h += '<div style="max-width:340px;width:100%;border-radius:18px;background:linear-gradient(180deg,#0e2238,#06182b);border:1.5px solid rgba(252,191,73,.5);padding:16px;box-shadow:0 20px 60px rgba(0,0,0,.8)">';
    h += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">';
    h += '<div style="width:60px;height:60px;border-radius:12px;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;border:1px solid rgba(252,191,73,.3)">';
    h += '<img src="assets/fish/' + rec.id + '.webp" alt="" style="max-width:100%;max-height:100%;object-fit:contain" onerror="this.style.display=\'none\';this.parentNode.innerHTML=\'<span style=&quot;font-size:30px&quot;>' + (fish.emoji || '🐟') + '</span>\'"></div>';
    h += '<div style="flex:1"><div style="font-weight:900;color:#fff;font-size:16px">' + fish.name + '</div><div style="font-size:11px;color:#94a3b8;margin-top:2px">لديك ' + rec.qty + ' · السعر ' + rec.price + ' 💰</div></div></div>';
    h += '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin-bottom:8px">';
    for (var i = 0; i < opts.length; i++) { 
      var n = opts[i]; 
      var isOn = this._sellQty === n; 
      h += '<button data-fm="sell-qty" data-n="' + n + '" style="padding:9px 0;border-radius:8px;border:1px solid ' + (isOn ? '#fbbf24' : 'rgba(255,255,255,.15)') + ';background:' + (isOn ? 'rgba(251,191,36,.2)' : 'rgba(0,0,0,.3)') + ';color:' + (isOn ? '#fef3c7' : '#cbd5e1') + ';font-weight:800;font-size:11px;cursor:pointer">' + n + '</button>'; 
    }
    h += '</div>';
    h += '<div style="display:flex;gap:6px;margin-bottom:12px"><button data-fm="sell-max" style="flex:1;padding:9px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(0,0,0,.3);color:#cbd5e1;font-weight:800;font-size:11px;cursor:pointer">الكل (' + rec.qty + ')</button>';
    h += '<div style="flex:1;padding:9px;border-radius:8px;border:1px solid rgba(251,191,36,.4);background:rgba(251,191,36,.1);color:#fef3c7;font-weight:900;text-align:center;font-size:12px;display:flex;align-items:center;justify-content:center">اخترت ' + this._sellQty + '</div></div>';
    h += '<div style="padding:12px;border-radius:12px;background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.3);text-align:center;margin-bottom:12px"><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;font-weight:800">الإجمالي</div><div style="font-size:24px;font-weight:900;color:#fbbf24;margin-top:2px">' + total.toLocaleString() + ' 💰</div></div>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button data-fm="sell-cancel" style="padding:11px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:rgba(0,0,0,.3);color:#cbd5e1;font-weight:800;font-size:12px;cursor:pointer">إلغاء</button>';
    h += '<button data-fm="sell-confirm" style="padding:11px;border-radius:10px;border:1.5px solid #fbbf24;background:linear-gradient(180deg,#fcd34d,#d97706);color:#1c1917;font-weight:900;font-size:12px;cursor:pointer">تأكيد البيع</button></div></div></div>';
    container.insertAdjacentHTML('afterbegin', h);
  }
});
