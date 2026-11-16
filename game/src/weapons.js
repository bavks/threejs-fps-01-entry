import * as THREE from 'three';
import { PALETTE } from './palette.js';

// DOCKLIGHT armoury: nine guns, all original names. Rifles win mid-range,
// the sniper one-taps, the LMG sprays, the shotgun owns corners.
export const WEAPONS = {
  kestrel: { name: 'P9 Kestrel', slot: 'sidearm', price: 0, blurb: 'Standard sidearm.', damage: 34, headMult: 4, rpm: 380, auto: false,
    mag: 12, reserve: 96, reload: 1.5, spread: 0.35, spreadMove: 2.4, spreadAir: 5.5, bloom: 0.3, recoil: 0.5, range: 20, minFactor: 0.45, pellets: 1, speed: 5.0 },
  rook: { name: 'R6 Rook', slot: 'sidearm', price: 700, blurb: 'Six heavy rounds.', damage: 62, headMult: 3, rpm: 150, auto: false,
    mag: 6, reserve: 36, reload: 2.6, spread: 0.5, spreadMove: 2.0, spreadAir: 5, bloom: 0.5, recoil: 1.9, range: 24, minFactor: 0.6, pellets: 1, speed: 5.0 },
  mastiff: { name: 'SG-7 Mastiff', slot: 'primary', price: 1100, blurb: 'Eight pellets.', damage: 11, headMult: 2.4, rpm: 68, auto: false,
    mag: 6, reserve: 32, reload: 2.9, spread: 3.4, spreadMove: 1.2, spreadAir: 3, bloom: 0, recoil: 2.6, range: 9, minFactor: 0.2, pellets: 8, speed: 4.8 },
  adder: { name: 'SMG-9 Adder', slot: 'primary', price: 1250, blurb: 'Fast and light.', damage: 26, headMult: 4, rpm: 820, auto: true,
    mag: 32, reserve: 128, reload: 2.1, spread: 0.85, spreadMove: 1.1, spreadAir: 4, bloom: 0.16, recoil: 0.34, range: 16, minFactor: 0.5, pellets: 1, speed: 5.1 },
  osprey: { name: 'BR-4 Osprey', slot: 'primary', price: 2300, blurb: 'Three-round bursts.', damage: 34, headMult: 4, rpm: 780, auto: false, burst: 3,
    mag: 30, reserve: 120, reload: 2.5, spread: 0.48, spreadMove: 2.2, spreadAir: 5.5, bloom: 0.14, recoil: 0.52, range: 25, minFactor: 0.55, pellets: 1, speed: 4.9 },
  falcon: { name: 'AR-5 Falcon', slot: 'primary', price: 2700, blurb: 'Red-dot sight fitted.', damage: 36, headMult: 4, rpm: 660, auto: true,
    mag: 30, reserve: 120, reload: 2.4, spread: 0.42, spreadMove: 2.6, spreadAir: 6, bloom: 0.22, recoil: 0.46, range: 26, minFactor: 0.55, pellets: 1, speed: 4.9, zooms: [1.35], optic: 'dot' },
  egret: { name: 'DMR-6 Egret', slot: 'primary', price: 3100, blurb: '2.5x optic marksman rifle.', damage: 58, headMult: 3, rpm: 235, auto: false,
    mag: 12, reserve: 60, reload: 2.8, spread: 0.1, spreadMove: 3.4, spreadAir: 7, bloom: 0.4, recoil: 1.7, range: 46, minFactor: 0.78, pellets: 1, speed: 4.7, zooms: [2.5], optic: 'scope' },
  bison: { name: 'MG-8 Bison', slot: 'primary', price: 3400, blurb: 'Belt-fed LMG. Brace to aim.', damage: 30, headMult: 4, rpm: 720, auto: true, heavy: true,
    mag: 100, reserve: 200, reload: 5.4, spread: 1.15, spreadMove: 3.6, spreadAir: 6.5, bloom: 0.3, recoil: 0.52, range: 24, minFactor: 0.5, pellets: 1, speed: 4.45 },
  pike: { name: 'SR-7 Pike', slot: 'primary', price: 3500, blurb: 'Bolt-action one-shot kills.', damage: 108, headMult: 2, rpm: 42, auto: false,
    mag: 5, reserve: 30, reload: 3.1, spread: 0.06, spreadMove: 4.5, spreadAir: 8, bloom: 0, recoil: 3.2, range: 60, minFactor: 0.85, pellets: 1, speed: 4.6, zooms: [2.5, 5], optic: 'scope' },
};
export const GRENADES = {
  he: { name: 'Frag Charge', price: 300, key: 'he', blurb: 'High explosive.' },
  flash: { name: 'Blind Charge', price: 200, key: 'flash', blurb: 'Blinds onlookers.' },
};
export const ARMOR = [
  { name: 'No armour', price: 0, factor: 1, headMultCap: 4, blurb: '' },
  { name: 'Kevlar Vest', price: 650, factor: 0.55, headMultCap: 4, blurb: 'Cuts damage taken by 45%.' },
  { name: 'Vest + Helmet', price: 1000, factor: 0.55, headMultCap: 2.2, blurb: 'Caps headshot multipliers.' },
];

export function createLoadout() {
  return {
    primary: null,
    sidearm: { id: 'kestrel', mag: WEAPONS.kestrel.mag, reserve: WEAPONS.kestrel.reserve },
    current: 'sidearm',
    he: 0,
    flash: 0,
    armor: 0,
  };
}

export function currentGun(loadout) {
  const held = loadout.current === 'primary' && loadout.primary ? loadout.primary : loadout.sidearm;
  return { held, def: WEAPONS[held.id] };
}

export function damageAt(def, dist, part, armorTier) {
  let dmg = def.damage;
  if (dist > def.range) {
    const over = Math.min(1, (dist - def.range) / def.range);
    dmg *= 1 - over * (1 - def.minFactor);
  }
  if (part === 'head') dmg *= Math.min(def.headMult, ARMOR[armorTier].headMultCap);
  return dmg * ARMOR[armorTier].factor;
}

export function currentZoom(actor, def) {
  if (!def.zooms) return 1;
  return def.zooms[Math.min(actor.zoomIdx || 0, def.zooms.length - 1)];
}

export function spreadRadians(def, speedRatio, airborne, crouched, scoped, bloomDeg) {
  let deg = def.spread + bloomDeg;
  if (def.zooms && def.zooms[def.zooms.length - 1] >= 2 && !scoped) deg = Math.max(deg, 2.4);
  deg += def.spreadMove * speedRatio;
  if (airborne) deg += def.spreadAir;
  if (crouched) deg *= 0.7;
  return (deg * Math.PI) / 180;
}

// ---- Viewmodel gun shapes: one part list per gun ----
// Part: [shape, r, len, mat, x, y, z, rx, sx, sy]
const gunMats = {
  B: new THREE.MeshStandardMaterial({ color: 0x2c2f33, roughness: 0.45, metalness: 0.7 }),
  K: new THREE.MeshStandardMaterial({ color: 0x17181a, roughness: 0.35, metalness: 0.8 }),
  W: new THREE.MeshStandardMaterial({ color: 0x4a3826, roughness: 0.9 }),
  A: new THREE.MeshStandardMaterial({ color: PALETTE.hazard, roughness: 0.6 }),
};
const SHAPE = {
  rod: (r, l) => new THREE.CapsuleGeometry(r, Math.max(0.01, l - 2 * r), 4, 16).rotateX(Math.PI / 2),
  tube: (r, l) => new THREE.CylinderGeometry(r, r, l, 20).rotateX(Math.PI / 2),
  drop: (r, l) => new THREE.CapsuleGeometry(r, Math.max(0.01, l - 2 * r), 4, 16),
  pin: (r, l) => new THREE.CylinderGeometry(r, r, l, 12),
  ring: (r, t) => new THREE.TorusGeometry(r, t, 10, 28),
  ball: (r) => new THREE.SphereGeometry(r, 16, 12),
};
const GUN_PARTS = {
  kestrel: [['rod', 0.035, 0.21, 'B', 0, 0, 0, 0, 0.64], ['tube', 0.015, 0.07, 'K', 0, 0.028, -0.13], ['drop', 0.025, 0.1, 'W', 0, -0.075, 0.055, 0.25, 0.8], ['ball', 0.009, 0, 'A', 0, 0.045, -0.05]],
  rook: [['rod', 0.03, 0.3, 'B', 0, 0.01, -0.02, 0, 0.83], ['tube', 0.016, 0.16, 'K', 0, 0.02, -0.24], ['tube', 0.011, 0.14, 'K', 0, -0.004, -0.235], ['tube', 0.0295, 0.075, 'B', 0, -0.03, 0], ['drop', 0.026, 0.105, 'W', 0, -0.085, 0.06, 0.3, 0.8], ['ball', 0.009, 0, 'A', 0, 0.048, -0.13]],
  mastiff: [['rod', 0.04, 0.4, 'B', 0, 0, -0.05, 0, 0.75], ['tube', 0.0175, 0.34, 'K', 0, 0.015, -0.38], ['tube', 0.013, 0.3, 'K', 0, -0.024, -0.36], ['tube', 0.027, 0.14, 'W', 0, 0.012, -0.22], ['rod', 0.045, 0.18, 'W', 0, -0.02, 0.24, 0, 0.61]],
  adder: [['rod', 0.045, 0.34, 'B', 0, 0, -0.02, 0, 0.61], ['tube', 0.015, 0.16, 'K', 0, 0.01, -0.26], ['tube', 0.021, 0.05, 'K', 0, 0.01, -0.325], ['drop', 0.025, 0.13, 'B', 0, -0.09, -0.02, 0, 0.7], ['drop', 0.024, 0.09, 'W', 0, -0.07, 0.1, 0.25, 0.83], ['rod', 0.0125, 0.1, 'A', 0, 0.058, -0.1, 0, 0.8]],
  osprey: [['rod', 0.0425, 0.44, 'B', 0, 0, -0.03, 0, 0.66], ['tube', 0.03, 0.2, 'W', 0, 0.005, -0.3], ['tube', 0.013, 0.1, 'K', 0, 0.012, -0.42], ['rod', 0.014, 0.3, 'B', 0, 0.068, -0.02], ['drop', 0.027, 0.13, 'B', 0, -0.095, -0.01, 0, 0.67], ['drop', 0.024, 0.09, 'W', 0, -0.07, 0.11, 0.25, 0.83], ['rod', 0.035, 0.13, 'B', 0, -0.01, 0.26, 0, 0.71]],
  egret: [['rod', 0.035, 0.52, 'B', 0, 0, -0.06, 0, 0.71], ['tube', 0.012, 0.4, 'K', 0, 0.012, -0.5], ['tube', 0.023, 0.2, 'B', 0, 0.072, -0.1], ['tube', 0.029, 0.035, 'K', 0, 0.072, -0.19], ['tube', 0.026, 0.03, 'K', 0, 0.072, -0.015], ['ring', 0.024, 0.0035, 'K', 0, 0.072, -0.205], ['drop', 0.025, 0.11, 'B', 0, -0.085, -0.06, 0, 0.68], ['drop', 0.024, 0.09, 'W', 0, -0.07, 0.1, 0.25, 0.83], ['rod', 0.0375, 0.2, 'W', 0, -0.01, 0.3, 0, 0.72], ['pin', 0.006, 0.07, 'K', 0, -0.055, -0.44]],
  bison: [['rod', 0.05, 0.46, 'B', 0, 0, -0.04, 0, 0.75], ['tube', 0.017, 0.32, 'K', 0, 0.015, -0.42], ['tube', 0.027, 0.18, 'K', 0, 0.015, -0.36], ['rod', 0.055, 0.16, 'B', 0, -0.115, -0.05, 0, 0.82], ['rod', 0.015, 0.3, 'B', 0, 0.075, -0.02], ['drop', 0.025, 0.095, 'W', 0, -0.07, 0.13, 0.25, 0.84], ['rod', 0.0375, 0.15, 'B', 0, -0.01, 0.27, 0, 0.75], ['ball', 0.01, 0, 'A', 0, 0.048, -0.56]],
  pike: [['rod', 0.035, 0.5, 'B', 0, 0, -0.05, 0, 0.71], ['tube', 0.0125, 0.44, 'K', 0, 0.01, -0.48], ['tube', 0.018, 0.06, 'K', 0, 0.01, -0.67], ['tube', 0.026, 0.24, 'B', 0, 0.078, -0.08], ['tube', 0.031, 0.035, 'K', 0, 0.078, -0.21], ['tube', 0.028, 0.03, 'K', 0, 0.078, 0.025], ['ring', 0.027, 0.004, 'K', 0, 0.078, -0.226], ['ball', 0.011, 0, 'K', 0.042, 0, 0.05], ['rod', 0.04, 0.22, 'W', 0, -0.02, 0.3, 0, 0.69], ['drop', 0.025, 0.1, 'B', 0, -0.08, -0.05, 0, 0.7]],
  falcon: [['rod', 0.0425, 0.42, 'B', 0, 0, -0.03, 0, 0.65], ['tube', 0.027, 0.15, 'W', 0, 0.008, -0.27], ['tube', 0.014, 0.2, 'K', 0, 0.012, -0.33], ['tube', 0.017, 0.05, 'K', 0, 0.012, -0.415], ['drop', 0.0275, 0.14, 'B', 0, -0.095, 0, -0.12, 0.64], ['drop', 0.024, 0.09, 'W', 0, -0.07, 0.12, 0.25, 0.83], ['rod', 0.035, 0.14, 'B', 0, -0.01, 0.27, 0, 0.71], ['pin', 0.005, 0.028, 'B', 0, 0.052, -0.04], ['ring', 0.02, 0.005, 'B', 0, 0.072, -0.04], ['ball', 0.005, 0, 'A', 0, 0.072, -0.04]],
};

export function buildGunModel(id) {
  const g = new THREE.Group();
  for (const [shape, r, len, mat, x, y, z, rx = 0, sx = 1, sy = 1] of GUN_PARTS[id] || GUN_PARTS.falcon) {
    const m = new THREE.Mesh(SHAPE[shape](r, len), gunMats[mat]);
    m.position.set(x, y, z);
    m.rotation.x = rx;
    m.scale.set(sx, sy, 1);
    g.add(m);
  }
  return g;
}
