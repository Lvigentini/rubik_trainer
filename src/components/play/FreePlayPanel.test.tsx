import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InMemoryProgressStore } from '../../progress/inMemoryStore';
import { emptySnapshot } from '../../progress/types';
import { FreePlayPanel } from './FreePlayPanel';

// A deterministic single-move scramble: solving it is just U (applied
// clockwise 4 times cancels out, since U^4 is the identity), which lets
// every test below drive a real, honest solve with plain (non-primed)
// keyboard turns and avoids depending on random scramble generation.
vi.mock('../../cube', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../cube')>();
  return { ...actual, generateScramble: () => ['U'] };
});

function pressU() {
  fireEvent.keyDown(window, { key: 'u' });
}

function scramble() {
  fireEvent.click(screen.getByRole('button', { name: /new scramble/i }));
}

function startTimer() {
  fireEvent.click(screen.getByRole('button', { name: /start timer/i }));
}

function stopTimer() {
  fireEvent.click(screen.getByRole('button', { name: /stop timer/i }));
}

afterEach(() => {
  vi.useRealTimers();
});

describe('FreePlayPanel — honest completion gating', () => {
  it('undoing the scramble back to solved records nothing and shows no score', () => {
    const store = new InMemoryProgressStore();
    const recordSpy = vi.spyOn(store, 'recordPracticeSession');
    render(<FreePlayPanel store={store} snapshot={emptySnapshot()} />);

    scramble();
    // The mocked scramble is a single 'U' — one Undo fully unwinds it back
    // to the pre-scramble solved cube, with zero forward moves recorded.
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    startTimer();
    stopTimer();

    expect(recordSpy).not.toHaveBeenCalled();
    expect(screen.queryByTestId('free-play-solved-card')).not.toBeInTheDocument();
  });

  it('stopping the timer unsolved, then solving manually, shows no Solved card and records nothing', () => {
    const store = new InMemoryProgressStore();
    const recordSpy = vi.spyOn(store, 'recordPracticeSession');
    render(<FreePlayPanel store={store} snapshot={emptySnapshot()} />);

    scramble();
    startTimer();
    stopTimer(); // cube still scrambled (unsolved) at this point
    expect(recordSpy).not.toHaveBeenCalled();

    // Solve manually, without touching the timer again: three more U turns
    // completes U^4 = identity, so the cube is genuinely solved now — but
    // that solve did not happen during the timed run that was just stopped.
    pressU();
    pressU();
    pressU();

    expect(recordSpy).not.toHaveBeenCalled();
    expect(screen.queryByTestId('free-play-solved-card')).not.toBeInTheDocument();
  });

  it('does not record a second time for the same run (no scramble/reset in between)', () => {
    const store = new InMemoryProgressStore();
    const recordSpy = vi.spyOn(store, 'recordPracticeSession');

    // Fake timers force two distinct, non-colliding elapsedMs values across
    // the two start/stop cycles below, so the second call can only be
    // blocked by the "already recorded this run" gate — not by a
    // coincidental elapsedMs match.
    vi.useFakeTimers();
    render(<FreePlayPanel store={store} snapshot={emptySnapshot()} />);

    scramble();
    pressU();
    pressU();
    pressU(); // solved (U^4)
    startTimer();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    stopTimer();
    expect(recordSpy).toHaveBeenCalledTimes(1);

    // Start/stop the timer again on the same scramble/solve, with a
    // different elapsed duration — must still not record a second session.
    startTimer();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    stopTimer();
    expect(recordSpy).toHaveBeenCalledTimes(1);
  });

  it('an exact tie of the stored best time does not claim "New best time."', () => {
    const store = new InMemoryProgressStore();
    vi.spyOn(store, 'recordPracticeSession');
    const snapshot = emptySnapshot();
    snapshot.practice.bestTimeMsBySize['2x2'] = 5000;

    vi.useFakeTimers();
    render(<FreePlayPanel store={store} snapshot={snapshot} />);

    scramble();
    pressU();
    pressU();
    pressU(); // solved (U^4)
    startTimer();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    stopTimer();

    const card = screen.getByTestId('free-play-solved-card');
    expect(within(card).queryByText(/new best time/i)).not.toBeInTheDocument();
    expect(within(card).getByText(/best: 5\.00s/i)).toBeInTheDocument();
  });
});
