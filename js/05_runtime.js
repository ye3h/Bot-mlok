'use strict';
/* ════════════ متغيرات التشغيل (v2.0.0 — var بدل let لمنع TDZ) ════════════ */

var state = loadState();
var layout = loadLayout();
var currentTripState = TS.IDLE;
var shopTab = 'ships';
var sortMode = 'price';
var previewTimer = null, previewBackId = null;
var activeScreen = null;
var _msgTimer = null;
var lastTick = Date.now();
var lastRender = 0;
var editMode = false;
var dragKey = null;
var activeEvent = null;
var soundOn = (typeof localStorage !== 'undefined') ? (localStorage.getItem(SOUND_KEY) !== 'off') : true;
var audioCtx = null;

var $ = function (id) { return document.getElementById(id); };
var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };

function setText(id, v) { var el = $(id); if (el) el.textContent = v; }
function fishImg(id) { return 'assets/fish/' + id + '.webp'; }
function hook() {
  if (window.ModuleRegistry) ModuleRegistry.callHook.apply(null, arguments);
}
