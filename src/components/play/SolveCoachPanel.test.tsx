import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InMemoryProgressStore } from '../../progress/inMemoryStore';
import { emptySnapshot } from '../../progress/types';
import { SolveCoachPanel } from './SolveCoachPanel';

// A deterministic two-move scramble so the recorded move count and the
// rendered history are exact, known values.
vi.mock('../../cube', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../cube')>();
  return { ...actual, generateScramble: () => ['U', 'R'] };
});

describe('SolveCoachPanel — "Finish known solve" batches the whole solution', () => {
  it('records moves === solution length (not 1) and the history shows every move', () => {
    const store = new InMemoryProgressStore();
    const recordSpy = vi.spyOn(store, 'recordPracticeSession');
    render(<SolveCoachPanel store={store} snapshot={emptySnapshot()} />);

    fireEvent.click(screen.getByRole('button', { name: /new scramble/i }));
    fireEvent.click(screen.getByRole('button', { name: /finish known solve/i }));

    expect(recordSpy).toHaveBeenCalledTimes(1);
    // Solution for scramble ['U', 'R'] is ["R'", "U'"] — 2 moves, not 1.
    expect(recordSpy).toHaveBeenCalledWith(expect.objectContaining({ moves: 2, solved: true }));

    // History shows all 4 moves (2 scramble + 2 solution), not just 1.
    const history = within(screen.getByTestId('move-history'));
    expect(history.getAllByText(/^[URFDLBMES]/)).toHaveLength(4);

    expect(screen.getByText(/completion score/i)).toBeInTheDocument();
  });

  it('undoing the scramble back to solved (no forward moves) records nothing', () => {
    const store = new InMemoryProgressStore();
    const recordSpy = vi.spyOn(store, 'recordPracticeSession');
    render(<SolveCoachPanel store={store} snapshot={emptySnapshot()} />);

    fireEvent.click(screen.getByRole('button', { name: /new scramble/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(recordSpy).not.toHaveBeenCalled();
    expect(screen.queryByText(/completion score/i)).not.toBeInTheDocument();
  });
});
