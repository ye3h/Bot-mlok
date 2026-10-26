/* js/25_fish_discovery.js — سجل الأسماك (v3.0.0)
   يطابق جدول fish_caught في molok حرفياً
   state.fishCaught = { "sardine": { totalCaught: 5 }, ... }
*/
'use strict';
(function () {

  // ═══ يضمن وجود state.fishCaught ═══
  function ensure() {
    if (typeof state === 'undefined' || !state) return {};
    if (!state.fishCaught) {
      state.fishCaught = {};
      // ترحيل من النسخة القديمة (fishDiscovered) لو موجودة
      if (state.fishDiscovered) {
        for (var k in state.fishDiscovered) {
          if (!state.fishDiscovered.hasOwnProperty(k)) continue;
          var old = state.fishDiscovered[k];
          state.fishCaught[k] = {
            totalCaught: (old && old.totalCaught) || 0
          };
        }
        delete state.fishDiscovered;
      }
    }
    return state.fishCaught;
  }

  window.FishDiscovery = {
    // ═══ يُسجّل صيدة جديدة — يرجّع true لو أول مرة ═══
    register: function (fishId) {
      if (!fishId) return false;
      var store = ensure();
      var old = store[fishId];
      var isNew = !old || !old.totalCaught;

      if (old) {
        old.totalCaught = (old.totalCaught || 0) + 1;
      } else {
        store[fishId] = { totalCaught: 1 };
      }

      if (typeof saveState === 'function') saveState();
      return isNew;
    },

    // ═══ يعيد صف كامل — نفس هيكل molok ═══
    // total_caught = max(fish_caught.total_caught, state.inventory[fishId])
    // ═══ حتى لو المستخدم باع كل سمكه، السجل ما ينقص ═══
    getRow: function (fishId) {
      var store = ensure();
      var caught = store[fishId] || { totalCaught: 0 };
      var inv = (typeof state !== 'undefined' && state && state.inventory) ? (state.inventory[fishId] || 0) : 0;
      return {
        fish_id: fishId,
        quantity: inv,
        total_caught: Math.max(caught.totalCaught || 0, inv)
      };
    },

    // ═══ true لو مصطاد مرة على الأقل ═══
    isDiscovered: function (fishId) {
      var store = ensure();
      var row = store[fishId];
      return !!(row && row.totalCaught > 0);
    },

    // ═══ عدد الأنواع المكتشفة ═══
    count: function () {
      var store = ensure();
      var n = 0;
      for (var k in store) {
        if (store.hasOwnProperty(k) && store[k].totalCaught > 0) n++;
      }
      return n;
    },

    // ═══ الرقم الكلي المصطاد من نوع معين ═══
    getTotal: function (fishId) {
      var store = ensure();
      return (store[fishId] && store[fishId].totalCaught) || 0;
    },

    // ═══ كل الصفوف (مفيد للسجل) ═══
    getAll: function () { return ensure(); }
  };

  // تضمين من أي مكان
  ensure();
})();
