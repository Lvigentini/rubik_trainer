import { Check, Lock } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { GROUP_LABELS, getStagesForGroup, type LearningStage, type LearningStageId } from '../../learningPath';
import { useProgress } from '../../progress/ProgressContext';
import { getGroupProgress, isStageCompleted, isStageUnlocked, ORDERED_STAGES } from '../../progress/unlocks';
import type { ProgressSnapshot } from '../../progress/types';
import { MasteryBadge } from './MasteryBadge';

const GROUP_IDS: LearningStage['group'][] = ['2x2-foundation', '3x3-beginner'];

/** The nearest incomplete prerequisite for a locked stage, used for the
 * "Complete X to unlock" a11y title (mirrors LockedLessonView's own lookup). */
function prerequisiteFor(stage: LearningStage, snapshot: ProgressSnapshot): LearningStage | undefined {
  return ORDERED_STAGES
    .filter((s) => s.level < stage.level)
    .reverse()
    .find((s) => !isStageCompleted(s.id, snapshot));
}

type Props = {
  currentStageId: LearningStageId;
  onNavigate?: () => void;
};

export function LearnSidebar({ currentStageId, onNavigate }: Props) {
  const snapshot = useProgress();
  return (
    <nav className="learn-sidebar" aria-label="Curriculum" data-testid="learn-sidebar">
      {GROUP_IDS.map((groupId) => {
        const { done, total } = getGroupProgress(groupId, snapshot);
        return (
          <section key={groupId} className="sidebar-group">
            <header className="sidebar-group-header">
              <h2>{GROUP_LABELS[groupId]}</h2>
              <span className="sidebar-group-progress">{done}/{total}</span>
            </header>
            <ul>
              {getStagesForGroup(groupId).map((stage) => {
                const completed = isStageCompleted(stage.id, snapshot);
                const unlocked = isStageUnlocked(stage.id, snapshot);
                const status = completed ? 'done' : unlocked ? 'unlocked' : 'locked';
                const locked = status === 'locked';
                const mastery = snapshot.lessons[stage.id]?.mastery;
                const prerequisite = locked ? prerequisiteFor(stage, snapshot) : undefined;
                return (
                  <li key={stage.id}>
                    <NavLink
                      to={`/learn/${stage.id}`}
                      className={`sidebar-stage ${status} ${stage.id === currentStageId ? 'current' : ''}`}
                      onClick={() => onNavigate?.()}
                      title={locked ? `Complete ${prerequisite?.title ?? 'earlier lessons'} to unlock` : undefined}
                      aria-description={
                        locked
                          ? `Locked — complete ${prerequisite?.title ?? 'earlier lessons'} to unlock; opens test-out`
                          : undefined
                      }
                    >
                      <span className="stage-chip" aria-hidden="true">
                        {completed ? <Check size={13} /> : locked ? <Lock size={12} /> : stage.level}
                      </span>
                      <span className="stage-title">{stage.title}</span>
                      {completed && mastery && <MasteryBadge mastery={mastery} />}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}
