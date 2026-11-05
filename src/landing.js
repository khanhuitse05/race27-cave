import * as THREE from 'three';
import { BRAND, CUE_STYLES, PLAYER_TITLES, QUIZ } from './config.js';
import { createHangingCueRack } from './avatar.js';
import { rockGeometry, rockMaterial, rng, textCanvas } from './scenery.js';
import { drawPoolBallIcon, el, loadProfile, saveProfile } from './util.js';

function buildLandingScene(scene) {
  scene.background = new THREE.Color('#0c0f14');
  scene.fog = new THREE.Fog('#0c0f14', 16, 42);

  scene.add(new THREE.HemisphereLight('#60a5fa', '#1e293b', 1.8));

  // Ánh sáng spotlight vàng ấm rọi vào cổng
  const spot = new THREE.DirectionalLight('#fef08a', 2.8);
  spot.position.set(6, 12, 8);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  Object.assign(spot.shadow.camera, { left: -14, right: 14, top: 14, bottom: -6 });
  scene.add(spot);

  // Sàn đá phiến đen sảnh VIP
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(55, 48),
    new THREE.MeshStandardMaterial({ color: '#161920', roughness: 0.85, metalness: 0.1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Thảm nỉ Simonis Electric Blue dẫn lối vào đấu trường
  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 22),
    new THREE.MeshStandardMaterial({ color: BRAND.cloth, roughness: 0.95 }),
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.01, -2);
  carpet.receiveShadow = true;
  scene.add(carpet);

  // Vòm đá cổng vào Đấu trường ngầm
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

  // Khối vách đá hai bên
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

  // Đường hầm dẫn sâu vào đấu trường ngầm với ánh đèn Simonis xanh hắt ra
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

  // Biển hiệu đá Rasson Billiards mạ vàng bên trái cổng
  const signTex = textCanvas(768, 512, (g, w, h) => {
    // Nền đá đen viền vàng kim loại
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a1f2c');
    grad.addColorStop(1, '#0c0f17');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);

    g.strokeStyle = '#d4af37';
    g.lineWidth = 12;
    g.strokeRect(10, 10, w - 20, h - 20);

    // Bi số 8 mạ vàng ở đỉnh
    g.beginPath();
    g.arc(w / 2, 145, 75, 0, Math.PI * 2);
    g.fillStyle = '#0f172a';
    g.fill();
    g.strokeStyle = '#d4af37';
    g.lineWidth = 8;
    g.stroke();

    g.beginPath();
    g.arc(w / 2, 145, 36, 0, Math.PI * 2);
    g.fillStyle = '#ffffff';
    g.fill();
    g.fillStyle = '#0f172a';
    g.font = '900 48px "Bitter", Georgia, serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('8', w / 2, 147);

    // Chữ RASSON BILLIARDS
    g.fillStyle = '#d4af37';
    g.font = '700 30px "Be Vietnam Pro", sans-serif';
    g.letterSpacing = '4px';
    g.fillText(BRAND.signTop, w / 2, 285);

    g.fillStyle = '#ffffff';
    g.font = '900 78px "Bitter", Georgia, serif';
    g.letterSpacing = '2px';
    g.fillText('RASSON', w / 2, 370);

    g.fillStyle = '#38bdf8';
    g.font = '800 40px "Bitter", Georgia, serif';
    g.letterSpacing = '4px';
    g.fillText('BILLIARDS ARENA', w / 2, 435);
  });

  const slab = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.35, 40), rockMaterial('#1c202a'));
  slab.scale.set(2.4, 1, 1.6);
  slab.rotation.x = Math.PI / 2;
  slab.position.set(-5.0, 2.0, 2.2);
  slab.castShadow = true;
  scene.add(slab);

  const signFace = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.8 }));
  signFace.scale.set(2.25, 1.48, 1);
  signFace.position.set(-5.0, 2.0, 2.38);
  scene.add(signFace);

  const base = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 1.3), rockMaterial('#181b24'));
  base.position.set(-5.0, 0.25, 2.2);
  base.castShadow = base.receiveShadow = true;
  scene.add(base);

  // Giá cơ đứng Rasson mạ vàng bên phải cổng
  const cueRack = createHangingCueRack();
  cueRack.position.set(5.2, 0, 2.2);
  cueRack.scale.setScalar(1.2);
  scene.add(cueRack);

  // Cặp Bi 8 và Bi 9 3D khổng lồ bay lơ lửng xoay tròn nghệ thuật hai bên sảnh
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
 * Hộp thoại tạo Profile cơ thủ (Tên, Danh hiệu, Số bi may mắn, Kiểu gậy cơ)
 */
function nameDialog(root, onSubmit) {
  const saved = loadProfile();
  const iconCanvas = el('canvas', { width: 96, height: 96, style: 'width:48px;height:48px' });
  const nameInput = el('input', { maxLength: 30, placeholder: 'Nhập tên hoặc biệt danh cơ thủ…', autocomplete: 'off', value: saved.name || '' });
  const numInput = el('input', { className: 'num-input', inputMode: 'numeric', maxLength: 2, placeholder: '8', value: saved.number ?? 8 });

  // Chọn danh hiệu cơ thủ
  const titleSelect = el(
    'select',
    { className: 'select-input' },
    ...PLAYER_TITLES.map((t) => el('option', { value: t, selected: t === saved.title }, t)),
  );

  // Chọn kiểu gậy cơ thi đấu
  const cueSelect = el(
    'select',
    { className: 'select-input' },
    ...CUE_STYLES.map((c) => el('option', { value: c.id, selected: c.id === saved.cueStyle }, c.name)),
  );

  const counter = el('div', { className: 'counter' });
  const submit = el('button', { className: 'btn btn-primary', type: 'submit' }, 'Tiếp tục vào Đấu Trường 🎱');
  const cancel = el('button', { className: 'btn btn-ghost', type: 'button' }, 'Huỷ');

  function parseBallNum(val) {
    const n = Number.parseInt(val, 10);
    return n >= 1 && n <= 15 ? n : 8;
  }

  function refresh() {
    counter.textContent = `${nameInput.value.length}/30 ký tự`;
    submit.disabled = !nameInput.value.trim();
    numInput.value = numInput.value.replace(/\D/g, '');
    const num = parseBallNum(numInput.value);
    drawPoolBallIcon(iconCanvas, num);
  }

  nameInput.addEventListener('input', refresh);
  numInput.addEventListener('input', refresh);

  const form = el(
    'form',
    { className: 'modal' },
    el('div', { className: 'eyebrow' }, 'HỒ SƠ CƠ THỦ THI ĐẤU'),
    el('h2', {}, 'Gia Nhập Rasson Billiards'),
    el('label', {}, 'Tên hiển thị của cơ thủ'),
    nameInput,
    counter,
    el('label', { style: 'margin-top:10px' }, 'Danh hiệu cơ thủ'),
    titleSelect,
    el('label', { style: 'margin-top:10px' }, 'Gậy cơ thi đấu'),
    cueSelect,
    el(
      'div',
      { className: 'row', style: 'margin-top:12px' },
      el('div', { className: 'grow' }, el('label', { style: 'margin:0' }, 'Bi số may mắn sau lưng'), el('div', { className: 'hint' }, 'Từ 1 đến 15 (8: Bi đen, 9: Sọc vàng)')),
      iconCanvas,
      numInput,
    ),
    el('div', { className: 'actions' }, cancel, submit),
  );

  const backdrop = el('div', { className: 'modal-backdrop' }, form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!nameInput.value.trim()) return;
    const profile = {
      name: nameInput.value.trim().slice(0, 30),
      number: parseBallNum(numInput.value),
      title: titleSelect.value,
      cueStyle: cueSelect.value,
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
 * Câu hỏi vui thử tài kiến thức bi-a trước khi bước vào đấu trường
 */
function quizDialog(root, onPass) {
  const item = QUIZ[Math.floor(Math.random() * QUIZ.length)];
  const msg = el('div');
  const go = el('button', { className: 'btn btn-primary', type: 'button', style: 'display:none' }, 'Vào Đấu Trường 🎱');
  const cancel = el('button', { className: 'btn btn-ghost', type: 'button' }, 'Quay lại');

  const opts = item.options.map((text, i) => {
    const b = el('button', { className: 'quiz-opt', type: 'button' }, text);
    b.addEventListener('click', () => {
      opts.forEach((o) => o.classList.remove('wrong'));
      if (i === item.answer) {
        b.classList.add('right');
        opts.forEach((o) => (o.disabled = true));
        msg.className = 'quiz-msg right';
        msg.textContent = `🎯 Chính xác! ${item.hint || 'Chào mừng cơ thủ bước vào đấu trường!'}`;
        cancel.style.display = 'none';
        go.style.display = '';
        go.focus();
      } else {
        b.classList.add('wrong');
        msg.className = 'quiz-msg wrong';
        msg.textContent = '❌ Chưa chuẩn rồi cơ thủ ơi, chọn lại nhé!';
      }
    });
    return b;
  });

  const modal = el(
    'div',
    { className: 'modal' },
    el('div', { className: 'eyebrow' }, 'CÂU ĐỐ BIDA TRƯỚC KHI VÀO ĐẤU TRƯỜNG'),
    el('h2', {}, item.q),
    ...opts,
    msg,
    el('div', { className: 'actions' }, cancel, go),
  );

  const backdrop = el('div', { className: 'modal-backdrop' }, modal);
  cancel.addEventListener('click', () => backdrop.remove());
  go.addEventListener('click', () => {
    backdrop.remove();
    onPass();
  });
  root.append(backdrop);
}

/**
 * Gắn kết màn hình Landing Page 3D
 */
export function mountLanding(app, { onEnter }) {
  const stage = el('div', { className: 'stage' });
  const online = el('b', {}, '…');
  const enterBtn = el('button', { className: 'btn btn-primary btn-enter', type: 'button' }, 'Vào Đấu Trường 🎱');

  const panel = el(
    'section',
    { className: 'landing-panel' },
    el('div', { className: 'brand-badge' }, '🏆 OFFICIAL 3D ARENA'),
    el('h2', { className: 'brand-title' }, BRAND.name),
    el('p', {}, BRAND.tagline),
    el('div', { className: 'online' }, 'Đang trong đấu trường: ', online, ' cơ thủ'),
    enterBtn,
  );

  const foot = el('div', { className: 'landing-foot' }, `${BRAND.disclaimer} • ${BRAND.tableModel}`);
  app.append(stage, panel, foot);

  enterBtn.addEventListener('click', () => nameDialog(app, (profile) => quizDialog(app, () => onEnter(profile))));

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

    // Diễn hoạt bi 8 và bi 9 lơ lửng xoay tròn
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
