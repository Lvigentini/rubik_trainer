export function MasteryBadge({ mastery }: { mastery: 1 | 2 | 3 }) {
  return (
    <span className="mastery-badge" aria-label={`Mastery ${mastery} of 3`}>
      {[1, 2, 3].map((cubie) => (
        <span key={cubie} className={`mastery-cubie ${cubie <= mastery ? 'earned' : ''}`} />
      ))}
    </span>
  );
}
