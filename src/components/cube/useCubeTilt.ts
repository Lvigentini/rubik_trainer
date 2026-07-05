import { useCallback, useState } from 'react';

export const DEFAULT_TILT = { x: -28, y: -38 };

/** Owns the "which way is the cube facing" state shared by CubeView and the
 * view-rotate buttons rendered alongside TurnControls. Kept separate from
 * turn/selection state — rotating the view never applies a move. */
/* Vertical tilt is clamped so the cube can show its top (x ≈ -70) or bottom
   (x ≈ +46) without ever flipping into a disorienting overhead/underneath view. */
const MIN_TILT_X = -70;
const MAX_TILT_X = 46;

export function useCubeTilt(defaultTilt: { x: number; y: number } = DEFAULT_TILT) {
  const [tilt, setTilt] = useState(defaultTilt);
  const rotateView = useCallback((direction: -1 | 1) => {
    setTilt((v) => ({ ...v, y: v.y + direction * 18 }));
  }, []);
  const rotateViewVertical = useCallback((direction: -1 | 1) => {
    setTilt((v) => ({ ...v, x: Math.min(MAX_TILT_X, Math.max(MIN_TILT_X, v.x + direction * 22)) }));
  }, []);
  const resetView = useCallback(() => setTilt(defaultTilt), [defaultTilt]);
  return { tilt, rotateView, rotateViewVertical, resetView };
}
