import { FELT_L } from './constants.js';

/**
 * Returns the lowest numbered active object ball on the table (1 through 9).
 * Returns null if no object balls remain.
 */
export function getLowestActiveBall(balls) {
  let lowest = Infinity;
  for (const b of balls) {
    if (b.no > 0 && !b.pocketed && b.no < lowest) {
      lowest = b.no;
    }
  }
  return lowest === Infinity ? null : lowest;
}

/**
 * Evaluates the rules outcome of a completed 9-ball shot.
 *
 * @param {object} params
 * @param {number} params.targetBall The lowest ball on table prior to the shot
 * @param {number|null} params.firstContact First object ball struck by cue ball
 * @param {number[]} params.potted List of ball numbers potted during the shot
 * @param {boolean} params.scratch Whether the cue ball was pocketed
 * @param {boolean} params.nineBallPotted Whether ball 9 was pocketed
 * @returns {object} Adjudicated outcome
 */
export function evaluateShotOutcome({ targetBall, firstContact, potted, scratch, nineBallPotted }) {
  const foulReasons = [];

  if (scratch) {
    foulReasons.push('Lỗi bi cái rơi lỗ (Scratch)');
  }

  if (firstContact === null) {
    foulReasons.push('Lỗi cơ đánh không chạm bi nào');
  } else if (targetBall !== null && firstContact !== targetBall) {
    foulReasons.push(`Lỗi đánh sai bi mục tiêu (cần chạm bi số ${targetBall} đầu tiên, đã chạm bi số ${firstContact})`);
  }

  const isFoul = foulReasons.length > 0;
  const isWin = !isFoul && nineBallPotted;
  const respotNine = isFoul && nineBallPotted;

  // Legal potted balls (excluding cue ball)
  const objectBallsPotted = potted.filter((no) => no > 0);
  const legalPots = !isFoul && objectBallsPotted.length > 0;
  const shooterContinues = !isWin && legalPots;

  return {
    isFoul,
    foulReason: foulReasons.join(' • '),
    isWin,
    respotNine,
    respotCue: scratch,
    shooterContinues,
    pottedBalls: objectBallsPotted,
  };
}

/**
 * Safe respot position for 9-ball or cue ball.
 */
export function getRespotPosition(ballNo) {
  if (ballNo === 0) {
    // Cue ball: head string center
    return { x: -FELT_L * 0.28, z: 0 };
  }
  if (ballNo === 9) {
    // 9-ball: foot spot
    return { x: FELT_L * 0.24, z: 0 };
  }
  return { x: 0, z: 0 };
}
