import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getStageById } from '../../learningPath';
import { ChallengePanel } from './ChallengePanel';
import type { FaceName, Turn } from '../../cube';

/** Tap the face button (by its geometric aria-label, e.g. "Select the top
 * layer (white, U)") then the matching turn button in the strip below. */
function selectFace(face: FaceName) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`, ${face}\\)$`) }));
}

function performTurn(turn: Turn) {
  selectFace(turn[0] as FaceName);
  const arrow = turn.endsWith("'")
    ? /counter-clockwise/i
    : turn.endsWith('2')
      ? /180 degrees/i
      : /turn selected layer clockwise$/i;
  fireEvent.click(screen.getByRole('button', { name: arrow }));
}

const sequenceStage = getStageById('2x2-orientation')!;

describe('ChallengePanel — sequence goal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('tracks progress through the target moves and fires onGoalMet once', () => {
    const onGoalMet = vi.fn();
    render(<ChallengePanel stage={sequenceStage} hintLevel={0} onGoalMet={onGoalMet} />);
    expect(screen.getByTestId('sequence-coach')).toHaveTextContent(/next: u —/i);
    for (const turn of ['U', 'R', 'F', "F'", "R'", "U'"] as Turn[]) performTurn(turn);
    expect(onGoalMet).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/challenge complete/i)).toBeInTheDocument();
  });

  it('a wrong move applies then auto-reverts, keeping progress unchanged', () => {
    const onGoalMet = vi.fn();
    render(<ChallengePanel stage={sequenceStage} hintLevel={0} onGoalMet={onGoalMet} />);
    performTurn('U');
    expect(screen.getAllByText('✓')).toHaveLength(1);
    expect(screen.getByTestId('sequence-coach')).toHaveTextContent(/next: r —/i);

    performTurn('D');
    expect(screen.getByText(/that was d — we need r next/i)).toBeInTheDocument();
    // Progress unchanged: still exactly one completed chip (U), not reset to zero.
    expect(screen.getAllByText('✓')).toHaveLength(1);
    expect(onGoalMet).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByText(/that was d/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('sequence-coach')).toHaveTextContent(/next: r —/i);
  });

  it('reset clears progress and re-arms onGoalMet', () => {
    const onGoalMet = vi.fn();
    render(<ChallengePanel stage={sequenceStage} hintLevel={0} onGoalMet={onGoalMet} />);
    for (const turn of ['U', 'R', 'F', "F'", "R'", "U'"] as Turn[]) performTurn(turn);
    fireEvent.click(screen.getByRole('button', { name: /reset challenge/i }));
    expect(screen.getByTestId('sequence-coach')).toHaveTextContent(/next: u —/i);
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

  it('shows the next demo move in words alongside the button', () => {
    render(<ChallengePanel stage={stateStage} hintLevel={3} onGoalMet={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /reset & watch/i }));
    expect(screen.getByText(/next move: .* — (top|bottom|left|right|front|back) layer,/i)).toBeInTheDocument();
  });

  it('hides demo stepping after a manual move until reset', () => {
    render(<ChallengePanel stage={stateStage} hintLevel={3} onGoalMet={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /reset & watch/i }));
    performTurn('U');
    expect(screen.queryByRole('button', { name: /next move/i })).not.toBeInTheDocument();
  });
});

describe('ChallengePanel — first-time guidance strip', () => {
  it('shows the how-to-move strip and can be dismissed', () => {
    render(<ChallengePanel stage={sequenceStage} hintLevel={0} onGoalMet={() => {}} />);
    const strip = within(screen.getByTestId('how-to-strip'));
    expect(strip.getByText(/tap a face to grab its layer/i)).toBeInTheDocument();
    fireEvent.click(strip.getByRole('button', { name: /dismiss how-to-move guidance/i }));
    expect(screen.queryByTestId('how-to-strip')).not.toBeInTheDocument();
  });
});

describe('ChallengePanel — labeled layer picker and view tipping', () => {
  it('selects any layer from the picker, including bottom, without tapping the cube', () => {
    render(<ChallengePanel stage={sequenceStage} hintLevel={0} onGoalMet={() => {}} />);
    const picker = within(screen.getByTestId('face-picker'));
    fireEvent.click(picker.getByRole('button', { name: /^bottom$/i }));
    expect(screen.getByText(/turn the bottom layer \(D\):/i)).toBeInTheDocument();
    expect(picker.getByRole('button', { name: /^bottom$/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('offers vertical view tipping so the bottom face can be seen', () => {
    render(<ChallengePanel stage={sequenceStage} hintLevel={0} onGoalMet={() => {}} />);
    expect(screen.getByRole('button', { name: /tip the view down to see the bottom face/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tip the view up to see the top face/i })).toBeInTheDocument();
  });
});

describe('ChallengePanel — drag-to-orbit', () => {
  it('dragging on the stage rotates the view and does not select a face', () => {
    const { container } = render(<ChallengePanel stage={sequenceStage} hintLevel={0} onGoalMet={() => {}} />);
    const stage = screen.getByLabelText(/interactive 2×2 cube preview/i);
    const cube = container.querySelector('.cube') as HTMLElement;
    expect(cube.style.transform).toBe('rotateX(-28deg) rotateY(-38deg)');
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 100, clientY: 100, isPrimary: true });
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 140, clientY: 100 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 140, clientY: 100 });
    expect(cube.style.transform).toBe('rotateX(-28deg) rotateY(-22deg)');
    expect(screen.getByText(/tap a face of the cube to grab its layer/i)).toBeInTheDocument();
  });
});

describe('ChallengePanel — tap vs drag discrimination', () => {
  it('a tap with tiny movement still selects the face (no spurious click suppression)', () => {
    render(<ChallengePanel stage={sequenceStage} hintLevel={0} onGoalMet={() => {}} />);
    const stage = screen.getByLabelText(/interactive 2×2 cube preview/i);
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 100, clientY: 100, isPrimary: true });
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 102, clientY: 101 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 102, clientY: 101 });
    selectFace('F');
    expect(screen.getByText(/turn the front layer \(F\):/i)).toBeInTheDocument();
  });
});

describe('ChallengePanel — 3×3 sticker-level layer selection', () => {
  const crossStage = getStageById('3x3-white-cross')!;

  function frontFaceStickers() {
    const frontFace = screen.getByRole('button', { name: /, F\)$/ });
    return within(frontFace).getAllByTestId('cube-sticker');
  }

  it('tapping a corner tile still selects the whole face', () => {
    render(<ChallengePanel stage={crossStage} hintLevel={0} onGoalMet={() => {}} />);
    fireEvent.click(frontFaceStickers()[0]); // top-left corner
    expect(screen.getByText(/turn the front layer \(F\):/i)).toBeInTheDocument();
  });

  it('tapping an edge-middle tile selects the slice along it, and the rail turns it', () => {
    render(<ChallengePanel stage={crossStage} hintLevel={0} onGoalMet={() => {}} />);
    // Front face, middle-left tile (index 3): y=0 -> the E (equator) slice.
    fireEvent.click(frontFaceStickers()[3]);
    expect(screen.getByText(/turn the equator slice \(E\):/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /turn selected layer clockwise$/i }));
    // The turn actually applied: selecting the same tile again still shows the
    // E slice heading (a no-op face-turn would have reset selection to null).
    expect(screen.getByText(/turn the equator slice \(E\):/i)).toBeInTheDocument();
  });

  it('the centre tile toggles between its two slices on repeated taps', () => {
    render(<ChallengePanel stage={crossStage} hintLevel={0} onGoalMet={() => {}} />);
    const centre = () => frontFaceStickers()[4];
    // Front face centre sits between M (x=0) and E (y=0); M wins the first tap.
    fireEvent.click(centre());
    expect(screen.getByText(/turn the middle slice \(M\):/i)).toBeInTheDocument();
    fireEvent.click(centre());
    expect(screen.getByText(/turn the equator slice \(E\):/i)).toBeInTheDocument();
    fireEvent.click(centre());
    expect(screen.getByText(/turn the middle slice \(M\):/i)).toBeInTheDocument();
  });

  it('no whitish selected-face veil is applied for a slice selection', () => {
    const { container } = render(<ChallengePanel stage={crossStage} hintLevel={0} onGoalMet={() => {}} />);
    fireEvent.click(frontFaceStickers()[3]); // selects the E slice
    expect(container.querySelector('.selected-face')).not.toBeInTheDocument();
  });
});
