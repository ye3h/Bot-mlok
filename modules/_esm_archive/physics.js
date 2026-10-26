'use strict';

import { clamp, $ } from './config.js';

export const P = {
  x: 0.5, y: 0.5,
  vx: 0, vy: 0,
  tx: 0.5, ty: 0.5,
  hasTarget: false,
  maxSpeed: 0.35,
  accel: 4,
  damping: 2.5,
  rot: 0,
  ready: false
};

let layout = null;
let currentTripState = null;
let onArriveHarbor = null;

export function initPhysics(layoutData, getTripState, arriveCallback) {
  layout = layoutData;
  currentTripState = getTripState;
  onArriveHarbor = arriveCallback;
}

export function applyBoatTransform() {
  const scene = $('scene');
  const boat = $('boat');
  if (!scene || !boat) return;

  boat.style.left = (P.x * scene.clientWidth) + 'px';
  boat.style.top = (P.y * scene.clientHeight) + 'px';
  boat.style.transform = 'translate(-50%,-50%) rotate(' + P.rot.toFixed(2) + 'deg)';
}

export function initBoatPosition() {
  P.x = layout.harbor.x;
  P.y = layout.harbor.y;
  P.tx = P.x;
  P.ty = P.y;
  P.vx = 0;
  P.vy = 0;
  P.hasTarget = false;
  P.ready = true;
  applyBoatTransform();
}

export function setTarget(nx, ny) {
  P.tx = clamp(nx, 0.05, 0.95);
  P.ty = clamp(ny, 0.12, 0.88);
  P.hasTarget = true;

  const t = $('target');
  const scene = $('scene');
  if (t && scene) {
    t.style.display = 'block';
    t.style.left = (P.tx * scene.clientWidth) + 'px';
    t.style.top = (P.ty * scene.clientHeight) + 'px';
  }
}

export function hideTarget() {
  const t = $('target');
  if (t) t.style.display = 'none';
}

export function updateBoatPhysics(dt, shipSpeed) {
  if (!P.ready) return;

  if (currentTripState() === 'returning') {
    const dh = Math.hypot(P.x - layout.harbor.x, P.y - layout.harbor.y);
    if (dh < 0.03 && Math.hypot(P.vx, P.vy) < 0.05) {
      P.hasTarget = false;
      hideTarget();
      if (onArriveHarbor) onArriveHarbor();
    }
  }

  const sp = shipSpeed;

  if (P.hasTarget) {
    const dx = P.tx - P.x;
    const dy = P.ty - P.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 0.01) {
      P.hasTarget = false;
      hideTarget();
    } else {
      const maxV = P.maxSpeed * sp * Math.min(1, dist * 6);
      const k = Math.min(1, P.accel * dt);
      P.vx += ((dx / dist) * maxV - P.vx) * k;
      P.vy += ((dy / dist) * maxV - P.vy) * k;
    }
  }

  if (!P.hasTarget) {
    const d = Math.exp(-P.damping * dt);
    P.vx *= d;
    P.vy *= d;
  }

  P.x += P.vx * dt;
  P.y += P.vy * dt;

  if (P.x < 0.05) { P.x = 0.05; P.vx = Math.abs(P.vx) * 0.5; }
  if (P.x > 0.95) { P.x = 0.95; P.vx = -Math.abs(P.vx) * 0.5; }
  if (P.y < 0.12) { P.y = 0.12; P.vy = Math.abs(P.vy) * 0.5; }
  if (P.y > 0.88) { P.y = 0.88; P.vy = -Math.abs(P.vy) * 0.5; }

  const rotTarget = clamp((P.vx / P.maxSpeed) * 15, -15, 15);
  P.rot += (rotTarget - P.rot) * Math.min(1, dt * 8);

  applyBoatTransform();
}

export function resetToHarbor() {
  P.x = layout.harbor.x;
  P.y = layout.harbor.y;
  P.tx = P.x;
  P.ty = P.y;
  P.vx = 0;
  P.vy = 0;
  P.hasTarget = false;
  applyBoatTransform();
}
