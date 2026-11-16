import * as THREE from 'three';

// All textures are painted on canvases at load: no image files, no network.
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function texture(c, repeatX = 1, repeatY = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function noise(ctx, w, h, base, fleck, count, random) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < count; i++) {
    const g = random();
    ctx.fillStyle = fleck[Math.floor(g * fleck.length)];
    ctx.globalAlpha = 0.05 + random() * 0.12;
    const s = 2 + random() * 26;
    ctx.fillRect(random() * w, random() * h, s, s * (0.4 + random()));
  }
  ctx.globalAlpha = 1;
}

export function groundTexture(random) {
  const W = 2048;
  const H = 1564;
  const [c, ctx] = canvas(W, H);
  const px = (x) => ((x + 34) / 68) * W;
  const pz = (z) => ((z + 26) / 52) * H;
  const m = W / 68;
  noise(ctx, W, H, '#4b4841', ['#43403a', '#55524a', '#5e5a50', '#3a3833'], 5200, random);
  // Concrete block joints, staggered rows like a poured yard.
  ctx.strokeStyle = 'rgba(22,20,18,0.55)';
  ctx.lineWidth = 3;
  for (let z = -25; z < 26; z += 1) { ctx.beginPath(); ctx.moveTo(0, pz(z)); ctx.lineTo(W, pz(z)); ctx.stroke(); }
  for (let j = 0; j < 52; j++) for (let x = -34 - (j % 2); x <= 34; x += 2) { ctx.beginPath(); ctx.moveTo(px(x), pz(j - 26)); ctx.lineTo(px(x), pz(j - 25)); ctx.stroke(); }
  // Faded painted patches where the yard was resurfaced.
  ctx.fillStyle = '#57544c';
  ctx.globalAlpha = 0.5;
  ctx.fillRect(px(-34), pz(-26), 22 * m, 18 * m);
  ctx.fillRect(px(6), pz(4), 18 * m, 16 * m);
  ctx.globalAlpha = 1;
  // Oil stains.
  for (let i = 0; i < 26; i++) {
    const x = random() * W;
    const y = random() * H;
    const r = 20 + random() * 70;
    const grad = ctx.createRadialGradient(x, y, 2, x, y, r);
    grad.addColorStop(0, 'rgba(12,12,14,0.5)');
    grad.addColorStop(1, 'rgba(12,12,14,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
  // Rail spur along the south edge: two steel rails, wooden sleepers.
  ctx.fillStyle = '#2c2118';
  ctx.fillRect(px(-34), pz(21.6), 68 * m, 2.6 * m);
  for (let z = 21.9; z < 24; z += 1.1) ctx.fillRect(px(-34), pz(z), 68 * m, 0.28 * m);
  ctx.fillStyle = '#8f9296';
  ctx.fillRect(px(-34), pz(22.05), 68 * m, 0.09 * m);
  ctx.fillRect(px(-34), pz(23.35), 68 * m, 0.09 * m);
  // Yellow lane dashes down the three main lanes.
  ctx.fillStyle = 'rgba(232,161,58,0.55)';
  for (const x of [-10, 0, 12]) {
    for (let z = -24; z < 24; z += 4) ctx.fillRect(px(x - 0.12), pz(z), 0.24 * m, 2 * m);
  }
  // Site circles with letters, painted on the asphalt.
  const site = (x, z, colour, letter) => {
    ctx.strokeStyle = colour;
    ctx.lineWidth = 0.35 * m;
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(px(x), pz(z), 5.2 * m, 0, 7); ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 0.14 * m;
    ctx.beginPath(); ctx.arc(px(x), pz(z), 4.4 * m, 0, 7); ctx.stroke();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = colour;
    ctx.font = `700 ${3.4 * m}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, px(x), pz(z) + 0.1 * m);
    ctx.globalAlpha = 1;
  };
  site(-20, -14, '#c65a2e', 'A');
  site(20, 15, '#2e7f86', 'B');
  // Bay numbers stencilled by the container rows.
  ctx.fillStyle = 'rgba(230,225,210,0.22)';
  ctx.font = `700 ${1.6 * m}px ui-monospace, monospace`;
  ctx.fillText('BAY 04', px(-28), pz(-6));
  ctx.fillText('BAY 07', px(14), pz(-20));
  return texture(c);
}

export function sidingTexture(random, base = '#6d7276', rib = '#5b6064') {
  const [c, ctx] = canvas(256, 256);
  noise(ctx, 256, 256, base, [rib, '#7a7f83', '#54575a'], 500, random);
  ctx.fillStyle = rib;
  for (let x = 0; x < 256; x += 32) ctx.fillRect(x, 0, 5, 256);
  ctx.fillStyle = 'rgba(30,26,22,0.35)';
  ctx.fillRect(0, 216, 256, 40);
  return texture(c, 2, 1);
}

export function concreteTexture(random) {
  const [c, ctx] = canvas(256, 256);
  noise(ctx, 256, 256, '#8d8578', ['#7c766a', '#9c9587', '#6e685c'], 900, random);
  ctx.strokeStyle = 'rgba(40,38,34,0.25)';
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    const x = random() * 256;
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (random() * 30 - 15), 256);
    ctx.stroke();
  }
  return texture(c, 2, 2);
}

export function crateTexture(random) {
  const [c, ctx] = canvas(128, 128);
  noise(ctx, 128, 128, '#9a7d4f', ['#8a6f42', '#a98c58', '#77592f'], 260, random);
  ctx.strokeStyle = '#5e472a';
  ctx.lineWidth = 9;
  ctx.strokeRect(4, 4, 120, 120);
  ctx.beginPath(); ctx.moveTo(4, 4); ctx.lineTo(124, 124); ctx.moveTo(124, 4); ctx.lineTo(4, 124); ctx.stroke();
  return texture(c);
}

export function containerTexture(random, base, dark) {
  const [c, ctx] = canvas(256, 128);
  noise(ctx, 256, 128, base, [dark, '#00000022'], 300, random);
  ctx.fillStyle = dark;
  for (let x = 6; x < 256; x += 22) ctx.fillRect(x, 0, 8, 128);
  ctx.fillStyle = 'rgba(20,16,12,0.4)';
  ctx.fillRect(0, 104, 256, 24);
  ctx.fillStyle = 'rgba(240,235,220,0.5)';
  ctx.font = '700 34px ui-monospace, monospace';
  ctx.fillText('DL-' + Math.floor(100 + random() * 899), 26, 52);
  return texture(c);
}

export function glowTexture() {
  const [c, ctx] = canvas(128, 128);
  const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.5)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
