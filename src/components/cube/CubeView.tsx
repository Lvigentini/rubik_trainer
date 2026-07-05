import { useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { COLORS, COLOR_LABELS, FACE_NAMES, type FaceName } from '../../cube';
import type { CubeSizeId } from '../../trainer';
import { FACE_LAYER_WORD, STICKER_INDICES_BY_SIZE, stickerInLayer } from './bands';

const DRAG_CLICK_THRESHOLD_PX = 6;

/**
 * The cube itself is the layer selector: tapping any visible face selects
 * that face's turn (U/D/L/R/F/B). Turning happens elsewhere (TurnRail).
 * Dragging anywhere on the stage orbits the view (onDragRotate); a drag past
 * a small threshold swallows the click so it can't double as a face tap.
 */
export function CubeView({
  grid,
  tilt,
  cubeSize,
  selectedFace,
  onSelectFace,
  onDragRotate,
}: {
  grid: Record<FaceName, FaceName[]>;
  tilt: { x: number; y: number };
  cubeSize: CubeSizeId;
  selectedFace?: FaceName | null;
  onSelectFace?: (face: FaceName) => void;
  onDragRotate?: (dxPx: number, dyPx: number) => void;
}) {
  const stickerIndices = STICKER_INDICES_BY_SIZE[cubeSize];
  const gridClass = cubeSize === '2x2' ? 'cube-size-2x2' : 'cube-size-3x3';
  const dragRef = useRef<{ pointerId: number; lastX: number; lastY: number; total: number } | null>(null);
  const suppressClickRef = useRef(false);

  function handleKeyDown(face: FaceName, e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectFace?.(face);
    }
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!onDragRotate || !e.isPrimary) return;
    dragRef.current = { pointerId: e.pointerId, lastX: e.clientX, lastY: e.clientY, total: 0 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.lastX;
    const dy = e.clientY - drag.lastY;
    if (dx === 0 && dy === 0) return;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
    drag.total += Math.abs(dx) + Math.abs(dy);
    onDragRotate?.(dx, dy);
  }

  function handlePointerEnd(e: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (drag.total > DRAG_CLICK_THRESHOLD_PX) {
      // The browser fires the gesture's click right after pointerup; eat that
      // one so an orbit drag never doubles as a face selection.
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
    dragRef.current = null;
  }

  function handleClickCapture(e: MouseEvent<HTMLDivElement>) {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
    }
  }

  return (
    <div
      className={`cube-stage${onDragRotate ? ' cube-stage-draggable' : ''}`}
      aria-label={`Interactive ${cubeSize.replace('x', '×')} cube preview`}
      data-cube-size={cubeSize}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onClickCapture={handleClickCapture}
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
