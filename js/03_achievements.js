'use strict';
/* ════════════ الإنجازات (v2.0.0) ════════════ */
const ACHIEVEMENTS = [
  {id:'first_catch', name:'أول صيد',       desc:'اصطد سمكة واحدة',          gems:5,   test:s => s.stats.caught >= 1},
  {id:'catch_100',   name:'صياد ماهر',     desc:'اصطد 100 سمكة',           gems:20,  test:s => s.stats.caught >= 100},
  {id:'catch_1000',  name:'سيد المحيط',    desc:'اصطد 1000 سمكة',          gems:100, test:s => s.stats.caught >= 1000},
  {id:'first_sale',  name:'تاجر',          desc:'بع أول سمكة',             gems:5,   test:s => s.stats.sold >= 1},
  {id:'rich',        name:'ثري',           desc:'اجمع 50,000 ذهب من البيع', gems:30,  test:s => s.stats.earned >= 50000},
  {id:'golden',      name:'الحظ الذهبي',   desc:'اصطد سمكة ذهبية',         gems:25,  test:s => s.stats.golden >= 1},
  {id:'legend',      name:'صياد الأساطير', desc:'اصطد سمكة أسطورية',       gems:40,  test:s => s.stats.legendary >= 1},
  {id:'fleet',       name:'أسطول صغير',    desc:'امتلك 3 سفن',             gems:20,  test:s => s.owned.filter(id => SHIP_BY_ID[id]).length >= 3},
  {id:'lvl10',       name:'قبطان',         desc:'وصل للمستوى 10',          gems:15,  test:s => levelOf(s.xp) >= 10},
  {id:'lvl70',       name:'أسطورة البحار', desc:'وصل للمستوى 150',         gems:300, test:s => levelOf(s.xp) >= MAX_LEVEL},
];

/* ════════════ فحص الإنجازات (v2.0.0) ════════════
   تُنادى بعد: نهاية الرحلة، الشراء، البيع، المكافأة اليومية، البدء.
   لكل إنجاز لم يُفتح بعد: يُشغَّل test(state)، وإذا نجح → يُعلَّم + جواهر.
*/
function checkAchievements() {
  if (typeof state === 'undefined' || !state) return;
  if (!state.achv || typeof state.achv !== 'object') state.achv = {};
  if (typeof state.gems !== 'number') state.gems = 0;

  var anyNew = false;
  var newly = [];

  for (var i = 0; i < ACHIEVEMENTS.length; i++) {
    var a = ACHIEVEMENTS[i];
    if (state.achv[a.id]) continue;

    var passed = false;
    try {
      passed = !!a.test(state);
    } catch (e) {
      passed = false;
    }

    if (passed) {
      state.achv[a.id] = true;
      state.gems += (a.gems || 0);
      anyNew = true;
      newly.push(a);
    }
  }

  if (!anyNew) return;

  if (typeof saveState === 'function') saveState();
  if (typeof render === 'function') render();

  // أظهر رسالة لكل إنجاز جديد (واحد فقط لتجنب الازدحام)
  if (newly.length === 1) {
    var one = newly[0];
    if (typeof showMessage === 'function') showMessage('🏆 ' + one.name + ' +' + one.gems + '💎');
    if (typeof beep === 'function') beep(1200, 0.15);
  } else if (newly.length > 1) {
    var total = 0;
    for (var k = 0; k < newly.length; k++) total += (newly[k].gems || 0);
    if (typeof showMessage === 'function') showMessage('🏆 ' + newly.length + ' إنجازات +' + total + '💎');
    if (typeof beep === 'function') beep(1200, 0.2);
  }

  if (typeof log === 'function') {
    for (var j = 0; j < newly.length; j++) log('🏆 إنجاز: ' + newly[j].name);
  }
}
