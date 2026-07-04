import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { applyTheme, storeTheme, type ThemePreference } from '../theme';

function currentTheme(): ThemePreference {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === 'light' || explicit === 'dark') return explicit;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Cycles light/dark, persisting the explicit choice so it overrides the
 * system preference from then on (spec §4 / plan Task 3). */
export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>(currentTheme);

  function toggle() {
    const next: ThemePreference = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    storeTheme(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
