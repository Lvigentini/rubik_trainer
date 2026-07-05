import { COLORS, COLOR_LABELS, type FaceName, type Turn } from '../../cube';
import type { CubeSizeId } from '../../trainer';
import { FACE_LAYER_WORD, type SliceFace } from './bands';

/**
 * Compact view-orbit cluster, rendered in the top-right corner of the cube
 * stage. Visually muted so it can't be mistaken for layer turns — these only
 * change what you can see. Drag-to-rotate on the stage covers the same ground
 * for pointer users; this cluster is the discoverable/keyboard path.
 */
export function ViewControls({
  onRotateView,
  onRotateViewVertical,
  onResetView,
}: {
  onRotateView: (direction: -1 | 1) => void;
  onRotateViewVertical: (direction: -1 | 1) => void;
  onResetView: () => void;
}) {
  return (
    <div className="view-cluster" aria-label="Rotate the view to see other faces (or drag around the cube)">
      <button
        type="button"
        className="view-btn"
        onClick={() => onRotateView(-1)}
        aria-label="Rotate the view left"
        title="Rotate the view left — only changes what you see, doesn't turn the cube"
      >
        ↶
      </button>
      <button
        type="button"
        className="view-btn"
        onClick={() => onRotateViewVertical(-1)}
        aria-label="Tip the view up to see the top face"
        title="Tip the view to see the top face — doesn't turn the cube"
      >
        ↥
      </button>
      <button
        type="button"
        className="view-btn"
        onClick={() => onRotateViewVertical(1)}
        aria-label="Tip the view down to see the bottom face"
        title="Tip the view to see the bottom face — doesn't turn the cube"
      >
        ↧
      </button>
      <button
        type="button"
        className="view-btn"
        onClick={() => onRotateView(1)}
        aria-label="Rotate the view right"
        title="Rotate the view right — only changes what you see, doesn't turn the cube"
      >
        ↷
      </button>
      <button
        type="button"
        className="view-btn view-btn-center"
        onClick={onResetView}
        aria-label="Reset to the default view angle"
        title="Reset to the default view angle"
      >
        ⌂
      </button>
    </div>
  );
}

/**
 * The prominent turn rail at the left of the cube: the three turn directions
 * for whichever layer is selected (by tapping the cube or the layer picker).
 */
export function TurnRail({
  selectedFace,
  onTurn,
}: {
  selectedFace: FaceName | null;
  onTurn: (turn: Turn) => void;
}) {
  return (
    <div className="turn-rail" data-testid="turn-controls">
      {selectedFace ? (
        <>
          <p className="turn-controls-heading">
            Turn the {FACE_LAYER_WORD[selectedFace]} layer ({selectedFace}):
          </p>
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
            className="turn-btn turn-btn-ccw"
            onClick={() => onTurn(`${selectedFace}'` as Turn)}
            aria-label="Turn selected layer counter-clockwise"
            title={`Counter-clockwise quarter turn — written ${selectedFace}′`}
          >
            <span aria-hidden="true">⟲</span> {selectedFace}&#8242;
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
        </>
      ) : (
        <p className="turn-controls-hint">Tap a face of the cube to grab its layer.</p>
      )}
    </div>
  );
}

/* Order mirrors how learners meet the faces: the three visible ones first. */
const PICKER_FACES: FaceName[] = ['U', 'F', 'R', 'D', 'L', 'B'];

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Always-available labeled fallback for layer selection — guarantees every
 * layer (including bottom/back) is reachable even when a face is hard to tap
 * on the 3D cube, and doubles as a colour ↔ face-name legend. */
export function FacePicker({
  selectedFace,
  onSelectFace,
}: {
  selectedFace: FaceName | null;
  onSelectFace: (face: FaceName) => void;
}) {
  return (
    <div className="face-picker" data-testid="face-picker" aria-label="Pick a layer by name">
      <span className="face-picker-label">Or pick a layer:</span>
      {PICKER_FACES.map((face) => (
        <button
          key={face}
          type="button"
          className={`face-picker-chip ${selectedFace === face ? 'selected' : ''}`}
          aria-pressed={selectedFace === face}
          onClick={() => onSelectFace(face)}
          title={`The ${FACE_LAYER_WORD[face]} layer — ${COLOR_LABELS[face].toLowerCase()} face, written ${face}`}
        >
          <span className="face-picker-swatch" style={{ background: COLORS[face] }} aria-hidden="true" />
          {capitalize(FACE_LAYER_WORD[face])}
        </button>
      ))}
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
