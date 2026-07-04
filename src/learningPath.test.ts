import { describe, expect, it } from 'vitest';
import { LEARNING_STAGES, getStageById, getStagesForGroup } from './learningPath';
import { SELF_CHECKS, checkAnswer, getSelfCheckById } from './selfChecks';
import { VIDEO_REFERENCES, getVideosForStage } from './videos';

describe('learning path data', () => {
  it('has at least 10 stages', () => {
    expect(LEARNING_STAGES.length).toBeGreaterThanOrEqual(10);
  });

  it('stages have ordered levels', () => {
    for (let i = 1; i < LEARNING_STAGES.length; i++) {
      expect(LEARNING_STAGES[i].level).toBeGreaterThanOrEqual(LEARNING_STAGES[i - 1].level);
    }
  });

  it('every stage has at least one outcome', () => {
    for (const stage of LEARNING_STAGES) {
      expect(stage.outcome.length).toBeGreaterThan(0);
    }
  });

  it('every stage has at least one self-check reference', () => {
    for (const stage of LEARNING_STAGES) {
      expect(stage.selfCheckIds.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('2x2 foundation has 5 stages', () => {
    expect(getStagesForGroup('2x2-foundation')).toHaveLength(5);
  });

  it('3x3 beginner has 5 stages', () => {
    expect(getStagesForGroup('3x3-beginner')).toHaveLength(5);
  });

  it('getStageById returns correct stage', () => {
    const stage = getStageById('2x2-orientation');
    expect(stage?.title).toBe('Orientation and notation');
  });
});

describe('self-checks', () => {
  it('has at least one self-check per learning stage', () => {
    for (const stage of LEARNING_STAGES) {
      for (const checkId of stage.selfCheckIds) {
        expect(getSelfCheckById(checkId)).toBeDefined();
      }
    }
  });

  it('checkAnswer validates correctly', () => {
    const check = SELF_CHECKS[0];
    expect(checkAnswer(check, check.answerIds)).toBe(true);
    expect(checkAnswer(check, ['wrong'])).toBe(false);
  });

  it('every option has an explanation', () => {
    for (const check of SELF_CHECKS) {
      for (const option of check.options) {
        expect(option.explanation.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('video references', () => {
  it('has at least 3 videos', () => {
    expect(VIDEO_REFERENCES.length).toBeGreaterThanOrEqual(3);
  });

  it('getVideosForStage returns relevant videos', () => {
    const videos = getVideosForStage('2x2-orientation');
    expect(videos.length).toBeGreaterThanOrEqual(1);
    expect(videos[0].creator).toBe('J Perm');
  });

  it('every video has required fields', () => {
    for (const video of VIDEO_REFERENCES) {
      expect(video.url).toMatch(/^https:\/\//);
      expect(video.duration.length).toBeGreaterThan(0);
      expect(video.recommendedForStageIds.length).toBeGreaterThan(0);
    }
  });
});
