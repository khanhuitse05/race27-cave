import * as THREE from 'three';
import { BALL_CONFIG, BRAND } from './config.js';

/** PRNG nhỏ để địa hình cố định giữa các lần tải */
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hash3(x, y, z, seed) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 13.37) * 43758.5453;
  return h - Math.floor(h);
}

/** Đá low-poly: icosahedron bị bóp méo, shading phẳng */
export function rockGeometry(radius, seed = 1, detail = 1, jag = 0.28) {
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const k = 1 + (hash3(+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3), seed) - 0.5) * 2 * jag;
    v.multiplyScalar(k);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function rockMaterial(color = '#2c2522') {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.95, flatShading: true });
}

/**
 * Texture chữ từ canvas, dùng cho biển hiệu, bảng tỉ số và poster
 */
export function textCanvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Tạo texture bi bida cầu 3D với dải màu, số và bóng chuẩn
 */
function createBallTexture(ballNo) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d');
  const cfg = BALL_CONFIG[ballNo] || BALL_CONFIG[8];

  if (cfg.stripe) {
    g.fillStyle = '#f8fafc';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = cfg.color;
    g.fillRect(0, c.height * 0.22, c.width, c.height * 0.56);
  } else {
    g.fillStyle = cfg.color;
    g.fillRect(0, 0, c.width, c.height);
  }

  // Số bi hai bên mặt
  if (ballNo > 0) {
    for (const cx of [c.width * 0.25, c.width * 0.75]) {
      g.beginPath();
      g.arc(cx, c.height * 0.5, 20, 0, Math.PI * 2);
      g.fillStyle = '#ffffff';
      g.fill();
      g.fillStyle = '#111827';
      g.font = '900 24px "Bitter", serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(String(ballNo), cx, c.height * 0.5 + 1);
      if (ballNo === 6 || ballNo === 9) {
        g.fillRect(cx - 7, c.height * 0.5 + 11, 14, 2);
      }
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Bàn Bida Rasson Ox Tournament 9-Foot chính hãng đặt tại trung tâm Đấu trường:
 * Chân chữ V điêu khắc, viền nẹp kim loại vàng, mặt nỉ Simonis Electric Blue,
 * đèn chùm thi đấu Matchroom phía trên và cụm bi 9-ball có thể tương tác phá bi thật!
 */
export function createRassonBilliardsTable(audio = null) {
  const group = new THREE.Group();

  const TABLE_L = 4.4; // Dài (x)
  const TABLE_W = 2.4; // Rộng (z)
  const TABLE_H = 1.05; // Cao mặt bàn (y)
  const RAIL_THICK = 0.22;
  const FELT_L = TABLE_L - RAIL_THICK * 2;
  const FELT_W = TABLE_W - RAIL_THICK * 2;

  const woodMat = new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.35, metalness: 0.1 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.88, roughness: 0.25 });
  const feltMat = new THREE.MeshStandardMaterial({ color: BRAND.cloth, roughness: 0.92 });
  const pocketMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.9 });

  // 1. Chân bàn Rasson Ox (Thiết kế chữ V vát cạnh signature)
  const legShape = new THREE.BoxGeometry(0.55, TABLE_H - 0.25, 0.45);
  const legPositions = [
    [-TABLE_L * 0.32, 0, -TABLE_W * 0.28],
    [TABLE_L * 0.32, 0, -TABLE_W * 0.28],
    [-TABLE_L * 0.32, 0, TABLE_W * 0.28],
    [TABLE_L * 0.32, 0, TABLE_W * 0.28],
  ];
  legPositions.forEach(([x, _, z]) => {
    const leg = new THREE.Mesh(legShape, woodMat);
    leg.position.set(x, (TABLE_H - 0.25) / 2, z);
    leg.rotation.y = (x * z > 0 ? 1 : -1) * 0.12;
    leg.castShadow = true;

    // Viền vàng đế chân
    const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.04, 0.48), goldMat);
    goldTrim.position.y = -TABLE_H * 0.35;
    leg.add(goldTrim);
    group.add(leg);
  });

  // Khung dầm chịu lực nối hai bên
  const beam = new THREE.Mesh(new THREE.BoxGeometry(TABLE_L * 0.72, 0.2, 0.25), woodMat);
  beam.position.y = TABLE_H * 0.4;
  group.add(beam);

  // 2. Thùng bàn (Cabinet)
  const apron = new THREE.Mesh(new THREE.BoxGeometry(TABLE_L, 0.32, TABLE_W), woodMat);
  apron.position.y = TABLE_H - 0.18;
  apron.castShadow = true;
  group.add(apron);

  // Biển hiệu Rasson mạ vàng hai bên sườn bàn
  const logoTex = textCanvas(256, 64, (g, w, h) => {
    g.fillStyle = '#0a0d12';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d4af37';
    g.lineWidth = 2;
    g.strokeRect(2, 2, w - 4, h - 4);
    g.fillStyle = '#d4af37';
    g.font = '900 24px "Bitter", serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('RASSON OX', w / 2, h / 2);
  });
  const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.16), new THREE.MeshBasicMaterial({ map: logoTex }));
  logoMesh.position.set(0, TABLE_H - 0.18, TABLE_W / 2 + 0.01);
  group.add(logoMesh);

  const logoMeshBack = logoMesh.clone();
  logoMeshBack.position.z = -TABLE_W / 2 - 0.01;
  logoMeshBack.rotation.y = Math.PI;
  group.add(logoMeshBack);

  // 3. Mặt nỉ Simonis Electric Blue
  const felt = new THREE.Mesh(new THREE.PlaneGeometry(FELT_L, FELT_W), feltMat);
  felt.rotation.x = -Math.PI / 2;
  felt.position.y = TABLE_H;
  felt.receiveShadow = true;
  group.add(felt);

  // 4. Băng gỗ (Cushion Rails) & Điểm ngắm kim cương (Diamond Sights)
  const railGeoX = new THREE.BoxGeometry(FELT_L, 0.12, RAIL_THICK);
  const railGeoZ = new THREE.BoxGeometry(RAIL_THICK, 0.12, FELT_W);

  const railTop = new THREE.Mesh(railGeoX, woodMat);
  railTop.position.set(0, TABLE_H + 0.05, -TABLE_W / 2 + RAIL_THICK / 2);
  railTop.castShadow = true;

  const railBottom = new THREE.Mesh(railGeoX, woodMat);
  railBottom.position.set(0, TABLE_H + 0.05, TABLE_W / 2 - RAIL_THICK / 2);
  railBottom.castShadow = true;

  const railLeft = new THREE.Mesh(railGeoZ, woodMat);
  railLeft.position.set(-TABLE_L / 2 + RAIL_THICK / 2, TABLE_H + 0.05, 0);
  railLeft.castShadow = true;

  const railRight = new THREE.Mesh(railGeoZ, woodMat);
  railRight.position.set(TABLE_L / 2 - RAIL_THICK / 2, TABLE_H + 0.05, 0);
  railRight.castShadow = true;

  group.add(railTop, railBottom, railLeft, railRight);

  // Điểm ngắm xà cừ (Diamond sights) khảm trên băng
  const diamondGeo = new THREE.CircleGeometry(0.014, 4);
  const diamondMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
  for (let i = 1; i <= 7; i++) {
    const x = -FELT_L / 2 + (FELT_L / 8) * i;
    for (const zSign of [-1, 1]) {
      const d = new THREE.Mesh(diamondGeo, diamondMat);
      d.rotation.x = -Math.PI / 2;
      d.position.set(x, TABLE_H + 0.111, zSign * (TABLE_W / 2 - RAIL_THICK / 2));
      group.add(d);
    }
  }

  // 5. Góc mạ vàng & 6 Lỗ bida (Pockets)
  const cornerGeo = new THREE.BoxGeometry(RAIL_THICK * 1.15, 0.13, RAIL_THICK * 1.15);
  const pocketGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 16);

  const pocketPositions = [
    [-FELT_L / 2, TABLE_H + 0.04, -FELT_W / 2], // Góc trên trái
    [0, TABLE_H + 0.04, -FELT_W / 2 - 0.02], // Giữa trên
    [FELT_L / 2, TABLE_H + 0.04, -FELT_W / 2], // Góc trên phải
    [-FELT_L / 2, TABLE_H + 0.04, FELT_W / 2], // Góc dưới trái
    [0, TABLE_H + 0.04, FELT_W / 2 + 0.02], // Giữa dưới
    [FELT_L / 2, TABLE_H + 0.04, FELT_W / 2], // Góc dưới phải
  ];

  pocketPositions.forEach(([x, y, z]) => {
    const hole = new THREE.Mesh(pocketGeo, pocketMat);
    hole.position.set(x, y - 0.06, z);
    group.add(hole);

    // Mũ chụp góc kim loại vàng Rasson
    const cap = new THREE.Mesh(cornerGeo, goldMat);
    cap.position.set(x, y + 0.02, z);
    group.add(cap);
  });

  // 6. Đèn chùm thi đấu Matchroom phẳng không bóng (Flat LED Canopy Light)
  const lampGroup = new THREE.Group();
  lampGroup.position.set(0, TABLE_H + 2.5, 0);

  const canopyGeo = new THREE.BoxGeometry(3.6, 0.14, 1.4);
  const canopy = new THREE.Mesh(canopyGeo, woodMat);
  lampGroup.add(canopy);

  // Tấm khuếch tán LED phát sáng rực rỡ
  const diffuser = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.2), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  diffuser.rotation.x = Math.PI / 2;
  diffuser.position.y = -0.075;
  lampGroup.add(diffuser);

  // Dây cáp treo thả từ trần hang
  for (const [cx, cz] of [[-1.5, -0.5], [1.5, -0.5], [-1.5, 0.5], [1.5, 0.5]]) {
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 4.2, 8), goldMat);
    cable.position.set(cx, 2.1, cz);
    lampGroup.add(cable);
  }

  // Nguồn sáng chiếu trực tiếp xuống bàn không tạo bóng chết
  const tableLight = new THREE.PointLight('#f8fafc', 55, 12, 1.4);
  tableLight.position.set(0, -0.3, 0);
  tableLight.castShadow = true;
  tableLight.shadow.mapSize.set(1024, 1024);
  tableLight.shadow.bias = -0.001;
  lampGroup.add(tableLight);

  group.add(lampGroup);

  // ---------------------------------------------------------------------------
  // Bộ bi 9-Ball và Hệ thống Vật lý Tương tác (Break & Shoot Simulation)
  // ---------------------------------------------------------------------------
  const BALL_RADIUS = 0.062;
  const BALL_Y = TABLE_H + BALL_RADIUS;
  const balls = [];
  const ballMeshGroup = new THREE.Group();
  group.add(ballMeshGroup);

  const ballSphereGeo = new THREE.SphereGeometry(BALL_RADIUS, 24, 20);

  // Xếp hình thoi 9-ball (Diamond 9-Ball Rack): Bi 1 ở đỉnh, Bi 9 ở tâm
  const rackPattern = [
    { no: 1, row: 0, col: 0 },
    { no: 2, row: 1, col: -0.5 },
    { no: 3, row: 1, col: 0.5 },
    { no: 4, row: 2, col: -1 },
    { no: 9, row: 2, col: 0 }, // Bi 9 ở tâm hình thoi
    { no: 5, row: 2, col: 1 },
    { no: 6, row: 3, col: -0.5 },
    { no: 7, row: 3, col: 0.5 },
    { no: 8, row: 4, col: 0 },
  ];

  function createBall(no, x, z) {
    const mat = new THREE.MeshStandardMaterial({
      map: createBallTexture(no),
      roughness: 0.25,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(ballSphereGeo, mat);
    mesh.position.set(x, BALL_Y, z);
    mesh.castShadow = true;
    ballMeshGroup.add(mesh);
    return {
      no,
      mesh,
      pos: new THREE.Vector2(x, z),
      vel: new THREE.Vector2(0, 0),
      pocketed: false,
    };
  }

  // Bi cái (Cue Ball) đặt tại vạch đầu bàn (Head string)
  let cueBall = createBall(0, -FELT_L * 0.28, 0);
  balls.push(cueBall);

  // Cụm 9 bi xếp tại điểm cuối bàn (Foot spot)
  const rackOriginX = FELT_L * 0.24;
  const colSpacing = BALL_RADIUS * 2.02;
  const rowSpacing = BALL_RADIUS * 1.76;

  rackPattern.forEach(({ no, row, col }) => {
    const x = rackOriginX + row * rowSpacing;
    const z = col * colSpacing;
    balls.push(createBall(no, x, z));
  });

  function resetRack() {
    ballMeshGroup.clear();
    balls.length = 0;

    cueBall = createBall(0, -FELT_L * 0.28, 0);
    balls.push(cueBall);

    rackPattern.forEach(({ no, row, col }) => {
      const x = rackOriginX + row * rowSpacing;
      const z = col * colSpacing;
      balls.push(createBall(no, x, z));
    });
    audio?.chalk?.();
  }

  /**
   * Cú Phá Bi (Break Shot): Phát lực cực mạnh từ bi cái lao vào cụm 9 bi
   */
  function breakShot(power = 18, angleJitter = 0) {
    if (cueBall.pocketed) {
      cueBall.pos.set(-FELT_L * 0.28, 0);
      cueBall.pocketed = false;
      cueBall.mesh.visible = true;
    }
    const aim = new THREE.Vector2(rackOriginX - cueBall.pos.x, 0 + angleJitter).normalize();
    cueBall.vel.copy(aim.multiplyScalar(power));
    audio?.cueHit?.(1);
  }

  // Cập nhật vật lý bi lăn, va đập, nảy băng và rơi lỗ
  const minX = -FELT_L / 2 + BALL_RADIUS + 0.03;
  const maxX = FELT_L / 2 - BALL_RADIUS - 0.03;
  const minZ = -FELT_W / 2 + BALL_RADIUS + 0.03;
  const maxZ = FELT_W / 2 - BALL_RADIUS - 0.03;

  function updateBalls(dt) {
    const friction = Math.exp(-dt * 1.35);

    // 1. Di chuyển và nảy băng
    for (const b of balls) {
      if (b.pocketed) continue;

      b.pos.x += b.vel.x * dt;
      b.pos.z += b.vel.y * dt;
      b.vel.multiplyScalar(friction);

      if (b.vel.lengthSq() < 0.0005) {
        b.vel.set(0, 0);
      }

      // Nảy băng x
      if (b.pos.x < minX) {
        b.pos.x = minX;
        b.vel.x *= -0.82;
        if (Math.abs(b.vel.x) > 0.4) audio?.ballClick?.(0.5);
      } else if (b.pos.x > maxX) {
        b.pos.x = maxX;
        b.vel.x *= -0.82;
        if (Math.abs(b.vel.x) > 0.4) audio?.ballClick?.(0.5);
      }

      // Nảy băng z
      if (b.pos.z < minZ) {
        b.pos.z = minZ;
        b.vel.y *= -0.82;
        if (Math.abs(b.vel.y) > 0.4) audio?.ballClick?.(0.5);
      } else if (b.pos.z > maxZ) {
        b.pos.z = maxZ;
        b.vel.y *= -0.82;
        if (Math.abs(b.vel.y) > 0.4) audio?.ballClick?.(0.5);
      }

      // Rơi lỗ (Check 6 pockets)
      for (const [px, _, pz] of pocketPositions) {
        if (Math.hypot(b.pos.x - px, b.pos.z - pz) < 0.16) {
          b.pocketed = true;
          b.vel.set(0, 0);
          b.mesh.visible = false;
          audio?.pocketDrop?.();
          break;
        }
      }

      // Cập nhật vị trí mesh và lăn xoay tròn
      b.mesh.position.x = b.pos.x;
      b.mesh.position.z = b.pos.z;
      const rollDist = b.vel.length() * dt;
      if (rollDist > 0) {
        const rollAxis = new THREE.Vector3(-b.vel.y, 0, b.vel.x).normalize();
        b.mesh.rotateOnWorldAxis(rollAxis, rollDist / BALL_RADIUS);
      }
    }

    // 2. Va chạm giữa các bi (Ball-to-Ball Elastic Collisions)
    const minDist = BALL_RADIUS * 2;
    for (let i = 0; i < balls.length; i++) {
      const b1 = balls[i];
      if (b1.pocketed) continue;

      for (let j = i + 1; j < balls.length; j++) {
        const b2 = balls[j];
        if (b2.pocketed) continue;

        const dx = b2.pos.x - b1.pos.x;
        const dz = b2.pos.z - b1.pos.z;
        const dist = Math.hypot(dx, dz);

        if (dist < minDist && dist > 0.0001) {
          const nx = dx / dist;
          const nz = dz / dist;

          // Đẩy hai bi ra không dính nhau
          const overlap = (minDist - dist) / 2;
          b1.pos.x -= nx * overlap;
          b1.pos.z -= nz * overlap;
          b2.pos.x += nx * overlap;
          b2.pos.z += nz * overlap;

          // Tách vận tốc theo pháp tuyến va chạm
          const kx = b1.vel.x - b2.vel.x;
          const kz = b1.vel.y - b2.vel.y;
          const p = 2 * (nx * kx + nz * kz) / 2;

          b1.vel.x -= p * nx * 0.94;
          b1.vel.y -= p * nz * 0.94;
          b2.vel.x += p * nx * 0.94;
          b2.vel.y += p * nz * 0.94;

          const imp = Math.hypot(p * nx, p * nz);
          if (imp > 0.3) audio?.ballClick?.(Math.min(1.2, imp / 5));
        }
      }
    }
  }

  return {
    group,
    tableLight,
    balls,
    resetRack,
    breakShot,
    update: updateBalls,
  };
}

/**
 * Đèn chiếu tường LED / Đuốc hiện đại phong cách Đấu trường ngầm
 */
export function createArenaTorch() {
  const group = new THREE.Group();

  const fixtureMat = new THREE.MeshStandardMaterial({ color: '#18181b', metalness: 0.8, roughness: 0.3 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.9, roughness: 0.2 });

  // Giá gắn tường
  const mount = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.18), fixtureMat);
  mount.castShadow = true;
  group.add(mount);

  // Thanh LED dọc màu xanh Simonis
  const bar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.8, 16),
    new THREE.MeshBasicMaterial({ color: '#38bdf8' }),
  );
  bar.position.set(0, 0, 0.16);
  group.add(bar);

  // Vành vàng bọc hai đầu
  for (const sy of [-0.38, 0.38]) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 16), goldMat);
    ring.position.set(0, sy, 0.16);
    group.add(ring);
  }

  // Ánh sáng xanh hắt vào vách đá
  const light = new THREE.PointLight('#38bdf8', 12, 10, 1.8);
  light.position.set(0, 0, 0.35);
  group.add(light);

  const seed = Math.random() * 10;
  return {
    group,
    update(t) {
      const s = 1 + Math.sin(t * 8 + seed) * 0.06;
      light.intensity = 11.5 + Math.sin(t * 12 + seed) * 1.5;
      bar.scale.set(s, 1, s);
    },
  };
}
