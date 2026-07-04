import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { ProgressProvider } from './progress/ProgressContext';
import { CHALLENGES } from './challenges';
import { getStageById } from './learningPath';
import { getSelfCheckById } from './selfChecks';
import type { Turn } from './cube';

function renderApp(initialEntries: string[] = ['/']) {
  return render(
    <ProgressProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    </ProgressProvider>,
  );
}

describe('Home page — agent-supported repositioning', () => {
  it('hero communicates agent-supported coaching', () => {
    renderApp();

    expect(screen.getAllByText(/agent-supported/i).length).toBeGreaterThanOrEqual(1);
  });

  it('shows three-face scan concept above the fold', () => {
    renderApp();

    expect(screen.getByText(/show three faces/i)).toBeInTheDocument();
  });

  it('mentions skills pathway', () => {
    renderApp();

    expect(screen.getByText(/skill pathway/i)).toBeInTheDocument();
  });

  it('frames practice as reinforcement, not primary promise', () => {
    renderApp();

    expect(screen.getByRole('button', { name: /free practice/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^start playing$/i })).not.toBeInTheDocument();
  });

  it('does not show score tables, move pad, or full lesson lists', () => {
    renderApp();

    expect(screen.queryByText('Completion score preview')).not.toBeInTheDocument();
    expect(screen.queryByText('Three-face assistant')).not.toBeInTheDocument();
    expect(screen.queryByText('Level 1')).not.toBeInTheDocument();
  });

  it('renders three-panel scan visual as SVG/React', () => {
    renderApp();

    expect(screen.getByTestId('scan-coach-preview')).toBeInTheDocument();
  });
});

describe('Learn page — guided discovery', () => {
  function navigateToLearn() {
    renderApp(['/learn']);
  }

  it('shows the curriculum sidebar with both groups', () => {
    navigateToLearn();
    const sidebar = within(screen.getByTestId('learn-sidebar'));
    expect(sidebar.getByText(/2×2 Foundation/i)).toBeInTheDocument();
    expect(sidebar.getByText(/3×3 Beginner/i)).toBeInTheDocument();
  });

  it('opens on the challenge, with hints hidden until asked', () => {
    navigateToLearn();
    expect(screen.getByTestId('challenge-panel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stuck\? get a nudge/i })).toBeInTheDocument();
    expect(screen.queryByText(/common mistake/i)).not.toBeInTheDocument();
  });

  it('lesson has self-check and practice CTA; no score cards or timer', () => {
    navigateToLearn();
    expect(screen.getByTestId('self-check-card')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /practise this skill/i })).toBeInTheDocument();
    expect(screen.queryByText('Completion score preview')).not.toBeInTheDocument();
    expect(screen.queryByText('Game mode')).not.toBeInTheDocument();
  });

  it('locked lessons show the locked view with test-out, not a redirect', () => {
    renderApp(['/learn/3x3-white-cross']);
    expect(screen.getByRole('button', { name: /test out of this lesson/i })).toBeInTheDocument();
  });

  it('video references remain available', () => {
    navigateToLearn();
    expect(screen.getByTestId('video-reference-card')).toBeInTheDocument();
  });
});

describe('Play page — scoring stays here', () => {
  function navigateToPlay() {
    renderApp(['/play/free']);
  }

  it('has 3D cube and game mode controls', () => {
    navigateToPlay();

    expect(screen.getByRole('heading', { name: '3D cube' })).toBeInTheDocument();
    expect(screen.getByText('Game mode')).toBeInTheDocument();
    expect(screen.getByTestId('band-reference-bar')).toBeInTheDocument();
    expect(screen.queryByText(/notation shortcut controls/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /U face/i })).not.toBeInTheDocument();
  });

  it('shows scoring in guided mode', () => {
    renderApp(['/play/coach']);

    expect(screen.getByText('Completion score preview')).toBeInTheDocument();
  });

  it('lets 3x3 learners select a middle row band and turn it as E', () => {
    navigateToPlay();

    fireEvent.click(screen.getByRole('button', { name: /3×3 Classic Cube/i }));
    const referenceBar = within(screen.getByTestId('band-reference-bar'));
    fireEvent.click(referenceBar.getByRole('button', { name: /middle row/i }));
    fireEvent.click(referenceBar.getByRole('button', { name: /turn selected layer clockwise/i }));

    const history = within(screen.getByTestId('move-history'));
    expect(history.getByText('E')).toBeInTheDocument();
  });

  it('trims redo history when a new band move is made after undo', () => {
    navigateToPlay();

    const referenceBar = within(screen.getByTestId('band-reference-bar'));
    fireEvent.click(referenceBar.getByRole('button', { name: /right column/i }));
    fireEvent.click(referenceBar.getByRole('button', { name: /turn selected layer clockwise/i }));
    fireEvent.click(referenceBar.getByRole('button', { name: /top row/i }));
    fireEvent.click(referenceBar.getByRole('button', { name: /turn selected layer clockwise/i }));

    fireEvent.click(screen.getByRole('button', { name: /undo/i }));

    fireEvent.click(referenceBar.getByRole('button', { name: /front layer/i }));
    fireEvent.click(referenceBar.getByRole('button', { name: /turn selected layer clockwise/i }));

    const history = within(screen.getByTestId('move-history'));
    expect(history.getByText('R')).toBeInTheDocument();
    expect(history.getByText('F')).toBeInTheDocument();
    expect(history.queryByText('U')).not.toBeInTheDocument();
  });
});

describe('Routing shell', () => {
  it('shows the progress chip with 0/10 skills initially', () => {
    renderApp();
    expect(screen.getByText('0/10 skills')).toBeInTheDocument();
  });

  it('navigates between sections via topbar links', () => {
    renderApp();
    fireEvent.click(screen.getByRole('link', { name: /learn/i }));
    expect(screen.getAllByText(/2×2 Foundation/i).length).toBeGreaterThan(0);
  });

  it('/learn redirects to the current (first) lesson', () => {
    renderApp(['/learn']);
    expect(screen.getByRole('heading', { name: /orientation and notation/i })).toBeInTheDocument();
  });

  it('unknown lesson ids redirect to the current lesson', () => {
    renderApp(['/learn/not-a-stage']);
    expect(screen.getByRole('heading', { name: /orientation and notation/i })).toBeInTheDocument();
  });

  it('/play redirects to free mode and unknown modes redirect too', () => {
    renderApp(['/play']);
    expect(screen.getByRole('heading', { name: /practise the cube/i })).toBeInTheDocument();
    renderApp(['/play/bogus']);
    expect(screen.getAllByRole('heading', { name: /practise the cube/i }).length).toBeGreaterThan(0);
  });

  it('unknown routes redirect home', () => {
    renderApp(['/nowhere']);
    expect(screen.getAllByText(/agent-supported/i).length).toBeGreaterThanOrEqual(1);
  });
});

describe('Learn journey integration — key, unlock, and chip seams', () => {
  const BAND_LABEL_BY_FACE: Record<string, RegExp> = {
    U: /top row/i, R: /right column/i, F: /front layer/i,
  };

  function performTurn(turn: Turn) {
    const bar = within(screen.getByTestId('band-reference-bar'));
    fireEvent.click(bar.getByRole('button', { name: BAND_LABEL_BY_FACE[turn[0]] }));
    fireEvent.click(bar.getByRole('button', {
      name: turn.endsWith("'") ? /counter-clockwise/i : /turn selected layer clockwise$/i,
    }));
  }

  function completeSequenceChallenge() {
    for (const turn of ['U', 'R', 'F', "F'", "R'", "U'"] as Turn[]) performTurn(turn);
  }

  function answerSelfCheckCorrectly(stageId: string) {
    const stage = getStageById(stageId as Parameters<typeof getStageById>[0])!;
    const check = getSelfCheckById(stage.selfCheckIds[0])!;
    const correct = check.options.find((o) => check.answerIds.includes(o.id))!;
    const card = within(screen.getByTestId('self-check-card'));
    fireEvent.click(card.getByRole('button', { name: correct.label }));
  }

  it('completes lesson 1 via band turns, unlocks lesson 2, and completes lesson 2 via the demo hint path', () => {
    renderApp(['/learn']);

    // Lesson 1 (2x2-orientation): sequence challenge U R F F' R' U'.
    completeSequenceChallenge();
    answerSelfCheckCorrectly('2x2-orientation');

    expect(screen.getByText('1/10 skills')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /lesson complete/i })).toBeInTheDocument();

    const sidebar = within(screen.getByTestId('learn-sidebar'));
    const lesson2Link = sidebar.getByRole('link', { name: /build one complete face/i });
    expect(lesson2Link.className).toContain('unlocked');

    // Navigate to lesson 2 via the sidebar link — pins that LessonView remounts cleanly
    // (a missing `key` would carry over `recordedRef` and break the demo-completion below).
    fireEvent.click(lesson2Link);

    expect(screen.getByText(CHALLENGES['2x2-first-face'].goalText)).toBeInTheDocument();

    // Lesson 2 (2x2-first-face): work down the full hint ladder to the move-by-move demo.
    fireEvent.click(screen.getByRole('button', { name: /stuck\? get a nudge/i }));
    fireEvent.click(screen.getByRole('button', { name: /show me the steps/i }));
    fireEvent.click(screen.getByRole('button', { name: /watch the moves/i }));
    fireEvent.click(screen.getByRole('button', { name: /reset & watch/i }));

    const demoLength = CHALLENGES['2x2-first-face'].setup.length;
    for (let i = 0; i < demoLength; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /next move/i }));
    }
    expect(screen.queryByRole('button', { name: /next move/i })).not.toBeInTheDocument();

    answerSelfCheckCorrectly('2x2-first-face');

    expect(screen.getByText('2/10 skills')).toBeInTheDocument();
    const completionHeading = screen.getByRole('heading', { name: /lesson complete/i });
    const completionSection = completionHeading.closest('section')!;
    // Demo use caps mastery at 1, even though the self-check was passed first try.
    expect(within(completionSection).getByLabelText('Mastery 1 of 3')).toBeInTheDocument();
  });
});
