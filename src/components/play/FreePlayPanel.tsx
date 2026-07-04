import { useEffect, useRef, useState } from 'react';
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

type CompletedRun = { elapsedMs: number; isNewBest: boolean };

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
  // Requires at least one forward move past the scramble, so undoing the
  // scramble back to solved (cursor <= lastScramble.length) never counts as
  // a solve — that would credit zero actual solving skill.
  const movedPastScramble = session.historyCursor > session.lastScramble.length;
  const solved = hasScrambled && movedPastScramble && isGoalMet(goalId, session.cube);
  const bestMs = snapshot.practice.bestTimeMsBySize[session.cubeSize];

  // completedRun is the ONLY source for the "Solved!" card: it's set inside
  // the recording effect below, exclusively when a session was actually
  // recorded, and reset (via the "adjust state during render" pattern,
  // mirroring SolveCoachPanel's scramble-token reset) whenever a new
  // scramble/reset starts a new run. This is what stops a stale elapsedMs
  // from a stopped-but-unsolved timer plus a later, untimed manual solve
  // from ever showing a false "Solved!" card, and stops a second stop/start
  // of the timer on the same scramble from recording a second session.
  const [scrambleToken, setScrambleToken] = useState(session.lastScramble);
  const [completedRun, setCompletedRun] = useState<CompletedRun | null>(null);
  if (scrambleToken !== session.lastScramble) {
    setScrambleToken(session.lastScramble);
    setCompletedRun(null);
  }

  // Single merged early-return guard (the same ref-guard idiom LessonView
  // and SolveCoachPanel use) — everything after it runs unconditionally, so
  // there's no separate non-ref-derived conditional wrapping the setState
  // calls. `alreadyConsidered` is read from the ref, then the ref is
  // unconditionally updated to the current elapsedMs — regardless of
  // whether this particular elapsedMs turns out to be a solve — so a later
  // render where `solved` flips true for that SAME (stale) elapsedMs value
  // (no new timer stop) is recognized as already-considered and skipped.
  const recordedElapsedRef = useRef<number | null>(null);
  useEffect(() => {
    if (session.elapsedMs == null || completedRun != null) return;
    const alreadyConsidered = recordedElapsedRef.current === session.elapsedMs;
    recordedElapsedRef.current = session.elapsedMs;
    if (alreadyConsidered || !hasScrambled || !solved) return;
    store.recordPracticeSession({
      cubeSize: session.cubeSize,
      mode: 'free',
      moves: session.movesSinceScramble,
      elapsedMs: session.elapsedMs,
      solved: true,
    });
    setCompletedRun({
      elapsedMs: session.elapsedMs,
      isNewBest: bestMs === undefined || session.elapsedMs < bestMs,
    });
  }, [session.elapsedMs, hasScrambled, solved, session.cubeSize, session.movesSinceScramble, store, completedRun, bestMs]);

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
      {completedRun && (
        <div className="confidence-card" data-testid="free-play-solved-card">
          <span>Solved!</span>
          <strong>{formatTime(completedRun.elapsedMs)}</strong>
          {completedRun.isNewBest ? (
            <p className="note">New best time.</p>
          ) : bestMs !== undefined ? (
            <p className="note">Best: {formatTime(bestMs)}</p>
          ) : null}
        </div>
      )}
    </aside>
  );
}
