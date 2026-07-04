import type { LearningStageId } from '../learningPath';
import type { CubeSizeId } from '../trainer';

export type Mastery = 1 | 2 | 3;

export type LessonProgress = {
  completedAt: string;
  mastery: Mastery;
  hintsUsed: number;
  attempts: number;
};

export type SelfCheckProgress = {
  attempts: number;
  lastCorrectAt?: string;
};

export type PracticeSession = {
  cubeSize: CubeSizeId;
  mode: 'free' | 'coach' | 'scan';
  moves: number;
  elapsedMs?: number;
  solved: boolean;
};

export type ProgressSnapshot = {
  version: 1;
  lessons: Partial<Record<LearningStageId, LessonProgress>>;
  selfChecks: Record<string, SelfCheckProgress>;
  practice: {
    totalSessions: number;
    totalMoves: number;
    bestTimeMsBySize: Partial<Record<CubeSizeId, number>>;
  };
  streak: { current: number; best: number; lastActiveDate: string };
};

export interface ProgressStore {
  getSnapshot(): ProgressSnapshot;
  completeLesson(stageId: LearningStageId, mastery: Mastery, hintsUsed: number): void;
  recordSelfCheck(stageId: LearningStageId, checkId: string, correct: boolean): void;
  recordPracticeSession(session: PracticeSession): void;
  subscribe(listener: () => void): () => void;
}

export function emptySnapshot(): ProgressSnapshot {
  return {
    version: 1,
    lessons: {},
    selfChecks: {},
    practice: { totalSessions: 0, totalMoves: 0, bestTimeMsBySize: {} },
    streak: { current: 0, best: 0, lastActiveDate: '' },
  };
}
