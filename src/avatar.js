import * as THREE from 'three';
import { BALL_CONFIG, BRAND, CUE_STYLES } from './config.js';

const SKIN = '#e6b998';

/**
 * Creates professional polo jersey texture with Rasson emblem and back ball number.
 */
function poloTexture(ballNumber = 8, poloColor = BRAND.jersey.body) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d');

  // Polo body base
  g.fillStyle = poloColor;
  g.fillRect(0, 0, c.width, c.height);

  // Collar and placket trim
  g.fillStyle = BRAND.jersey.trim;
  g.fillRect(0, 0, c.width, 16);

  // Front side (UV u ≈ 0..0.25 and 0.75..1): V-neck collar & chest logo
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.moveTo(c.width * 0.08, 0);
  g.lineTo(c.width * 0.08, 48);
  g.lineTo(c.width * 0.12, 16);
  g.closePath();
  g.fill();

  // Left chest Rasson badge
  g.fillStyle = BRAND.jersey.trim;
  g.beginPath();
  g.arc(c.width * 0.18, 72, 16, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#111827';
  g.font = '900 13px Bitter, Georgia, serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('R', c.width * 0.18, 73);

  // Back side (UV u ≈ 0.5): Player number ball emblem
  if (ballNumber != null) {
    const num = Math.min(15, Math.max(0, ballNumber));
    const ballCfg = BALL_CONFIG[num] || BALL_CONFIG[8];
    const cx = c.width / 2;
    const cy = 135;
    const r = 58;

    // Back ball disc
    g.beginPath();
    g.arc(cx, cy, r + 4, 0, Math.PI * 2);
    g.fillStyle = 'rgba(0, 0, 0, 0.45)';
    g.fill();

    g.save();
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.clip();

    if (ballCfg.stripe) {
      g.fillStyle = '#ffffff';
      g.fillRect(cx - r, cy - r, r * 2, r * 2);
      g.fillStyle = ballCfg.color;
      g.fillRect(cx - r, cy - r * 0.52, r * 2, r * 1.04);
    } else {
      g.fillStyle = ballCfg.color;
      g.fillRect(cx - r, cy - r, r * 2, r * 2);
    }

    // White center spot for number
    g.beginPath();
    g.arc(cx, cy, r * 0.48, 0, Math.PI * 2);
    g.fillStyle = '#ffffff';
    g.fill();
    g.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    g.lineWidth = 1.5;
    g.stroke();

    g.fillStyle = '#111827';
    g.font = '900 34px Bitter, Georgia, serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(String(num), cx, cy + 1);

    if (num === 6 || num === 9) {
      g.fillRect(cx - 10, cy + 16, 20, 3);
    }
    g.restore();

    // RASSON PRO header text
    g.fillStyle = BRAND.jersey.trim;
    g.font = '700 16px "Be Vietnam Pro", sans-serif';
    g.textAlign = 'center';
    g.letterSpacing = '3px';
    g.fillText('RASSON PRO', cx, 52);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Creates 3D professional billiard cue stick mesh.
 */
export function createCueMesh(styleId = 'carbon') {
  const cueGroup = new THREE.Group();
  const style = CUE_STYLES.find((s) => s.id === styleId) || CUE_STYLES[0];

  // 1. Butt: Leather-wrapped wood or carbon
  const buttLen = 0.72;
  const buttGeo = new THREE.CylinderGeometry(0.016, 0.021, buttLen, 16);
  const buttMat = new THREE.MeshStandardMaterial({ color: style.wrap, roughness: 0.45, metalness: 0.1 });
  const butt = new THREE.Mesh(buttGeo, buttMat);
  butt.position.y = buttLen / 2;
  butt.castShadow = true;
  cueGroup.add(butt);

  // Rubber bumper at butt end
  const bumper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.019, 0.021, 0.025, 12),
    new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.9 }),
  );
  bumper.position.y = 0.012;
  cueGroup.add(bumper);

  // Joint collar / Accent ring
  const ring = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0165, 0.0165, 0.035, 16),
    new THREE.MeshStandardMaterial({ color: style.ring, metalness: 0.85, roughness: 0.2 }),
  );
  ring.position.y = buttLen;
  cueGroup.add(ring);

  // 2. Shaft: Tapered carbon or Canadian maple
  const shaftLen = 0.78;
  const shaftGeo = new THREE.CylinderGeometry(0.0075, 0.015, shaftLen, 16);
  const shaftMat = new THREE.MeshStandardMaterial({ color: style.shaft, roughness: 0.25 });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.position.y = buttLen + shaftLen / 2;
  shaft.castShadow = true;
  cueGroup.add(shaft);

  // 3. Ferrule: High-grade synthetic white ferrule
  const ferruleLen = 0.02;
  const ferrule = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0075, 0.0077, ferruleLen, 12),
    new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 }),
  );
  ferrule.position.y = buttLen + shaftLen + ferruleLen / 2;
  cueGroup.add(ferrule);

  // 4. Tip: Multi-layered leather tip chalked with blue chalk
  const tip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0074, 0.0075, 0.01, 12),
    new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.8 }),
  );
  tip.position.y = buttLen + shaftLen + ferruleLen + 0.005;
  cueGroup.add(tip);

  cueGroup.rotation.x = Math.PI / 2; // Forward alignment when shooting
  return cueGroup;
}

/**
 * 3D Billiards player avatar with Polo shirt, Billiard glove, and Rasson Cue Stick.
 */
export function createAvatar(number = 8, cueStyle = 'ngocmy') {
  const root = new THREE.Group();

  // Polo shirt body
  const bodyMat = new THREE.MeshStandardMaterial({ map: poloTexture(number), roughness: 0.7 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 1.1, 24, 1), bodyMat);
  body.position.y = 0.75;
  body.castShadow = true;
  root.add(body);

  // Elegant tournament dress pants
  const pants = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.48, 0.3, 24),
    new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.8 }),
  );
  pants.position.y = 0.15;
  pants.castShadow = true;
  root.add(pants);

  // Head
  const skinMat = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.6 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), skinMat);
  head.position.y = 1.55;
  head.castShadow = true;
  root.add(head);

  // Neatly styled player hair
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.31, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2.2),
    new THREE.MeshStandardMaterial({ color: '#27201c', roughness: 0.85 }),
  );
  hair.position.y = 1.58;
  root.add(hair);

  // Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#18181b' });
  for (const sx of [-0.1, 0.1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMat);
    eye.position.set(sx, 1.58, 0.27);
    root.add(eye);
  }

  // Arms:
  // - Left hand: 3-finger Simonis blue billiard glove
  // - Right hand: Holding Rasson Pro cue stick
  const armGeo = new THREE.CapsuleGeometry(0.1, 0.45, 4, 10);
  const sleeveMat = new THREE.MeshStandardMaterial({ color: BRAND.jersey.body, roughness: 0.75 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: BRAND.jersey.accent, roughness: 0.6 });
  const arms = [];

  // Left arm (Bridge hand with billiard glove)
  const leftPivot = new THREE.Group();
  leftPivot.position.set(-0.55, 1.15, 0);
  const leftArm = new THREE.Mesh(armGeo, sleeveMat);
  leftArm.position.y = -0.3;
  leftArm.castShadow = true;
  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), gloveMat);
  leftHand.position.y = -0.62;
  leftPivot.add(leftArm, leftHand);
  root.add(leftPivot);
  arms.push(leftPivot);

  // Right arm (Holding cue stick)
  const rightPivot = new THREE.Group();
  rightPivot.position.set(0.55, 1.15, 0);
  const rightArm = new THREE.Mesh(armGeo, sleeveMat);
  rightArm.position.y = -0.3;
  rightArm.castShadow = true;
  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), skinMat);
  rightHand.position.y = -0.62;

  // Cue stick mounted to right hand
  const cue = createCueMesh(cueStyle);
  cue.position.set(0.02, -0.6, 0.1);
  cue.rotation.set(0.2, 0, -0.15);
  cue.scale.setScalar(0.95);
  rightHand.add(cue);

  rightPivot.add(rightArm, rightHand);
  root.add(rightPivot);
  arms.push(rightPivot);

  // Ground indicator ring (turns gold or red when targeted)
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.76, 40),
    new THREE.MeshBasicMaterial({ color: BRAND.jersey.trim, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  root.add(ring);

  // Animation and movement state
  const anim = {
    walk: 0,
    strike: 0,
    celebrate: 0,
    hit: 0,
    ghost: false,
    t: 0,
  };

  function setGhost(on) {
    anim.ghost = on;
    root.traverse((o) => {
      if (!o.isMesh || o === ring) return;
      o.material.transparent = on;
      o.material.opacity = on ? 0.32 : 1;
      o.material.depthWrite = !on;
      o.material.needsUpdate = true;
      o.castShadow = !on;
    });
  }

  function update(dt, moving) {
    anim.walk += dt * (moving ? 10 : 0);
    const swing = moving ? Math.sin(anim.walk) * 0.55 : 0;

    arms[0].rotation.x = swing;
    arms[1].rotation.x = -swing * 0.8;
    body.position.y = 0.75 + (moving ? Math.abs(Math.sin(anim.walk)) * 0.05 : 0);

    // Cue stroke sparring animation
    if (anim.strike > 0) {
      anim.strike = Math.max(0, anim.strike - dt);
      const progress = 1 - anim.strike / 0.35;
      const strokeMotion = Math.sin(Math.min(1, progress) * Math.PI);
      arms[1].rotation.x = -Math.PI / 2.2 * strokeMotion;
      arms[1].position.z = strokeMotion * 0.22;
      arms[0].rotation.x = -Math.PI / 3 * strokeMotion;
    } else {
      arms[1].position.z = 0;
    }

    // Victory celebration animation (raising cue overhead)
    if (anim.celebrate > 0) {
      anim.celebrate = Math.max(0, anim.celebrate - dt);
      const t = 1.6 - anim.celebrate;
      arms[0].rotation.z = -2.5;
      arms[1].rotation.z = 2.5;
      arms[1].rotation.x = -0.5;
      root.position.y = Math.abs(Math.sin(t * 7)) * 0.55;
    } else if (anim.strike <= 0) {
      arms[0].rotation.z = 0;
      arms[1].rotation.z = 0;
      anim.t += dt;
      root.position.y = anim.ghost ? 0.35 + Math.sin(anim.t * 2.5) * 0.12 : 0;
    }

    // Hit response / knockback
    if (anim.hit > 0) {
      anim.hit = Math.max(0, anim.hit - dt);
      root.rotation.z = Math.sin(anim.hit * 40) * 0.15 * (anim.hit / 0.5);
    } else {
      root.rotation.z = 0;
    }
  }

  return {
    root,
    ring,
    cue,
    update,
    punch: () => (anim.strike = 0.35),
    strike: () => (anim.strike = 0.35),
    celebrate: () => (anim.celebrate = 1.6),
    hit: () => (anim.hit = 0.5),
    setGhost,
    get ghost() {
      return anim.ghost;
    },
    get celebrating() {
      return anim.celebrate > 0;
    },
    dispose() {
      root.traverse((o) => {
        if (o.isMesh) {
          o.geometry.dispose();
          o.material.map?.dispose();
          o.material.dispose();
        }
      });
    },
  };
}

/**
 * Floor-standing cue rack for the lounge and arena.
 */
export function createHangingCueRack() {
  const rack = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.8 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.8, roughness: 0.3 });

  // Circular base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.08, 24), woodMat);
  base.position.y = 0.04;
  base.castShadow = true;
  rack.add(base);

  // Central pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 16), woodMat);
  pole.position.y = 1.1;
  rack.add(pole);

  // Top cue clip ring
  const topRing = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 24), goldMat);
  topRing.position.y = 1.95;
  rack.add(topRing);

  // 6 cues positioned around perimeter
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const cue = createCueMesh(CUE_STYLES[i % CUE_STYLES.length].id);
    cue.rotation.x = Math.PI; // Upright
    cue.position.set(Math.cos(a) * 0.42, 0.08, Math.sin(a) * 0.42);
    cue.scale.setScalar(1.2);
    rack.add(cue);
  }

  return rack;
}
