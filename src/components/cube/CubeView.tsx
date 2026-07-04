import { COLORS, FACE_NAMES, type FaceName, type Turn } from '../../cube';
import type { CubeSizeId } from '../../trainer';
import { BAND_SELECTIONS, type BandSelection, STICKER_INDICES_BY_SIZE, bandStickerIndices, getTurnForBand } from './bands';

export function CubeView({
  grid,
  tilt,
  cubeSize,
  selectedBand,
  onSelectBand,
  onTurn,
}: {
  grid: Record<FaceName, FaceName[]>;
  tilt: { x: number; y: number };
  cubeSize: CubeSizeId;
  selectedBand?: BandSelection;
  onSelectBand?: (band: BandSelection) => void;
  onTurn?: (turn: Turn) => void;
}) {
  const stickerIndices = STICKER_INDICES_BY_SIZE[cubeSize];
  const gridClass = cubeSize === '2x2' ? 'cube-size-2x2' : 'cube-size-3x3';
  const highlighted = selectedBand ? bandStickerIndices(selectedBand.id, cubeSize) : new Set<number>();
  const is3x3 = cubeSize === '3x3';

  const handleStickerClick = (band: BandSelection, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectBand?.(band);
  };

  const handleRotateClick = (turn: Turn, e: React.MouseEvent) => {
    e.stopPropagation();
    onTurn?.(turn);
  };

  return (
    <div
      className="cube-stage"
      aria-label={`Interactive ${cubeSize.replace('x', '×')} cube preview`}
      data-cube-size={cubeSize}
    >
      <div className="cube" style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
        {FACE_NAMES.map((face) => (
          <div
            key={face}
            className={`cube-face cube-face-${face.toLowerCase()} ${gridClass} ${face === 'F' && selectedBand?.id === 'front-layer' ? 'selected-face' : ''}`}
            aria-label={`${face} face preview`}
          >
            {stickerIndices.map((stickerIndex) => {
              const color = grid[face][stickerIndex];
              const isHighlighted = face === 'F' && highlighted.has(stickerIndex);
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
      {onSelectBand && (
        <div className="cube-layer-grabbers" aria-label="Select layer by clicking rows or columns on the front face">
          {(['top-row', 'middle-row', 'bottom-row'] as const)
            .filter((id) => is3x3 || id !== 'middle-row')
            .map((id) => {
              const band = BAND_SELECTIONS.find((b) => b.id === id)!;
              return (
                <button
                  key={id}
                  className={`layer-grabber row-grabber ${id} ${selectedBand?.id === id ? 'selected' : ''}`}
                  aria-label={band.label}
                  title={band.description}
                  onClick={(e) => handleStickerClick(band, e)}
                />
              );
            })}
          {(['left-column', 'middle-column', 'right-column'] as const)
            .filter((id) => is3x3 || id !== 'middle-column')
            .map((id) => {
              const band = BAND_SELECTIONS.find((b) => b.id === id)!;
              return (
                <button
                  key={id}
                  className={`layer-grabber col-grabber ${id} ${selectedBand?.id === id ? 'selected' : ''}`}
                  aria-label={band.label}
                  title={band.description}
                  onClick={(e) => handleStickerClick(band, e)}
                />
              );
            })}
        </div>
      )}
      {onTurn && selectedBand && (
        <div className="cube-rotate-arrows" aria-label="Rotate selected layer">
          <button
            className="cube-arrow cube-arrow-cw"
            aria-label="Turn selected layer clockwise"
            onClick={(e) => handleRotateClick(getTurnForBand(selectedBand, ''), e)}
          >
            ↻
          </button>
          <button
            className="cube-arrow cube-arrow-ccw"
            aria-label="Turn selected layer counter-clockwise"
            onClick={(e) => handleRotateClick(getTurnForBand(selectedBand, "'"), e)}
          >
            ↺
          </button>
          <button
            className="cube-arrow cube-arrow-2"
            aria-label="Turn selected layer 180 degrees"
            onClick={(e) => handleRotateClick(getTurnForBand(selectedBand, '2'), e)}
          >
            2
          </button>
        </div>
      )}
    </div>
  );
}
