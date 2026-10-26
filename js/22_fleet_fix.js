/* js/22_fleet_fix.js — patch لـ fleet.js (v2.0.0)
   - يحقن CSS المفقود لـ .fl-ship / .fl-panel
   - يضمن وجود sellShip
   - لا يعيد توجيه openStorage (المخزن الحقيقي هو fleet.openStorage)
*/
(function () {
  'use strict';
  var tries = 0;

  function injectCSS() {
    if (document.getElementById('_fleet_css_22')) return;
    var s = document.createElement('style');
    s.id = '_fleet_css_22';
    s.textContent =
      '.fl-ship{position:absolute;transform:translate(-50%,-50%);cursor:pointer;z-index:5;pointer-events:auto;display:flex;flex-direction:column;align-items:center;gap:3px;transition:left .15s linear,top .15s linear}' +
      '.fl-ship img{width:60px;height:60px;object-fit:contain;filter:drop-shadow(0 4px 8px rgba(0,0,0,.7));pointer-events:none}' +
      '.fl-ship .fl-lbl{font-size:9px;font-weight:800;color:#FFD76A;background:rgba(0,0,0,.7);padding:2px 6px;border-radius:6px;white-space:nowrap;font-family:inherit;border:1px solid rgba(255,215,106,.35)}' +
      '.fl-ship .fl-bar{width:46px;height:4px;background:rgba(0,0,0,.6);border-radius:2px;overflow:hidden;border:1px solid rgba(255,215,106,.25)}' +
      '.fl-ship .fl-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#4ade80,#22c55e);transition:width .2s}' +
      '.fl-panel{position:absolute;transform:translate(-50%,-100%);z-index:25;background:linear-gradient(180deg,rgba(20,35,60,.98),rgba(10,20,40,.98));border:2px solid rgba(255,215,106,.7);border-radius:14px;padding:10px;min-width:190px;pointer-events:auto;box-shadow:0 10px 30px rgba(0,0,0,.8)}' +
      '.fl-panel .fl-head{color:#FFD76A;font-weight:900;font-size:13px;text-align:center;margin-bottom:8px;font-family:inherit;text-shadow:0 1px 3px rgba(0,0,0,.8)}' +
      '.fl-panel .fl-btns{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}' +
      '.fl-panel .fl-btns button{display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 4px;border-radius:10px;border:1.5px solid rgba(255,215,106,.5);background:linear-gradient(180deg,rgba(255,215,106,.15),rgba(255,215,106,.05));color:#fff;font-family:inherit;cursor:pointer;font-size:11px;font-weight:800;transition:transform .1s}' +
      '.fl-panel .fl-btns button:active{transform:scale(.94)}' +
      '.fl-panel .fl-ico{font-size:20px;line-height:1}' +
      '.fl-panel .fl-btns small{font-size:9px;color:#FFD76A;font-weight:700}';
    document.head.appendChild(s);
  }

  function patch() {
    if (!window.ModuleRegistry) return false;
    injectCSS();

    var f = window.ModuleRegistry.get('fleet');
    if (!f) return false;
    if (f.__patched22) return true;
    f.__patched22 = true;

    // sellShip موجودة في fleet.js v7، هذا احتياط فقط
    if (typeof f.sellShip !== 'function') {
      f.sellShip = function (ship) {
        if (!ship || !ship.id) return;
        return this.sellShipById(ship.id);
      };
    }

    if (typeof f.sync === 'function') {
      try { f.sync(); } catch (e) {}
    }
    return true;
  }

  injectCSS();
  if (patch()) return;
  var iv = setInterval(function () {
    if (patch() || ++tries > 200) clearInterval(iv);
  }, 50);
})();
