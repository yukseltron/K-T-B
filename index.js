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

// ── Environment map (for glossy reflections) ───────────────────────────────
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 1, 8000);
camera.position.set(0, 300, 700);
camera.lookAt(0, 0, 0);

// ── Lighting ───────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xc8c8d8, 0.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(200, 500, 300);
scene.add(dirLight);

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

// ── Black sun ──────────────────────────────────────────────────────────────
scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(70, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0x06040e })
));

{
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = size / 2;
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
  grad.addColorStop(0,    'rgba(255,255,255,0.55)');
  grad.addColorStop(0.18, 'rgba(255,255,255,0.28)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.10)');
  grad.addColorStop(0.75, 'rgba(255,255,255,0.03)');
  grad.addColorStop(1,    'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const glowMat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(520, 520, 1);
  scene.add(glow);
}

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

// ── Planet data ────────────────────────────────────────────────────────────
const DATA = [
  { name: 'Ceres',   r: 130, size: 9,  dur: 35,  start: 45,  incl:  15, href: 'planets/ceres/',   color: 0x7a9fb5 },
  { name: 'Sedna',   r: 175, size: 7,  dur: 48,  start: 100, incl: -20, href: 'planets/sedna/',   color: 0xb56e52 },
  { name: 'Arachi',  r: 223, size: 11, dur: 62,  start: 160, incl:   8, href: 'planets/arachi/',  color: 0x5e9e8a },
  { name: 'Ishtar',  r: 275, size: 13, dur: 78,  start: 230, incl: -12, href: 'planets/ishtar/',  color: 0xb59a5a },
  { name: 'Nemesis', r: 330, size: 10, dur: 95,  start: 295, incl:  25, href: 'planets/nemesis/', color: 0x7e6aaa },
  { name: 'Bacchus', r: 420, size: 22, dur: 130, start: 330, incl:  -5, href: 'planets/bacchus/', color: 0x4a6e9e },
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

// ── Camera spherical coords (for rotation) ────────────────────────────────
const spherical = new THREE.Spherical().setFromVector3(camera.position);

// ── Interaction ────────────────────────────────────────────────────────────
const rc    = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
const overlay = document.getElementById('overlay');
let hovered = null, transitioning = false;
let isDown = false, isDrag = false;
let downX = 0, downY = 0, prevX = 0, prevY = 0;

renderer.domElement.addEventListener('mousemove', e => {
  const dx = e.clientX - prevX;
  const dy = e.clientY - prevY;
  prevX = e.clientX; prevY = e.clientY;

  if (isDown) {
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 4) isDrag = true;
    if (isDrag && !transitioning) {
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
  if (dragged || transitioning || !hovered) return;

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

let zoomState = null;

// ── Animate ────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

(function tick() {
  requestAnimationFrame(tick);
  const dt = clock.getDelta();

  planets.forEach(p => {
    if (!p.paused && !transitioning) p.angle += p.speed * 60 * dt;
    p.mesh.position.copy(orbitPos(p.r, p.angle, p.incl));
  });

  if (zoomState) {
    const { fromPos, toPos, fromLook, toLook, t0, dur } = zoomState;
    const t = Math.min((performance.now() - t0) / dur, 1);
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
