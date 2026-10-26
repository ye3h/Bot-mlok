'use strict';
(function () {
  var STORAGE_UPGRADE_GEMS = 10000;
  var STAR_UPGRADE_GEMS = { 1:5000, 2:10000, 3:20000, 4:40000 };
  var STAR_SUCCESS_RATE = { 1:60, 2:50, 3:40, 4:25 };
  var FLEET_MAX = 3, STORAGE_MIN = 3, STORAGE_MAX = 20, MARKET_MAX = 33, FISH_MARKET_MAX = 30;
  var BASE_SHIP_CODE = 'ship-lvl-1';

  var MARKET_TABLE = {
    1:[600,30], 2:[3750,30], 3:[11250,120], 4:[16500,120], 5:[30000,900],
    6:[75000,900], 7:[135000,900], 8:[225000,3600], 9:[450000,3600], 10:[1050000,3600],
    11:[3300000,14400], 12:[7500000,14400], 13:[12000000,14400], 14:[18000000,14400], 15:[27000000,14400],
    16:[37500000,43200], 17:[51000000,43200], 18:[67500000,43200], 19:[90000000,43200], 20:[120000000,43200],
    21:[165000000,86400], 22:[225000000,86400], 23:[300000000,86400], 24:[450000000,86400], 25:[975000000,86400],
    26:[1200000000,259200], 27:[1500000000,259200], 28:[5460000000,259200], 29:[13650000000,259200], 30:[24570000000,259200],
    31:[500000000000,432000], 32:[5000000000000,604800], 33:[0,0]
  };

  var FISH_MARKET_TABLE = {
    1:[300,90], 2:[1875,150], 3:[5625,210], 4:[8250,270], 5:[15000,330],
    6:[37500,390], 7:[67500,450], 8:[112500,510], 9:[225000,570], 10:[525000,630],
    11:[1650000,690], 12:[3750000,750], 13:[6000000,810], 14:[9000000,870], 15:[13500000,930],
    16:[18750000,990], 17:[25500000,1050], 18:[33750000,1110], 19:[45000000,1170], 20:[60000000,1230],
    21:[82500000,1290], 22:[112500000,1350], 23:[150000000,1410], 24:[225000000,1470], 25:[487500000,1530],
    26:[600000000,7200], 27:[750000000,14400], 28:[2730000000,28800], 29:[6825000000,57600], 30:[12285000000,1830]
  };

  var FISH_CAP_OVERRIDES = {
    26:6000000, 27:11000000, 28:17000000, 29:23000000, 30:30000000, 31:36000000, 32:42000000
  };

  function fishMarketCapacity(level) {
    var t = Math.max(1, Math.min(32, Math.round(level || 1)));
    if (FISH_CAP_OVERRIDES[t] != null) return FISH_CAP_OVERRIDES[t];
    var cap = 10000;
    for (var l = 2; l <= t; l++) {
      if (l <= 10) cap += 10000;
      else if (l <= 20) cap += 20000;
      else cap += 116666;
    }
    return cap;
  }

  function ensureState() {
    if (!state.ships) state.ships = [];
    if (!state.market) state.market = {};
    if (typeof state.market.level !== 'number') state.market.level = 1;
    if (!('upgrading_to' in state.market)) state.market.upgrading_to = null;
    if (!('upgrade_ends_at' in state.market)) state.market.upgrade_ends_at = null;
    if (!('upgrade_started_at' in state.market)) state.market.upgrade_started_at = null;
    if (!('upgrade_cost_coins' in state.market)) state.market.upgrade_cost_coins = null;

    if (!state.fishMarket) state.fishMarket = { level:1, upgrading_to:null, upgrade_ends_at:null, upgrade_started_at:null, upgrade_cost_coins:null };
    if (typeof state.fishMarketLevel !== 'number') state.fishMarketLevel = state.fishMarket.level || 1;
    if (!state.storage_capacity) state.storage_capacity = STORAGE_MIN;

    if (state.ships.length === 0 && !state.__baseAdded) {
      var byCode = window.SHIP_BY_CODE || {};
      var baseDef = byCode[BASE_SHIP_CODE];
      if (baseDef) {
        state.ships.push({
          id: 'base_' + Date.now(),
          code: BASE_SHIP_CODE,
          templateId: 0,
          hp: baseDef.hp,
          maxHp: baseDef.hp,
          stars: 1,
          maxStars: 1,
          inStorage: false,
          acquiredAt: Date.now(),
          isBase: true
        });
        state.__baseAdded = true;
        if (typeof saveState === 'function') saveState();
      }
    }

    syncLegacy();
  }

  function uid() { return 'ship_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6); }
  function findShip(id) {
    for (var i = 0; i < state.ships.length; i++) if (state.ships[i].id === id) return state.ships[i];
    return null;
  }
  function fleetCount() {
    var c = 0;
    for (var i = 0; i < state.ships.length; i++) if (!state.ships[i].inStorage) c++;
    return c;
  }
  function storageCount() {
    var c = 0;
    for (var i = 0; i < state.ships.length; i++) if (state.ships[i].inStorage) c++;
    return c;
  }
  function storageCapacity() {
    return Math.max(STORAGE_MIN, Math.min(STORAGE_MAX, state.storage_capacity || STORAGE_MIN));
  }

  function syncLegacy() {
    var byCode = window.SHIP_BY_CODE || {};
    var owned = [], active = [];
    for (var i = 0; i < state.ships.length; i++) {
      var sh = state.ships[i];
      var def = byCode[sh.code];
      var legacyId = def ? def.id : sh.code;
      owned.push(legacyId);
      if (!sh.inStorage && active.length < FLEET_MAX) active.push(legacyId);
    }
    state.owned = owned;
    state.fleetActive = active;
    if (state.fleetStates) {
      for (var k in state.fleetStates) {
        if (!state.fleetStates.hasOwnProperty(k)) continue;
        if (active.indexOf(k) < 0) delete state.fleetStates[k];
      }
    }
  }

  function marketUpgradeCost(level) {
    var row = MARKET_TABLE[level];
    if (!row) return { cost_coins:0, seconds:0, max:true };
    return { cost_coins: row[0], seconds: row[1] };
  }
  function fishMarketUpgradeCost(level) {
    var row = FISH_MARKET_TABLE[level];
    if (!row) return { cost_coins:0, seconds:0, max:true };
    return { cost_coins: row[0], seconds: row[1] };
  }
  function fishMarketReqFor(nextLevel) {
    if (nextLevel === 11) return 10;
    if (nextLevel === 15) return 14;
    return 0;
  }
  function starUpgradeCost(currentStar) { return STAR_UPGRADE_GEMS[currentStar] || null; }
  function starUpgradeCoins(ship) {
    var map = { 'submarine':1000000000, 'upgrade-sub':1000000000, 'kraken-ship':20000000000, 'royal-whale':50000000000 };
    return map[ship.code] || null;
  }
  function starSuccessRate(currentStar) {
    return STAR_SUCCESS_RATE[currentStar] || 0;
  }

  function finalizeMarketUpgrades() {
    var m = state.market;
    if (!m.upgrading_to || !m.upgrade_ends_at) return;
    if (Date.now() >= m.upgrade_ends_at) {
      m.level = m.upgrading_to;
      m.upgrading_to = null; m.upgrade_ends_at = null; m.upgrade_started_at = null; m.upgrade_cost_coins = null;
      if (typeof saveState === 'function') saveState();
    }
  }
  function finalizeFishMarketUpgrades() {
    var f = state.fishMarket;
    if (!f || !f.upgrading_to || !f.upgrade_ends_at) return;
    if (Date.now() >= f.upgrade_ends_at) {
      f.level = f.upgrading_to;
      f.upgrading_to = null; f.upgrade_ends_at = null; f.upgrade_started_at = null; f.upgrade_cost_coins = null;
      state.fishMarketLevel = f.level;
      if (typeof saveState === 'function') saveState();
    }
  }

  function save() {
    if (typeof saveState === 'function') saveState();
    if (typeof render === 'function') render();
  }

  function rpcShips(name, args) {
    ensureState();
    args = args || {};

    switch (name) {
      case 'finalize_market_upgrades': finalizeMarketUpgrades(); return { data:null, error:null };
      case 'finalize_fish_market_upgrades': finalizeFishMarketUpgrades(); return { data:null, error:null };
      case 'market_upgrade_cost':
        return { data: marketUpgradeCost(args._level || state.market.level || 1), error:null };
      case 'fish_market_upgrade_cost':
        return { data: fishMarketUpgradeCost(args._level || (state.fishMarket ? state.fishMarket.level : 1)), error:null };

      case 'market_start_upgrade': {
        var m = state.market;
        if (m.upgrading_to) return { data:null, error:{message:'upgrade_in_progress'} };
        var lvl = m.level || 1;
        if (lvl >= MARKET_MAX) return { data:null, error:{message:'max_level'} };
        var freq = fishMarketReqFor(lvl + 1);
        if (freq > 0 && (state.fishMarketLevel || 1) < freq) return { data:null, error:{message:'fish_market_required', required:freq} };
        var cost = marketUpgradeCost(lvl);
        if ((state.coins || 0) < cost.cost_coins) return { data:null, error:{message:'no_coins'} };
        state.coins -= cost.cost_coins;
        m.upgrading_to = lvl + 1; m.upgrade_started_at = Date.now(); m.upgrade_ends_at = Date.now() + cost.seconds*1000; m.upgrade_cost_coins = cost.cost_coins;
        save(); return { data:{ok:true}, error:null };
      }

      case 'market_finish_upgrade_with_gems': {
        var mm = state.market;
        if (!mm.upgrading_to || !mm.upgrade_ends_at) return { data:null, error:{message:'no_upgrade'} };
        var secLeft = Math.max(0, Math.ceil((mm.upgrade_ends_at - Date.now()) / 1000));
        var gemsCost = Math.max(1, Math.ceil(secLeft / 60));
        if ((state.gems || 0) < gemsCost) return { data:null, error:{message:'no_gems'} };
        state.gems -= gemsCost;
        mm.level = mm.upgrading_to; mm.upgrading_to = null; mm.upgrade_ends_at = null; mm.upgrade_started_at = null; mm.upgrade_cost_coins = null;
        save(); return { data:{ok:true, cost:gemsCost}, error:null };
      }

      case 'fish_market_start_upgrade': {
        var f = state.fishMarket;
        if (f.upgrading_to) return { data:null, error:{message:'upgrade_in_progress'} };
        var flvl = f.level || 1;
        if (flvl >= FISH_MARKET_MAX) return { data:null, error:{message:'max_level'} };
        var fcost = fishMarketUpgradeCost(flvl);
        if ((state.coins || 0) < fcost.cost_coins) return { data:null, error:{message:'no_coins'} };
        state.coins -= fcost.cost_coins;
        f.upgrading_to = flvl + 1; f.upgrade_started_at = Date.now(); f.upgrade_ends_at = Date.now() + fcost.seconds*1000; f.upgrade_cost_coins = fcost.cost_coins;
        save(); return { data:{ok:true}, error:null };
      }

      case 'fish_market_finish_upgrade_with_gems': {
        var ff = state.fishMarket;
        if (!ff.upgrading_to || !ff.upgrade_ends_at) return { data:null, error:{message:'no_upgrade'} };
        var fsecLeft = Math.max(0, Math.ceil((ff.upgrade_ends_at - Date.now()) / 1000));
        var fgemsCost = Math.max(1, Math.ceil(fsecLeft / 60));
        if ((state.gems || 0) < fgemsCost) return { data:null, error:{message:'no_gems'} };
        state.gems -= fgemsCost;
        ff.level = ff.upgrading_to; ff.upgrading_to = null; ff.upgrade_ends_at = null; ff.upgrade_started_at = null; ff.upgrade_cost_coins = null;
        state.fishMarketLevel = ff.level;
        save(); return { data:{ok:true, cost:fgemsCost}, error:null };
      }

      case 'buy_ship_by_code': {
        var code = args._code;
        var def = window.SHIP_BY_CODE[code];
        if (!def) return { data:null, error:{message:'unknown_ship'} };

        var lv = state.market.level || 1;
        if (lv < def.level) return { data:null, error:{message:'market_level_required_' + def.level} };

        // 1) تحقق من المكان قبل أي خصم
        var fCount = fleetCount();
        var sCount = storageCount();
        var sCap = storageCapacity();
        if (fCount >= FLEET_MAX && sCount >= sCap) {
          return { data:null, error:{message:'all_full', fleet:fCount, storage:sCount, capacity:sCap} };
        }

        // 2) تحقق من الرصيد قبل الخصم
        var price = args._price_coins != null ? args._price_coins : (def.price || 0);
        if (price > 0 && (state.coins || 0) < price) {
          return { data:null, error:{message:'no_coins'} };
        }

        // 3) الخصم بعد نجاح كل الفحوصات
        if (price > 0) state.coins -= price;

        // 4) الإضافة: الأسطول إن فيه مكان، وإلا المخزن
        var autoActive = fCount < FLEET_MAX;
        var instance = {
          id: uid(),
          code: code,
          templateId: args._template_id || 0,
          hp: args._max_hp || def.hp,
          maxHp: args._max_hp || def.hp,
          stars: 1,
          maxStars: def.maxStars || 1,
          inStorage: !autoActive,
          acquiredAt: Date.now()
        };
        state.ships.push(instance);

        syncLegacy();
        save();
        return { data:{ok:true, ship:instance, active:autoActive}, error:null };
      }

      case 'sell_ship': {
        var ship = findShip(args._ship_id);
        if (!ship) return { data:null, error:{message:'not_found'} };

        if (ship.isRental) return { data:null, error:{message:'cannot_sell_rental'} };
        if (!ship.inStorage) return { data:null, error:{message:'ship_at_sea'} };

        var shipIdx = -1;
        for (var i = 0; i < state.ships.length; i++) {
          if (state.ships[i].id === args._ship_id) { shipIdx = i; break; }
        }
        if (shipIdx < 0) return { data:null, error:{message:'not_found'} };
        state.ships.splice(shipIdx, 1);

        if (state.fleetStates && state.fleetStates[args._ship_id]) {
          delete state.fleetStates[args._ship_id];
        }
        if (Array.isArray(state.fleetActive)) {
          var byCode = window.SHIP_BY_CODE || {};
          var sdef = byCode[ship.code];
          if (sdef) {
            var ai = state.fleetActive.indexOf(sdef.id);
            if (ai >= 0) state.fleetActive.splice(ai, 1);
          }
        }

        state.coins = (state.coins || 0) + (args._refund_coins || 0);
        syncLegacy();
        save();
        return { data:{ok:true, removedId: args._ship_id}, error:null };
      }

      case 'set_ship_at_sea': {
        var s2 = findShip(args._ship_id);
        if (!s2) return { data:null, error:{message:'not_found'} };
        s2.inStorage = !args._at_sea;
        syncLegacy(); save(); return { data:{ok:true}, error:null };
      }

      case 'ship_to_storage': {
        var s3 = findShip(args.p_ship_id);
        if (!s3) return { data:null, error:{message:'not_found'} };
        if (s3.inStorage) return { data:null, error:{message:'already_in_storage'} };
        if (fleetCount() <= 1) return { data:null, error:{message:'cannot_empty_fleet'} };
        if (storageCount() >= storageCapacity()) return { data:null, error:{message:'storage full'} };
        s3.inStorage = true;
        syncLegacy(); save(); return { data:{ok:true}, error:null };
      }

      case 'ship_from_storage': {
        var s4 = findShip(args.p_ship_id);
        if (!s4) return { data:null, error:{message:'not_found'} };
        if (!s4.inStorage) return { data:null, error:{message:'already_active'} };
        if (fleetCount() >= FLEET_MAX) return { data:null, error:{message:'fleet full'} };
        s4.inStorage = false;
        syncLegacy(); save(); return { data:{ok:true}, error:null };
      }

      case 'swap_ship_with_storage': {
        var a = findShip(args.p_active_id);
        var b = findShip(args.p_storage_id);
        if (!a || !b) return { data:null, error:{message:'not_found'} };
        a.inStorage = true; b.inStorage = false;
        syncLegacy(); save(); return { data:{ok:true}, error:null };
      }

      case 'upgrade_ship_storage': {
        var cap = storageCapacity();
        if (cap >= STORAGE_MAX) return { data:null, error:{message:'max storage'} };
        if ((state.gems || 0) < STORAGE_UPGRADE_GEMS) return { data:null, error:{message:'not enough gems'} };
        state.gems -= STORAGE_UPGRADE_GEMS;
        state.storage_capacity = cap + 1;
        save(); return { data:{ok:true, new_capacity: state.storage_capacity}, error:null };
      }

      case 'upgrade_ship_star': {
        var ship2 = findShip(args._ship_id);
        if (!ship2) return { data:null, error:{message:'not_found'} };
        var def2 = window.SHIP_BY_CODE[ship2.code];
        if (!def2) return { data:null, error:{message:'unknown_ship'} };
        if (!def2.upgradable) return { data:null, error:{message:'not_upgradable'} };
        var maxStars = def2.maxStars || 1;
        var curStars = ship2.stars || 1;
        if (curStars >= maxStars) return { data:null, error:{message:'max_stars'} };
        var cost2 = starUpgradeCost(curStars);
        if (cost2 === null) return { data:null, error:{message:'no_cost'} };
        if ((state.gems || 0) < cost2) return { data:null, error:{message:'not enough gems', needed:cost2} };
        state.gems -= cost2;
        ship2.stars = curStars + 1;
        if (def2.starData && def2.starData[ship2.stars - 1]) {
          var sd = def2.starData[ship2.stars - 1];
          ship2.maxHp = sd.hp; ship2.hp = sd.hp;
        }
        save(); return { data:{ok:true, stars: ship2.stars, cost: cost2}, error:null };
      }

      case 'upgrade_ship_star_coin': {
        var sc = findShip(args._ship_id);
        if (!sc) return { data:null, error:{message:'not_found'} };
        var defc = window.SHIP_BY_CODE[sc.code];
        if (!defc) return { data:null, error:{message:'unknown_ship'} };
        if (!defc.upgradable) return { data:null, error:{message:'not_upgradable'} };
        var maxStarsC = defc.maxStars || 1;
        var curStarsC = sc.stars || 1;
        if (curStarsC >= maxStarsC) return { data:null, error:{message:'max_stars'} };

        var costCoins = starUpgradeCoins(sc);
        if (costCoins === null) return { data:null, error:{message:'no_cost'} };
        if ((state.coins || 0) < costCoins) return { data:null, error:{message:'no_coins', needed:costCoins} };

        var rate = starSuccessRate(curStarsC);
        var roll = Math.random() * 100;
        var success = roll < rate;

        state.coins -= costCoins;

        var newStars = curStarsC;
        var dropped = false;

        if (success) {
          newStars = curStarsC + 1;
          sc.stars = newStars;
          if (defc.starData && defc.starData[newStars - 1]) {
            var sdc = defc.starData[newStars - 1];
            sc.maxHp = sdc.hp; sc.hp = sdc.hp;
          }
        } else if (curStarsC > 1) {
          newStars = curStarsC - 1;
          sc.stars = newStars;
          if (defc.starData && defc.starData[newStars - 1]) {
            var sdf = defc.starData[newStars - 1];
            sc.maxHp = sdf.hp;
            if (sc.hp > sdf.hp) sc.hp = sdf.hp;
          }
          dropped = true;
        }

        save();
        return {
          data: {
            ok: true, success: success, method: 'coins', rolled: Math.round(roll),
            rate: rate, stars: sc.stars, previousStars: curStarsC,
            dropped: dropped, cost: costCoins
          },
          error: null
        };
      }

      case 'rent_ship_by_code': {
        var rcode = args._code;
        var rdef = window.SHIP_BY_CODE[rcode];
        if (!rdef) return { data:null, error:{message:'unknown_ship'} };

        var MAX_RENTALS_PER_TYPE = 3;
        var rcnt = 0;
        for (var ri = 0; ri < state.ships.length; ri++) {
          if (state.ships[ri].code === rcode && state.ships[ri].isRental) rcnt++;
        }
        if (rcnt >= MAX_RENTALS_PER_TYPE) {
          return { data:null, error:{message:'max_rentals', max: MAX_RENTALS_PER_TYPE, have: rcnt} };
        }

        var rFleet = fleetCount();
        var rStor = storageCount();
        var rCap = storageCapacity();
        if (rFleet >= FLEET_MAX && rStor >= rCap) {
          return { data:null, error:{message:'all_full', fleet:rFleet, storage:rStor, capacity:rCap} };
        }

        var rAutoActive = rFleet < FLEET_MAX;
        var rHours = args._hours || 24;
        var rNow = Date.now();
        var rShip = {
          id: 'rental_' + rNow + '_' + Math.random().toString(36).slice(2, 6),
          code: rcode,
          templateId: 0,
          hp: rdef.hp,
          maxHp: rdef.hp,
          stars: 1,
          maxStars: rdef.maxStars || 1,
          inStorage: !rAutoActive,
          acquiredAt: rNow,
          isRental: true,
          rentalHours: rHours,
          expiresAt: rNow + rHours * 3600 * 1000
        };
        state.ships.push(rShip);
        syncLegacy();
        save();
        return { data:{ok:true, ship:rShip, active:rAutoActive, expiresAt:rShip.expiresAt}, error:null };
      }

      case 'unrent_ship': {
        var uship = findShip(args._ship_id);
        if (!uship) return { data:null, error:{message:'not_found'} };
        if (!uship.isRental) return { data:null, error:{message:'not_rental'} };
        for (var ui = 0; ui < state.ships.length; ui++) {
          if (state.ships[ui].id === args._ship_id) { state.ships.splice(ui, 1); break; }
        }
        syncLegacy();
        save();
        return { data:{ok:true}, error:null };
      }

      case 'check_rentals': {
        var now = Date.now();
        var expired = [];
        var next = [];
        for (var ci = 0; ci < state.ships.length; ci++) {
          var cs = state.ships[ci];
          if (cs.isRental && cs.expiresAt && cs.expiresAt <= now) expired.push(cs);
          else next.push(cs);
        }
        if (expired.length > 0) {
          state.ships = next;
          syncLegacy();
          save();
        }
        return { data:{expired: expired.length}, error:null };
      }

      case 'has_rental': {
        for (var hi = 0; hi < state.ships.length; hi++) {
          if (state.ships[hi].isRental) return { data:{has:true, ship:state.ships[hi]}, error:null };
        }
        return { data:{has:false, ship:null}, error:null };
      }

      case 'user_market_capacity':
        return { data:{capacity: storageCapacity()}, error:null };

      case 'user_fish_market_capacity':
        return { data:{capacity: fishMarketCapacity(state.fishMarketLevel || 1)}, error:null };

      default:
        return { data:null, error:{message:'unknown_rpc: ' + name} };
    }
  }

  window.rpcShips = rpcShips;
  window.STORAGE_UPGRADE_GEMS = STORAGE_UPGRADE_GEMS;
  window.shipsUtils = {
    fleetCount: fleetCount, storageCount: storageCount, storageCapacity: storageCapacity,
    fishMarketCapacity: fishMarketCapacity,
    marketLevel: function () { return state.market.level || 1; },
    fishMarketLevel: function () { return state.fishMarketLevel || 1; },
    marketUpgradeCost: marketUpgradeCost,
    fishMarketUpgradeCost: fishMarketUpgradeCost,
    fishMarketReqFor: fishMarketReqFor,
    starUpgradeCost: starUpgradeCost,
    starUpgradeCoins: starUpgradeCoins,
    starSuccessRate: starSuccessRate,
    finalizeMarketUpgrades: finalizeMarketUpgrades,
    finalizeFishMarketUpgrades: finalizeFishMarketUpgrades,
    syncLegacy: syncLegacy
  };
})();
