import type { FaceName, Turn } from '../../cube';
import type { CubeSizeId } from '../../trainer';
import { FACE_LAYER_WORD, type SliceFace } from './bands';

function ViewRotateControls({
  onRotateView,
  onResetView,
}: {
  onRotateView: (direction: -1 | 1) => void;
  onResetView: () => void;
}) {
  return (
    <div className="view-rotate-controls" aria-label="Rotate the view to see other faces">
      <button
        type="button"
        className="view-rotate-btn"
        onClick={() => onRotateView(-1)}
        title="Rotate the view left — this only changes what you can see, it doesn't turn the cube"
      >
        ↶ view
      </button>
      <button
        type="button"
        className="view-rotate-btn view-rotate-center"
        onClick={onResetView}
        title="Reset to the default view angle"
      >
        center
      </button>
      <button
        type="button"
        className="view-rotate-btn"
        onClick={() => onRotateView(1)}
        title="Rotate the view right — this only changes what you can see, it doesn't turn the cube"
      >
        view ↷
      </button>
    </div>
  );
}

/**
 * The fixed, labeled control strip rendered below the cube. Selection (which
 * face/layer) comes from tapping the cube itself (CubeView); this component
 * only exposes the three turn directions for whatever is currently selected,
 * plus the view-rotate buttons (visually distinct — muted, labeled "view")
 * so back/bottom faces can be brought into view without being mistaken for
 * layer turns.
 */
export function TurnControls({
  selectedFace,
  onTurn,
  onRotateView,
  onResetView,
}: {
  selectedFace: FaceName | null;
  onTurn: (turn: Turn) => void;
  onRotateView: (direction: -1 | 1) => void;
  onResetView: () => void;
}) {
  return (
    <div className="turn-controls" data-testid="turn-controls">
      {selectedFace ? (
        <>
          <p className="turn-controls-heading">
            Turn the {FACE_LAYER_WORD[selectedFace]} layer ({selectedFace}):
          </p>
          <div className="turn-buttons">
            <button
              type="button"
              className="turn-btn turn-btn-ccw"
              onClick={() => onTurn(`${selectedFace}'` as Turn)}
              aria-label="Turn selected layer counter-clockwise"
              title={`Counter-clockwise quarter turn — written ${selectedFace}′`}
            >
              <span aria-hidden="true">⟲</span> {selectedFace}&#8242;
            </button>
            <button
              type="button"
              className="turn-btn turn-btn-cw"
              onClick={() => onTurn(selectedFace as Turn)}
              aria-label="Turn selected layer clockwise"
              title={`Clockwise quarter turn — written ${selectedFace}`}
            >
              <span aria-hidden="true">⟳</span> {selectedFace}
            </button>
            <button
              type="button"
              className="turn-btn turn-btn-2"
              onClick={() => onTurn(`${selectedFace}2` as Turn)}
              aria-label="Turn selected layer 180 degrees"
              title={`Half turn — written ${selectedFace}2`}
            >
              <span aria-hidden="true">2×</span> {selectedFace}2
            </button>
          </div>
        </>
      ) : (
        <p className="turn-controls-hint">Tap a face of the cube to grab its layer.</p>
      )}
      <ViewRotateControls onRotateView={onRotateView} onResetView={onResetView} />
    </div>
  );
}

const SLICES: { id: SliceFace; label: string; description: string }[] = [
  { id: 'M', label: 'M', description: 'Middle slice, between left and right — turns the same way as L' },
  { id: 'E', label: 'E', description: 'Equator slice, between top and bottom — turns the same way as D' },
  { id: 'S', label: 'S', description: 'Standing slice, between front and back — turns the same way as F' },
];

/**
 * Play-only compact row for the 3×3 middle slices (M/E/S), which aren't
 * reachable by tapping a face (they have no visible face of their own).
 * Selecting a slice reveals its CW/CCW buttons inline.
 */
export function SliceControls({
  cubeSize,
  selectedSlice,
  onSelectSlice,
  onTurn,
}: {
  cubeSize: CubeSizeId;
  selectedSlice: SliceFace | null;
  onSelectSlice: (slice: SliceFace) => void;
  onTurn: (turn: Turn) => void;
}) {
  if (cubeSize !== '3x3') return null;
  return (
    <div className="slice-controls" data-testid="slice-controls" aria-label="Slice turns (3×3 only)">
      <span className="slice-controls-label">Slices (3×3):</span>
      {SLICES.map((slice) => (
        <div className="slice-group" key={slice.id}>
          <button
            type="button"
            className={`slice-select ${selectedSlice === slice.id ? 'selected' : ''}`}
            onClick={() => onSelectSlice(slice.id)}
            aria-label={`Select the ${slice.label} slice`}
            title={slice.description}
          >
            {slice.label}
          </button>
          {selectedSlice === slice.id && (
            <>
              <button
                type="button"
                className="turn-btn turn-btn-compact"
                onClick={() => onTurn(`${slice.id}'` as Turn)}
                aria-label={`Turn ${slice.label} slice counter-clockwise`}
                title={`Counter-clockwise — written ${slice.id}′`}
              >
                ⟲
              </button>
              <button
                type="button"
                className="turn-btn turn-btn-compact"
                onClick={() => onTurn(slice.id as Turn)}
                aria-label={`Turn ${slice.label} slice clockwise`}
                title={`Clockwise — written ${slice.id}`}
              >
                ⟳
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
