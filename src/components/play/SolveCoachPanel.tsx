import { Award } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CHALLENGES, isGoalMet } from '../../challenges';
import { formatAlgorithm, invertAlgorithm, type Turn } from '../../cube';
import type { LearningStage } from '../../learningPath';
import type { ProgressSnapshot, ProgressStore } from '../../progress/types';
import { calculateLessonScore, type LessonScore } from '../../trainer';
import { CubeWorkspace, type CubeSession } from './CubeWorkspace';

/**
 * Solve Coach: scramble (or, when reinforcing a skill, that stage's setup),
 * then work the known solution with hint steps if you want them. The only
 * completion event is the cube becoming solved after a scramble — that's
 * when a real score (computed from real values) and a session record fire,
 * exactly once per scramble.
 */
export function SolveCoachPanel({
  store,
  snapshot,
  stageInfo,
}: {
  store: ProgressStore;
  snapshot: ProgressSnapshot;
  stageInfo?: LearningStage;
}) {
  const initialScramble = stageInfo ? CHALLENGES[stageInfo.id].setup : undefined;
  return (
    <CubeWorkspace initialCubeSize={stageInfo?.cubeSize} initialScramble={initialScramble}>
      {(session) => <SolveCoachBody session={session} store={store} snapshot={snapshot} />}
    </CubeWorkspace>
  );
}

function SolveCoachBody({
  session,
  store,
  snapshot,
}: {
  session: CubeSession;
  store: ProgressStore;
  snapshot: ProgressSnapshot;
}) {
  // Reset per-scramble local state (solution cursor, hint count, any earlier
  // score card) when a new scramble arrives — the "adjust state during
  // render when a prop changes" pattern, so there's nothing to gate against
  // re-firing and no ref reads/writes happen during render.
  const [scrambleToken, setScrambleToken] = useState(session.lastScramble);
  const [solutionCursor, setSolutionCursor] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [scoreCard, setScoreCard] = useState<LessonScore | null>(null);
  if (scrambleToken !== session.lastScramble) {
    setScrambleToken(session.lastScramble);
    setSolutionCursor(0);
    setHintsUsed(0);
    setScoreCard(null);
  }

  const solution = invertAlgorithm(session.lastScramble);
  const remainingSolution = solution.slice(solutionCursor);
  const goalId = session.cubeSize === '2x2' ? 'cube-solved-2x2' : 'cube-solved';
  const hasScrambled = session.lastScramble.length > 0;
  const solved = hasScrambled && isGoalMet(goalId, session.cube);

  // Recording (and computing the score from real, honest values) happens
  // exactly once per scramble inside this ref-guarded effect — the same
  // idiom LessonView uses for its completion event. Reading the wall clock
  // is only safe here, in an effect, never during render.
  const recordedRef = useRef<Turn[] | null>(null);
  useEffect(() => {
    if (!solved || recordedRef.current === session.lastScramble) return;
    recordedRef.current = session.lastScramble;
    const targetSeconds = session.cubeSize === '2x2' ? 90 : 180;
    const elapsedSeconds = session.isTiming
      ? session.liveElapsedMs / 1000
      : session.scrambleAt
        ? (Date.now() - session.scrambleAt) / 1000
        : 0;
    const nextScore = calculateLessonScore({
      completed: true,
      optimalMoves: Math.max(solution.length, 1),
      actualMoves: session.movesSinceScramble,
      elapsedSeconds,
      targetSeconds,
      hintsUsed,
      mistakes: 0,
      streak: snapshot.streak.current,
    });
    setScoreCard(nextScore);
    store.recordPracticeSession({
      cubeSize: session.cubeSize,
      mode: 'coach',
      moves: session.movesSinceScramble,
      elapsedMs: Math.round(elapsedSeconds * 1000),
      solved: true,
    });
    // solution.length is derived from session.lastScramble (already a dep);
    // snapshot.streak.current is read once at the moment of completion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved, session.lastScramble, session.movesSinceScramble, session.cubeSize, session.isTiming, session.liveElapsedMs, session.scrambleAt, hintsUsed, store]);

  function applyNextSolutionMove() {
    const next = remainingSolution[0];
    if (!next) return;
    session.applyMove(next);
    setSolutionCursor((cursor) => cursor + 1);
    setHintsUsed((count) => count + 1);
  }

  function applyRemainingSolution() {
    if (!remainingSolution.length) return;
    remainingSolution.forEach((turn) => session.applyMove(turn));
    setHintsUsed((count) => count + remainingSolution.length);
    setSolutionCursor(solution.length);
  }

  return (
    <aside className="panel practice-panel">
      <h2>Solve Coach</h2>
      <div className="algorithm-card">
        <span>Scramble</span>
        <code>{session.lastScramble.length ? formatAlgorithm(session.lastScramble) : 'Generate a scramble to begin.'}</code>
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
      {scoreCard && (
        <div className="game-score-panel">
          <div className="panel-header">
            <h2>Scoring</h2>
            <Award className="panel-icon" />
          </div>
          <div className="score-grid compact-score-grid">
            <div className="score-card total-score">
              <span>Completion score</span>
              <strong>{scoreCard.total} pts</strong>
            </div>
            {scoreCard.breakdown.map((item) => (
              <div className="score-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.points > 0 ? `+${item.points}` : item.points}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
