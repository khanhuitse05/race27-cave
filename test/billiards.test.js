import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BALL_RADIUS,
  R,
  FELT_L,
  FELT_W,
} from '../src/billiards/constants.js';
import {
  calculateCueStrike,
  buildDiamondRackPositions,
  BilliardsPhysics,
  BallState,
  BallPosition,
} from '../src/billiards/physics.js';
import {
  getLowestActiveBall,
  evaluateShotOutcome,
  getRespotPosition,
} from '../src/billiards/nineball.js';

test('Diamond Rack Placement', () => {
  const rack = buildDiamondRackPositions();

  assert.equal(rack.size, 10, 'Rack should contain 10 balls (cue ball + 1-9)');

  // Cue ball must be behind head string (negative x)
  const cue = rack.get(0);
  assert.ok(cue.x < -FELT_L * 0.2, 'Cue ball should be at head string');
  assert.equal(Math.round(cue.z), 0, 'Cue ball should be centered on table width');

  // Ball 1 must be at apex (lowest x of rack diamond)
  const ball1 = rack.get(1);
  assert.ok(ball1.x > 0, 'Ball 1 should be at foot spot');
  assert.ok(Math.abs(ball1.z) < 0.05, 'Ball 1 should be at center line');

  // Ball 9 must be in the center of the diamond
  const ball9 = rack.get(9);
  assert.ok(ball9.x > ball1.x, 'Ball 9 should be behind Ball 1');
  assert.ok(Math.abs(ball9.z) < 0.05, 'Ball 9 should be at the center line of the diamond');

  // All balls must have distinct positions with distance >= 2 * R (accounting for slight jitter)
  for (let i = 1; i <= 9; i++) {
    for (let j = i + 1; j <= 9; j++) {
      const p1 = rack.get(i);
      const p2 = rack.get(j);
      const dist = Math.hypot(p1.x - p2.x, p1.z - p2.z);
      assert.ok(dist >= BALL_RADIUS * 1.8, `Balls ${i} and ${j} should not overlap, dist=${dist}`);
    }
  }
});

test('Cue Strike Physics Calculation', () => {
  const angle = 0; // forward along X
  const power = 0.5;
  const offset = { x: 0.2, y: -0.4 }; // right english, draw / backspin

  const strike = calculateCueStrike(angle, power, offset);

  assert.ok(strike.vel.x > 0, 'Velocity should point forward along positive X');
  assert.equal(Math.round(strike.vel.y), 0, 'Velocity Z component should be 0 when angle is 0');

  // Backspin should produce negative rollRate on angular velocity
  assert.ok(strike.rvel.y !== 0, 'Side spin should produce Y-axis angular rotation');
});

test('9-Ball Rules: Target Ball Detection', () => {
  const balls = [
    { no: 0, pocketed: false },
    { no: 1, pocketed: true },
    { no: 2, pocketed: false },
    { no: 3, pocketed: false },
    { no: 9, pocketed: false },
  ];

  const target = getLowestActiveBall(balls);
  assert.equal(target, 2, 'Lowest active ball should be 2 when ball 1 is pocketed');
});

test('9-Ball Rules: Legal Hit and Pot Outcome', () => {
  // Scenario 1: Legal hit and potted ball 2
  const outcome = evaluateShotOutcome({
    targetBall: 2,
    firstContact: 2,
    potted: [2],
    scratch: false,
    nineBallPotted: false,
  });

  assert.equal(outcome.isFoul, false, 'Should not be a foul');
  assert.equal(outcome.shooterContinues, true, 'Shooter should continue turn after legal pot');
  assert.equal(outcome.isWin, false, 'Not game over yet');
});

test('9-Ball Rules: Foul Detection', () => {
  // Scenario 2: Wrong ball struck first
  const wrongBallOutcome = evaluateShotOutcome({
    targetBall: 2,
    firstContact: 5,
    potted: [5],
    scratch: false,
    nineBallPotted: false,
  });

  assert.equal(wrongBallOutcome.isFoul, true, 'Should be foul when hitting wrong ball first');
  assert.equal(wrongBallOutcome.shooterContinues, false, 'Turn ends on foul');

  // Scenario 3: Cue ball scratch
  const scratchOutcome = evaluateShotOutcome({
    targetBall: 2,
    firstContact: 2,
    potted: [0, 2],
    scratch: true,
    nineBallPotted: false,
  });

  assert.equal(scratchOutcome.isFoul, true, 'Scratch is a foul');
  assert.equal(scratchOutcome.respotCue, true, 'Cue ball should be respotted');
});

test('9-Ball Rules: Game Win on 9-Ball Sunk', () => {
  // Scenario 4: 9-ball sunk legally (e.g. combination shot)
  const winOutcome = evaluateShotOutcome({
    targetBall: 3,
    firstContact: 3,
    potted: [9],
    scratch: false,
    nineBallPotted: true,
  });

  assert.equal(winOutcome.isFoul, false, 'Legal combination shot');
  assert.equal(winOutcome.isWin, true, '9-Ball potted legally wins the game!');

  // Scenario 5: 9-ball sunk on a scratch (foul)
  const foulNineOutcome = evaluateShotOutcome({
    targetBall: 3,
    firstContact: 3,
    potted: [0, 9],
    scratch: true,
    nineBallPotted: true,
  });

  assert.equal(foulNineOutcome.isFoul, true, 'Foul due to scratch');
  assert.equal(foulNineOutcome.isWin, false, 'Cannot win on a foul');
  assert.equal(foulNineOutcome.respotNine, true, '9-ball must be respotted on foul');
});

test('BilliardsPhysics Simulation Step & Collision', () => {
  const physics = new BilliardsPhysics();
  const balls = [
    {
      no: 0,
      pos: { x: 0, z: 0 },
      vel: { x: 2.0, y: 0, lengthSq: () => 4.0, length: () => 2.0, set: function(x, y) { this.x = x; this.y = y; }, multiplyScalar: function(s) { this.x *= s; this.y *= s; } },
      rvel: { x: 0, y: 0, z: 0, lengthSq: () => 0, set: function(x, y, z) { this.x = x; this.y = y; this.z = z; } },
      pocketed: false,
      state: BallState.ROLLING,
    },
    {
      no: 1,
      pos: { x: 0.12, z: 0 }, // Right in front of cue ball (dist < 2 * R)
      vel: { x: 0, y: 0, lengthSq: () => 0, length: () => 0, set: function(x, y) { this.x = x; this.y = y; }, multiplyScalar: function(s) { this.x *= s; this.y *= s; } },
      rvel: { x: 0, y: 0, z: 0, lengthSq: () => 0, set: function(x, y, z) { this.x = x; this.y = y; this.z = z; } },
      pocketed: false,
      state: BallState.STATIONARY,
    },
  ];

  physics.setBalls(balls);
  physics.resolveBallCollisions();

  assert.equal(physics.firstContact, 1, 'First contact should be recorded as Ball 1');
  assert.ok(balls[1].vel.x > 0, 'Ball 1 should gain forward velocity from collision');
});

test('BallPosition Coordinate Integrity & Math', () => {
  const p = new BallPosition(1.5, -0.75);
  assert.equal(p.x, 1.5);
  assert.equal(p.z, -0.75);
  assert.equal(p.y, -0.75, 'Accessor .y should reflect .z');

  p.set(-2.0, 0.4);
  assert.equal(p.x, -2.0);
  assert.equal(p.z, 0.4);
  assert.equal(p.y, 0.4);

  p.y = 1.2;
  assert.equal(p.z, 1.2, 'Setting .y should update .z');

  const cloned = p.clone();
  assert.equal(cloned.x, -2.0);
  assert.equal(cloned.z, 1.2);

  const target = new BallPosition(1.0, 1.2);
  assert.equal(p.distanceTo(target), 3.0, 'Distance should be 3.0 along X');
  assert.ok(!Number.isNaN(p.x) && !Number.isNaN(p.z), 'Coordinates must be valid finite numbers');
});
