import { useState } from 'react';
import { PanelLeft } from 'lucide-react';
import { LEARNING_STAGES, type LearningStageId, getStageById } from '../learningPath';
import { useProgress } from '../progress/ProgressContext';
import { isStageUnlocked } from '../progress/unlocks';
import { LearnSidebar } from './learn/LearnSidebar';
import { LessonView } from './learn/LessonView';
import { LockedLessonView } from './learn/LockedLessonView';

type Props = {
  stageId: LearningStageId;
  onPractice: (stageId: string) => void;
};

export function LearnPage({ stageId, onPractice }: Props) {
  const snapshot = useProgress();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const stage = getStageById(stageId) ?? LEARNING_STAGES[0];
  const unlocked = isStageUnlocked(stage.id, snapshot);

  return (
    <div className="learn-layout">
      <button
        className="curriculum-toggle"
        aria-expanded={drawerOpen}
        onClick={() => setDrawerOpen((open) => !open)}
      >
        <PanelLeft size={16} /> Curriculum
      </button>
      <div className={`learn-sidebar-wrap ${drawerOpen ? 'open' : ''}`}>
        <LearnSidebar currentStageId={stage.id} />
      </div>
      <main className="learn-main">
        {/* key remounts per stage: LessonView's per-visit refs must reset */}
        {unlocked
          ? <LessonView key={stage.id} stage={stage} onPractice={onPractice} />
          : <LockedLessonView key={stage.id} stage={stage} />}
      </main>
    </div>
  );
}
