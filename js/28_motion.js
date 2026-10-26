/* js/28_motion.js — حركة الموقع: GSAP + ScrollTrigger + Lenis (v1.0.0) */
(function () {
  'use strict';

  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var hasGsap = typeof window.gsap !== 'undefined';
  var hasST = typeof window.ScrollTrigger !== 'undefined';
  var scrollerEl = null;

  if (hasGsap && hasST) gsap.registerPlugin(ScrollTrigger);

  // يضيف scroller فقط إذا كان فيه حاوية سكرول مخصصة
  function stCfg(o) {
    if (scrollerEl) o.scroller = scrollerEl;
    return o;
  }

  function injectCSS() {
    if (document.getElementById('_motion_css')) return;
    var s = document.createElement('style');
    s.id = '_motion_css';
    s.textContent = [
      '.light-rays{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;mix-blend-mode:screen}',
      '.star-border{position:relative;display:inline-block;overflow:hidden;padding:2px;border-radius:16px;vertical-align:middle}',
      '.star-border::before{content:"";position:absolute;left:-50%;top:-50%;width:200%;height:200%;',
      'background:conic-gradient(from 0deg,transparent 0 70%,#FFD76A 82%,transparent 94%);',
      'animation:sb-spin 3.5s linear infinite;pointer-events:none;z-index:0}',
      '.star-border>*{position:relative;z-index:1;border-radius:14px}',
      '@keyframes sb-spin{to{transform:rotate(360deg)}}',
      '@media (prefers-reduced-motion: reduce){.star-border::before{animation:none}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ═══ Lenis مربوط بـ GSAP ticker (فقط للحاوية المحددة بـ data-smooth-scroll) ═══ */
  function initSmoothScroll() {
    if (reduce || typeof window.Lenis === 'undefined') return;
    var el = document.querySelector('[data-smooth-scroll]');
    if (!el) return;
    scrollerEl = el;

    var lenis = new Lenis({
      wrapper: el,
      content: el.firstElementChild || el,
      duration: 1.1,
      smoothWheel: true,
      touchMultiplier: 1.2
    });

    if (hasST) lenis.on('scroll', ScrollTrigger.update);

    if (hasGsap) {
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function loop(t) { lenis.raf(t); requestAnimationFrame(loop); })(performance.now());
    }
  }

  /* ═══ زر Star Border ═══ */
  function initStarBorder() {
    document.querySelectorAll('[data-star-border]').forEach(function (el) {
      if (el.parentNode && el.parentNode.classList.contains('star-border')) return;
      var wrap = document.createElement('span');
      wrap.className = 'star-border';
      wrap.style.display = el.classList.contains('wide') ? 'block' : 'inline-block';
      el.parentNode.insertBefore(wrap, el);
      wrap.appendChild(el);
    });
  }

  /* ═══ Blur Text: يقسم الكلمات ويظهرها بضبابية تتلاشى ═══ */
  function initBlurText() {
    document.querySelectorAll('[data-blur-text]').forEach(function (el) {
      var text = el.textContent.trim();
      el.setAttribute('aria-label', text);
      el.textContent = '';

      var words = text.split(/\s+/);
      var spans = [];
      words.forEach(function (w, i) {
        var s = document.createElement('span');
        s.textContent = w;
        s.setAttribute('aria-hidden', 'true');
        s.style.display = 'inline-block';
        el.appendChild(s);
        spans.push(s);
        if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      });

      if (!hasGsap || reduce) return;
      gsap.fromTo(spans,
        { opacity: 0, y: 14, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out', stagger: 0.07, clearProps: 'filter,transform' }
      );
    });
  }

  /* ═══ ظهور الأقسام عند السكرول ═══ */
  function initReveal() {
    if (!hasGsap || !hasST || reduce) return;
    gsap.utils.toArray('[data-reveal]').forEach(function (el) {
      gsap.fromTo(el,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', clearProps: 'transform',
          scrollTrigger: stCfg({ trigger: el, start: 'top 88%', once: true })
        }
      );
    });
  }

  /* ═══ الأرقام تعدّ لحالها ═══ */
  function initCounters() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-count')) || 0;
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var fmt = function (v) {
        return v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      };

      if (!hasGsap || !hasST || reduce) { el.textContent = fmt(to); return; }

      el.textContent = fmt(0);
      var o = { v: 0 };
      ScrollTrigger.create(stCfg({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: function () {
          gsap.to(o, {
            v: to, duration: 1.8, ease: 'power2.out',
            onUpdate: function () { el.textContent = fmt(o.v); },
            onComplete: function () { el.textContent = fmt(to); }
          });
        }
      }));
    });
  }

  /* ═══ Light Rays للـ hero: أشعة ذهبية وزرقاء خفيفة ═══ */
  function initLightRays() {
    document.querySelectorAll('[data-light-rays]').forEach(function (box) {
      var cv = document.createElement('canvas');
      cv.className = 'light-rays';
      box.insertBefore(cv, box.firstChild);
      var ctx = cv.getContext('2d');
      var W = 0, H = 0, dpr = 1, t = 0, rafId = 0;
      var RAYS = 8;
      var COLS = ['255,215,106', '56,189,248'];

      function size() {
        var r = box.getBoundingClientRect();
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = r.width; H = r.height;
        cv.width = W * dpr;
        cv.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      function draw() {
        ctx.clearRect(0, 0, W, H);
        var ox = W * 0.5, oy = -H * 0.1, len = H * 1.4, spread = 0.05;
        for (var i = 0; i < RAYS; i++) {
          var base = Math.PI / 2 + (i - (RAYS - 1) / 2) * 0.22;
          var a = base + Math.sin(t * 0.4 + i * 1.7) * 0.06;
          var col = COLS[i % COLS.length];
          var gx = ox + Math.cos(a) * len, gy = oy + Math.sin(a) * len;
          var g = ctx.createLinearGradient(ox, oy, gx, gy);
          g.addColorStop(0, 'rgba(' + col + ',0.16)');
          g.addColorStop(1, 'rgba(' + col + ',0)');
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox + Math.cos(a - spread) * len, oy + Math.sin(a - spread) * len);
          ctx.lineTo(ox + Math.cos(a + spread) * len, oy + Math.sin(a + spread) * len);
          ctx.closePath();
          ctx.fillStyle = g;
          ctx.fill();
        }
      }

      function loop() {
        t += 0.016;
        draw();
        rafId = requestAnimationFrame(loop);
      }

      size();
      if (reduce) {
        draw();
      } else {
        loop();
        document.addEventListener('visibilitychange', function () {
          if (document.hidden) cancelAnimationFrame(rafId);
          else loop();
        });
      }
      window.addEventListener('resize', function () { size(); if (reduce) draw(); });
    });
  }

  function boot() {
    injectCSS();
    initSmoothScroll();
    initStarBorder();
    initBlurText();
    initCounters();
    initReveal();
    initLightRays();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.Motion = { reduce: reduce };
})();
