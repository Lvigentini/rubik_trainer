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

/** A selectable turn layer: either a whole face (2×2 always, 3×3 corner
 * tiles) or a 3×3 middle slice (M/E/S, reached by tapping an edge-middle or
 * centre tile). */
export type LayerId = FaceName | SliceFace;

/** Plain-word name for a middle slice — the slice equivalent of FACE_LAYER_WORD. */
export const SLICE_LAYER_WORD: Record<SliceFace, string> = {
  M: 'middle slice',
  E: 'equator slice',
  S: 'standing slice',
};

export function isSliceFace(layer: LayerId): layer is SliceFace {
  return layer === 'M' || layer === 'E' || layer === 'S';
}

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

/** True if the sticker at (face, index) belongs to the layer selected by
 * `layer` — a face (grabs the whole outer layer) or a middle slice (M/E/S,
 * 3×3 only). Used to highlight every affected sticker across every visible
 * face when a layer is selected, on both 2×2 and 3×3. `cubeSize` is part of
 * the signature for symmetry with the sticker-index sets callers already key
 * off of; the coordinate formulas above already generalize across sizes
 * (2×2 only ever renders corner indices, which resolve to ±1 on every axis). */
export function stickerInLayer(face: FaceName, index: number, layer: LayerId, cubeSize: CubeSizeId): boolean {
  const indices = STICKER_INDICES_BY_SIZE[cubeSize];
  if (!indices.includes(index)) return false;
  const { axis, layer: axisLayer } = isSliceFace(layer) ? SLICE_LAYER[layer] : FACE_LAYER[layer];
  return coordOnAxis(stickerCubieCoords(face, index), axis) === axisLayer;
}

/** Which cubie axis runs across a face's rendered COLUMNS (the axis whose
 * value FACE_POSITIONS derives from `col` — constant down any one column)
 * and which runs down its ROWS (derived from `row`). The face's own normal
 * axis is neither. */
const COLUMN_AXIS: Record<FaceName, Axis> = { U: 'x', D: 'x', F: 'x', B: 'x', R: 'z', L: 'z' };
const ROW_AXIS: Record<FaceName, Axis> = { U: 'z', D: 'z', F: 'y', B: 'y', R: 'y', L: 'y' };

/** The layer a coordinate on an axis selects:
 * x: -1→L, 0→M, +1→R;  y: +1→U, 0→E, -1→D;  z: +1→F, 0→S, -1→B. */
function layerOnAxis(axis: Axis, coord: number): LayerId {
  if (axis === 'x') return coord === -1 ? 'L' : coord === 0 ? 'M' : 'R';
  if (axis === 'y') return coord === 1 ? 'U' : coord === 0 ? 'E' : 'D';
  return coord === 1 ? 'F' : coord === 0 ? 'S' : 'B';
}

/** Pure sticker → selected-layer rule for the cube itself as the layer
 * picker: EVERY tile selects a line through it. The first tap grabs the
 * tile's column layer, tapping the same tile again toggles to its row layer
 * (and back). On 3×3 a middle column/row is one of the M/E/S slices; on 2×2
 * coordinates are only ever ±1, so both candidates are face layers (e.g.
 * F's top-left tile toggles L↔U). Tapping a tile never selects the tapped
 * face itself — that's what the face div's gap/border click, Enter/Space,
 * and the picker chips are for. The rule is size-independent by
 * construction; `cubeSize` stays in the signature so call sites (which all
 * have a cube size in hand) read uniformly. */
export function layerForSticker(
  face: FaceName,
  index: number,
  _cubeSize: CubeSizeId,
  previous: LayerId | null,
): LayerId {
  const coords = stickerCubieCoords(face, index);
  const column = layerOnAxis(COLUMN_AXIS[face], coordOnAxis(coords, COLUMN_AXIS[face]));
  const row = layerOnAxis(ROW_AXIS[face], coordOnAxis(coords, ROW_AXIS[face]));
  if (previous === column) return row;
  if (previous === row) return column;
  return column;
}
