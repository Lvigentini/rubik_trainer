import { useCallback, useState } from 'react';

export const DEFAULT_TILT = { x: -28, y: -38 };

/** Owns the "which way is the cube facing" state shared by CubeView and the
 * view-rotate buttons rendered alongside TurnControls. Kept separate from
 * turn/selection state — rotating the view never applies a move. */
export function useCubeTilt(defaultTilt: { x: number; y: number } = DEFAULT_TILT) {
  const [tilt, setTilt] = useState(defaultTilt);
  const rotateView = useCallback((direction: -1 | 1) => {
    setTilt((v) => ({ ...v, y: v.y + direction * 18 }));
  }, []);
  const resetView = useCallback(() => setTilt(defaultTilt), [defaultTilt]);
  return { tilt, rotateView, resetView };
}
