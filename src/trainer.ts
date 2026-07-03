export type CubeSizeId = '2x2' | '3x3';
export type ApproachId = 'guided-beginner' | 'layer-by-layer' | 'recognition-drills';

export type CubeSize = {
  id: CubeSizeId;
  label: string;
  whyFirst: string;
};

export type Approach = {
  id: ApproachId;
  title: string;
  bestFor: string;
  tradeoff: string;
};

export type Lesson = {
  id: string;
  cubeSize: CubeSizeId;
  approach: ApproachId;
  level: number;
  title: string;
  objective: string;
  strategy: string;
  drill: string;
  successCriteria: string[];
  scoringFocus: string[];
  targetSeconds: number;
  parMoves: number;
};

export type ScoreInput = {
  completed: boolean;
  optimalMoves: number;
  actualMoves: number;
  elapsedSeconds: number;
  targetSeconds: number;
  hintsUsed: number;
  mistakes: number;
  streak: number;
};

export type ScoreBreakdownItem = {
  label: string;
  points: number;
};

export type LessonScore = {
  total: number;
  breakdown: ScoreBreakdownItem[];
};

export const CUBE_SIZES: CubeSize[] = [
  {
    id: '2x2',
    label: '2×2 Pocket Cube',
    whyFirst: 'Start with corners only: fewer pieces, clearer patterns, and faster feedback before adding 3×3 edges.',
  },
  {
    id: '3x3',
    label: '3×3 Classic Cube',
    whyFirst: 'Add edges, centers, layer planning, and full beginner-method strategy once corner intuition is solid.',
  },
];

export const APPROACHES: Approach[] = [
  {
    id: 'guided-beginner',
    title: 'Guided beginner path',
    bestFor: 'Learning why each step works with prompts, hints, and gradual removal of support.',
    tradeoff: 'Slower than pure algorithm drills, but better for building durable intuition.',
  },
  {
    id: 'layer-by-layer',
    title: 'Layer-by-layer solve',
    bestFor: 'A practical route to completing real cubes: solve one layer, then the next, then finish last layer cases.',
    tradeoff: 'Reliable but not speed-optimal; some moves feel repetitive until recognition improves.',
  },
  {
    id: 'recognition-drills',
    title: 'Recognition drills',
    bestFor: 'Training pattern spotting, case naming, and algorithm recall under time pressure.',
    tradeoff: 'Best after the learner understands the goal of each stage; can feel abstract too early.',
  },
];

const LESSONS: Lesson[] = [
  {
    id: '2x2-orientation',
    cubeSize: '2x2',
    approach: 'guided-beginner',
    level: 1,
    title: 'Orientation and notation',
    objective: 'Understand faces, turns, and cube orientation before solving anything.',
    strategy: 'Practice U/R/F turns on a tiny cube so the notation maps directly to what you see.',
    drill: 'Apply five prompted turns and reset to solved without losing track of the front face.',
    successCriteria: ['Name U/R/F correctly three times', 'Apply R, U, and F turns without hints'],
    scoringFocus: ['no-hint bonus', 'streak bonus'],
    targetSeconds: 75,
    parMoves: 5,
  },
  {
    id: '2x2-first-layer',
    cubeSize: '2x2',
    approach: 'guided-beginner',
    level: 2,
    title: 'Build a first layer',
    objective: 'Place four matching-color corners around one face.',
    strategy: 'Find one corner, protect solved corners, and insert the next corner with simple R U R\' style moves.',
    drill: 'Solve a first layer from a short scramble while preserving already solved corners.',
    successCriteria: ['One complete face is solved', 'Side colors around that face match as a band'],
    scoringFocus: ['completion', 'accuracy bonus'],
    targetSeconds: 120,
    parMoves: 12,
  },
  {
    id: '2x2-last-layer-orient',
    cubeSize: '2x2',
    approach: 'guided-beginner',
    level: 3,
    title: 'Orient the last layer',
    objective: 'Turn the top stickers to one color while keeping the first layer intact.',
    strategy: 'Recognize a solved/line/L/dot-like corner orientation and repeat a short trigger until the top is oriented.',
    drill: 'Choose the right orientation prompt and complete the yellow face.',
    successCriteria: ['Top face is one color', 'First layer remains solved'],
    scoringFocus: ['recognition', 'mistake penalty'],
    targetSeconds: 150,
    parMoves: 18,
  },
  {
    id: '2x2-permute-last-layer',
    cubeSize: '2x2',
    approach: 'guided-beginner',
    level: 4,
    title: 'Permute the final corners',
    objective: 'Move the last-layer corners into their final positions.',
    strategy: 'Identify whether adjacent or diagonal corners need swapping, then apply the matching beginner algorithm.',
    drill: 'Finish the cube from a last-layer permutation case.',
    successCriteria: ['All six faces are solved', 'Learner can explain which corners moved'],
    scoringFocus: ['completion bonus', 'speed bonus'],
    targetSeconds: 180,
    parMoves: 22,
  },
  {
    id: '3x3-white-cross',
    cubeSize: '3x3',
    approach: 'layer-by-layer',
    level: 5,
    title: 'White cross with matching edges',
    objective: 'Solve the cross and align each edge with its side center.',
    strategy: 'Plan one edge at a time; use centers as anchors and avoid disturbing solved cross pieces.',
    drill: 'Build a cross from a generated scramble.',
    successCriteria: ['White cross is solved', 'Each cross edge matches its side center'],
    scoringFocus: ['move efficiency', 'completion'],
    targetSeconds: 180,
    parMoves: 18,
  },
  {
    id: '3x3-first-layer-corners',
    cubeSize: '3x3',
    approach: 'layer-by-layer',
    level: 6,
    title: 'First-layer corners',
    objective: 'Insert corners to finish the first layer without breaking the cross.',
    strategy: 'Position each corner above its slot, then use beginner insertion triggers.',
    drill: 'Solve the full first layer after the cross.',
    successCriteria: ['First face solved', 'Side bands around first layer match centers'],
    scoringFocus: ['accuracy bonus', 'hints used'],
    targetSeconds: 240,
    parMoves: 30,
  },
  {
    id: '3x3-last-layer-recognition',
    cubeSize: '3x3',
    approach: 'recognition-drills',
    level: 7,
    title: 'Last-layer recognition drills',
    objective: 'Identify common last-layer patterns before choosing algorithms.',
    strategy: 'Separate recognition from execution: name the case first, then run the algorithm.',
    drill: 'Classify ten last-layer cards with immediate feedback.',
    successCriteria: ['Eight of ten cases identified', 'No more than two hint reveals'],
    scoringFocus: ['streak bonus', 'no-hint bonus'],
    targetSeconds: 210,
    parMoves: 0,
  },
];

export function getLessonsFor(cubeSize: CubeSizeId, approach: ApproachId): Lesson[] {
  const exact = LESSONS.filter((lesson) => lesson.cubeSize === cubeSize && lesson.approach === approach);
  if (exact.length > 0) return exact;
  return LESSONS.filter((lesson) => lesson.cubeSize === cubeSize);
}

export function nextRecommendedLesson(cubeSize: CubeSizeId, approach: ApproachId, completedLessonIds: string[]): Lesson | undefined {
  const completed = new Set(completedLessonIds);
  return getLessonsFor(cubeSize, approach).find((lesson) => !completed.has(lesson.id));
}

export function calculateLessonScore(input: ScoreInput): LessonScore {
  if (!input.completed) {
    return { total: 0, breakdown: [{ label: 'Incomplete lesson', points: 0 }] };
  }

  const breakdown: ScoreBreakdownItem[] = [{ label: 'Completion', points: 100 }];
  const moveOverage = input.actualMoves - input.optimalMoves;

  if (moveOverage <= 2) breakdown.push({ label: 'Accuracy bonus', points: 20 });
  if (input.elapsedSeconds <= input.targetSeconds) breakdown.push({ label: 'Speed bonus', points: 15 });
  if (input.hintsUsed === 0) breakdown.push({ label: 'No-hint bonus', points: 20 });
  if (input.streak > 0) breakdown.push({ label: 'Streak bonus', points: Math.min(input.streak * 5, 15) });
  if (input.mistakes > 0) breakdown.push({ label: 'Mistake penalty', points: -5 * input.mistakes });

  return {
    total: breakdown.reduce((sum, item) => sum + item.points, 0),
    breakdown,
  };
}
