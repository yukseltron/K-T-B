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

// Start far away — entrance animation zooms in to rest position
const CAM_FROM = new THREE.Vector3(0, 3000, 7000);
const CAM_REST = new THREE.Vector3(0, 300, 700);
camera.position.copy(CAM_FROM);
camera.lookAt(0, 0, 0);

let entering = true;
const ENTER_T0  = performance.now();
const ENTER_DUR = 1300; // ms

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

// ── Center sphere (Arachi) ─────────────────────────────────────────────────
scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(52, 32, 32),
  new THREE.MeshPhysicalMaterial({ map: makePlanetTexture(0x5e9e8a), roughness: 0.88, metalness: 0.0, clearcoat: 0.0 })
));

// ── Helpers ────────────────────────────────────────────────────────────────
const D2R = Math.PI / 180;

function makePlanetTexture(hex) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  const img = ctx.getImageData(0, 0, size, size);
  const px = img.data;
  const TAU = Math.PI * 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const u = x / size;
      const v = y / size;
      const n =
        Math.sin(u * TAU * 2 + 1.3) * Math.cos(v * TAU * 1.5 + 0.7) * 32 +
        Math.sin(u * TAU * 4 + 2.1) * Math.cos(v * TAU * 3.5 + 1.4) * 20 +
        Math.sin(u * TAU * 1 + 0.5) * Math.cos(v * TAU * 2.5 + 2.2) * 25 +
        (Math.random() - 0.5) * 28;
      const pole = (1 - Math.abs(v - 0.5) * 2) * 18 - 9;
      px[i]   = Math.min(255, Math.max(0, r + n + pole));
      px[i+1] = Math.min(255, Math.max(0, g + n + pole));
      px[i+2] = Math.min(255, Math.max(0, b + n + pole));
      px[i+3] = 255;
    }
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
  { name: 'Arrival',                r:  90, size:  9, dur:  22, start:   0, incl:  12, href: 'poems/arrival.html',        color: 0x7a6e9a },
  { name: 'Timeless',               r: 130, size:  8, dur:  37, start:  45, incl: -15, href: 'poems/timeless.html',       color: 0x8a7aaa },
  { name: 'Meal',                   r: 170, size: 10, dur:  55, start:  90, incl:   8, href: 'poems/meal.html',           color: 0x6a5e8a },
  { name: 'Return',                 r: 215, size:  9, dur:  76, start: 135, incl: -18, href: 'poems/return.html',         color: 0x7097ab },
  { name: 'Diaspora',               r: 260, size: 12, dur: 100, start: 180, incl:  20, href: 'poems/diaspora.html',       color: 0x8870a8 },
  { name: 'Reaching into the Past', r: 310, size:  8, dur: 130, start: 225, incl: -12, href: 'poems/reaching.html',      color: 0x6c9eb0 },
  { name: 'Pseudepigrapha',         r: 365, size: 18, dur: 165, start: 270, incl:  10, href: 'poems/pseudepigrapha.html', color: 0x628fac },
  { name: 'The Tree',               r: 425, size:  9, dur: 206, start: 315, incl:  14, href: 'poems/the-tree.html',      color: 0xb56e52 },
];

// ── Visited tracking ───────────────────────────────────────────────────────
const VISITED_KEY = 'ktb_visited';
const MY_PATH = 'planets/arachi/';
function getVisited() { return new Set(JSON.parse(localStorage.getItem(VISITED_KEY) || '[]')); }
function markVisited(href) { const v = getVisited(); v.add(href); localStorage.setItem(VISITED_KEY, JSON.stringify([...v])); }
function addVisitedRing(mesh, size, color) {
  const c = new THREE.Color(color); c.lerp(new THREE.Color(0xffffff), 0.6);
  const geo = new THREE.RingGeometry(size * 1.2, size * 1.5, 64);
  const ring = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide, transparent: true, opacity: 0.5 }));
  ring.rotation.x = -Math.PI / 2 + 0.3;
  mesh.add(ring);
}
const visited = getVisited();

const planets = [], meshes = [];

DATA.forEach(d => {
  scene.add(makeRing(d.r, d.incl));
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(d.size, 24, 24),
    new THREE.MeshPhysicalMaterial({ map: makePlanetTexture(d.color), roughness: 0.88, metalness: 0.0, clearcoat: 0.0 })
  );
  const angle = d.start * D2R;
  mesh.position.copy(orbitPos(d.r, angle, d.incl));
  scene.add(mesh);
  if (visited.has(MY_PATH + d.href)) addVisitedRing(mesh, d.size, d.color);
  const p = { ...d, mesh, angle, speed: (Math.PI * 2) / (d.dur * 60), paused: false };
  mesh.userData = p;
  planets.push(p);
  meshes.push(mesh);
});

// ── Camera spherical coords (for rotation) ────────────────────────────────
// Initialised to CAM_REST — synced again once entrance finishes
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

  if (!transitioning && !entering) {
    mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    rc.setFromCamera(mouse, camera);
    const _i = rc.intersectObjects(meshes)[0];
    const hit = _i?.object.userData?.mesh ? _i.object.userData : null;

    if (hit !== hovered) {
      if (hovered?.mesh) { hovered.paused = false; hovered.mesh.material.color.setHex(0xbbbbbb); }
      hovered = hit;
      if (hovered?.mesh) { hovered.paused = true; hovered.mesh.material.color.setHex(0xffffff); }
      tooltip.textContent = hovered?.name ?? '';
      tooltip.style.opacity = hovered ? '1' : '0';
    }
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
  hovered = null;
  tooltip.textContent = '';
  tooltip.style.opacity = '0';
  transitioning = true;
  document.getElementById('label').style.opacity = '0';

  const fromPos = camera.position.clone();
  const dir = fromPos.clone().sub(p.mesh.position).normalize();
  const toPos = p.mesh.position.clone().add(dir.multiplyScalar(p.size * 4));

  overlay.style.transition = 'opacity 0.45s ease 0.25s';
  overlay.style.opacity = '1';
  zoomState = { fromPos, toPos, fromLook: new THREE.Vector3(), toLook: p.mesh.position.clone(), t0: performance.now(), dur: 1000 };
  markVisited(MY_PATH + p.href);
  setTimeout(() => { window.location.href = p.href; }, 1060);
});

renderer.domElement.addEventListener('wheel', e => {
  e.preventDefault();
  spherical.radius = Math.max(150, Math.min(1800, spherical.radius + e.deltaY * 0.5));
  camera.position.setFromSpherical(spherical);
  camera.lookAt(0, 0, 0);
}, { passive: false });

// ── Touch support ──────────────────────────────────────────────────────────
{
  let tPrevX = 0, tPrevY = 0, tDownX = 0, tDownY = 0, tDrag = false, pinch0 = null;

  renderer.domElement.addEventListener('touchstart', e => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      tDownX = tPrevX = t.clientX; tDownY = tPrevY = t.clientY;
      tDrag = false; pinch0 = null;
    } else if (e.touches.length === 2) {
      pinch0 = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
    }
  }, { passive: false });

  renderer.domElement.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 1 && pinch0 === null) {
      const t = e.touches[0];
      const dx = t.clientX - tPrevX, dy = t.clientY - tPrevY;
      tPrevX = t.clientX; tPrevY = t.clientY;
      if (Math.hypot(t.clientX - tDownX, t.clientY - tDownY) > 8) tDrag = true;
      if (tDrag && !transitioning && !entering) {
        spherical.theta -= dx * 0.005;
        spherical.phi = Math.max(0.05, Math.min(Math.PI * 0.88, spherical.phi - dy * 0.005));
        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);
      }
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
      if (pinch0 !== null) {
        spherical.radius = Math.max(150, Math.min(1800, spherical.radius + (pinch0 - dist) * 2));
        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);
      }
      pinch0 = dist; tDrag = true;
    }
  }, { passive: false });

  renderer.domElement.addEventListener('touchend', e => {
    e.preventDefault();
    if (!tDrag && e.changedTouches.length === 1) {
      const t = e.changedTouches[0];
      mouse.set((t.clientX / innerWidth) * 2 - 1, -(t.clientY / innerHeight) * 2 + 1);
      rc.setFromCamera(mouse, camera);
      const _i = rc.intersectObjects(meshes)[0];
      const hit = _i?.object.userData?.mesh ? _i.object.userData : null;
      if (hit && !transitioning && !entering) {
        const p = hit;
        transitioning = true;
        document.getElementById('label').style.opacity = '0';
        const fromPos = camera.position.clone();
        const dir = fromPos.clone().sub(p.mesh.position).normalize();
        const toPos = p.mesh.position.clone().add(dir.multiplyScalar(p.size * 4));
        overlay.style.transition = 'opacity 0.45s ease 0.25s';
        overlay.style.opacity = '1';
        zoomState = { fromPos, toPos, fromLook: new THREE.Vector3(), toLook: p.mesh.position.clone(), t0: performance.now(), dur: 1000 };
        markVisited(MY_PATH + p.href);
        setTimeout(() => { window.location.href = p.href; }, 1060);
      }
    }
    tDrag = false; pinch0 = null;
  }, { passive: false });
}

// ── Back link transition ───────────────────────────────────────────────────
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

  // Entrance zoom
  if (entering) {
    const t = Math.min((now - ENTER_T0) / ENTER_DUR, 1);
    const ease = 1 - (1 - t) ** 3; // cubic ease-out
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
