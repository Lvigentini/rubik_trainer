import {
  invertAlgorithm,
  type CubeState,
  type FaceName,
  type Sticker,
  type Turn,
} from './cube';
import type { LearningStageId } from './learningPath';

export type ChallengeGoalId =
  | 'sequence'
  | 'any-face-corners-uniform'
  | 'first-layer-2x2'
  | 'cube-solved-2x2'
  | 'white-cross'
  | 'first-layer-3x3'
  | 'first-two-layers'
  | 'yellow-cross'
  | 'cube-solved';

export type Challenge = {
  goal: ChallengeGoalId;
  goalText: string;
  conceptHint: string;
  setup: Turn[];
  targetMoves?: Turn[];
};

type Axis = 'x' | 'y' | 'z';
type Direction = { axis: Axis; sign: -1 | 1 };

const DIRECTIONS: Direction[] = [
  { axis: 'x', sign: 1 }, { axis: 'x', sign: -1 },
  { axis: 'y', sign: 1 }, { axis: 'y', sign: -1 },
  { axis: 'z', sign: 1 }, { axis: 'z', sign: -1 },
];

function normalOf(sticker: Sticker): Direction {
  if (sticker.nx !== 0) return { axis: 'x', sign: sticker.nx };
  if (sticker.ny !== 0) return { axis: 'y', sign: sticker.ny };
  return { axis: 'z', sign: sticker.nz as -1 | 1 };
}

function sameDirection(sticker: Sticker, d: Direction): boolean {
  const n = normalOf(sticker);
  return n.axis === d.axis && n.sign === d.sign;
}

function coord(sticker: Sticker, axis: Axis): number {
  return axis === 'x' ? sticker.x : axis === 'y' ? sticker.y : sticker.z;
}

function isCornerCubie(sticker: Sticker): boolean {
  return Math.abs(sticker.x) + Math.abs(sticker.y) + Math.abs(sticker.z) === 3;
}

function isEdgeCubie(sticker: Sticker): boolean {
  return Math.abs(sticker.x) + Math.abs(sticker.y) + Math.abs(sticker.z) === 2;
}

/** Stickers lying on face `d` (normal points along d). */
function faceStickers(state: CubeState, d: Direction): Sticker[] {
  return state.filter((s) => sameDirection(s, d));
}

/** The current colour of the centre sticker of face `d` (centres exist on 3x3). */
function centerColor(state: CubeState, d: Direction): FaceName {
  const center = state.find(
    (s) => sameDirection(s, d) && Math.abs(s.x) + Math.abs(s.y) + Math.abs(s.z) === 1,
  );
  if (!center) throw new Error('cube state is missing a centre sticker');
  return center.color;
}

function cornersUniform(state: CubeState, d: Direction): boolean {
  const corners = faceStickers(state, d).filter(isCornerCubie);
  return corners.length === 4 && corners.every((s) => s.color === corners[0].color);
}

/** Corners uniform on face d AND each adjacent side's two corner stickers match each other. */
function layerSolved2x2(state: CubeState, d: Direction): boolean {
  if (!cornersUniform(state, d)) return false;
  const layerCorners = state.filter(
    (s) => isCornerCubie(s) && coord(s, d.axis) === d.sign && !sameDirection(s, d),
  );
  const bySide = new Map<string, FaceName[]>();
  for (const s of layerCorners) {
    const n = normalOf(s);
    const key = `${n.axis}${n.sign}`;
    bySide.set(key, [...(bySide.get(key) ?? []), s.color]);
  }
  return [...bySide.values()].every((colors) => colors.every((c) => c === colors[0]));
}

/** Every sticker on cubies passing `filter` matches the current centre colour of its face. */
function matchesCenters(state: CubeState, filter: (s: Sticker) => boolean): boolean {
  return state
    .filter(filter)
    .every((s) => s.color === centerColor(state, normalOf(s)));
}

const UP: Direction = { axis: 'y', sign: 1 };
const DOWN: Direction = { axis: 'y', sign: -1 };

function whiteCross(state: CubeState): boolean {
  const crossColor = centerColor(state, UP);
  const upEdges = faceStickers(state, UP).filter(isEdgeCubie);
  if (!upEdges.every((s) => s.color === crossColor)) return false;
  // side sticker of each up-layer edge cubie must match its side centre
  return matchesCenters(state, (s) => isEdgeCubie(s) && s.y === 1 && normalOf(s).axis !== 'y');
}

function firstLayer3x3(state: CubeState): boolean {
  return matchesCenters(state, (s) => s.y === 1);
}

function firstTwoLayers(state: CubeState): boolean {
  return matchesCenters(state, (s) => s.y >= 0);
}

function yellowCross(state: CubeState): boolean {
  if (!firstTwoLayers(state)) return false;
  const downColor = centerColor(state, DOWN);
  return faceStickers(state, DOWN)
    .filter(isEdgeCubie)
    .every((s) => s.color === downColor);
}

const GOALS: Record<Exclude<ChallengeGoalId, 'sequence'>, (state: CubeState) => boolean> = {
  'any-face-corners-uniform': (state) => DIRECTIONS.some((d) => cornersUniform(state, d)),
  'first-layer-2x2': (state) => DIRECTIONS.some((d) => layerSolved2x2(state, d)),
  'cube-solved-2x2': (state) => DIRECTIONS.every((d) => cornersUniform(state, d)),
  'white-cross': whiteCross,
  'first-layer-3x3': firstLayer3x3,
  'first-two-layers': firstTwoLayers,
  'yellow-cross': yellowCross,
  'cube-solved': (state) => matchesCenters(state, () => true),
};

export function isGoalMet(goalId: Exclude<ChallengeGoalId, 'sequence'>, state: CubeState): boolean {
  return GOALS[goalId](state);
}

export function demoAlgorithm(challenge: Challenge): Turn[] {
  return challenge.goal === 'sequence' ? [] : invertAlgorithm(challenge.setup);
}

export const CHALLENGES: Record<LearningStageId, Challenge> = {
  '2x2-orientation': {
    goal: 'sequence',
    goalText: 'Do these turns in order: U, R, F — then undo them: F′, R′, U′.',
    conceptHint: 'Each letter names a face seen from the front: U is the top layer, R the right, F the front. A plain letter turns it clockwise; a ′ mark turns it back.',
    setup: [],
    targetMoves: ['U', 'R', 'F', "F'", "R'", "U'"],
  },
  '2x2-first-face': {
    goal: 'any-face-corners-uniform',
    goalText: 'Get all four stickers of one colour together on a single face.',
    conceptHint: 'Pick one colour and hunt its four corners. Insert them one at a time — R U R′ drops a corner in without scattering the rest.',
    setup: ['R', 'U', "R'", 'U', 'R', 'U2', "R'", 'U2'],
  },
  '2x2-corner-insertion': {
    goal: 'first-layer-2x2',
    goalText: 'Solve one full layer: a uniform face whose side colours also line up.',
    conceptHint: 'A face can look done while its sides are shuffled. Check the side stickers of each corner — matching neighbours mean the layer is truly solved.',
    setup: ['R', "U'", 'R', 'U2', "R'", 'U', 'R', "U'", "R'"],
  },
  '2x2-last-layer-orient': {
    goal: 'cube-solved-2x2',
    goalText: 'Restore the whole cube. The bottom layer is intact — twist the top corners until every face is one colour.',
    conceptHint: 'Count the top-colour stickers facing up. Hold an oriented corner at front-right and repeat R U R′ U R U2 R′ — the bottom fixes itself.',
    setup: ['R', 'U2', "R'", "U'", 'R', "U'", "R'"],
  },
  '2x2-last-corner-permute': {
    goal: 'cube-solved-2x2',
    goalText: 'Restore the whole cube. The corners are oriented but two of them have swapped places.',
    conceptHint: 'Find two side stickers that already match and hold them at the back. R U′ L′ U R′ U′ L U swaps the two front corners.',
    setup: ["U'", "L'", 'U', 'R', "U'", 'L', 'U', "R'"],
  },
  '3x3-white-cross': {
    goal: 'white-cross',
    goalText: 'Build the white cross: four white edges up, each side colour matching its centre.',
    conceptHint: 'Solve edges one at a time. Line the edge’s side colour up with its centre first, then bring the white sticker up.',
    setup: ['F2', "R'", 'D', "L'", 'B', 'U2'],
  },
  '3x3-first-layer-corners': {
    goal: 'first-layer-3x3',
    goalText: 'Complete the first layer: white face solved and the top row of every side matching its centre.',
    conceptHint: 'Position a white corner under its slot, then use R U R′-style triggers. Only the trigger touches the cross — it comes back every time.',
    setup: ['R', 'U', "R'", 'U', 'L', "U'", "L'", "U'"],
  },
  '3x3-middle-layer-edges': {
    goal: 'first-two-layers',
    goalText: 'Finish the first two layers by inserting the middle-layer edges.',
    conceptHint: 'Find a top edge with no yellow on it. Match its front colour to a centre, then send it left or right with the insertion trigger.',
    setup: ['U', 'R', "U'", "R'", "U'", "F'", 'U', 'F', 'U2'],
  },
  '3x3-yellow-cross': {
    goal: 'yellow-cross',
    goalText: 'Form the yellow cross without disturbing the two solved layers.',
    conceptHint: 'Look at the yellow face: dot, L, or line. Hold the L at back-left (line horizontal) and repeat F R U R′ U′ F′ to advance one shape at a time.',
    setup: ['F', 'R', 'U', "R'", "U'", "F'", 'U2'],
  },
  '3x3-last-layer-finish': {
    goal: 'cube-solved',
    goalText: 'Solve the whole cube: align the cross edges, place the corners, then twist them home.',
    conceptHint: 'Work in three passes — edges to their centres, corners to their slots, then R′ D′ R D on each corner until it sits flush. Keep your grip; only turn U between corners.',
    setup: ['R', "U'", 'R', 'U', 'R', 'U', 'R', "U'", "R'", "U'", 'R2', 'U'],
  },
};
