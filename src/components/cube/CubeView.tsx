import type { KeyboardEvent } from 'react';
import { COLORS, COLOR_LABELS, FACE_NAMES, type FaceName } from '../../cube';
import type { CubeSizeId } from '../../trainer';
import { FACE_LAYER_WORD, STICKER_INDICES_BY_SIZE, stickerInLayer } from './bands';

/**
 * The cube itself is the layer selector: tapping any visible face selects
 * that face's turn (U/D/L/R/F/B). Turning happens elsewhere, in TurnControls
 * — this component only renders the cube and reports face taps.
 */
export function CubeView({
  grid,
  tilt,
  cubeSize,
  selectedFace,
  onSelectFace,
}: {
  grid: Record<FaceName, FaceName[]>;
  tilt: { x: number; y: number };
  cubeSize: CubeSizeId;
  selectedFace?: FaceName | null;
  onSelectFace?: (face: FaceName) => void;
}) {
  const stickerIndices = STICKER_INDICES_BY_SIZE[cubeSize];
  const gridClass = cubeSize === '2x2' ? 'cube-size-2x2' : 'cube-size-3x3';

  function handleKeyDown(face: FaceName, e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectFace?.(face);
    }
  }

  return (
    <div
      className="cube-stage"
      aria-label={`Interactive ${cubeSize.replace('x', '×')} cube preview`}
      data-cube-size={cubeSize}
    >
      <div className="cube-scene">
        <div className="cube" style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
          {FACE_NAMES.map((face) => (
            <div
              key={face}
              className={`cube-face cube-face-${face.toLowerCase()} ${gridClass} ${selectedFace === face ? 'selected-face' : ''}`}
              role={onSelectFace ? 'button' : undefined}
              tabIndex={onSelectFace ? 0 : undefined}
              aria-label={`Select the ${FACE_LAYER_WORD[face]} layer (${COLOR_LABELS[face].toLowerCase()}, ${face})`}
              onClick={onSelectFace ? () => onSelectFace(face) : undefined}
              onKeyDown={onSelectFace ? (e) => handleKeyDown(face, e) : undefined}
            >
              {stickerIndices.map((stickerIndex) => {
                const color = grid[face][stickerIndex];
                const isHighlighted = Boolean(selectedFace) && stickerInLayer(face, stickerIndex, selectedFace as FaceName, cubeSize);
                return (
                  <span
                    key={`${face}-${stickerIndex}`}
                    className={`sticker ${isHighlighted ? 'highlighted' : ''}`}
                    data-testid="cube-sticker"
                    style={{ background: COLORS[color] }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
