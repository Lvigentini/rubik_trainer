export function formatTime(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const mins = Math.floor(seconds / 60);
  return `${mins}:${(seconds % 60).toFixed(2).padStart(5, '0')}`;
}
