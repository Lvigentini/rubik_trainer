export const FACE_NAMES = ['U', 'R', 'F', 'D', 'L', 'B'] as const;
export type FaceName = (typeof FACE_NAMES)[number];

export const COLORS: Record<FaceName, string> = {
  U: '#fff7ed',
  R: '#ef4444',
  F: '#22c55e',
  D: '#facc15',
  L: '#f97316',
  B: '#3b82f6',
};

export const COLOR_LABELS: Record<FaceName, string> = {
  U: 'White',
  R: 'Red',
  F: 'Green',
  D: 'Yellow',
  L: 'Orange',
  B: 'Blue',
};

export type Turn = `${FaceName}` | `${FaceName}'` | `${FaceName}2`;
export type Sticker = {
  id: string;
  color: FaceName;
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
  z: -1 | 0 | 1;
  nx: -1 | 0 | 1;
  ny: -1 | 0 | 1;
  nz: -1 | 0 | 1;
};
export type CubeState = Sticker[];
export type FaceGrid = Record<FaceName, FaceName[]>;
export type ScanFace = 'U' | 'F' | 'R';
export type PartialScan = Record<ScanFace, (FaceName | null)[]>;

const BASE_FACES: Record<FaceName, { normal: [number, number, number]; positions: (row: number, col: number) => [number, number, number] }> = {
  U: { normal: [0, 1, 0], positions: (row, col) => [col - 1, 1, row - 1] },
  R: { normal: [1, 0, 0], positions: (row, col) => [1, 1 - row, 1 - col] },
  F: { normal: [0, 0, 1], positions: (row, col) => [col - 1, 1 - row, 1] },
  D: { normal: [0, -1, 0], positions: (row, col) => [col - 1, -1, 1 - row] },
  L: { normal: [-1, 0, 0], positions: (row, col) => [-1, 1 - row, col - 1] },
  B: { normal: [0, 0, -1], positions: (row, col) => [1 - col, 1 - row, -1] },
};

const TURN_AXIS: Record<FaceName, { axis: 'x' | 'y' | 'z'; layer: -1 | 1; clockwiseQuarterTurns: 1 | -1 }> = {
  U: { axis: 'y', layer: 1, clockwiseQuarterTurns: -1 },
  D: { axis: 'y', layer: -1, clockwiseQuarterTurns: 1 },
  R: { axis: 'x', layer: 1, clockwiseQuarterTurns: 1 },
  L: { axis: 'x', layer: -1, clockwiseQuarterTurns: -1 },
  F: { axis: 'z', layer: 1, clockwiseQuarterTurns: 1 },
  B: { axis: 'z', layer: -1, clockwiseQuarterTurns: -1 },
};

function asCoord(value: number): -1 | 0 | 1 {
  if (value === -1 || value === 0 || value === 1) return value;
  throw new Error(`invalid coordinate ${value}`);
}

function faceFromNormal(nx: number, ny: number, nz: number): FaceName {
  if (ny === 1) return 'U';
  if (nx === 1) return 'R';
  if (nz === 1) return 'F';
  if (ny === -1) return 'D';
  if (nx === -1) return 'L';
  if (nz === -1) return 'B';
  throw new Error(`invalid normal ${nx},${ny},${nz}`);
}

function faceIndex(face: FaceName, sticker: Sticker): number {
  const { x, y, z } = sticker;
  switch (face) {
    case 'U':
      return (z + 1) * 3 + (x + 1);
    case 'R':
      return (1 - y) * 3 + (1 - z);
    case 'F':
      return (1 - y) * 3 + (x + 1);
    case 'D':
      return (1 - z) * 3 + (x + 1);
    case 'L':
      return (1 - y) * 3 + (z + 1);
    case 'B':
      return (1 - y) * 3 + (1 - x);
  }
}

function rotateVector(axis: 'x' | 'y' | 'z', quarterTurns: number, vector: [number, number, number]): [number, number, number] {
  let [x, y, z] = vector;
  const turns = ((quarterTurns % 4) + 4) % 4;
  for (let i = 0; i < turns; i += 1) {
    if (axis === 'x') {
      [y, z] = [-z, y];
    } else if (axis === 'y') {
      [x, z] = [z, -x];
    } else {
      [x, y] = [-y, x];
    }
  }
  return [x, y, z];
}

export function createSolvedCube(): CubeState {
  return FACE_NAMES.flatMap((face) => {
    const base = BASE_FACES[face];
    return Array.from({ length: 9 }, (_, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const [x, y, z] = base.positions(row, col);
      const [nx, ny, nz] = base.normal;
      return {
        id: `${face}${index}`,
        color: face,
        x: asCoord(x),
        y: asCoord(y),
        z: asCoord(z),
        nx: asCoord(nx),
        ny: asCoord(ny),
        nz: asCoord(nz),
      };
    });
  });
}

export function toFaceGrid(cube: CubeState): FaceGrid {
  const grid = Object.fromEntries(FACE_NAMES.map((face) => [face, Array<FaceName>(9).fill(face)])) as FaceGrid;
  for (const sticker of cube) {
    const face = faceFromNormal(sticker.nx, sticker.ny, sticker.nz);
    grid[face][faceIndex(face, sticker)] = sticker.color;
  }
  return grid;
}

export function applyTurn(cube: CubeState, turn: Turn): CubeState {
  const face = turn[0] as FaceName;
  const suffix = turn.slice(1);
  const spec = TURN_AXIS[face];
  const multiplier = suffix === "'" ? -1 : suffix === '2' ? 2 : 1;
  const quarterTurns = spec.clockwiseQuarterTurns * multiplier;

  return cube.map((sticker) => {
    if (sticker[spec.axis] !== spec.layer) return { ...sticker };
    const [x, y, z] = rotateVector(spec.axis, quarterTurns, [sticker.x, sticker.y, sticker.z]);
    const [nx, ny, nz] = rotateVector(spec.axis, quarterTurns, [sticker.nx, sticker.ny, sticker.nz]);
    return { ...sticker, x: asCoord(x), y: asCoord(y), z: asCoord(z), nx: asCoord(nx), ny: asCoord(ny), nz: asCoord(nz) };
  });
}

export function applyAlgorithm(cube: CubeState, algorithm: Turn[]): CubeState {
  return algorithm.reduce((current, turn) => applyTurn(current, turn), cube);
}

export function inverseTurn(turn: Turn): Turn {
  if (turn.endsWith('2')) return turn;
  if (turn.endsWith("'")) return turn[0] as Turn;
  return `${turn}'` as Turn;
}

export function invertAlgorithm(algorithm: Turn[]): Turn[] {
  return [...algorithm].reverse().map(inverseTurn);
}

const TURN_FACES: FaceName[] = ['U', 'R', 'F', 'D', 'L', 'B'];
const SUFFIXES = ['', "'", '2'] as const;

export function generateScramble(length = 20, random = Math.random): Turn[] {
  const turns: Turn[] = [];
  let previousFace: FaceName | null = null;
  while (turns.length < length) {
    const face = TURN_FACES[Math.floor(random() * TURN_FACES.length)];
    if (face === previousFace) continue;
    const suffix = SUFFIXES[Math.floor(random() * SUFFIXES.length)];
    turns.push(`${face}${suffix}` as Turn);
    previousFace = face;
  }
  return turns;
}

export function emptyPartialScan(): PartialScan {
  return {
    U: Array<FaceName | null>(9).fill(null),
    F: Array<FaceName | null>(9).fill(null),
    R: Array<FaceName | null>(9).fill(null),
  };
}

export function countKnownStickers(scan: PartialScan): number {
  return Object.values(scan).flat().filter(Boolean).length;
}

export function scanCompleteness(scan: PartialScan): number {
  return Math.round((countKnownStickers(scan) / 27) * 100);
}

export function colorCounts(scan: PartialScan): Record<FaceName, number> {
  const counts = Object.fromEntries(FACE_NAMES.map((face) => [face, 0])) as Record<FaceName, number>;
  Object.values(scan).flat().forEach((color) => {
    if (color) counts[color] += 1;
  });
  return counts;
}

export function scanWarnings(scan: PartialScan): string[] {
  const warnings: string[] = [];
  const counts = colorCounts(scan);
  FACE_NAMES.forEach((face) => {
    if (counts[face] > 9) warnings.push(`${COLOR_LABELS[face]} appears ${counts[face]} times; a real cube can only have 9.`);
  });
  if (countKnownStickers(scan) < 27) warnings.push('Three-face scan is incomplete: fill all visible stickers before asking for guidance.');
  warnings.push('Three visible faces do not uniquely identify the hidden stickers. Exact solving needs all six faces or a known scramble/history.');
  return warnings;
}

export function formatAlgorithm(algorithm: Turn[]): string {
  return algorithm.join(' ');
}
