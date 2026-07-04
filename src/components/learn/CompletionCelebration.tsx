const CELEBRATION_COLORS = ['green', 'red', 'blue', 'orange', 'yellow', 'white'] as const;

export function CompletionCelebration() {
  return (
    <div className="celebration" aria-hidden="true">
      {Array.from({ length: 20 }, (_, i) => (
        <span
          key={i}
          className={`celebration-sticker sticker-${CELEBRATION_COLORS[i % 6]} fall-${i % 5}`}
        />
      ))}
    </div>
  );
}
