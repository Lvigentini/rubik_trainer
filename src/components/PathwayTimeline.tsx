import type { LearningStage, LearningStageId } from '../learningPath';
import { getStagesForGroup } from '../learningPath';

type Props = {
  currentStageId: LearningStageId;
  completedStageIds: LearningStageId[];
  onSelectStage: (id: LearningStageId) => void;
};

function StageNode({ stage, status, isSelected, onSelect }: {
  stage: LearningStage;
  status: 'done' | 'current' | 'future';
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`pathway-node ${status} ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      aria-label={`${stage.title} — ${status}`}
      aria-current={status === 'current' ? 'step' : undefined}
    >
      <span className="node-indicator">
        {status === 'done' ? '✓' : stage.level}
      </span>
      <span className="node-title">{stage.title}</span>
    </button>
  );
}

export function PathwayTimeline({ currentStageId, completedStageIds, onSelectStage }: Props) {
  const foundation = getStagesForGroup('2x2-foundation');
  const beginner = getStagesForGroup('3x3-beginner');

  function getStatus(stage: LearningStage): 'done' | 'current' | 'future' {
    if (completedStageIds.includes(stage.id)) return 'done';
    if (stage.id === currentStageId) return 'current';
    return 'future';
  }

  return (
    <div className="pathway-timeline" data-testid="pathway-timeline">
      <div className="pathway-group">
        <h3 className="pathway-group-title">2×2 Foundation</h3>
        <div className="pathway-nodes">
          {foundation.map((stage) => (
            <StageNode
              key={stage.id}
              stage={stage}
              status={getStatus(stage)}
              isSelected={stage.id === currentStageId}
              onSelect={() => onSelectStage(stage.id)}
            />
          ))}
        </div>
      </div>
      <div className="pathway-group">
        <h3 className="pathway-group-title">3×3 Beginner</h3>
        <div className="pathway-nodes">
          {beginner.map((stage) => (
            <StageNode
              key={stage.id}
              stage={stage}
              status={getStatus(stage)}
              isSelected={stage.id === currentStageId}
              onSelect={() => onSelectStage(stage.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
