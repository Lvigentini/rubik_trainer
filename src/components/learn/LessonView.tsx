import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { LearningStage } from '../../learningPath';
import { getSelfCheckById } from '../../selfChecks';
import { getVideosForStage } from '../../videos';
import { calculateMastery } from '../../progress/mastery';
import { useProgress, useProgressStore } from '../../progress/ProgressContext';
import { getNextStageId } from '../../progress/unlocks';
import { SelfCheckCard } from '../SelfCheckCard';
import { VideoReferenceCard } from '../VideoReferenceCard';
import { ChallengePanel } from './ChallengePanel';
import { CompletionCelebration } from './CompletionCelebration';
import { HintLadder } from './HintLadder';
import { MasteryBadge } from './MasteryBadge';

const GROUP_LABELS = { '2x2-foundation': '2×2 Foundation', '3x3-beginner': '3×3 Beginner' } as const;

export function LessonView({ stage, onPractice }: { stage: LearningStage; onPractice: (stageId: string) => void }) {
  const store = useProgressStore();
  const snapshot = useProgress();
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);
  const [challengeDone, setChallengeDone] = useState(false);
  const [passedChecks, setPassedChecks] = useState<Set<string>>(new Set());
  const [missedAny, setMissedAny] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const selfChecks = stage.selfCheckIds.map(getSelfCheckById).filter(Boolean);
  const videos = getVideosForStage(stage.id);
  const existing = snapshot.lessons[stage.id];
  const nextStageId = getNextStageId(stage.id);

  function handleCheckResult(checkId: string, correct: boolean) {
    store.recordSelfCheck(stage.id, checkId, correct);
    if (!correct) {
      setMissedAny(true);
      return;
    }
    const passed = new Set(passedChecks).add(checkId);
    setPassedChecks(passed);
    if (challengeDone && passed.size === selfChecks.length && !recorded) {
      setRecorded(true);
      store.completeLesson(stage.id, calculateMastery(hintLevel, !missedAny), hintLevel);
    }
  }

  function handleGoalMet() {
    setChallengeDone(true);
    if (passedChecks.size === selfChecks.length && selfChecks.length > 0 && !recorded) {
      setRecorded(true);
      store.completeLesson(stage.id, calculateMastery(hintLevel, !missedAny), hintLevel);
    }
  }

  const justCompleted = recorded;
  const mastery = snapshot.lessons[stage.id]?.mastery;

  return (
    <article className="lesson-view">
      <header className="lesson-header">
        <p className="eyebrow">Lesson {stage.level} · {GROUP_LABELS[stage.group]}</p>
        <h1>{stage.title}</h1>
        <p className="lesson-skill">{stage.skill}</p>
        <p className="lesson-outcome">{stage.outcome}</p>
        {existing && !justCompleted && (
          <p className="lesson-completed-banner">
            Completed <MasteryBadge mastery={existing.mastery} /> — redo it to raise your mastery.
          </p>
        )}
      </header>

      <ChallengePanel key={stage.id} stage={stage} hintLevel={hintLevel} onGoalMet={handleGoalMet} />
      <HintLadder stage={stage} hintLevel={hintLevel} onReveal={setHintLevel} />

      <section className="lesson-self-checks">
        <h2>Check your understanding</h2>
        {selfChecks.map((check) => (
          <SelfCheckCard
            key={check!.id}
            selfCheck={check!}
            allowRetry
            onResult={(correct) => handleCheckResult(check!.id, correct)}
          />
        ))}
      </section>

      {justCompleted && mastery && (
        <section className="lesson-complete" role="status">
          <CompletionCelebration />
          <h2>Lesson complete</h2>
          <MasteryBadge mastery={mastery} />
          <div className="lesson-complete-actions">
            {nextStageId && (
              <Link className="button-link primary" to={`/learn/${nextStageId}`}>Next lesson</Link>
            )}
            <button onClick={() => onPractice(stage.id)}>Practise this skill</button>
          </div>
        </section>
      )}

      {!justCompleted && (
        <div className="lesson-practice-cta">
          <button onClick={() => onPractice(stage.id)}>Practise this skill</button>
        </div>
      )}

      {videos.length > 0 && (
        <section className="lesson-videos">
          <h2>Video references</h2>
          <div className="video-cards">
            {videos.map((video) => <VideoReferenceCard key={video.id} video={video} />)}
          </div>
        </section>
      )}
    </article>
  );
}
