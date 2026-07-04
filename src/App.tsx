import { BookOpen, Gamepad2, Home } from 'lucide-react';
import { useState } from 'react';
import './styles.css';
import { HomePage } from './components/HomePage';
import { LearnPage } from './components/LearnPage';
import { PracticePage } from './components/PracticePage';

type Page = 'home' | 'learn' | 'play';
type GameMode = 'practice' | 'guided' | 'scan';

function App() {
  const [page, setPage] = useState<Page>('home');
  const [practiceSkillContext, setPracticeSkillContext] = useState<string | undefined>();
  const [practiceMode, setPracticeMode] = useState<GameMode>('practice');

  function goToPractice(stageId?: string, mode: GameMode = 'guided') {
    setPracticeSkillContext(stageId);
    setPracticeMode(mode);
    setPage('play');
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setPage('home')}>Rubik Trainer <span>v0.2.0</span></button>
        <nav aria-label="Primary navigation">
          <button className={page === 'home' ? 'active' : ''} onClick={() => setPage('home')}><Home size={16} /> Home</button>
          <button className={page === 'learn' ? 'active' : ''} onClick={() => setPage('learn')}><BookOpen size={16} /> Learn</button>
          <button className={page === 'play' ? 'active' : ''} onClick={() => setPage('play')}><Gamepad2 size={16} /> Play</button>
        </nav>
      </header>
      {page === 'home' && (
        <HomePage
          onStartPathway={() => setPage('learn')}
          onScanCoach={() => goToPractice(undefined, 'scan')}
          onFreePractice={() => goToPractice(undefined, 'practice')}
        />
      )}
      {page === 'learn' && (
        <LearnPage onPractice={(stageId) => goToPractice(stageId, 'guided')} />
      )}
      {page === 'play' && (
        <PracticePage skillContext={practiceSkillContext} initialMode={practiceMode} />
      )}
    </main>
  );
}

export default App;
