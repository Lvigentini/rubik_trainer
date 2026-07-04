import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { InMemoryProgressStore } from '../../progress/inMemoryStore';
import { ProgressProvider } from '../../progress/ProgressContext';
import { LearnSidebar } from './LearnSidebar';

function renderSidebar(store = new InMemoryProgressStore()) {
  return render(
    <ProgressProvider store={store}>
      <MemoryRouter>
        <LearnSidebar currentStageId="2x2-orientation" />
      </MemoryRouter>
    </ProgressProvider>,
  );
}

describe('LearnSidebar', () => {
  it('shows both groups with progress counts', () => {
    renderSidebar();
    const sidebar = within(screen.getByTestId('learn-sidebar'));
    expect(sidebar.getByText('2×2 Foundation')).toBeInTheDocument();
    expect(sidebar.getByText('3×3 Beginner')).toBeInTheDocument();
    expect(sidebar.getAllByText('0/5')).toHaveLength(2);
  });

  it('marks done, current, and locked stages', () => {
    const store = new InMemoryProgressStore();
    store.completeLesson('2x2-orientation', 3, 0);
    renderSidebar(store);
    const sidebar = within(screen.getByTestId('learn-sidebar'));
    const done = sidebar.getByRole('link', { name: /orientation and notation/i });
    expect(done.className).toContain('done');
    expect(within(done).getByLabelText('Mastery 3 of 3')).toBeInTheDocument();
    expect(sidebar.getByRole('link', { name: /build one complete face/i }).className).toContain('unlocked');
    expect(sidebar.getByRole('link', { name: /white cross/i }).className).toContain('locked');
  });
});
