// modules/boat_constant_speed.js - حركة ثابتة للقارب الأساسي مثل Unity (ES5)
ModuleRegistry.register({
  id: 'boat_constant_speed',
  name: 'حركة ثابتة للقارب',
  version: '1.0.0',
  dependencies: [],

  // ─── إعدادات قابلة للتعديل ───
  SPEED: 0.15,      // سرعة ثابتة (نسبة من المشهد في الثانية)
  STOP_DIST: 0.005, // مسافة الوصول

  ctx: null,

  init: function (ctx) {
    var self = this;
    this.ctx = ctx;

    // نغلّف دالة الحركة الأصلية، ونستبدل منطقها بحركة ثابتة
    if (typeof window.updateBoatPhysics !== 'function') return;
    var origUpdate = window.updateBoatPhysics;

    window.updateBoatPhysics = function (dt) {
      if (!P.ready) return;

      // الحالات الخاصة (العودة للميناء) تبقى كما هي
      if (currentTripState === TS.RETURNING) {
        origUpdate(dt);
        return;
      }

      if (P.hasTarget) {
        var dx = P.tx - P.x;
        var dy = P.ty - P.y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= self.STOP_DIST) {
          P.x = P.tx;
          P.y = P.ty;
          P.hasTarget = false;
          P.vx = 0;
          P.vy = 0;
          hideTarget();
        } else {
          var step = self.SPEED * dt;
          var m = Math.min(step, dist);
          P.x += dx / dist * m;
          P.y += dy / dist * m;
          P.vx = dx / dist * self.SPEED;
          P.vy = dy / dist * self.SPEED;
        }
      } else {
        P.vx = 0;
        P.vy = 0;
      }

      // نفس حدود المشهد والدوران من الدالة الأصلية
      if (P.x < 0.05) P.x = 0.05;
      if (P.x > 0.95) P.x = 0.95;
      if (P.y < 0.12) P.y = 0.12;
      if (P.y > 0.88) P.y = 0.88;

      var rotTarget = clamp((P.vx / P.maxSpeed) * 15, -15, 15);
      P.rot += (rotTarget - P.rot) * Math.min(1, dt * 8);
      applyBoatTransform();
    };
  }
});
