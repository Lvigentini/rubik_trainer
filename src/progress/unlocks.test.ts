import { describe, expect, it } from 'vitest';
import { InMemoryProgressStore } from './inMemoryStore';
import type { LearningStageId } from '../learningPath';
import {
  getCompletedCount,
  getCurrentStageId,
  getGroupProgress,
  getNextStageId,
  isStageUnlocked,
} from './unlocks';
import { emptySnapshot } from './types';

function snapshotWithCompleted(stageIds: LearningStageId[]) {
  const store = new InMemoryProgressStore(() => new Date('2026-07-04T10:00:00Z'));
  for (const id of stageIds) store.completeLesson(id, 3, 0);
  return store.getSnapshot();
}

const ALL_2X2: LearningStageId[] = [
  '2x2-orientation',
  '2x2-first-face',
  '2x2-corner-insertion',
  '2x2-last-layer-orient',
  '2x2-last-corner-permute',
];

describe('isStageUnlocked', () => {
  it('unlocks only the first stage on a fresh snapshot', () => {
    const snap = emptySnapshot();
    expect(isStageUnlocked('2x2-orientation', snap)).toBe(true);
    expect(isStageUnlocked('2x2-first-face', snap)).toBe(false);
    expect(isStageUnlocked('3x3-white-cross', snap)).toBe(false);
  });

  it('completing a stage unlocks the next one', () => {
    const snap = snapshotWithCompleted(['2x2-orientation']);
    expect(isStageUnlocked('2x2-first-face', snap)).toBe(true);
    expect(isStageUnlocked('2x2-corner-insertion', snap)).toBe(false);
  });

  it('keeps completed stages unlocked (redoable)', () => {
    const snap = snapshotWithCompleted(['2x2-orientation']);
    expect(isStageUnlocked('2x2-orientation', snap)).toBe(true);
  });

  it('locks the 3x3 group until the whole 2x2 foundation is complete', () => {
    const partial = snapshotWithCompleted(ALL_2X2.slice(0, 4));
    expect(isStageUnlocked('3x3-white-cross', partial)).toBe(false);
    const full = snapshotWithCompleted(ALL_2X2);
    expect(isStageUnlocked('3x3-white-cross', full)).toBe(true);
  });

  it('a tested-out (completed) later stage is unlocked even if predecessors are not', () => {
    const snap = snapshotWithCompleted(['3x3-yellow-cross']);
    expect(isStageUnlocked('3x3-yellow-cross', snap)).toBe(true);
    expect(isStageUnlocked('3x3-last-layer-finish', snap)).toBe(false); // 3x3 gate still applies
  });
});

describe('selectors', () => {
  it('getNextStageId walks level order and returns undefined at the end', () => {
    expect(getNextStageId('2x2-orientation')).toBe('2x2-first-face');
    expect(getNextStageId('2x2-last-corner-permute')).toBe('3x3-white-cross');
    expect(getNextStageId('3x3-last-layer-finish')).toBeUndefined();
  });

  it('getCurrentStageId returns the first incomplete stage in level order', () => {
    expect(getCurrentStageId(emptySnapshot())).toBe('2x2-orientation');
    expect(getCurrentStageId(snapshotWithCompleted(['2x2-orientation']))).toBe('2x2-first-face');
    expect(getCurrentStageId(snapshotWithCompleted(['2x2-orientation', '2x2-corner-insertion'])))
      .toBe('2x2-first-face');
  });

  it('getCurrentStageId falls back to the last stage when everything is complete', () => {
    const snap = snapshotWithCompleted([...ALL_2X2,
      '3x3-white-cross', '3x3-first-layer-corners', '3x3-middle-layer-edges',
      '3x3-yellow-cross', '3x3-last-layer-finish']);
    expect(getCurrentStageId(snap)).toBe('3x3-last-layer-finish');
  });

  it('counts overall and per-group progress', () => {
    const snap = snapshotWithCompleted(['2x2-orientation', '2x2-first-face']);
    expect(getCompletedCount(snap)).toEqual({ done: 2, total: 10 });
    expect(getGroupProgress('2x2-foundation', snap)).toEqual({ done: 2, total: 5 });
    expect(getGroupProgress('3x3-beginner', snap)).toEqual({ done: 0, total: 5 });
  });
});
