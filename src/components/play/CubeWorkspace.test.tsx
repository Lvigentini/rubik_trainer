import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CubeSession } from './CubeWorkspace';
import { CubeWorkspace } from './CubeWorkspace';

/** Exposes the session via a button so a test can drive several applyMove
 * calls synchronously inside a single click handler — exactly the pattern
 * ("Finish known solve" looping over a solution) that used to collapse N
 * recorded moves down to 1 because applyMove read historyCursor from a
 * stale render-time closure. */
function BatchButton({ session }: { session: CubeSession }) {
  return (
    <button
      onClick={() => {
        session.applyMove('U');
        session.applyMove('U');
        session.applyMove('U');
      }}
    >
      apply three
    </button>
  );
}

describe('CubeWorkspace — history/cursor batching', () => {
  it('N synchronous applyMove calls in one handler record N moves, not 1', () => {
    render(<CubeWorkspace>{(session) => <BatchButton session={session} />}</CubeWorkspace>);
    fireEvent.click(screen.getByRole('button', { name: 'apply three' }));
    expect(screen.getByText('Moves').nextSibling?.textContent).toBe('3');
    const history = screen.getByTestId('move-history');
    expect(history.querySelectorAll('span')).toHaveLength(3);
  });

  it('applyMoves batches a whole turn sequence as one history update', () => {
    function FinishButton({ session }: { session: CubeSession }) {
      return <button onClick={() => session.applyMoves(['U', "R'", 'F2'])}>finish</button>;
    }
    render(<CubeWorkspace>{(session) => <FinishButton session={session} />}</CubeWorkspace>);
    fireEvent.click(screen.getByRole('button', { name: 'finish' }));
    expect(screen.getByText('Moves').nextSibling?.textContent).toBe('3');
  });

  it('undo/redo stay consistent with the batched history', () => {
    render(<CubeWorkspace>{(session) => <BatchButton session={session} />}</CubeWorkspace>);
    fireEvent.click(screen.getByRole('button', { name: 'apply three' }));
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByText('Moves').nextSibling?.textContent).toBe('3');
    const history = screen.getByTestId('move-history');
    expect(history.querySelectorAll('span.future')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(history.querySelectorAll('span.future')).toHaveLength(0);
  });
});
