import {
  LEARNING_STAGES,
  getStagesForGroup,
  type LearningStage,
  type LearningStageId,
} from '../learningPath';
import type { ProgressSnapshot } from './types';

const ORDERED_STAGES = [...LEARNING_STAGES].sort((a, b) => a.level - b.level);

export function isStageCompleted(stageId: LearningStageId, snapshot: ProgressSnapshot): boolean {
  return snapshot.lessons[stageId] !== undefined;
}

export function isGroupCompleted(group: LearningStage['group'], snapshot: ProgressSnapshot): boolean {
  return getStagesForGroup(group).every((stage) => isStageCompleted(stage.id, snapshot));
}

export function isStageUnlocked(stageId: LearningStageId, snapshot: ProgressSnapshot): boolean {
  if (isStageCompleted(stageId, snapshot)) return true;
  const index = ORDERED_STAGES.findIndex((stage) => stage.id === stageId);
  if (index === -1) return false;
  const stage = ORDERED_STAGES[index];
  if (stage.group === '3x3-beginner' && !isGroupCompleted('2x2-foundation', snapshot)) return false;
  const previous = ORDERED_STAGES[index - 1];
  return previous === undefined || isStageCompleted(previous.id, snapshot);
}

export function getCurrentStageId(snapshot: ProgressSnapshot): LearningStageId {
  const firstIncomplete = ORDERED_STAGES.find((stage) => !isStageCompleted(stage.id, snapshot));
  return (firstIncomplete ?? ORDERED_STAGES[ORDERED_STAGES.length - 1]).id;
}

export function getCompletedCount(snapshot: ProgressSnapshot): { done: number; total: number } {
  const done = ORDERED_STAGES.filter((stage) => isStageCompleted(stage.id, snapshot)).length;
  return { done, total: ORDERED_STAGES.length };
}

export function getGroupProgress(
  group: LearningStage['group'],
  snapshot: ProgressSnapshot,
): { done: number; total: number } {
  const stages = getStagesForGroup(group);
  const done = stages.filter((stage) => isStageCompleted(stage.id, snapshot)).length;
  return { done, total: stages.length };
}

export function getNextStageId(stageId: LearningStageId): LearningStageId | undefined {
  const index = ORDERED_STAGES.findIndex((stage) => stage.id === stageId);
  return index === -1 ? undefined : ORDERED_STAGES[index + 1]?.id;
}
