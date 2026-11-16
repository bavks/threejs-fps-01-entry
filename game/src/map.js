import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { makeBox } from './physics.js';
import { groundTexture, sidingTexture, concreteTexture, crateTexture, containerTexture } from './textures.js';

// DOCKLIGHT map: a container port at dusk, 68 x 52 m. Site A "Crane Bay" sits
// under the gantry crane in the north-west; site B "Stack Yard" among the
// container stacks in the south-east. Three lanes link the spawns: west quay,
// the warehouse doors in the middle, and the east rail corridor.
export const SITES = [
  { id: 'A', name: 'Crane Bay', x: -20, z: -14, r: 5.2 },
  { id: 'B', name: 'Stack Yard', x: 20, z: 15, r: 5.2 },
];

export const SPAWNS = [
  [[-28, 21], [-24, 21], [-26, 18.5], [-29, 18], [-23, 18.5]],
  [[28, -21], [24, -21], [26, -18.5], [29, -18], [23, -18.5]],
];

const NODES = [
  [-27, 20], [-28, 9], [-28, -3], [-21, -8], [-20, -14], [-11, -14], [-17, -21],
  [-10, -11], [0, -17], [0, -8], [-9, 0], [0, 1], [9, 0], [0, 9], [12, 6], [16, 11],
  [20, 15], [31, 9], [31, -4], [26, -20], [-9, -21], [-15, -4], [14, -3], [6, -10],
  [-15, 10], [25, 23], [-25, -12], [26, 12], [-16, -14],
];
const EDGES = [
  [0, 1], [0, 24], [1, 2], [1, 24], [2, 3], [2, 21], [3, 4], [3, 7], [3, 21], [4, 6],
  [4, 26], [4, 28], [5, 7], [5, 28], [6, 28], [7, 9], [8, 9], [8, 19], [8, 20], [8, 23],
  [9, 10], [9, 23], [10, 11], [10, 21], [10, 24], [11, 12], [11, 13], [12, 14], [12, 22],
  [12, 23], [13, 14], [13, 24], [14, 15], [14, 22], [15, 16], [16, 25], [16, 27], [17, 18],
  [17, 27], [18, 19], [18, 22], [19, 20],
];
export const HOLD_FACE = { 26: [-20, -14], 6: [-14, -14], 27: [16, 11], 25: [21, 10], 23: [0, 1], 21: [-24, -2], 22: [8, 2] };
export const HOLD_NODES = { A: [28, 6], B: [27, 25], mid: [23, 21, 22] };
export const SITE_NODES = { A: 4, B: 16 };

function buildGraph() {
  const adj = NODES.map(() => []);
  for (const [a, b] of EDGES) { adj[a].push(b); adj[b].push(a); }
  const nextHop = [];
  for (let s = 0; s < NODES.length; s++) {
    const prev = new Array(NODES.length).fill(-1);
    const queue = [s];
    prev[s] = s;
    for (let head = 0; head < queue.length; head++) {
      const cur = queue[head];
      for (const n of adj[cur]) if (prev[n] === -1) { prev[n] = cur; queue.push(n); }
    }
    const row = new Array(NODES.length).fill(s);
    for (let t = 0; t < NODES.length; t++) {
      let cur = t;
      while (prev[cur] !== -1 && prev[cur] !== s) cur = prev[cur];
      row[t] = cur;
    }
    nextHop.push(row);
  }
  return { nodes: NODES.map(([x, z]) => ({ x, z })), nextHop };
}

export function createMap(scene, random) {
  const colliders = [];
  const mats = {
    siding: new THREE.MeshStandardMaterial({ map: sidingTexture(random), roughness: 0.85, metalness: 0.25 }),
    sidingRust: new THREE.MeshStandardMaterial({ map: sidingTexture(random, '#7a4a34', '#5f3826'), roughness: 0.9, metalness: 0.2 }),
    sidingTeal: new THREE.MeshStandardMaterial({ map: sidingTexture(random, '#41706f', '#2f5453'), roughness: 0.85, metalness: 0.25 }),
    sidingSand: new THREE.MeshStandardMaterial({ map: sidingTexture(random, '#9c8a66', '#7c6c4c'), roughness: 0.9, metalness: 0.15 }),
    steel: new THREE.MeshStandardMaterial({ map: sidingTexture(random, '#7e8894', '#626c78'), roughness: 0.7, metalness: 0.45 }),
    glassLit: new THREE.MeshBasicMaterial({ color: 0xffc06a }),
    glass: new THREE.MeshStandardMaterial({ color: 0x22343e, roughness: 0.25, metalness: 0.6 }),
    door: new THREE.MeshStandardMaterial({ color: PALETTE.tealDark, roughness: 0.6, metalness: 0.5 }),
    concrete: new THREE.MeshStandardMaterial({ map: concreteTexture(random), roughness: 0.95 }),
    crate: new THREE.MeshStandardMaterial({ map: crateTexture(random), roughness: 0.9 }),
    containerRust: new THREE.MeshStandardMaterial({ map: containerTexture(random, '#a34d28', '#7e3a1f'), roughness: 0.8, metalness: 0.3 }),
    containerTeal: new THREE.MeshStandardMaterial({ map: containerTexture(random, '#2e6f76', '#1d4e54'), roughness: 0.8, metalness: 0.3 }),
    containerSand: new THREE.MeshStandardMaterial({ map: containerTexture(random, '#8a7a52', '#66583a'), roughness: 0.8, metalness: 0.3 }),
    metalDark: new THREE.MeshStandardMaterial({ color: PALETTE.metalDark, roughness: 0.6, metalness: 0.6 }),
    metal: new THREE.MeshStandardMaterial({ color: PALETTE.metal, roughness: 0.5, metalness: 0.6 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x23272c, roughness: 1 }),
    glow: new THREE.MeshBasicMaterial({ color: 0xff7a26 }),
    hazard: new THREE.MeshStandardMaterial({ color: PALETTE.hazard, roughness: 0.6 }),
    lamp: new THREE.MeshBasicMaterial({ color: 0xffe2b0 }),
  };

  function box(cx, cy, cz, w, h, d, mat) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(cx, cy, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    colliders.push(makeBox(cx, cy, cz, w, h, d));
    return mesh;
  }
  function visual(mesh, cast = true) {
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(68, 52),
    new THREE.MeshStandardMaterial({ map: groundTexture(random), roughness: 0.96 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.01;
  ground.receiveShadow = true;
  scene.add(ground);
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), new THREE.MeshStandardMaterial({ color: 0x2e2c28, roughness: 1 }));
  apron.rotation.x = -Math.PI / 2;
  apron.position.y = -0.02;
  scene.add(apron);

  // Perimeter fence walls.  box(0, 2, -26.3, 69, 4, 0.6, mats.steel);
  box(0, 2, 26.3, 69, 4, 0.6, mats.sidingSand);
  box(-34.3, 2, 0, 0.6, 4, 53, mats.siding);
  box(34.3, 2, 0, 0.6, 4, 53, mats.sidingTeal);

  // Gantry crane over site A: two legs, a top beam, a hanging spreader.
  box(-24, 4, -14, 1.4, 8, 1.4, mats.steel);
  box(-16, 4, -14, 1.4, 8, 1.4, mats.steel);
  const beam = visual(new THREE.Mesh(new THREE.BoxGeometry(9.4, 1, 1.6), mats.metalDark));
  beam.position.set(-20, 8.2, -14);
  const cable = visual(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 6), mats.dark), false);
  cable.position.set(-20, 6.6, -14);
  const spreader = visual(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 1.2), mats.hazard));
  spreader.position.set(-20, 5.2, -14);
  const craneGlow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 0.1), mats.glow);
  craneGlow.position.set(-20, 7.6, -13.2);
  scene.add(craneGlow);

  // Warehouse shed in the middle: doors north and south, roof slab.
  box(-7, 2.5, -8, 0.6, 5, 8, mats.sidingRust);
  box(7, 2.5, -8, 0.6, 5, 8, mats.sidingRust);
  box(-4.75, 2.5, -12, 5.5, 5, 0.6, mats.siding);
  box(4.75, 2.5, -12, 5.5, 5, 0.6, mats.siding);
  box(0, 4.3, -12, 4, 1.4, 0.6, mats.metalDark);
  box(-4.75, 2.5, -4, 5.5, 5, 0.6, mats.siding);
  box(4.75, 2.5, -4, 5.5, 5, 0.6, mats.siding);
  box(0, 4.3, -4, 4, 1.4, 0.6, mats.metalDark);
  const roof = visual(new THREE.Mesh(new THREE.BoxGeometry(15, 0.4, 9), mats.metalDark));
  roof.position.set(0, 5.2, -8);
  colliders.push(makeBox(0, 5.2, -8, 15, 0.4, 9));
  const shedGlow = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 0.1), mats.glow);
  shedGlow.position.set(0, 3.4, -3.65);
  scene.add(shedGlow);

  // Container stacks: B site yard, west lane, north lane, rail side.
  box(18, 1.3, 12.5, 6, 2.6, 2.4, mats.containerRust);
  box(28, 1.3, 14, 2.4, 2.6, 6, mats.containerTeal);
  box(23, 1.3, 23.5, 6, 2.6, 2.4, mats.containerTeal);
  box(23, 3.9, 23.5, 6, 2.6, 2.4, mats.containerRust);
  box(-8, 1.3, -20, 6, 2.6, 2.4, mats.containerSand);
  box(12, 1.3, -18, 2.4, 2.6, 6, mats.containerTeal);
  box(-24, 1.3, 6, 2.4, 2.6, 6, mats.containerRust);
  box(10, 1.3, 17, 6, 2.6, 2.4, mats.containerSand);
  box(-2, 1.3, 16, 6, 2.6, 2.4, mats.containerTeal);
  box(-30, 1.3, -18, 2.4, 2.6, 6, mats.containerSand);
  box(30, 1.3, -12, 6, 2.6, 2.4, mats.containerRust);

  // Concrete blocks and bollards shaping the lanes.
  box(-13, 1.8, -20, 0.6, 3.6, 10, mats.concrete);
  box(-25.5, 1.8, -9, 11, 3.6, 0.6, mats.concrete);
  box(17, 2, -19, 6, 4, 6, mats.concrete);
  box(-17, 2, 16, 6, 4, 6, mats.concrete);
  box(29.8, 1.8, -6.5, 0.6, 3.6, 3, mats.concrete);
  box(29.8, 1.8, 1.5, 0.6, 3.6, 7, mats.concrete);
  box(-5, 1.8, -3.1, 0.6, 3.6, 3.8, mats.concrete);
  box(-5, 1.8, 3.1, 0.6, 3.6, 3.8, mats.concrete);
  box(5, 1.8, -3.1, 0.6, 3.6, 3.8, mats.concrete);
  box(5, 1.8, 3.1, 0.6, 3.6, 3.8, mats.concrete);

  // Crates: single, double-stacked and low cover.
  const crate1 = [[-8, -12], [8, -2], [-2, 8], [12, 3.5], [14.5, 13], [-24, 6], [-6, 18], [24, -8], [2, -13], [-29, -11], [-15.5, -19]];
  for (const [x, z] of crate1) box(x, 0.575, z, 1.15, 1.15, 1.15, mats.crate);
  const crate2 = [[-4, -11], [20, -12], [-11, 4], [25, 5]];
  for (const [x, z] of crate2) { box(x, 0.575, z, 1.15, 1.15, 1.15, mats.crate); box(x, 1.725, z, 1.15, 1.15, 1.15, mats.crate); }
  const low = [[0, -9.5], [18.5, 16.5], [-20.5, -11], [10, -6]];
  for (const [x, z] of low) box(x, 0.275, z, 1.6, 0.55, 1.6, mats.crate);
  box(-8, 0.575, 3.5, 0.5, 1.15, 3, mats.concrete);
  box(8, 0.575, -3.5, 0.5, 1.15, 3, mats.concrete);
  box(0, 0.575, 12.5, 3, 1.15, 0.5, mats.concrete);
  box(-22, 0.575, 2, 3, 1.15, 0.5, mats.concrete);

  // Flatbed rail cars on the south spur.
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 12);
  function flatbed(x, z, ry) {
    const g = new THREE.Group();
    const bed = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 2.2), mats.metalDark);
    bed.position.y = 0.75;
    g.add(bed);
    const load = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.9, 1.8), mats.containerSand);
    load.position.y = 1.45;
    g.add(load);
    for (const [wx, wz] of [[-2.2, 1.05], [2.2, 1.05], [-2.2, -1.05], [2.2, -1.05]]) {
      const w = new THREE.Mesh(wheelGeo, mats.dark);
      w.rotation.x = Math.PI / 2;
      w.position.set(wx, 0.36, wz);
      g.add(w);
    }
    g.traverse((m) => { m.castShadow = true; m.receiveShadow = true; });
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    scene.add(g);
    box(x, 0.55, z, 6.2, 1.6, 2.4, mats.dark).visible = false;
  }
  flatbed(-12, 23.5, 0);
  flatbed(2, 23.5, 0);
  flatbed(16, 23.5, 0);

  // Windows and doors dressing the fence and shed walls.
  function pane(x, z, ry, lit, door) {
    const g = new THREE.Group();
    const w = door ? 1.15 : 1.5, h = door ? 2.25 : 1.05;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w + 0.26, h + 0.26, 0.1), mats.metalDark));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.13), door ? mats.door : (lit ? mats.glassLit : mats.glass)));
    const bar = new THREE.Mesh(new THREE.BoxGeometry(door ? 0.08 : w, door ? 0.08 : 0.06, 0.15), mats.metal);
    bar.position.x = door ? w / 2 - 0.2 : 0;
    g.add(bar);
    g.position.set(x, door ? 1.14 : 2.45, z);
    g.rotation.y = ry;
    scene.add(g);
  }
  const wins = [[-20, -26, 0, 1], [-6, -26, 0, 0], [8, -26, 0, 1], [24, -26, 0, 0], [-18, 26, 3.14, 0], [2, 26, 3.14, 1], [20, 26, 3.14, 1], [-34, -8, 1.57, 1], [-34, 6, 1.57, 0], [34, -12, -1.57, 1], [7, 12.5, -1.57, 0], [15.5, -16, 0, 1]];
  for (const [x, z, ry, lit] of wins) pane(x, z, ry, lit, false);
  pane(-4, 26, 3.14, false, true);
  pane(9.5, 17, 0, false, true);

  // Floodlight poles.
  for (const [x, z] of [[-12, -2], [12, -12], [-2, 20], [20, -2]]) {
    const pole = visual(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.4, 8), mats.metalDark));
    pole.position.set(x, 2.2, z);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.3), mats.lamp);
    head.position.set(x, 4.45, z);
    scene.add(head);
    colliders.push(makeBox(x, 2.2, z, 0.24, 4.4, 0.24));
  }

  // Distant skyline: harbour blocks and smokestacks with beacons.
  const skyline = [[-44, -20, 10, 12], [40, -30, 12, 14], [0, -44, 30, 10], [-46, 16, 8, 8], [44, 24, 10, 10], [12, 42, 26, 9], [-20, 44, 18, 10]];
  for (const [x, z, w, h] of skyline) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 8), mats.dark);
    m.position.set(x, h / 2, z);
    scene.add(m);
  }
  for (const [x, z, h] of [[-40, -34, 20], [36, 38, 18]]) {
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, h, 12), mats.dark);
    stack.position.set(x, h / 2, z);
    scene.add(stack);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
    beacon.position.set(x, h + 0.4, z);
    scene.add(beacon);
  }

  // Dusk lighting: low orange sun from the west, cool fill, warm sodium points.
  const hemi = new THREE.HemisphereLight(0x9a7d8f, 0x54432e, 0.7);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(PALETTE.sun, 2.4);
  sun.position.set(-40, 8, -14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -48;
  sun.shadow.camera.right = 48;
  sun.shadow.camera.top = 42;
  sun.shadow.camera.bottom = -42;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 130;
  sun.shadow.bias = -0.0006;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xdfeaf5, 0.28);
  fill.position.set(-30, 24, 26);
  scene.add(fill);
  const craneLight = new THREE.PointLight(0xff9a3c, 60, 20, 1.8);
  craneLight.position.set(-20, 3.2, -14);
  scene.add(craneLight);
  const shedLight = new THREE.PointLight(0xffc98a, 36, 15, 1.8);
  shedLight.position.set(0, 3.1, -8);
  scene.add(shedLight);
  const yardLight = new THREE.PointLight(0xbfd9ff, 30, 13, 1.8);
  yardLight.position.set(20, 2.5, 15);
  scene.add(yardLight);

  const graph = buildGraph();
  return {
    colliders, nodes: graph.nodes, nextHop: graph.nextHop, sites: SITES, spawns: SPAWNS,
    sky: { hemi, sun, fill, lamps: [craneLight, shedLight, yardLight], lampBase: [60, 36, 30] },
  };
}
