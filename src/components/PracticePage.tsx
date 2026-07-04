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

const SCAN_FACES: ScanFace[] = ['U', 'F', 'R'];
const STICKER_INDICES_BY_SIZE: Record<CubeSizeId, number[]> = {
  '2x2': [0, 2, 6, 8],
  '3x3': [0, 1, 2, 3, 4, 5, 6, 7, 8],
};

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

type BandTurn = 'U' | 'E' | 'D' | 'L' | 'M' | 'R' | 'F' | 'S' | 'B';
type BandSelection = {
  id: string;
  label: string;
  description: string;
  turn: BandTurn;
  requires3x3?: boolean;
};

const BAND_SELECTIONS: BandSelection[] = [
  { id: 'top-row', label: 'Top row', description: 'Grab the upper horizontal layer', turn: 'U' },
  { id: 'middle-row', label: 'Middle row', description: 'Grab the equator row through the cube', turn: 'E', requires3x3: true },
  { id: 'bottom-row', label: 'Bottom row', description: 'Grab the lower horizontal layer', turn: 'D' },
  { id: 'left-column', label: 'Left column', description: 'Grab the left vertical layer', turn: 'L' },
  { id: 'middle-column', label: 'Middle column', description: 'Grab the centre vertical slice', turn: 'M', requires3x3: true },
  { id: 'right-column', label: 'Right column', description: 'Grab the right vertical layer', turn: 'R' },
  { id: 'front-layer', label: 'Front layer', description: 'Twist the face nearest you', turn: 'F' },
  { id: 'standing-slice', label: 'Standing slice', description: 'Twist the slice behind the front face', turn: 'S', requires3x3: true },
  { id: 'back-layer', label: 'Back layer', description: 'Twist the far back face', turn: 'B' },
];

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const mins = Math.floor(seconds / 60);
  return `${mins}:${(seconds % 60).toFixed(2).padStart(5, '0')}`;
}

function getTurnForBand(band: BandSelection, suffix: '' | "'" | '2'): Turn {
  return `${band.turn}${suffix || ''}` as Turn;
}

function bandStickerIndices(bandId: string, cubeSize: CubeSizeId): Set<number> {
  const is3x3 = cubeSize === '3x3';
  if (bandId === 'top-row') return new Set(is3x3 ? [0, 1, 2] : [0, 2]);
  if (bandId === 'middle-row') return new Set([3, 4, 5]);
  if (bandId === 'bottom-row') return new Set(is3x3 ? [6, 7, 8] : [6, 8]);
  if (bandId === 'left-column') return new Set(is3x3 ? [0, 3, 6] : [0, 6]);
  if (bandId === 'middle-column') return new Set([1, 4, 7]);
  if (bandId === 'right-column') return new Set(is3x3 ? [2, 5, 8] : [2, 8]);
  if (bandId === 'front-layer') return new Set(is3x3 ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : [0, 2, 6, 8]);
  return new Set();
}

function Cube3D({
  grid,
  tilt,
  cubeSize,
  selectedBand,
  onSelectBand,
  onTurn,
}: {
  grid: Record<FaceName, FaceName[]>;
  tilt: { x: number; y: number };
  cubeSize: CubeSizeId;
  selectedBand?: BandSelection;
  onSelectBand?: (band: BandSelection) => void;
  onTurn?: (turn: Turn) => void;
}) {
  const stickerIndices = STICKER_INDICES_BY_SIZE[cubeSize];
  const gridClass = cubeSize === '2x2' ? 'cube-size-2x2' : 'cube-size-3x3';
  const highlighted = selectedBand ? bandStickerIndices(selectedBand.id, cubeSize) : new Set<number>();
  const is3x3 = cubeSize === '3x3';

  const handleStickerClick = (band: BandSelection, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectBand?.(band);
  };

  const handleRotateClick = (turn: Turn, e: React.MouseEvent) => {
    e.stopPropagation();
    onTurn?.(turn);
  };

  return (
    <div
      className="cube-stage"
      aria-label={`Interactive ${cubeSize.replace('x', '×')} cube preview`}
      data-cube-size={cubeSize}
    >
      <div className="cube" style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
        {FACE_NAMES.map((face) => (
          <div
            key={face}
            className={`cube-face cube-face-${face.toLowerCase()} ${gridClass} ${face === 'F' && selectedBand?.id === 'front-layer' ? 'selected-face' : ''}`}
            aria-label={`${face} face preview`}
          >
            {stickerIndices.map((stickerIndex) => {
              const color = grid[face][stickerIndex];
              const isHighlighted = face === 'F' && highlighted.has(stickerIndex);
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
      {onSelectBand && (
        <div className="cube-layer-grabbers" aria-label="Select layer by clicking rows or columns on the front face">
          {(['top-row', 'middle-row', 'bottom-row'] as const)
            .filter((id) => is3x3 || id !== 'middle-row')
            .map((id) => {
              const band = BAND_SELECTIONS.find((b) => b.id === id)!;
              return (
                <button
                  key={id}
                  className={`layer-grabber row-grabber ${id} ${selectedBand?.id === id ? 'selected' : ''}`}
                  aria-label={band.label}
                  title={band.description}
                  onClick={(e) => handleStickerClick(band, e)}
                />
              );
            })}
          {(['left-column', 'middle-column', 'right-column'] as const)
            .filter((id) => is3x3 || id !== 'middle-column')
            .map((id) => {
              const band = BAND_SELECTIONS.find((b) => b.id === id)!;
              return (
                <button
                  key={id}
                  className={`layer-grabber col-grabber ${id} ${selectedBand?.id === id ? 'selected' : ''}`}
                  aria-label={band.label}
                  title={band.description}
                  onClick={(e) => handleStickerClick(band, e)}
                />
              );
            })}
        </div>
      )}
      {onTurn && selectedBand && (
        <div className="cube-rotate-arrows" aria-label="Rotate selected layer">
          <button
            className="cube-arrow cube-arrow-cw"
            aria-label="Turn selected layer clockwise"
            onClick={(e) => handleRotateClick(getTurnForBand(selectedBand, ''), e)}
          >
            ↻
          </button>
          <button
            className="cube-arrow cube-arrow-ccw"
            aria-label="Turn selected layer counter-clockwise"
            onClick={(e) => handleRotateClick(getTurnForBand(selectedBand, "'"), e)}
          >
            ↺
          </button>
          <button
            className="cube-arrow cube-arrow-2"
            aria-label="Turn selected layer 180 degrees"
            onClick={(e) => handleRotateClick(getTurnForBand(selectedBand, '2'), e)}
          >
            2
          </button>
        </div>
      )}
    </div>
  );
}
function BandReferenceBar({
  cubeSize,
  selectedBand,
  onSelectBand,
  onTurn,
}: {
  cubeSize: CubeSizeId;
  selectedBand: BandSelection;
  onSelectBand: (band: BandSelection) => void;
  onTurn: (turn: Turn) => void;
}) {
  const is3x3 = cubeSize === '3x3';
  const visible = BAND_SELECTIONS.filter((band) => is3x3 || !band.requires3x3);
  return (
    <div className="band-reference-bar" data-testid="band-reference-bar">
      <div className="band-reference-labels">
        {visible.map((band) => (
          <button
            key={band.id}
            className={selectedBand.id === band.id ? 'selected' : ''}
            onClick={() => onSelectBand(band)}
            aria-label={band.label}
            title={`${band.label} (${band.turn})`}
          >
            <span>{band.turn}</span>
          </button>
        ))}
      </div>
      <div className="band-reference-arrows">
        <button aria-label="Turn selected layer clockwise" onClick={() => onTurn(getTurnForBand(selectedBand, ''))}>
          ↻
        </button>
        <button aria-label="Turn selected layer counter-clockwise" onClick={() => onTurn(getTurnForBand(selectedBand, "'"))}>
          ↺
        </button>
        <button aria-label="Turn selected layer 180 degrees" onClick={() => onTurn(getTurnForBand(selectedBand, '2'))}>
          2
        </button>
      </div>
    </div>
  );
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
          <Cube3D
            grid={grid}
            tilt={tilt}
            cubeSize={selectedCubeSize}
            selectedBand={selectedBand}
            onSelectBand={setSelectedBand}
            onTurn={applyMove}
          />

          <BandReferenceBar
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
