import { describe, expect, it } from 'vitest';
import {
  APPROACHES,
  CUBE_SIZES,
  calculateLessonScore,
  getLessonsFor,
  nextRecommendedLesson,
} from './trainer';

describe('trainer curriculum', () => {
  it('starts learners on 2x2 before moving to 3x3', () => {
    expect(CUBE_SIZES.map((cube) => cube.id)).toEqual(['2x2', '3x3']);
    expect(CUBE_SIZES[0].whyFirst).toContain('corners only');
  });

  it('offers multiple solving approaches with clear tradeoffs', () => {
    expect(APPROACHES.map((approach) => approach.id)).toEqual(['guided-beginner', 'layer-by-layer', 'recognition-drills']);
    expect(APPROACHES.every((approach) => approach.bestFor.length > 0 && approach.tradeoff.length > 0)).toBe(true);
  });

  it('returns focused 2x2 lessons for beginner training', () => {
    const lessons = getLessonsFor('2x2', 'guided-beginner');

    expect(lessons.length).toBeGreaterThanOrEqual(4);
    expect(lessons[0]).toMatchObject({
      cubeSize: '2x2',
      approach: 'guided-beginner',
      title: 'Orientation and notation',
    });
    expect(lessons.some((lesson) => lesson.title.includes('first layer'))).toBe(true);
    expect(lessons.every((lesson) => lesson.successCriteria.length >= 2)).toBe(true);
  });

  it('scores completion with explicit bonuses', () => {
    const score = calculateLessonScore({
      completed: true,
      optimalMoves: 9,
      actualMoves: 10,
      elapsedSeconds: 55,
      targetSeconds: 90,
      hintsUsed: 0,
      mistakes: 1,
      streak: 3,
    });

    expect(score.total).toBe(165);
    expect(score.breakdown).toEqual([
      { label: 'Completion', points: 100 },
      { label: 'Accuracy bonus', points: 20 },
      { label: 'Speed bonus', points: 15 },
      { label: 'No-hint bonus', points: 20 },
      { label: 'Streak bonus', points: 15 },
      { label: 'Mistake penalty', points: -5 },
    ]);
  });

  it('does not award completion bonuses before a lesson is complete', () => {
    const score = calculateLessonScore({
      completed: false,
      optimalMoves: 8,
      actualMoves: 7,
      elapsedSeconds: 20,
      targetSeconds: 60,
      hintsUsed: 0,
      mistakes: 0,
      streak: 2,
    });

    expect(score.total).toBe(0);
    expect(score.breakdown).toEqual([{ label: 'Incomplete lesson', points: 0 }]);
  });

  it('recommends the earliest unfinished lesson in the selected path', () => {
    const firstOpen = nextRecommendedLesson('2x2', 'guided-beginner', ['2x2-orientation']);

    expect(firstOpen?.id).toBe('2x2-first-layer');
  });
});
