// ═══════════════════════════════════════════════════════════════════
// SCRAB K114 v5.4 — ملوك القراصنة (مصحح)
// ═══════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  if (window.scrabBot) window.scrabBot.stop();
  ['scrab-bot-panel','scrab-badge-mini'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

  const css = document.createElement('style');
  css.textContent = `
    #scrab-bot-panel{position:fixed!important;top:50%;left:50%;transform:translate(-50%,-50%);z-index:999999!important;width:320px;background:linear-gradient(145deg,rgba(15,0,0,0.88) 0%,rgba(20,0,0,0.95) 100%);backdrop-filter:blur(16px) saturate(150%);border-radius:20px;box-shadow:0 0 0 1px rgba(255,0,0,0.35),0 12px 40px rgba(0,0,0,0.9),0 0 50px rgba(255,0,0,0.12),inset 0 0 20px rgba(255,0,0,0.04);color:#e0e0e0;overflow:hidden;transition:all 0.4s cubic-bezier(0.4,0,0.2,1);user-select:none;font-family:'Almarai','Segoe UI',sans-serif;cursor:grab;touch-action:none}
    #scrab-bot-panel:active{cursor:grabbing}
    #scrab-bot-panel::before{content:'';position:absolute;inset:0;border-radius:20px;padding:1.5px;background:linear-gradient(120deg,#ff0000,#ff4444,#00f0ff,#ff00d4,#ff0000);background-size:400% 400%;-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:sbf 8s linear infinite;z-index:-1;opacity:0.85}
    @keyframes sbf{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

    .scrab-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(255,0,0,0.05);border-bottom:1px solid rgba(255,0,0,0.2);position:relative;pointer-events:none}
    .scrab-header::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#ff4444,transparent)}
    .scrab-title{display:flex;align-items:center;gap:6px;font-weight:800;color:#ff4d4d;letter-spacing:1px;font-size:12px}
    .scrab-mini-icon{width:18px;height:18px;border-radius:4px;background:linear-gradient(145deg,#ff2b2b,#5e0000);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:#fff;box-shadow:0 0 8px rgba(255,0,0,0.5)}
    .scrab-dot{width:6px;height:6px;border-radius:50%;background:#ff2b2b;box-shadow:0 0 6px #ff0000;animation:blink 1.6s infinite}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
    .scrab-eq{display:flex;align-items:flex-end;gap:2px;height:14px;margin-right:4px}
    .scrab-eq span{width:2px;background:linear-gradient(180deg,#ff5555,#ff0000);border-radius:1px;animation:eq 0.9s ease-in-out infinite}
    .scrab-eq span:nth-child(1){animation-delay:0s;height:40%}
    .scrab-eq span:nth-child(2){animation-delay:.15s;height:80%}
    .scrab-eq span:nth-child(3){animation-delay:.3s;height:55%}
    .scrab-eq span:nth-child(4){animation-delay:.45s;height:90%}
    @keyframes eq{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}
    .scrab-min-btn{width:20px;height:20px;border-radius:50%;border:1px solid rgba(255,0,0,0.4);background:rgba(255,0,0,0.08);color:#ff6b6b;font-size:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.2s;pointer-events:auto}
    .scrab-min-btn:hover{background:rgba(255,0,0,0.25)}

    .scrab-logo{text-align:center;padding:8px 14px 4px;position:relative;z-index:2}
    .scrab-logo-text{font-size:28px;font-weight:900;color:#fff;text-shadow:0 0 6px #ff2b2b,0 0 12px #ff0000,0 0 24px #b30000;animation:pulse 3.2s ease-in-out infinite;line-height:1}
    @keyframes pulse{0%,100%{text-shadow:0 0 6px #ff2b2b,0 0 12px #ff0000,0 0 24px #b30000}50%{text-shadow:0 0 10px #ff5b5b,0 0 20px #ff0000,0 0 38px #d10000}}
    .scrab-logo-sub{margin-top:2px;letter-spacing:5px;font-size:9px;color:#ff4d4d;text-shadow:0 0 4px #ff0000}

    .scrab-ring{position:absolute;top:50%;left:50%;border-radius:50%;border:1px solid rgba(255,0,40,0.2);transform:translate(-50%,-50%);animation:spin linear infinite;pointer-events:none;z-index:0}
    .scrab-ring-1{width:85%;height:85%;animation-duration:18s;border-style:dashed;border-color:rgba(255,0,40,0.3)}
    .scrab-ring-2{width:110%;height:110%;animation-duration:28s;border-color:rgba(0,240,255,0.1);animation-direction:reverse}
    @keyframes spin{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}

    .scrab-content{padding:12px 14px;position:relative;z-index:2}

    .scrab-main-btn{width:100%;padding:12px;border:none;border-radius:12px;font-size:13px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.3s ease;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;position:relative;overflow:hidden;pointer-events:auto}
    .scrab-main-btn::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent);transition:left 0.5s}
    .scrab-main-btn:hover::before{left:100%}
    .scrab-main-btn.start{background:linear-gradient(145deg,#ff2b2b,#7a0000);color:#fff;border:1px solid #ff5555;box-shadow:0 3px 18px rgba(255,0,0,0.35)}
    .scrab-main-btn.start:hover{transform:translateY(-1px);box-shadow:0 5px 25px rgba(255,0,0,0.6)}
    .scrab-main-btn.stop{background:linear-gradient(145deg,#220000,#440000);color:#ff5555;box-shadow:0 3px 18px rgba(255,0,0,0.25);animation:spb 1.5s infinite;border:1px solid #ff0000}
    @keyframes spb{0%,100%{box-shadow:0 3px 18px rgba(255,0,0,0.25)}50%{box-shadow:0 3px 30px rgba(255,0,0,0.5)}}
    .scrab-main-btn.stop:hover{transform:translateY(-1px);box-shadow:0 5px 22px rgba(255,0,0,0.45)}

    .scrab-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
    .scrab-stat-box{background:linear-gradient(145deg,rgba(255,0,0,0.06),rgba(255,0,0,0.02));border:1px solid rgba(255,0,0,0.15);border-radius:10px;padding:8px;text-align:center;position:relative;overflow:hidden}
    .scrab-stat-box::before{content:'';position:absolute;top:0;left:0;right:0;height:1.5px;background:linear-gradient(90deg,transparent,#ff0000,transparent);opacity:0.4}
    .scrab-stat-label{font-size:8px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px}
    .scrab-stat-value{font-size:16px;font-weight:800}
    .scrab-stat-value.gold{color:#ffd700;text-shadow:0 0 8px rgba(255,215,0,0.25)}
    .scrab-stat-value.fish{color:#00d4ff;text-shadow:0 0 8px rgba(0,212,255,0.25)}
    .scrab-stat-value.cycle{color:#00ff88;text-shadow:0 0 8px rgba(0,255,136,0.25)}
    .scrab-stat-value.time{color:#ffaa00;text-shadow:0 0 8px rgba(255,170,0,0.25)}

    .scrab-status-bar{background:linear-gradient(145deg,rgba(0,0,0,0.4),rgba(0,0,0,0.2));border:1px solid rgba(255,0,0,0.12);border-radius:8px;padding:8px 10px;margin-bottom:8px;display:flex;align-items:center;gap:8px;font-size:11px}
    .scrab-status-dot{width:10px;height:10px;border-radius:50%;background:#ff4444;box-shadow:0 0 8px rgba(255,68,68,0.5);transition:all 0.3s;flex-shrink:0}
    .scrab-status-dot.active{background:#00ff88;box-shadow:0 0 8px rgba(0,255,136,0.5);animation:sbl 1.5s infinite}
    @keyframes sbl{0%,100%{opacity:1}50%{opacity:0.4}}
    .scrab-status-text{flex:1;font-weight:600}

    .scrab-progress{background:rgba(0,0,0,0.35);border-radius:8px;height:6px;overflow:hidden;margin-bottom:8px;border:1px solid rgba(255,0,0,0.08)}
    .scrab-progress-bar{height:100%;background:linear-gradient(90deg,#ff0000,#ff4444,#ff8888);border-radius:8px;transition:width 1s linear;width:0%;box-shadow:0 0 8px rgba(255,0,0,0.2)}

    .scrab-log{background:linear-gradient(145deg,rgba(0,0,0,0.45),rgba(0,0,0,0.25));border:1px solid rgba(255,0,0,0.12);border-radius:10px;padding:8px;height:90px;overflow-y:auto;font-family:'Courier New',monospace;font-size:10px;line-height:1.6}
    .scrab-log-entry{padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
    .scrab-log-entry.info{color:#00d4ff}
    .scrab-log-entry.success{color:#00ff88}
    .scrab-log-entry.warn{color:#ffaa00}
    .scrab-log-entry.error{color:#ff5555}
    .scrab-log-entry.gold{color:#ffd700}
    .scrab-log::-webkit-scrollbar{width:3px}
    .scrab-log::-webkit-scrollbar-track{background:transparent}
    .scrab-log::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#ff0000,#990000);border-radius:2px}

    .scrab-btn-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
    .scrab-btn{padding:10px;border-radius:8px;border:1px solid rgba(255,0,0,0.35);background:linear-gradient(145deg,#1a0000,#0a0a0a);color:#ff8080;font-family:inherit;font-weight:700;font-size:11px;letter-spacing:0.5px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:all .2s;position:relative;overflow:hidden;pointer-events:auto}
    .scrab-btn:hover{background:linear-gradient(145deg,#2a0000,#150000);box-shadow:0 0 12px rgba(255,0,0,.4);color:#fff;transform:translateY(-1px)}
    .scrab-btn .ic{font-size:14px}

    .scrab-settings{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,0,0,0.15);display:none}
    .scrab-setting-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-size:11px;padding:4px 0}
    .scrab-toggle{width:40px;height:22px;background:#333;border-radius:11px;position:relative;cursor:pointer;transition:all 0.3s;flex-shrink:0;border:1px solid rgba(255,0,0,0.2)}
    .scrab-toggle.active{background:linear-gradient(145deg,#00c853,#00e676);border-color:rgba(0,200,83,0.5);box-shadow:0 0 8px rgba(0,200,83,0.25)}
    .scrab-toggle::after{content:'';position:absolute;width:18px;height:18px;background:linear-gradient(145deg,#fff,#ddd);border-radius:50%;top:1px;left:1px;transition:all 0.3s;box-shadow:0 2px 4px rgba(0,0,0,0.3)}
    .scrab-toggle.active::after{left:20px}

    .scrab-footer{margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,0,0,0.08);text-align:center;font-size:9px;color:#ff4444;opacity:0.5;letter-spacing:2px;font-weight:600}

    #scrab-bot-panel.scrab-minimized{width:52px!important;height:52px!important;border-radius:50%!important;overflow:hidden!important;cursor:grab;box-shadow:0 0 20px rgba(255,0,0,0.4);padding:0!important}
    #scrab-bot-panel.scrab-minimized:active{cursor:grabbing}
    #scrab-bot-panel.scrab-minimized .scrab-content,#scrab-bot-panel.scrab-minimized .scrab-logo,#scrab-bot-panel.scrab-minimized .scrab-header{display:none!important}
    #scrab-bot-panel.scrab-minimized .scrab-ring{display:none!important}
    #scrab-bot-panel.scrab-minimized::before{padding:2px}

    .scrab-badge-mini{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:40px;height:40px;display:flex;align-items:center;justify-content:center;pointer-events:none}
    .scrab-badge-mini .badge-core{width:36px;height:36px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#2a0000,#0a0000 70%);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 1px rgba(255,0,0,.5),0 0 12px rgba(255,0,0,.5),inset 0 0 8px rgba(255,0,0,.2);animation:corePulse 2.6s ease-in-out infinite,miniFloat 3s ease-in-out infinite;position:relative;overflow:hidden}
    .scrab-badge-mini .badge-core::before{content:'';position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,transparent,rgba(255,0,0,.5),transparent 30%);animation:sweep 3s linear infinite}
    @keyframes sweep{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes corePulse{0%,100%{box-shadow:0 0 0 1px rgba(255,0,0,.5),0 0 12px rgba(255,0,0,.5),inset 0 0 8px rgba(255,0,0,.2)}50%{box-shadow:0 0 0 1px rgba(255,0,0,.8),0 0 20px rgba(255,0,0,.7),inset 0 0 12px rgba(255,0,0,.35)}}
    @keyframes miniFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
    .scrab-badge-mini .badge-letter{position:relative;z-index:3;font-size:16px;font-weight:900;color:#fff;text-shadow:0 0 6px #ff2b2b,0 0 10px #ff0000}
    .scrab-badge-mini .badge-ring{position:absolute;top:50%;left:50%;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}
    .scrab-badge-mini .badge-ring.r1{width:48px;height:48px;border:1px solid rgba(255,0,40,.4);border-style:dashed;animation:spin 8s linear infinite}
    .scrab-badge-mini .badge-ring.r2{width:58px;height:58px;border:1px solid rgba(0,240,255,.2);animation:spin 14s linear infinite reverse}
  `;
  document.head.appendChild(css);

  const panel = document.createElement('div');
  panel.id = 'scrab-bot-panel';
  panel.innerHTML = `
    <div class="scrab-header">
      <div class="scrab-title">
        <span class="scrab-mini-icon">S</span>
        <span>SCRAB K114 v5.4</span>
      </div>
      <div style="display:flex;align-items:center;">
        <div class="scrab-eq"><span></span><span></span><span></span><span></span></div>
        <div class="scrab-dot"></div>
        <div class="scrab-min-btn" id="scrab-minimize">−</div>
      </div>
    </div>
    <div class="scrab-logo">
      <div class="scrab-logo-text">سكراب</div>
      <div class="scrab-logo-sub">S C R A B</div>
    </div>
    <div class="scrab-ring scrab-ring-1"></div>
    <div class="scrab-ring scrab-ring-2"></div>
    <div class="scrab-content" id="scrab-content">
      <button class="scrab-main-btn start" id="scrab-toggle-btn">
        <span>▶</span>
        <span>تشغيل البوت</span>
      </button>
      <div class="scrab-status-bar">
        <div class="scrab-status-dot" id="scrab-status-dot"></div>
        <span class="scrab-status-text" id="scrab-status-text">متوقف</span>
      </div>
      <div class="scrab-progress">
        <div class="scrab-progress-bar" id="scrab-progress-bar"></div>
      </div>
      <div class="scrab-stats">
        <div class="scrab-stat-box">
          <div class="scrab-stat-label">الدورات</div>
          <div class="scrab-stat-value cycle" id="scrab-stat-cycles">0</div>
        </div>
        <div class="scrab-stat-box">
          <div class="scrab-stat-label">السمك</div>
          <div class="scrab-stat-value fish" id="scrab-stat-fish">0</div>
        </div>
        <div class="scrab-stat-box">
          <div class="scrab-stat-label">الذهب</div>
          <div class="scrab-stat-value gold" id="scrab-stat-gold">0</div>
        </div>
        <div class="scrab-stat-box">
          <div class="scrab-stat-label">الوقت</div>
          <div class="scrab-stat-value time" id="scrab-stat-time">0د</div>
        </div>
      </div>
      <div class="scrab-log" id="scrab-log"></div>
      <div class="scrab-btn-grid">
        <button class="scrab-btn" id="scrab-btn-repair"><span class="ic">🔧</span> إصلاح</button>
        <button class="scrab-btn" id="scrab-btn-notify"><span class="ic">🔔</span> إشعارات</button>
        <button class="scrab-btn" id="scrab-btn-stats"><span class="ic">📊</span> إحصائيات</button>
        <button class="scrab-btn" id="scrab-btn-settings"><span class="ic">⚙️</span> إعدادات</button>
      </div>
      <div class="scrab-settings" id="scrab-settings-panel">
        <div class="scrab-setting-row">
          <span>🔧 إصلاح تلقائي</span>
          <div class="scrab-toggle active" id="scrab-toggle-repair"></div>
        </div>
        <div class="scrab-setting-row">
          <span>🔔 إشعارات الربح</span>
          <div class="scrab-toggle active" id="scrab-toggle-notify"></div>
        </div>
        <div class="scrab-setting-row">
          <span>🚀 إرسال سريع</span>
          <div class="scrab-toggle" id="scrab-toggle-fast"></div>
        </div>
        <div class="scrab-setting-row">
          <span>💎 بيع ذكي</span>
          <div class="scrab-toggle active" id="scrab-toggle-auto-sell"></div>
        </div>
      </div>
      <div class="scrab-footer">© SCRAB — ملوك القراصنة</div>
    </div>
    <div class="scrab-badge-mini" id="scrab-badge-mini" style="display:none;">
      <div class="badge-ring r1"></div>
      <div class="badge-ring r2"></div>
      <div class="badge-core">
        <span class="badge-letter">S</span>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  const ui = {
    panel: document.getElementById('scrab-bot-panel'),
    toggleBtn: document.getElementById('scrab-toggle-btn'),
    statusDot: document.getElementById('scrab-status-dot'),
    statusText: document.getElementById('scrab-status-text'),
    progressBar: document.getElementById('scrab-progress-bar'),
    statCycles: document.getElementById('scrab-stat-cycles'),
    statFish: document.getElementById('scrab-stat-fish'),
    statGold: document.getElementById('scrab-stat-gold'),
    statTime: document.getElementById('scrab-stat-time'),
    logBox: document.getElementById('scrab-log'),
    minimizeBtn: document.getElementById('scrab-minimize'),
    toggleRepair: document.getElementById('scrab-toggle-repair'),
    toggleNotify: document.getElementById('scrab-toggle-notify'),
    toggleFast: document.getElementById('scrab-toggle-fast'),
    toggleAutoSell: document.getElementById('scrab-toggle-auto-sell'),
    settingsPanel: document.getElementById('scrab-settings-panel'),
    btnRepair: document.getElementById('scrab-btn-repair'),
    btnNotify: document.getElementById('scrab-btn-notify'),
    btnStats: document.getElementById('scrab-btn-stats'),
    btnSettings: document.getElementById('scrab-btn-settings'),
    badgeMini: document.getElementById('scrab-badge-mini')
  };

  let isMinimized = false;
  let isDragging = false;
  let dragOffsetX = 0, dragOffsetY = 0;
  let startX = 0, startY = 0;
  let hasMoved = false;

  function addLog(msg, type = 'info') {
    const entry = document.createElement('div');
    entry.className = 'scrab-log-entry ' + type;
    const time = new Date().toLocaleTimeString('ar-SA', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.textContent = '[' + time + '] ' + msg;
    ui.logBox.appendChild(entry);
    ui.logBox.scrollTop = ui.logBox.scrollHeight;
    while (ui.logBox.children.length > 50) ui.logBox.removeChild(ui.logBox.firstChild);
  }

  function updateStats() {
    if (!window.scrabBot) return;
    ui.statCycles.textContent = window.scrabBot.stats.cycles;
    ui.statFish.textContent = window.scrabBot.stats.totalFish;
    ui.statGold.textContent = (window.scrabBot._lastGold || 0).toLocaleString();
    const elapsed = window.scrabBot.stats.startTime ? Math.floor((Date.now() - window.scrabBot.stats.startTime) / 60000) : 0;
    ui.statTime.textContent = elapsed + 'د';
  }

  function updateProgress() {
    if (!window.scrabBot || !window.scrabBot.running) {
      ui.progressBar.style.width = '0%';
      return;
    }
    const elapsed = Date.now() - (window.scrabBot._cycleStart || Date.now());
    const pct = Math.min((elapsed / window.scrabBot.config.interval) * 100, 100);
    ui.progressBar.style.width = pct + '%';
  }

  function setRunningState(isRunning) {
    if (isRunning) {
      ui.toggleBtn.className = 'scrab-main-btn stop';
      ui.toggleBtn.innerHTML = '<span>⏹</span><span>إيقاف البوت</span>';
      ui.statusDot.classList.add('active');
      ui.statusText.textContent = 'يعمل...';
      window.scrabBot._cycleStart = Date.now();
    } else {
      ui.toggleBtn.className = 'scrab-main-btn start';
      ui.toggleBtn.innerHTML = '<span>▶</span><span>تشغيل البوت</span>';
      ui.statusDot.classList.remove('active');
      ui.statusText.textContent = 'متوقف';
      ui.progressBar.style.width = '0%';
    }
  }

  function handleStart(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = ui.panel.getBoundingClientRect();
    dragOffsetX = clientX - rect.left;
    dragOffsetY = clientY - rect.top;
    startX = clientX;
    startY = clientY;
    hasMoved = false;
    isDragging = true;
    ui.panel.style.transition = 'none';
    if (e.preventDefault) e.preventDefault();
  }

  function handleMove(e) {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    if (Math.abs(clientX - startX) > 5 || Math.abs(clientY - startY) > 5) hasMoved = true;
    let x = clientX - dragOffsetX;
    let y = clientY - dragOffsetY;
    x = Math.max(0, Math.min(window.innerWidth - ui.panel.offsetWidth, x));
    y = Math.max(0, Math.min(window.innerHeight - ui.panel.offsetHeight, y));
    ui.panel.style.left = x + 'px';
    ui.panel.style.top = y + 'px';
    ui.panel.style.right = 'auto';
    ui.panel.style.transform = 'none';
    if (e.preventDefault) e.preventDefault();
  }

  function handleEnd() {
    if (!isDragging) return;
    isDragging = false;
    ui.panel.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
  }

  ui.panel.addEventListener('mousedown', handleStart);
  document.addEventListener('mousemove', handleMove);
  document.addEventListener('mouseup', handleEnd);
  ui.panel.addEventListener('touchstart', handleStart, { passive: false });
  document.addEventListener('touchmove', handleMove, { passive: false });
  document.addEventListener('touchend', handleEnd);

  ui.toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.scrabBot.running) {
      window.scrabBot.stop();
      setRunningState(false);
      addLog('⏹ تم إيقاف البوت', 'warn');
    } else {
      window.scrabBot.start();
      setRunningState(true);
      addLog('▶ تم تشغيل البوت', 'success');
    }
  });

  ui.toggleBtn.addEventListener('touchend', (e) => { e.stopPropagation(); e.preventDefault(); ui.toggleBtn.click(); }, { passive: false });

  function toggleMinimize() {
    isMinimized = !isMinimized;
    if (isMinimized) {
      ui.panel.classList.add('scrab-minimized');
      ui.badgeMini.style.display = 'flex';
      ui.minimizeBtn.textContent = '□';
      addLog('📦 تم تصغير اللوحة', 'info');
    } else {
      ui.panel.classList.remove('scrab-minimized');
      ui.badgeMini.style.display = 'none';
      ui.minimizeBtn.textContent = '−';
      addLog('📂 تم تكبير اللوحة', 'info');
    }
  }

  ui.minimizeBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMinimize(); });
  ui.minimizeBtn.addEventListener('touchend', (e) => { e.stopPropagation(); e.preventDefault(); toggleMinimize(); }, { passive: false });
  ui.panel.addEventListener('click', (e) => { if (isMinimized && !hasMoved) toggleMinimize(); });
  ui.panel.addEventListener('touchend', (e) => { if (isMinimized && !hasMoved) { e.preventDefault(); toggleMinimize(); } }, { passive: false });

  ui.btnSettings.addEventListener('click', (e) => {
    e.stopPropagation();
    const visible = ui.settingsPanel.style.display !== 'none';
    ui.settingsPanel.style.display = visible ? 'none' : 'block';
    addLog(visible ? '⚙️ إغلاق الإعدادات' : '⚙️ فتح الإعدادات', 'info');
  });

  ui.btnStats.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!window.scrabBot) return;
    addLog('═══ إحصائيات كاملة ═══', 'gold');
    addLog('📊 دورات: ' + window.scrabBot.stats.cycles, 'info');
    addLog('🐟 سمك مباع: ' + window.scrabBot.stats.totalFish, 'info');
    addLog('💰 آخر رصيد: ' + (window.scrabBot._lastGold || 0).toLocaleString(), 'gold');
    const elapsed = window.scrabBot.stats.startTime ? Math.floor((Date.now() - window.scrabBot.stats.startTime) / 60000) : 0;
    addLog('⏱️ وقت التشغيل: ' + elapsed + ' دقيقة', 'info');
  });

  function toggleSetting(el, key, onText, offText) {
    el.classList.toggle('active');
    const isActive = el.classList.contains('active');
    window.scrabBot.config[key] = isActive;
    addLog(isActive ? onText : offText, 'info');
  }

  ui.toggleRepair.addEventListener('click', function(e) { e.stopPropagation(); toggleSetting(this, 'autoRepair', '🔧 الإصلاح التلقائي: مفعل', '🔧 الإصلاح التلقائي: معطل'); });
  ui.toggleRepair.addEventListener('touchend', function(e) { e.stopPropagation(); e.preventDefault(); this.click(); }, { passive: false });
  ui.toggleNotify.addEventListener('click', function(e) { e.stopPropagation(); toggleSetting(this, 'notify', '🔔 الإشعارات: مفعلة', '🔔 الإشعارات: معطلة'); });
  ui.toggleNotify.addEventListener('touchend', function(e) { e.stopPropagation(); e.preventDefault(); this.click(); }, { passive: false });
  ui.toggleFast.addEventListener('click', function(e) { e.stopPropagation(); toggleSetting(this, 'fastMode', '🚀 الإرسال السريع: مفعل', '🚀 الإرسال السريع: معطل'); });
  ui.toggleFast.addEventListener('touchend', function(e) { e.stopPropagation(); e.preventDefault(); this.click(); }, { passive: false });
  ui.toggleAutoSell.addEventListener('click', function(e) { e.stopPropagation(); toggleSetting(this, 'autoSell', '💎 البيع الذكي: مفعل', '💎 البيع الذكي: معطل'); });
  ui.toggleAutoSell.addEventListener('touchend', function(e) { e.stopPropagation(); e.preventDefault(); this.click(); }, { passive: false });

  setInterval(() => { updateStats(); updateProgress(); }, 1000);

  window.scrabBot = {
    running: false,
    stats: { cycles: 0, totalGold: 0, totalFish: 0, startTime: null, totalShips: 0, bestFish: 0 },
    config: { interval: 300000, retryDelay: 5000, maxRetries: 3, autoRepair: true, notify: true, fastMode: false, autoSell: true },

    async sleep(ms) { return new Promise(r => setTimeout(r, ms)); },

    getToken() {
      return JSON.parse(localStorage.getItem('sb-qjwbfkpudysxqtkeouwu-auth-token'));
    },

    getHeaders() {
      const token = this.getToken();
      const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqd2Jma3B1ZHlzeHF0a2VvdXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDEyNDksImV4cCI6MjA5NTMxNzI0OX0.rs4NXx8bMPQ3k8Zgf_F3efeDPuAsxPlqS0bZ3cFE9dI';
      return { 'apikey': apiKey, 'Authorization': 'Bearer ' + token.access_token, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
    },

    async api(url, opts = {}) {
      const headers = this.getHeaders();
      for (let i = 0; i < this.config.maxRetries; i++) {
        try {
          const res = await fetch(url, { ...opts, headers: { ...headers, ...opts.headers } });
          if (res.status === 429) {
            addLog('توقف مؤقت (Rate Limit)...', 'warn');
            await this.sleep(10000);
            continue;
          }
          if (!res.ok) {
            const errText = await res.text().catch(() => '');
            throw new Error('HTTP ' + res.status + ' - ' + errText.slice(0, 100));
          }
          const text = await res.text();
          if (text) {
            try {
              const json = JSON.parse(text);
              if (json && json.code && json.message) {
                throw new Error('RPC: ' + json.message);
              }
            } catch (e) {
              if (e.message && e.message.startsWith('RPC:')) throw e;
            }
          }
          return { ok: true, text: text };
        } catch (e) {
          if (i === this.config.maxRetries - 1) throw e;
          addLog('إعادة محاولة ' + (i + 1) + ': ' + e.message, 'warn');
          await this.sleep(this.config.retryDelay);
        }
      }
    },

    async getShips() {
      const t = this.getToken();
      const res = await this.api('https://qjwbfkpudysxqtkeouwu.supabase.co/rest/v1/ships_owned?user_id=eq.' + t.user.id + '&select=*', { cache: 'no-store' });
      return JSON.parse(res.text);
    },

    async getProfile() {
      const t = this.getToken();
      const res = await this.api('https://qjwbfkpudysxqtkeouwu.supabase.co/rest/v1/profiles?id=eq.' + t.user.id + '&select=*', { cache: 'no-store' });
      return JSON.parse(res.text);
    },

    async getFishStock() {
      const res = await this.api('https://qjwbfkpudysxqtkeouwu.supabase.co/rest/v1/rpc/get_fish_stock_summary', { method: 'POST', body: '{}' });
      return JSON.parse(res.text);
    },

    async collect(ship) {
      const fishId = ship.preferred_fish_id || 'poseidon';
      addLog('🎣 جمع من ' + ship.catalog_code + ' (' + fishId + ')...', 'info');
      await this.api('https://qjwbfkpudysxqtkeouwu.supabase.co/rest/v1/rpc/collect_fishing_reward', {
        method: 'POST',
        body: JSON.stringify({
          _ship_id: ship.id,
          _requested_fish_id: fishId,
          _client_progress: 5000
        })
      });
      addLog('  ✅ جمع نجح', 'success');
    },

    async returnToPort(ship) {
      addLog('⚓ إرجاع ' + ship.catalog_code + ' للميناء...', 'info');
      await this.api('https://qjwbfkpudysxqtkeouwu.supabase.co/rest/v1/rpc/set_ship_at_sea', {
        method: 'POST',
        body: JSON.stringify({ _at_sea: false, _ship_id: ship.id })
      });
      addLog('  ✅ رجعت الميناء', 'success');
    },

    async sendToSea(ship) {
      addLog('🚀 إرسال ' + ship.catalog_code + '...', 'info');
      try {
        await this.api('https://qjwbfkpudysxqtkeouwu.supabase.co/rest/v1/rpc/set_ship_at_sea', {
          method: 'POST',
          body: JSON.stringify({ _at_sea: true, _ship_id: ship.id })
        });
        addLog('  ✅ ' + ship.catalog_code + ' في البحر', 'success');
        return true;
      } catch (e) {
        addLog('  ❌ فشل الإرسال: ' + e.message, 'error');
        return false;
      }
    },

    async sellFish(item) {
      if (item.qty <= 0) return 0;
      addLog('💰 بيع ' + item.qty + '× ' + item.fish_id + '...', 'gold');
      await this.api('https://qjwbfkpudysxqtkeouwu.supabase.co/rest/v1/rpc/sell_fish_by_qty', {
        method: 'POST',
        body: JSON.stringify({
          _fish_id: item.fish_id,
          _qty: item.qty,
          _client_version: 'fish-market-v20260626-force-update-1'
        })
      });
      return item.qty;
    },

    async sellBestFish() {
      if (!this.config.autoSell) return 0;
      const stock = await this.getFishStock();
      let totalSold = 0;
      const sorted = (stock || []).sort((a, b) => (b.price || 0) - (a.price || 0));
      for (const item of sorted) {
        if (item.qty > 0) {
          totalSold += await this.sellFish(item);
          await this.sleep(300);
        }
      }
      if (totalSold > 0) addLog('💎 بيع ذكي: ' + totalSold + ' سمكة', 'gold');
      return totalSold;
    },

    async repairShip(ship) {
      if (!this.config.autoRepair || ship.current_hp >= ship.max_hp * 0.5) return;
      addLog('🔧 إصلاح ' + ship.catalog_code + ' (HP: ' + ship.current_hp + '/' + ship.max_hp + ')...', 'warn');
      try {
        await this.api('https://qjwbfkpudysxqtkeouwu.supabase.co/rest/v1/rpc/repair_ship', {
          method: 'POST',
          body: JSON.stringify({ _ship_id: ship.id })
        });
        addLog('✅ تم إصلاح ' + ship.catalog_code, 'success');
      } catch (e) {
        addLog('⚠️ فشل إصلاح ' + ship.catalog_code, 'warn');
      }
    },

    async cycle() {
      this.stats.cycles++;
      this._cycleStart = Date.now();
      addLog('═══ دورة #' + this.stats.cycles + ' ═══', 'gold');
      try {
        const ships = await this.getShips();
        this.stats.totalShips = ships.length;
        const atSea = ships.filter(s => s.at_sea);
        const atPort = ships.filter(s => !s.at_sea);
        addLog('⛵ السفن: ' + ships.length + ' | في البحر: ' + atSea.length + ' | في الميناء: ' + atPort.length, 'info');

        for (const ship of atSea) {
          await this.collect(ship);
          await this.returnToPort(ship);
          await this.sleep(this.config.fastMode ? 200 : 500);
        }

        let sold = 0;
        if (this.config.autoSell) {
          sold = await this.sellBestFish();
        } else {
          const stock = await this.getFishStock();
          for (const item of stock || []) {
            sold += await this.sellFish(item);
            await this.sleep(300);
          }
        }
        this.stats.totalFish += sold;
        if (sold > this.stats.bestFish) this.stats.bestFish = sold;

        const ships2 = await this.getShips();
        let sent = 0;
        for (const ship of ships2.filter(s => !s.at_sea)) {
          await this.repairShip(ship);
          if (await this.sendToSea(ship)) sent++;
          await this.sleep(this.config.fastMode ? 300 : 800);
        }

        const profile = await this.getProfile();
        const gold = profile[0]?.coins || 0;
        const gems = profile[0]?.gems || 0;
        addLog('📊 الذهب: ' + gold.toLocaleString() + ' | جواهر: ' + gems + ' | سمك: ' + sold + ' | أُرسلت: ' + sent + '/' + atPort.length, 'gold');

        if (this.config.notify && gold > (this._lastGold || 0) + 5000) {
          addLog('🎉 ربح كبير! +' + (gold - (this._lastGold || gold)).toLocaleString() + ' ذهب', 'success');
        }
        this._lastGold = gold;
      } catch (e) {
        addLog('❌ خطأ: ' + e.message, 'error');
      }
    },

    async start() {
      this.running = true;
      this.stats.startTime = Date.now();
      addLog('🏴‍☠️ SCRAB K114 v5.4 جاهز!', 'gold');
      addLog('⚡ الوضع السريع: ' + (this.config.fastMode ? 'مفعل' : 'معطل'), 'info');
      addLog('💎 البيع الذكي: ' + (this.config.autoSell ? 'مفعل' : 'معطل'), 'info');
      await this.cycle();
      while (this.running) {
        const mins = (this.config.interval / 60000).toFixed(2);
        addLog('⏳ انتظار ' + mins + ' دقيقة...', 'info');
        await this.sleep(this.config.interval);
        if (this.running) await this.cycle();
      }
    },

    stop() {
      this.running = false;
      const elapsed = Math.floor((Date.now() - (this.stats.startTime || Date.now())) / 60000);
      addLog('🛑 توقف | دورات: ' + this.stats.cycles + ' | سمك: ' + this.stats.totalFish + ' | ⏱️ ' + elapsed + 'د', 'gold');
    }
  };

  window.ub = window.scrabBot;

  addLog('🏴‍☠️ SCRAB K114 v5.4 جاهز!', 'gold');
  addLog('© SCRAB — ملوك القراصنة', 'success');

})();
