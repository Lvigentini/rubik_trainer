import { useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { COLORS, COLOR_LABELS, FACE_NAMES, type FaceName } from '../../cube';
import type { CubeSizeId } from '../../trainer';
import { FACE_LAYER_WORD, STICKER_INDICES_BY_SIZE, stickerInLayer, type LayerId } from './bands';

const DRAG_CLICK_THRESHOLD_PX = 6;

/**
 * The cube itself is the layer selector. Tapping a face's gaps/border (or
 * pressing Enter/Space on it) selects that whole face's turn (U/D/L/R/F/B).
 * On 3×3, tapping an individual sticker instead delegates to onSelectSticker
 * — the consumer runs bands.ts's layerForSticker to decide whether that tile
 * means the whole face (corners) or a middle slice (M/E/S, edge-middle/centre
 * tiles), since that decision needs the previously-selected layer (for the
 * centre tile's toggle). Turning happens elsewhere (TurnRail). Dragging
 * anywhere on the stage orbits the view (onDragRotate); a drag past a small
 * threshold swallows the click so it can't double as a face/sticker tap.
 */
export function CubeView({
  grid,
  tilt,
  cubeSize,
  selectedLayer,
  onSelectLayer,
  onSelectSticker,
  onDragRotate,
}: {
  grid: Record<FaceName, FaceName[]>;
  tilt: { x: number; y: number };
  cubeSize: CubeSizeId;
  selectedLayer?: LayerId | null;
  onSelectLayer?: (face: FaceName) => void;
  onSelectSticker?: (face: FaceName, index: number) => void;
  onDragRotate?: (dxPx: number, dyPx: number) => void;
}) {
  const stickerIndices = STICKER_INDICES_BY_SIZE[cubeSize];
  const gridClass = cubeSize === '2x2' ? 'cube-size-2x2' : 'cube-size-3x3';
  const dragRef = useRef<{ pointerId: number; lastX: number; lastY: number; total: number; dragging: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  function handleKeyDown(face: FaceName, e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectLayer?.(face);
    }
  }

  function handleStickerClick(face: FaceName, index: number, e: MouseEvent<HTMLSpanElement>) {
    // Stop the face div's own onClick from also firing (it would select the
    // whole face) — the sticker tap decides the layer itself via bands.ts.
    e.stopPropagation();
    onSelectSticker?.(face, index);
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!onDragRotate || !e.isPrimary) return;
    // Do NOT capture the pointer here: capturing on pointerdown retargets the
    // release to the stage, so the gesture's click never reaches the face
    // that was pressed and tapping a face silently stops selecting. Capture
    // only once movement proves this is a drag (see handlePointerMove).
    dragRef.current = { pointerId: e.pointerId, lastX: e.clientX, lastY: e.clientY, total: 0, dragging: false };
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
    if (!drag.dragging && drag.total > DRAG_CLICK_THRESHOLD_PX) {
      drag.dragging = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    if (drag.dragging) onDragRotate?.(dx, dy);
  }

  function handlePointerEnd(e: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (drag.dragging) {
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
              className={`cube-face cube-face-${face.toLowerCase()} ${gridClass} ${selectedLayer === face ? 'selected-face' : ''}`}
              role={onSelectLayer ? 'button' : undefined}
              tabIndex={onSelectLayer ? 0 : undefined}
              aria-label={`Select the ${FACE_LAYER_WORD[face]} layer (${COLOR_LABELS[face].toLowerCase()}, ${face})`}
              onClick={onSelectLayer ? () => onSelectLayer(face) : undefined}
              onKeyDown={onSelectLayer ? (e) => handleKeyDown(face, e) : undefined}
            >
              {stickerIndices.map((stickerIndex) => {
                const color = grid[face][stickerIndex];
                const isHighlighted = Boolean(selectedLayer) && stickerInLayer(face, stickerIndex, selectedLayer as LayerId, cubeSize);
                return (
                  <span
                    key={`${face}-${stickerIndex}`}
                    className={`sticker ${isHighlighted ? 'highlighted' : ''}`}
                    data-testid="cube-sticker"
                    onClick={onSelectSticker ? (e) => handleStickerClick(face, stickerIndex, e) : undefined}
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
