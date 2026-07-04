import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Home page — agent-supported repositioning', () => {
  it('hero communicates agent-supported coaching', () => {
    render(<App />);

    expect(screen.getAllByText(/agent-supported/i).length).toBeGreaterThanOrEqual(1);
  });

  it('shows three-face scan concept above the fold', () => {
    render(<App />);

    expect(screen.getByText(/show three faces/i)).toBeInTheDocument();
  });

  it('mentions skills pathway', () => {
    render(<App />);

    expect(screen.getByText(/skill pathway/i)).toBeInTheDocument();
  });

  it('frames practice as reinforcement, not primary promise', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /free practice/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^start playing$/i })).not.toBeInTheDocument();
  });

  it('does not show score tables, move pad, or full lesson lists', () => {
    render(<App />);

    expect(screen.queryByText('Completion score preview')).not.toBeInTheDocument();
    expect(screen.queryByText('Three-face assistant')).not.toBeInTheDocument();
    expect(screen.queryByText('Level 1')).not.toBeInTheDocument();
  });

  it('renders three-panel scan visual as SVG/React', () => {
    render(<App />);

    expect(screen.getByTestId('scan-coach-preview')).toBeInTheDocument();
  });
});

describe('Learn page — progressive visual pathway', () => {
  function navigateToLearn() {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /learn/i }));
  }

  it('starts with a "Start here" panel', () => {
    navigateToLearn();

    expect(screen.getByText(/start.*2×2 skill path/i)).toBeInTheDocument();
  });

  it('first visible path is 2x2 foundation', () => {
    navigateToLearn();

    expect(screen.getByText(/2×2 Foundation/i)).toBeInTheDocument();
  });

  it('shows pathway timeline with stage progression', () => {
    navigateToLearn();

    expect(screen.getByTestId('pathway-timeline')).toBeInTheDocument();
  });

  it('lesson has diagram, steps, common mistake, self-check, and practice CTA', () => {
    navigateToLearn();

    expect(screen.getByTestId('lesson-diagram')).toBeInTheDocument();
    expect(screen.getByText(/common mistake/i)).toBeInTheDocument();
    expect(screen.getByTestId('self-check-card')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /practise this skill/i })).toBeInTheDocument();
  });

  it('has at least one self-check with correct/incorrect feedback', () => {
    navigateToLearn();

    const selfCheck = screen.getByTestId('self-check-card');
    expect(selfCheck).toBeInTheDocument();
    // Options exist
    expect(selfCheck.querySelectorAll('button').length).toBeGreaterThanOrEqual(2);
  });

  it('has at least one video reference card', () => {
    navigateToLearn();

    expect(screen.getByTestId('video-reference-card')).toBeInTheDocument();
  });

  it('does not show score cards, move pad, or timer', () => {
    navigateToLearn();

    expect(screen.queryByText('Completion score preview')).not.toBeInTheDocument();
    expect(screen.queryByText('Game mode')).not.toBeInTheDocument();
  });

  it('diagrams are data-driven SVG elements', () => {
    navigateToLearn();

    const diagram = screen.getByTestId('lesson-diagram');
    expect(diagram.querySelector('svg')).toBeInTheDocument();
  });
});

describe('Play page — scoring stays here', () => {
  function navigateToPlay() {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Play$/ }));
  }

  it('has 3D cube and game mode controls', () => {
    navigateToPlay();

    expect(screen.getByRole('heading', { name: '3D cube' })).toBeInTheDocument();
    expect(screen.getByText('Game mode')).toBeInTheDocument();
  });

  it('shows scoring in guided mode', () => {
    navigateToPlay();

    expect(screen.getByText('Completion score preview')).toBeInTheDocument();
  });
});
