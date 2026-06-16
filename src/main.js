// =============================================================================
// S.T.A.R. Earthquake Rescue Lab - main entry
// Vite + vanilla JS + Three.js. Procedural geometry only (no external assets).
// =============================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  SCENARIO,
  CARDS,
  CARD_BY_ID,
  INITIAL_BOARD_ORDER,
  HOTSPOTS,
} from './gameData.js';
import * as audio from './audio.js';
import {
  supaEnabled,
  WEEK,
  registerPlayer,
  logActivity,
  saveSubmission,
} from './supabase.js';

// Instructor passcode that unlocks the Expert Key before submission.
const INSTRUCTOR_KEY = 'instruct26';
const PLAYER_KEY = 'star-player-name';

// The signed-in operative's name (null until they sign in this session).
let playerName = localStorage.getItem(PLAYER_KEY) || null;

// Small helper so logging is always tied to the current player.
const track = (type, payload) => logActivity(playerName, type, payload);

// -----------------------------------------------------------------------------
// Global game state
// -----------------------------------------------------------------------------
const state = {
  investigated: new Set(), // hotspot ids that have been opened
  answered: new Set(), // card ids answered correctly
  boardOrder: [...INITIAL_BOARD_ORDER], // current player ordering (card ids)
  submitted: false,
  lastScore: null,
};

const TOTAL_HOTSPOTS = HOTSPOTS.length;

// -----------------------------------------------------------------------------
// DOM references
// -----------------------------------------------------------------------------
const dom = {
  canvas: document.getElementById('scene'),
  intro: document.getElementById('intro'),
  introText: document.getElementById('intro-text'),
  introStart: document.getElementById('intro-start'),
  hud: document.getElementById('hud'),
  checklist: document.getElementById('checklist'),
  checklistItems: document.getElementById('checklist-items'),
  checklistCount: document.getElementById('checklist-count'),
  readinessPct: document.getElementById('readiness-pct'),
  readinessFill: document.getElementById('readiness-fill'),
  scannerText: document.getElementById('scanner-text'),
  btnBoard: document.getElementById('btn-board'),
  btnExpert: document.getElementById('btn-expert'),
  btnHelp: document.getElementById('btn-help'),
  btnSound: document.getElementById('btn-sound'),
  btnReset: document.getElementById('btn-reset'),
  playerChip: document.getElementById('player-chip'),
  introGreeting: document.getElementById('intro-greeting'),
  introLogin: document.getElementById('intro-login'),
  introName: document.getElementById('intro-name'),
  modal: document.getElementById('modal'),
  modalBody: document.getElementById('modal-body'),
  modalClose: document.getElementById('modal-close'),
  live: document.getElementById('live'),
};

dom.introText.textContent = SCENARIO.intro;

// =============================================================================
// THREE.JS SCENE
// =============================================================================
const renderer = new THREE.WebGLRenderer({
  canvas: dom.canvas,
  antialias: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1220);
scene.fog = new THREE.Fog(0x0b1220, 26, 60);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(16.7, 16.4, -9.8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 6;
controls.maxDistance = 30;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, 1.5, -2);
controls.update();

// -----------------------------------------------------------------------------
// Lighting (emergency / low-power feel)
// -----------------------------------------------------------------------------
scene.add(new THREE.AmbientLight(0x8a9bc0, 1.0));

const hemi = new THREE.HemisphereLight(0x9fc0ff, 0x2a2018, 0.9);
scene.add(hemi);

const keyLight = new THREE.DirectionalLight(0xdce9ff, 1.15);
keyLight.position.set(6, 14, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -16;
keyLight.shadow.camera.right = 16;
keyLight.shadow.camera.top = 16;
keyLight.shadow.camera.bottom = -16;
scene.add(keyLight);

// A flickering emergency lamp adds atmosphere.
const emergencyLamp = new THREE.PointLight(0xff7a52, 1.5, 26, 2);
emergencyLamp.position.set(0, 5.2, 0);
scene.add(emergencyLamp);

// A cool fill light keeps the far corners readable.
const fillLight = new THREE.PointLight(0x6fa8ff, 0.9, 30, 2);
fillLight.position.set(-4, 4.5, 6);
scene.add(fillLight);

// -----------------------------------------------------------------------------
// Materials
// -----------------------------------------------------------------------------
const mat = {
  floor: new THREE.MeshStandardMaterial({ color: 0x3a3f48, roughness: 0.95 }),
  wall: new THREE.MeshStandardMaterial({ color: 0x4b515c, roughness: 0.92 }),
  ceiling: new THREE.MeshStandardMaterial({ color: 0x2b2f37, roughness: 1 }),
  crack: new THREE.MeshStandardMaterial({ color: 0x111418, roughness: 1 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x8a93a3, roughness: 0.5, metalness: 0.6 }),
  darkMetal: new THREE.MeshStandardMaterial({ color: 0x3c434f, roughness: 0.6, metalness: 0.5 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.85 }),
  rubble: new THREE.MeshStandardMaterial({ color: 0x5c5650, roughness: 1, flatShading: true }),
  white: new THREE.MeshStandardMaterial({ color: 0xe8eef6, roughness: 0.7 }),
  red: new THREE.MeshStandardMaterial({ color: 0xd23a3a, roughness: 0.6 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x3a6fd2, roughness: 0.6 }),
};

// -----------------------------------------------------------------------------
// Room shell
// -----------------------------------------------------------------------------
const ROOM = { w: 18, d: 16, h: 6 };

function buildRoom() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), mat.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Faint grid to read the concrete floor seams.
  const grid = new THREE.GridHelper(ROOM.w, 18, 0x2a2e36, 0x21252c);
  grid.position.y = 0.01;
  scene.add(grid);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), mat.ceiling);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = ROOM.h;
  scene.add(ceiling);

  const half = { w: ROOM.w / 2, d: ROOM.d / 2 };
  // back, left, right, front walls
  addWall(0, ROOM.h / 2, -half.d, ROOM.w, ROOM.h, 0.3);
  addWall(-half.w, ROOM.h / 2, 0, 0.3, ROOM.h, ROOM.d);
  addWall(half.w, ROOM.h / 2, 0, 0.3, ROOM.h, ROOM.d);
  addWall(0, ROOM.h / 2, half.d, ROOM.w, ROOM.h, 0.3);

  addCracks();
}

function addWall(x, y, z, w, h, d) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat.wall);
  wall.position.set(x, y, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);
}

// Thin dark boxes layered on the walls suggest cracked concrete + air gaps.
function addCracks() {
  const crackDefs = [
    [-half().w + 0.2, 3.4, -2, 0.12, 2.6, 0.16, 0.3],
    [-half().w + 0.2, 2.0, 4, 0.12, 1.8, 0.14, -0.5],
    [3.5, 4.4, -half().d + 0.2, 1.6, 0.12, 0.14, 0.2],
    [-5, 1.5, -half().d + 0.2, 1.2, 0.1, 0.14, -0.4],
    [half().w - 0.2, 3.0, -4.5, 0.12, 2.2, 0.16, 0.4],
  ];
  for (const [x, y, z, w, h, d, rot] of crackDefs) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat.crack);
    c.position.set(x, y, z);
    c.rotation.z = rot;
    scene.add(c);
  }
}

function half() {
  return { w: ROOM.w / 2, d: ROOM.d / 2 };
}

// -----------------------------------------------------------------------------
// Reusable builders
// -----------------------------------------------------------------------------
function box(w, h, d, material, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(rt, rb, h, material, x, y, z, segs = 12) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

// A low-poly human: capsule torso, sphere head, simple limbs.
function makeHuman(color, helmet = false) {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xd9a06b, roughness: 0.8 });
  const cloth = new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.55, 4, 8), cloth);
  torso.position.y = 1.15;
  torso.castShadow = true;
  g.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), skin);
  head.position.y = 1.78;
  head.castShadow = true;
  g.add(head);

  if (helmet) {
    const h = new THREE.Mesh(
      new THREE.SphereGeometry(0.27, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xffd23b, roughness: 0.5 })
    );
    h.position.y = 1.82;
    g.add(h);
  }

  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.5, 3, 6), cloth);
    arm.position.set(side * 0.36, 1.15, 0);
    arm.rotation.z = side * 0.25;
    arm.castShadow = true;
    g.add(arm);

    const leg = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.11, 0.55, 3, 6),
      new THREE.MeshStandardMaterial({ color: 0x2c3340, roughness: 0.9 })
    );
    leg.position.set(side * 0.15, 0.45, 0);
    leg.castShadow = true;
    g.add(leg);
  }
  return g;
}

function addHumans() {
  const crew = [
    { color: 0x3a6fd2, pos: [-1.2, 0, 1.6], rot: 0.6, helmet: true },
    { color: 0x2fa66b, pos: [1.4, 0, 1.4], rot: -0.5, helmet: false },
    { color: 0xc94f8a, pos: [0.2, 0, 2.6], rot: Math.PI, helmet: false },
    { color: 0xe0863b, pos: [-2.6, 0, 0.2], rot: 1.4, helmet: true },
  ];
  for (const c of crew) {
    const h = makeHuman(c.color, c.helmet);
    h.position.set(...c.pos);
    h.rotation.y = c.rot;
    scene.add(h);
  }
}

// -----------------------------------------------------------------------------
// Station builders (one per major object)
// -----------------------------------------------------------------------------
function buildStations() {
  const H = half();

  // Utility panel (left wall, back)
  const panel = box(0.25, 1.4, 1.6, mat.darkMetal, -H.w + 0.35, 2.0, -3.0);
  scene.add(panel);
  scene.add(box(0.05, 0.5, 0.12, mat.red, -H.w + 0.5, 2.3, -3.3));
  scene.add(box(0.05, 0.5, 0.12, mat.metal, -H.w + 0.5, 1.7, -2.7));

  // First-aid station (left wall, front)
  const cabinet = box(0.3, 1.0, 1.2, mat.white, -H.w + 0.4, 1.6, 2.5);
  scene.add(cabinet);
  scene.add(box(0.34, 0.5, 0.14, mat.red, -H.w + 0.42, 1.6, 2.5));
  scene.add(box(0.34, 0.14, 0.5, mat.red, -H.w + 0.42, 1.6, 2.5));

  // Radio desk (back wall, left of center)
  scene.add(box(1.8, 0.9, 0.9, mat.wood, -3.0, 0.45, -6.6));
  scene.add(box(0.9, 0.45, 0.6, mat.darkMetal, -3.0, 1.15, -6.6));
  const antenna = cyl(0.02, 0.02, 1.2, mat.metal, -2.6, 1.9, -6.6);
  scene.add(antenna);

  // Water station (back wall, right of center): water heater + jugs
  scene.add(cyl(0.45, 0.45, 1.6, mat.metal, 3.0, 0.8, -6.6, 16));
  scene.add(box(0.4, 0.4, 0.4, mat.blue, 3.8, 0.2, -6.2));
  scene.add(box(0.4, 0.4, 0.4, mat.blue, 2.3, 0.2, -6.2));

  // Signal board (right wall)
  scene.add(box(0.2, 1.4, 2.0, mat.wood, H.w - 0.35, 1.9, -1.5));
  scene.add(box(0.05, 1.0, 1.6, mat.white, H.w - 0.45, 1.9, -1.5));

  // Planning table (center)
  scene.add(box(2.4, 0.12, 1.4, mat.wood, 0, 1.0, 1.0));
  for (const [dx, dz] of [[-1.0, -0.5], [1.0, -0.5], [-1.0, 0.5], [1.0, 0.5]]) {
    scene.add(cyl(0.06, 0.06, 1.0, mat.darkMetal, dx, 0.5, 1.0 + dz));
  }
  scene.add(box(0.6, 0.02, 0.4, mat.white, -0.2, 1.07, 1.0)); // a paper map

  // Refrigerator / food station (right wall, front)
  scene.add(box(0.9, 2.0, 1.1, mat.white, H.w - 0.7, 1.0, 3.5));
  scene.add(box(0.05, 1.8, 0.08, mat.metal, H.w - 1.18, 1.0, 3.5));
  scene.add(box(0.7, 0.18, 0.7, new THREE.MeshStandardMaterial({ color: 0xe8c27a, roughness: 0.8 }), H.w - 1.4, 1.7, 3.5)); // sandwiches on top

  // Purification supplies (front-right floor): bucket + bleach + bottles
  scene.add(cyl(0.35, 0.28, 0.6, new THREE.MeshStandardMaterial({ color: 0x9aa3ad }), 3.4, 0.3, 6.4, 14));
  scene.add(box(0.22, 0.4, 0.22, new THREE.MeshStandardMaterial({ color: 0xf2f4f0 }), 3.9, 0.2, 6.4));
  scene.add(box(0.18, 0.34, 0.18, new THREE.MeshStandardMaterial({ color: 0x7fd0a0 }), 3.0, 0.17, 6.5));

  // Overhead pipes (run across ceiling)
  const pipeMat = mat.metal;
  for (const z of [-3.0, -1.0]) {
    const p = cyl(0.16, 0.16, ROOM.w - 1.5, pipeMat, 0, 4.1, z, 12);
    p.rotation.z = Math.PI / 2;
    scene.add(p);
  }
  const vert = cyl(0.16, 0.16, 1.8, pipeMat, -5, 3.2, -3.0, 12);
  scene.add(vert);

  // Candle shelf (left wall, front-left)
  scene.add(box(0.3, 0.08, 1.4, mat.wood, -H.w + 0.4, 1.1, 5.5));
  for (const dz of [-0.4, 0, 0.4]) {
    scene.add(cyl(0.06, 0.06, 0.22, new THREE.MeshStandardMaterial({ color: 0xf0e4c0 }), -H.w + 0.45, 1.26, 5.5 + dz, 8));
  }

  // Blocked stairwell rubble (front-left corner)
  buildRubble(-3.2, 6.6);

  buildStations.built = true;
}

function buildRubble(cx, cz) {
  const group = new THREE.Group();
  // Stairwell frame
  group.add(box(2.6, 3.4, 0.3, mat.darkMetal, cx, 1.7, cz + 0.9));
  // Pile of chunks
  for (let i = 0; i < 26; i++) {
    const s = 0.3 + Math.random() * 0.6;
    const chunk = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), mat.rubble);
    chunk.position.set(
      cx + (Math.random() - 0.5) * 2.4,
      0.2 + Math.random() * 2.6,
      cz + (Math.random() - 0.5) * 1.2
    );
    chunk.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    chunk.castShadow = true;
    chunk.receiveShadow = true;
    group.add(chunk);
  }
  scene.add(group);
}

// -----------------------------------------------------------------------------
// Glowing clickable hotspots (raycast targets)
// -----------------------------------------------------------------------------
const hotspotMeshes = [];

function buildHotspots() {
  for (const h of HOTSPOTS) {
    const group = new THREE.Group();
    group.position.set(...h.position);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.22, 1),
      new THREE.MeshStandardMaterial({
        color: h.color,
        emissive: h.color,
        emissiveIntensity: 1.1,
        roughness: 0.3,
      })
    );
    group.add(core);

    // Transparent halo
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 16, 12),
      new THREE.MeshBasicMaterial({
        color: h.color,
        transparent: true,
        opacity: 0.16,
      })
    );
    group.add(halo);

    // Floating ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.03, 8, 28),
      new THREE.MeshBasicMaterial({ color: h.color, transparent: true, opacity: 0.6 })
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    group.userData = { hotspot: h, core, halo, ring, baseY: h.position[1] };
    scene.add(group);
    hotspotMeshes.push(group);
  }
}

// =============================================================================
// RAYCASTING (hover + click)
// =============================================================================
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;

function updatePointer(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function pickHotspot() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(hotspotMeshes, true);
  if (!hits.length) return null;
  // Walk up to the group that owns the hotspot.
  let obj = hits[0].object;
  while (obj && !obj.userData.hotspot) obj = obj.parent;
  return obj || null;
}

function onPointerMove(event) {
  if (isModalOpen()) return;
  updatePointer(event);
  const group = pickHotspot();
  if (group !== hovered) {
    hovered = group;
    if (group) {
      const { hotspot } = group.userData;
      const done = state.investigated.has(hotspot.id);
      setScanner(`${hotspot.label}${done ? ' · investigated ✓' : ' · click to investigate'}`);
      dom.canvas.style.cursor = 'pointer';
      audio.hover();
    } else {
      setScanner('Hover an object to scan it…');
      dom.canvas.style.cursor = 'grab';
    }
  }
}

function onClick(event) {
  if (isModalOpen()) return;
  updatePointer(event);
  const group = pickHotspot();
  if (group) openQuiz(group.userData.hotspot);
}

function setScanner(text) {
  dom.scannerText.textContent = text;
}

// =============================================================================
// UI: checklist, readiness
// =============================================================================
function buildChecklist() {
  dom.checklistItems.innerHTML = '';
  for (const h of HOTSPOTS) {
    const li = document.createElement('li');
    li.dataset.id = h.id;
    li.innerHTML = `<span class="tick">✓</span><span>${h.label}</span>`;
    dom.checklistItems.appendChild(li);
  }
  refreshChecklist();
}

function refreshChecklist() {
  for (const li of dom.checklistItems.children) {
    li.classList.toggle('done', state.investigated.has(li.dataset.id));
  }
  dom.checklistCount.textContent = `${state.investigated.size} / ${TOTAL_HOTSPOTS} stations investigated`;
  refreshReadiness();
}

// Rescue readiness blends investigation progress with correct answers,
// plus a bonus once the ranking board has been submitted.
function refreshReadiness() {
  const invest = state.investigated.size / TOTAL_HOTSPOTS;
  const correct = state.answered.size / CARDS.length;
  let pct = Math.round((invest * 0.5 + correct * 0.35) * 100);
  if (state.submitted) pct += 15;
  pct = Math.min(100, pct);
  dom.readinessPct.textContent = `${pct}%`;
  dom.readinessFill.style.width = `${pct}%`;
  return pct;
}

// =============================================================================
// MODAL SYSTEM
// =============================================================================
function isModalOpen() {
  return !dom.modal.hidden;
}

function openModal(html, wide = false) {
  dom.modalBody.innerHTML = html;
  dom.modal.hidden = false;
  dom.modal.classList.toggle('wide', wide);
  dom.modalClose.focus();
}

function closeModal() {
  dom.modal.hidden = true;
  dom.modal.classList.remove('wide');
}

dom.modalClose.addEventListener('click', closeModal);
dom.modal.addEventListener('click', (e) => {
  if (e.target === dom.modal) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isModalOpen()) closeModal();
});

// -----------------------------------------------------------------------------
// Quiz modal
// -----------------------------------------------------------------------------
function openQuiz(hotspot) {
  const card = CARD_BY_ID[hotspot.cardId];
  const already = state.answered.has(card.id);

  const choicesHtml = card.choices
    .map(
      (c, i) =>
        `<button class="choice" data-index="${i}" data-correct="${c.isCorrect}">${c.text}</button>`
    )
    .join('');

  openModal(`
    <p class="modal-kicker">Station · ${hotspot.label}</p>
    <h2>${card.short}</h2>
    <p class="quiz-question">${card.question}</p>
    <div class="quiz-choices">${choicesHtml}</div>
    <div class="feedback" id="quiz-feedback"></div>
    <div class="modal-actions">
      <button class="btn" id="quiz-board">Open Ranking Board</button>
      <button class="btn btn-primary" id="quiz-done">Continue</button>
    </div>
  `);

  // Mark investigated immediately on open.
  const firstTime = !state.investigated.has(hotspot.id);
  state.investigated.add(hotspot.id);
  refreshChecklist();
  audio.open();
  if (firstTime) track('investigate', { station: hotspot.id, card: hotspot.cardId });

  const feedback = document.getElementById('quiz-feedback');
  const buttons = [...dom.modalBody.querySelectorAll('.choice')];

  const reveal = (chosen, silent = false) => {
    buttons.forEach((b) => {
      b.disabled = true;
      const correct = b.dataset.correct === 'true';
      if (correct) b.classList.add('correct');
      if (b === chosen && !correct) b.classList.add('incorrect');
    });
    const isCorrect = chosen.dataset.correct === 'true';
    feedback.className = `feedback show ${isCorrect ? 'ok' : 'no'}`;
    feedback.innerHTML = `
      <strong>${isCorrect ? '✓ Correct.' : '✗ Reconsider.'}</strong>
      ${isCorrect ? card.feedback.correct : card.feedback.incorrect}
      <div class="clue"><strong>Expert clue:</strong> ${card.clue}</div>
    `;
    if (isCorrect) {
      state.answered.add(card.id);
      announce(`Correct answer for ${card.short}.`);
    }
    if (!silent) {
      if (isCorrect) audio.correct();
      else audio.incorrect();
      track('answer', { card: card.id, correct: isCorrect });
    }
    refreshReadiness();
    maybeCelebrate();
  };

  buttons.forEach((b) => b.addEventListener('click', () => reveal(b)));

  // If they already answered correctly, show the clue right away (no re-scoring).
  if (already) {
    const correctBtn = buttons.find((b) => b.dataset.correct === 'true');
    reveal(correctBtn, true);
  }

  document.getElementById('quiz-done').addEventListener('click', closeModal);
  document.getElementById('quiz-board').addEventListener('click', openBoard);
}

// =============================================================================
// RANKING BOARD (drag-and-drop + accessible arrow controls)
// =============================================================================
function openBoard() {
  const itemsHtml = state.boardOrder
    .map((id, idx) => renderRankItem(CARD_BY_ID[id], idx))
    .join('');

  openModal(
    `
    <p class="modal-kicker">Team Decision</p>
    <h2>Ranking Board</h2>
    <p class="board-intro">
      Drag the cards (or use the ▲ ▼ buttons) to order all 12 survival actions
      from <strong>most helpful</strong> to <strong>most dangerous</strong>.
      When you are ready, submit to compare with the rescue experts.
    </p>
    <div class="board-legend"><span class="best">1 · Best / most helpful</span><span class="worst">12 · Worst / most dangerous</span></div>
    <ol class="ranking-list" id="ranking-list">${itemsHtml}</ol>
    <div class="modal-actions">
      <button class="btn btn-ghost" id="board-shuffle">Shuffle</button>
      <button class="btn btn-primary" id="board-submit">Submit &amp; Score</button>
    </div>
  `,
    true
  );

  wireBoard();
}

function renderRankItem(card, idx) {
  return `
    <li class="rank-item" draggable="true" data-id="${card.id}">
      <span class="rank-num">${idx + 1}</span>
      <span class="rank-text">${card.action}</span>
      <span class="rank-move">
        <button class="rank-up" aria-label="Move up" ${idx === 0 ? 'disabled' : ''}>▲</button>
        <button class="rank-down" aria-label="Move down" ${idx === state.boardOrder.length - 1 ? 'disabled' : ''}>▼</button>
      </span>
      <span class="rank-handle" aria-hidden="true">⋮⋮</span>
    </li>`;
}

function rerenderBoard() {
  const list = document.getElementById('ranking-list');
  if (!list) return;
  list.innerHTML = state.boardOrder
    .map((id, idx) => renderRankItem(CARD_BY_ID[id], idx))
    .join('');
  wireBoardItems(list);
}

function wireBoard() {
  const list = document.getElementById('ranking-list');
  wireBoardItems(list);
  document.getElementById('board-submit').addEventListener('click', submitRanking);
  document.getElementById('board-shuffle').addEventListener('click', () => {
    for (let i = state.boardOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.boardOrder[i], state.boardOrder[j]] = [state.boardOrder[j], state.boardOrder[i]];
    }
    rerenderBoard();
  });
}

let dragId = null;

function wireBoardItems(list) {
  const items = [...list.querySelectorAll('.rank-item')];

  items.forEach((item) => {
    item.addEventListener('dragstart', () => {
      dragId = item.dataset.id;
      item.classList.add('dragging');
    });
    item.addEventListener('dragend', () => {
      dragId = null;
      item.classList.remove('dragging');
      items.forEach((i) => i.classList.remove('drop-target'));
    });
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      item.classList.add('drop-target');
    });
    item.addEventListener('dragleave', () => item.classList.remove('drop-target'));
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drop-target');
      reorder(dragId, item.dataset.id);
    });

    item.querySelector('.rank-up').addEventListener('click', () => move(item.dataset.id, -1));
    item.querySelector('.rank-down').addEventListener('click', () => move(item.dataset.id, 1));
  });
}

function reorder(fromId, toId) {
  if (!fromId || fromId === toId) return;
  const order = state.boardOrder;
  const from = order.indexOf(fromId);
  const to = order.indexOf(toId);
  order.splice(from, 1);
  order.splice(to, 0, fromId);
  rerenderBoard();
}

function move(id, dir) {
  const order = state.boardOrder;
  const i = order.indexOf(id);
  const j = i + dir;
  if (j < 0 || j >= order.length) return;
  [order[i], order[j]] = [order[j], order[i]];
  rerenderBoard();
}

// =============================================================================
// SCORING (worksheet method: sum of |playerRank - expertRank|)
// =============================================================================
function computeScore() {
  const rows = state.boardOrder.map((id, idx) => {
    const card = CARD_BY_ID[id];
    const playerRank = idx + 1;
    const diff = Math.abs(playerRank - card.expertRank);
    return { card, playerRank, expertRank: card.expertRank, diff };
  });
  const total = rows.reduce((sum, r) => sum + r.diff, 0);
  return { rows, total };
}

function ratingFor(total) {
  // Best possible is 0; worst is 72. Provide classroom-friendly bands.
  if (total <= 8) return { label: 'Elite Rescue Coordinator', cls: 'good', blurb: 'Outstanding — your priorities closely match the experts.' };
  if (total <= 20) return { label: 'Strong Survivor', cls: 'good', blurb: 'Great instincts. A few actions are out of order.' };
  if (total <= 34) return { label: 'Capable but Risky', cls: 'warn', blurb: 'You would likely survive, but some choices cost precious time.' };
  if (total <= 48) return { label: 'In Danger', cls: 'warn', blurb: 'Several priorities are reversed — review the expert reasoning.' };
  return { label: 'Critical Mistakes', cls: 'danger', blurb: 'Key safety steps are badly mis-ranked. Study the expert key.' };
}

function diffClass(diff) {
  if (diff === 0) return 'diff-0';
  if (diff <= 2) return 'diff-low';
  if (diff <= 5) return 'diff-mid';
  return 'diff-high';
}

function submitRanking() {
  state.submitted = true;
  const score = computeScore();
  state.lastScore = score;
  audio.submit();
  refreshReadiness();
  updateExpertButton();

  // Record the submission + a snapshot of which questions were answered right.
  const ranking = score.rows
    .slice()
    .sort((a, b) => a.playerRank - b.playerRank)
    .map((r) => ({ rank: r.playerRank, action: r.card.action, expert: r.expertRank, diff: r.diff }));
  const answers = {};
  for (const c of CARDS) answers[c.id] = state.answered.has(c.id);
  saveSubmission(playerName, score.total, ranking, answers);
  track('submit', { score: score.total, answeredCorrect: state.answered.size });

  showResults(score);
  announce(`Ranking submitted. Your score is ${score.total}. Lower is better.`);
}

function showResults(score) {
  const rating = ratingFor(score.total);
  // Display table sorted by the player's own ranking (1..12).
  const sorted = [...score.rows].sort((a, b) => a.playerRank - b.playerRank);
  const rowsHtml = sorted
    .map(
      (r) => `
      <tr>
        <td class="center">${r.playerRank}</td>
        <td>${r.card.action}</td>
        <td class="center">${r.expertRank}</td>
        <td class="center"><span class="diff-pill ${diffClass(r.diff)}">${r.diff}</span></td>
      </tr>`
    )
    .join('');

  const perfect = score.total === 0;

  openModal(
    `
    <p class="modal-kicker">Worksheet Results</p>
    <h2>Rescue Readiness Report</h2>

    ${perfect ? '<div class="mission-complete"><div class="big">🏆 Perfect Match!</div></div>' : ''}

    <div class="score-summary">
      <div class="score-chip headline">
        <div class="num">${score.total}</div>
        <div class="lbl">Total Score (lower is better)</div>
      </div>
      <div class="score-chip">
        <div class="num">${state.answered.size}/${CARDS.length}</div>
        <div class="lbl">Station questions correct</div>
      </div>
      <div class="score-chip">
        <div class="num">${refreshReadiness()}%</div>
        <div class="lbl">Rescue readiness</div>
      </div>
    </div>

    <div class="score-rating"><strong>${rating.label}.</strong> ${rating.blurb}</div>

    <div class="table-wrap">
      <table class="score-table">
        <thead>
          <tr>
            <th class="center">Player Rank</th>
            <th>Action</th>
            <th class="center">Expert Rank</th>
            <th class="center">|Diff.|</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align:right;font-weight:700">Total Score</td>
            <td class="center"><span class="diff-pill ${diffClass(score.total > 5 ? 6 : score.total)}">${score.total}</span></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="mission-complete" style="margin-top:18px">
      <p>${perfect ? 'Flawless prioritization — the whole team makes it out safely.' : 'Compare your order with the experts, then try to lower your score.'}</p>
    </div>

    <div class="modal-actions">
      <button class="btn" id="results-expert">View Expert Key</button>
      <button class="btn" id="results-download">Download Report (.txt)</button>
      <button class="btn btn-primary" id="results-retry">Adjust Ranking</button>
    </div>
  `,
    true
  );

  document.getElementById('results-expert').addEventListener('click', () => openExpert());
  document.getElementById('results-download').addEventListener('click', () => downloadReport(score));
  document.getElementById('results-retry').addEventListener('click', openBoard);
}

// -----------------------------------------------------------------------------
// Downloadable text report
// -----------------------------------------------------------------------------
function downloadReport(score) {
  const rating = ratingFor(score.total);
  const sorted = [...score.rows].sort((a, b) => a.playerRank - b.playerRank);
  const line = '-'.repeat(78);
  const dateStr = new Date().toLocaleString();

  let txt = '';
  txt += 'S.T.A.R. EARTHQUAKE RESCUE LAB - SURVIVAL RANKING REPORT\n';
  txt += `${line}\n`;
  txt += `Generated: ${dateStr}\n`;
  txt += `Total Score (sum of |Player - Expert|, lower is better): ${score.total}\n`;
  txt += `Rating: ${rating.label} - ${rating.blurb}\n`;
  txt += `Station questions answered correctly: ${state.answered.size}/${CARDS.length}\n`;
  txt += `${line}\n`;
  txt += pad('PLAYER', 8) + pad('EXPERT', 8) + pad('DIFF', 6) + 'ACTION\n';
  txt += `${line}\n`;
  for (const r of sorted) {
    txt += pad(String(r.playerRank), 8) + pad(String(r.expertRank), 8) + pad(String(r.diff), 6) + r.card.action + '\n';
  }
  txt += `${line}\n`;
  txt += pad('', 16) + pad(String(score.total), 6) + 'TOTAL SCORE\n';
  txt += `${line}\n\n`;
  txt += 'EXPERT REASONING\n';
  txt += `${line}\n`;
  for (const c of [...CARDS].sort((a, b) => a.expertRank - b.expertRank)) {
    txt += `${c.expertRank}. ${c.action}\n   ${c.clue}\n`;
  }

  const blob = new Blob([txt], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `star-rescue-report-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('Report downloaded.', 'good');
  track('download', { score: score.total });
}

function pad(s, n) {
  return (s + ' '.repeat(n)).slice(0, n);
}

// =============================================================================
// EXPERT KEY (instructor reveal) - locked until submission or instructor key
// =============================================================================

// Gate entry: allow if the player has submitted, otherwise ask for the key.
function requestExpert() {
  audio.click();
  if (state.submitted) {
    openExpert('submission');
    return;
  }
  openExpertGate();
}

function openExpertGate() {
  openModal(`
    <p class="modal-kicker">Locked · Instructor Only</p>
    <h2>🔒 Expert Key is Locked</h2>
    <p class="board-intro">
      The expert order stays hidden until you <strong>submit your ranking</strong> —
      or enter the instructor key to reveal it now.
    </p>
    <div class="gate">
      <label for="gate-input" class="gate-label">Instructor key</label>
      <input id="gate-input" class="gate-input" type="password" autocomplete="off" placeholder="Enter key" />
      <div class="feedback" id="gate-feedback"></div>
    </div>
    <div class="modal-actions">
      <button class="btn" id="gate-board">Go to Ranking Board</button>
      <button class="btn btn-primary" id="gate-submit">Unlock</button>
    </div>
  `);

  const input = document.getElementById('gate-input');
  input.focus();
  const tryUnlock = () => {
    if (input.value.trim() === INSTRUCTOR_KEY) {
      audio.unlocked();
      openExpert('key');
    } else {
      const fb = document.getElementById('gate-feedback');
      fb.className = 'feedback show no';
      fb.textContent = 'Incorrect key. Ask your instructor, or submit your answers to unlock.';
      audio.incorrect();
      input.select();
      track('expert_locked_attempt', {});
    }
  };
  document.getElementById('gate-submit').addEventListener('click', tryUnlock);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') tryUnlock();
  });
  document.getElementById('gate-board').addEventListener('click', openBoard);
}

function openExpert(via = 'submission') {
  track('view_expert', { via });
  const ordered = [...CARDS].sort((a, b) => a.expertRank - b.expertRank);
  const itemsHtml = ordered
    .map(
      (c) => `
      <li>
        <span class="expert-rank">${c.expertRank}</span>
        <span class="expert-body">${c.action}<span class="why">${c.clue}</span></span>
      </li>`
    )
    .join('');

  openModal(
    `
    <p class="modal-kicker">Instructor Reveal</p>
    <h2>Expert Order &amp; Reasoning</h2>
    <p class="board-intro">The official S.T.A.R. ranking from <strong>1 (most helpful)</strong> to <strong>12 (most dangerous)</strong>, with the reasoning rescue specialists use.</p>
    <ol class="expert-list">${itemsHtml}</ol>
    <div class="modal-actions">
      <button class="btn btn-primary" id="expert-close">Close</button>
    </div>
  `,
    true
  );
  document.getElementById('expert-close').addEventListener('click', closeModal);
}

// =============================================================================
// HELP
// =============================================================================
function openHelp() {
  openModal(`
    <p class="modal-kicker">How to Play</p>
    <h2>Mission Briefing &amp; Controls</h2>
    <p>${SCENARIO.intro}</p>
    <h3>Controls</h3>
    <ul class="help-list">
      <li><strong>Drag</strong> with the mouse to orbit the basement; <strong>scroll</strong> to zoom.</li>
      <li><strong>Click a glowing marker</strong> to investigate a station and answer a survival question.</li>
      <li>Open the <strong>Ranking Board</strong> to drag the 12 action cards into priority order.</li>
      <li><strong>Submit &amp; Score</strong> compares your order with the experts using the worksheet method.</li>
    </ul>
    <h3>Scoring</h3>
    <p>For every card we take the absolute difference between your rank and the expert rank, then add them all up. <strong>A lower total score is better</strong> — a perfect match scores 0.</p>
    <h3>Expert Key</h3>
    <p>The expert order stays <strong>locked</strong> until you submit your ranking (or your instructor enters their key). Sound can be toggled any time with the <strong>🔊 Sound</strong> button.</p>
    <h3>Sign-in &amp; progress</h3>
    <p>You sign in once with your name; your activity is recorded for the weekly exercise. Returning on the same device skips the sign-in automatically.</p>
    <h3>Alerts</h3>
    <p>Use <strong>Enable Alerts</strong> in the toolbar to receive rescue-drill reminders as system notifications — even after you close this tab (where your browser supports background notifications).</p>
    <div class="modal-actions">
      <button class="btn btn-primary" id="help-close">Got it</button>
    </div>
  `);
  document.getElementById('help-close').addEventListener('click', closeModal);
}

// =============================================================================
// RESET
// =============================================================================
function resetGame() {
  audio.click();
  state.investigated.clear();
  state.answered.clear();
  state.boardOrder = [...INITIAL_BOARD_ORDER];
  state.submitted = false;
  state.lastScore = null;
  celebrated = false;
  refreshChecklist();
  refreshReadiness();
  updateExpertButton();
  setScanner('Hover an object to scan it…');
  closeModal();
  toast('Mission reset.', 'warn');
  track('reset', {});
}

// =============================================================================
// Celebration when everything is complete
// =============================================================================
let celebrated = false;
function maybeCelebrate() {
  if (celebrated) return;
  if (state.answered.size === CARDS.length && state.submitted) {
    celebrated = true;
    toast('🎉 All stations cleared and ranking submitted — mission complete!', 'good', 5000);
  }
}

// =============================================================================
// Toast + live region
// =============================================================================
let toastEl = null;
let toastTimer = null;
function toast(msg, kind = '', ms = 2600) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.className = `toast ${kind}`;
  toastEl.textContent = msg;
  // force reflow for re-trigger
  void toastEl.offsetWidth;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
}

function announce(msg) {
  dom.live.textContent = '';
  setTimeout(() => (dom.live.textContent = msg), 30);
}

// =============================================================================
// HUD wiring
// =============================================================================
dom.btnBoard.addEventListener('click', () => {
  audio.click();
  openBoard();
});
dom.btnExpert.addEventListener('click', requestExpert);
dom.btnHelp.addEventListener('click', () => {
  audio.click();
  openHelp();
});
dom.btnReset.addEventListener('click', resetGame);

// Reflect the locked/unlocked state on the Expert Key button.
function updateExpertButton() {
  dom.btnExpert.textContent = state.submitted ? 'Expert Key' : '🔒 Expert Key';
  dom.btnExpert.title = state.submitted
    ? 'View the expert order and reasoning.'
    : 'Locked - submit your ranking or enter the instructor key.';
}

// Sound on/off toggle.
function refreshSoundButton() {
  const muted = audio.isMuted();
  dom.btnSound.textContent = muted ? '🔇 Muted' : '🔊 Sound';
  dom.btnSound.setAttribute('aria-pressed', String(!muted));
}
dom.btnSound.addEventListener('click', () => {
  const muted = audio.toggleMute();
  if (!muted) audio.click();
  refreshSoundButton();
});
refreshSoundButton();

// -----------------------------------------------------------------------------
// One-time name sign-in (intro)
// -----------------------------------------------------------------------------
function setupIntro() {
  if (playerName) {
    // Returning operative - greet them and skip re-registration.
    dom.introGreeting.textContent = `Welcome back, ${playerName}. Ready for this week's drill?`;
    dom.introGreeting.hidden = false;
    dom.introLogin.hidden = true;
    dom.introStart.textContent = 'Re-enter the Basement';
  } else {
    dom.introName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') dom.introStart.click();
    });
  }
}

async function handleSignIn() {
  audio.unlock(); // create the AudioContext from this user gesture
  audio.click();

  let name = playerName;
  if (!name) {
    name = (dom.introName.value || '').trim();
    if (!name) {
      dom.introName.focus();
      toast('Please enter your name to begin.', 'warn');
      return;
    }
  }

  dom.introStart.disabled = true;
  const original = dom.introStart.textContent;
  dom.introStart.textContent = 'Signing in…';

  const result = await registerPlayer(name);
  playerName = name;
  localStorage.setItem(PLAYER_KEY, name);
  track(result.returning ? 'login' : 'register', { returning: !!result.returning });

  dom.introStart.disabled = false;
  dom.introStart.textContent = original;
  enterGame();
}

function enterGame() {
  dom.intro.hidden = true;
  dom.hud.hidden = false;
  dom.checklist.hidden = false;

  dom.playerChip.hidden = false;
  dom.playerChip.innerHTML = `<span class="player-dot"></span> Operative: <strong>${playerName}</strong> · Week ${WEEK}${
    supaEnabled ? '' : ' · local'
  }`;

  updateExpertButton();
  audio.startAmbient();
  audio.unlocked();
}

dom.introStart.addEventListener('click', handleSignIn);
setupIntro();

// =============================================================================
// BACKGROUND NOTIFICATIONS (service worker + reminders)
// Registered from notify.js so the game logic stays focused.
// =============================================================================
import { initNotifications } from './notify.js';
initNotifications({ toast, dom });

// =============================================================================
// Atmosphere: drifting dust motes + a flashlight pool over the planning table
// =============================================================================
let dustPoints = null;

function buildAtmosphere() {
  const COUNT = 420;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * (ROOM.w - 1);
    positions[i * 3 + 1] = Math.random() * (ROOM.h - 0.5);
    positions[i * 3 + 2] = (Math.random() - 0.5) * (ROOM.d - 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const map = makeDustSprite();
  dustPoints = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: 0.08,
      map,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: 0xbcd0f0,
    })
  );
  scene.add(dustPoints);

  // A warm flashlight cone resting on the planning table for depth.
  const flashlight = new THREE.SpotLight(0xffe6b0, 22, 16, Math.PI / 7, 0.5, 1.6);
  flashlight.position.set(-3.2, 3.4, 3.6);
  flashlight.target.position.set(0, 1.0, 1.0);
  scene.add(flashlight);
  scene.add(flashlight.target);
}

// Tiny radial-gradient sprite so dust motes look soft, generated on a canvas.
function makeDustSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

// =============================================================================
// Build the world + animate
// =============================================================================
buildRoom();
buildStations();
addHumans();
buildHotspots();
buildAtmosphere();
buildChecklist();

renderer.domElement.addEventListener('pointermove', onPointerMove);
renderer.domElement.addEventListener('click', onClick);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Animate hotspot markers (bob, spin, pulse).
  for (const g of hotspotMeshes) {
    const ud = g.userData;
    g.position.y = ud.baseY + Math.sin(t * 2 + ud.baseY) * 0.12;
    ud.core.rotation.y = t * 1.2;
    ud.core.rotation.x = t * 0.6;
    ud.ring.rotation.z = t * 0.8;
    const pulse = 1 + Math.sin(t * 3 + ud.baseY) * 0.18;
    ud.halo.scale.setScalar(pulse);
    const done = state.investigated.has(ud.hotspot.id);
    ud.core.material.emissiveIntensity = done ? 0.5 : 1.0 + Math.sin(t * 4) * 0.3;
    ud.halo.material.opacity = done ? 0.06 : 0.16;
  }

  // Flicker the emergency lamp.
  emergencyLamp.intensity = 1.0 + Math.sin(t * 13) * 0.12 + Math.sin(t * 27) * 0.06;

  // Drift the dust motes slowly upward and recycle them at the ceiling.
  if (dustPoints) {
    const pos = dustPoints.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + 0.0016 + Math.sin(t * 0.5 + i) * 0.0006;
      let x = pos.getX(i) + Math.sin(t * 0.2 + i) * 0.0008;
      if (y > ROOM.h - 0.3) y = 0.2;
      pos.setY(i, y);
      pos.setX(i, x);
    }
    pos.needsUpdate = true;
    dustPoints.rotation.y = t * 0.01;
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();
