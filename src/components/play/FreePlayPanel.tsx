import { useEffect, useRef } from 'react';
import { isGoalMet } from '../../challenges';
import { formatAlgorithm } from '../../cube';
import type { LearningStage } from '../../learningPath';
import type { ProgressSnapshot, ProgressStore } from '../../progress/types';
import { CubeWorkspace, type CubeSession } from './CubeWorkspace';
import { formatTime } from './formatTime';

/**
 * Free Play: scramble, turn the cube however you like, no hints. The only
 * completion event is stopping the timer while the cube is solved (after a
 * scramble) — that's the sole trigger for recording a session. Unsolved
 * stop-timer presses record nothing, matching the "no fake data" mandate.
 */
export function FreePlayPanel({
  store,
  snapshot,
  stageInfo,
}: {
  store: ProgressStore;
  snapshot: ProgressSnapshot;
  stageInfo?: LearningStage;
}) {
  return (
    <CubeWorkspace initialCubeSize={stageInfo?.cubeSize}>
      {(session) => <FreePlayBody session={session} store={store} snapshot={snapshot} />}
    </CubeWorkspace>
  );
}

function FreePlayBody({
  session,
  store,
  snapshot,
}: {
  session: CubeSession;
  store: ProgressStore;
  snapshot: ProgressSnapshot;
}) {
  const hasScrambled = session.lastScramble.length > 0;
  const goalId = session.cubeSize === '2x2' ? 'cube-solved-2x2' : 'cube-solved';
  const solved = hasScrambled && isGoalMet(goalId, session.cube);
  const recordedElapsedRef = useRef<number | null>(null);

  useEffect(() => {
    if (session.elapsedMs == null || recordedElapsedRef.current === session.elapsedMs) return;
    recordedElapsedRef.current = session.elapsedMs;
    if (hasScrambled && solved) {
      store.recordPracticeSession({
        cubeSize: session.cubeSize,
        mode: 'free',
        moves: session.movesSinceScramble,
        elapsedMs: session.elapsedMs,
        solved: true,
      });
    }
  }, [session.elapsedMs, hasScrambled, solved, session.cubeSize, session.movesSinceScramble, store]);

  const bestMs = snapshot.practice.bestTimeMsBySize[session.cubeSize];
  const showSolvedCard = session.elapsedMs != null && solved;

  return (
    <aside className="panel practice-panel">
      <h2>Free Play</h2>
      <p className="note">
        Scramble, then turn the cube however you like. Stop the timer once it&rsquo;s solved to log a session —
        unsolved sessions aren&rsquo;t recorded.
      </p>
      <div className="algorithm-card">
        <span>Scramble</span>
        <code>{session.lastScramble.length ? formatAlgorithm(session.lastScramble) : 'Generate a scramble to begin.'}</code>
      </div>
      {showSolvedCard && (
        <div className="confidence-card" data-testid="free-play-solved-card">
          <span>Solved!</span>
          <strong>{formatTime(session.elapsedMs as number)}</strong>
          {bestMs !== undefined && (
            <p className="note">
              {bestMs === session.elapsedMs ? 'New best time.' : `Best: ${formatTime(bestMs)}`}
            </p>
          )}
        </div>
      )}
    </aside>
  );
}
