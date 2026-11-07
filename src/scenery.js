import * as THREE from 'three';
import { BALL_CONFIG, BRAND } from './config.js';
import { createCueMesh } from './avatar.js';
import {
  BALL_RADIUS,
  BALL_Y,
  FELT_L,
  FELT_W,
  TABLE_H,
  POCKET_LOCATIONS,
} from './billiards/constants.js';
import {
  BilliardsPhysics,
  BallState,
  BallPosition,
  buildDiamondRackPositions,
} from './billiards/physics.js';
import { getLowestActiveBall } from './billiards/nineball.js';

/** Lightweight PRNG to keep deterministic geometry between reloads */
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

/** Low-poly rock: deformed icosahedron with flat shading */
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
 * Text canvas texture for signs, scoreboards, and posters.
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
 * Creates 3D spherical billiard ball texture with color stripe and numbers.
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

  // Ball number on both sides
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
 * Authentic Rasson Ox Tournament 9-Foot table positioned at the arena center:
 * Sculpted V-shaped legs, gold metallic corner castings, Simonis Electric Blue cloth,
 * Matchroom canopy light overhead, and interactive 9-ball physics simulation.
 */
export function createRassonBilliardsTable(audio = null) {
  const group = new THREE.Group();

  const TABLE_L = 4.4; // Length (x)
  const TABLE_W = 2.4; // Width (z)
  const TABLE_H = 1.05; // Table surface height (y)
  const RAIL_THICK = 0.22;
  const FELT_L = TABLE_L - RAIL_THICK * 2;
  const FELT_W = TABLE_W - RAIL_THICK * 2;

  const woodMat = new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.35, metalness: 0.1 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.88, roughness: 0.25 });
  const feltMat = new THREE.MeshStandardMaterial({ color: BRAND.cloth, roughness: 0.92 });
  const pocketMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.9 });

  // 1. Rasson Ox table legs (Signature chamfered V-beam design)
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

    // Gold foot base trim
    const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.04, 0.48), goldMat);
    goldTrim.position.y = -TABLE_H * 0.35;
    leg.add(goldTrim);
    group.add(leg);
  });

  // Cross structural beam
  const beam = new THREE.Mesh(new THREE.BoxGeometry(TABLE_L * 0.72, 0.2, 0.25), woodMat);
  beam.position.y = TABLE_H * 0.4;
  group.add(beam);

  // 2. Table cabinet apron
  const apron = new THREE.Mesh(new THREE.BoxGeometry(TABLE_L, 0.32, TABLE_W), woodMat);
  apron.position.y = TABLE_H - 0.18;
  apron.castShadow = true;
  group.add(apron);

  // Rasson Bearbrick gold-framed logo plaque on side aprons
  const tableLoader = new THREE.TextureLoader();
  const tableLogoTex = tableLoader.load(BRAND.logo);
  tableLogoTex.colorSpace = THREE.SRGBColorSpace;
  tableLogoTex.minFilter = THREE.LinearMipmapLinearFilter;
  const tableLogoMat = new THREE.MeshStandardMaterial({
    map: tableLogoTex,
    roughness: 0.4,
    metalness: 0.1,
  });
  const tableLogoBorderMat = new THREE.MeshStandardMaterial({
    color: '#d4af37',
    metalness: 0.85,
    roughness: 0.2,
  });

  const logoFrame = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), tableLogoBorderMat);
  logoFrame.position.set(0, TABLE_H - 0.18, TABLE_W / 2 + 0.005);
  group.add(logoFrame);

  const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), tableLogoMat);
  logoMesh.position.set(0, TABLE_H - 0.18, TABLE_W / 2 + 0.01);
  group.add(logoMesh);

  const logoFrameBack = logoFrame.clone();
  logoFrameBack.position.z = -TABLE_W / 2 - 0.005;
  logoFrameBack.rotation.y = Math.PI;
  group.add(logoFrameBack);

  const logoMeshBack = logoMesh.clone();
  logoMeshBack.position.z = -TABLE_W / 2 - 0.01;
  logoMeshBack.rotation.y = Math.PI;
  group.add(logoMeshBack);

  // 3. Simonis Electric Blue bed cloth
  const felt = new THREE.Mesh(new THREE.PlaneGeometry(FELT_L, FELT_W), feltMat);
  felt.rotation.x = -Math.PI / 2;
  felt.position.y = TABLE_H;
  felt.receiveShadow = true;
  group.add(felt);

  // 4. Cushion rails and inlaid diamond sights
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

  // Inlaid mother-of-pearl diamond sights
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

  // 5. Gold corner castings and 6 pockets
  const cornerGeo = new THREE.BoxGeometry(RAIL_THICK * 1.15, 0.13, RAIL_THICK * 1.15);
  const pocketGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 16);

  const pocketPositions = [
    [-FELT_L / 2, TABLE_H + 0.04, -FELT_W / 2], // Top left corner
    [0, TABLE_H + 0.04, -FELT_W / 2 - 0.02], // Top center
    [FELT_L / 2, TABLE_H + 0.04, -FELT_W / 2], // Top right corner
    [-FELT_L / 2, TABLE_H + 0.04, FELT_W / 2], // Bottom left corner
    [0, TABLE_H + 0.04, FELT_W / 2 + 0.02], // Bottom center
    [FELT_L / 2, TABLE_H + 0.04, FELT_W / 2], // Bottom right corner
  ];

  pocketPositions.forEach(([x, y, z]) => {
    const hole = new THREE.Mesh(pocketGeo, pocketMat);
    hole.position.set(x, y - 0.06, z);
    group.add(hole);

    // Rasson gold metal corner casting
    const cap = new THREE.Mesh(cornerGeo, goldMat);
    cap.position.set(x, y + 0.02, z);
    group.add(cap);
  });

  // 6. Flat LED canopy tournament lighting
  const lampGroup = new THREE.Group();
  lampGroup.position.set(0, TABLE_H + 2.5, 0);

  const canopyGeo = new THREE.BoxGeometry(3.6, 0.14, 1.4);
  const canopy = new THREE.Mesh(canopyGeo, woodMat);
  lampGroup.add(canopy);

  // High-diffusion LED emission panel
  const diffuser = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.2), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  diffuser.rotation.x = Math.PI / 2;
  diffuser.position.y = -0.075;
  lampGroup.add(diffuser);

  // Ceiling hanging suspension cables
  for (const [cx, cz] of [[-1.5, -0.5], [1.5, -0.5], [-1.5, 0.5], [1.5, 0.5]]) {
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 4.2, 8), goldMat);
    cable.position.set(cx, 2.1, cz);
    lampGroup.add(cable);
  }

  // Shadowless direct table illumination
  const tableLight = new THREE.PointLight('#f8fafc', 55, 12, 1.4);
  tableLight.position.set(0, -0.3, 0);
  tableLight.castShadow = true;
  tableLight.shadow.mapSize.set(1024, 1024);
  tableLight.shadow.bias = -0.001;
  lampGroup.add(tableLight);

  group.add(lampGroup);

  // ---------------------------------------------------------------------------
  // Authentic 9-Ball Billiards Physics & Interactive 3D Simulation
  // ---------------------------------------------------------------------------
  const balls = [];
  const ballMeshGroup = new THREE.Group();
  group.add(ballMeshGroup);

  const ballSphereGeo = new THREE.SphereGeometry(BALL_RADIUS, 24, 20);

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
      pos: new BallPosition(x, z),
      vel: new THREE.Vector2(0, 0),
      rvel: new THREE.Vector3(0, 0, 0),
      pocketed: false,
      state: BallState.STATIONARY,
    };
  }

  // Create balls 0 (cue ball) through 9 (9-ball)
  const initialRack = buildDiamondRackPositions();
  for (let i = 0; i <= 9; i++) {
    const initPos = initialRack.get(i) || { x: 0, z: 0 };
    balls.push(createBall(i, initPos.x, initPos.z));
  }

  const cueBall = balls[0];

  // Initialize physics simulation engine
  const physics = new BilliardsPhysics(audio);
  physics.setBalls(balls);

  // ---------------------------------------------------------------------------
  // 3D Cue Stick, Aim Trajectory, and Target Ball Ring
  // ---------------------------------------------------------------------------
  const cueRoot = new THREE.Group();
  const cueStick = createCueMesh('ngocmy');
  cueStick.rotation.y = Math.PI;
  cueRoot.add(cueStick);
  group.add(cueRoot);
  cueRoot.visible = false;

  // Aim trajectory line
  const aimLinePoints = [new THREE.Vector3(), new THREE.Vector3()];
  const aimLineGeo = new THREE.BufferGeometry().setFromPoints(aimLinePoints);
  const aimLineMat = new THREE.LineDashedMaterial({
    color: '#38bdf8',
    dashSize: 0.06,
    gapSize: 0.04,
  });
  const aimLine = new THREE.Line(aimLineGeo, aimLineMat);
  group.add(aimLine);
  aimLine.visible = false;

  // Target ball highlight ring (highlights lowest numbered ball on table)
  const targetRingGeo = new THREE.RingGeometry(BALL_RADIUS * 1.15, BALL_RADIUS * 1.45, 32);
  const targetRingMat = new THREE.MeshBasicMaterial({
    color: '#f59e0b',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  const targetRing = new THREE.Mesh(targetRingGeo, targetRingMat);
  targetRing.rotation.x = -Math.PI / 2;
  targetRing.position.y = TABLE_H + 0.003;
  group.add(targetRing);

  let cueAimAngle = 0;
  let cuePower = 0.5;
  let cueOffset = { x: 0, y: 0 };
  let strokeAnim = 0;

  function rackDiamond() {
    const positions = buildDiamondRackPositions();
    for (const b of balls) {
      const p = positions.get(b.no);
      if (p) {
        b.pos.set(p.x, p.z);
      }
      b.vel.set(0, 0);
      b.rvel.set(0, 0, 0);
      b.pocketed = false;
      b.state = BallState.STATIONARY;
      b.mesh.visible = true;
      b.mesh.position.set(b.pos.x, BALL_Y, b.pos.z);
      b.mesh.rotation.set(0, 0, 0);
    }
    physics.resetEvents();
    audio?.chalk?.();
  }

  function setAim({ angle = 0, power = 0.5, spinOffset = { x: 0, y: 0 }, visible = true }) {
    cueAimAngle = Number.isFinite(angle) ? angle : 0;
    cuePower = Number.isFinite(power) ? power : 0.5;
    cueOffset = spinOffset && typeof spinOffset === 'object' ? spinOffset : { x: 0, y: 0 };

    if (!visible || cueBall.pocketed) {
      cueRoot.visible = false;
      aimLine.visible = false;
      return;
    }

    cueRoot.visible = true;
    aimLine.visible = true;

    const bx = Number.isFinite(cueBall.pos?.x) ? cueBall.pos.x : 0;
    const bz = Number.isFinite(cueBall.pos?.z) ? cueBall.pos.z : 0;

    cueRoot.position.set(bx, BALL_Y, bz);
    cueRoot.rotation.y = -cueAimAngle;

    const pullBack = 0.08 + cuePower * 0.45;
    const offX = Number.isFinite(cueOffset.x) ? cueOffset.x : 0;
    const offY = Number.isFinite(cueOffset.y) ? cueOffset.y : 0;
    cueStick.position.set(offX * BALL_RADIUS * 0.6, offY * BALL_RADIUS * 0.6, -pullBack);

    const lineLen = 1.8;
    const endX = bx + Math.cos(cueAimAngle) * lineLen;
    const endZ = bz + Math.sin(cueAimAngle) * lineLen;
    const posAttr = aimLine.geometry.attributes.position;
    posAttr.setXYZ(0, bx, BALL_Y, bz);
    posAttr.setXYZ(1, endX, BALL_Y, endZ);
    posAttr.needsUpdate = true;
    aimLine.computeLineDistances();
  }

  function strikeShot(angle = cueAimAngle, power = cuePower, spinOffset = cueOffset) {
    if (cueBall.pocketed) {
      cueBall.pos.set(-FELT_L * 0.28, 0);
      cueBall.pocketed = false;
      cueBall.mesh.visible = true;
      cueBall.mesh.position.set(cueBall.pos.x, BALL_Y, cueBall.pos.z);
    }

    strokeAnim = 0.25;
    physics.strikeCueBall(angle, power, spinOffset);
    aimLine.visible = false;
  }

  function breakShot(power = 1.0, angleJitter = 0) {
    if (cueBall.pocketed) {
      cueBall.pos.set(-FELT_L * 0.28, 0);
      cueBall.pocketed = false;
      cueBall.mesh.visible = true;
      cueBall.mesh.position.set(cueBall.pos.x, BALL_Y, cueBall.pos.z);
    }
    const rackOriginX = FELT_L * 0.24;
    const bx = Number.isFinite(cueBall.pos?.x) ? cueBall.pos.x : -FELT_L * 0.28;
    const angle = Math.atan2(0 + angleJitter, rackOriginX - bx);
    strikeShot(angle, power, { x: 0, y: 0.1 });
  }

  function setBallPositions(ballDataList) {
    if (!Array.isArray(ballDataList)) return;
    for (const data of ballDataList) {
      const b = balls.find((ball) => ball.no === data.no);
      if (b && typeof data.x === 'number' && typeof data.z === 'number') {
        b.pos.set(data.x, data.z);
        b.pocketed = !!data.pocketed;
        b.vel.set(0, 0);
        b.rvel.set(0, 0, 0);
        b.mesh.visible = !b.pocketed;
        b.mesh.position.set(b.pos.x, BALL_Y, b.pos.z);
      }
    }
  }

  function getBallPositions() {
    return balls.map((b) => ({
      no: b.no,
      x: +b.pos.x.toFixed(3),
      z: +b.pos.z.toFixed(3),
      pocketed: b.pocketed,
    }));
  }

  function updateBalls(dt) {
    physics.update(dt);

    if (strokeAnim > 0) {
      strokeAnim = Math.max(0, strokeAnim - dt);
      const strokePush = Math.sin((1 - strokeAnim / 0.25) * Math.PI) * 0.12;
      cueStick.position.z += strokePush;
      if (strokeAnim === 0) cueRoot.visible = false;
    }

    for (const b of balls) {
      if (b.pocketed) {
        if (b.mesh.position.y > TABLE_H - 0.12) {
          b.mesh.position.y -= dt * 1.8;
        } else {
          b.mesh.visible = false;
        }
        continue;
      }

      b.mesh.visible = true;
      b.mesh.position.x = b.pos.x;
      b.mesh.position.y = BALL_Y;
      b.mesh.position.z = b.pos.z;

      const rollDist = b.vel.length() * dt;
      if (rollDist > 0.0001) {
        const rollAxis = new THREE.Vector3(-b.vel.y, 0, b.vel.x).normalize();
        b.mesh.rotateOnWorldAxis(rollAxis, rollDist / BALL_RADIUS);
      }
    }

    const lowest = getLowestActiveBall(balls);
    if (lowest !== null) {
      const targetBall = balls.find((b) => b.no === lowest);
      if (targetBall && !targetBall.pocketed) {
        targetRing.visible = true;
        targetRing.position.x = targetBall.pos.x;
        targetRing.position.z = targetBall.pos.z;
        targetRing.rotation.z += dt * 1.5;
      } else {
        targetRing.visible = false;
      }
    } else {
      targetRing.visible = false;
    }
  }

  return {
    group,
    tableLight,
    balls,
    physics,
    resetRack: rackDiamond,
    rackDiamond,
    breakShot,
    strikeShot,
    setAim,
    setBallPositions,
    getBallPositions,
    isAllStationary: () => physics.isAllStationary(),
    update: updateBalls,
  };
}

/**
 * Modern arena wall sconce with Simonis blue vertical LED luminaire.
 */
export function createArenaTorch() {
  const group = new THREE.Group();

  const fixtureMat = new THREE.MeshStandardMaterial({ color: '#18181b', metalness: 0.8, roughness: 0.3 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.9, roughness: 0.2 });

  // Wall mount bracket
  const mount = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.18), fixtureMat);
  mount.castShadow = true;
  group.add(mount);

  // Vertical LED light bar
  const bar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.8, 16),
    new THREE.MeshBasicMaterial({ color: '#38bdf8' }),
  );
  bar.position.set(0, 0, 0.16);
  group.add(bar);

  // Gold end caps
  for (const sy of [-0.38, 0.38]) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 16), goldMat);
    ring.position.set(0, sy, 0.16);
    group.add(ring);
  }

  // Cavern wall cast lighting
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
