import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { InMemoryProgressStore } from '../../progress/inMemoryStore';
import { ProgressProvider } from '../../progress/ProgressContext';
import { getStageById } from '../../learningPath';
import { getSelfCheckById } from '../../selfChecks';
import { LockedLessonView } from './LockedLessonView';

const stage = getStageById('2x2-first-face')!;

function renderLocked(store = new InMemoryProgressStore()) {
  render(
    <ProgressProvider store={store}>
      <MemoryRouter>
        <LockedLessonView stage={stage} />
      </MemoryRouter>
    </ProgressProvider>,
  );
  return store;
}

describe('LockedLessonView', () => {
  it('names the prerequisite lesson', () => {
    renderLocked();
    expect(screen.getByText(/orientation and notation/i)).toBeInTheDocument();
  });

  it('test-out completes the stage at mastery 2 when all checks pass', () => {
    const store = renderLocked();
    fireEvent.click(screen.getByRole('button', { name: /test out of this lesson/i }));
    const check = getSelfCheckById(stage.selfCheckIds[0])!;
    const correct = check.options.find((o) => check.answerIds.includes(o.id))!;
    fireEvent.click(within(screen.getByTestId('self-check-card')).getByRole('button', { name: correct.label }));
    expect(store.getSnapshot().lessons[stage.id]).toMatchObject({ mastery: 2, hintsUsed: 0 });
  });

  it('a wrong answer shows the retry message and does not complete', () => {
    const store = renderLocked();
    fireEvent.click(screen.getByRole('button', { name: /test out of this lesson/i }));
    const check = getSelfCheckById(stage.selfCheckIds[0])!;
    const wrong = check.options.find((o) => !check.answerIds.includes(o.id))!;
    fireEvent.click(within(screen.getByTestId('self-check-card')).getByRole('button', { name: wrong.label }));
    expect(screen.getByText(/not yet — review the earlier lessons or try again/i)).toBeInTheDocument();
    expect(store.getSnapshot().lessons[stage.id]).toBeUndefined();
  });
});
