/* js/29_ui.js — الشريط العلوي + القائمة الجانبية بتصميم احترافي متناسق (v3.1.9) */
(function () {
  'use strict';
  var SIDE_KEY = 'pirate_side_v1';
  var tries = 0;
  var lastShipsKey = '';

  var LEFT_BUTTONS = [
    { act: 'box',    title: 'صندوق الحظ',       img: '', fb: '🎁' },
    { act: 'daily',  title: 'المكافأة اليومية', img: '', fb: '🗝️' },
    { act: 'quests', title: 'المهام',           img: '', fb: '🏆' }
  ];

  function fmt(n) {
    n = Math.max(0, Math.floor(Number(n) || 0));
    return n.toLocaleString('en-US');
  }

  function injectCSS() {
    if (document.getElementById('_ui29_css')) return;
    var s = document.createElement('style');
    s.id = '_ui29_css';
    s.textContent = [
      /* ═══ إخفاء الشريط تلقائياً عند فتح أي شاشة فرعية أو نافذة منبثقة ═══ */
      'body.screen-open #topbar, body.screen-open #lbColumn{display:none!important;}',

      /* ═══ الشريط العلوي: تصميم احترافي متناسق (يمين: بروفايل | وسط: سفن | يسار: موارد) ═══ */
      '#topbar{position:fixed!important;top:0;left:0;right:0;height:calc(var(--safe-top) + 68px)!important;',
      'display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;',
      'padding:calc(var(--safe-top) + 4px) 10px 4px!important;z-index:300!important;',
      'background:linear-gradient(180deg,rgba(10,18,32,.98),rgba(5,11,20,.95))!important;',
      'border-bottom:1.5px solid rgba(255,215,106,.6)!important;box-shadow:0 6px 20px rgba(0,0,0,.65)!important;}',

      /* 1. الجهة اليمنى: الملف الشخصي (البروفايل، الاسم، المستوى) */
      '#topbar .player{order:1!important;flex:0 0 auto!important;display:flex!important;align-items:center!important;gap:6px!important;',
      'background:rgba(0,0,0,.35)!important;border:1px solid rgba(255,215,106,.3)!important;padding:3px 8px 3px 4px!important;border-radius:20px!important;}',
      '#topbar .avatar{width:36px!important;height:36px!important;font-size:15px!important;border-radius:50%!important;',
      'border:1.5px solid var(--gold)!important;background:radial-gradient(circle at 30% 30%,#2a4a75,#0b1d33)!important;',
      'box-shadow:0 0 8px var(--gold-glow),inset 0 0 5px rgba(0,0,0,.6)!important;flex-shrink:0;}',
      '#topbar .pinfo{display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;',
      'background:none!important;border:none!important;box-shadow:none!important;margin:0!important;padding:0!important;width:auto!important;}',
      '#topbar #pname{font-size:10px!important;font-weight:800!important;color:var(--gold)!important;',
      'white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:90px!important;line-height:1.2!important;}',
      '#topbar .lvlbar{display:none!important;}',
      '#topbar #lvlTxt{font-size:8px!important;color:#cbd5e1!important;opacity:.9;line-height:1.1!important;}',

      /* 2. المنتصف: خانات السفن بشكل مصغر وأنيق */
      '.tb-ships{order:2!important;display:flex!important;gap:4px!important;align-items:center!important;justify-content:center!important;}',
      '.tb-slot{position:relative;width:30px!important;height:30px!important;border-radius:7px!important;background:rgba(0,0,0,.5);',
      'border:1px solid rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:13px;}',
      '.tb-slot img{width:22px!important;height:22px!important;object-fit:contain;}',
      '.tb-slot.fleet{border-color:#4CAF50;box-shadow:0 0 5px rgba(76,175,80,.6);}',
      '.tb-slot.stor{border-color:#9ca3af;}',
      '.tb-slot.none{border-style:dashed;border-color:#f97316;color:#f97316;opacity:.7;}',
      '.tb-dot{position:absolute;top:-2px;right:-2px;width:7px;height:7px;border-radius:50%;border:1px solid #0b1424;background:#475569;}',
      '.tb-slot.fleet .tb-dot{background:#4CAF50;}',
      '.tb-slot.stor .tb-dot{background:#9ca3af;}',
      '.tb-slot.none .tb-dot{background:#f97316;}',

      /* 3. الجهة اليسرى: الموارد مرتبة بشكل عمودي متناسق ومرتب */
      '#topbar .resources{order:3!important;flex:0 0 auto!important;display:flex!important;flex-direction:column!important;',
      'gap:2px!important;width:125px!important;min-width:0!important;overflow:visible!important;}',
      '#topbar .res{width:100%!important;height:18px!important;display:flex!important;align-items:center!important;',
      'justify-content:flex-start!important;gap:4px!important;padding:0 5px!important;border-radius:4px!important;',
      'background:rgba(0,0,0,.45)!important;border:1px solid rgba(255,255,255,.12)!important;overflow:hidden!important;}',
      '#topbar .res img{width:11px!important;height:11px!important;margin:0!important;flex-shrink:0;}',
      '#topbar .res b{color:var(--gold)!important;font-weight:700!important;margin:0!important;',
      'white-space:nowrap!important;overflow:hidden!important;line-height:1;font-size:9.5px!important;display:block!important;width:100%!important;text-align:right!important;}',

      /* إخفاء الزر الإضافي لمنع التكدس */
      '#topbar #giftBtn{display:none!important;}',

      /* ═══ إزاحة العناصر تحت الشريط الثابت ═══ */
      '#fiRow{display:none!important;}',
      '#eventBanner{top:calc(var(--safe-top) + 76px)!important;}',
      '#message{top:calc(var(--safe-top) + 116px)!important;}',
      '#notifs{top:calc(var(--safe-top) + 156px)!important;}',

      /* ═══ القائمة الجانبية (اليسرى): تصميم احترافي بلمسة ألعاب القراصنة ═══ */
      '#lbColumn{position:fixed!important;left:10px!important;top:calc(var(--safe-top) + 82px)!important;',
      'display:flex!important;flex-direction:column!important;align-items:center!important;gap:8px!important;z-index:290!important;}',

      /* زر الطي الاحترافي */
      '.side-tog{width:30px;height:30px;border-radius:50%;border:1.5px solid var(--gold);',
      'background:radial-gradient(circle at 30% 25%,#ffe89c,#d4af37 60%,#7a5210);color:#1a0d02;font-size:16px;font-weight:900;',
      'display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;line-height:1;',
      'box-shadow:0 4px 10px rgba(0,0,0,.6),inset 0 1px 2px rgba(255,255,255,.6);transition:transform .2s,filter .2s;}',
      '.side-tog:hover{filter:brightness(1.15);}',
      '.side-tog:active{transform:scale(.88);}',

      /* حاوية الأيقونات بتصميم زجاجي ملكي */
      '.side-items{display:flex;flex-direction:column;align-items:center;gap:8px;padding:8px 6px;border-radius:18px;',
      'background:linear-gradient(180deg,rgba(12,22,40,.92),rgba(6,14,26,.92));',
      'border:1.5px solid rgba(255,215,106,.45);box-shadow:0 8px 22px rgba(0,0,0,.65),inset 0 1px 3px rgba(255,255,255,.1); backdrop-filter:blur(6px);}',
      'body.side-collapsed .side-items{display:none;}',

      /* زر الأيقونة الفردي */
      '.ui-lb{width:46px;height:46px;padding:0;border:none;background:none;cursor:pointer;',
      'display:flex;align-items:center;justify-content:center;transition:transform .15s,filter .15s;}',
      '.ui-lb:hover{filter:brightness(1.15); transform:translateY(-1px);}',
      '.ui-lb:active{transform:scale(.86);}',

      /* خلفية أيقونة الصندوق/المكافأة الزجاجية الذهبية */
      '.ui-lb-img{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;',
      'background:radial-gradient(circle at 35% 30%,#ffeaa7,#d4af37 55%,#5a3a0c);',
      'border:1.5px solid var(--gold);box-shadow:0 4px 12px rgba(0,0,0,.6),inset 0 2px 4px rgba(255,255,255,.6);}',
      '.ui-lb-img img{width:32px;height:32px;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,.6));}',
      '.ui-lb-fb{font-size:22px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5));}'
    ].join('');
    document.head.appendChild(s);
  }

  function moveTopToBody() {
    var top = document.getElementById('topbar');
    if (top && top.parentNode !== document.body) document.body.appendChild(top);
  }

  function watchScreens() {
    function check() {
      var open = !!document.querySelector(
        '.screen.open, .fr-wrap.open, .tr-wrap.open, .ch-wrap.open, .bv5-wrap.open, .ar-wrap.open, .arb-wrap.open, .wt-wrap.open, #fleet-storage[style*="block"], #dragon-forge[style*="block"], #fl-upg-modal'
      );
      document.body.classList.toggle('screen-open', open);
    }
    setInterval(check, 150);
    check();
  }

  function buildTop() {
    var top = document.getElementById('topbar');
    if (!top) return false;
    if (top.getAttribute('data-ui29') === '1') return true;
    top.setAttribute('data-ui29', '1');

    var res = top.querySelector('.resources');
    if (res && !document.getElementById('tbShips')) {
      var row = document.createElement('div');
      row.className = 'tb-ships';
      row.id = 'tbShips';
      top.insertBefore(row, res);
    }
    return true;
  }

  function updateShips() {
    var row = document.getElementById('tbShips');
    if (!row || typeof state === 'undefined' || !state || !Array.isArray(state.ships)) return;

    var active = [], stor = [];
    state.ships.forEach(function (s) { (s.inStorage ? stor : active).push(s); });
    var list = active.concat(stor).slice(0, 3);

    var html = '';
    for (var i = 0; i < 3; i++) {
      var s = list[i];
      var cls = 'none', inner = '+';
      if (s) {
        cls = i < active.length ? 'fleet' : 'stor';
        var def = window.SHIP_BY_CODE && window.SHIP_BY_CODE[s.code];
        inner = (def && def.img)
          ? '<img src="' + def.img + '" alt="" onerror="this.style.display=\'none\'">'
          : '⛵';
      }
      html += '<div class="tb-slot ' + cls + '">' + inner + '<i class="tb-dot"></i></div>';
    }
    if (html !== lastShipsKey) { row.innerHTML = html; lastShipsKey = html; }
  }

  function fitText(el) {
    var parent = el.parentNode;
    if (!parent) return;
    var size = 9.5;
    el.style.fontSize = size + 'px';
    var avail = parent.clientWidth - 24;
    while (el.scrollWidth > avail && size > 6) {
      size -= 0.5;
      el.style.fontSize = size + 'px';
    }
  }

  function setT(id, v) {
    var el = document.getElementById(id);
    if (!el) return;
    var t = String(v);
    if (el.textContent !== t) { 
      el.textContent = t; 
      fitText(el);
    }
  }

  function updateRes() {
    if (typeof state === 'undefined' || !state) return;
    setT('coins', fmt(state.coins));
    setT('gems', fmt(state.gems));
    var disc = (window.FishDiscovery && FishDiscovery.count) ? FishDiscovery.count() : 0;
    var total = (window.FISH_ORDER_COUNT) || Object.keys(window.FISH || {}).length;
    setT('fishCount', disc + '/' + total);
  }

  /* ═══ القائمة الجانبية ═══ */
  function readFlag(k) { try { return localStorage.getItem(k) === '1'; } catch (e) { return false; } }
  function writeFlag(k, on) { try { localStorage.setItem(k, on ? '1' : '0'); } catch (e) {} }
  function applySide(on) {
    document.body.classList.toggle('side-collapsed', !!on);
    var tog = document.getElementById('sideTog');
    if (tog) tog.textContent = on ? '›' : '‹';
  }

  function buildLeft(col) {
    if (col.getAttribute('data-ui29') === '1') return;
    col.setAttribute('data-ui29', '1');

    var items = LEFT_BUTTONS.map(function (b) {
      var icon = b.img ? '<img src="' + b.img + '" alt="" onerror="this.remove()">' : '';
      return '<button class="ui-lb" data-act="' + b.act + '" title="' + b.title + '" aria-label="' + b.title + '">' +
        '<span class="ui-lb-img">' + icon + '<span class="ui-lb-fb">' + b.fb + '</span></span>' +
        '</button>';
    }).join('');

    col.innerHTML =
      '<button class="side-tog" id="sideTog" aria-label="طي القائمة">‹</button>' +
      '<div class="side-items">' + items + '</div>';

    col.querySelector('#sideTog').addEventListener('click', function (e) {
      e.stopPropagation();
      var on = !document.body.classList.contains('side-collapsed');
      applySide(on);
      writeFlag(SIDE_KEY, on);
    });
    applySide(readFlag(SIDE_KEY));
  }

  function patch() {
    injectCSS();
    moveTopToBody();
    var top = buildTop();
    var col = document.getElementById('lbColumn');
    if (col) buildLeft(col);
    return top && !!col;
  }

  if (!patch()) {
    var iv = setInterval(function () {
      if (patch() || ++tries > 200) clearInterval(iv);
    }, 50);
  }

  setInterval(function () { updateShips(); updateRes(); }, 300);
  updateShips();
  updateRes();
  watchScreens();
})();
