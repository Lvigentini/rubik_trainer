import { CornerUpLeft, CornerUpRight, RotateCcw, Shuffle, Timer } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type CubeState,
  type FaceGrid,
  type Turn,
  applyAlgorithm,
  applyTurn,
  createSolvedCube,
  generateScramble,
  inverseTurn,
  toFaceGrid,
} from '../../cube';
import { CUBE_SIZES, type CubeSizeId } from '../../trainer';
import { BAND_SELECTIONS, type BandSelection } from '../cube/bands';
import { BandControls } from '../cube/BandControls';
import { CubeView } from '../cube/CubeView';
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
 * The single owner of a Play cube session: cube state, band selection, move
 * history + undo/redo, the keyboard map, tilt, and scramble/reset/timer.
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
  selectedBand: BandSelection;
  setSelectedBand: (band: BandSelection) => void;
  applyMove: (turn: Turn) => void;
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
  const [cube, setCube] = useState<CubeState>(() =>
    initialScramble?.length ? applyAlgorithm(createSolvedCube(), initialScramble) : createSolvedCube(),
  );
  const [moveHistory, setMoveHistory] = useState<Turn[]>(() => initialScramble ?? []);
  const [historyCursor, setHistoryCursor] = useState(() => initialScramble?.length ?? 0);
  const [lastScramble, setLastScramble] = useState<Turn[]>(() => initialScramble ?? []);
  const [scrambleAt, setScrambleAt] = useState<number | null>(() => (initialScramble?.length ? Date.now() : null));
  const [tilt, setTilt] = useState({ x: -28, y: -38 });
  const [selectedBand, setSelectedBand] = useState<BandSelection>(BAND_SELECTIONS[0]);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [liveElapsedMs, setLiveElapsedMs] = useState(0);
  const moveHistoryRef = useRef<HTMLDivElement>(null);

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

  const applyMove = useCallback(
    (turn: Turn) => {
      setCube((current) => applyTurn(current, turn));
      setMoveHistory((history) => [...history.slice(0, historyCursor), turn]);
      setHistoryCursor(historyCursor + 1);
    },
    [historyCursor],
  );

  const undo = useCallback(() => {
    if (historyCursor <= 0) return;
    const turn = moveHistory[historyCursor - 1];
    setCube((current) => applyTurn(current, inverseTurn(turn)));
    setHistoryCursor((cursor) => cursor - 1);
  }, [historyCursor, moveHistory]);

  const redo = useCallback(() => {
    if (historyCursor >= moveHistory.length) return;
    const turn = moveHistory[historyCursor];
    setCube((current) => applyTurn(current, turn));
    setHistoryCursor((cursor) => cursor + 1);
  }, [historyCursor, moveHistory]);

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
    setMoveHistory(scramble);
    setHistoryCursor(scramble.length);
    setCube(applyAlgorithm(createSolvedCube(), scramble));
    setScrambleAt(Date.now());
    setElapsedMs(null);
    setTimerStart(null);
    setLiveElapsedMs(0);
  }, [selectedCubeSize]);

  const resetCube = useCallback(() => {
    setCube(createSolvedCube());
    setMoveHistory([]);
    setHistoryCursor(0);
    setLastScramble([]);
    setScrambleAt(null);
    setElapsedMs(null);
    setTimerStart(null);
    setLiveElapsedMs(0);
  }, []);

  const setCubeSize = useCallback(
    (id: CubeSizeId) => {
      setSelectedCubeSizeState(id);
      setSelectedBand(BAND_SELECTIONS[0]);
      resetCube();
    },
    [resetCube],
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
    selectedBand,
    setSelectedBand,
    applyMove,
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
          <div className="tilt-controls">
            <button onClick={() => setTilt((v) => ({ ...v, y: v.y - 18 }))}>↶</button>
            <button onClick={() => setTilt({ x: -28, y: -38 })}>center</button>
            <button onClick={() => setTilt((v) => ({ ...v, y: v.y + 18 }))}>↷</button>
          </div>
        </div>
        <CubeView
          grid={grid}
          tilt={tilt}
          cubeSize={selectedCubeSize}
          selectedBand={selectedBand}
          onSelectBand={setSelectedBand}
          onTurn={applyMove}
        />

        <BandControls
          cubeSize={selectedCubeSize}
          selectedBand={selectedBand}
          onSelectBand={setSelectedBand}
          onTurn={applyMove}
        />

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

        <div className="keyboard-hints">
          <span className="field-label">Keyboard</span>
          <p>
            Press <kbd>U</kbd> <kbd>R</kbd> <kbd>F</kbd> <kbd>D</kbd> <kbd>L</kbd> <kbd>B</kbd> for clockwise, <kbd>Shift</kbd> + key for prime.
            <br />
            <kbd>Ctrl</kbd> + <kbd>Z</kbd> undo, <kbd>Ctrl</kbd> + <kbd>Y</kbd> redo.
          </p>
        </div>
      </section>

      {children(session)}
    </section>
  );
}
