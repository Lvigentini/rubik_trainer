import { CornerUpLeft, CornerUpRight, RotateCcw, Shuffle, Timer } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type CubeState,
  type FaceGrid,
  type FaceName,
  type Turn,
  applyAlgorithm,
  createSolvedCube,
  generateScramble,
  toFaceGrid,
} from '../../cube';
import { CUBE_SIZES, type CubeSizeId } from '../../trainer';
import { layerForSticker, type LayerId } from '../cube/bands';
import { CubeHelp } from '../cube/CubeHelp';
import { CubeView } from '../cube/CubeView';
import { FacePicker, TurnRail, ViewControls } from '../cube/TurnControls';
import { useCubeTilt } from '../cube/useCubeTilt';
import { formatTime } from './formatTime';

const KEYBOARD_MAP: Record<string, Turn> = {
  u: 'U',
  U: "U'",
  r: 'R',
  R: "R'",
  f: 'F',
  F: "F'",
  d: 'D',
  D: "D'",
  l: 'L',
  L: "L'",
  b: 'B',
  B: "B'",
  m: 'M',
  M: "M'",
  e: 'E',
  E: "E'",
  s: 'S',
  S: "S'",
};

const PRIME_KEYS = new Set(['U', 'R', 'F', 'D', 'L', 'B', 'M', 'E', 'S']);

/**
 * The single owner of a Play cube session: cube state, move history +
 * undo/redo, the keyboard map, tilt, and scramble/reset/timer. Layer
 * selection lives here too (selectedLayer, covering both faces and, on 3×3,
 * middle slices) purely to wire CubeView + TurnControls — it isn't part of
 * CubeSession since no consuming panel needs it.
 * Free Play and Solve Coach both mount one of these; Scan Coach mounts one
 * too so it can reuse the interactive cube view for importing faces. Only
 * one CubeWorkspace is ever mounted at a time (PracticePage renders exactly
 * one mode panel per route), so the keyboard listener registered here never
 * fires while Learn is showing.
 */
export type CubeSession = {
  cube: CubeState;
  grid: FaceGrid;
  cubeSize: CubeSizeId;
  setCubeSize: (id: CubeSizeId) => void;
  moveHistory: Turn[];
  historyCursor: number;
  /** Moves applied since the last scramble/reset (negative if undone past it). */
  movesSinceScramble: number;
  lastScramble: Turn[];
  /** Wall-clock time the current scramble was generated, or null before any scramble. */
  scrambleAt: number | null;
  applyMove: (turn: Turn) => void;
  /** Applies a batch of turns as a single history entry — used by "Finish
   * known solve" so N moves record as N moves instead of collapsing to 1
   * (see the historyState refactor note below). */
  applyMoves: (turns: Turn[]) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  scrambleCube: () => void;
  resetCube: () => void;
  isTiming: boolean;
  /** Duration of the last completed timer run, or null if never stopped since reset/scramble. */
  elapsedMs: number | null;
  liveElapsedMs: number;
  startStopTimer: () => void;
};

export function CubeWorkspace({
  initialCubeSize = '2x2',
  initialScramble,
  children,
}: {
  initialCubeSize?: CubeSizeId;
  initialScramble?: Turn[];
  children: (session: CubeSession) => ReactNode;
}) {
  const [selectedCubeSize, setSelectedCubeSizeState] = useState<CubeSizeId>(initialCubeSize);
  // History and cursor live in ONE state object, always updated together via
  // a single functional setState call. This is what makes applyMove (and the
  // batch-safe applyMoves) safe to call multiple times synchronously in one
  // handler (e.g. "Finish known solve" looping over a solution): each call
  // reads the *previous updater's* result, not a stale render-time closure,
  // so N calls record N moves instead of collapsing to 1. The cube itself is
  // derived (see `cube` below) rather than kept as separate state, so it can
  // never drift out of sync with history/cursor.
  const [historyState, setHistoryState] = useState<{ history: Turn[]; cursor: number }>(() => ({
    history: initialScramble ?? [],
    cursor: initialScramble?.length ?? 0,
  }));
  const { history: moveHistory, cursor: historyCursor } = historyState;
  const [lastScramble, setLastScramble] = useState<Turn[]>(() => initialScramble ?? []);
  const [scrambleAt, setScrambleAt] = useState<number | null>(() => (initialScramble?.length ? Date.now() : null));
  const { tilt, rotateView, rotateViewVertical, dragRotate, resetView } = useCubeTilt();
  const [selectedLayer, setSelectedLayer] = useState<LayerId | null>(null);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [liveElapsedMs, setLiveElapsedMs] = useState(0);
  const moveHistoryRef = useRef<HTMLDivElement>(null);

  const cube = useMemo(
    () => applyAlgorithm(createSolvedCube(), moveHistory.slice(0, historyCursor)),
    [moveHistory, historyCursor],
  );
  const grid = useMemo(() => toFaceGrid(cube), [cube]);
  const isTiming = timerStart !== null;
  const movesSinceScramble = historyCursor - lastScramble.length;

  useEffect(() => {
    if (!timerStart) return undefined;
    const interval = window.setInterval(() => setLiveElapsedMs(Date.now() - timerStart), 100);
    return () => window.clearInterval(interval);
  }, [timerStart]);

  useEffect(() => {
    if (moveHistoryRef.current) {
      moveHistoryRef.current.scrollTop = moveHistoryRef.current.scrollHeight;
    }
  }, [moveHistory]);

  const applyMove = useCallback((turn: Turn) => {
    setHistoryState((s) => ({ history: [...s.history.slice(0, s.cursor), turn], cursor: s.cursor + 1 }));
  }, []);

  const applyMoves = useCallback((turns: Turn[]) => {
    if (!turns.length) return;
    setHistoryState((s) => ({
      history: [...s.history.slice(0, s.cursor), ...turns],
      cursor: s.cursor + turns.length,
    }));
  }, []);

  const undo = useCallback(() => {
    setHistoryState((s) => (s.cursor <= 0 ? s : { ...s, cursor: s.cursor - 1 }));
  }, []);

  const redo = useCallback(() => {
    setHistoryState((s) => (s.cursor >= s.history.length ? s : { ...s, cursor: s.cursor + 1 }));
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
          return;
        }
        if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
          return;
        }
      }
      const isPrime = e.shiftKey;
      const key = isPrime ? e.key.toUpperCase() : e.key.toLowerCase();
      let turn = KEYBOARD_MAP[key];
      if (turn && isPrime && PRIME_KEYS.has(e.key.toUpperCase())) {
        turn = (turn.endsWith("'") ? turn.slice(0, -1) : turn + "'") as Turn;
      }
      if (turn) {
        e.preventDefault();
        applyMove(turn);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [applyMove, redo, undo]);

  const scrambleCube = useCallback(() => {
    const scramble = generateScramble(selectedCubeSize === '2x2' ? 10 : 20);
    setLastScramble(scramble);
    setHistoryState({ history: scramble, cursor: scramble.length });
    setScrambleAt(Date.now());
    setElapsedMs(null);
    setTimerStart(null);
    setLiveElapsedMs(0);
  }, [selectedCubeSize]);

  const resetCube = useCallback(() => {
    setHistoryState({ history: [], cursor: 0 });
    setLastScramble([]);
    setScrambleAt(null);
    setElapsedMs(null);
    setTimerStart(null);
    setLiveElapsedMs(0);
  }, []);

  const setCubeSize = useCallback(
    (id: CubeSizeId) => {
      setSelectedCubeSizeState(id);
      setSelectedLayer(null);
      resetCube();
    },
    [resetCube],
  );

  const selectSticker = useCallback(
    (face: FaceName, index: number) => {
      setSelectedLayer((previous) => layerForSticker(face, index, selectedCubeSize, previous));
    },
    [selectedCubeSize],
  );

  const startStopTimer = useCallback(() => {
    if (timerStart) {
      setElapsedMs(Date.now() - timerStart);
      setTimerStart(null);
    } else {
      setElapsedMs(null);
      setLiveElapsedMs(0);
      setTimerStart(Date.now());
    }
  }, [timerStart]);

  const session: CubeSession = {
    cube,
    grid,
    cubeSize: selectedCubeSize,
    setCubeSize,
    moveHistory,
    historyCursor,
    movesSinceScramble,
    lastScramble,
    scrambleAt,
    applyMove,
    applyMoves,
    undo,
    redo,
    canUndo: historyCursor > 0,
    canRedo: historyCursor < moveHistory.length,
    scrambleCube,
    resetCube,
    isTiming,
    elapsedMs,
    liveElapsedMs,
    startStopTimer,
  };

  return (
    <section className="game-layout">
      <aside className="panel game-sidebar">
        <span className="field-label">Cube size</span>
        <div className="segmented stacked-segmented">
          {CUBE_SIZES.map((cubeSizeOption) => (
            <button
              key={cubeSizeOption.id}
              className={selectedCubeSize === cubeSizeOption.id ? 'active' : ''}
              onClick={() => setCubeSize(cubeSizeOption.id)}
            >
              {cubeSizeOption.label}
            </button>
          ))}
        </div>
        <div className="mini-metrics">
          <div>
            <span>Moves</span>
            <strong>{moveHistory.length}</strong>
          </div>
          <div>
            <span>Timer</span>
            <strong>{isTiming ? formatTime(liveElapsedMs) : elapsedMs ? formatTime(elapsedMs) : 'ready'}</strong>
          </div>
        </div>
        <button className="primary wide" onClick={scrambleCube}>
          <Shuffle size={16} /> New scramble
        </button>
        <button className="wide" onClick={startStopTimer}>
          <Timer size={16} /> {isTiming ? 'Stop timer' : 'Start timer'}
        </button>
        <button className="wide" onClick={resetCube}>
          <RotateCcw size={16} /> Reset
        </button>
      </aside>

      <section className="panel cube-panel game-cube-panel">
        <div className="panel-header">
          <h2>3D cube</h2>
        </div>
        <div className="cube-area">
          <TurnRail selectedLayer={selectedLayer} onTurn={applyMove} />
          <div className="cube-stage-shell">
            <CubeHelp showKeyboard />
            <ViewControls
              onRotateView={rotateView}
              onRotateViewVertical={rotateViewVertical}
              onResetView={resetView}
            />
            <CubeView
              grid={grid}
              tilt={tilt}
              cubeSize={selectedCubeSize}
              selectedLayer={selectedLayer}
              onSelectLayer={setSelectedLayer}
              onSelectSticker={selectSticker}
              onDragRotate={dragRotate}
            />
          </div>
        </div>
        <FacePicker cubeSize={selectedCubeSize} selectedLayer={selectedLayer} onSelectLayer={setSelectedLayer} />

        <div className="move-history">
          <div className="history-header">
            <span className="field-label">Move history</span>
            <div className="history-actions">
              <button onClick={undo} disabled={historyCursor <= 0} aria-label="Undo">
                <CornerUpLeft size={16} />
              </button>
              <button onClick={redo} disabled={historyCursor >= moveHistory.length} aria-label="Redo">
                <CornerUpRight size={16} />
              </button>
            </div>
          </div>
          <div className="history-list" data-testid="move-history" ref={moveHistoryRef}>
            {moveHistory.length === 0 ? (
              <span className="empty-history">No moves yet</span>
            ) : (
              moveHistory.map((turn, i) => (
                <span key={`${turn}-${i}`} className={i >= historyCursor ? 'future' : ''}>
                  {turn}
                </span>
              ))
            )}
          </div>
        </div>

      </section>

      {children(session)}
    </section>
  );
}
