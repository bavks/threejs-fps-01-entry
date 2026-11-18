import * as THREE from 'three';

function cv() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  return c;
}
function fin(c) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function R(r, a, b) { return a + r() * (b - a); }
function dots(x, r, n, cols, lo, hi, s0, s1) {
  for (let i = 0; i < n; i++) {
    x.fillStyle = cols[(r() * cols.length) | 0];
    x.globalAlpha = R(r, lo, hi);
    const s = R(r, s0, s1);
    x.fillRect(r() * 256, r() * 256, s, s);
  }
  x.globalAlpha = 1;
}
function crack(x, r, n, seg, spread, col) {
  x.strokeStyle = col;
  x.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    let px = r() * 256, py = r() * 256;
    x.beginPath();
    x.moveTo(px, py);
    for (let j = 0; j < seg; j++) { px += R(r, -spread, spread); py += R(r, -spread, spread); x.lineTo(px, py); }
    x.stroke();
  }
}

export function groundTexture(random) {
  const c = cv(), x = c.getContext('2d'), r = random;
  x.fillStyle = '#83868a';
  x.fillRect(0, 0, 256, 256);
  for (let b = 0; b < 16; b++) {
    const bx = (b % 4) * 64, by = ((b / 4) | 0) * 64;
    x.fillStyle = `rgba(${118 + r() * 42 | 0},${120 + r() * 42 | 0},${124 + r() * 42 | 0},0.55)`;
    x.fillRect(bx + 2, by + 2, 60, 60);
  }
  x.strokeStyle = '#4a4d51';
  x.lineWidth = 3;
  for (let i = 0; i <= 4; i++) {
    x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, 256); x.stroke();
    x.beginPath(); x.moveTo(0, i * 64); x.lineTo(256, i * 64); x.stroke();
  }
  dots(x, r, 700, ['#6f7276', '#9a9da0', '#5b5e62'], 0.15, 0.5, 1, 3);
  crack(x, r, 5, 5, 24, 'rgba(58,60,64,0.7)');
  return fin(c);
}

export function sidingTexture(random, base = '#6d7276', rib = '#5b6064') {
  const c = cv(), x = c.getContext('2d'), r = random;
  x.fillStyle = base;
  x.fillRect(0, 0, 256, 256);
  for (let px = 0; px < 256; px += 16) {
    x.fillStyle = rib;
    x.fillRect(px, 0, 5, 256);
    x.fillStyle = 'rgba(255,255,255,0.10)';
    x.fillRect(px + 5, 0, 2, 256);
    x.fillStyle = 'rgba(0,0,0,0.18)';
    x.fillRect(px + 11, 0, 5, 256);
  }
  dots(x, r, 260, ['#000000', '#ffffff'], 0.04, 0.12, 1, 2);
  x.fillStyle = 'rgba(0,0,0,0.15)';
  x.fillRect(0, 124, 256, 4);
  return fin(c);
}

export function concreteTexture(random) {
  const c = cv(), x = c.getContext('2d'), r = random;
  x.fillStyle = '#939694';
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 34; i++) {
    x.fillStyle = `rgba(${110 + r() * 50 | 0},${112 + r() * 50 | 0},${108 + r() * 50 | 0},0.25)`;
    x.beginPath();
    x.ellipse(r() * 256, r() * 256, R(r, 12, 46), R(r, 8, 30), r() * 3, 0, 7);
    x.fill();
  }
  dots(x, r, 900, ['#7d807d', '#a9aca9', '#6a6d6a'], 0.1, 0.35, 1, 2);
  crack(x, r, 6, 4, 30, 'rgba(70,72,70,0.6)');
  return fin(c);
}

export function crateTexture(random) {
  const c = cv(), x = c.getContext('2d'), r = random;
  x.fillStyle = '#8a6a42';
  x.fillRect(0, 0, 256, 256);
  for (let p = 0; p < 4; p++) {
    const y = p * 64, sh = (r() * 24 - 12) | 0;
    x.fillStyle = `rgb(${138 + sh},${106 + sh},${66 + sh})`;
    x.fillRect(0, y + 2, 256, 60);
    x.strokeStyle = 'rgba(60,40,18,0.55)';
    x.lineWidth = 1;
    for (let g = 0; g < 5; g++) {
      const gy = y + 8 + g * 11;
      x.beginPath();
      x.moveTo(0, gy);
      for (let px = 0; px <= 256; px += 32) x.lineTo(px, gy + Math.sin(px * 0.05 + g) * 2);
      x.stroke();
    }
    x.fillStyle = '#3d2c16';
    x.beginPath(); x.arc(14, y + 32, 4, 0, 7); x.fill();
    x.beginPath(); x.arc(242, y + 32, 4, 0, 7); x.fill();
    x.fillStyle = 'rgba(40,26,12,0.8)';
    x.fillRect(0, y, 256, 2);
  }
  return fin(c);
}

export function containerTexture(random, base = '#a85a30', dark = '#4a2c14') {
  const c = cv(), x = c.getContext('2d'), r = random;
  x.fillStyle = base;
  x.fillRect(0, 0, 256, 256);
  for (let py = 0; py < 256; py += 32) {
    x.fillStyle = 'rgba(0,0,0,0.22)';
    x.fillRect(0, py, 256, 7);
    x.fillStyle = 'rgba(255,255,255,0.09)';
    x.fillRect(0, py + 7, 256, 3);
  }
  for (let i = 0; i < 14; i++) {
    const sx = r() * 256;
    x.fillStyle = `rgba(${120 + r() * 40 | 0},${52 + r() * 20 | 0},18,${R(r, 0.12, 0.4)})`;
    x.fillRect(sx, R(r, 0, 120), R(r, 3, 9), R(r, 30, 130));
  }
  dots(x, r, 300, ['#000000', '#ffffff'], 0.05, 0.14, 1, 2);
  x.fillStyle = dark;
  x.fillRect(0, 216, 256, 40);
  x.fillStyle = 'rgba(255,255,255,0.12)';
  x.fillRect(0, 216, 256, 2);
  return fin(c);
}

export function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 2, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return fin(c);
}
