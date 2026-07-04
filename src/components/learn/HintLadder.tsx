import { CHALLENGES } from '../../challenges';
import type { LearningStage } from '../../learningPath';
import { LessonGuide } from './LessonGuide';

type Props = {
  stage: LearningStage;
  hintLevel: 0 | 1 | 2 | 3;
  onReveal: (level: 1 | 2 | 3) => void;
};

export function HintLadder({ stage, hintLevel, onReveal }: Props) {
  const challenge = CHALLENGES[stage.id];
  return (
    <section className="hint-ladder" data-testid="hint-ladder">
      {hintLevel < 1 && (
        <button onClick={() => onReveal(1)}>Stuck? Get a nudge</button>
      )}
      {hintLevel >= 1 && (
        <div className="hint hint-nudge">
          <p>{challenge.conceptHint}</p>
          {hintLevel < 2 && <button onClick={() => onReveal(2)}>Show me the steps</button>}
        </div>
      )}
      {hintLevel >= 2 && (
        <div className="hint hint-steps">
          <LessonGuide stage={stage} />
          {hintLevel < 3 && <button onClick={() => onReveal(3)}>Watch the moves</button>}
        </div>
      )}
      {hintLevel >= 3 && (
        <p className="hint hint-demo">Watch the moves on the cube above — use "Reset &amp; watch", then step through with "Next move".</p>
      )}
    </section>
  );
}
