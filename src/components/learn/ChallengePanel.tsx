import { useEffect, useMemo, useRef, useState } from 'react';
import {
  applyAlgorithm,
  applyTurn,
  createSolvedCube,
  formatAlgorithm,
  toFaceGrid,
  type Turn,
} from '../../cube';
import { CHALLENGES, demoAlgorithm, isGoalMet } from '../../challenges';
import type { LearningStage } from '../../learningPath';
import { BAND_SELECTIONS, type BandSelection } from '../cube/bands';
import { BandControls } from '../cube/BandControls';
import { CubeView } from '../cube/CubeView';

type Props = {
  stage: LearningStage;
  hintLevel: 0 | 1 | 2 | 3;
  onGoalMet: () => void;
};

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
  const [selectedBand, setSelectedBand] = useState<BandSelection>(BAND_SELECTIONS[0]);
  const [demoCursor, setDemoCursor] = useState<number | null>(null);
  const firedRef = useRef(false);

  const stateGoalMet = !isSequence && challenge.goal !== 'sequence' && isGoalMet(challenge.goal, cube);
  const goalMet = isSequence ? matched === target.length && target.length > 0 : stateGoalMet;

  useEffect(() => {
    if (goalMet && !firedRef.current) {
      firedRef.current = true;
      onGoalMet();
    }
  }, [goalMet, onGoalMet]);

  function applyMove(turn: Turn, viaDemo = false) {
    setCube((current) => applyTurn(current, turn));
    if (isSequence) {
      setMatched((count) => {
        if (turn === target[count]) return count + 1;
        return turn === target[0] ? 1 : 0;
      });
    }
    if (!viaDemo) setDemoCursor(null);
  }

  function reset() {
    setCube(applyAlgorithm(createSolvedCube(), challenge.setup));
    setMatched(0);
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

  return (
    <section className={`challenge-panel ${goalMet ? 'goal-met' : ''}`} data-testid="challenge-panel">
      <header className="challenge-header">
        <p className="eyebrow">Try it first</p>
        <p className="challenge-goal-text">{challenge.goalText}</p>
      </header>

      <div className="challenge-cube">
        <CubeView
          grid={grid}
          tilt={{ x: -28, y: -38 }}
          cubeSize={stage.cubeSize}
          selectedBand={selectedBand}
          onSelectBand={setSelectedBand}
          onTurn={(turn) => applyMove(turn)}
        />
        <BandControls
          cubeSize={stage.cubeSize}
          selectedBand={selectedBand}
          onSelectBand={setSelectedBand}
          onTurn={(turn) => applyMove(turn)}
        />
      </div>

      <div className="challenge-status" role="status">
        {goalMet ? (
          <strong>Challenge complete — now lock it in below.</strong>
        ) : isSequence ? (
          <span>{matched} / {target.length}</span>
        ) : (
          <span>Keep going — the goal check updates after every move.</span>
        )}
      </div>

      <div className="challenge-actions">
        <button onClick={reset}>Reset challenge</button>
        {hintLevel >= 3 && (
          <>
            <button onClick={startDemo}>Reset &amp; watch</button>
            {demoCursor !== null && demoCursor < demo.length && (
              <button className="primary" onClick={stepDemo}>
                Next move ({formatAlgorithm([demo[demoCursor]])})
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
