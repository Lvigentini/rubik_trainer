import { LEARNING_STAGES, type LearningStageId, getStageById } from '../learningPath';
import { LessonWorkspace } from './LessonWorkspace';
import { PathwayTimeline } from './PathwayTimeline';

type Props = {
  stageId: LearningStageId;
  onSelectStage: (id: LearningStageId) => void;
  onPractice: (stageId: string) => void;
};

export function LearnPage({ stageId, onSelectStage, onPractice }: Props) {
  const completedStageIds: LearningStageId[] = [];
  const selectedStage = getStageById(stageId) ?? LEARNING_STAGES[0];

  return (
    <section className="page-stack">
      <div className="start-here-panel">
        <h1>Start with the 2×2 skill path</h1>
        <p>
          The 2×2 teaches corner movement without edge complexity. Once you can solve corners deliberately,
          the 3×3 becomes a layer-building problem.
        </p>
        <div className="start-here-actions">
          <button className="primary" onClick={() => onSelectStage('2x2-orientation')}>
            Begin Lesson 1: Orientation
          </button>
          <button onClick={() => onSelectStage('3x3-white-cross')}>
            Jump to 3×3 beginner path
          </button>
        </div>
      </div>

      <PathwayTimeline
        currentStageId={selectedStage.id}
        completedStageIds={completedStageIds}
        onSelectStage={onSelectStage}
      />

      <LessonWorkspace stage={selectedStage} onPractice={onPractice} />
    </section>
  );
}
