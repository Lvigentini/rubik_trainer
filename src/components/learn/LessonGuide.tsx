import type { LearningStage } from '../../learningPath';
import { getDiagramForStage } from '../../lessonDiagrams';
import { BeforeAfterDiagram } from '../CubeDiagram';

export function LessonGuide({ stage }: { stage: LearningStage }) {
  const diagram = getDiagramForStage(stage.id);
  return (
    <div className="lesson-guide">
      {diagram && <BeforeAfterDiagram before={diagram.before} after={diagram.after} />}
      <h3>Steps</h3>
      <ol>
        {stage.steps.map((step, i) => (
          <li key={i}>
            {step.instruction}
            {step.tip && <em className="step-tip"> — {step.tip}</em>}
          </li>
        ))}
      </ol>
      <aside className="lesson-mistake">
        <h3>Common mistake</h3>
        <p>{stage.commonMistake}</p>
      </aside>
    </div>
  );
}
