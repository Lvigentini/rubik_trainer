import type { LearningStage } from '../learningPath';
import { getDiagramForStage } from '../lessonDiagrams';
import { getSelfCheckById } from '../selfChecks';
import { getVideosForStage } from '../videos';
import { BeforeAfterDiagram } from './CubeDiagram';
import { SelfCheckCard } from './SelfCheckCard';
import { VideoReferenceCard } from './VideoReferenceCard';

type Props = {
  stage: LearningStage;
  onPractice: (stageId: string) => void;
};

export function LessonWorkspace({ stage, onPractice }: Props) {
  const diagram = getDiagramForStage(stage.id);
  const selfChecks = stage.selfCheckIds.map(getSelfCheckById).filter(Boolean);
  const videos = getVideosForStage(stage.id);

  return (
    <article className="lesson-workspace">
      <header className="lesson-header">
        <h2>{stage.title}</h2>
        <p className="lesson-skill"><strong>What you're learning:</strong> {stage.skill}</p>
        <p className="lesson-outcome"><strong>Why it matters:</strong> {stage.outcome}</p>
      </header>

      {diagram && (
        <section className="lesson-diagram-section">
          <BeforeAfterDiagram before={diagram.before} after={diagram.after} />
        </section>
      )}

      <section className="lesson-steps">
        <h3>Steps</h3>
        <ol>
          {stage.steps.map((step, i) => (
            <li key={i}>
              {step.instruction}
              {step.tip && <em className="step-tip"> — {step.tip}</em>}
            </li>
          ))}
        </ol>
      </section>

      <aside className="lesson-mistake">
        <h3>Common mistake</h3>
        <p>{stage.commonMistake}</p>
      </aside>

      {selfChecks.length > 0 && (
        <section className="lesson-self-checks">
          <h3>Check your understanding</h3>
          {selfChecks.map((check) => (
            <SelfCheckCard
              key={check!.id}
              selfCheck={check!}
              onPractice={() => onPractice(stage.id)}
            />
          ))}
        </section>
      )}

      <div className="lesson-practice-cta">
        <button className="primary" onClick={() => onPractice(stage.id)}>
          Practise this skill
        </button>
      </div>

      {videos.length > 0 && (
        <section className="lesson-videos">
          <h3>Video references</h3>
          <div className="video-cards">
            {videos.map((video) => (
              <VideoReferenceCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
