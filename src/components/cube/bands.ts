import type { FaceName } from '../../cube';
import type { CubeSizeId } from '../../trainer';

export const STICKER_INDICES_BY_SIZE: Record<CubeSizeId, number[]> = {
  '2x2': [0, 2, 6, 8],
  '3x3': [0, 1, 2, 3, 4, 5, 6, 7, 8],
};

/** Plain-word name for the layer a face turn grabs — used in the turn strip
 * heading and coach copy so beginners aren't stuck decoding bare letters. */
export const FACE_LAYER_WORD: Record<FaceName, string> = {
  U: 'top',
  D: 'bottom',
  L: 'left',
  R: 'right',
  F: 'front',
  B: 'back',
};

export type SliceFace = 'M' | 'E' | 'S';

type Axis = 'x' | 'y' | 'z';

/** Mirrors cube.ts's (unexported) BASE_FACES.positions — the (row, col) ->
 * cubie coordinate formula for each face. Kept in lockstep by hand rather
 * than imported so src/cube.ts stays untouched; cube.test.ts / trainer.test.ts
 * exercise the real engine, and bands.test.ts below cross-checks this copy
 * against known turn outcomes. */
const FACE_POSITIONS: Record<FaceName, (row: number, col: number) => [number, number, number]> = {
  U: (row, col) => [col - 1, 1, row - 1],
  R: (row, col) => [1, 1 - row, 1 - col],
  F: (row, col) => [col - 1, 1 - row, 1],
  D: (row, col) => [col - 1, -1, 1 - row],
  L: (row, col) => [-1, 1 - row, col - 1],
  B: (row, col) => [1 - col, 1 - row, -1],
};

/** Mirrors cube.ts's (unexported) TURN_AXIS — which axis/layer a face turn grabs. */
const FACE_LAYER: Record<FaceName, { axis: Axis; layer: -1 | 1 }> = {
  U: { axis: 'y', layer: 1 },
  D: { axis: 'y', layer: -1 },
  R: { axis: 'x', layer: 1 },
  L: { axis: 'x', layer: -1 },
  F: { axis: 'z', layer: 1 },
  B: { axis: 'z', layer: -1 },
};

/** Mirrors cube.ts's (unexported) SLICE_AXIS — the middle-layer slices (3×3 only). */
const SLICE_LAYER: Record<SliceFace, { axis: Axis; layer: 0 }> = {
  M: { axis: 'x', layer: 0 },
  E: { axis: 'y', layer: 0 },
  S: { axis: 'z', layer: 0 },
};

/** Cubie (x, y, z) coordinate of the sticker at `index` (0-8, row-major) on
 * `face` — the same position formula createSolvedCube() uses, so highlight
 * checks agree with how applyTurn actually moves stickers. */
export function stickerCubieCoords(face: FaceName, index: number): [number, number, number] {
  const row = Math.floor(index / 3);
  const col = index % 3;
  return FACE_POSITIONS[face](row, col);
}

function coordOnAxis(coords: [number, number, number], axis: Axis): number {
  return axis === 'x' ? coords[0] : axis === 'y' ? coords[1] : coords[2];
}

/** True if the sticker at (face, index) belongs to the layer that turning
 * `turnFace` grabs — used to highlight every affected sticker across every
 * visible face when a face is tapped, on both 2×2 and 3×3. `cubeSize` is part
 * of the signature for symmetry with the sticker-index sets callers already
 * key off of; the coordinate formulas above already generalize across sizes
 * (2×2 only ever renders corner indices, which resolve to ±1 on every axis). */
export function stickerInLayer(face: FaceName, index: number, turnFace: FaceName, cubeSize: CubeSizeId): boolean {
  const indices = STICKER_INDICES_BY_SIZE[cubeSize];
  if (!indices.includes(index)) return false;
  const { axis, layer } = FACE_LAYER[turnFace];
  return coordOnAxis(stickerCubieCoords(face, index), axis) === layer;
}

/** Same idea for the middle slices (M/E/S, 3×3 only) — used by Play's slice row. */
export function stickerInSlice(face: FaceName, index: number, slice: SliceFace): boolean {
  const { axis, layer } = SLICE_LAYER[slice];
  return coordOnAxis(stickerCubieCoords(face, index), axis) === layer;
}
