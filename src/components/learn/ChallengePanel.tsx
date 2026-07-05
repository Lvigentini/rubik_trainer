import { useEffect, useMemo, useRef, useState } from 'react';
import {
  applyAlgorithm,
  applyTurn,
  createSolvedCube,
  formatAlgorithm,
  inverseTurn,
  toFaceGrid,
  type FaceName,
  type Turn,
} from '../../cube';
import { CHALLENGES, demoAlgorithm, isGoalMet } from '../../challenges';
import type { LearningStage } from '../../learningPath';
import { FACE_LAYER_WORD, layerForSticker, type LayerId } from '../cube/bands';
import { CubeHelp } from '../cube/CubeHelp';
import { CubeView } from '../cube/CubeView';
import { FacePicker, TurnRail, ViewControls } from '../cube/TurnControls';
import { useCubeTilt } from '../cube/useCubeTilt';

type Props = {
  stage: LearningStage;
  hintLevel: 0 | 1 | 2 | 3;
  onGoalMet: () => void;
};

const DIRECTION_WORD: Record<'' | "'" | '2', string> = {
  '': 'clockwise',
  "'": 'counter-clockwise',
  '2': 'a half turn',
};

const DIRECTION_GLYPH: Record<'' | "'" | '2', string> = { '': '⟳', "'": '⟲', '2': '2×' };

function splitTurn(turn: Turn): { face: FaceName; suffix: '' | "'" | '2' } {
  const face = turn[0] as FaceName;
  const suffix = turn.slice(1) as '' | "'" | '2';
  return { face, suffix };
}

/** How to grab each face layer by tapping a tile, under the "tile selects
 * its column, tap again for its row" rule: U/D are rows, L/R are columns,
 * and F/B are the rows/columns hugging the front/back edge of adjacent faces. */
const FACE_TILE_HINT: Record<FaceName, string> = {
  U: 'top-row tile',
  D: 'bottom-row tile',
  L: 'left-column tile',
  R: 'right-column tile',
  F: 'front-edge tile',
  B: 'back-edge tile',
};

/** "select the top layer (the Top chip, or tap a top-row tile), then press ⟳"
 * — the words behind a bare "U". */
function describeMove(turn: Turn): string {
  const { face, suffix } = splitTurn(turn);
  const word = FACE_LAYER_WORD[face];
  const chip = word.charAt(0).toUpperCase() + word.slice(1);
  return `select the ${word} layer (the ${chip} chip, or tap a ${FACE_TILE_HINT[face]}), then press ${DIRECTION_GLYPH[suffix]}`;
}

/** "right layer, counter-clockwise" — the words behind a bare "R′", for the
 * state-goal demo stepper (hint level 3). */
function describeMoveWords(turn: Turn): string {
  const { face, suffix } = splitTurn(turn);
  return `${FACE_LAYER_WORD[face]} layer, ${DIRECTION_WORD[suffix]}`;
}

export function ChallengePanel({ stage, hintLevel, onGoalMet }: Props) {
  const challenge = CHALLENGES[stage.id];
  const isSequence = challenge.goal === 'sequence';
  const target = useMemo(() => challenge.targetMoves ?? [], [challenge]);
  const demo = useMemo(
    () => (isSequence ? target : demoAlgorithm(challenge)),
    [challenge, isSequence, target],
  );

  const [cube, setCube] = useState(() => applyAlgorithm(createSolvedCube(), challenge.setup));
  const [matched, setMatched] = useState(0);
  const [wrongTurn, setWrongTurn] = useState<Turn | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<LayerId | null>(null);
  const [demoCursor, setDemoCursor] = useState<number | null>(null);
  const firedRef = useRef(false);
  const revertTimerRef = useRef<number | null>(null);
  const { tilt, rotateView, rotateViewVertical, dragRotate, resetView } = useCubeTilt();

  const stateGoalMet = !isSequence && isGoalMet(challenge.goal as Exclude<typeof challenge.goal, 'sequence'>, cube);
  const goalMet = isSequence ? matched === target.length && target.length > 0 : stateGoalMet;

  useEffect(() => {
    if (goalMet && !firedRef.current) {
      firedRef.current = true;
      onGoalMet();
    }
  }, [goalMet, onGoalMet]);

  // Revert timer is scheduled from the click handler (applyMove), never from
  // an effect reacting to state — this only clears a leftover timer if the
  // component unmounts mid-revert.
  useEffect(() => {
    return () => {
      if (revertTimerRef.current !== null) window.clearTimeout(revertTimerRef.current);
    };
  }, []);

  function clearPendingRevert() {
    if (revertTimerRef.current !== null) {
      window.clearTimeout(revertTimerRef.current);
      revertTimerRef.current = null;
    }
  }

  function applyMove(turn: Turn, viaDemo = false) {
    setCube((current) => applyTurn(current, turn));
    if (isSequence && !goalMet) {
      const expected = target[matched];
      if (turn === expected) {
        setMatched((count) => count + 1);
        setWrongTurn(null);
      } else if (!viaDemo) {
        // Wrong move: apply it (already done above), keep progress exactly
        // where it was, then auto-revert shortly after so the learner sees
        // what they pressed before it undoes itself.
        clearPendingRevert();
        setWrongTurn(turn);
        revertTimerRef.current = window.setTimeout(() => {
          setCube((current) => applyTurn(current, inverseTurn(turn)));
          setWrongTurn(null);
          revertTimerRef.current = null;
        }, 300);
      }
    }
    if (!viaDemo) setDemoCursor(null);
  }

  function selectSticker(face: FaceName, index: number) {
    setSelectedLayer((previous) => layerForSticker(face, index, stage.cubeSize, previous));
  }

  function reset() {
    clearPendingRevert();
    setCube(applyAlgorithm(createSolvedCube(), challenge.setup));
    setMatched(0);
    setWrongTurn(null);
    setDemoCursor(null);
    firedRef.current = false;
  }

  function startDemo() {
    reset();
    setDemoCursor(0);
  }

  function stepDemo() {
    if (demoCursor === null || demoCursor >= demo.length) return;
    applyMove(demo[demoCursor], true);
    setDemoCursor(demoCursor + 1);
  }

  const grid = useMemo(() => toFaceGrid(cube), [cube]);
  const nextExpected = isSequence ? target[matched] : undefined;

  return (
    <section className={`challenge-panel${goalMet ? ' goal-met' : ''}`} data-testid="challenge-panel">
      <header className="challenge-header">
        <p className="eyebrow">Try it first</p>
        <p className="challenge-goal-text">{challenge.goalText}</p>
      </header>

      <div className="challenge-cube">
        <div className="cube-area">
          <TurnRail selectedLayer={selectedLayer} onTurn={(turn) => applyMove(turn)} />
          <div className="cube-stage-shell">
            <CubeHelp />
            <ViewControls
              onRotateView={rotateView}
              onRotateViewVertical={rotateViewVertical}
              onResetView={resetView}
            />
            <CubeView
              grid={grid}
              tilt={tilt}
              cubeSize={stage.cubeSize}
              selectedLayer={selectedLayer}
              onSelectLayer={setSelectedLayer}
              onSelectSticker={selectSticker}
              onDragRotate={dragRotate}
            />
          </div>
        </div>
        <FacePicker cubeSize={stage.cubeSize} selectedLayer={selectedLayer} onSelectLayer={setSelectedLayer} />
      </div>

      {isSequence && target.length > 0 && !goalMet && (
        <div className="sequence-coach" data-testid="sequence-coach">
          <ol className="sequence-chips">
            {target.map((turn, i) => (
              <li
                key={`${turn}-${i}`}
                className={`sequence-chip ${i < matched ? 'done' : i === matched ? 'active' : 'pending'}`}
              >
                {i < matched ? '✓' : formatAlgorithm([turn])}
              </li>
            ))}
          </ol>
          <p className={`coach-line${wrongTurn ? ' coach-line-wrong' : ''}`} role="status">
            {wrongTurn
              ? `That was ${formatAlgorithm([wrongTurn])} — we need ${formatAlgorithm([nextExpected as Turn])} next.`
              : `Next: ${formatAlgorithm([nextExpected as Turn])} — ${describeMove(nextExpected as Turn)}`}
          </p>
        </div>
      )}

      {!isSequence && (
        <p className="coach-line" data-testid="state-coach-line">
          Goal: {challenge.goalText}
        </p>
      )}

      <div className="challenge-status" role="status">
        {goalMet && <strong>Challenge complete — now lock it in below.</strong>}
        {!goalMet && !isSequence && <span>Keep going — the goal check updates after every move.</span>}
      </div>

      <div className="challenge-actions">
        <button onClick={reset}>Reset challenge</button>
        {hintLevel >= 3 && (
          <>
            <button onClick={startDemo}>Reset &amp; watch</button>
            {demoCursor !== null && demoCursor < demo.length && (
              <div className="demo-step">
                <button className="primary" onClick={stepDemo}>
                  Next move ({formatAlgorithm([demo[demoCursor]])})
                </button>
                {!isSequence && (
                  <p className="demo-words-hint">
                    Next move: {formatAlgorithm([demo[demoCursor]])} — {describeMoveWords(demo[demoCursor])}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
