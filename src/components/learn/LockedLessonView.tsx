import { useState } from 'react';
import { Lock } from 'lucide-react';
import type { LearningStage } from '../../learningPath';
import { useProgress, useProgressStore } from '../../progress/ProgressContext';
import { isStageCompleted, ORDERED_STAGES } from '../../progress/unlocks';
import { getSelfCheckById } from '../../selfChecks';
import { SelfCheckCard } from '../SelfCheckCard';

export function LockedLessonView({ stage }: { stage: LearningStage }) {
  const store = useProgressStore();
  const snapshot = useProgress();
  const [testingOut, setTestingOut] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [passed, setPassed] = useState<Set<string>>(new Set());
  const [failed, setFailed] = useState(false);

  const selfChecks = stage.selfCheckIds.map(getSelfCheckById).filter(Boolean);
  const prerequisite = ORDERED_STAGES
    .filter((s) => s.level < stage.level)
    .reverse()
    .find((s) => !isStageCompleted(s.id, snapshot));

  function handleResult(checkId: string, correct: boolean) {
    store.recordSelfCheck(stage.id, checkId, correct);
    if (!correct) {
      setFailed(true);
      return;
    }
    const next = new Set(passed).add(checkId);
    setPassed(next);
    if (next.size === selfChecks.length) {
      store.completeLesson(stage.id, 2, 0);
    }
  }

  function retry() {
    setAttempt((n) => n + 1);
    setPassed(new Set());
    setFailed(false);
  }

  return (
    <article className="lesson-view locked-lesson">
      <header className="lesson-header">
        <p className="eyebrow"><Lock size={12} /> Locked</p>
        <h1>{stage.title}</h1>
        <p className="locked-reason">
          {prerequisite
            ? <>Complete “{prerequisite.title}” to unlock this lesson.</>
            : <>Finish the earlier lessons to unlock this one.</>}
        </p>
      </header>
      {!testingOut ? (
        <div className="locked-actions">
          <button onClick={() => setTestingOut(true)}>Test out of this lesson</button>
          <p className="locked-note">Already know this skill? Pass the self-check — no hints — to skip ahead.</p>
        </div>
      ) : (
        <section className="lesson-self-checks" key={attempt}>
          <h2>Check your understanding</h2>
          {failed && (
            <div className="testout-failed" role="status">
              <p>Not yet — review the earlier lessons or try again.</p>
              <button onClick={retry}>Try again</button>
            </div>
          )}
          {selfChecks.map((check) => (
            <SelfCheckCard
              key={`${check!.id}-${attempt}`}
              selfCheck={check!}
              onResult={(correct) => handleResult(check!.id, correct)}
            />
          ))}
        </section>
      )}
    </article>
  );
}
