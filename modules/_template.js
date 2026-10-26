// modules/_template.js - قالب ميزة جديدة (ES5)
ModuleRegistry.register({
  id: 'my_feature',          // معرّف فريد
  name: 'ميزة جديدة',
  version: '1.0.0',
  dependencies: [],

  init: function (ctx) { this.ctx = ctx; },
  load: function (saved) { this.data = (saved && saved.my_feature) || {}; },
  save: function (st) { st.my_feature = this.data; },

  // هوكات اختيارية: onCatch, onTripEnd, onSale, onScreenOpen, tick ...
  onScreenOpen: function (ctx, name) {}
});
