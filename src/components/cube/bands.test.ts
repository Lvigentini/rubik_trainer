import { describe, expect, it } from 'vitest';
import { FACE_NAMES, applyTurn, createSolvedCube, toFaceGrid, type FaceName } from '../../cube';
import { layerForSticker, stickerCubieCoords, stickerInLayer } from './bands';

const SIDE_FACES: FaceName[] = ['F', 'R', 'B', 'L'];

describe('stickerInLayer — 3x3', () => {
  it('a U turn highlights every U sticker and the top row of every side face', () => {
    for (let index = 0; index < 9; index += 1) {
      expect(stickerInLayer('U', index, 'U', '3x3')).toBe(true);
    }
    for (const face of SIDE_FACES) {
      expect(stickerInLayer(face, 0, 'U', '3x3')).toBe(true);
      expect(stickerInLayer(face, 1, 'U', '3x3')).toBe(true);
      expect(stickerInLayer(face, 2, 'U', '3x3')).toBe(true);
      expect(stickerInLayer(face, 3, 'U', '3x3')).toBe(false);
      expect(stickerInLayer(face, 4, 'U', '3x3')).toBe(false);
      expect(stickerInLayer(face, 5, 'U', '3x3')).toBe(false);
      expect(stickerInLayer(face, 6, 'U', '3x3')).toBe(false);
      expect(stickerInLayer(face, 7, 'U', '3x3')).toBe(false);
      expect(stickerInLayer(face, 8, 'U', '3x3')).toBe(false);
    }
    for (let index = 0; index < 9; index += 1) {
      expect(stickerInLayer('D', index, 'U', '3x3')).toBe(false);
    }
  });

  it('an R turn highlights every R sticker and the R-side column of U/F/D/B', () => {
    for (let index = 0; index < 9; index += 1) {
      expect(stickerInLayer('R', index, 'R', '3x3')).toBe(true);
    }
    // Right column indices (2, 5, 8) on U/F/D — but the back face's column
    // mapping is mirrored (B faces the opposite way), so its R-side column
    // is indices 0, 3, 6 instead. Both resolve via the same x === 1 check.
    for (const face of ['U', 'F', 'D'] as FaceName[]) {
      expect(stickerInLayer(face, 2, 'R', '3x3')).toBe(true);
      expect(stickerInLayer(face, 5, 'R', '3x3')).toBe(true);
      expect(stickerInLayer(face, 8, 'R', '3x3')).toBe(true);
      expect(stickerInLayer(face, 0, 'R', '3x3')).toBe(false);
    }
    expect(stickerInLayer('B', 0, 'R', '3x3')).toBe(true);
    expect(stickerInLayer('B', 3, 'R', '3x3')).toBe(true);
    expect(stickerInLayer('B', 6, 'R', '3x3')).toBe(true);
    expect(stickerInLayer('B', 2, 'R', '3x3')).toBe(false);
    for (let index = 0; index < 9; index += 1) {
      expect(stickerInLayer('L', index, 'R', '3x3')).toBe(false);
    }
  });
});

describe('stickerInLayer — 2x2', () => {
  it('a U turn highlights the U face and only the top corners of side faces', () => {
    expect(stickerInLayer('U', 0, 'U', '2x2')).toBe(true);
    expect(stickerInLayer('U', 2, 'U', '2x2')).toBe(true);
    expect(stickerInLayer('U', 6, 'U', '2x2')).toBe(true);
    expect(stickerInLayer('U', 8, 'U', '2x2')).toBe(true);
    for (const face of SIDE_FACES) {
      expect(stickerInLayer(face, 0, 'U', '2x2')).toBe(true);
      expect(stickerInLayer(face, 2, 'U', '2x2')).toBe(true);
      expect(stickerInLayer(face, 6, 'U', '2x2')).toBe(false);
      expect(stickerInLayer(face, 8, 'U', '2x2')).toBe(false);
    }
    expect(stickerInLayer('D', 0, 'U', '2x2')).toBe(false);
  });

  it('never reports a sticker index that is not rendered for the given cube size', () => {
    // Index 4 (the centre) is never rendered on 2x2 (see STICKER_INDICES_BY_SIZE);
    // stickerInLayer must not accidentally flag it even though the raw
    // coordinate formula would put it on the U-layer.
    expect(stickerInLayer('U', 4, 'U', '2x2')).toBe(false);
  });
});

describe('stickerCubieCoords', () => {
  it('agrees with the real engine: unaffected stickers never change color after a turn', () => {
    // Cross-check against src/cube.ts's actual applyTurn/toFaceGrid rather than
    // only this file's own copy of the position formulas — if the two ever
    // drifted apart, a sticker this helper calls "not in the layer" would
    // still visibly move, which this test would catch.
    const before = toFaceGrid(createSolvedCube());
    const after = toFaceGrid(applyTurn(createSolvedCube(), 'U'));
    for (const face of FACE_NAMES) {
      for (let index = 0; index < 9; index += 1) {
        if (!stickerInLayer(face, index, 'U', '3x3')) {
          expect(after[face][index]).toBe(before[face][index]);
        }
      }
    }
  });

  it('produces the same coordinate for a face regardless of which turn is being checked', () => {
    expect(stickerCubieCoords('F', 4)).toEqual([0, 0, 1]);
    expect(stickerCubieCoords('U', 0)).toEqual([-1, 1, -1]);
  });
});

describe('stickerInLayer — slices (M/E/S, 3x3 only)', () => {
  it('M (middle, x=0) touches the centre column of U/F/D/B and never L/R', () => {
    for (const face of ['U', 'F', 'D', 'B'] as FaceName[]) {
      expect(stickerInLayer(face, 1, 'M', '3x3')).toBe(true);
      expect(stickerInLayer(face, 4, 'M', '3x3')).toBe(true);
      expect(stickerInLayer(face, 7, 'M', '3x3')).toBe(true);
      expect(stickerInLayer(face, 0, 'M', '3x3')).toBe(false);
    }
    for (let index = 0; index < 9; index += 1) {
      expect(stickerInLayer('L', index, 'M', '3x3')).toBe(false);
      expect(stickerInLayer('R', index, 'M', '3x3')).toBe(false);
    }
  });

  it('M highlights exactly the 12 stickers of the middle-x slice, cross-checked against the real engine', () => {
    // Same cross-check style as stickerCubieCoords above, but for a slice turn
    // (M has no face of its own, so we drive it through the real engine's M turn).
    const before = toFaceGrid(createSolvedCube());
    const after = toFaceGrid(applyTurn(createSolvedCube(), 'M'));
    let highlighted = 0;
    for (const face of FACE_NAMES) {
      for (let index = 0; index < 9; index += 1) {
        const inSlice = stickerInLayer(face, index, 'M', '3x3');
        if (inSlice) highlighted += 1;
        else expect(after[face][index]).toBe(before[face][index]);
      }
    }
    expect(highlighted).toBe(12); // 3 stickers each on U, F, D, B
  });

  it('E (equator, y=0) touches the middle row of F/R/B/L and never U/D', () => {
    for (const face of ['F', 'R', 'B', 'L'] as FaceName[]) {
      expect(stickerInLayer(face, 3, 'E', '3x3')).toBe(true);
      expect(stickerInLayer(face, 4, 'E', '3x3')).toBe(true);
      expect(stickerInLayer(face, 5, 'E', '3x3')).toBe(true);
    }
    for (let index = 0; index < 9; index += 1) {
      expect(stickerInLayer('U', index, 'E', '3x3')).toBe(false);
      expect(stickerInLayer('D', index, 'E', '3x3')).toBe(false);
    }
  });

  it('S (standing, z=0) touches the middle band of U/R/D/L and never F/B', () => {
    for (let index = 0; index < 9; index += 1) {
      expect(stickerInLayer('F', index, 'S', '3x3')).toBe(false);
      expect(stickerInLayer('B', index, 'S', '3x3')).toBe(false);
    }
    expect(stickerInLayer('U', 3, 'S', '3x3')).toBe(true);
    expect(stickerInLayer('U', 4, 'S', '3x3')).toBe(true);
    expect(stickerInLayer('U', 5, 'S', '3x3')).toBe(true);
  });

  it('never reports a slice sticker for a cube size that does not render it', () => {
    // 2x2 never renders index 4 (the centre); a slice check must not leak past
    // the STICKER_INDICES_BY_SIZE gate that stickerInLayer already enforces for faces.
    expect(stickerInLayer('F', 4, 'M', '2x2')).toBe(false);
  });
});

describe('layerForSticker — every tile selects its column, tap again for its row', () => {
  it('never selects the tapped face itself, on either size', () => {
    for (const face of ['F', 'U', 'R'] as FaceName[]) {
      for (const index of [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
        expect(layerForSticker(face, index, '3x3', null)).not.toBe(face);
        expect(layerForSticker(face, index, '3x3', face)).not.toBe(face);
      }
      for (const index of [0, 2, 6, 8]) {
        expect(layerForSticker(face, index, '2x2', null)).not.toBe(face);
      }
    }
  });

  it('3x3 corner tiles select their column layer first, then toggle to their row layer (F and U)', () => {
    // F top-left (index 0) -> cubie (-1,1,1): column x=-1 -> L, row y=1 -> U.
    expect(layerForSticker('F', 0, '3x3', null)).toBe('L');
    expect(layerForSticker('F', 0, '3x3', 'L')).toBe('U');
    expect(layerForSticker('F', 0, '3x3', 'U')).toBe('L');
    // F bottom-right (index 8) -> cubie (1,-1,1): column R, row D.
    expect(layerForSticker('F', 8, '3x3', null)).toBe('R');
    expect(layerForSticker('F', 8, '3x3', 'R')).toBe('D');
    // U back-left (index 0) -> cubie (-1,1,-1): column x=-1 -> L, row z=-1 -> B.
    expect(layerForSticker('U', 0, '3x3', null)).toBe('L');
    expect(layerForSticker('U', 0, '3x3', 'L')).toBe('B');
    expect(layerForSticker('U', 0, '3x3', 'B')).toBe('L');
    // A previous selection that is neither this tile's column nor its row
    // falls back to the column-first pick.
    expect(layerForSticker('F', 0, '3x3', 'M')).toBe('L');
  });

  it('2x2 corner tiles follow the exact same rule (both candidates are face layers)', () => {
    // F top-left (index 0) -> cubie (-1,1,1): column L, row U — toggles L<->U.
    expect(layerForSticker('F', 0, '2x2', null)).toBe('L');
    expect(layerForSticker('F', 0, '2x2', 'L')).toBe('U');
    expect(layerForSticker('F', 0, '2x2', 'U')).toBe('L');
    // F bottom-right (index 8) -> column R, row D.
    expect(layerForSticker('F', 8, '2x2', null)).toBe('R');
    expect(layerForSticker('F', 8, '2x2', 'R')).toBe('D');
  });

  it('3x3 middle tiles: middle columns/rows are the M/E/S slices, centre toggle unchanged', () => {
    // F top-middle (index 1) -> cubie (0,1,1): column M first, row U on repeat.
    expect(layerForSticker('F', 1, '3x3', null)).toBe('M');
    expect(layerForSticker('F', 1, '3x3', 'M')).toBe('U');
    // F middle-left (index 3) -> cubie (-1,0,1): column L first, row E on repeat.
    expect(layerForSticker('F', 3, '3x3', null)).toBe('L');
    expect(layerForSticker('F', 3, '3x3', 'L')).toBe('E');
    // Centre of F (index 4) -> (0,0,1): column M, row E — the old M<->E toggle
    // falls out of the general rule unchanged.
    expect(layerForSticker('F', 4, '3x3', null)).toBe('M');
    expect(layerForSticker('F', 4, '3x3', 'M')).toBe('E');
    expect(layerForSticker('F', 4, '3x3', 'E')).toBe('M');
    // Centre of R (index 4) -> (1,0,0): column axis is z -> S, row E.
    expect(layerForSticker('R', 4, '3x3', null)).toBe('S');
    expect(layerForSticker('R', 4, '3x3', 'S')).toBe('E');
  });

  it("face layers stay reachable from adjacent faces: F is U's bottom row and R's left column", () => {
    // R left-column tile (index 3) -> cubie (1,0,1): column axis z, z=1 -> F on the FIRST tap.
    expect(layerForSticker('R', 3, '3x3', null)).toBe('F');
    // U bottom-middle tile (index 7) -> cubie (0,1,1): column M, row z=1 -> F on the second tap.
    expect(layerForSticker('U', 7, '3x3', null)).toBe('M');
    expect(layerForSticker('U', 7, '3x3', 'M')).toBe('F');
    // Works from a corner of that row too: U bottom-left (index 6) -> column L, row F.
    expect(layerForSticker('U', 6, '3x3', 'L')).toBe('F');
  });
});
