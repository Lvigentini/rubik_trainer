import type { Turn } from '../../cube';
import type { CubeSizeId } from '../../trainer';

export const STICKER_INDICES_BY_SIZE: Record<CubeSizeId, number[]> = {
  '2x2': [0, 2, 6, 8],
  '3x3': [0, 1, 2, 3, 4, 5, 6, 7, 8],
};

export type BandTurn = 'U' | 'E' | 'D' | 'L' | 'M' | 'R' | 'F' | 'S' | 'B';
export type BandSelection = {
  id: string;
  label: string;
  description: string;
  turn: BandTurn;
  requires3x3?: boolean;
};

export const BAND_SELECTIONS: BandSelection[] = [
  { id: 'top-row', label: 'Top row', description: 'Grab the upper horizontal layer', turn: 'U' },
  { id: 'middle-row', label: 'Middle row', description: 'Grab the equator row through the cube', turn: 'E', requires3x3: true },
  { id: 'bottom-row', label: 'Bottom row', description: 'Grab the lower horizontal layer', turn: 'D' },
  { id: 'left-column', label: 'Left column', description: 'Grab the left vertical layer', turn: 'L' },
  { id: 'middle-column', label: 'Middle column', description: 'Grab the centre vertical slice', turn: 'M', requires3x3: true },
  { id: 'right-column', label: 'Right column', description: 'Grab the right vertical layer', turn: 'R' },
  { id: 'front-layer', label: 'Front layer', description: 'Twist the face nearest you', turn: 'F' },
  { id: 'standing-slice', label: 'Standing slice', description: 'Twist the slice behind the front face', turn: 'S', requires3x3: true },
  { id: 'back-layer', label: 'Back layer', description: 'Twist the far back face', turn: 'B' },
];

export function getTurnForBand(band: BandSelection, suffix: '' | "'" | '2'): Turn {
  return `${band.turn}${suffix || ''}` as Turn;
}

export function bandStickerIndices(bandId: string, cubeSize: CubeSizeId): Set<number> {
  const is3x3 = cubeSize === '3x3';
  if (bandId === 'top-row') return new Set(is3x3 ? [0, 1, 2] : [0, 2]);
  if (bandId === 'middle-row') return new Set([3, 4, 5]);
  if (bandId === 'bottom-row') return new Set(is3x3 ? [6, 7, 8] : [6, 8]);
  if (bandId === 'left-column') return new Set(is3x3 ? [0, 3, 6] : [0, 6]);
  if (bandId === 'middle-column') return new Set([1, 4, 7]);
  if (bandId === 'right-column') return new Set(is3x3 ? [2, 5, 8] : [2, 8]);
  if (bandId === 'front-layer') return new Set(is3x3 ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : [0, 2, 6, 8]);
  return new Set();
}
