export type PlayMode = 'free' | 'coach' | 'scan';

export const PLAY_MODE_ORDER: PlayMode[] = ['free', 'coach', 'scan'];

export const PLAY_MODES: Record<PlayMode, { label: string; description: string }> = {
  free: {
    label: 'Free Play',
    description: 'Turn the cube freely — scramble, solve at your own pace, no scoring pressure.',
  },
  coach: {
    label: 'Solve Coach',
    description: 'Scramble, then get a real completion score once you solve it.',
  },
  scan: {
    label: 'Scan Coach',
    description: 'Capture visible faces and check completeness, with honest limitations.',
  },
};
