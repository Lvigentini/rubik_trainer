import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { InMemoryProgressStore } from '../progress/inMemoryStore';
import { ProgressProvider } from '../progress/ProgressContext';
import { ORDERED_STAGES } from '../progress/unlocks';
import { HomePage } from './HomePage';

function renderHome(store: InMemoryProgressStore) {
  return render(
    <ProgressProvider store={store}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </ProgressProvider>,
  );
}

describe('HomePage — all skills complete', () => {
  it('replaces the "Continue…" resume state with a completed state and a free-play CTA', () => {
    const store = new InMemoryProgressStore();
    ORDERED_STAGES.forEach((stage) => store.completeLesson(stage.id, 3, 0));
    renderHome(store);

    const card = within(screen.getByTestId('home-resume-card'));
    expect(
      card.getByText(`All ${ORDERED_STAGES.length} skills complete — free play or beat your best times`),
    ).toBeInTheDocument();
    expect(card.queryByText(/continue lesson/i)).not.toBeInTheDocument();
    expect(card.getByRole('button', { name: /free play/i })).toBeInTheDocument();
  });
});
