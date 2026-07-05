import { COLORS, COLOR_LABELS, type FaceName, type Turn } from '../../cube';
import type { CubeSizeId } from '../../trainer';
import { FACE_LAYER_WORD, SLICE_LAYER_WORD, isSliceFace, type LayerId, type SliceFace } from './bands';

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

/** "Turn the front layer (F):" for a face, "Turn the middle slice (M):" for
 * a slice — SLICE_LAYER_WORD already reads as "middle slice" etc, so a slice
 * heading skips the redundant "layer" that a face heading needs. */
function layerHeading(layer: LayerId): string {
  if (isSliceFace(layer)) return `Turn the ${SLICE_LAYER_WORD[layer]} (${layer}):`;
  return `Turn the ${FACE_LAYER_WORD[layer]} layer (${layer}):`;
}

/**
 * The prominent turn rail at the left of the cube: the three turn directions
 * for whichever layer is selected (by tapping the cube or the layer picker).
 * `selectedLayer` covers both whole faces (U/D/L/R/F/B) and, on 3×3, the
 * middle slices (M/E/S) — both turn through the exact same three buttons.
 */
export function TurnRail({
  selectedLayer,
  onTurn,
}: {
  selectedLayer: LayerId | null;
  onTurn: (turn: Turn) => void;
}) {
  return (
    <div className="turn-rail" data-testid="turn-controls">
      {selectedLayer ? (
        <>
          <p className="turn-controls-heading">{layerHeading(selectedLayer)}</p>
          <button
            type="button"
            className="turn-btn turn-btn-cw"
            onClick={() => onTurn(selectedLayer as Turn)}
            aria-label="Turn selected layer clockwise"
            title={`Clockwise quarter turn — written ${selectedLayer}`}
          >
            <span aria-hidden="true">⟳</span> {selectedLayer}
          </button>
          <button
            type="button"
            className="turn-btn turn-btn-ccw"
            onClick={() => onTurn(`${selectedLayer}'` as Turn)}
            aria-label="Turn selected layer counter-clockwise"
            title={`Counter-clockwise quarter turn — written ${selectedLayer}′`}
          >
            <span aria-hidden="true">⟲</span> {selectedLayer}&#8242;
          </button>
          <button
            type="button"
            className="turn-btn turn-btn-2"
            onClick={() => onTurn(`${selectedLayer}2` as Turn)}
            aria-label="Turn selected layer 180 degrees"
            title={`Half turn — written ${selectedLayer}2`}
          >
            <span aria-hidden="true">2×</span> {selectedLayer}2
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

/** 3×3-only picker chips for the middle slices — reachable by tapping an
 * edge-middle/centre tile on the cube itself, but these guarantee they're
 * also reachable without precise tile-tapping. */
const PICKER_SLICES: { id: SliceFace; label: string; title: string }[] = [
  { id: 'M', label: 'Middle (M)', title: 'The middle slice, between left and right — written M' },
  { id: 'E', label: 'Equator (E)', title: 'The equator slice, between top and bottom — written E' },
  { id: 'S', label: 'Standing (S)', title: 'The standing slice, between front and back — written S' },
];

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Always-available labeled fallback for layer selection — guarantees every
 * layer (including bottom/back, and on 3×3 the middle slices) is reachable
 * even when a face or a specific tile is hard to tap on the 3D cube, and the
 * face chips double as a colour ↔ face-name legend. */
export function FacePicker({
  cubeSize,
  selectedLayer,
  onSelectLayer,
}: {
  cubeSize: CubeSizeId;
  selectedLayer: LayerId | null;
  onSelectLayer: (layer: LayerId) => void;
}) {
  return (
    <div className="face-picker" data-testid="face-picker" aria-label="Pick a layer by name">
      <span className="face-picker-label">Or pick a layer:</span>
      {PICKER_FACES.map((face) => (
        <button
          key={face}
          type="button"
          className={`face-picker-chip ${selectedLayer === face ? 'selected' : ''}`}
          aria-pressed={selectedLayer === face}
          onClick={() => onSelectLayer(face)}
          title={`The ${FACE_LAYER_WORD[face]} layer — ${COLOR_LABELS[face].toLowerCase()} face, written ${face}`}
        >
          <span className="face-picker-swatch" style={{ background: COLORS[face] }} aria-hidden="true" />
          {capitalize(FACE_LAYER_WORD[face])}
        </button>
      ))}
      {cubeSize === '3x3' &&
        PICKER_SLICES.map((slice) => (
          <button
            key={slice.id}
            type="button"
            className={`face-picker-chip face-picker-chip-slice ${selectedLayer === slice.id ? 'selected' : ''}`}
            aria-pressed={selectedLayer === slice.id}
            onClick={() => onSelectLayer(slice.id)}
            title={slice.title}
          >
            <span className="face-picker-swatch face-picker-swatch-slice" aria-hidden="true" />
            {slice.label}
          </button>
        ))}
    </div>
  );
}
