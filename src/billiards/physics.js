import * as THREE from 'three';
import {
  BALL_RADIUS,
  R,
  BALL_MASS,
  g,
  MIN_X,
  MAX_X,
  MIN_Z,
  MAX_Z,
  MU_ROLLING,
  MU_SLIDING,
  RHO_SPINDOWN,
  CUSHION_RESTITUTION,
  CUSHION_FRICTION,
  POCKET_RADIUS,
  POCKET_LOCATIONS,
  MAX_POWER,
  OFF_CENTER_LIMIT,
  FELT_L,
  FELT_W,
} from './constants.js';

export const BallState = {
  STATIONARY: 'stationary',
  SLIDING: 'sliding',
  ROLLING: 'rolling',
  POCKETED: 'pocketed',
};

/**
 * 2D table surface position with robust X-Z coordinates.
 * Exposes .y getter/setter alias to .z for backwards compatibility.
 */
export class BallPosition {
  constructor(x = 0, z = 0) {
    this.x = Number.isFinite(x) ? x : 0;
    this.z = Number.isFinite(z) ? z : 0;
  }

  set(x, z) {
    this.x = Number.isFinite(x) ? x : 0;
    this.z = Number.isFinite(z) ? z : 0;
    return this;
  }

  get y() {
    return this.z;
  }

  set y(val) {
    this.z = Number.isFinite(val) ? val : 0;
  }

  clone() {
    return new BallPosition(this.x, this.z);
  }

  copy(p) {
    if (!p) return this;
    this.x = Number.isFinite(p.x) ? p.x : 0;
    this.z = Number.isFinite(p.z) ? p.z : (Number.isFinite(p.y) ? p.y : 0);
    return this;
  }

  distanceTo(p) {
    const px = p?.x ?? 0;
    const pz = p?.z ?? p?.y ?? 0;
    return Math.hypot(this.x - px, this.z - pz);
  }
}

/**
 * Calculates cue strike impulse and spin based on angle, power, and tip offset.
 *
 * @param {number} angle Horizontal aim angle in radians (in X-Z plane)
 * @param {number} power Power factor from 0.0 to 1.0 (or speed in m/s)
 * @param {{x: number, y: number}} offset Cue tip offset: x = side spin (-1..1), y = draw/follow (-1..1)
 */
export function calculateCueStrike(angle, power, offset = { x: 0, y: 0 }) {
  const normPower = Math.max(0.05, Math.min(1.0, power));
  const speed = normPower * MAX_POWER;

  // Clamp tip offset to safe radius
  let ox = offset.x || 0;
  let oy = offset.y || 0;
  const offLen = Math.hypot(ox, oy);
  if (offLen > OFF_CENTER_LIMIT) {
    ox = (ox / offLen) * OFF_CENTER_LIMIT;
    oy = (oy / offLen) * OFF_CENTER_LIMIT;
  }

  // Aim direction vector along horizontal X-Z
  const dir = new THREE.Vector2(Math.cos(angle), Math.sin(angle));
  const vel = dir.clone().multiplyScalar(speed);

  // Angular velocity vector (rad/s):
  // rvel.x: rotation around X axis (roll/pitch)
  // rvel.y: vertical rotation (spin around Y axis, i.e., side spin / English)
  // rvel.z: rotation around Z axis (roll/pitch)
  const rollRate = (speed / R) * (oy * 1.4); // Follow (positive oy) or Draw (negative oy)
  const sideRate = (speed / R) * (ox * 1.8); // Left or right english

  // Natural rolling axis is perpendicular to direction of motion
  const perp = new THREE.Vector2(-dir.y, dir.x);
  const rvel = new THREE.Vector3(
    perp.x * rollRate,
    sideRate,
    perp.y * rollRate,
  );

  return { vel, rvel };
}

/**
 * Creates 9-ball diamond rack positions.
 * 1-ball at the apex (facing head string), 9-ball in the center,
 * cue ball at the head string.
 */
export function buildDiamondRackPositions() {
  const rackOriginX = FELT_L * 0.24;
  const colSpacing = BALL_RADIUS * 2.015;
  const rowSpacing = BALL_RADIUS * 1.745;

  // Diamond pattern rows and columns
  const pattern = [
    { no: 1, row: 0, col: 0 },
    { no: 2, row: 1, col: -0.5 },
    { no: 3, row: 1, col: 0.5 },
    { no: 4, row: 2, col: -1.0 },
    { no: 9, row: 2, col: 0 }, // 9-ball strictly at diamond center
    { no: 5, row: 2, col: 1.0 },
    { no: 6, row: 3, col: -0.5 },
    { no: 7, row: 3, col: 0.5 },
    { no: 8, row: 4, col: 0 },
  ];

  const positions = new Map();

  // Cue ball at head string
  positions.set(0, { x: -FELT_L * 0.28, z: 0 });

  pattern.forEach(({ no, row, col }) => {
    // Slight microscopic jitter for natural break dispersion
    const jitterX = (Math.random() - 0.5) * 0.001;
    const jitterZ = (Math.random() - 0.5) * 0.001;
    const x = rackOriginX + row * rowSpacing + jitterX;
    const z = col * colSpacing + jitterZ;
    positions.set(no, { x, z });
  });

  return positions;
}

/**
 * Billiards Simulation Engine for table balls.
 */
export class BilliardsPhysics {
  constructor(audio = null) {
    this.audio = audio;
    this.balls = [];
    this.events = [];
    this.firstContact = null;
    this.pottedThisShot = [];
    this.scratch = false;
    this.nineBallPotted = false;
  }

  setBalls(ballList) {
    this.balls = ballList;
  }

  resetEvents() {
    this.events.length = 0;
    this.firstContact = null;
    this.pottedThisShot.length = 0;
    this.scratch = false;
    this.nineBallPotted = false;
  }

  /**
   * Strike the cue ball with aim and power.
   */
  strikeCueBall(angle, power, offset = { x: 0, y: 0 }) {
    const cueBall = this.balls.find((b) => b.no === 0);
    if (!cueBall || cueBall.pocketed) return;

    this.resetEvents();
    const { vel, rvel } = calculateCueStrike(angle, power, offset);
    cueBall.vel.copy(vel);
    cueBall.rvel.copy(rvel);
    cueBall.state = BallState.SLIDING;

    this.audio?.cueHit?.(Math.min(1.0, power));
  }

  /**
   * Physics step with sub-stepping for tunneling prevention.
   */
  update(dt) {
    const subSteps = 6;
    const subDt = dt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      this.step(subDt);
    }
  }

  step(dt) {
    // 1. Update ball positions and apply sliding/rolling friction
    for (const b of this.balls) {
      if (b.pocketed) continue;

      const speedSq = b.vel.lengthSq();
      if (speedSq < 0.0004 && b.rvel.lengthSq() < 0.001) {
        b.vel.set(0, 0);
        b.rvel.set(0, 0, 0);
        b.state = BallState.STATIONARY;
        continue;
      }

      // Position update
      b.pos.x += b.vel.x * dt;
      b.pos.z += b.vel.y * dt;

      // Surface slip velocity calculation
      // For rolling: vel = R * angular_velocity
      const speed = b.vel.length();
      const naturalRollY = speed > 0 ? (b.vel.x / speed) : 0;
      const naturalRollX = speed > 0 ? -(b.vel.y / speed) : 0;
      const targetRvel = new THREE.Vector2(naturalRollX, naturalRollY).multiplyScalar(speed / R);

      const currentHorizRvel = new THREE.Vector2(b.rvel.x, b.rvel.z);
      const slipDiff = targetRvel.distanceTo(currentHorizRvel);

      if (slipDiff > 0.15) {
        // Ball is sliding / skidding: kinetic friction accelerates rotation toward rolling
        b.state = BallState.SLIDING;
        const slipDir = currentHorizRvel.sub(targetRvel).normalize();
        b.rvel.x -= slipDir.x * (MU_SLIDING * g / R) * dt * 2.5;
        b.rvel.z -= slipDir.y * (MU_SLIDING * g / R) * dt * 2.5;
        b.vel.multiplyScalar(Math.exp(-dt * MU_SLIDING * 4.2));
      } else {
        // Natural pure rolling motion
        b.state = BallState.ROLLING;
        b.rvel.x = naturalRollX * (speed / R);
        b.rvel.z = naturalRollY * (speed / R);
        b.vel.multiplyScalar(Math.exp(-dt * MU_ROLLING * 3.5));
      }

      // Spindown decay on side spin (rvel.y)
      b.rvel.y *= Math.exp(-dt * RHO_SPINDOWN * 15);

      // 2. Rail cushion bounces
      this.resolveCushion(b);

      // 3. Pocket entry detection
      this.checkPockets(b);
    }

    // 4. Ball-to-ball collisions
    this.resolveBallCollisions();
  }

  resolveCushion(b) {
    let bounced = false;
    let normal = null;

    // X rails
    if (b.pos.x < MIN_X) {
      b.pos.x = MIN_X;
      b.vel.x = Math.abs(b.vel.x) * CUSHION_RESTITUTION;
      normal = new THREE.Vector2(1, 0);
      bounced = true;
    } else if (b.pos.x > MAX_X) {
      b.pos.x = MAX_X;
      b.vel.x = -Math.abs(b.vel.x) * CUSHION_RESTITUTION;
      normal = new THREE.Vector2(-1, 0);
      bounced = true;
    }

    // Z rails
    if (b.pos.z < MIN_Z) {
      b.pos.z = MIN_Z;
      b.vel.y = Math.abs(b.vel.y) * CUSHION_RESTITUTION;
      normal = new THREE.Vector2(0, 1);
      bounced = true;
    } else if (b.pos.z > MAX_Z) {
      b.pos.z = MAX_Z;
      b.vel.y = -Math.abs(b.vel.y) * CUSHION_RESTITUTION;
      normal = new THREE.Vector2(0, -1);
      bounced = true;
    }

    if (bounced && normal) {
      // Cushion spin interaction: side spin alters tangential bounce angle
      if (Math.abs(b.rvel.y) > 0.1) {
        if (normal.x !== 0) {
          b.vel.y += b.rvel.y * R * CUSHION_FRICTION * Math.sign(normal.x);
        } else {
          b.vel.x -= b.rvel.y * R * CUSHION_FRICTION * Math.sign(normal.y);
        }
        b.rvel.y *= 0.55;
      }
      const imp = b.vel.length();
      if (imp > 0.45) this.audio?.ballClick?.(Math.min(0.8, imp / 5));
    }
  }

  checkPockets(b) {
    if (b.pocketed) return;

    for (const pocket of POCKET_LOCATIONS) {
      const dist = Math.hypot(b.pos.x - pocket.x, b.pos.z - pocket.z);
      const threshold = pocket.corner ? POCKET_RADIUS : POCKET_RADIUS * 1.05;

      if (dist < threshold) {
        b.pocketed = true;
        b.state = BallState.POCKETED;
        b.vel.set(0, 0);
        b.rvel.set(0, 0, 0);
        this.pottedThisShot.push(b.no);

        if (b.no === 0) {
          this.scratch = true;
        } else if (b.no === 9) {
          this.nineBallPotted = true;
        }

        this.audio?.pocketDrop?.();
        break;
      }
    }
  }

  resolveBallCollisions() {
    const minDist = BALL_RADIUS * 2;
    const minDistSq = minDist * minDist;

    for (let i = 0; i < this.balls.length; i++) {
      const b1 = this.balls[i];
      if (b1.pocketed) continue;

      for (let j = i + 1; j < this.balls.length; j++) {
        const b2 = this.balls[j];
        if (b2.pocketed) continue;

        const dx = b2.pos.x - b1.pos.x;
        const dz = b2.pos.z - b1.pos.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < minDistSq && distSq > 0.000001) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const nz = dz / dist;

          // Record cue ball first contact
          if (b1.no === 0 && this.firstContact === null) {
            this.firstContact = b2.no;
          } else if (b2.no === 0 && this.firstContact === null) {
            this.firstContact = b1.no;
          }

          // Positional overlap separation
          const overlap = (minDist - dist) * 0.505;
          b1.pos.x -= nx * overlap;
          b1.pos.z -= nz * overlap;
          b2.pos.x += nx * overlap;
          b2.pos.z += nz * overlap;

          // Relative velocity along collision normal
          const kx = b1.vel.x - b2.vel.x;
          const kz = b1.vel.y - b2.vel.y;
          const normalVel = nx * kx + nz * kz;

          // Only collide if moving toward each other
          if (normalVel > 0) {
            const restitution = 0.95;
            const impulse = (1 + restitution) * normalVel * 0.5;

            b1.vel.x -= impulse * nx;
            b1.vel.y -= impulse * nz;
            b2.vel.x += impulse * nx;
            b2.vel.y += impulse * nz;

            b1.state = BallState.SLIDING;
            b2.state = BallState.SLIDING;

            const impactSpeed = Math.abs(normalVel);
            if (impactSpeed > 0.25) {
              this.audio?.ballClick?.(Math.min(1.2, impactSpeed / 4));
            }
          }
        }
      }
    }
  }

  isAllStationary() {
    return this.balls.every((b) => b.pocketed || (b.vel.lengthSq() < 0.0001 && b.rvel.lengthSq() < 0.001));
  }
}
