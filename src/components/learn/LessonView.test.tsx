import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ProgressProvider, useProgress } from '../../progress/ProgressContext';
import { getStageById } from '../../learningPath';
import { getSelfCheckById } from '../../selfChecks';
import { LessonView } from './LessonView';
import type { Turn } from '../../cube';

const stage = getStageById('2x2-orientation')!;

function performTurn(turn: Turn) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`, ${turn[0]}\\)$`) }));
  fireEvent.click(screen.getByRole('button', {
    name: turn.endsWith("'") ? /counter-clockwise/i : /turn selected layer clockwise$/i,
  }));
}

function Chip() {
  const snapshot = useProgress();
  return <output data-testid="lesson-count">{Object.keys(snapshot.lessons).length}</output>;
}

function renderLesson() {
  return render(
    <ProgressProvider>
      <MemoryRouter>
        <LessonView stage={stage} onPractice={() => {}} />
        <Chip />
      </MemoryRouter>
    </ProgressProvider>,
  );
}

function completeChallenge() {
  for (const turn of ['U', 'R', 'F', "F'", "R'", "U'"] as Turn[]) performTurn(turn);
}

function answerSelfCheckCorrectly() {
  const check = getSelfCheckById(stage.selfCheckIds[0])!;
  const correct = check.options.find((o) => check.answerIds.includes(o.id))!;
  const card = within(screen.getByTestId('self-check-card'));
  fireEvent.click(card.getByRole('button', { name: correct.label }));
}

describe('LessonView completion flow', () => {
  it('records completion with mastery 3 after hint-free challenge + first-try self-check', () => {
    renderLesson();
    expect(screen.getByTestId('lesson-count')).toHaveTextContent('0');
    completeChallenge();
    answerSelfCheckCorrectly();
    expect(screen.getByTestId('lesson-count')).toHaveTextContent('1');
    expect(screen.getByLabelText('Mastery 3 of 3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /next lesson/i })).toHaveAttribute(
      'href', '/learn/2x2-first-face',
    );
  });

  it('self-check alone does not complete the lesson (challenge gate)', () => {
    renderLesson();
    answerSelfCheckCorrectly();
    expect(screen.getByTestId('lesson-count')).toHaveTextContent('0');
    completeChallenge();
    expect(screen.getByTestId('lesson-count')).toHaveTextContent('1');
    expect(screen.getByText(/lesson complete/i)).toBeInTheDocument();
  });

  it('using the nudge caps nothing, but a self-check retry drops mastery to 2', () => {
    renderLesson();
    completeChallenge();
    const check = getSelfCheckById(stage.selfCheckIds[0])!;
    const wrong = check.options.find((o) => !check.answerIds.includes(o.id))!;
    const card = within(screen.getByTestId('self-check-card'));
    fireEvent.click(card.getByRole('button', { name: wrong.label }));
    fireEvent.click(card.getByRole('button', { name: /try again/i }));
    answerSelfCheckCorrectly();
    expect(screen.getByLabelText('Mastery 2 of 3')).toBeInTheDocument();
  });
});
