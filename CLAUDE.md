# مملكة القراصنة - CLAUDE.md

بروتوكول التطوير

## 1. الملف الأساسي
- index.html يستخدم ES6، لا تعيد كتابته.
- التعديل الوحيد المسموح: سطر MODULE_LIST.

## 2. الوحدات
- كل وحدة في modules/اسم.js
- ES5 فقط: var, function, string concatenation
- كل صورة لها fallback عبر ctx.assets.image
- الحفظ معزول تحت state.<id>

## 3. السياق ctx
- ctx.state, ctx.get, ctx.set, ctx.save
- ctx.ui.toast, confirm, showScreen, closeScreen, beep, fly
- ctx.assets.src, image
- ctx.helpers.el, format, random, clamp, now
- ctx.modules.get, all

## 4. نقاط التمدد
init, load, save
onGameStart, onTripStart, onTripEnd, onCatch
onSale, onLevelUp, onDaily, onScreenOpen, tick
renderScreen, renderBottomNav

## 5. القاعدة
لا تعدل index.html إلا سطر MODULE_LIST.

الاصدار: 1.1.0
التاريخ: 2026-10-08
المالك: SIGMA k143