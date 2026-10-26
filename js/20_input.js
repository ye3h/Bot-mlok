'use strict';
/* ════════════ اللمس ════════════ */
$('editToggle').onclick = toggleEdit;
$('editReset').onclick = function () { if (editMode) resetLayout(); };

$('boat').addEventListener('click', function () {
  if (editMode) return;
  if (currentTripState === TS.IDLE) startTrip();
  else if (currentTripState === TS.FISHING) startReturn();
});

$('scene').addEventListener('pointerdown', function (e) {
  if (editMode) return;
  if (e.target.closest('.map-item, #boat')) return;
  if (currentTripState !== TS.IDLE) return;
  const r = $('scene').getBoundingClientRect();
  setTarget((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
});

