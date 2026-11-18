import * as THREE from 'three';

// Dusk-port sky presets: top / horizon / fog / hemisphere / sun.
const PRESETS = [
  { top: 0x352a63, hor: 0xff7a33, fog: 0xd98a56, hemi: 0x8a7bd8, hemiI: 0.55, sun: 0xffb36b, sunI: 1.7 },
  { top: 0x565f6b, hor: 0x9aa3ab, fog: 0x878f97, hemi: 0xaab4bc, hemiI: 0.75, sun: 0xdfe6ea, sunI: 0.7 },
  { top: 0x04081a, hor: 0x16233d, fog: 0x0c1424, hemi: 0x33456e, hemiI: 0.3, sun: 0x9db8ff, sunI: 0.4 },
  { top: 0x7788c0, hor: 0xf6b49b, fog: 0xe2ac94, hemi: 0xc9b8d8, hemiI: 0.6, sun: 0xffd9b0, sunI: 1.15 },
];

export function createSky(scene, lights, renderer) {
  const p0 = PRESETS[0];
  const uni = {
    topColor: { value: new THREE.Color(p0.top) },
    horizonColor: { value: new THREE.Color(p0.hor) },
  };
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(420, 28, 14),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: uni,
      vertexShader: 'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'uniform vec3 topColor;uniform vec3 horizonColor;varying vec3 vP;void main(){float h=clamp(normalize(vP).y*1.4+0.12,0.0,1.0);gl_FragColor=vec4(mix(horizonColor,topColor,pow(h,0.65)),1.0);}',
    })
  );
  dome.frustumCulled = false;
  scene.add(dome);
  scene.fog = new THREE.Fog(p0.fog, 70, 400);
  void renderer;

  const top = new THREE.Color(p0.top), hor = new THREE.Color(p0.hor);
  const fogC = new THREE.Color(p0.fog), sunC = new THREE.Color(p0.sun), hemiC = new THREE.Color(p0.hemi);
  let sunI = p0.sunI, hemiI = p0.hemiI;
  let idx = 0, from = null, to = null, blend = 1;

  function push() {
    uni.topColor.value.copy(top);
    uni.horizonColor.value.copy(hor);
    scene.fog.color.copy(fogC);
    lights.hemi.color.copy(hemiC);
    lights.hemi.intensity = hemiI;
    lights.sun.color.copy(sunC);
    lights.sun.intensity = sunI;
  }
  function applyTo(s) {
    if (!from) return;
    top.lerpColors(from.top, to.top, s);
    hor.lerpColors(from.hor, to.hor, s);
    fogC.lerpColors(from.fog, to.fog, s);
    sunC.lerpColors(from.sun, to.sun, s);
    hemiC.lerpColors(from.hemi, to.hemi, s);
    sunI = from.sunI + (to.sunI - from.sunI) * s;
    hemiI = from.hemiI + (to.hemiI - from.hemiI) * s;
    push();
  }
  function set(i, instant = false) {
    i = ((i % PRESETS.length) + PRESETS.length) % PRESETS.length;
    const p = PRESETS[i];
    idx = i;
    from = { top: top.clone(), hor: hor.clone(), fog: fogC.clone(), sun: sunC.clone(), hemi: hemiC.clone(), sunI, hemiI };
    to = { top: new THREE.Color(p.top), hor: new THREE.Color(p.hor), fog: new THREE.Color(p.fog), sun: new THREE.Color(p.sun), hemi: new THREE.Color(p.hemi), sunI: p.sunI, hemiI: p.hemiI };
    blend = instant ? 1 : 0;
    applyTo(blend);
  }
  function cycle() { set(idx + 1); }
  function update(dt) {
    if (blend < 1) {
      blend = Math.min(1, blend + dt / 2);
      const s = blend * blend * (3 - 2 * blend);
      applyTo(s);
    }
  }
  push();
  return { set, cycle, update };
}
