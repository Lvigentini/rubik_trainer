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

/** The two tangent axes of a face — the ones that vary across its 3×3 grid
 * (the third, fixed axis is the face's own normal and is always ±1). */
function tangentAxes(face: FaceName): [Axis, Axis] {
  const fixed = FACE_LAYER[face].axis;
  return (['x', 'y', 'z'] as Axis[]).filter((axis) => axis !== fixed) as [Axis, Axis];
}

const AXIS_TO_SLICE: Record<Axis, SliceFace> = { x: 'M', y: 'E', z: 'S' };

/** Pure sticker → selected-layer rule for the cube itself as the layer
 * picker (3×3): a corner tile (both tangent coords ±1) selects the whole
 * face; an edge-middle tile (exactly one tangent coord 0) selects the slice
 * along that line; the centre tile (both tangent coords 0) sits between two
 * slices and toggles between them on repeated clicks. 2×2 only ever renders
 * corner tiles, but this returns the face outright for it regardless, per
 * the pinned "2×2 unchanged" rule. */
export function layerForSticker(
  face: FaceName,
  index: number,
  cubeSize: CubeSizeId,
  previous: LayerId | null,
): LayerId {
  if (cubeSize === '2x2') return face;
  const coords = stickerCubieCoords(face, index);
  const [axisA, axisB] = tangentAxes(face);
  const zeroA = coordOnAxis(coords, axisA) === 0;
  const zeroB = coordOnAxis(coords, axisB) === 0;
  if (!zeroA && !zeroB) return face; // corner tile
  if (zeroA !== zeroB) return AXIS_TO_SLICE[zeroA ? axisA : axisB]; // edge-middle tile

  // Centre tile: the two candidate slices are along axisA and axisB.
  const sliceA = AXIS_TO_SLICE[axisA];
  const sliceB = AXIS_TO_SLICE[axisB];
  if (previous === sliceA) return sliceB;
  if (previous === sliceB) return sliceA;
  // Deterministic first pick: prefer M (x=0) if x is tangent to this face, else S.
  // (x tangent here only for U/D/F/B; R/L's tangent axes are y/z, so S wins.)
  return axisA === 'x' || axisB === 'x' ? 'M' : 'S';
}
