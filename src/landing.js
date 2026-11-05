import * as THREE from 'three';
import { BRAND, CUE_STYLES } from './config.js';
import { createHangingCueRack } from './avatar.js';
import { rockGeometry, rockMaterial, rng } from './scenery.js';
import { el, loadProfile, saveProfile } from './util.js';

function buildLandingScene(scene) {
  scene.background = new THREE.Color('#0c0f14');
  scene.fog = new THREE.Fog('#0c0f14', 16, 42);

  scene.add(new THREE.HemisphereLight('#60a5fa', '#1e293b', 1.8));

  // Warm golden directional spotlight illuminating the entrance
  const spot = new THREE.DirectionalLight('#fef08a', 2.8);
  spot.position.set(6, 12, 8);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  Object.assign(spot.shadow.camera, { left: -14, right: 14, top: 14, bottom: -6 });
  scene.add(spot);

  // Black slate floor of VIP lounge
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(55, 48),
    new THREE.MeshStandardMaterial({ color: '#161920', roughness: 0.85, metalness: 0.1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Simonis Electric Blue carpet runway leading into the arena
  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 22),
    new THREE.MeshStandardMaterial({ color: BRAND.cloth, roughness: 0.95 }),
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.01, -2);
  carpet.receiveShadow = true;
  scene.add(carpet);

  // Rock archway of the underground arena portal
  const rand = rng(42);
  const rockMat = rockMaterial('#232730');
  const rocks = new THREE.Group();
  const arch = [];
  for (let i = 0; i <= 18; i++) {
    const a = Math.PI * (i / 18);
    arch.push([Math.cos(a) * 5.0, Math.sin(a) * 4.8]);
  }
  arch.forEach(([x, y], i) => {
    const r = 1.1 + rand() * 0.45;
    const m = new THREE.Mesh(rockGeometry(r, 120 + i, 1, 0.25), rockMat);
    m.position.set(x * 1.1, y, -0.6 + rand() * 0.5);
    m.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    m.castShadow = m.receiveShadow = true;
    rocks.add(m);
  });

  // Flanking cavern rock formations
  for (let i = 0; i < 28; i++) {
    const r = 2.6 + rand() * 3.6;
    const m = new THREE.Mesh(rockGeometry(r, 400 + i, 1, 0.3), rockMat);
    const side = i % 2 ? 1 : -1;
    const spread = 4.5 + rand() * 12;
    m.position.set(side * spread, rand() * 5 + (i < 8 ? 4 : 0), -4 - rand() * 6);
    if (i < 6) {
      m.position.x = (rand() - 0.5) * 8;
      m.position.y = 6.5 + rand() * 4;
    }
    const reach = r * 1.35 + 3.8;
    const dist = Math.hypot(m.position.x, m.position.y);
    if (dist < reach) {
      const k = reach / Math.max(dist, 0.1);
      m.position.x *= k;
      m.position.y *= k;
    }
    m.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    m.castShadow = m.receiveShadow = true;
    rocks.add(m);
  }
  scene.add(rocks);

  // Deep portal tunnel into the arena with Simonis blue glow
  const tunnel = new THREE.Mesh(
    new THREE.CylinderGeometry(3.6, 3.6, 10, 24, 1, true, Math.PI / 2, Math.PI),
    new THREE.MeshStandardMaterial({ color: '#090d14', side: THREE.BackSide, roughness: 1 }),
  );
  tunnel.rotation.x = Math.PI / 2;
  tunnel.rotation.z = Math.PI;
  tunnel.position.set(0, 0, -5);
  scene.add(tunnel);

  const glowLight = new THREE.PointLight('#38bdf8', 22, 14, 1.6);
  glowLight.position.set(0, 1.2, -6.5);
  scene.add(glowLight);

  // Stone monument slab featuring the official Rasson Bearbrick logo
  const loader = new THREE.TextureLoader();
  const logoTexture = loader.load(BRAND.logo || '/images/logo.png');
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  logoTexture.minFilter = THREE.LinearMipmapLinearFilter;

  const slab = new THREE.Mesh(new THREE.BoxGeometry(3.3, 3.3, 0.35), rockMaterial('#1c202a'));
  slab.position.set(-5.0, 2.2, 2.2);
  slab.castShadow = true;
  scene.add(slab);

  // Rasson logo display face
  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(2.9, 2.9),
    new THREE.MeshStandardMaterial({ map: logoTexture, roughness: 0.45, metalness: 0.1 }),
  );
  signFace.position.set(-5.0, 2.2, 2.39);
  scene.add(signFace);

  // Gold metallic frame around logo
  const goldFrame = new THREE.Mesh(
    new THREE.BoxGeometry(3.04, 3.04, 0.08),
    new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.9, roughness: 0.2 }),
  );
  goldFrame.position.set(-5.0, 2.2, 2.36);
  scene.add(goldFrame);

  const base = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 1.3), rockMaterial('#181b24'));
  base.position.set(-5.0, 0.25, 2.2);
  base.castShadow = base.receiveShadow = true;
  scene.add(base);

  // Floor-standing cue rack to the right of portal
  const cueRack = createHangingCueRack();
  cueRack.position.set(5.2, 0, 2.2);
  cueRack.scale.setScalar(1.2);
  scene.add(cueRack);

  // Levitating 3D 8-ball and 9-ball decorative display
  const ballSphere = new THREE.SphereGeometry(0.7, 32, 24);
  const ballMat8 = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.2, metalness: 0.1 });
  const ballMat9 = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.2, metalness: 0.1 });

  const ball8 = new THREE.Mesh(ballSphere, ballMat8);
  ball8.position.set(-2.8, 1.2, 1.5);
  ball8.castShadow = true;
  scene.add(ball8);

  const ball9 = new THREE.Mesh(ballSphere, ballMat9);
  ball9.position.set(2.8, 1.2, 1.5);
  ball9.castShadow = true;
  scene.add(ball9);

  return { ball8, ball9, cueRack };
}

/**
 * Player Profile modal dialog (Player Name & Cue Stick Selection).
 * Title: "Race 27 Gia Dinh".
 * Displays official Bearbrick Rasson logo.
 * Lucky ball number (1-15) is randomly assigned behind the scenes.
 */
function nameDialog(root, onSubmit) {
  const saved = loadProfile();
  const nameInput = el('input', {
    maxLength: 30,
    placeholder: 'Nhập tên hoặc biệt danh cơ thủ…',
    autocomplete: 'off',
    value: saved.name || '',
  });

  // Tournament cue stick selection (Default: Ngoc My)
  const cueSelect = el(
    'select',
    { className: 'select-input' },
    ...CUE_STYLES.map((c) => el('option', { value: c.id, selected: c.id === (saved.cueStyle || 'ngocmy') }, c.name)),
  );

  const counter = el('div', { className: 'counter' });
  const submit = el('button', { className: 'btn btn-primary', type: 'submit' }, 'Vào Đấu Trường 🎱');
  const cancel = el('button', { className: 'btn btn-ghost', type: 'button' }, 'Huỷ');

  function refresh() {
    counter.textContent = `${nameInput.value.length}/30 ký tự`;
    submit.disabled = !nameInput.value.trim();
  }

  nameInput.addEventListener('input', refresh);

  const form = el(
    'form',
    { className: 'modal' },
    el(
      'div',
      { className: 'modal-brand-row' },
      el('img', { src: BRAND.logo || '/images/logo.png', alt: 'Rasson Logo', className: 'modal-logo-img' }),
      el(
        'div',
        {},
        el('div', { className: 'eyebrow' }, 'HỒ SƠ CƠ THỦ THI ĐẤU'),
        el('h2', { style: 'margin:0' }, 'Race 27 Gia Đình'),
      ),
    ),
    el('label', { style: 'margin-top:10px' }, 'Tên hiển thị của cơ thủ'),
    nameInput,
    counter,
    el('label', { style: 'margin-top:14px' }, 'Gậy cơ thi đấu'),
    cueSelect,
    el('div', { className: 'actions', style: 'margin-top:22px' }, cancel, submit),
  );

  const backdrop = el('div', { className: 'modal-backdrop' }, form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!nameInput.value.trim()) return;

    // Random lucky ball number (1-15)
    const randomBall = Math.floor(Math.random() * 15) + 1;
    const profile = {
      name: nameInput.value.trim().slice(0, 30),
      number: randomBall,
      cueStyle: cueSelect.value || 'ngocmy',
    };
    saveProfile(profile);
    backdrop.remove();
    onSubmit(profile);
  });

  cancel.addEventListener('click', () => backdrop.remove());
  backdrop.addEventListener('pointerdown', (e) => e.target === backdrop && backdrop.remove());

  root.append(backdrop);
  refresh();
  nameInput.focus();
}

/**
 * Mounts 3D landing page scene and UI panels.
 */
export function mountLanding(app, { onEnter }) {
  const stage = el('div', { className: 'stage' });
  const online = el('b', {}, '…');
  const enterBtn = el('button', { className: 'btn btn-primary btn-enter', type: 'button' }, 'Vào Đấu Trường 🎱');

  const panel = el(
    'section',
    { className: 'landing-panel' },
    el(
      'div',
      { className: 'brand-header-row' },
      el('img', { src: BRAND.logo || '/images/logo.png', alt: 'Rasson Logo', className: 'panel-logo-img' }),
      el('div', { className: 'brand-badge' }, '🏆 RACE 27 GIA ĐÌNH'),
    ),
    el('h2', { className: 'brand-title' }, BRAND.name),
    el('p', {}, BRAND.tagline),
    el('div', { className: 'online' }, 'Đang trong đấu trường: ', online, ' cơ thủ'),
    enterBtn,
  );

  const foot = el('div', { className: 'landing-foot' }, `${BRAND.disclaimer} • ${BRAND.tableModel}`);
  app.append(stage, panel, foot);

  enterBtn.addEventListener('click', () => nameDialog(app, (profile) => onEnter(profile)));

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  stage.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  const { ball8, ball9, cueRack } = buildLandingScene(scene);

  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.z = Math.max(16, 7.8 / (halfTan * camera.aspect));
    scene.fog.near = camera.position.z + 2;
    scene.fog.far = camera.position.z + 26;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  const mouse = { x: 0, y: 0 };
  const onMove = (e) => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
  };
  addEventListener('pointermove', onMove);

  let raf = 0;
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const t = ts / 1000;
    camera.position.x += (mouse.x * 1.3 - camera.position.x) * 0.04;
    camera.position.y = 2.6 + Math.sin(t * 0.4) * 0.15 - mouse.y * 0.35;
    camera.lookAt(0, 2.3, 0);

    // Floating 8-ball and 9-ball idle animation
    ball8.position.y = 1.3 + Math.sin(t * 1.6) * 0.18;
    ball8.rotation.y = t * 0.8;
    ball8.rotation.x = Math.sin(t * 0.5) * 0.3;

    ball9.position.y = 1.3 + Math.sin(t * 1.6 + 1) * 0.18;
    ball9.rotation.y = -t * 0.8;
    ball9.rotation.z = Math.cos(t * 0.5) * 0.3;

    cueRack.rotation.y = Math.sin(t * 0.6) * 0.08;

    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  async function poll() {
    try {
      const r = await fetch('/api/stats');
      const j = await r.json();
      online.textContent = j.online;
    } catch {
      online.textContent = '1';
    }
  }
  poll();
  const pollTimer = setInterval(poll, 10000);

  return () => {
    cancelAnimationFrame(raf);
    clearInterval(pollTimer);
    removeEventListener('resize', resize);
    removeEventListener('pointermove', onMove);
    renderer.dispose();
    scene.traverse((o) => {
      if (o.isMesh) {
        o.geometry.dispose();
        [].concat(o.material).forEach((m) => {
          m.map?.dispose();
          m.dispose();
        });
      }
    });
    app.replaceChildren();
  };
}
