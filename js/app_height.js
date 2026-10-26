/* js/app_height.js — إصلاح ارتفاع الشاشة على iOS/Android */
(function () {
  'use strict';

  function setAppHeight() {
    var h = window.innerHeight ||
            document.documentElement.clientHeight ||
            screen.height;
    document.documentElement.style.setProperty('--app-height', h + 'px');
  }

  setAppHeight();
  window.addEventListener('resize', setAppHeight, { passive: true });
  window.addEventListener('orientationchange', function () {
    setTimeout(setAppHeight, 100);
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setAppHeight, { passive: true });
    window.visualViewport.addEventListener('scroll', setAppHeight, { passive: true });
  }

  document.addEventListener('focusin', function () { setTimeout(setAppHeight, 50); });
  document.addEventListener('focusout', function () { setTimeout(setAppHeight, 100); });
  window.addEventListener('load', setAppHeight);
})();
