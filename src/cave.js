import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { BRAND, LEGENDS, SCOREBOARD } from './config.js';
import { createAvatar } from './avatar.js';
import { createAudio } from './audio.js';
import { connect } from './net.js';
import { createArenaTorch, createRassonBilliardsTable, rng, rockGeometry, rockMaterial, textCanvas } from './scenery.js';
import { drawPoolBallIcon, el } from './util.js';

const ARENA_RADIUS = 22;
const TABLE_INTERACTION_RADIUS = 4.2;
const WALK_SPEED = 5.2;
const STRIKE_RANGE = 2.4;
const MAX_HP = 5;
const SEND_INTERVAL = 1 / 15;
const SCREEN_Z = -20;
const TUTORIAL_KEY = 'rasson.tutorial.cue';

// ---------------------------------------------------------------------------
// Kiến trúc Đấu trường ngầm Rasson Billiards VIP
// ---------------------------------------------------------------------------

function buildArena(scene, audio) {
  scene.background = new THREE.Color('#0b0e14');
  scene.fog = new THREE.Fog('#0b0e14', 20, 48);

  // Ánh sáng môi trường dịu nhẹ, sang trọng
  scene.add(new THREE.HemisphereLight('#38bdf8', '#1e293b', 2.0));

  // Sàn đá phiến đen bóng phối thảm Simonis
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(28, 64),
    new THREE.MeshStandardMaterial({ color: '#141822', roughness: 0.7, metalness: 0.15 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Vòm trần hang đá ngầm
  const dome = new THREE.Mesh(rockGeometry(28, 15, 3, 0.08), rockMaterial('#222834'));
  dome.material.side = THREE.BackSide;
  dome.scale.y = 0.58;
  scene.add(dome);

  const rand = rng(77);

  // Thạch nhũ đá tự nhiên treo trên vòm
  const stal = new THREE.InstancedMesh(new THREE.ConeGeometry(0.35, 2.4, 6), rockMaterial('#2c3444'), 75);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, 0, 0));
  for (let i = 0; i < stal.count; i++) {
    const a = rand() * Math.PI * 2;
    const r = 4.5 + rand() * 19;
    const s = 0.6 + rand() * 1.4;
    const y = Math.sqrt(Math.max(0, 1 - (r / 28) ** 2)) * 28 * 0.58 - 0.8 * s;
    m4.compose(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), q, new THREE.Vector3(s, s, s));
    stal.setMatrixAt(i, m4);
  }
  scene.add(stal);

  // Khán đài ngồi xem thi đấu hình vòng cung quanh bàn Rasson trung tâm
  const benchMat = new THREE.MeshStandardMaterial({ color: '#1c202a', roughness: 0.85, flatShading: true });
  const rows = [
    { r: 4.8, h: 0.38 },
    { r: 6.8, h: 0.65 },
    { r: 8.8, h: 0.92 },
  ];
  for (const { r, h } of rows) {
    const n = Math.round(r * 5);
    const benches = new THREE.InstancedMesh(new THREE.BoxGeometry(1.05, h, 1.15), benchMat, n);
    let k = 0;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      // Chừa lối nhìn về màn hình lớn phía -z
      if (Math.abs(Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2))) < 0.48) continue;
      m4.compose(
        new THREE.Vector3(Math.cos(a) * r, h / 2, Math.sin(a) * r),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a),
        new THREE.Vector3(1, 1, (2 * Math.PI * r) / n),
      );
      benches.setMatrixAt(k++, m4);
    }
    benches.count = k;
    benches.receiveShadow = true;
    scene.add(benches);
  }

  // Khối đá viền chân tường
  const rockMat = rockMaterial('#181d28');
  for (let i = 0; i < 42; i++) {
    const a = rand() * Math.PI * 2;
    const r = 23 + rand() * 4;
    const m = new THREE.Mesh(rockGeometry(0.8 + rand() * 1.6, 600 + i, 0, 0.3), rockMat);
    m.position.set(Math.cos(a) * r, 0.2, Math.sin(a) * r);
    m.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    scene.add(m);
  }

  // BÀN BIDA RASSON OX ĐẶT TẠI TÂM ĐẤU TRƯỜNG
  const table = createRassonBilliardsTable(audio);
  scene.add(table.group);

  // Đèn tường LED hiện đại & Poster các Huyền thoại Bida thế giới
  const arenaTorches = [];
  const wallR = 23.5;

  const bannerTex = textCanvas(128, 256, (g, w, h) => {
    g.fillStyle = '#111827';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#d4af37';
    g.fillRect(0, 0, w, 14);
    g.fillRect(0, h - 14, w, 14);
    g.beginPath();
    g.arc(w / 2, h / 2, 34, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#111827';
    g.font = '900 32px "Bitter", serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('R', w / 2, h / 2 + 1);
  });
  const bannerMat = new THREE.MeshStandardMaterial({ map: bannerTex, side: THREE.DoubleSide, roughness: 0.8 });

  // Treo poster chân dung các cơ thủ huyền thoại
  for (let i = 0; i < LEGENDS.length; i++) {
    const side = i % 2 ? 1 : -1;
    const idx = Math.floor(i / 2);
    const a = -Math.PI / 2 + side * (0.42 + idx * 0.28);
    addLegendPoster(scene, LEGENDS[i], a, wallR);
  }

  // Đèn hắt LED và cờ Rasson xung quanh tường
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.31;
    const torch = createArenaTorch();
    torch.group.position.set(Math.cos(a) * (wallR + 0.4), 3.2, Math.sin(a) * (wallR + 0.4));
    torch.group.lookAt(0, 3.2, 0);
    scene.add(torch.group);
    arenaTorches.push(torch);

    const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.4), bannerMat);
    const b = a + 0.31;
    banner.position.set(Math.cos(b) * (wallR + 0.6), 5.2, Math.sin(b) * (wallR + 0.6));
    banner.lookAt(0, 5.2, 0);
    scene.add(banner);
  }

  return { table, torches: arenaTorches };
}

function addLegendPoster(scene, legend, angle, r) {
  const tex = textCanvas(300, 400, (g, w, h) => {
    // Khung poster kim loại cao cấp
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1c2438');
    grad.addColorStop(1, '#0b0f19');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);

    // Viền vàng kim loại
    g.strokeStyle = '#d4af37';
    g.lineWidth = 6;
    g.strokeRect(6, 6, w - 12, h - 12);

    // Vùng ảnh / đồ hoạ cơ thủ
    const innerGrad = g.createRadialGradient(w / 2, 140, 20, w / 2, 140, 110);
    innerGrad.addColorStop(0, '#2563eb');
    innerGrad.addColorStop(1, '#0f172a');
    g.fillStyle = innerGrad;
    g.fillRect(16, 16, w - 32, 240);

    // Biểu tượng bóng cơ thủ & gậy cơ
    g.fillStyle = 'rgba(255, 255, 255, 0.22)';
    g.beginPath();
    g.arc(w / 2, 115, 46, 0, Math.PI * 2);
    g.fill();
    g.fillRect(w / 2 - 70, 170, 140, 86);

    // Gậy cơ chéo
    g.strokeStyle = '#d4af37';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(35, 230);
    g.lineTo(w - 35, 45);
    g.stroke();

    // Quốc kỳ & Nickname
    g.fillStyle = '#38bdf8';
    g.font = '700 22px "Be Vietnam Pro", sans-serif';
    g.textAlign = 'center';
    g.fillText(`${legend.country || '🎱'} "${legend.title}"`, w / 2, 295);

    // Tên cơ thủ
    g.fillStyle = '#ffffff';
    g.font = '900 26px "Bitter", Georgia, serif';
    g.fillText(legend.name, w / 2, 345);

    // Dòng chữ Hall of Fame
    g.fillStyle = '#d4af37';
    g.font = '700 13px "Be Vietnam Pro", sans-serif';
    g.letterSpacing = '2px';
    g.fillText('RASSON HALL OF FAME', w / 2, 380);
  });

  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.65 });
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 2.2), mat);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.85, 2.4, 0.08), new THREE.MeshStandardMaterial({ color: '#111827', metalness: 0.5, roughness: 0.4 }));
  frame.position.z = -0.05;
  poster.add(frame);
  poster.position.set(Math.cos(angle) * r, 3.4, Math.sin(angle) * r);
  poster.lookAt(0, 3.4, 0);
  scene.add(poster);
}

// ---------------------------------------------------------------------------
// Màn hình Lớn: BẢNG TỈ SỐ RACE 27 GIA ĐÌNH (Hiển thị hình ảnh bảng điểm)
// ---------------------------------------------------------------------------

function buildScreen(scene) {
  const group = new THREE.Group();
  group.position.set(0, 0, SCREEN_Z);
  scene.add(group);

  // Kích thước chuẩn theo tỉ lệ 1024:472 của hình ảnh bảng điểm
  const SCORE_W = 10.6;
  const SCORE_H = (SCORE_W * 472) / 1024; // ~ 4.88

  // Khung viền kim loại đen mạ vàng bao bọc bảng điểm
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(11.4, SCORE_H + 2.2, 0.4),
    new THREE.MeshStandardMaterial({ color: '#090d14', roughness: 0.4, metalness: 0.4 }),
  );
  frame.position.set(0, 6.2, -0.3);
  group.add(frame);

  // Thanh tiêu đề trên đỉnh bảng
  const headerTex = textCanvas(1024, 160, (g, w, h) => {
    g.fillStyle = '#0f172a';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#d4af37';
    g.fillRect(0, 0, w, 10);
    g.fillRect(0, h - 10, w, 10);

    g.fillStyle = '#d4af37';
    g.font = '700 24px "Be Vietnam Pro", sans-serif';
    g.textAlign = 'center';
    g.letterSpacing = '4px';
    g.fillText('OFFICIAL SCORECARD', w / 2, 45);

    g.fillStyle = '#ffffff';
    g.font = '900 48px "Bitter", Georgia, serif';
    g.letterSpacing = '3px';
    g.fillText('🏆 RACE 27 GIA ĐÌNH 🎱', w / 2, 105);
  });
  const headerMesh = new THREE.Mesh(new THREE.PlaneGeometry(10.6, 1.4), new THREE.MeshBasicMaterial({ map: headerTex }));
  headerMesh.position.set(0, 8.85, 0.05);
  group.add(headerMesh);

  // Tải hình ảnh bảng điểm thật
  const loader = new THREE.TextureLoader();
  const scoreTexture = loader.load(SCOREBOARD.image || '/images/scoreboard.jpg');
  scoreTexture.colorSpace = THREE.SRGBColorSpace;
  scoreTexture.minFilter = THREE.LinearMipmapLinearFilter;
  scoreTexture.anisotropy = 8;

  // Mặt hiển thị hình ảnh bảng điểm
  const scoreMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(SCORE_W, SCORE_H),
    new THREE.MeshBasicMaterial({ map: scoreTexture }),
  );
  scoreMesh.position.set(0, 5.5, 0.05);
  group.add(scoreMesh);

  // Viền vàng kim loại viền sát hình ảnh
  const borderMat = new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.9, roughness: 0.2 });
  const borderBox = new THREE.Mesh(new THREE.BoxGeometry(SCORE_W + 0.16, SCORE_H + 0.16, 0.08), borderMat);
  borderBox.position.set(0, 5.5, 0.01);
  group.add(borderBox);

  // Ánh sáng dịu nhẹ rọi sáng bảng điểm
  const glow = new THREE.PointLight('#38bdf8', 16, 18, 1.6);
  glow.position.set(0, 6.2, 3.0);
  group.add(glow);

  return {
    dispose() {
      scoreTexture.dispose();
      headerMesh.material.map.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Hiệu ứng Pháo hoa & Bụi phấn vàng ăn mừng
// ---------------------------------------------------------------------------

function createBilliardsConfetti(scene) {
  const bursts = [];
  const colors = [BRAND.jersey.trim, BRAND.cloth, '#f8fafc', '#f59e0b', '#38bdf8'].map((c) => new THREE.Color(c));

  return {
    burst(pos) {
      const N = 100;
      const positions = new Float32Array(N * 3);
      const cols = new Float32Array(N * 3);
      const vel = [];
      for (let i = 0; i < N; i++) {
        positions.set([pos.x, 2, pos.z], i * 3);
        const c = colors[i % colors.length];
        cols.set([c.r, c.g, c.b], i * 3);
        const a = Math.random() * Math.PI * 2;
        const s = 1.6 + Math.random() * 2.8;
        vel.push(new THREE.Vector3(Math.cos(a) * s, 5.5 + Math.random() * 4.5, Math.sin(a) * s));
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.18, vertexColors: true, transparent: true, depthWrite: false }));
      scene.add(pts);
      bursts.push({ pts, vel, life: 2.2 });
    },
    update(dt) {
      for (let b = bursts.length - 1; b >= 0; b--) {
        const burst = bursts[b];
        burst.life -= dt;
        const p = burst.pts.geometry.attributes.position;
        burst.vel.forEach((v, i) => {
          v.y -= 9.8 * dt;
          v.multiplyScalar(0.985);
          p.setXYZ(i, p.getX(i) + v.x * dt, Math.max(0.05, p.getY(i) + v.y * dt), p.getZ(i) + v.z * dt);
        });
        p.needsUpdate = true;
        burst.pts.material.opacity = Math.min(1, burst.life);
        if (burst.life <= 0) {
          scene.remove(burst.pts);
          burst.pts.geometry.dispose();
          burst.pts.material.dispose();
          bursts.splice(b, 1);
        }
      }
    },
  };
}

function capture(node, pointerId) {
  try {
    node.setPointerCapture(pointerId);
  } catch {
    // bỏ qua
  }
}

// ---------------------------------------------------------------------------
// Giao diện HUD của Đấu trường Rasson Billiards
// ---------------------------------------------------------------------------

function buildHud(app, { onLeave, onBreakShot, onResetRack, onCameraToggle }) {
  const kbd = (k) => el('span', { className: 'kbd' }, k);

  const leave = el('button', { className: 'pill', type: 'button' }, '🚪 Rời Đấu Trường');
  const volume = el('input', { type: 'range', min: 0, max: 1, step: 0.05, value: 0.6, 'aria-label': 'Âm lượng' });
  const muteBtn = el('button', { className: 'pill', type: 'button', style: 'padding:6px 8px' }, '🔊');
  const scoreBtn = el('button', { className: 'pill score-hud-btn', type: 'button' }, '📊 Bảng tỉ số');
  const camBtn = el('button', { className: 'pill cam-btn', type: 'button' }, '📷 Góc máy (C)');
  const myHp = el('div', { className: 'pill my-hp', 'aria-label': 'Máu của bạn' });

  const top = el('div', { className: 'hud-top' }, leave, myHp, camBtn, scoreBtn, el('div', { className: 'pill vol' }, muteBtn, volume));
  const ghostBanner = el('div', { className: 'ghost-banner' });

  const count = el('span', {}, '…');
  const roomInfo = el('div', { className: 'room-info' }, el('b', {}, BRAND.roomName), count);

  // Khung Chat
  const log = el('div', { className: 'chat-log', role: 'log' });
  const input = el('input', { placeholder: 'Nhấn Enter để gửi tin nhắn đến anh em cơ thủ…', maxLength: 200 });
  const hideChat = el('button', { className: 'pill', type: 'button' }, 'Ẩn');
  const chat = el('div', { className: 'chat' }, el('div', { className: 'chat-head' }, el('span', {}, '💬 Chat Đấu Trường'), hideChat), log, input);
  hideChat.addEventListener('click', () => {
    chat.classList.toggle('collapsed');
    hideChat.textContent = chat.classList.contains('collapsed') ? 'Hiện' : 'Ẩn';
  });

  // Thanh Biểu tượng Cảm xúc (Emote Bar)
  const EMOTES = ['🎱', '🏆', '🎯', '🔥', '👏', '🍺'];
  const emoteBtns = EMOTES.map((em) => {
    const b = el('button', { className: 'emote-btn', type: 'button', 'aria-label': em }, em);
    return b;
  });
  const emoteBar = el('div', { className: 'emote-bar' }, ...emoteBtns);

  // Nút Hành động & Bảng phím
  const celebrate = el('button', { className: 'btn-celebrate', type: 'button' }, '🎉 Ăn Mừng Cú Đánh', kbd('G'));
  const keysBtn = el('button', { className: 'pill btn-keys', type: 'button' }, 'Phím tắt (H)');
  const hint = el('div', { className: 'hint-bottom' }, 'Nhấp chuột vào cảnh để xoay góc nhìn • Cuộn chuột để zoom');
  const toast = el('div', { className: 'toast' });

  // Nút Tương tác Bàn Bida trung tâm
  const breakBtn = el('button', { className: 'btn-table-action break-btn', type: 'button' }, '🎱 Phá Bi Rasson', kbd('Space'));
  const rackBtn = el('button', { className: 'btn-table-action rack-btn', type: 'button' }, '🔄 Xếp Lại Bi', kbd('R'));
  const tableActions = el('div', { className: 'table-actions-panel' }, breakBtn, rackBtn);

  breakBtn.addEventListener('click', onBreakShot);
  rackBtn.addEventListener('click', onResetRack);
  camBtn.addEventListener('click', onCameraToggle);

  const strikeHint = el('div', { className: 'strike-hint' }, '🎯 Nhấn F để Thách đấu Chọc cơ');

  // Điều khiển cảm ứng trên điện thoại / máy tính bảng
  const knob = el('div', { className: 'joy-knob' });
  const joystick = el('div', { className: 'joystick', 'aria-label': 'Cần gạt di chuyển' }, knob);
  const strikeTouch = el('button', { className: 'btn-strike', type: 'button', 'aria-label': 'Đấu cơ' }, '🎯');
  const breakTouch = el('button', { className: 'btn-break-touch', type: 'button', 'aria-label': 'Phá bi' }, '🎱');

  const isTouch = matchMedia('(pointer: coarse)').matches;
  const hud = el(
    'div',
    { className: `hud${isTouch ? ' touch' : ''}` },
    top,
    roomInfo,
    chat,
    emoteBar,
    celebrate,
    keysBtn,
    hint,
    toast,
    tableActions,
    strikeHint,
    joystick,
    strikeTouch,
    breakTouch,
    ghostBanner,
  );
  app.append(hud);

  if (isTouch) {
    chat.classList.add('collapsed');
    hideChat.textContent = 'Hiện';
    hint.textContent = 'Vuốt màn hình để xoay góc nhìn cơ thủ';
  }

  const joy = { x: 0, y: 0 };
  let joyPointer = null;
  function joyUpdate(e) {
    const r = joystick.getBoundingClientRect();
    const max = r.width / 2;
    let dx = e.clientX - (r.left + max);
    let dy = e.clientY - (r.top + max);
    const len = Math.hypot(dx, dy);
    if (len > max) {
      dx *= max / len;
      dy *= max / len;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    joy.x = dx / max;
    joy.y = dy / max;
  }
  function joyEnd(e) {
    if (e.pointerId !== joyPointer) return;
    joyPointer = null;
    joy.x = joy.y = 0;
    knob.style.transform = '';
  }
  joystick.addEventListener('pointerdown', (e) => {
    joyPointer = e.pointerId;
    capture(joystick, e.pointerId);
    joyUpdate(e);
  });
  joystick.addEventListener('pointermove', (e) => e.pointerId === joyPointer && joyUpdate(e));
  joystick.addEventListener('pointerup', joyEnd);
  joystick.addEventListener('pointercancel', joyEnd);

  leave.addEventListener('click', onLeave);

  let toastTimer = 0;
  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
  }

  function addChat(entry) {
    const line = el('div');
    if (entry.sys) {
      line.className = 'sys';
      line.textContent = entry.text;
    } else {
      line.append(el('span', { className: 'who' }, entry.from), entry.text);
    }
    const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 30;
    log.append(line);
    while (log.children.length > 80) log.firstChild.remove();
    if (atBottom) log.scrollTop = log.scrollHeight;
  }

  function card(title, body, { closeLabel } = {}) {
    const close = el('button', { className: 'close', type: 'button', 'aria-label': 'Đóng' }, '×');
    const node = el('div', { className: 'card' }, close, el('h3', {}, title), body);
    if (closeLabel) {
      const ok = el('button', { className: 'btn btn-primary', type: 'button' }, closeLabel);
      ok.addEventListener('click', () => node.remove());
      node.append(el('div', { className: 'actions' }, ok));
    }
    close.addEventListener('click', () => node.remove());
    hud.append(node);
    return node;
  }

  // Xem chi tiết Bảng tỉ số Race 27 Gia Đình
  scoreBtn.addEventListener('click', () => {
    const img = el('img', {
      src: SCOREBOARD.image || '/images/scoreboard.jpg',
      alt: 'Bảng tỉ số Race 27 Gia Đình',
      style: 'width:100%;border-radius:10px;box-shadow:0 6px 25px rgba(0,0,0,0.7);display:block;margin-bottom:12px;border:1px solid rgba(212,175,55,0.4)',
    });
    const stats = el(
      'div',
      { style: 'font-size:13.5px;color:var(--gold);text-align:center;font-weight:700;line-height:1.6' },
      '🏆 KẾT QUẢ ĐANG DẪN ĐẦU — RACE 27 GIA ĐÌNH',
      el('div', { style: 'font-size:12.5px;color:var(--ink-soft);font-weight:500;margin-top:4px' }, 'James (-9) • Khá (21) • Damy (5) • Bino (-14) • Lú (-3)'),
    );
    card('📊 Bảng Tỉ Số Race 27 Gia Đình', el('div', {}, img, stats), { closeLabel: 'Đóng' });
  });

  let helpCard = null;
  function toggleHelp() {
    if (helpCard?.isConnected) {
      helpCard.remove();
      helpCard = null;
      return;
    }
    const rows = [
      [['W', 'A', 'S', 'D'], 'Di chuyển cơ thủ trong đấu trường'],
      [['Chuột'], 'Xoay góc nhìn (Bấm vào cảnh để khoá chuột, Esc để thả)'],
      [['Cuộn chuột'], 'Phóng to / thu nhỏ góc nhìn camera'],
      [['C'], 'Đổi chế độ góc máy (3rd Person, First Person, Bàn bida)'],
      [['F', 'Click'], 'Thách đấu Chọc cơ người đối diện trong vòng đỏ'],
      [['Space'], 'Phá bi trên bàn Rasson khi đứng gần bàn'],
      [['R'], 'Xếp lại cụm bi 9-ball trên bàn'],
      [['G'], 'Ăn mừng chiến thắng (Giương gậy cơ & pháo hoa)'],
      [['Enter'], 'Trò chuyện cùng anh em cơ thủ'],
      [['M'], 'Tắt / bật âm thanh tiếng bi va chạm'],
      [['H'], 'Mở / đóng bảng trợ giúp này'],
    ];
    const grid = el('div', { className: 'keys-grid' });
    for (const [keys, desc] of rows) grid.append(el('div', {}, ...keys.map(kbd)), el('div', {}, desc));
    helpCard = card('🎱 Bảng Phím Điều Khiển Rasson Billiards', grid, { closeLabel: 'Đã Hiểu' });
  }
  keysBtn.addEventListener('click', toggleHelp);

  return {
    hud,
    input,
    log,
    volume,
    muteBtn,
    scoreBtn,
    camBtn,
    emoteBtns,
    celebrate,
    tableActions,
    breakBtn,
    rackBtn,
    strikeHint,
    strikeTouch,
    breakTouch,
    joy,
    isTouch,
    setCount: (n) => (count.textContent = `${n} cơ thủ trong Đấu Trường`),
    showToast,
    addChat,
    card,
    toggleHelp,
    setTableActionsVisible: (v) => tableActions.classList.toggle('show', v),
    setMyHp(hp, ghost) {
      myHp.textContent = ghost ? '👻 Thần Cơ (Hồi sinh…)' : '❤'.repeat(hp) + '♡'.repeat(MAX_HP - hp);
      myHp.classList.toggle('low', !ghost && hp <= 2);
      strikeTouch.classList.toggle('disabled', ghost);
    },
    setGhostCountdown(secondsLeft) {
      ghostBanner.classList.toggle('show', secondsLeft > 0);
      if (secondsLeft > 0) ghostBanner.textContent = `👻 Bạn đang ở trạng thái hồi sức, không thách đấu được. Hồi sinh sau ${secondsLeft}s`;
    },
  };
}

// ---------------------------------------------------------------------------
// Gắn kết Màn chơi trong Đấu trường ngầm Rasson Billiards
// ---------------------------------------------------------------------------

export function mountCave(app, { profile, onLeave }) {
  const stage = el('div', { className: 'stage' });
  const loading = el('div', { className: 'loading' }, '🎱 Đang bước vào Đấu Trường Rasson Billiards…');
  app.append(stage, loading);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  stage.append(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.style.cssText = 'position:absolute;inset:0;pointer-events:none';
  stage.append(labelRenderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 140);

  const audio = createAudio();
  const { table, torches } = buildArena(scene, audio);
  const screen = buildScreen(scene);
  const confetti = createBilliardsConfetti(scene);

  let camMode = 0; // 0: 3rd person follow, 1: 1st person cueist, 2: Table view
  function toggleCameraMode() {
    camMode = (camMode + 1) % 3;
    const names = ['📷 Góc nhìn: Sau lưng (3rd)', '📷 Góc nhìn: Cơ thủ (1st)', '📷 Góc nhìn: Bàn thi đấu'];
    hud.camBtn.textContent = names[camMode];
    hud.showToast(names[camMode]);
  }

  const hud = buildHud(app, {
    onLeave,
    onBreakShot: () => {
      table.breakShot(19, (Math.random() - 0.5) * 0.15);
      net.send({ t: 'table_break', power: 19 });
      hud.showToast('💥 Cú phá bi sấm sét của bạn!');
    },
    onResetRack: () => {
      table.resetRack();
      net.send({ t: 'table_reset' });
      hud.showToast('🔄 Đã xếp lại cụm bi 9-ball');
    },
    onCameraToggle: toggleCameraMode,
  });

  // --- Người chơi -----------------------------------------------------------
  /** @type {Map<number, any>} */
  const others = new Map();
  let myId = null;

  const me = {
    avatar: createAvatar(profile.number, profile.cueStyle || 'ngocmy'),
    pos: new THREE.Vector3(0, 0, 7.5),
    ry: Math.PI,
    knock: new THREE.Vector3(),
    moving: false,
  };
  scene.add(me.avatar.root);
  me.avatar.ring.material.color.set(BRAND.jersey.trim);
  me.avatar.ring.material.opacity = 0.5;

  const myLabel = makeLabel(profile.name, profile.number, true);
  me.avatar.root.add(myLabel.obj);

  function makeLabel(name, number, isMe = false) {
    const node = el('div', { className: `nametag${isMe ? ' me' : ''}` });
    const ballCanvas = el('canvas', { width: 32, height: 32, className: 'ball-tag-icon' });
    drawPoolBallIcon(ballCanvas, number ?? 8);

    node.append(ballCanvas, el('span', { className: 'player-name' }, name));

    const hearts = el('div', { className: 'hearts' });
    const emoteHolder = el('div', { className: 'emote-bubble' });
    const wrap = el('div', { style: 'position:relative' }, emoteHolder, node, hearts);
    const obj = new CSS2DObject(wrap);
    obj.position.set(0, 2.2, 0);

    let bubble = null;
    let bubbleTimer = 0;
    let emoteTimer = 0;

    return {
      obj,
      setHp(hp, ghost) {
        hearts.textContent = ghost ? '👻' : '❤'.repeat(hp) + '♡'.repeat(MAX_HP - hp);
        wrap.classList.toggle('ghost', ghost);
      },
      say(text) {
        bubble?.remove();
        bubble = el('div', { className: 'bubble' }, text);
        wrap.append(bubble);
        clearTimeout(bubbleTimer);
        bubbleTimer = setTimeout(() => bubble?.remove(), 5000);
      },
      showEmote(emoji) {
        emoteHolder.textContent = emoji;
        emoteHolder.classList.add('show');
        clearTimeout(emoteTimer);
        emoteTimer = setTimeout(() => emoteHolder.classList.remove('show'), 2500);
      },
    };
  }

  function addOther(p) {
    if (p.id === myId || others.has(p.id)) return;
    const avatar = createAvatar(p.number, p.cueStyle || 'ngocmy');
    const label = makeLabel(p.name, p.number);
    avatar.root.add(label.obj);
    avatar.root.position.set(p.x, 0, p.z);
    avatar.root.rotation.y = p.ry;
    scene.add(avatar.root);
    others.set(p.id, { id: p.id, name: p.name, avatar, label, target: new THREE.Vector3(p.x, 0, p.z), ry: p.ry, a: 0 });
    setHealth(p.id, p.hp ?? MAX_HP, p.ghostLeft ?? 0);
  }

  // --- Máu / Thần cơ (Ma) ----------------------------------------------------
  let myGhostUntil = 0;
  function setHealth(id, hp, ghostLeft) {
    const ghost = ghostLeft > 0;
    const avatar = avatarOf(id);
    if (avatar && avatar.ghost !== ghost) avatar.setGhost(ghost);
    if (id === myId) {
      myLabel.setHp(hp, ghost);
      myGhostUntil = ghost ? performance.now() + ghostLeft : 0;
      hud.setMyHp(hp, ghost);
    } else {
      others.get(id)?.label.setHp(hp, ghost);
    }
  }

  function removeOther(id) {
    const o = others.get(id);
    if (!o) return;
    o.label.obj.element.remove();
    o.avatar.root.remove(o.label.obj);
    scene.remove(o.avatar.root);
    o.avatar.dispose();
    others.delete(id);
  }

  function updateCount() {
    hud.setCount(others.size + (myId ? 1 : 0));
  }

  function avatarOf(id) {
    return id === myId ? me.avatar : others.get(id)?.avatar;
  }

  function nameOf(id) {
    return id === myId ? profile.name : others.get(id)?.name ?? 'Cơ thủ';
  }

  // Biểu tượng cảm xúc
  hud.emoteBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const emoji = btn.textContent;
      myLabel.showEmote(emoji);
      net.send({ t: 'emote', emote: emoji });
    });
  });

  // --- Mạng WebSocket --------------------------------------------------------
  const net = connect(profile, {
    status(s) {
      if (s === 'offline') hud.showToast('⚠️ Mất kết nối, đang tự động kết nối lại…');
    },
    welcome(msg) {
      for (const id of [...others.keys()]) removeOther(id);
      myId = msg.id;
      const self = msg.players.find((p) => p.id === myId);
      if (self) {
        me.pos.set(self.x, 0, self.z);
        setHealth(myId, self.hp ?? MAX_HP, self.ghostLeft ?? 0);
      }
      me.ry = Math.atan2(-me.pos.x, -me.pos.z);
      camYaw = me.ry + Math.PI;
      msg.players.forEach(addOther);
      hud.log.replaceChildren();
      msg.chat.forEach(hud.addChat);
      updateCount();
      loading.remove();
      maybeTutorial();
    },
    join(msg) {
      addOther(msg.p);
      updateCount();
    },
    leave(msg) {
      removeOther(msg.id);
      updateCount();
    },
    state(msg) {
      for (const [id, x, z, ry, a] of msg.ps) {
        const o = others.get(id);
        if (!o) continue;
        o.target.set(x, 0, z);
        o.ry = ry;
        o.a = a;
      }
    },
    chat(msg) {
      hud.addChat(msg);
      if (msg.sys) return;
      if (msg.id === myId) myLabel.say(msg.text);
      else others.get(msg.id)?.label.say(msg.text);
    },
    emote(msg) {
      if (msg.id === myId) myLabel.showEmote(msg.emote);
      else others.get(msg.id)?.label.showEmote(msg.emote);
    },
    table_break(msg) {
      table.breakShot(msg.power || 19);
      hud.showToast('💥 Có cơ thủ vừa phá bi trên bàn Rasson!');
    },
    table_reset() {
      table.resetRack();
      hud.showToast('🔄 Bàn bida đã được xếp lại cụm 9 bi');
    },
    punch(msg) {
      avatarOf(msg.by)?.punch();
      avatarOf(msg.target)?.hit();
      setHealth(msg.target, msg.hp, msg.ghostLeft);
      if (msg.target === myId && msg.ghostLeft > 0) {
        hud.showToast(`👻 ${nameOf(msg.by)} đã hạ gục bạn, bạn biến thành Thần cơ!`);
        audio.cueHit(1);
      } else if (msg.target === myId) {
        const by = others.get(msg.by);
        if (by) {
          const dir = me.pos.clone().sub(by.avatar.root.position).setY(0);
          if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1);
          me.knock.copy(dir.normalize().multiplyScalar(9.5));
        }
        hud.showToast(`🎯 Bạn vừa bị ${nameOf(msg.by)} thách đấu chọc cơ!`);
        audio.cueHit(0.8);
      } else if (msg.by === myId) {
        audio.cueHit(1);
      }
    },
    revive(msg) {
      setHealth(msg.id, msg.hp, 0);
      if (msg.id === myId) {
        hud.showToast('✨ Bạn đã hồi phục phong độ, tiếp tục thi đấu!');
        audio.chalk();
      }
    },
    celebrate(msg) {
      const av = avatarOf(msg.id);
      if (!av) return;
      av.celebrate();
      confetti.burst(av.root.position);
      if (msg.id === myId) audio.cheer();
    },
  });

  // --- Hướng dẫn lần đầu ----------------------------------------------------
  function maybeTutorial() {
    let seen = false;
    try {
      seen = localStorage.getItem(TUTORIAL_KEY) === '1';
      localStorage.setItem(TUTORIAL_KEY, '1');
    } catch {
      // bỏ qua
    }
    if (seen) return;
    const p = el(
      'p',
      {},
      'Đến gần bàn bida trung tâm để ',
      el('span', { className: 'hl' }, 'Phá bi (Space)'),
      ', hoặc lại gần cơ thủ khác (vòng đỏ) và nhấn ',
      el('span', { className: 'kbd' }, 'F'),
      ' để thách đấu chọc cơ!',
    );
    hud.card('🎱 Chào mừng đến với Rasson Billiards!', p);
  }

  // --- Âm thanh -------------------------------------------------------------
  function toggleMute() {
    const m = audio.toggleMute();
    hud.muteBtn.textContent = m ? '🔇' : '🔊';
  }
  hud.muteBtn.addEventListener('click', toggleMute);
  hud.volume.addEventListener('input', () => {
    audio.unlock();
    audio.setVolume(Number(hud.volume.value));
    hud.muteBtn.textContent = audio.muted ? '🔇' : '🔊';
  });

  // --- Chat -----------------------------------------------------------------
  hud.input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      const text = hud.input.value.trim();
      if (text) net.send({ t: 'chat', text });
      hud.input.value = '';
      hud.input.blur();
    } else if (e.key === 'Escape') {
      hud.input.blur();
    }
  });

  // --- Điều khiển -----------------------------------------------------------
  const keys = new Set();
  let camYaw = 0;
  let camPitch = 0.35;
  let camDist = 6.8;
  let dragging = false;
  const canvas = renderer.domElement;

  function doStrike() {
    if (me.avatar.ghost) {
      hud.showToast('👻 Bạn đang là thần cơ hồi sức, chưa thể thách đấu');
      return;
    }
    const target = strikeTarget();
    if (!target) return;
    me.ry = Math.atan2(target.avatar.root.position.x - me.pos.x, target.avatar.root.position.z - me.pos.z);
    net.send({ t: 'punch', target: target.id });
  }

  function doCelebrate() {
    if (!me.avatar.celebrating) net.send({ t: 'celebrate' });
  }
  hud.celebrate.addEventListener('click', doCelebrate);
  hud.strikeTouch.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    audio.unlock();
    doStrike();
  });
  hud.breakTouch.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    table.breakShot(19);
    net.send({ t: 'table_break', power: 19 });
    hud.showToast('💥 Phá bi thành công!');
  });

  function onKeyDown(e) {
    if (e.target instanceof HTMLInputElement) return;
    audio.unlock();
    const k = e.key.toLowerCase();
    if (k === 'enter') {
      e.preventDefault();
      document.exitPointerLock?.();
      hud.input.focus();
      return;
    }
    if (e.repeat) return;
    keys.add(e.code);

    if (k === 'f') doStrike();
    else if (k === 'g') doCelebrate();
    else if (k === 'h') hud.toggleHelp();
    else if (k === 'm') toggleMute();
    else if (k === 'c') toggleCameraMode();
    else if (k === 'r') {
      table.resetRack();
      net.send({ t: 'table_reset' });
    } else if (e.code === 'Space') {
      e.preventDefault();
      table.breakShot(19);
      net.send({ t: 'table_break', power: 19 });
      hud.showToast('💥 Cú phá bi sấm sét!');
    }
  }

  const onKeyUp = (e) => keys.delete(e.code);
  const onBlur = () => keys.clear();

  canvas.addEventListener('pointerdown', (e) => {
    audio.unlock();
    if (document.pointerLockElement === canvas) {
      doStrike();
      return;
    }
    if (e.pointerType === 'mouse') {
      Promise.resolve(canvas.requestPointerLock?.()).catch(() => {});
    }
    dragging = true;
    capture(canvas, e.pointerId);
  });
  canvas.addEventListener('pointerup', () => (dragging = false));
  canvas.addEventListener('pointermove', (e) => {
    if (document.pointerLockElement !== canvas && !dragging) return;
    camYaw -= e.movementX * 0.0035;
    camPitch = THREE.MathUtils.clamp(camPitch + e.movementY * 0.0025, -0.15, 1.15);
  });

  // Phóng to thu nhỏ bằng chuột
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      camDist = THREE.MathUtils.clamp(camDist + e.deltaY * 0.005, 3.2, 12.0);
    },
    { passive: false },
  );

  addEventListener('keydown', onKeyDown);
  addEventListener('keyup', onKeyUp);
  addEventListener('blur', onBlur);

  function strikeTarget() {
    if (me.avatar.ghost) return null;
    let best = null;
    let bestScore = Infinity;
    const fx = Math.sin(me.ry);
    const fz = Math.cos(me.ry);
    for (const o of others.values()) {
      if (o.avatar.ghost) continue;
      const dx = o.avatar.root.position.x - me.pos.x;
      const dz = o.avatar.root.position.z - me.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > STRIKE_RANGE) continue;
      const facing = d > 0 ? (dx * fx + dz * fz) / d : 1;
      const score = d - facing;
      if (score < bestScore) {
        bestScore = score;
        best = o;
      }
    }
    return best;
  }

  // --- Vòng lặp Render & Cập nhật --------------------------------------------
  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  const move = new THREE.Vector3();
  const camTarget = new THREE.Vector3();
  let sendAcc = 0;
  let lastSent = '';
  let lastSentAt = 0;
  let last = performance.now();
  let raf = 0;
  let t = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    t += dt;

    // Di chuyển cơ thủ theo hướng camera
    const f = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - hud.joy.y;
    const s = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) + hud.joy.x;
    move.set(0, 0, 0);

    const amount = Math.min(1, Math.hypot(f, s));
    if (amount > 0.15) {
      const fwdX = -Math.sin(camYaw);
      const fwdZ = -Math.cos(camYaw);
      move.set(fwdX * f - fwdZ * s, 0, fwdZ * f + fwdX * s).normalize().multiplyScalar(WALK_SPEED * amount * dt);
      const want = Math.atan2(move.x, move.z);
      const diff = Math.atan2(Math.sin(want - me.ry), Math.cos(want - me.ry));
      me.ry += diff * Math.min(1, dt * 12);
    }

    me.moving = move.lengthSq() > 0;
    me.pos.add(move).addScaledVector(me.knock, dt);
    me.knock.multiplyScalar(Math.max(0, 1 - dt * 6));

    // Giới hạn biên đấu trường
    const r = Math.hypot(me.pos.x, me.pos.z);
    if (r > ARENA_RADIUS) me.pos.multiplyScalar(ARENA_RADIUS / r);

    // Va chạm với bàn Bida Rasson (Hình chữ nhật giữa phòng)
    const tableHalfL = 2.4;
    const tableHalfW = 1.4;
    if (Math.abs(me.pos.x) < tableHalfL && Math.abs(me.pos.z) < tableHalfW) {
      const overlapX = tableHalfL - Math.abs(me.pos.x);
      const overlapZ = tableHalfW - Math.abs(me.pos.z);
      if (overlapX < overlapZ) {
        me.pos.x = (me.pos.x > 0 ? 1 : -1) * tableHalfL;
      } else {
        me.pos.z = (me.pos.z > 0 ? 1 : -1) * tableHalfW;
      }
    }

    // Hiển thị nút tương tác bàn bida khi đứng gần
    const nearTable = r < TABLE_INTERACTION_RADIUS;
    hud.setTableActionsVisible(nearTable);

    me.avatar.root.position.x = me.pos.x;
    me.avatar.root.position.z = me.pos.z;
    me.avatar.root.rotation.y = me.ry;
    me.avatar.update(dt, me.moving);

    // Cập nhật người chơi khác
    const k = 1 - Math.exp(-dt * 12);
    const target = strikeTarget();
    for (const o of others.values()) {
      const root = o.avatar.root;
      root.position.x += (o.target.x - root.position.x) * k;
      root.position.z += (o.target.z - root.position.z) * k;
      const diff = Math.atan2(Math.sin(o.ry - root.rotation.y), Math.cos(o.ry - root.rotation.y));
      root.rotation.y += diff * k;
      o.avatar.update(dt, o.a === 1);
      const ring = o.avatar.ring.material;
      ring.color.set(o === target ? '#ef4444' : BRAND.jersey.trim);
      ring.opacity = o === target ? 0.95 : 0.25;
    }

    hud.strikeHint.classList.toggle('show', !!target && !hud.isTouch && document.pointerLockElement !== canvas);
    hud.strikeTouch.classList.toggle('ready', !!target);
    hud.setGhostCountdown(myGhostUntil ? Math.max(1, Math.ceil((myGhostUntil - now) / 1000)) : 0);

    // Đồng bộ vị trí định kỳ 15 lần/giây
    sendAcc += dt;
    if (sendAcc >= SEND_INTERVAL && myId) {
      sendAcc = 0;
      const payload = { t: 'move', x: +me.pos.x.toFixed(2), z: +me.pos.z.toFixed(2), ry: +me.ry.toFixed(2), a: me.moving ? 1 : 0 };
      const key = `${payload.x},${payload.z},${payload.ry},${payload.a}`;
      if (key !== lastSent || now - lastSentAt > 30000) {
        lastSent = key;
        lastSentAt = now;
        net.send(payload);
      }
    }

    // Thiết lập Camera theo chế độ đã chọn
    if (camMode === 0) {
      // 3rd Person Follow Camera
      camTarget.set(me.pos.x, 1.55, me.pos.z);
      camera.position.set(
        me.pos.x + Math.sin(camYaw) * Math.cos(camPitch) * camDist,
        1.6 + Math.sin(camPitch) * camDist,
        me.pos.z + Math.cos(camYaw) * Math.cos(camPitch) * camDist,
      );
      const cr = Math.hypot(camera.position.x, camera.position.z);
      if (cr > 25.5) {
        camera.position.x *= 25.5 / cr;
        camera.position.z *= 25.5 / cr;
      }
      camera.position.y = Math.max(0.6, camera.position.y);
      camera.lookAt(camTarget);
    } else if (camMode === 1) {
      // 1st Person Cueist Camera (Góc nhìn từ mắt cơ thủ)
      camera.position.set(me.pos.x, 1.6, me.pos.z);
      const lookDist = 10;
      camera.lookAt(
        me.pos.x - Math.sin(camYaw) * lookDist,
        1.6 - Math.sin(camPitch) * 2,
        me.pos.z - Math.cos(camYaw) * lookDist,
      );
    } else if (camMode === 2) {
      // Table Cam (Góc nhìn bao quát toàn bộ bàn bida Rasson)
      camTarget.set(0, 1.1, 0);
      camera.position.set(Math.sin(camYaw) * 7.5, 4.8, Math.cos(camYaw) * 7.5);
      camera.lookAt(camTarget);
    }

    // Cập nhật vật lý bi bida lăn trên bàn
    table.update(dt);
    torches.forEach((tc) => tc.update(t));
    confetti.update(dt);

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    screen.dispose();
    net.close();
    audio.close();
    document.exitPointerLock?.();
    removeEventListener('keydown', onKeyDown);
    removeEventListener('keyup', onKeyUp);
    removeEventListener('blur', onBlur);
    removeEventListener('resize', resize);
    for (const id of [...others.keys()]) removeOther(id);
    renderer.dispose();
    scene.traverse((o) => {
      if (o.isMesh || o.isPoints) {
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
