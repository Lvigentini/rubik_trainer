import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getStageById } from '../../learningPath';
import { HintLadder } from './HintLadder';

const stage = getStageById('2x2-first-face')!;

describe('HintLadder', () => {
  it('reveals levels progressively and reports each reveal', () => {
    const onReveal = vi.fn();
    const { rerender } = render(<HintLadder stage={stage} hintLevel={0} onReveal={onReveal} />);
    expect(screen.queryByText(/hunt its four corners/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /stuck\? get a nudge/i }));
    expect(onReveal).toHaveBeenCalledWith(1);

    rerender(<HintLadder stage={stage} hintLevel={1} onReveal={onReveal} />);
    expect(screen.getByText(/hunt its four corners/i)).toBeInTheDocument();
    expect(screen.queryByText(/common mistake/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show me the steps/i }));
    expect(onReveal).toHaveBeenCalledWith(2);

    rerender(<HintLadder stage={stage} hintLevel={2} onReveal={onReveal} />);
    expect(screen.getByText(/common mistake/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /watch the moves/i })).toBeInTheDocument();
  });

  it('never punishes: all reveal buttons stay enabled and hints stay visible', () => {
    render(<HintLadder stage={stage} hintLevel={3} onReveal={() => {}} />);
    expect(screen.getByText(/hunt its four corners/i)).toBeInTheDocument();
    expect(screen.getByText(/common mistake/i)).toBeInTheDocument();
    expect(screen.getByText(/watch the moves on the cube above/i)).toBeInTheDocument();
  });
});
