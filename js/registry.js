// js/registry.js - نظام الوحدات (ES5) v2
var MODULE_BASE = 'modules/';
var MODULE_LIST = [
  'fleet',
  'fleet_icons',
  'boss',
  'dragon_equipment',
  'dragons',
  'arena',
  'lucky_box',
  'dashboard',
  'text_size',
  'prayer_alert',,
  'weapons_shop',
  'shop',
  'dragon_forge',
  'ship_market',
  'ship_storage',
  'fish_market',
  'daily_quests',
  'global_chat',
  'profile',
  'settings',
  'friends',
  'chat',
  'tribe'
];
(function () {
  var modules = {}, order = [], ctx = null, ready = false;

  function logErr(where, e) {
    try { console.error('[Registry] ' + where, e); } catch (x) {}
  }
  function guard(id, method, fn) {
    try { fn(); } catch (e) { logErr(id + '.' + method, e); }
  }
  function register(mod) {
    if (!mod || typeof mod.id !== 'string' || !mod.id) { logErr('register', 'بدون id'); return; }
    if (modules[mod.id]) { logErr('register', 'id مكرر: ' + mod.id); return; }
    modules[mod.id] = mod;
    order.push(mod.id);
  }
  function resolveOrder() {
    var result = [], mark = {};
    function visit(id) {
      if (mark[id] === 2) return true;
      if (mark[id] === 1) { logErr('deps', 'دورة اعتماد عند: ' + id); return false; }
      mark[id] = 1;
      var deps = modules[id].dependencies || [];
      for (var i = 0; i < deps.length; i++) {
        if (!modules[deps[i]] || !visit(deps[i])) {
          logErr(id, 'معطّلة: اعتماد غير متاح (' + deps[i] + ')');
          mark[id] = 0;
          return false;
        }
      }
      mark[id] = 2;
      result.push(id);
      return true;
    }
    order.forEach(function (id) { visit(id); });
    Object.keys(modules).forEach(function (id) {
      if (result.indexOf(id) < 0) delete modules[id];
    });
    return result;
  }
  function currentState() {
    return typeof state !== 'undefined' ? state : undefined;
  }
  function buildCtx() {
    return {
      get state() { return currentState(); },
      get: function (k) { var s = currentState(); return s ? s[k] : undefined; },
      set: function (k, v) { var s = currentState(); if (s) s[k] = v; },
      save: function () { if (typeof saveState === 'function') saveState(); },
      ui: {
        toast: function (m) { if (typeof showMessage === 'function') showMessage(m); },
        showScreen: function (n) { if (typeof openScreen === 'function') openScreen(n); },
        closeScreen: function () { if (typeof closeScreen === 'function') closeScreen(); },
        confirm: function (t, fn) { if (window.confirm(t)) fn(); },
        beep: function (f, d) { if (typeof beep === 'function') beep(f, d); }
      },
      assets: {
        image: function (folder, id, emoji, size) {
          var s = size || 48;
          var alt = (emoji || '❔').replace(/'/g, '');
          return '<img src="assets/' + folder + '/' + id + '.webp" alt="" width="' + s + '" height="' + s +
            '" style="object-fit:contain" onerror="this.replaceWith(document.createTextNode(\'' + alt + '\'))">';
        }
      },
      modules: { get: function (id) { return modules[id] || null; } }
    };
  }
  function callHook(name) {
    if (!ready) return;
    var args = [ctx].concat(Array.prototype.slice.call(arguments, 1));
    order.slice().forEach(function (id) {
      var m = modules[id];
      if (m && typeof m[name] === 'function') {
        guard(id, name, function () { m[name].apply(m, args); });
      }
    });
  }
  function saveAll(st) {
    if (!ready) return;
    order.forEach(function (id) {
      var m = modules[id];
      if (m && typeof m.save === 'function') guard(id, 'save', function () { m.save(st); });
    });
  }
  function initAll() {
    if (ready) return;
    ready = true;
    ctx = buildCtx();
    order = resolveOrder();
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') || {}; } catch (e) {}
    order.forEach(function (id) {
      var m = modules[id];
      if (typeof m.init === 'function') guard(id, 'init', function () { m.init(ctx); });
    });
    order.forEach(function (id) {
      var m = modules[id];
      if (typeof m.load === 'function') guard(id, 'load', function () { m.load(saved); });
    });
    callHook('onGameStart');
    console.log('[Registry] ' + order.length + ' وحدة جاهزة');
  }
  window.ModuleRegistry = {
    register: register,
    callHook: callHook,
    saveAll: saveAll,
    get: function (id) { return modules[id] || null; },
    all: function () { return order.map(function (id) { return modules[id]; }); }
  };
  function loadNext(i) {
    if (i >= MODULE_LIST.length) { initAll(); return; }
    var s = document.createElement('script');
    s.src = MODULE_BASE + MODULE_LIST[i] + '.js';
    s.onload = function () { loadNext(i + 1); };
    s.onerror = function () { logErr('load', s.src); loadNext(i + 1); };
    document.body.appendChild(s);
  }
  loadNext(0);
})();
