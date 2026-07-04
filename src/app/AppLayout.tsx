import { BookOpen, Gamepad2 } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useProgress } from '../progress/ProgressContext';
import { getCompletedCount } from '../progress/unlocks';
import { ThemeToggle } from './ThemeToggle';

export function AppLayout() {
  const snapshot = useProgress();
  const { done, total } = getCompletedCount(snapshot);

  return (
    <div className="shell-root">
      <header className="shell-topbar">
        <NavLink to="/" className="shell-brand">Rubik Trainer</NavLink>
        <nav className="shell-nav" aria-label="Primary navigation">
          <NavLink to="/learn"><BookOpen size={16} /> Learn</NavLink>
          <NavLink to="/play"><Gamepad2 size={16} /> Play</NavLink>
        </nav>
        <span className="progress-chip" title="Skills completed">{done}/{total} skills</span>
        <ThemeToggle />
      </header>
      <Outlet />
    </div>
  );
}
