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

// ── Center sphere (Sedna) ──────────────────────────────────────────────────
scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(48, 32, 32),
  new THREE.MeshPhysicalMaterial({ map: makePlanetTexture(0xb56e52), roughness: 0.25, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.08 })
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
  { name: 'The Tree',         r:  90, size:  9, dur:  22, start:  15, incl:  10, href: 'poems/the-tree.html',         color: 0xb56e52 },
  { name: 'The Ship',         r: 118, size:  8, dur:  30, start:  45, incl: -18, href: 'poems/the-ship.html',         color: 0xa05f45 },
  { name: 'The Artefact',     r: 148, size: 10, dur:  38, start:  75, incl:  14, href: 'poems/the-artefact.html',     color: 0xc07a5a },
  { name: 'The Entrance',     r: 178, size:  9, dur:  47, start: 105, incl: -22, href: 'poems/the-entrance.html',     color: 0x9e5535 },
  { name: 'The Massif',       r: 208, size:  8, dur:  57, start: 135, incl:  18, href: 'poems/the-massif.html',       color: 0xb87060 },
  { name: 'The Missing',      r: 238, size:  9, dur:  67, start: 165, incl: -10, href: 'poems/the-missing.html',      color: 0xaa6448 },
  { name: 'The Well',         r: 268, size: 12, dur:  78, start: 195, incl:  20, href: 'poems/the-well.html',         color: 0xbe8060 },
  { name: 'The Visitors',     r: 298, size:  9, dur:  90, start: 225, incl:  -8, href: 'poems/the-visitors.html',     color: 0x985040 },
  { name: 'The Jailed Man',   r: 330, size: 11, dur: 103, start: 255, incl:  14, href: 'poems/the-jailed-man.html',   color: 0xb26050 },
  { name: 'The Moon King',    r: 362, size:  8, dur: 117, start: 285, incl: -25, href: 'poems/the-moon-king.html',    color: 0xc88868 },
  { name: 'My Brazen Friend', r: 398, size: 18, dur: 132, start: 315, incl:  10, href: 'poems/my-brazen-friend.html', color: 0xa05848 },
  { name: 'Binary Paradox',   r: 440, size: 12, dur: 148, start: 345, incl: -16, href: 'poems/binary-paradox.html',   color: 0xba7055 },
];

// ── Visited tracking ───────────────────────────────────────────────────────
const VISITED_KEY = 'ktb_visited';
const MY_PATH = 'planets/sedna/';
function getVisited() { return new Set(JSON.parse(localStorage.getItem(VISITED_KEY) || '[]')); }
function markVisited(href) { const v = getVisited(); v.add(href); localStorage.setItem(VISITED_KEY, JSON.stringify([...v])); }
function addVisitedRing(mesh, size, color) {
  const c = new THREE.Color(color); c.lerp(new THREE.Color(0xffffff), 0.6);
  const geo = new THREE.RingGeometry(size * 1.5, size * 2.6, 64);
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
    new THREE.MeshPhysicalMaterial({ map: makePlanetTexture(d.color), roughness: 0.25, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.08 })
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
      const hit = rc.intersectObjects(meshes)[0]?.object.userData ?? null;
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
