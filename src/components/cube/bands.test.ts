import { describe, expect, it } from 'vitest';
import { FACE_NAMES, applyTurn, createSolvedCube, toFaceGrid, type FaceName } from '../../cube';
import { stickerCubieCoords, stickerInLayer, stickerInSlice } from './bands';

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

describe('stickerInSlice', () => {
  it('M (middle, x=0) touches the centre column of U/F/D/B and never L/R', () => {
    for (const face of ['U', 'F', 'D', 'B'] as FaceName[]) {
      expect(stickerInSlice(face, 1, 'M')).toBe(true);
      expect(stickerInSlice(face, 4, 'M')).toBe(true);
      expect(stickerInSlice(face, 7, 'M')).toBe(true);
      expect(stickerInSlice(face, 0, 'M')).toBe(false);
    }
    for (let index = 0; index < 9; index += 1) {
      expect(stickerInSlice('L', index, 'M')).toBe(false);
      expect(stickerInSlice('R', index, 'M')).toBe(false);
    }
  });
});
