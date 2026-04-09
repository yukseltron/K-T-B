import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ── Renderer ───────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x0d0d0d);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

// ── Scene / Camera ─────────────────────────────────────────────────────────
const scene = new THREE.Scene();

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 1, 8000);

const CAM_FROM = new THREE.Vector3(0, 3000, 7000);
const CAM_REST = new THREE.Vector3(0, 300, 700);
camera.position.copy(CAM_FROM);
camera.lookAt(0, 0, 0);

let entering = true;
const ENTER_T0  = performance.now();
const ENTER_DUR = 1300;

// ── Lighting ───────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const sun = new THREE.DirectionalLight(0xffffff, 0.9);
sun.position.set(200, 500, 300);
scene.add(sun);

// ── Stars ──────────────────────────────────────────────────────────────────
{
  const n = 1200, pos = new Float32Array(n * 3);
  for (let i = 0; i < pos.length; i++) pos[i] = (Math.random() - 0.5) * 5000;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({
    color: 0xffffff, size: 1.5, transparent: true, opacity: 0.35
  })));
}

// ── Center sphere (Ceres) ──────────────────────────────────────────────────
scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(50, 32, 32),
  new THREE.MeshPhysicalMaterial({ map: makePlanetTexture(0x7a9fb5), roughness: 0.25, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.08 })
));

// ── Helpers ────────────────────────────────────────────────────────────────
const D2R = Math.PI / 180;

function makePlanetTexture(hex) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  const hi = (c, d) => Math.min(255, c + d), lo = (c, d) => Math.max(0, c - d);
  const grad = ctx.createLinearGradient(0, 0, size * 0.6, size);
  grad.addColorStop(0,   `rgb(${hi(r,55)},${hi(g,55)},${hi(b,55)})`);
  grad.addColorStop(0.5, `rgb(${r},${g},${b})`);
  grad.addColorStop(1,   `rgb(${lo(r,50)},${lo(g,50)},${lo(b,50)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size);
  const px = img.data;
  for (let i = 0; i < px.length; i += 4) {
    const n = (Math.random() - 0.5) * 38;
    px[i]   = Math.min(255, Math.max(0, px[i]   + n));
    px[i+1] = Math.min(255, Math.max(0, px[i+1] + n));
    px[i+2] = Math.min(255, Math.max(0, px[i+2] + n));
  }
  ctx.putImageData(img, 0, 0);
  return new THREE.CanvasTexture(canvas);
}

function orbitPos(r, θ, incl) {
  const i = incl * D2R;
  return new THREE.Vector3(
    r * Math.sin(θ),
    -r * Math.cos(θ) * Math.sin(i),
    r * Math.cos(θ) * Math.cos(i)
  );
}

function makeRing(r, incl) {
  const pts = [], i = incl * D2R, N = 128;
  for (let j = 0; j <= N; j++) {
    const θ = (j / N) * Math.PI * 2;
    pts.push(new THREE.Vector3(
      r * Math.sin(θ),
      -r * Math.cos(θ) * Math.sin(i),
      r * Math.cos(θ) * Math.cos(i)
    ));
  }
  return new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 })
  );
}

// ── Poem data ──────────────────────────────────────────────────────────────
const DATA = [
  { name: 'Cabin',                              r:  90, size:  9, dur:  22, start:   0, incl:  10, href: 'poems/cabin.html',         color: 0x6a8faa },
  { name: 'Forgetting Something You Remembered', r: 118, size:  8, dur:  30, start:  30, incl: -18, href: 'poems/forgetting.html',     color: 0x7a9db8 },
  { name: 'LAST MIDDLE TOP SMALL TALL',         r: 148, size: 10, dur:  38, start:  60, incl:  22, href: 'poems/lmtst.html',           color: 0x5c8fa0 },
  { name: 'Under the Glow',                     r: 178, size:  9, dur:  47, start:  90, incl:  -8, href: 'poems/under-the-glow.html',  color: 0x8aaabb },
  { name: 'Reaching into the Past',             r: 208, size:  8, dur:  57, start: 120, incl:  15, href: 'poems/reaching.html',        color: 0x6c9eb0 },
  { name: 'Missing the Idea of You',            r: 238, size:  9, dur:  67, start: 150, incl: -25, href: 'poems/missing.html',         color: 0x4e7d96 },
  { name: 'Ablution',                           r: 268, size: 12, dur:  78, start: 180, incl:  12, href: 'poems/ablution.html',        color: 0x82a8be },
  { name: 'Autumn',                             r: 298, size:  9, dur:  90, start: 210, incl:  -5, href: 'poems/autumn.html',          color: 0x94afc0 },
  { name: 'The Immortal Cat',                   r: 330, size: 11, dur: 103, start: 240, incl:  20, href: 'poems/immortal-cat.html',    color: 0x5b8ca4 },
  { name: 'Return',                             r: 362, size:  8, dur: 117, start: 270, incl: -14, href: 'poems/return.html',          color: 0x7097ab },
  { name: 'Pseudepigrapha',                     r: 398, size: 18, dur: 132, start: 300, incl:   8, href: 'poems/pseudepigrapha.html',  color: 0x628fac },
  { name: 'The Esoteric Plane',                 r: 440, size: 12, dur: 148, start: 330, incl: -18, href: 'poems/esoteric-plane.html',  color: 0x4a7a92 },
];

const planets = [], meshes = [];

DATA.forEach(d => {
  scene.add(makeRing(d.r, d.incl));
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(d.size, 24, 24),
    new THREE.MeshPhysicalMaterial({ map: makePlanetTexture(d.color), roughness: 0.25, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.08 })
  );
  const angle = d.start * D2R;
  mesh.position.copy(orbitPos(d.r, angle, d.incl));
  scene.add(mesh);
  const p = { ...d, mesh, angle, speed: (Math.PI * 2) / (d.dur * 60), paused: false };
  mesh.userData = p;
  planets.push(p);
  meshes.push(mesh);
});

// ── Camera spherical coords ────────────────────────────────────────────────
const spherical = new THREE.Spherical().setFromVector3(CAM_REST);

// ── Interaction ────────────────────────────────────────────────────────────
const rc    = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
const overlay = document.getElementById('overlay');
let hovered = null, transitioning = false, exiting = false;
let isDown = false, isDrag = false;
let downX = 0, downY = 0, prevX = 0, prevY = 0;

renderer.domElement.addEventListener('mousemove', e => {
  const dx = e.clientX - prevX;
  const dy = e.clientY - prevY;
  prevX = e.clientX; prevY = e.clientY;

  if (isDown) {
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 4) isDrag = true;
    if (isDrag && !transitioning && !entering) {
      spherical.theta -= dx * 0.005;
      spherical.phi = Math.max(0.05, Math.min(Math.PI * 0.88, spherical.phi - dy * 0.005));
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);
    }
  }

  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  rc.setFromCamera(mouse, camera);
  const hit = rc.intersectObjects(meshes)[0]?.object.userData ?? null;

  if (hit !== hovered) {
    if (hovered) { hovered.paused = false; hovered.mesh.material.color.setHex(0xbbbbbb); }
    hovered = hit;
    if (hovered) { hovered.paused = true; hovered.mesh.material.color.setHex(0xffffff); }
    tooltip.textContent = hovered?.name ?? '';
    tooltip.style.opacity = hovered ? '1' : '0';
  }

  renderer.domElement.style.cursor =
    (isDown && isDrag) ? 'grabbing' : hovered ? 'pointer' : 'default';
});

renderer.domElement.addEventListener('mousedown', e => {
  isDown = true; isDrag = false;
  downX = prevX = e.clientX;
  downY = prevY = e.clientY;
  renderer.domElement.style.cursor = 'grabbing';
});

renderer.domElement.addEventListener('mouseup', () => {
  const dragged = isDrag;
  isDown = false; isDrag = false;
  renderer.domElement.style.cursor = hovered ? 'pointer' : 'default';
  if (dragged || transitioning || entering || !hovered) return;

  const p = hovered;
  transitioning = true;
  document.getElementById('label').style.opacity = '0';

  const fromPos = camera.position.clone();
  const dir = fromPos.clone().sub(p.mesh.position).normalize();
  const toPos = p.mesh.position.clone().add(dir.multiplyScalar(p.size * 4));

  overlay.style.transition = 'opacity 0.45s ease 0.25s';
  overlay.style.opacity = '1';
  zoomState = { fromPos, toPos, fromLook: new THREE.Vector3(), toLook: p.mesh.position.clone(), t0: performance.now(), dur: 1000 };
  setTimeout(() => { window.location.href = p.href; }, 1060);
});

renderer.domElement.addEventListener('wheel', e => {
  e.preventDefault();
  spherical.radius = Math.max(150, Math.min(1800, spherical.radius + e.deltaY * 0.5));
  camera.position.setFromSpherical(spherical);
  camera.lookAt(0, 0, 0);
}, { passive: false });

document.getElementById('back').addEventListener('click', e => {
  e.preventDefault();
  if (exiting || transitioning) return;
  exiting = true;
  entering = false;
  const href = e.currentTarget.href;
  exitState = { from: camera.position.clone(), to: CAM_FROM.clone(), t0: performance.now(), dur: 900 };
  overlay.style.transition = 'opacity 0.45s ease 0.6s';
  overlay.style.opacity = '1';
  setTimeout(() => { window.location.href = href; }, 1100);
});

let zoomState = null;
let exitState = null;

// ── Animate ────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

(function tick() {
  requestAnimationFrame(tick);
  const dt = clock.getDelta();
  const now = performance.now();

  if (entering) {
    const t = Math.min((now - ENTER_T0) / ENTER_DUR, 1);
    const ease = 1 - (1 - t) ** 3;
    camera.position.lerpVectors(CAM_FROM, CAM_REST, ease);
    camera.lookAt(0, 0, 0);
    if (t >= 1) { entering = false; camera.position.copy(CAM_REST); spherical.setFromVector3(CAM_REST); }
  }

  if (exiting && exitState) {
    const { from, to, t0, dur } = exitState;
    const t = Math.min((performance.now() - t0) / dur, 1);
    camera.position.lerpVectors(from, to, t * t * t);
    camera.lookAt(0, 0, 0);
  }

  planets.forEach(p => {
    if (!p.paused && !transitioning) p.angle += p.speed * 60 * dt;
    p.mesh.position.copy(orbitPos(p.r, p.angle, p.incl));
  });

  if (zoomState) {
    const { fromPos, toPos, fromLook, toLook, t0, dur } = zoomState;
    const t = Math.min((now - t0) / dur, 1);
    const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    camera.position.lerpVectors(fromPos, toPos, ease);
    camera.lookAt(new THREE.Vector3().lerpVectors(fromLook, toLook, ease));
  }

  renderer.render(scene, camera);
})();

// ── Resize ─────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
