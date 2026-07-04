import { Check, Lock } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { getStagesForGroup, type LearningStage, type LearningStageId } from '../../learningPath';
import { useProgress } from '../../progress/ProgressContext';
import { getGroupProgress, isStageCompleted, isStageUnlocked } from '../../progress/unlocks';
import { MasteryBadge } from './MasteryBadge';

const GROUPS: { id: LearningStage['group']; label: string }[] = [
  { id: '2x2-foundation', label: '2×2 Foundation' },
  { id: '3x3-beginner', label: '3×3 Beginner' },
];

export function LearnSidebar({ currentStageId }: { currentStageId: LearningStageId }) {
  const snapshot = useProgress();
  return (
    <nav className="learn-sidebar" aria-label="Curriculum" data-testid="learn-sidebar">
      {GROUPS.map((group) => {
        const { done, total } = getGroupProgress(group.id, snapshot);
        return (
          <section key={group.id} className="sidebar-group">
            <header className="sidebar-group-header">
              <h3>{group.label}</h3>
              <span className="sidebar-group-progress">{done}/{total}</span>
            </header>
            <ul>
              {getStagesForGroup(group.id).map((stage) => {
                const completed = isStageCompleted(stage.id, snapshot);
                const unlocked = isStageUnlocked(stage.id, snapshot);
                const status = completed ? 'done' : unlocked ? 'unlocked' : 'locked';
                const mastery = snapshot.lessons[stage.id]?.mastery;
                return (
                  <li key={stage.id}>
                    <NavLink
                      to={`/learn/${stage.id}`}
                      className={`sidebar-stage ${status} ${stage.id === currentStageId ? 'current' : ''}`}
                    >
                      <span className="stage-chip" aria-hidden="true">
                        {completed ? <Check size={13} /> : status === 'locked' ? <Lock size={12} /> : stage.level}
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
