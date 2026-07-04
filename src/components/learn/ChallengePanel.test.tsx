import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getStageById } from '../../learningPath';
import { ChallengePanel } from './ChallengePanel';
import type { Turn } from '../../cube';

/** Click the band + arrow that performs `turn` (outer turns only). */
function performTurn(turn: Turn) {
  const bar = within(screen.getByTestId('band-reference-bar'));
  const bandLabel: Record<string, RegExp> = {
    U: /top row/i, D: /bottom row/i, L: /left column/i,
    R: /right column/i, F: /front layer/i, B: /back layer/i,
  };
  fireEvent.click(bar.getByRole('button', { name: bandLabel[turn[0]] }));
  const arrow = turn.endsWith("'")
    ? /counter-clockwise/i
    : turn.endsWith('2')
      ? /180 degrees/i
      : /turn selected layer clockwise$/i;
  fireEvent.click(bar.getByRole('button', { name: arrow }));
}

const sequenceStage = getStageById('2x2-orientation')!;

describe('ChallengePanel — sequence goal', () => {
  it('tracks progress through the target moves and fires onGoalMet once', () => {
    const onGoalMet = vi.fn();
    render(<ChallengePanel stage={sequenceStage} hintLevel={0} onGoalMet={onGoalMet} />);
    expect(screen.getByText('0 / 6')).toBeInTheDocument();
    for (const turn of ['U', 'R', 'F', "F'", "R'", "U'"] as Turn[]) performTurn(turn);
    expect(onGoalMet).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/challenge complete/i)).toBeInTheDocument();
  });

  it('a wrong move resets sequence progress', () => {
    const onGoalMet = vi.fn();
    render(<ChallengePanel stage={sequenceStage} hintLevel={0} onGoalMet={onGoalMet} />);
    performTurn('U');
    expect(screen.getByText('1 / 6')).toBeInTheDocument();
    performTurn('D');
    expect(screen.getByText('0 / 6')).toBeInTheDocument();
    expect(onGoalMet).not.toHaveBeenCalled();
  });

  it('reset clears progress and re-arms onGoalMet', () => {
    const onGoalMet = vi.fn();
    render(<ChallengePanel stage={sequenceStage} hintLevel={0} onGoalMet={onGoalMet} />);
    for (const turn of ['U', 'R', 'F', "F'", "R'", "U'"] as Turn[]) performTurn(turn);
    fireEvent.click(screen.getByRole('button', { name: /reset challenge/i }));
    expect(screen.getByText('0 / 6')).toBeInTheDocument();
    for (const turn of ['U', 'R', 'F', "F'", "R'", "U'"] as Turn[]) performTurn(turn);
    expect(onGoalMet).toHaveBeenCalledTimes(2);
  });
});

describe('ChallengePanel — state goal with demo', () => {
  const stateStage = getStageById('2x2-last-layer-orient')!;

  it('starts unsolved and completes after stepping through the whole demo at hint level 3', () => {
    const onGoalMet = vi.fn();
    render(<ChallengePanel stage={stateStage} hintLevel={3} onGoalMet={onGoalMet} />);
    expect(screen.queryByText(/challenge complete/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /reset & watch/i }));
    const next = () => screen.getByRole('button', { name: /next move/i });
    for (let i = 0; i < 7; i += 1) fireEvent.click(next()); // demo = inverse of the 7-move setup
    expect(onGoalMet).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/challenge complete/i)).toBeInTheDocument();
  });

  it('hides demo stepping after a manual move until reset', () => {
    render(<ChallengePanel stage={stateStage} hintLevel={3} onGoalMet={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /reset & watch/i }));
    performTurn('U');
    expect(screen.queryByRole('button', { name: /next move/i })).not.toBeInTheDocument();
  });
});
