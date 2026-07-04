import { ScanCoachPreview } from './ScanCoachPreview';

type Props = {
  onStartPathway: () => void;
  onScanCoach: () => void;
  onFreePractice: () => void;
};

export function HomePage({ onStartPathway, onScanCoach, onFreePractice }: Props) {
  return (
    <section className="home-page">
      <div className="home-hero">
        <p className="eyebrow">Agent-supported skills coach</p>
        <h1>Learn the cube with agent-supported guidance watching your progress.</h1>
        <p className="home-subhead">
          Start with 2×2 fundamentals to learn corners. Scan three faces when stuck.
          Build skills with guided practice, not memorized chaos.
        </p>
        <div className="home-actions">
          <button className="primary" onClick={onStartPathway}>Start the skill pathway</button>
          <button onClick={onScanCoach}>Try scan coach</button>
          <button className="tertiary" onClick={onFreePractice}>Free practice</button>
        </div>
      </div>

      <ScanCoachPreview />

      <div className="feature-cards">
        <article className="feature-card">
          <h3>Visual Scan Coach</h3>
          <p>Enter visible faces; the coach gives partial-state guidance and asks for more views when needed.</p>
        </article>
        <article className="feature-card">
          <h3>Skills Pathway</h3>
          <p>Follow a sequence from orientation to first face to layers to last layer to recognition.</p>
        </article>
        <article className="feature-card">
          <h3>Practice Loops</h3>
          <p>Every lesson ends with a short challenge and self-check so you know whether you understood it.</p>
        </article>
      </div>
    </section>
  );
}
