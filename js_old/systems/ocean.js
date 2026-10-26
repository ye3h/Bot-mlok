/* ═══════════════════════════════════════════════════════════════
   ocean.js — رسم المحيط + تفاعل السفن
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.Ocean = {
  canvas: null,
  ctx: null,
  rafId: 0,
  lastDraw: 0,
  SLOTS: [ {x:.30,y:.62}, {x:.55,y:.68}, {x:.72,y:.58}, {x:.42,y:.80} ],

  init: function() {
    Ocean.canvas = document.getElementById('oceanCanvas');
    if (!Ocean.canvas) return;
    Ocean.ctx = Ocean.canvas.getContext('2d');
    Ocean.resize();
    window.addEventListener('resize', Ocean.resize);
    window.addEventListener('orientationchange', function() { setTimeout(Ocean.resize, 200); });
    Ocean.canvas.addEventListener('click', Ocean.onClick);
  },

  resize: function() {
    if (!Ocean.canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    Ocean.canvas.width = window.innerWidth * dpr;
    Ocean.canvas.height = window.innerHeight * dpr;
    Ocean.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  },

  start: function() { if (Ocean.rafId) return; Ocean.rafId = requestAnimationFrame(Ocean.frame); },
  stop: function() { cancelAnimationFrame(Ocean.rafId); Ocean.rafId = 0; },

  frame: function(t) {
    if (t - Ocean.lastDraw > 33) { Ocean.lastDraw = t; Ocean.draw(); }
    Ocean.rafId = requestAnimationFrame(Ocean.frame);
  },

  draw: function() {
    var c = Ocean.ctx, W = window.innerWidth, H = window.innerHeight, now = Date.now();
    var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a94ff'); g.addColorStop(.3, '#0a45a8');
    g.addColorStop(.7, '#061f58'); g.addColorStop(1, '#04163f');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (Ocean.bgImage) {
      c.save();
      c.globalAlpha = 0.45;
      c.drawImage(Ocean.bgImage, 0, 0, W, H);
      c.restore();
    }

    var sun = c.createRadialGradient(W * .75, H * .18, 4, W * .75, H * .18, 70);
    sun.addColorStop(0, 'rgba(255,240,180,.9)');
    sun.addColorStop(1, 'rgba(255,240,180,0)');
    c.fillStyle = sun;
    c.beginPath(); c.arc(W * .75, H * .18, 70, 0, Math.PI * 2); c.fill();

    var tt = now / 1200;
    for (var l = 0; l < 4; l++) {
      var baseY = H * .52 + l * H * .075;
      var amp = 8 + l * 4;
      var sp = .3 + l * .15;
      c.beginPath(); c.moveTo(0, H);
      for (var x = 0; x <= W; x += 12) {
        c.lineTo(x, baseY + Math.sin(x / 140 + tt * sp) * amp + Math.cos(x / 70 + tt * sp * 1.3) * amp * .35);
      }
      c.lineTo(W, H); c.closePath();
      c.fillStyle = 'rgba(' + (20 + l * 8) + ',' + (70 + l * 15) + ',' + (150 + l * 20) + ',' + (.3 + l * .15) + ')';
      c.fill();
    }

    STATE.boats.forEach(function(b, i) { Ocean.drawBoat(b, i, W, H, now); });
  },

  drawBoat: function(b, i, W, H, now) {
    var c = Ocean.ctx;
    var def = SHIP_DEFS[b.type] || SHIP_DEFS.basic;
    var p = Ocean.SLOTS[i % Ocean.SLOTS.length];
    var s = def.w;
    var x = p.x * W;
    var y = p.y * H + Math.sin(now / 900 + i * 2) * 4;

    c.fillStyle = 'rgba(0,0,0,.25)';
    c.beginPath(); c.ellipse(x, y + s * .28, s * .5, s * .12, 0, 0, Math.PI * 2); c.fill();

    var shipImg = (window.ASSET_LOADER && ASSET_LOADER.get('ships', b.type));
    if (shipImg) {
      var aspect = shipImg.width / shipImg.height;
      var drawH = s * 0.6, drawW = drawH * aspect;
      c.drawImage(shipImg, x - drawW / 2, y - drawH / 2, drawW, drawH);
    } else {
      c.save(); c.translate(x, y);
      c.fillStyle = def.color;
      c.beginPath(); c.ellipse(0, 0, s / 2, s / 4.5, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#3a2a1a'; c.fillRect(-2, -s * .4, 4, s * .4);
      c.fillStyle = '#e0d8c0';
      c.beginPath(); c.moveTo(0, -s * .4); c.lineTo(s * .25, -s * .18); c.lineTo(0, -s * .1); c.closePath(); c.fill();
      c.restore();
    }

    c.font = 'bold 11px Cairo, sans-serif'; c.textAlign = 'center';
    c.fillStyle = 'rgba(0,0,0,.7)';
    c.fillRect(x - 42, y + s * .4 + 4, 84, 16);
    c.fillStyle = '#fff'; c.fillText(def.name, x, y + s * .4 + 16);

    if (b.fishing) {
      var pct = Math.min(1, Fleet.progress(b) / Fleet.getCapacity(b));
      c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(x - 30, y - s * .75, 60, 8);
      c.fillStyle = '#3ddc5f'; c.fillRect(x - 30, y - s * .75, 60 * pct, 8);
    }

    b.hs = { x: x, y: y, r: s * .6 };
  },

  onClick: function(e) {
    var r = Ocean.canvas.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    for (var i = STATE.boats.length - 1; i >= 0; i--) {
      var hs = STATE.boats[i].hs;
      if (hs && Math.hypot(x - hs.x, y - hs.y) < hs.r) {
        if (typeof showBoatMenu === 'function') showBoatMenu(i);
        return;
      }
    }
  }
};



window.Ocean.applyBackground = function(bgKey) {
  if (!Ocean.canvas) return;
  Ocean.currentBg = bgKey;
  var bg = (window.ASSET_LOADER && ASSET_LOADER.get('backgrounds', bgKey)) || null;
  Ocean.bgImage = bg;
};

window.Ocean.getCurrentBg = function() {
  return Ocean.currentBg || 'day';
};

console.log('[System/Ocean] جاهز');
