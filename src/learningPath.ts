import type { CubeSizeId } from './trainer';

export type LearningStageId =
  | '2x2-orientation'
  | '2x2-first-face'
  | '2x2-corner-insertion'
  | '2x2-last-layer-orient'
  | '2x2-last-corner-permute'
  | '3x3-white-cross'
  | '3x3-first-layer-corners'
  | '3x3-middle-layer-edges'
  | '3x3-yellow-cross'
  | '3x3-last-layer-finish';

export type LessonStep = {
  instruction: string;
  tip?: string;
};

export type LearningStage = {
  id: LearningStageId;
  title: string;
  cubeSize: CubeSizeId;
  group: '2x2-foundation' | '3x3-beginner';
  level: number;
  skill: string;
  outcome: string;
  steps: LessonStep[];
  commonMistake: string;
  practiceMode: 'guided' | 'practice';
  videoIds: string[];
  selfCheckIds: string[];
};

export const LEARNING_STAGES: LearningStage[] = [
  {
    id: '2x2-orientation',
    title: 'Orientation and notation',
    cubeSize: '2x2',
    group: '2x2-foundation',
    level: 1,
    skill: 'Identify faces and apply basic turns by name.',
    outcome: 'You can name U/R/F and apply turns without confusion.',
    steps: [
      { instruction: 'Hold the cube with one color facing you (Front) and one on top (Up).' },
      { instruction: 'The right side is R. Practice: do a U turn (top clockwise).' },
      { instruction: 'Do R (right clockwise), then F (front clockwise).' },
      { instruction: 'Undo: F\', R\', U\' returns to solved.' },
    ],
    commonMistake: 'Rotating the whole cube instead of turning a single face. Keep your grip fixed.',
    practiceMode: 'guided',
    videoIds: ['jperm-2x2'],
    selfCheckIds: ['2x2-orientation-check'],
  },
  {
    id: '2x2-first-face',
    title: 'Build one complete face',
    cubeSize: '2x2',
    group: '2x2-foundation',
    level: 2,
    skill: 'Solve four corners of one color with matching side bands.',
    outcome: 'One face is fully solved and side colors form a consistent band.',
    steps: [
      { instruction: 'Pick a color (e.g., white). Find a white corner in the bottom layer.' },
      { instruction: 'Position it below its target slot on top.' },
      { instruction: 'Use R U R\' to insert it. Repeat for all four corners.' },
      { instruction: 'Check: side stickers around the solved face should match each other.' },
    ],
    commonMistake: 'Solving the face colors but ignoring side stickers. A solved face with mismatched sides is incomplete.',
    practiceMode: 'guided',
    videoIds: ['jperm-2x2'],
    selfCheckIds: ['2x2-first-face-check'],
  },
  {
    id: '2x2-corner-insertion',
    title: 'Corner insertion techniques',
    cubeSize: '2x2',
    group: '2x2-foundation',
    level: 3,
    skill: 'Insert corners without disturbing already-solved pieces.',
    outcome: 'You can place each corner deliberately while protecting solved corners.',
    steps: [
      { instruction: 'Identify which corner needs to go where by its three colors.' },
      { instruction: 'Move the target corner to the top layer using D moves if needed.' },
      { instruction: 'Align it above its slot and insert with R U R\' or similar trigger.' },
      { instruction: 'If a solved corner gets displaced, re-insert it last.' },
    ],
    commonMistake: 'Inserting corners randomly and hoping they end up correct. Always check the three sticker colors first.',
    practiceMode: 'guided',
    videoIds: ['jperm-2x2'],
    selfCheckIds: ['2x2-corner-insertion-check'],
  },
  {
    id: '2x2-last-layer-orient',
    title: 'Orient the last layer',
    cubeSize: '2x2',
    group: '2x2-foundation',
    level: 4,
    skill: 'Turn all top stickers to one color while preserving the first layer.',
    outcome: 'Top face is one solid color; first layer remains solved.',
    steps: [
      { instruction: 'Look at the top face. Count how many corners have the top color facing up.' },
      { instruction: 'If 0 or 1: hold an oriented corner at front-right (or any position if 0).' },
      { instruction: 'Apply R U R\' U R U2 R\' until the top is one color.' },
      { instruction: 'Check that your first layer is still intact.' },
    ],
    commonMistake: 'Panicking when the first layer looks broken mid-algorithm. Trust the sequence — it restores the bottom.',
    practiceMode: 'guided',
    videoIds: ['jperm-2x2'],
    selfCheckIds: ['2x2-last-layer-orient-check'],
  },
  {
    id: '2x2-last-corner-permute',
    title: 'Permute the final corners',
    cubeSize: '2x2',
    group: '2x2-foundation',
    level: 5,
    skill: 'Move last-layer corners into their correct positions.',
    outcome: 'All six faces are solved. You can explain which corners moved.',
    steps: [
      { instruction: 'Look at the side stickers of the top layer. Find two adjacent matching sides.' },
      { instruction: 'Hold the matching pair at the back.' },
      { instruction: 'Apply R U\' L\' U R\' U\' L U to swap the front two corners.' },
      { instruction: 'If no adjacent pair exists, run the algorithm once from any angle, then find the pair.' },
    ],
    commonMistake: 'Not recognizing whether it\'s an adjacent swap or diagonal swap. Adjacent: two sides match. Diagonal: no sides match — do the alg once to create an adjacent case.',
    practiceMode: 'guided',
    videoIds: ['jperm-2x2'],
    selfCheckIds: ['2x2-last-corner-permute-check'],
  },
  {
    id: '3x3-white-cross',
    title: 'White cross with matching edges',
    cubeSize: '3x3',
    group: '3x3-beginner',
    level: 6,
    skill: 'Solve the white cross and align each edge with its side center.',
    outcome: 'White cross is solved with each edge matching its adjacent center.',
    steps: [
      { instruction: 'Find white edge pieces. Move each one to the bottom face (white center).' },
      { instruction: 'Align the side color of the edge with its matching center first.' },
      { instruction: 'Then rotate that face 180 degrees to bring the white sticker down.' },
      { instruction: 'Repeat for all four edges without disturbing already-placed ones.' },
    ],
    commonMistake: 'Placing white edges without checking the side color alignment. Always match the side color to its center before inserting.',
    practiceMode: 'guided',
    videoIds: ['jperm-3x3'],
    selfCheckIds: ['3x3-white-cross-check'],
  },
  {
    id: '3x3-first-layer-corners',
    title: 'First-layer corners',
    cubeSize: '3x3',
    group: '3x3-beginner',
    level: 7,
    skill: 'Insert corners to complete the first layer without breaking the cross.',
    outcome: 'First layer is fully solved with matching side bands.',
    steps: [
      { instruction: 'Find a white corner in the top layer.' },
      { instruction: 'Position it above its target slot (match its three colors to adjacent centers).' },
      { instruction: 'Apply R U R\' or the left-hand equivalent to insert.' },
      { instruction: 'If the corner is stuck in the bottom layer in the wrong orientation, pull it out with R U R\' first.' },
    ],
    commonMistake: 'Breaking the cross while inserting corners. Only turn the top layer (U) to position corners, then use R U R\' style triggers.',
    practiceMode: 'guided',
    videoIds: ['jperm-3x3'],
    selfCheckIds: ['3x3-first-layer-corners-check'],
  },
  {
    id: '3x3-middle-layer-edges',
    title: 'Middle-layer edges',
    cubeSize: '3x3',
    group: '3x3-beginner',
    level: 8,
    skill: 'Place middle-layer edges using left and right insertion triggers.',
    outcome: 'First two layers are complete.',
    steps: [
      { instruction: 'Find an edge in the top layer that does NOT have yellow on it.' },
      { instruction: 'Align its front color with the matching center.' },
      { instruction: 'Determine if the edge needs to go left or right.' },
      { instruction: 'Right: U R U\' R\' U\' F\' U F. Left: U\' L\' U L U F U\' F\'.' },
    ],
    commonMistake: 'Trying to insert an edge that has yellow. Yellow edges belong to the last layer — skip them.',
    practiceMode: 'guided',
    videoIds: ['jperm-3x3', 'last-layer-simple'],
    selfCheckIds: ['3x3-middle-layer-check'],
  },
  {
    id: '3x3-yellow-cross',
    title: 'Yellow cross on top',
    cubeSize: '3x3',
    group: '3x3-beginner',
    level: 9,
    skill: 'Form the yellow cross on the top face.',
    outcome: 'Yellow cross appears on top (edges oriented, not necessarily permuted).',
    steps: [
      { instruction: 'Look at the top face. You\'ll see a dot, L-shape, or line of yellow edges.' },
      { instruction: 'Hold the L at top-left (or line horizontally).' },
      { instruction: 'Apply F R U R\' U\' F\' to advance: dot→L, L→line, line→cross.' },
      { instruction: 'Repeat until the yellow cross is formed.' },
    ],
    commonMistake: 'Holding the L-shape in the wrong orientation. The L should point to the back-left corner.',
    practiceMode: 'guided',
    videoIds: ['jperm-3x3', 'last-layer-simple'],
    selfCheckIds: ['3x3-yellow-cross-check'],
  },
  {
    id: '3x3-last-layer-finish',
    title: 'Finish the last layer',
    cubeSize: '3x3',
    group: '3x3-beginner',
    level: 10,
    skill: 'Permute and orient all last-layer pieces to complete the cube.',
    outcome: 'The cube is fully solved.',
    steps: [
      { instruction: 'Align yellow cross edges with their centers using R U R\' U R U2 R\' U.' },
      { instruction: 'Position last-layer corners: find one correct corner, hold it at front-right, apply U R U\' L\' U R\' U\' L.' },
      { instruction: 'Orient last-layer corners: hold unsolved corner at front-right, repeat R\' D\' R D until that corner is solved, then U to bring next unsolved corner to front-right.' },
      { instruction: 'The cube is solved once all corners are oriented.' },
    ],
    commonMistake: 'During corner orientation, the cube looks scrambled mid-algorithm. Do NOT rotate the cube or change your grip — just keep going with R\' D\' R D until that corner is done, then only U.',
    practiceMode: 'guided',
    videoIds: ['jperm-3x3', 'last-layer-simple', 'best-method-2025'],
    selfCheckIds: ['3x3-last-layer-finish-check'],
  },
];

/** Display labels for each curriculum group — the single source of truth
 * consumed by LearnSidebar, LessonView, and HomePage (previously duplicated
 * locally in each). */
export const GROUP_LABELS: Record<LearningStage['group'], string> = {
  '2x2-foundation': '2×2 Foundation',
  '3x3-beginner': '3×3 Beginner',
};

export function getStagesForGroup(group: LearningStage['group']): LearningStage[] {
  return LEARNING_STAGES.filter((stage) => stage.group === group);
}

export function getStageById(id: LearningStageId): LearningStage | undefined {
  return LEARNING_STAGES.find((stage) => stage.id === id);
}
