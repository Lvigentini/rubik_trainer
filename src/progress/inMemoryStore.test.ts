import { describe, expect, it, vi } from 'vitest';
import { InMemoryProgressStore } from './inMemoryStore';

function makeStore(startDate = '2026-07-04T10:00:00Z') {
  let current = new Date(startDate);
  const store = new InMemoryProgressStore(() => current);
  return { store, setDate: (iso: string) => { current = new Date(iso); } };
}

describe('InMemoryProgressStore — lessons', () => {
  it('starts with the empty v1 snapshot', () => {
    const { store } = makeStore();
    const snap = store.getSnapshot();
    expect(snap.version).toBe(1);
    expect(snap.lessons).toEqual({});
    expect(snap.streak).toEqual({ current: 0, best: 0, lastActiveDate: '' });
  });

  it('records lesson completion with mastery, hints, and attempts', () => {
    const { store } = makeStore();
    store.completeLesson('2x2-orientation', 2, 1);
    const lesson = store.getSnapshot().lessons['2x2-orientation'];
    expect(lesson).toMatchObject({ mastery: 2, hintsUsed: 1, attempts: 1 });
    expect(lesson?.completedAt).toBe('2026-07-04T10:00:00.000Z');
  });

  it('keeps the best mastery when a lesson is redone, and counts attempts', () => {
    const { store } = makeStore();
    store.completeLesson('2x2-orientation', 3, 0);
    store.completeLesson('2x2-orientation', 1, 3);
    const lesson = store.getSnapshot().lessons['2x2-orientation'];
    expect(lesson?.mastery).toBe(3);
    expect(lesson?.attempts).toBe(2);
  });

  it('only overwrites hintsUsed when the redo actually improves mastery', () => {
    const { store } = makeStore();
    store.completeLesson('2x2-orientation', 3, 0);
    store.completeLesson('2x2-orientation', 1, 3); // worse mastery — hintsUsed must not regress
    expect(store.getSnapshot().lessons['2x2-orientation']?.hintsUsed).toBe(0);

    store.completeLesson('2x2-first-face', 1, 2);
    store.completeLesson('2x2-first-face', 3, 5); // strictly better mastery — hintsUsed updates
    const lesson = store.getSnapshot().lessons['2x2-first-face'];
    expect(lesson).toMatchObject({ mastery: 3, hintsUsed: 5 });
  });

  it('does not mutate previously returned snapshots', () => {
    const { store } = makeStore();
    const before = store.getSnapshot();
    store.completeLesson('2x2-orientation', 3, 0);
    expect(before.lessons['2x2-orientation']).toBeUndefined();
  });
});

describe('InMemoryProgressStore — streak', () => {
  it('first activity starts the streak at 1', () => {
    const { store } = makeStore();
    store.completeLesson('2x2-orientation', 3, 0);
    expect(store.getSnapshot().streak).toMatchObject({ current: 1, best: 1, lastActiveDate: '2026-07-04' });
  });

  it('consecutive-day activity increments; same-day does not', () => {
    const { store, setDate } = makeStore();
    store.completeLesson('2x2-orientation', 3, 0);
    store.completeLesson('2x2-first-face', 3, 0); // same day
    expect(store.getSnapshot().streak.current).toBe(1);
    setDate('2026-07-05T09:00:00Z');
    store.completeLesson('2x2-corner-insertion', 3, 0);
    expect(store.getSnapshot().streak).toMatchObject({ current: 2, best: 2 });
  });

  it('a gap of one or more days resets the streak to 1 and keeps best', () => {
    const { store, setDate } = makeStore();
    store.completeLesson('2x2-orientation', 3, 0);
    setDate('2026-07-05T09:00:00Z');
    store.completeLesson('2x2-first-face', 3, 0);
    setDate('2026-07-08T09:00:00Z');
    store.completeLesson('2x2-corner-insertion', 3, 0);
    expect(store.getSnapshot().streak).toMatchObject({ current: 1, best: 2 });
  });

  it('practice sessions count as streak activity too', () => {
    const { store } = makeStore();
    store.recordPracticeSession({ cubeSize: '2x2', mode: 'free', moves: 12, solved: false });
    expect(store.getSnapshot().streak.current).toBe(1);
  });
});

describe('InMemoryProgressStore — self-checks and practice', () => {
  it('tracks self-check attempts and last correct time', () => {
    const { store } = makeStore();
    store.recordSelfCheck('2x2-orientation', '2x2-orientation-check', false);
    store.recordSelfCheck('2x2-orientation', '2x2-orientation-check', true);
    const check = store.getSnapshot().selfChecks['2x2-orientation:2x2-orientation-check'];
    expect(check?.attempts).toBe(2);
    expect(check?.lastCorrectAt).toBe('2026-07-04T10:00:00.000Z');
  });

  it('an incorrect answer never clears an earlier lastCorrectAt', () => {
    const { store } = makeStore();
    store.recordSelfCheck('2x2-orientation', '2x2-orientation-check', true);
    store.recordSelfCheck('2x2-orientation', '2x2-orientation-check', false);
    const check = store.getSnapshot().selfChecks['2x2-orientation:2x2-orientation-check'];
    expect(check?.lastCorrectAt).toBe('2026-07-04T10:00:00.000Z');
  });

  it('accumulates practice totals and keeps only the best solved time per size', () => {
    const { store } = makeStore();
    store.recordPracticeSession({ cubeSize: '2x2', mode: 'free', moves: 30, elapsedMs: 90_000, solved: true });
    store.recordPracticeSession({ cubeSize: '2x2', mode: 'coach', moves: 20, elapsedMs: 60_000, solved: true });
    store.recordPracticeSession({ cubeSize: '2x2', mode: 'free', moves: 40, elapsedMs: 50_000, solved: false });
    const practice = store.getSnapshot().practice;
    expect(practice.totalSessions).toBe(3);
    expect(practice.totalMoves).toBe(90);
    expect(practice.bestTimeMsBySize['2x2']).toBe(60_000);
  });

  it('clamps negative moves to 0 instead of letting totals go negative', () => {
    const { store } = makeStore();
    store.recordPracticeSession({ cubeSize: '2x2', mode: 'free', moves: -5, solved: false });
    expect(store.getSnapshot().practice.totalMoves).toBe(0);
  });
});

describe('InMemoryProgressStore — subscribe', () => {
  it('notifies listeners on every mutation and supports unsubscribe', () => {
    const { store } = makeStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.completeLesson('2x2-orientation', 3, 0);
    store.recordPracticeSession({ cubeSize: '2x2', mode: 'free', moves: 1, solved: false });
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    store.completeLesson('2x2-first-face', 3, 0);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
