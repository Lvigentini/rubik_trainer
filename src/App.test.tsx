import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App navigation', () => {
  it('starts on a focused home page without the full training text dump', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Practice cube solving with structure.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start playing' })).toBeInTheDocument();
    expect(screen.queryByText('Completion score preview')).not.toBeInTheDocument();
    expect(screen.queryByText('Three-face assistant')).not.toBeInTheDocument();
  });

  it('separates learning material from the game workspace', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Learn' }));
    expect(screen.getByRole('heading', { name: 'Learn the cube in stages.' })).toBeInTheDocument();
    expect(screen.getByText('Completion score preview')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '3D cube' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(screen.getByRole('heading', { name: '3D cube' })).toBeInTheDocument();
    expect(screen.getByText('Game mode')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Learn the cube in stages.' })).not.toBeInTheDocument();
  });
});
