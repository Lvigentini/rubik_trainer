import { useNavigate } from 'react-router-dom';
import { getStageById, type LearningStageId } from '../learningPath';
import { useProgress, useProgressStore } from '../progress/ProgressContext';
import { FreePlayPanel } from './play/FreePlayPanel';
import { PLAY_MODE_ORDER, PLAY_MODES, type PlayMode } from './play/modes';
import { ScanCoachPanel } from './play/ScanCoachPanel';
import { SolveCoachPanel } from './play/SolveCoachPanel';

/**
 * Thin, route-driven shell: the URL is the source of truth for the active
 * mode. Switching modes navigates (preserving ?skill=) instead of touching
 * local state, and each mode's session/scoring logic lives entirely in its
 * own panel under components/play/.
 */
export function PracticePage({ mode, skillContext }: { mode: PlayMode; skillContext?: string }) {
  const navigate = useNavigate();
  const store = useProgressStore();
  const snapshot = useProgress();
  const stageInfo = skillContext ? getStageById(skillContext as LearningStageId) : undefined;

  function handleModeChange(nextMode: PlayMode) {
    const query = skillContext ? `?skill=${skillContext}` : '';
    navigate(`/play/${nextMode}${query}`);
  }

  return (
    <section className="page-stack">
      <div className="play-header">
        <div>
          <p className="eyebrow">Play</p>
          <h1>Practise the cube.</h1>
          {stageInfo && <p className="skill-context">Reinforcing: {stageInfo.title}</p>}
        </div>
        <div className="game-mode-card">
          <span className="field-label">Game mode</span>
          <div className="segmented" role="group" aria-label="Play mode">
            {PLAY_MODE_ORDER.map((candidate) => (
              <button
                key={candidate}
                className={mode === candidate ? 'active' : ''}
                title={PLAY_MODES[candidate].description}
                onClick={() => handleModeChange(candidate)}
              >
                {PLAY_MODES[candidate].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === 'free' && <FreePlayPanel store={store} snapshot={snapshot} stageInfo={stageInfo} />}
      {mode === 'coach' && <SolveCoachPanel store={store} snapshot={snapshot} stageInfo={stageInfo} />}
      {mode === 'scan' && <ScanCoachPanel />}
    </section>
  );
}
