# مملكة القراصنة - MODULES.md

نظام الوحدات

## 1. الفكرة
- index.html فيه ModuleRegistry في آخره
- كل وحدة في modules/ تسجل نفسها
- الملف الأساسي ينادي على hooks

## 2. تفعيل وحدة
1. انسخ modules/_template.js
2. عدل id و name
3. أضف الاسم في MODULE_LIST داخل index.html
4. أعد تحميل الصفحة

## 3. القالب
ModuleRegistry.register({
  id: 'example',
  name: 'مثال',
  version: '1.0.0',
  dependencies: [],
  init: function(ctx) { this.ctx = ctx; },
  save: function(state) { state.example = {}; },
  load: function(saved) { this.data = saved.example || {}; }
});

## 4. السياق ctx
- state, get, set, save
- ui: toast, confirm, showScreen, closeScreen, beep, fly
- assets: src, image
- helpers: el, format, random, clamp, now
- modules: get, all

## 5. نقاط التمدد
init, load, save
onGameStart, onTripStart, onTripEnd, onCatch
onSale, onLevelUp, onDaily, onScreenOpen, tick
renderScreen, renderBottomNav

## 6. قواعد
- ES5 فقط
- كل صورة لها fallback
- id فريد
- لا تعدل index.html إلا MODULE_LIST

الاصدار: 2.0.0
التاريخ: 2026-10-08
المالك: SIGMA k143