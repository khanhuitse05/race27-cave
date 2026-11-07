/**
 * Billiards physics constants adapted from tailuge/billiards and scaled
 * for the Rasson Ox Tournament 9-Foot table.
 */

export const BALL_RADIUS = 0.062; // in 3D world meters
export const R = BALL_RADIUS;
export const BALL_MASS = 0.23;
export const g = 9.8;

// Table playing surface dimensions (Simonis 860 cloth area)
export const TABLE_L = 4.4;
export const TABLE_W = 2.4;
export const TABLE_H = 1.05;
export const RAIL_THICK = 0.22;
export const FELT_L = TABLE_L - RAIL_THICK * 2; // 3.96m
export const FELT_W = TABLE_W - RAIL_THICK * 2; // 1.96m
export const BALL_Y = TABLE_H + BALL_RADIUS;

// Rail playing boundaries (center of balls must stay within these)
export const MIN_X = -FELT_L / 2 + BALL_RADIUS + 0.025;
export const MAX_X = FELT_L / 2 - BALL_RADIUS - 0.025;
export const MIN_Z = -FELT_W / 2 + BALL_RADIUS + 0.025;
export const MAX_Z = FELT_W / 2 - BALL_RADIUS - 0.025;

// Friction parameters (Han / Mathavan models)
export const MU_ROLLING = 0.0065; // rolling friction coefficient
export const MU_SLIDING = 0.13; // sliding friction coefficient
export const RHO_SPINDOWN = 0.045; // spin decay rate
export const CUSHION_RESTITUTION = 0.84; // rail bounce factor
export const CUSHION_FRICTION = 0.18; // cushion spin interaction

// Cue strike limits
export const MAX_POWER = 22.0; // max initial ball speed (m/s)
export const MIN_POWER = 1.0;
export const OFF_CENTER_LIMIT = 0.75; // cue tip offset limit in fractions of radius

// 6 Pocket locations on table: 4 corners and 2 side pockets
export const POCKET_RADIUS = 0.155;
export const POCKET_LOCATIONS = [
  { id: 'c_nw', x: -FELT_L / 2 + 0.04, z: -FELT_W / 2 + 0.04, corner: true },
  { id: 'c_ne', x: FELT_L / 2 - 0.04, z: -FELT_W / 2 + 0.04, corner: true },
  { id: 'c_sw', x: -FELT_L / 2 + 0.04, z: FELT_W / 2 - 0.04, corner: true },
  { id: 'c_se', x: FELT_L / 2 - 0.04, z: FELT_W / 2 - 0.04, corner: true },
  { id: 's_n', x: 0, z: -FELT_W / 2 + 0.015, corner: false },
  { id: 's_s', x: 0, z: FELT_W / 2 - 0.015, corner: false },
];
