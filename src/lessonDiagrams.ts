import type { FaceName } from './cube';
import type { LearningStageId } from './learningPath';

export type FaceDiagram = {
  size: 2 | 3;
  stickers: FaceName[];
};

export type DiagramState = {
  label: string;
  faces: Record<string, FaceDiagram>;
};

export type LessonDiagramSet = {
  stageId: LearningStageId;
  before: DiagramState;
  after?: DiagramState;
};

const SOLVED_2X2_WHITE: FaceDiagram = { size: 2, stickers: ['D', 'D', 'D', 'D'] };
const UNSOLVED_2X2_TOP: FaceDiagram = { size: 2, stickers: ['U', 'F', 'R', 'U'] };
const SOLVED_2X2_TOP: FaceDiagram = { size: 2, stickers: ['U', 'U', 'U', 'U'] };

const SOLVED_3X3_WHITE: FaceDiagram = { size: 3, stickers: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D'] };
const CROSS_3X3: FaceDiagram = { size: 3, stickers: ['F', 'D', 'R', 'D', 'D', 'D', 'L', 'D', 'B'] };
const YELLOW_DOT: FaceDiagram = { size: 3, stickers: ['R', 'F', 'L', 'R', 'U', 'L', 'B', 'B', 'F'] };
const YELLOW_CROSS: FaceDiagram = { size: 3, stickers: ['R', 'U', 'L', 'U', 'U', 'U', 'B', 'U', 'F'] };

export const LESSON_DIAGRAMS: LessonDiagramSet[] = [
  {
    stageId: '2x2-orientation',
    before: {
      label: 'Solved 2x2 — identify U, F, R faces',
      faces: {
        U: { size: 2, stickers: ['U', 'U', 'U', 'U'] },
        F: { size: 2, stickers: ['F', 'F', 'F', 'F'] },
        R: { size: 2, stickers: ['R', 'R', 'R', 'R'] },
      },
    },
  },
  {
    stageId: '2x2-first-face',
    before: {
      label: 'Scrambled — white corners scattered',
      faces: {
        D: { size: 2, stickers: ['D', 'F', 'R', 'D'] },
      },
    },
    after: {
      label: 'First face solved with matching sides',
      faces: {
        D: SOLVED_2X2_WHITE,
      },
    },
  },
  {
    stageId: '2x2-corner-insertion',
    before: {
      label: 'Two corners solved, one in top layer ready to insert',
      faces: {
        D: { size: 2, stickers: ['D', 'D', 'F', 'R'] },
        U: UNSOLVED_2X2_TOP,
      },
    },
    after: {
      label: 'All first-layer corners placed',
      faces: {
        D: SOLVED_2X2_WHITE,
      },
    },
  },
  {
    stageId: '2x2-last-layer-orient',
    before: {
      label: 'First layer solved, top not oriented',
      faces: {
        U: UNSOLVED_2X2_TOP,
      },
    },
    after: {
      label: 'Top face is one solid color',
      faces: {
        U: SOLVED_2X2_TOP,
      },
    },
  },
  {
    stageId: '2x2-last-corner-permute',
    before: {
      label: 'Top oriented but corners not in position',
      faces: {
        U: SOLVED_2X2_TOP,
        F: { size: 2, stickers: ['R', 'L', 'F', 'F'] },
      },
    },
    after: {
      label: 'Fully solved',
      faces: {
        U: SOLVED_2X2_TOP,
        F: { size: 2, stickers: ['F', 'F', 'F', 'F'] },
      },
    },
  },
  {
    stageId: '3x3-white-cross',
    before: {
      label: 'Scrambled bottom — no cross',
      faces: {
        D: { size: 3, stickers: ['F', 'R', 'B', 'L', 'D', 'R', 'U', 'F', 'D'] },
      },
    },
    after: {
      label: 'White cross with aligned edges',
      faces: {
        D: CROSS_3X3,
      },
    },
  },
  {
    stageId: '3x3-first-layer-corners',
    before: {
      label: 'Cross done, corners not placed',
      faces: {
        D: CROSS_3X3,
      },
    },
    after: {
      label: 'First layer complete',
      faces: {
        D: SOLVED_3X3_WHITE,
      },
    },
  },
  {
    stageId: '3x3-middle-layer-edges',
    before: {
      label: 'First layer done, middle edges unsolved',
      faces: {
        D: SOLVED_3X3_WHITE,
        F: { size: 3, stickers: ['U', 'R', 'U', 'F', 'F', 'R', 'F', 'F', 'F'] },
      },
    },
    after: {
      label: 'First two layers complete',
      faces: {
        D: SOLVED_3X3_WHITE,
        F: { size: 3, stickers: ['F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F'] },
      },
    },
  },
  {
    stageId: '3x3-yellow-cross',
    before: {
      label: 'Top face — dot or L-shape',
      faces: {
        U: YELLOW_DOT,
      },
    },
    after: {
      label: 'Yellow cross formed',
      faces: {
        U: YELLOW_CROSS,
      },
    },
  },
  {
    stageId: '3x3-last-layer-finish',
    before: {
      label: 'Yellow cross done, corners not positioned',
      faces: {
        U: YELLOW_CROSS,
      },
    },
    after: {
      label: 'Fully solved cube',
      faces: {
        U: { size: 3, stickers: ['U', 'U', 'U', 'U', 'U', 'U', 'U', 'U', 'U'] },
      },
    },
  },
];

export function getDiagramForStage(stageId: LearningStageId): LessonDiagramSet | undefined {
  return LESSON_DIAGRAMS.find((d) => d.stageId === stageId);
}
