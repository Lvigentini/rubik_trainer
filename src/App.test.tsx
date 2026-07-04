import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App navigation and information architecture', () => {
  it('starts on a focused home page without the full training text dump', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Practice cube solving with structure.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start playing' })).toBeInTheDocument();
    expect(screen.queryByText('Completion score preview')).not.toBeInTheDocument();
    expect(screen.queryByText('Three-face assistant')).not.toBeInTheDocument();
  });

  it('puts actual guide content in Learn and keeps scoring out of explanations', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Learn' }));

    expect(screen.getByRole('heading', { name: 'Learn the cube in stages.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Beginner method, 3×3' })).toBeInTheDocument();
    expect(screen.getByText(/Solve the white cross/)).toBeInTheDocument();
    expect(screen.getByText(/2×2 Ortega-style path/)).toBeInTheDocument();
    expect(screen.queryByText('Completion score preview')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '3D cube' })).not.toBeInTheDocument();
  });

  it('keeps game scoring on the Play page', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));

    expect(screen.getByRole('heading', { name: '3D cube' })).toBeInTheDocument();
    expect(screen.getByText('Game mode')).toBeInTheDocument();
    expect(screen.getByText('Completion score preview')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Learn the cube in stages.' })).not.toBeInTheDocument();
  });

  it('renders a real 2x2 play surface when the 2x2 game is selected', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    fireEvent.click(screen.getByRole('button', { name: '2×2 Pocket Cube' }));

    const cubeStage = screen.getByLabelText('Interactive 2×2 cube preview');
    expect(cubeStage).toHaveAttribute('data-cube-size', '2x2');
    expect(within(cubeStage).getAllByTestId('cube-sticker')).toHaveLength(24);
  });
});
