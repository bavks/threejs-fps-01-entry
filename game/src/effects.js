import * as THREE from 'three';
import { moveBody } from './physics.js';

const P_MAX = 128, T_MAX = 24;

export function createEffects(scene, glowTex) {
  const parts = [];
  for (let i = 0; i < P_MAX; i++) {
    const m = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0 });
    const s = new THREE.Sprite(m);
    s.visible = false;
    scene.add(s);
    parts.push({ s, life: 0, max: 1, op: 1, vx: 0, vy: 0, vz: 0, grav: 0, s0: 1, s1: 1 });
  }
  let pNext = 0;
  function spawn(x, y, z, o) {
    const p = parts[pNext];
    pNext = (pNext + 1) % P_MAX;
    p.s.position.set(x, y, z);
    p.s.material.color.set(o.color ?? 0xffffff);
    p.s.material.rotation = Math.random() * Math.PI * 2;
    p.life = p.max = o.life;
    p.op = o.opacity ?? 1;
    p.vx = o.vx || 0; p.vy = o.vy || 0; p.vz = o.vz || 0;
    p.grav = o.grav || 0;
    p.s0 = o.size; p.s1 = o.size * (o.grow || 1);
    p.s.scale.setScalar(o.size);
    p.s.material.opacity = p.op;
    p.s.visible = true;
  }
  function burst(x, y, z, n, col, size, life, speed, grav, grow, op) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.35) * Math.PI;
      const v = speed * (0.4 + Math.random() * 0.8);
      spawn(x, y, z, {
        color: col, size: size * (0.7 + Math.random() * 0.6), life: life * (0.6 + Math.random() * 0.8),
        vx: Math.cos(a) * Math.cos(e) * v, vy: Math.sin(e) * v, vz: Math.sin(a) * Math.cos(e) * v,
        grav, grow, opacity: op,
      });
    }
  }

  const tracers = [];
  for (let i = 0; i < T_MAX; i++) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0 }));
    l.visible = false;
    l.frustumCulled = false;
    scene.add(l);
    tracers.push({ l, life: 0, max: 0.09 });
  }
  let tNext = 0;

  const flashMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xffd27a, transparent: true, depthWrite: false, opacity: 0 });
  const flash = new THREE.Sprite(flashMat);
  flash.visible = false;
  scene.add(flash);
  let flashLife = 0, flashMax = 1;
  function popFlash(x, y, z, scale, life, col) {
    flash.position.set(x, y, z);
    flash.scale.setScalar(scale);
    flashMat.color.set(col);
    flashMat.opacity = 1;
    flash.visible = true;
    flashLife = flashMax = life;
  }

  const nades = [];
  const nadeGeo = new THREE.SphereGeometry(0.12, 10, 8);
  const nadeHE = new THREE.MeshStandardMaterial({ color: 0x2e4a2a, roughness: 0.6, metalness: 0.4 });
  const nadeFL = new THREE.MeshStandardMaterial({ color: 0xb8b8b8, roughness: 0.35, metalness: 0.8 });

  function detonate(g, onGrenade) {
    scene.remove(g.mesh);
    const i = nades.indexOf(g);
    if (i >= 0) nades.splice(i, 1);
    if (onGrenade) onGrenade({ kind: g.kind, body: g.body, owner: g.owner });
  }

  return {
    tracer(x0, y0, z0, x1, y1, z1) {
      const t = tracers[tNext];
      tNext = (tNext + 1) % T_MAX;
      const p = t.l.geometry.attributes.position.array;
      p[0] = x0; p[1] = y0; p[2] = z0; p[3] = x1; p[4] = y1; p[5] = z1;
      t.l.geometry.attributes.position.needsUpdate = true;
      t.life = t.max;
      t.l.material.opacity = 0.9;
      t.l.visible = true;
    },
    muzzle(x, y, z, big, dx = 0, dy = 0, dz = -1) {
      popFlash(x + dx * 0.4, y + dy * 0.4, z + dz * 0.4, big ? 2.2 : 1.1, 0.06, 0xffd27a);
      spawn(x, y, z, { color: 0xffc46b, size: 0.35, life: 0.12, vx: dx * 6, vy: dy * 6 + 1, vz: dz * 6 });
      spawn(x, y, z, { color: 0xffe9a8, size: 0.22, life: 0.09, vx: dx * 9, vy: dy * 9, vz: dz * 9 });
    },
    smoke(x, y, z, dx, dy, dz, big) {
      const n = big ? 6 : 4;
      for (let i = 0; i < n; i++) {
        spawn(x, y, z, {
          color: 0x9a9a9a, size: big ? 1.5 : 0.9, life: 0.9 + Math.random() * 0.5,
          vx: dx * 1.2 + (Math.random() - 0.5) * 1.4, vy: dy * 1.2 + Math.random() * 0.8 + 0.3, vz: dz * 1.2 + (Math.random() - 0.5) * 1.4,
          grav: -0.4, grow: 2.2, opacity: 0.55,
        });
      }
    },
    impact(x, y, z, kind) {
      if (kind === 'blood') burst(x, y, z, 8, 0xb02020, 0.28, 0.4, 2, 6, 1, 0.9);
      else if (kind === 'spark') burst(x, y, z, 10, 0xffa030, 0.16, 0.3, 6, 9, 1, 1);
      else burst(x, y, z, 6, 0xc2a878, 0.8, 0.7, 1.2, -0.2, 1.8, 0.5);
    },
    explosion(x, y, z) {
      popFlash(x, y + 0.4, z, 7, 0.22, 0xffe0a0);
      burst(x, y + 0.3, z, 22, 0xff7a20, 0.3, 0.7, 7, 8, 1, 1);
      burst(x, y + 0.3, z, 8, 0xffc040, 0.22, 0.5, 9, 8, 1, 1);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        spawn(x + Math.cos(a) * 0.8, y + 0.4, z + Math.sin(a) * 0.8, {
          color: 0x8a8a8a, size: 1.4, life: 1.2, vx: Math.cos(a) * 2.5, vy: 0.6, vz: Math.sin(a) * 2.5, grav: -0.3, grow: 2, opacity: 0.6,
        });
      }
    },
    throwGrenade(kind, x, y, z, vx, vy, vz, owner) {
      const mesh = new THREE.Mesh(nadeGeo, kind === 'flash' ? nadeFL : nadeHE);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      nades.push({
        kind, owner, mesh, fuse: 1.6,
        body: { pos: { x, y, z }, vel: { x: vx, y: vy, z: vz }, radius: 0.12 },
      });
    },
    update(dt, colliders, onGrenade) {
      for (const p of parts) {
        if (!p.s.visible) continue;
        p.life -= dt;
        if (p.life <= 0) { p.s.visible = false; continue; }
        p.vy -= p.grav * dt;
        p.s.position.x += p.vx * dt;
        p.s.position.y += p.vy * dt;
        p.s.position.z += p.vz * dt;
        const k = 1 - p.life / p.max;
        p.s.scale.setScalar(p.s0 + (p.s1 - p.s0) * k);
        p.s.material.opacity = p.op * (p.life / p.max);
      }
      for (const t of tracers) {
        if (!t.l.visible) continue;
        t.life -= dt;
        if (t.life <= 0) { t.l.visible = false; continue; }
        t.l.material.opacity = 0.9 * (t.life / t.max);
      }
      if (flash.visible) {
        flashLife -= dt;
        if (flashLife <= 0) flash.visible = false;
        else flashMat.opacity = flashLife / flashMax;
      }
      for (let i = nades.length - 1; i >= 0; i--) {
        const g = nades[i];
        const prevVy = g.body.vel.y;
        if (colliders) moveBody(g.body, colliders, dt);
        g.mesh.position.set(g.body.pos.x, g.body.pos.y, g.body.pos.z);
        const hit = prevVy < -2 && Math.abs(g.body.vel.y) < Math.abs(prevVy) * 0.5;
        g.fuse -= dt;
        if (g.fuse <= 0 || (g.kind === 'flash' && hit && prevVy < -4)) detonate(g, onGrenade);
      }
    },
  };
}

export function createBombProp(scene) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.22, 0.38),
    new THREE.MeshStandardMaterial({ color: 0x1c1e20, roughness: 0.5, metalness: 0.6 })
  );
  body.position.y = 0.11;
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xff2a1a })
  );
  lamp.position.set(0.18, 0.26, 0);
  g.add(body, lamp);
  g.visible = false;
  scene.add(g);
  return {
    show(x, z) { g.position.set(x, 0, z); g.visible = true; },
    hide() { g.visible = false; },
    blink(t, urgent) { lamp.visible = Math.sin(t * (urgent ? 16 : 5)) > -0.2; },
  };
}
