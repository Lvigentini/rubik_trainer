export type SelfCheckOption = {
  id: string;
  label: string;
  explanation: string;
};

export type SelfCheck = {
  id: string;
  prompt: string;
  type: 'multiple-choice' | 'visual-choice' | 'sequence';
  options: SelfCheckOption[];
  answerIds: string[];
};

export const SELF_CHECKS: SelfCheck[] = [
  {
    id: '2x2-orientation-check',
    prompt: 'You hold the cube with white on top and green facing you. What color is the R face?',
    type: 'multiple-choice',
    options: [
      { id: 'red', label: 'Red', explanation: 'Correct! With white on top and green in front, red is on the right.' },
      { id: 'blue', label: 'Blue', explanation: 'Blue is opposite green, so it\'s the back face, not the right.' },
      { id: 'orange', label: 'Orange', explanation: 'Orange is opposite red, so it\'s the left face.' },
      { id: 'yellow', label: 'Yellow', explanation: 'Yellow is opposite white, so it\'s the bottom face.' },
    ],
    answerIds: ['red'],
  },
  {
    id: '2x2-first-face-check',
    prompt: 'You solved the white face, but side stickers don\'t match. Is the first layer complete?',
    type: 'multiple-choice',
    options: [
      { id: 'yes', label: 'Yes, colors on top are enough', explanation: 'No — a solved face with mismatched sides means corners are in wrong positions.' },
      { id: 'no', label: 'No, side stickers must also match', explanation: 'Correct! The side colors must form matching bands for the layer to be complete.' },
    ],
    answerIds: ['no'],
  },
  {
    id: '2x2-corner-insertion-check',
    prompt: 'Before inserting a corner, what must you check?',
    type: 'multiple-choice',
    options: [
      { id: 'colors', label: 'All three sticker colors to find its target slot', explanation: 'Correct! Each corner has three colors that determine exactly where it belongs.' },
      { id: 'speed', label: 'How fast you can turn', explanation: 'Speed doesn\'t matter here. You need to identify the correct slot by checking all three colors.' },
      { id: 'random', label: 'Just try random moves until it works', explanation: 'Random moves will scramble solved pieces. Always identify the target slot first.' },
    ],
    answerIds: ['colors'],
  },
  {
    id: '2x2-last-layer-orient-check',
    prompt: 'During the orientation algorithm, the first layer looks broken. What should you do?',
    type: 'multiple-choice',
    options: [
      { id: 'stop', label: 'Stop and fix the first layer', explanation: 'No — the algorithm temporarily disrupts the first layer but restores it when complete.' },
      { id: 'continue', label: 'Keep going — the algorithm will restore it', explanation: 'Correct! Trust the sequence. The first layer is restored when the algorithm finishes.' },
    ],
    answerIds: ['continue'],
  },
  {
    id: '2x2-last-corner-permute-check',
    prompt: 'You see no two adjacent sides matching on the top layer. What case is this?',
    type: 'multiple-choice',
    options: [
      { id: 'adjacent', label: 'Adjacent swap', explanation: 'No — adjacent swap has two matching sides next to each other.' },
      { id: 'diagonal', label: 'Diagonal swap — do the alg once from any angle', explanation: 'Correct! No matching sides means diagonal. One application creates an adjacent case.' },
      { id: 'solved', label: 'Already solved', explanation: 'If no sides match, the corners are definitely not in position yet.' },
    ],
    answerIds: ['diagonal'],
  },
  {
    id: '3x3-white-cross-check',
    prompt: 'What must you check before placing a white edge into the cross?',
    type: 'multiple-choice',
    options: [
      { id: 'side-color', label: 'The side color matches its adjacent center', explanation: 'Correct! Align the non-white sticker with its matching center before inserting.' },
      { id: 'white-only', label: 'Only that the white sticker faces down', explanation: 'White facing down is necessary but not sufficient. The side color must also match.' },
      { id: 'any-order', label: 'Nothing — any order works', explanation: 'Order matters. Misaligned edges will cause problems in later steps.' },
    ],
    answerIds: ['side-color'],
  },
  {
    id: '3x3-first-layer-corners-check',
    prompt: 'A corner is in the correct slot but oriented wrong (white sticker faces sideways). What do you do?',
    type: 'multiple-choice',
    options: [
      { id: 'pull-out', label: 'Pull it out with R U R\' and re-insert', explanation: 'Correct! Extract the corner to the top layer, then re-insert with proper orientation.' },
      { id: 'leave', label: 'Leave it — orientation doesn\'t matter', explanation: 'Orientation absolutely matters. A misoriented corner means the layer isn\'t solved.' },
    ],
    answerIds: ['pull-out'],
  },
  {
    id: '3x3-middle-layer-check',
    prompt: 'An edge in the top layer has yellow on it. Should you insert it into the middle layer?',
    type: 'multiple-choice',
    options: [
      { id: 'no', label: 'No — yellow edges belong to the last layer', explanation: 'Correct! Only insert edges with no yellow. Yellow edges will be handled in the last layer.' },
      { id: 'yes', label: 'Yes — insert all edges', explanation: 'Yellow-containing edges belong to the top layer. Inserting them will cause problems.' },
    ],
    answerIds: ['no'],
  },
  {
    id: '3x3-yellow-cross-check',
    prompt: 'You see an L-shape of yellow edges on top. How should you hold it?',
    type: 'multiple-choice',
    options: [
      { id: 'back-left', label: 'L pointing to back and left', explanation: 'Correct! Hold the L so its two edges point toward the back-left corner, then apply the algorithm.' },
      { id: 'front-right', label: 'L pointing to front and right', explanation: 'This is rotated 180 degrees from correct. The L should point back-left.' },
      { id: 'any', label: 'Any orientation works', explanation: 'Orientation matters. Wrong positioning will create a dot instead of advancing to a line.' },
    ],
    answerIds: ['back-left'],
  },
  {
    id: '3x3-last-layer-finish-check',
    prompt: 'During corner orientation (R\' D\' R D), the cube looks completely scrambled. What should you do?',
    type: 'multiple-choice',
    options: [
      { id: 'keep-going', label: 'Keep doing R\' D\' R D until this corner is solved, then only U', explanation: 'Correct! Never rotate the cube or change grip. The scrambled look is temporary — it resolves when all corners are oriented.' },
      { id: 'start-over', label: 'Start over — something went wrong', explanation: 'Nothing is wrong. The algorithm temporarily scrambles the cube but restores everything once all corners are oriented.' },
    ],
    answerIds: ['keep-going'],
  },
];

export function getSelfCheckById(id: string): SelfCheck | undefined {
  return SELF_CHECKS.find((check) => check.id === id);
}

export function checkAnswer(selfCheck: SelfCheck, selectedIds: string[]): boolean {
  if (selectedIds.length !== selfCheck.answerIds.length) return false;
  return selfCheck.answerIds.every((id) => selectedIds.includes(id));
}
