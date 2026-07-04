import { ArrowRight, Camera, Flame, Gamepad2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GROUP_LABELS, getStageById } from '../learningPath';
import { useProgress } from '../progress/ProgressContext';
import { getCompletedCount, getCurrentStageId, getGroupProgress } from '../progress/unlocks';
import { PLAY_MODE_ORDER, PLAY_MODES, type PlayMode } from './play/modes';
import { ScanCoachPreview } from './ScanCoachPreview';

const MODE_ICON: Record<PlayMode, typeof Gamepad2> = {
  free: Gamepad2,
  coach: Sparkles,
  scan: Camera,
};

/**
 * Home has two states driven entirely by the progress store: a one-screen
 * explanation for a brand-new learner (nothing completed yet), and a
 * resume-first dashboard once at least one lesson is done. No fake data —
 * every number here reads straight from the snapshot.
 */
export function HomePage() {
  const navigate = useNavigate();
  const snapshot = useProgress();
  const { done, total } = getCompletedCount(snapshot);

  if (done === 0) {
    return <FirstVisitHome onStartLearning={() => navigate('/learn')} onFreePlay={() => navigate('/play/free')} />;
  }

  const currentStageId = getCurrentStageId(snapshot);
  const stage = getStageById(currentStageId);
  if (!stage) {
    return <FirstVisitHome onStartLearning={() => navigate('/learn')} onFreePlay={() => navigate('/play/free')} />;
  }

  const groupProgress = getGroupProgress(stage.group, snapshot);
  const { current, best } = snapshot.streak;

  return (
    <section className="home-view home-view-resume">
      <article className="home-resume-card" data-testid="home-resume-card">
        <p className="home-eyebrow">Continue</p>
        <h1 className="home-resume-title">
          Continue: Lesson {stage.level} &mdash; {stage.title}
        </h1>
        <p className="home-resume-outcome">{stage.outcome}</p>
        <div className="home-progress-row">
          <div className="home-progress-stat">
            <span>Skills</span>
            <strong>{done}/{total}</strong>
          </div>
          <div className="home-progress-stat">
            <span>{GROUP_LABELS[stage.group]}</span>
            <strong>{groupProgress.done}/{groupProgress.total}</strong>
          </div>
          <div className="home-progress-stat home-streak-stat">
            <span><Flame size={13} /> Streak</span>
            <strong>{current} {current === 1 ? 'day' : 'days'}</strong>
            <span className="home-streak-best">Best {best}</span>
          </div>
        </div>
        <button className="home-cta-primary" onClick={() => navigate(`/learn/${stage.id}`)}>
          Continue lesson <ArrowRight size={16} />
        </button>
      </article>

      <div className="home-mode-tiles">
        {PLAY_MODE_ORDER.map((mode) => {
          const Icon = MODE_ICON[mode];
          return (
            <button
              key={mode}
              className="home-mode-tile"
              aria-label={PLAY_MODES[mode].label}
              title={PLAY_MODES[mode].description}
              onClick={() => navigate(`/play/${mode}`)}
            >
              <Icon className="home-mode-tile-icon" size={20} />
              <span className="home-mode-tile-label" aria-hidden="true">{PLAY_MODES[mode].label}</span>
              <span className="home-mode-tile-desc" aria-hidden="true">{PLAY_MODES[mode].description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FirstVisitHome({ onStartLearning, onFreePlay }: { onStartLearning: () => void; onFreePlay: () => void }) {
  return (
    <section className="home-view home-view-first">
      <header className="home-intro">
        <p className="home-eyebrow">Agent-supported skills coach</p>
        <h1 className="home-headline">Learn the cube, one honest skill at a time.</h1>
        <p className="home-lede">
          Start with 2&times;2 fundamentals to learn corners. Scan three visible faces when you&rsquo;re stuck and
          get partial-state guidance. Every practice score is computed from what you actually did &mdash; no fake
          previews.
        </p>
        <div className="home-cta-row">
          <button className="home-cta-primary" onClick={onStartLearning}>
            Start learning <ArrowRight size={16} />
          </button>
          <button className="home-cta-secondary" onClick={onFreePlay}>
            Free play
          </button>
        </div>
      </header>

      <div className="home-concept-row">
        <ScanCoachPreview />
      </div>
    </section>
  );
}
