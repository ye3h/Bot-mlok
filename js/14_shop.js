'use strict';
/* ════════════ المتجر ════════════ */
function getItem(id) { return ITEM_BY_ID[id]; }

function syncShopTabs() {
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === shopTab));
}

function renderShop() {
  const list = $('shopList');
  list.innerHTML = '';
  const items = shopTab === 'ships' ? SHIPS : BACKGROUNDS;
  const lvl = levelOf(state.xp);

  items.forEach(item => {
    const owned = state.owned.includes(item.id);
    const equipped = state.equipped[item.cat] === item.id;
    const locked = !owned && (item.req_level || 0) > lvl;

    const card = document.createElement('div');
    card.className = 'card' + (locked ? ' locked' : '');
    if (item.rarity) card.style.setProperty('--rc', RARITY_COLORS[item.rarity]);

    const th = document.createElement('div');
    th.className = 'thumb';
    th.appendChild(itemImage(item, 56, 46));
    card.appendChild(th);

    let html = '<div class="nm">' + item.name + '</div>';
    if (item.cat === 'ships') {
      html += '<div class="sub">⏱ ' + item.fishing_seconds + ' ث لكل صيدة · 🐟 ' +
        item.fish.slice(0, 3).map(id => FISH[id] ? FISH[id].name : id).join('، ') + '</div>';
    }
    const price = owned ? '✓ مملوك' : (locked ? '🔒 يتطلب المستوى ' + item.req_level : '💰 ' + item.price_coins.toLocaleString());
    html += '<div class="pr">' + price + '</div>';
    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML = html;
    card.appendChild(info);

    const acts = document.createElement('div');
    acts.className = 'acts';
    if (!owned) {
      acts.appendChild(makeBtn(locked ? 'مقفل' : 'شراء', 'btn gold', () => buyItem(item.id), locked));
    } else if (!equipped) {
      acts.appendChild(makeBtn('تركيب', 'btn', () => equipItem(item.id)));
    } else {
      acts.appendChild(makeBtn('مُركّب ✓', 'btn', null, true));
    }
    if (item.cat === 'backgrounds' && !equipped) {
      acts.appendChild(makeBtn('معاينة', 'btn alt', () => previewBackground(item.id)));
    }
    card.appendChild(acts);
    list.appendChild(card);
  });
}

function buyItem(id) {
  const item = getItem(id);
  if (!item || state.owned.includes(id)) return;
  if (levelOf(state.xp) < (item.req_level || 0)) { showMessage('🔒 تحتاج المستوى ' + item.req_level); return; }
  if (state.coins < item.price_coins) { showMessage('💰 الذهب غير كافٍ'); return; }
  state.coins -= item.price_coins;
  state.owned.push(id);
  saveState();
  render();
  renderShop();
  beep(780, 0.12);
  showMessage('✅ تم شراء ' + item.name);
  log('🛒 اشتريت ' + item.name);
  checkAchievements();
}

function equipItem(id) {
  const item = getItem(id);
  if (!item || !state.owned.includes(id)) return;
  if (currentTripState !== TS.IDLE) { showMessage('⚠️ لا يمكن التغيير أثناء الرحلة'); return; }
  state.equipped[item.cat] = id;
  saveState();
  applyEquipped();
  renderShop();
  showMessage('⚓ تم تركيب ' + item.name);
}

function getBgStyle(id) {
  const item = getItem(id);
  if (item && item.img) return "url('" + item.img + "') center/cover no-repeat," + GRADIENT_BG;
  return GRADIENT_BG;
}

function applyBackground(id) {
  const scene = $('scene');
  if (!scene) return;
  const vid = document.getElementById('bg-video');
  
  if (id === 'bg_storm') {
    // إذا اختار العاصفة، نظهر الفيديو ونخفي الصورة
    if (vid) vid.style.display = 'block';
    scene.style.background = 'linear-gradient(180deg, transparent, rgba(0,0,0,0.5))';
  } else {
    // إذا اختار خلفية ثانية، نخفي الفيديو ونظهر الصورة
    if (vid) vid.style.display = 'none';
    scene.style.background = getBgStyle(id);
  }
}

function previewBackground(id) {
  const item = getItem(id);
  if (!item) return;
  if (previewTimer) clearTimeout(previewTimer);
  previewBackId = id;
  applyBackground(id);
  showMessage('👁 معاينة ' + item.name + ' — 5 ثوانٍ');
  previewTimer = setTimeout(() => { previewBackId = null; applyEquipped(); }, 5000);
}

function applyEquipped() {
  if (previewBackId) return;
  applyBackground(state.equipped.backgrounds);
  applyShip();
}

