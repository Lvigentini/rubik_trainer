import { Camera, CheckCircle2, Info, RotateCcw, Shuffle, Sparkles, Timer, Wand2 } from 'lucide-react';
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
  countKnownStickers,
  createSolvedCube,
  emptyPartialScan,
  formatAlgorithm,
  generateScramble,
  invertAlgorithm,
  scanCompleteness,
  scanWarnings,
  toFaceGrid,
} from './cube';

const MOVE_BUTTONS: Turn[] = ['U', "U'", 'R', "R'", 'F', "F'", 'D', "D'", 'L', "L'", 'B', "B'"];
const SCAN_FACES: ScanFace[] = ['U', 'F', 'R'];

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const mins = Math.floor(seconds / 60);
  return `${mins}:${(seconds % 60).toFixed(2).padStart(5, '0')}`;
}

function Cube3D({ grid, tilt }: { grid: Record<FaceName, FaceName[]>; tilt: { x: number; y: number } }) {
  return (
    <div className="cube-stage" aria-label="Interactive 3D cube preview">
      <div className="cube" style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
        {FACE_NAMES.map((face) => (
          <div key={face} className={`cube-face cube-face-${face.toLowerCase()}`}>
            {grid[face].map((color, index) => (
              <span key={`${face}-${index}`} className="sticker" style={{ background: COLORS[color] }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function FaceEditor({ face, values, selectedColor, onPick }: { face: ScanFace; values: PartialScan[ScanFace]; selectedColor: FaceName; onPick: (index: number, color: FaceName) => void }) {
  return (
    <div className="face-editor">
      <div className="face-editor-title">{face} face</div>
      <div className="face-grid">
        {values.map((value, index) => (
          <button
            key={`${face}-${index}`}
            className="scan-sticker"
            style={{ background: value ? COLORS[value] : 'rgba(255,255,255,0.12)' }}
            onClick={() => onPick(index, selectedColor)}
            aria-label={`Set ${face} sticker ${index + 1} to ${COLOR_LABELS[selectedColor]}`}
          >
            {!value ? '+' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}

function App() {
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

  const grid = useMemo(() => toFaceGrid(cube), [cube]);
  const solution = useMemo(() => invertAlgorithm(lastScramble), [lastScramble]);
  const remainingSolution = solution.slice(solutionCursor);
  const warnings = useMemo(() => scanWarnings(scan), [scan]);
  const known = countKnownStickers(scan);
  const completeness = scanCompleteness(scan);
  const isTiming = timerStart !== null;

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
    const scramble = generateScramble(20);
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

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Rubik Trainer Prototype</p>
          <h1>See the cube, understand the state, train the next moves.</h1>
          <p className="hero-copy">
            A web-first prototype for a future camera-assisted cube solver. Today it gives you a clean 3D cube,
            a real move engine, scramble practice, and a three-face scan workflow that is honest about uncertainty.
          </p>
        </div>
        <div className="hero-status">
          <CheckCircle2 size={18} /> Core prototype running
        </div>
      </section>

      <section className="workspace-grid">
        <section className="panel cube-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Manipulate</p>
              <h2>3D cube</h2>
            </div>
            <div className="tilt-controls">
              <button onClick={() => setTilt((value) => ({ ...value, y: value.y - 18 }))}>↶</button>
              <button onClick={() => setTilt({ x: -28, y: -38 })}>center</button>
              <button onClick={() => setTilt((value) => ({ ...value, y: value.y + 18 }))}>↷</button>
            </div>
          </div>
          <Cube3D grid={grid} tilt={tilt} />
          <div className="move-pad">
            {MOVE_BUTTONS.map((turn) => (
              <button key={turn} onClick={() => applyMove(turn)}>
                {turn}
              </button>
            ))}
          </div>
          <div className="action-row">
            <button className="primary" onClick={scrambleCube}>
              <Shuffle size={16} /> New scramble
            </button>
            <button onClick={resetCube}>
              <RotateCcw size={16} /> Reset
            </button>
            <button onClick={startStopTimer}>
              <Timer size={16} /> {isTiming ? 'Stop timer' : 'Start timer'}
            </button>
          </div>
        </section>

        <section className="panel trainer-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Core trainer</p>
              <h2>Scramble and solve guidance</h2>
            </div>
            <Sparkles className="panel-icon" />
          </div>
          <div className="metric-grid">
            <div className="metric-card">
              <span>Moves applied</span>
              <strong>{moveHistory.length}</strong>
            </div>
            <div className="metric-card">
              <span>Timer</span>
              <strong>{isTiming ? formatTime(liveElapsed) : elapsed ? formatTime(elapsed) : 'ready'}</strong>
            </div>
          </div>
          <div className="algorithm-card">
            <span>Current scramble</span>
            <code>{lastScramble.length ? formatAlgorithm(lastScramble) : 'Generate a scramble to start a known-state session.'}</code>
          </div>
          <div className="algorithm-card solution">
            <span>Known-state solution</span>
            <code>{remainingSolution.length ? formatAlgorithm(remainingSolution) : solution.length ? 'Solved via the known-state path.' : 'Available when the app generated the scramble.'}</code>
          </div>
          <div className="next-step-card">
            <span>Next best move</span>
            <strong>{remainingSolution[0] ?? (solution.length ? 'done' : '—')}</strong>
            <div className="action-row">
              <button className="primary" onClick={applyNextSolutionMove} disabled={!remainingSolution.length}>
                Apply next move
              </button>
              <button onClick={applyRemainingSolution} disabled={!remainingSolution.length}>
                Finish known solve
              </button>
            </div>
          </div>
          <p className="note">
            This is the reliable prototype path: if the app knows the scramble/history, it can produce a deterministic
            solution sequence. The camera path needs state reconstruction before it can do the same.
          </p>
        </section>
      </section>

      <section className="panel scan-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Three-face assistant</p>
            <h2>Scan / enter visible faces</h2>
          </div>
          <Camera className="panel-icon" />
        </div>
        <div className="scan-layout">
          <div className="scan-controls">
            <p>
              Prototype camera substitute: pick a color and tap stickers for the three visible faces. Later, this panel
              becomes the image capture + color classifier.
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
            <div className="action-row stacked">
              <button onClick={importVisibleFacesFromCube}>
                <Wand2 size={16} /> Import visible U/F/R from cube
              </button>
              <button onClick={() => setScan(emptyPartialScan())}>Clear scan</button>
            </div>
            <div className="confidence-card">
              <div>
                <span>{known}/27 visible stickers</span>
                <strong>{completeness}% captured</strong>
              </div>
              <div className="progress-bar">
                <span style={{ width: `${completeness}%` }} />
              </div>
            </div>
          </div>
          <div className="scan-faces">
            {SCAN_FACES.map((face) => (
              <FaceEditor key={face} face={face} values={scan[face]} selectedColor={selectedColor} onPick={(index, color) => setScanSticker(face, index, color)} />
            ))}
          </div>
        </div>
        <div className="guidance-box">
          <div className="guidance-title">
            <Info size={18} /> Guidance
          </div>
          <ul>
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
            {known === 27 && <li>Visible faces are complete. Next prototype step: capture hidden faces or match against a known scramble session.</li>}
          </ul>
        </div>
      </section>
    </main>
  );
}

export default App;
