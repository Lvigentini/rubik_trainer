import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressProvider, useProgress, useProgressStore } from './ProgressContext';

function Probe() {
  const snapshot = useProgress();
  const store = useProgressStore();
  return (
    <button onClick={() => store.completeLesson('2x2-orientation', 3, 0)}>
      completed:{Object.keys(snapshot.lessons).length}
    </button>
  );
}

describe('ProgressContext', () => {
  it('provides a working store and re-renders subscribers on mutation', () => {
    render(
      <ProgressProvider>
        <Probe />
      </ProgressProvider>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('completed:0');
    fireEvent.click(button);
    expect(button).toHaveTextContent('completed:1');
  });

  it('useProgressStore throws outside the provider', () => {
    expect(() => render(<Probe />)).toThrow(/ProgressProvider/);
  });
});
