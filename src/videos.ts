import type { LearningStageId } from './learningPath';

export type VideoReference = {
  id: string;
  title: string;
  creator: string;
  url: string;
  duration: string;
  recommendedForStageIds: LearningStageId[];
  note: string;
};

export const VIDEO_REFERENCES: VideoReference[] = [
  {
    id: 'jperm-2x2',
    title: 'Learn How to Solve a 2x2 Rubik\'s Cube (Beginner Tutorial)',
    creator: 'J Perm',
    url: 'https://www.youtube.com/watch?v=GANnG5a19kg',
    duration: '10:09',
    recommendedForStageIds: ['2x2-orientation', '2x2-first-face', '2x2-corner-insertion', '2x2-last-layer-orient', '2x2-last-corner-permute'],
    note: 'Complete 2x2 beginner tutorial covering all foundation stages.',
  },
  {
    id: 'jperm-3x3',
    title: 'Learn How to Solve a Rubik\'s Cube in 10 Minutes (Beginner Tutorial)',
    creator: 'J Perm',
    url: 'https://www.youtube.com/watch?v=7Ron6MN45LY',
    duration: '10:08',
    recommendedForStageIds: ['3x3-white-cross', '3x3-first-layer-corners', '3x3-middle-layer-edges', '3x3-yellow-cross', '3x3-last-layer-finish'],
    note: 'Full 3x3 beginner method in one video.',
  },
  {
    id: 'last-layer-simple',
    title: 'Rubik\'s Cube Last Layer — Made Simple (Beginner Tutorial)',
    creator: 'J Perm',
    url: 'https://www.youtube.com/watch?v=DO3c860861s',
    duration: '8:42',
    recommendedForStageIds: ['3x3-middle-layer-edges', '3x3-yellow-cross', '3x3-last-layer-finish'],
    note: 'Focused last-layer tutorial for when you\'re stuck on the final steps.',
  },
  {
    id: 'best-method-2025',
    title: 'How to Solve a Rubik\'s Cube (Best Method 2025)',
    creator: 'Cubehead',
    url: 'https://www.youtube.com/watch?v=PW2J8IblczM',
    duration: '12:30',
    recommendedForStageIds: ['3x3-last-layer-finish'],
    note: 'Alternative teaching style if the primary tutorial doesn\'t click.',
  },
  {
    id: 'jperm-faster-beginner',
    title: 'How to Solve the Rubik\'s Cube FASTER with the Beginner Method',
    creator: 'J Perm',
    url: 'https://www.youtube.com/watch?v=vmeleO65BHc',
    duration: '9:52',
    recommendedForStageIds: ['3x3-last-layer-finish'],
    note: 'Bridge from beginner method to faster solving. Watch after completing the pathway.',
  },
];

export function getVideosForStage(stageId: LearningStageId): VideoReference[] {
  return VIDEO_REFERENCES.filter((video) => video.recommendedForStageIds.includes(stageId));
}
