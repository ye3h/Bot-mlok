/* js/27_compact_panel.js — لوحة سفينة مدمجة (v1.0.0) */
(function () {
  'use strict';
  if (document.getElementById('_compact_panel_css')) return;
  var s = document.createElement('style');
  s.id = '_compact_panel_css';
  s.textContent = [
    '.fl-panel{min-width:0!important;max-width:none!important;padding:4px!important;border-radius:12px!important;',
    'background:rgba(10,18,32,.95)!important;border:1px solid rgba(252,191,73,.35)!important;',
    'box-shadow:0 4px 12px rgba(0,0,0,.6)!important;}',
    '.fl-panel .fl-head{display:none!important;}',
    '.fl-panel .fl-btns{display:flex!important;flex-direction:row!important;gap:4px!important;justify-content:center!important;}',
    '.fl-panel .fl-btns button{width:auto!important;min-width:52px!important;height:46px!important;',
    'padding:4px 8px!important;border-radius:10px!important;',
    'background:rgba(30,45,75,.9)!important;border:1px solid rgba(252,215,106,.35)!important;',
    'box-shadow:none!important;display:flex!important;flex-direction:column!important;',
    'align-items:center!important;justify-content:center!important;gap:1px!important;',
    'font-family:inherit!important;cursor:pointer!important;overflow:hidden!important;',
    'transition:transform .1s!important;}',
    '.fl-panel .fl-btns button:active{transform:scale(.9)!important;background:rgba(60,80,120,.95)!important;}',
    '.fl-panel .fl-btns .fl-ico{display:none!important;}',
    '.fl-panel .fl-btns .fl-ico-2{font-size:16px!important;line-height:1!important;',
    'filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))!important;}',
    '.fl-panel .fl-btns small{font-size:9px!important;font-weight:800!important;',
    'color:#FFE9A8!important;line-height:1!important;white-space:nowrap!important;}'
  ].join('');
  document.head.appendChild(s);
})();
