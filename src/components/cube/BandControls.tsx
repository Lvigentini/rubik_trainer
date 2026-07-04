import type { Turn } from '../../cube';
import type { CubeSizeId } from '../../trainer';
import { BAND_SELECTIONS, type BandSelection, getTurnForBand } from './bands';

export function BandControls({
  cubeSize,
  selectedBand,
  onSelectBand,
  onTurn,
}: {
  cubeSize: CubeSizeId;
  selectedBand: BandSelection;
  onSelectBand: (band: BandSelection) => void;
  onTurn: (turn: Turn) => void;
}) {
  const is3x3 = cubeSize === '3x3';
  const visible = BAND_SELECTIONS.filter((band) => is3x3 || !band.requires3x3);
  return (
    <div className="band-reference-bar" data-testid="band-reference-bar">
      <div className="band-reference-labels">
        {visible.map((band) => (
          <button
            key={band.id}
            className={selectedBand.id === band.id ? 'selected' : ''}
            onClick={() => onSelectBand(band)}
            aria-label={band.label}
            title={`${band.label} (${band.turn})`}
          >
            <span>{band.turn}</span>
          </button>
        ))}
      </div>
      <div className="band-reference-arrows">
        <button aria-label="Turn selected layer clockwise" onClick={() => onTurn(getTurnForBand(selectedBand, ''))}>
          ↻
        </button>
        <button aria-label="Turn selected layer counter-clockwise" onClick={() => onTurn(getTurnForBand(selectedBand, "'"))}>
          ↺
        </button>
        <button aria-label="Turn selected layer 180 degrees" onClick={() => onTurn(getTurnForBand(selectedBand, '2'))}>
          2
        </button>
      </div>
    </div>
  );
}
