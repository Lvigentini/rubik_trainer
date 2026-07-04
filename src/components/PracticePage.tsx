import {
  Award,
  Camera,
  CornerUpLeft,
  CornerUpRight,
  RotateCcw,
  Shuffle,
  Timer,
  Wand2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  COLOR_LABELS,
  COLORS,
  FACE_NAMES,
  type FaceName,
  type PartialScan,
  type ScanFace,
  type Turn,
  applyAlgorithm,
  applyTurn,
  createSolvedCube,
  emptyPartialScan,
  formatAlgorithm,
  generateScramble,
  inverseTurn,
  invertAlgorithm,
  scanWarnings,
  toFaceGrid,
} from '../cube';
import { CUBE_SIZES, type CubeSizeId, calculateLessonScore } from '../trainer';
import { getStageById } from '../learningPath';
import { BAND_SELECTIONS, type BandSelection, STICKER_INDICES_BY_SIZE } from './cube/bands';
import { BandControls } from './cube/BandControls';
import { CubeView } from './cube/CubeView';

const SCAN_FACES: ScanFace[] = ['U', 'F', 'R'];

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

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const mins = Math.floor(seconds / 60);
  return `${mins}:${(seconds % 60).toFixed(2).padStart(5, '0')}`;
}

function FaceEditor({
  face,
  values,
  selectedColor,
  stickerIndices,
  onPick,
}: {
  face: ScanFace;
  values: PartialScan[ScanFace];
  selectedColor: FaceName;
  stickerIndices: number[];
  onPick: (index: number, color: FaceName) => void;
}) {
  return (
    <div className="face-editor">
      <div className="face-editor-title">{face} face</div>
      <div className={`face-grid ${stickerIndices.length === 4 ? 'face-grid-4' : ''}`}>
        {stickerIndices.map((index) => {
          const value = values[index];
          return (
            <button
              key={`${face}-${index}`}
              className="scan-sticker"
              style={{ background: value ? COLORS[value] : 'rgba(255,255,255,0.12)' }}
              onClick={() => onPick(index, selectedColor)}
              aria-label={`Set ${face} sticker ${index + 1} to ${COLOR_LABELS[selectedColor]}`}
            >
              {!value ? '+' : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type GameMode = 'practice' | 'guided' | 'scan';

export function PracticePage({ skillContext, initialMode = 'practice' }: { skillContext?: string; initialMode?: GameMode }) {
  const [cube, setCube] = useState(() => createSolvedCube());
  const [moveHistory, setMoveHistory] = useState<Turn[]>([]);
  const [historyCursor, setHistoryCursor] = useState(0);
  const [lastScramble, setLastScramble] = useState<Turn[]>([]);
  const [tilt, setTilt] = useState({ x: -28, y: -38 });
  const [selectedColor, setSelectedColor] = useState<FaceName>('U');
  const [scan, setScan] = useState<PartialScan>(() => emptyPartialScan());
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [liveElapsed, setLiveElapsed] = useState(0);
  const [solutionCursor, setSolutionCursor] = useState(0);
  const [selectedCubeSize, setSelectedCubeSize] = useState<CubeSizeId>('2x2');
  const [gameMode, setGameMode] = useState<GameMode>(initialMode);
  const [selectedBand, setSelectedBand] = useState<BandSelection>(BAND_SELECTIONS[0]);
  const moveHistoryRef = useRef<HTMLDivElement>(null);

  const grid = useMemo(() => toFaceGrid(cube), [cube]);
  const solution = useMemo(() => invertAlgorithm(lastScramble), [lastScramble]);
  const remainingSolution = solution.slice(solutionCursor);
  const warnings = useMemo(() => scanWarnings(scan), [scan]);
  const isTiming = timerStart !== null;
  const visibleStickerIndices = STICKER_INDICES_BY_SIZE[selectedCubeSize];
  const visibleStickerTotal = visibleStickerIndices.length * SCAN_FACES.length;
  const visibleKnown = SCAN_FACES.reduce(
    (total, face) => total + visibleStickerIndices.filter((index) => scan[face][index]).length,
    0,
  );
  const visibleCompleteness = Math.round((visibleKnown / visibleStickerTotal) * 100);

  const gameScore = calculateLessonScore({
    completed: true,
    optimalMoves: 10,
    actualMoves: Math.max(10, moveHistory.length || 10),
    elapsedSeconds: elapsed ? elapsed / 1000 : 72,
    targetSeconds: 90,
    hintsUsed: 0,
    mistakes: 0,
    streak: 2,
  });

  const stageInfo = skillContext ? getStageById(skillContext as never) : undefined;

  useEffect(() => {
    if (!timerStart) return undefined;
    const interval = window.setInterval(() => setLiveElapsed(Date.now() - timerStart), 100);
    return () => window.clearInterval(interval);
  }, [timerStart]);

  useEffect(() => {
    if (moveHistoryRef.current) {
      moveHistoryRef.current.scrollTop = moveHistoryRef.current.scrollHeight;
    }
  }, [moveHistory]);

  const applyMove = useCallback((turn: Turn) => {
    setCube((current) => applyTurn(current, turn));
    setMoveHistory((history) => [...history.slice(0, historyCursor), turn]);
    setHistoryCursor(historyCursor + 1);
  }, [historyCursor]);

  const undo = useCallback(() => {
    if (historyCursor <= 0) return;
    const turn = moveHistory[historyCursor - 1];
    const inverted = inverseTurn(turn);
    setCube((current) => applyTurn(current, inverted));
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

  function scrambleCube() {
    const scramble = generateScramble(selectedCubeSize === '2x2' ? 10 : 20);
    setLastScramble(scramble);
    setMoveHistory(scramble);
    setHistoryCursor(scramble.length);
    setCube(applyAlgorithm(createSolvedCube(), scramble));
    setElapsed(null);
    setTimerStart(null);
    setLiveElapsed(0);
    setSolutionCursor(0);
  }

  function resetCube() {
    setCube(createSolvedCube());
    setMoveHistory([]);
    setHistoryCursor(0);
    setLastScramble([]);
    setElapsed(null);
    setTimerStart(null);
    setLiveElapsed(0);
    setSolutionCursor(0);
  }

  function startStopTimer() {
    if (timerStart) {
      setElapsed(Date.now() - timerStart);
      setTimerStart(null);
    } else {
      setElapsed(null);
      setLiveElapsed(0);
      setTimerStart(Date.now());
    }
  }

  function applyNextSolutionMove() {
    const nextTurn = remainingSolution[0];
    if (!nextTurn) return;
    applyMove(nextTurn);
  }

  function applyRemainingSolution() {
    if (!remainingSolution.length) return;
    for (const turn of remainingSolution) {
      applyMove(turn);
    }
  }

  function setScanSticker(face: ScanFace, index: number, color: FaceName) {
    setScan((current) => ({
      ...current,
      [face]: current[face].map((value, stickerIndex) => (stickerIndex === index ? color : value)),
    }));
  }

  function importVisibleFacesFromCube() {
    setScan({ U: [...grid.U], F: [...grid.F], R: [...grid.R] });
  }

  return (
    <section className="page-stack">
      <div className="play-header">
        <div>
          <p className="eyebrow">Play</p>
          <h1>Practise the cube.</h1>
          {stageInfo && <p className="skill-context">Reinforcing: {stageInfo.title}</p>}
        </div>
        <div className="game-mode-card">
          <span className="field-label">Game mode</span>
          <div className="segmented">
            {(['practice', 'guided', 'scan'] as GameMode[]).map((mode) => (
              <button key={mode} className={gameMode === mode ? 'active' : ''} onClick={() => setGameMode(mode)}>
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="game-layout">
        <aside className="panel game-sidebar">
          <span className="field-label">Cube size</span>
          <div className="segmented stacked-segmented">
            {CUBE_SIZES.map((cubeSize) => (
              <button
                key={cubeSize.id}
                className={selectedCubeSize === cubeSize.id ? 'active' : ''}
                onClick={() => {
                  setSelectedCubeSize(cubeSize.id);
                  setSelectedBand(BAND_SELECTIONS[0]);
                  resetCube();
                }}
              >
                {cubeSize.label}
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
              <strong>{isTiming ? formatTime(liveElapsed) : elapsed ? formatTime(elapsed) : 'ready'}</strong>
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

        <aside className="panel practice-panel">
          {gameMode !== 'scan' ? (
            <>
              <h2>{gameMode === 'guided' ? 'Guided practice' : 'Free practice'}</h2>
              <div className="algorithm-card">
                <span>Scramble</span>
                <code>{lastScramble.length ? formatAlgorithm(lastScramble) : 'Generate a scramble to begin.'}</code>
              </div>
              <div className="next-step-card">
                <span>Next move</span>
                <strong>{remainingSolution[0] ?? (solution.length ? 'done' : '—')}</strong>
                <button className="primary wide" onClick={applyNextSolutionMove} disabled={!remainingSolution.length}>
                  Apply next move
                </button>
                <button className="wide" onClick={applyRemainingSolution} disabled={!remainingSolution.length}>
                  Finish known solve
                </button>
              </div>
              <div className="game-score-panel">
                <div className="panel-header">
                  <h2>Scoring</h2>
                  <Award className="panel-icon" />
                </div>
                <div className="score-grid compact-score-grid">
                  <div className="score-card total-score">
                    <span>Completion score preview</span>
                    <strong>{gameScore.total} pts</strong>
                  </div>
                  {gameScore.breakdown.map((item) => (
                    <div className="score-card" key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.points > 0 ? `+${item.points}` : item.points}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="panel-header">
                <h2>Three-face assistant</h2>
                <Camera className="panel-icon" />
              </div>
              <p className="note">
                Capture or manually enter visible faces. This is a scan coach prototype — partial-state guidance with honest limitations.
              </p>
              <div className="palette">
                {FACE_NAMES.map((face) => (
                  <button
                    key={face}
                    className={selectedColor === face ? 'selected' : ''}
                    style={{ background: COLORS[face] }}
                    onClick={() => setSelectedColor(face)}
                    aria-label={`Select ${COLOR_LABELS[face]}`}
                  >
                    {face}
                  </button>
                ))}
              </div>
              <button className="wide" onClick={importVisibleFacesFromCube}>
                <Wand2 size={16} /> Import visible U/F/R from cube
              </button>
              <button className="wide" onClick={() => setScan(emptyPartialScan())}>
                Clear scan
              </button>
              <div className="confidence-card">
                <span>
                  {visibleKnown}/{visibleStickerTotal} visible stickers
                </span>
                <strong>{visibleCompleteness}% captured</strong>
                <div className="progress-bar">
                  <span style={{ width: `${visibleCompleteness}%` }} />
                </div>
              </div>
            </>
          )}
        </aside>
      </section>
      {gameMode === 'scan' && (
        <section className="panel scan-panel">
          <div className="scan-faces">
            {SCAN_FACES.map((face) => (
              <FaceEditor
                key={face}
                face={face}
                values={scan[face]}
                selectedColor={selectedColor}
                stickerIndices={visibleStickerIndices}
                onPick={(index, color) => setScanSticker(face, index, color)}
              />
            ))}
          </div>
          <ul className="scan-warnings">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
