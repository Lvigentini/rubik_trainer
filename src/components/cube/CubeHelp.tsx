import { useEffect, useRef, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

/**
 * "?" button pinned to the top-left of the cube stage (mirroring the view
 * cluster top-right). Opens a small dialog with the mouse/touch controls and,
 * where keyboard shortcuts are wired (Play), the keyboard ones too. Closes on
 * ×, Escape, or clicking anywhere outside.
 */
export function CubeHelp({ showKeyboard = false }: { showKeyboard?: boolean }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    function onDocKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onDocPointerDown(e: globalThis.PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('keydown', onDocKeyDown);
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => {
      document.removeEventListener('keydown', onDocKeyDown);
      document.removeEventListener('pointerdown', onDocPointerDown);
    };
  }, [open]);

  return (
    <div className="cube-help" ref={containerRef}>
      <button
        type="button"
        className="help-btn"
        aria-label="How to control the cube"
        aria-expanded={open}
        title="How to control the cube"
        onClick={() => setOpen((value) => !value)}
      >
        <HelpCircle size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="help-popover" role="dialog" aria-label="How to control the cube" data-testid="cube-help-popover">
          <div className="help-popover-header">
            <strong>How to control the cube</strong>
            <button
              type="button"
              className="help-close"
              aria-label="Close help"
              onClick={() => setOpen(false)}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
          <section>
            <h4>Mouse &amp; touch</h4>
            <ul>
              <li><strong>Tap a tile</strong> to grab its column — <strong>tap it again</strong> to switch to its row.</li>
              <li>The <strong>chips below the cube</strong> pick a whole layer by name (Top, Front, Middle…).</li>
              <li>Turn the grabbed layer with the big <strong>⟳ ⟲ 2×</strong> buttons beside the cube.</li>
              <li><strong>Drag</strong> anywhere around the cube to spin your view — it never turns the cube. <strong>⌂</strong> resets the view.</li>
            </ul>
          </section>
          {showKeyboard && (
            <section>
              <h4>Keyboard</h4>
              <ul>
                <li><kbd>U</kbd> <kbd>R</kbd> <kbd>F</kbd> <kbd>D</kbd> <kbd>L</kbd> <kbd>B</kbd> turn layers clockwise (<kbd>M</kbd> <kbd>E</kbd> <kbd>S</kbd> for 3×3 slices); hold <kbd>Shift</kbd> for counter-clockwise.</li>
                <li><kbd>Ctrl</kbd>+<kbd>Z</kbd> undo, <kbd>Ctrl</kbd>+<kbd>Y</kbd> redo.</li>
              </ul>
            </section>
          )}
          <p className="help-note">Letters like U and R′ are cube notation — you&rsquo;ll learn them as you go.</p>
        </div>
      )}
    </div>
  );
}
