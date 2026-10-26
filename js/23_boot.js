'use strict';
/* ════════════ البدء ════════════ */
ensureMarket();
applyLayout();
bindMap();
initBoatPosition();

if (state.trip) {
  if (Date.now() >= state.trip.endsAt) {
    endTrip();
  } else {
    currentTripState = TS.FISHING;
    setTarget(layout.sea.x, layout.sea.y);
    showMessage('🌊 استرجعت رحلتك السابقة');
    log('🔄 استرجعت رحلة جارية');
  }
}

applyEquipped();
rollEvent();
setActiveNav('home');
render();
renderStorage();
checkAchievements();
setupDevTools();
log('🎮 مرحباً ' + state.name + '، اللعبة جاهزة');
hook('onGameStart');

window.addEventListener('beforeunload', saveState);
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'hidden') saveState();
});
