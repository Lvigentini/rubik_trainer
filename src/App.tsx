import { Award, BookOpen, Camera, Gamepad2, GraduationCap, Home, RotateCcw, Shuffle, Timer, Wand2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import './styles.css';
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
  invertAlgorithm,
  scanWarnings,
  toFaceGrid,
} from './cube';
import { GUIDE_SECTIONS } from './guides';
import { APPROACHES, CUBE_SIZES, type ApproachId, type CubeSizeId, calculateLessonScore, getLessonsFor, nextRecommendedLesson } from './trainer';

const MOVE_BUTTONS: Turn[] = ['U', "U'", 'R', "R'", 'F', "F'", 'D', "D'", 'L', "L'", 'B', "B'"];
const SCAN_FACES: ScanFace[] = ['U', 'F', 'R'];
const COMPLETED_DEMO_LESSON_IDS = ['2x2-orientation'];
const STICKER_INDICES_BY_SIZE: Record<CubeSizeId, number[]> = {
  '2x2': [0, 2, 6, 8],
  '3x3': [0, 1, 2, 3, 4, 5, 6, 7, 8],
};
type Page = 'home' | 'learn' | 'play';
type GameMode = 'practice' | 'guided' | 'scan';

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const mins = Math.floor(seconds / 60);
  return `${mins}:${(seconds % 60).toFixed(2).padStart(5, '0')}`;
}

function Cube3D({ grid, tilt, cubeSize, compact = false }: { grid: Record<FaceName, FaceName[]>; tilt: { x: number; y: number }; cubeSize: CubeSizeId; compact?: boolean }) {
  const stickerIndices = STICKER_INDICES_BY_SIZE[cubeSize];

  return (
    <div className={compact ? 'cube-stage compact' : 'cube-stage'} aria-label={`Interactive ${cubeSize.replace('x', '×')} cube preview`} data-cube-size={cubeSize}>
      <div className="cube" style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
        {FACE_NAMES.map((face) => (
          <div key={face} className={`cube-face cube-face-${face.toLowerCase()} cube-size-${cubeSize}`}>
            {stickerIndices.map((stickerIndex) => (
              <span key={`${face}-${stickerIndex}`} className="sticker" data-testid="cube-sticker" style={{ background: COLORS[grid[face][stickerIndex]] }} />
            ))}
          </div>
        ))}
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
      <div className={`face-grid face-grid-${stickerIndices.length}`}>
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

function App() {
  const [page, setPage] = useState<Page>('home');
  const [cube, setCube] = useState(() => createSolvedCube());
  const [moveHistory, setMoveHistory] = useState<Turn[]>([]);
  const [lastScramble, setLastScramble] = useState<Turn[]>([]);
  const [tilt, setTilt] = useState({ x: -28, y: -38 });
  const [selectedColor, setSelectedColor] = useState<FaceName>('U');
  const [scan, setScan] = useState<PartialScan>(() => emptyPartialScan());
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [liveElapsed, setLiveElapsed] = useState(0);
  const [solutionCursor, setSolutionCursor] = useState(0);
  const [selectedCubeSize, setSelectedCubeSize] = useState<CubeSizeId>('2x2');
  const [selectedApproach, setSelectedApproach] = useState<ApproachId>('guided-beginner');
  const [gameMode, setGameMode] = useState<GameMode>('practice');

  const grid = useMemo(() => toFaceGrid(cube), [cube]);
  const solution = useMemo(() => invertAlgorithm(lastScramble), [lastScramble]);
  const remainingSolution = solution.slice(solutionCursor);
  const warnings = useMemo(() => scanWarnings(scan), [scan]);

  const isTiming = timerStart !== null;
  const lessons = useMemo(() => getLessonsFor(selectedCubeSize, selectedApproach), [selectedCubeSize, selectedApproach]);
  const recommendedLesson = useMemo(
    () => nextRecommendedLesson(selectedCubeSize, selectedApproach, COMPLETED_DEMO_LESSON_IDS),
    [selectedCubeSize, selectedApproach],
  );
  const selectedCube = CUBE_SIZES.find((cubeSize) => cubeSize.id === selectedCubeSize) ?? CUBE_SIZES[0];
  const selectedApproachInfo = APPROACHES.find((approach) => approach.id === selectedApproach) ?? APPROACHES[0];
  const visibleStickerIndices = STICKER_INDICES_BY_SIZE[selectedCubeSize];
  const visibleStickerTotal = visibleStickerIndices.length * SCAN_FACES.length;
  const visibleKnown = SCAN_FACES.reduce(
    (total, face) => total + visibleStickerIndices.filter((index) => scan[face][index]).length,
    0,
  );
  const visibleCompleteness = Math.round((visibleKnown / visibleStickerTotal) * 100);
  const gameScore = calculateLessonScore({
    completed: true,
    optimalMoves: recommendedLesson?.parMoves || 10,
    actualMoves: Math.max(recommendedLesson?.parMoves || 10, moveHistory.length || recommendedLesson?.parMoves || 10),
    elapsedSeconds: elapsed ? elapsed / 1000 : Math.round((recommendedLesson?.targetSeconds ?? 90) * 0.8),
    targetSeconds: recommendedLesson?.targetSeconds ?? 90,
    hintsUsed: 0,
    mistakes: 0,
    streak: 2,
  });

  useEffect(() => {
    if (!timerStart) return undefined;
    const interval = window.setInterval(() => setLiveElapsed(Date.now() - timerStart), 100);
    return () => window.clearInterval(interval);
  }, [timerStart]);

  function applyMove(turn: Turn) {
    setCube((current) => applyTurn(current, turn));
    setMoveHistory((history) => [...history, turn]);
    setSolutionCursor((cursor) => (solution[cursor] === turn ? cursor + 1 : cursor));
  }

  function scrambleCube() {
    const scramble = generateScramble(selectedCubeSize === '2x2' ? 10 : 20);
    setLastScramble(scramble);
    setMoveHistory(scramble);
    setCube(applyAlgorithm(createSolvedCube(), scramble));
    setElapsed(null);
    setTimerStart(null);
    setLiveElapsed(0);
    setSolutionCursor(0);
  }

  function resetCube() {
    setCube(createSolvedCube());
    setMoveHistory([]);
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
    setCube((current) => applyTurn(current, nextTurn));
    setMoveHistory((history) => [...history, nextTurn]);
    setSolutionCursor((cursor) => cursor + 1);
  }

  function applyRemainingSolution() {
    if (!remainingSolution.length) return;
    setCube((current) => applyAlgorithm(current, remainingSolution));
    setMoveHistory((history) => [...history, ...remainingSolution]);
    setSolutionCursor(solution.length);
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

  function renderNav() {
    return (
      <header className="topbar">
        <button className="brand" onClick={() => setPage('home')}>Rubik Trainer <span>v0.1.2</span></button>
        <nav aria-label="Primary navigation">
          <button className={page === 'home' ? 'active' : ''} onClick={() => setPage('home')}><Home size={16} /> Home</button>
          <button className={page === 'learn' ? 'active' : ''} onClick={() => setPage('learn')}><BookOpen size={16} /> Learn</button>
          <button className={page === 'play' ? 'active' : ''} onClick={() => setPage('play')}><Gamepad2 size={16} /> Play</button>
        </nav>
      </header>
    );
  }

  function renderHomePage() {
    return (
      <section className="home-page">
        <div className="home-copy">
          <p className="eyebrow">Web cube trainer</p>
          <h1>Practice cube solving with structure.</h1>
          <p>
            A quiet trainer for learning cube notation, building intuition on 2×2 first, and then practising 3×3 strategies with scoring.
          </p>
          <div className="home-actions">
            <button className="primary" onClick={() => setPage('play')}>Start playing</button>
            <button onClick={() => setPage('learn')}>Read the guide</button>
          </div>
        </div>
        <div className="home-cube-card">
          <Cube3D grid={grid} tilt={{ x: -24, y: -34 }} cubeSize={selectedCubeSize} compact />
          <div className="home-stats">
            <span>Start: 2×2</span>
            <span>Next: 3×3</span>
            <span>Modes: practice · guided · scan</span>
          </div>
        </div>
      </section>
    );
  }

  function renderLearnPage() {
    return (
      <section className="page-stack">
        <div className="page-heading">
          <p className="eyebrow">Guide</p>
          <h1>Learn the cube in stages.</h1>
          <p>Training material lives here so the game surface can stay clean.</p>
        </div>
        <section className="panel learning-panel">
          <div className="learning-grid">
            <div className="learning-column">
              <span className="field-label">Cube size</span>
              <div className="choice-stack">
                {CUBE_SIZES.map((cubeSize) => (
                  <button key={cubeSize.id} className={`choice-card ${selectedCubeSize === cubeSize.id ? 'selected' : ''}`} onClick={() => setSelectedCubeSize(cubeSize.id)}>
                    <strong>{cubeSize.label}</strong>
                    <span>{cubeSize.whyFirst}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="learning-column">
              <span className="field-label">Approach</span>
              <div className="choice-stack">
                {APPROACHES.map((approach) => (
                  <button key={approach.id} className={`choice-card ${selectedApproach === approach.id ? 'selected' : ''}`} onClick={() => setSelectedApproach(approach.id)}>
                    <strong>{approach.title}</strong>
                    <span>{approach.bestFor}</span>
                    <em>{approach.tradeoff}</em>
                  </button>
                ))}
              </div>
            </div>
            <div className="lesson-focus-card">
              <span className="field-label">Current focus</span>
              <h2>{recommendedLesson?.title ?? `${selectedCube.label} ${selectedApproachInfo.title}`}</h2>
              <p>{recommendedLesson?.objective ?? 'All lessons in this path are complete. Switch approach or cube size for the next challenge.'}</p>
              {recommendedLesson && (
                <>
                  <div className="lesson-meta">
                    <span>Level {recommendedLesson.level}</span>
                    <span>Par {recommendedLesson.parMoves || 'recognition'} moves</span>
                    <span>Target {recommendedLesson.targetSeconds}s</span>
                  </div>
                  <div className="strategy-box">
                    <strong>Strategy</strong>
                    <p>{recommendedLesson.strategy}</p>
                    <strong>Drill</strong>
                    <p>{recommendedLesson.drill}</p>
                  </div>
                  <ul className="criteria-list">
                    {recommendedLesson.successCriteria.map((criterion) => <li key={criterion}>{criterion}</li>)}
                  </ul>
                </>
              )}
            </div>
          </div>
        </section>
        <section className="split-panels guide-panels">
          <div className="panel guide-content-panel">
            <div className="panel-header"><h2>Solving guides</h2><BookOpen className="panel-icon" /></div>
            <div className="guide-section-grid">
              {GUIDE_SECTIONS.map((section) => (
                <article className="guide-section-card" key={section.title}>
                  <h3>{section.title}</h3>
                  <p>{section.summary}</p>
                  <ol>
                    {section.steps.map((step) => <li key={step}>{step}</li>)}
                  </ol>
                  <div className="practice-prompt"><strong>Practice</strong><span>{section.practicePrompt}</span></div>
                </article>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="panel-header"><h2>Lesson path</h2><GraduationCap className="panel-icon" /></div>
            <div className="lesson-strip vertical">
              {lessons.map((lesson) => (
                <article key={lesson.id} className={lesson.id === recommendedLesson?.id ? 'active lesson-chip' : 'lesson-chip'}>
                  <span>Level {lesson.level}</span>
                  <strong>{lesson.title}</strong>
                  <small>{lesson.scoringFocus.join(' · ')}</small>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>
    );
  }

  function renderPlayPage() {
    return (
      <section className="page-stack">
        <div className="play-header">
          <div>
            <p className="eyebrow">Game</p>
            <h1>Play and practise.</h1>
          </div>
          <div className="game-mode-card">
            <span className="field-label">Game mode</span>
            <div className="segmented">
              {(['practice', 'guided', 'scan'] as GameMode[]).map((mode) => <button key={mode} className={gameMode === mode ? 'active' : ''} onClick={() => setGameMode(mode)}>{mode}</button>)}
            </div>
          </div>
        </div>
        <section className="game-layout">
          <aside className="panel game-sidebar">
            <span className="field-label">Cube size</span>
            <div className="segmented stacked-segmented">
              {CUBE_SIZES.map((cubeSize) => <button key={cubeSize.id} className={selectedCubeSize === cubeSize.id ? 'active' : ''} onClick={() => setSelectedCubeSize(cubeSize.id)}>{cubeSize.label}</button>)}
            </div>
            <div className="mini-metrics">
              <div><span>Moves</span><strong>{moveHistory.length}</strong></div>
              <div><span>Timer</span><strong>{isTiming ? formatTime(liveElapsed) : elapsed ? formatTime(elapsed) : 'ready'}</strong></div>
            </div>
            <button className="primary wide" onClick={scrambleCube}><Shuffle size={16} /> New scramble</button>
            <button className="wide" onClick={startStopTimer}><Timer size={16} /> {isTiming ? 'Stop timer' : 'Start timer'}</button>
            <button className="wide" onClick={resetCube}><RotateCcw size={16} /> Reset</button>
          </aside>
          <section className="panel cube-panel game-cube-panel">
            <div className="panel-header">
              <h2>3D cube</h2>
              <div className="tilt-controls">
                <button onClick={() => setTilt((value) => ({ ...value, y: value.y - 18 }))}>↶</button>
                <button onClick={() => setTilt({ x: -28, y: -38 })}>center</button>
                <button onClick={() => setTilt((value) => ({ ...value, y: value.y + 18 }))}>↷</button>
              </div>
            </div>
            <Cube3D grid={grid} tilt={tilt} cubeSize={selectedCubeSize} />
            <div className="move-pad">{MOVE_BUTTONS.map((turn) => <button key={turn} onClick={() => applyMove(turn)}>{turn}</button>)}</div>
          </section>
          <aside className="panel practice-panel">
            {gameMode !== 'scan' ? (
              <>
                <h2>{gameMode === 'guided' ? 'Guided practice' : 'Free practice'}</h2>
                <div className="algorithm-card"><span>Scramble</span><code>{lastScramble.length ? formatAlgorithm(lastScramble) : 'Generate a scramble to begin.'}</code></div>
                <div className="next-step-card">
                  <span>Next move</span>
                  <strong>{remainingSolution[0] ?? (solution.length ? 'done' : '—')}</strong>
                  <button className="primary wide" onClick={applyNextSolutionMove} disabled={!remainingSolution.length}>Apply next move</button>
                  <button className="wide" onClick={applyRemainingSolution} disabled={!remainingSolution.length}>Finish known solve</button>
                </div>
                <div className="game-score-panel">
                  <div className="panel-header"><h2>Scoring</h2><Award className="panel-icon" /></div>
                  <div className="score-grid compact-score-grid">
                    <div className="score-card total-score"><span>Completion score preview</span><strong>{gameScore.total} pts</strong></div>
                    {gameScore.breakdown.map((item) => <div className="score-card" key={item.label}><span>{item.label}</span><strong>{item.points > 0 ? `+${item.points}` : item.points}</strong></div>)}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="panel-header"><h2>Three-face assistant</h2><Camera className="panel-icon" /></div>
                <p className="note">Capture or manually enter visible faces. Exact arbitrary solving still needs enough observations to reconstruct the hidden state.</p>
                <div className="palette">{FACE_NAMES.map((face) => <button key={face} className={selectedColor === face ? 'selected' : ''} style={{ background: COLORS[face] }} onClick={() => setSelectedColor(face)} aria-label={`Select ${COLOR_LABELS[face]}`}>{face}</button>)}</div>
                <button className="wide" onClick={importVisibleFacesFromCube}><Wand2 size={16} /> Import visible U/F/R from cube</button>
                <button className="wide" onClick={() => setScan(emptyPartialScan())}>Clear scan</button>
                <div className="confidence-card"><span>{visibleKnown}/{visibleStickerTotal} visible stickers</span><strong>{visibleCompleteness}% captured</strong><div className="progress-bar"><span style={{ width: `${visibleCompleteness}%` }} /></div></div>
              </>
            )}
          </aside>
        </section>
        {gameMode === 'scan' && (
          <section className="panel scan-panel">
            <div className="scan-faces">{SCAN_FACES.map((face) => <FaceEditor key={face} face={face} values={scan[face]} selectedColor={selectedColor} stickerIndices={visibleStickerIndices} onPick={(index, color) => setScanSticker(face, index, color)} />)}</div>
            <ul className="scan-warnings">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
          </section>
        )}
      </section>
    );
  }

  return (
    <main className="app-shell">
      {renderNav()}
      {page === 'home' && renderHomePage()}
      {page === 'learn' && renderLearnPage()}
      {page === 'play' && renderPlayPage()}
    </main>
  );
}

export default App;
