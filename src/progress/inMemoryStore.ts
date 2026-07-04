import type { LearningStageId } from '../learningPath';
import {
  emptySnapshot,
  type Mastery,
  type PracticeSession,
  type ProgressSnapshot,
  type ProgressStore,
} from './types';

const MS_PER_DAY = 86_400_000;

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dayGap(fromDay: string, toDay: string): number {
  return Math.round((Date.parse(toDay) - Date.parse(fromDay)) / MS_PER_DAY);
}

export class InMemoryProgressStore implements ProgressStore {
  private snapshot: ProgressSnapshot = emptySnapshot();
  private listeners = new Set<() => void>();

  constructor(private now: () => Date = () => new Date()) {}

  getSnapshot(): ProgressSnapshot {
    return this.snapshot;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private update(mutate: (draft: ProgressSnapshot) => void): void {
    const draft = structuredClone(this.snapshot);
    mutate(draft);
    this.snapshot = draft;
    this.listeners.forEach((listener) => listener());
  }

  private touchStreak(draft: ProgressSnapshot): void {
    const today = isoDay(this.now());
    const last = draft.streak.lastActiveDate;
    if (last === today) return;
    draft.streak.current = last && dayGap(last, today) === 1 ? draft.streak.current + 1 : 1;
    draft.streak.best = Math.max(draft.streak.best, draft.streak.current);
    draft.streak.lastActiveDate = today;
  }

  completeLesson(stageId: LearningStageId, mastery: Mastery, hintsUsed: number): void {
    this.update((draft) => {
      const existing = draft.lessons[stageId];
      // Mastery is improve-only (never regresses on a redo); hintsUsed mirrors
      // that — it's only overwritten when this attempt actually raises mastery,
      // so a worse-mastery redo can't erase the hint count behind the best result.
      const improved = !existing || mastery > existing.mastery;
      draft.lessons[stageId] = {
        completedAt: this.now().toISOString(),
        mastery: existing ? (Math.max(existing.mastery, mastery) as Mastery) : mastery,
        hintsUsed: improved ? hintsUsed : existing!.hintsUsed,
        attempts: (existing?.attempts ?? 0) + 1,
      };
      this.touchStreak(draft);
    });
  }

  recordSelfCheck(stageId: LearningStageId, checkId: string, correct: boolean): void {
    this.update((draft) => {
      const key = `${stageId}:${checkId}`;
      const existing = draft.selfChecks[key] ?? { attempts: 0 };
      draft.selfChecks[key] = {
        attempts: existing.attempts + 1,
        lastCorrectAt: correct ? this.now().toISOString() : existing.lastCorrectAt,
      };
    });
  }

  recordPracticeSession(session: PracticeSession): void {
    this.update((draft) => {
      draft.practice.totalSessions += 1;
      draft.practice.totalMoves += Math.max(0, session.moves);
      if (session.solved && session.elapsedMs !== undefined) {
        const best = draft.practice.bestTimeMsBySize[session.cubeSize];
        if (best === undefined || session.elapsedMs < best) {
          draft.practice.bestTimeMsBySize[session.cubeSize] = session.elapsedMs;
        }
      }
      this.touchStreak(draft);
    });
  }
}
